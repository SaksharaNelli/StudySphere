require('./env');
const express = require('express');
const { init } = require('./db');
const crud = require('./crud');
const { requireAuth } = require('./auth');

const PORT = process.env.PORT || 4003;
const ACADEMIC = process.env.ACADEMIC_URL || 'http://localhost:4002';
const app = express();
app.use(express.json());
app.get('/health', (q, r) => r.json({ service: 'planner-service', status: 'ok' }));

const pad = (n) => String(n).padStart(2, '0');
const fmt = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

(async () => {
  const pool = await init('studysphere_planner', [
    `CREATE TABLE IF NOT EXISTS study_plans (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL, title VARCHAR(200) NOT NULL, subject_id INT,
      topic VARCHAR(200), plan_date DATE NOT NULL, start_time VARCHAR(5), duration_min INT DEFAULT 45, status VARCHAR(10) DEFAULT 'planned',
      source VARCHAR(10) DEFAULT 'manual', INDEX(user_id), INDEX(plan_date))`,
    `CREATE TABLE IF NOT EXISTS goals (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL, title VARCHAR(200) NOT NULL,
      goal_date DATE NOT NULL, done TINYINT(1) DEFAULT 0, INDEX(user_id), INDEX(goal_date))`,
  ]);

  // Smart planner: scores subjects by exam proximity, assignment urgency and unfinished syllabus, then fills each day with 45-minute blocks.
  app.post('/smart-plan', requireAuth, async (req, res) => {
    const days = Math.min(Math.max(+req.body.days || 7, 1), 14);
    const perDay = Math.min(Math.max(+req.body.hours_per_day || 3, 1), 10) * 60;
    const startAt = req.body.start_time || '17:00';
    const get = (p) => fetch(ACADEMIC + p, { headers: { Authorization: 'Bearer ' + req.token } }).then((r) => r.json());
    const [exams, assignments, syllabus] = await Promise.all([get('/exams'), get('/assignments'), get('/syllabus')]);
    if (!syllabus.length) return res.status(400).json({ error: 'Add at least one subject before generating a plan' });

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const daysTo = (s) => Math.round((new Date(s + 'T00:00:00') - today) / 864e5);
    const score = {}; syllabus.forEach((s) => (score[s.id] = 0.3 + (s.total ? (100 - s.percent) / 50 : 0)));
    exams.filter((e) => score[e.subject_id] !== undefined && daysTo(e.exam_date) >= 0).forEach((e) => (score[e.subject_id] += 40 / (daysTo(e.exam_date) + 2)));
    assignments.filter((a) => score[a.subject_id] !== undefined && a.status !== 'completed' && daysTo(a.due_date) >= 0)
      .forEach((a) => (score[a.subject_id] += (({ high: 3, medium: 2, low: 1 })[a.priority] || 2) * 4 / (daysTo(a.due_date) + 2)));

    const ranked = syllabus.filter((s) => s.id in score).sort((a, b) => score[b.id] - score[a.id]).slice(0, 5);
    const queue = Object.fromEntries(ranked.map((s) => [s.id, s.units.flatMap((u) => u.topics).filter((t) => !t.completed).map((t) => t.title)]));
    const pointer = {}; const BLOCK = 45, GAP = 10;
    const rows = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(today); d.setDate(d.getDate() + i);
      const given = {}; let [h, m] = startAt.split(':').map(Number); let t = h * 60 + m;
      for (let b = 0; b < Math.floor(perDay / BLOCK); b++) {
        const s = ranked.reduce((best, c) => (score[c.id] / ((given[c.id] || 0) + 1) > score[best.id] / ((given[best.id] || 0) + 1) ? c : best), ranked[0]);
        given[s.id] = (given[s.id] || 0) + 1;
        const q = queue[s.id]; const topic = q.length ? q[(pointer[s.id] = (pointer[s.id] || 0)) % q.length] : 'Revision and practice';
        pointer[s.id] = (pointer[s.id] || 0) + 1;
        rows.push([req.user.id, `${s.name}: ${topic}`, s.id, topic, fmt(d), `${pad(Math.floor(t / 60) % 24)}:${pad(t % 60)}`, BLOCK, 'planned', 'smart']);
        t += BLOCK + GAP;
      }
    }
    await pool.query("DELETE FROM study_plans WHERE user_id=? AND source='smart' AND status='planned' AND plan_date>=?", [req.user.id, fmt(today)]);
    if (rows.length) await pool.query('INSERT INTO study_plans (user_id,title,subject_id,topic,plan_date,start_time,duration_min,status,source) VALUES ?', [rows]);
    res.json({ created: rows.length, subjects: ranked.map((s) => s.name) });
  });

  app.use('/plans', crud(pool, 'study_plans', ['title', 'subject_id', 'topic', 'plan_date', 'start_time', 'duration_min', 'status', 'source'],
    { required: ['title', 'plan_date'], filters: ['plan_date', 'status', 'subject_id'], dateField: 'plan_date', order: 'plan_date, start_time, id' }));
  app.use('/goals', crud(pool, 'goals', ['title', 'goal_date', 'done'],
    { required: ['title', 'goal_date'], filters: ['goal_date', 'done'], dateField: 'goal_date', order: 'done, id' }));

  app.use((err, req, res, next) => { console.error(err); res.status(500).json({ error: err.message || 'Something went wrong' }); });
  app.listen(PORT, () => console.log(`planner-service on :${PORT}`));
})();
