require('./env');
const express = require('express');
const { init } = require('./db');
const crud = require('./crud');
const { requireAuth } = require('./auth');

const PORT = process.env.PORT || 4006;
const ACADEMIC = process.env.ACADEMIC_URL || 'http://localhost:4002';
const PLANNER = process.env.PLANNER_URL || 'http://localhost:4003';
const AUTH = process.env.AUTH_URL || 'http://localhost:4001';
const app = express();
app.use(express.json());
app.get('/health', (q, r) => r.json({ service: 'notification-service', status: 'ok' }));

const pad = (n) => String(n).padStart(2, '0');
const fmt = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const when = (d) => (d === 0 ? 'today' : d === 1 ? 'tomorrow' : `in ${d} days`);
const PREF = { assignment: 'notify_assignments', exam: 'notify_exams', session: 'notify_sessions', goal: 'notify_goals' };

(async () => {
  const pool = await init('studysphere_notifications', [
    `CREATE TABLE IF NOT EXISTS notifications (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL, title VARCHAR(160) NOT NULL,
      message VARCHAR(400), type VARCHAR(15) DEFAULT 'info', ref_id INT, is_read TINYINT(1) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, INDEX(user_id))`,
  ]);

  // Builds today's reminders from other services (deduplicated per day) and respects the user's notification settings.
  app.post('/generate', requireAuth, async (req, res) => {
    const h = { Authorization: 'Bearer ' + req.token };
    const get = (u, fb = []) => fetch(u, { headers: h }).then((r) => (r.ok ? r.json() : fb)).catch(() => fb);
    const todayStr = fmt(new Date());
    const today = new Date(todayStr + 'T00:00:00');
    const daysTo = (s) => Math.round((new Date(s + 'T00:00:00') - today) / 864e5);
    const [me, assignments, exams, goals, plans] = await Promise.all([
      get(AUTH + '/me', {}), get(ACADEMIC + '/assignments'), get(ACADEMIC + '/exams'),
      get(`${PLANNER}/goals?goal_date=${todayStr}`), get(`${PLANNER}/plans?plan_date=${todayStr}`),
    ]);
    const pref = me.user?.settings || {};
    const items = [];
    assignments.filter((a) => a.status !== 'completed').forEach((a) => {
      const d = daysTo(a.due_date);
      if (d < 0) items.push({ type: 'assignment', ref_id: a.id, title: 'Assignment overdue', message: `${a.title} was due ${-d} day(s) ago` });
      else if (d <= 3) items.push({ type: 'assignment', ref_id: a.id, title: 'Assignment due soon', message: `${a.title} is due ${when(d)}` });
      else if (a.reminder_at && new Date(a.reminder_at.replace(' ', 'T')) <= new Date())
        items.push({ type: 'assignment', ref_id: a.id, title: 'Reminder', message: `${a.title} is due ${when(d)}` });
    });
    exams.forEach((e) => { const d = daysTo(e.exam_date); if (d >= 0 && d <= 7) items.push({ type: 'exam', ref_id: e.id, title: 'Exam coming up', message: `${e.title} is ${when(d)}` }); });
    goals.filter((g) => !g.done).forEach((g) => items.push({ type: 'goal', ref_id: g.id, title: 'Daily goal pending', message: g.title }));
    plans.filter((p) => p.status !== 'done').forEach((p) => items.push({ type: 'session', ref_id: p.id, title: 'Study session today', message: `${p.title}${p.start_time ? ' at ' + p.start_time : ''}` }));

    let created = 0;
    for (const it of items) {
      if (pref[PREF[it.type]] === false) continue;
      const [ex] = await pool.query('SELECT id FROM notifications WHERE user_id=? AND type=? AND ref_id=? AND DATE(created_at)=CURDATE()', [req.user.id, it.type, it.ref_id]);
      if (!ex.length) { await pool.query('INSERT INTO notifications SET ?', { user_id: req.user.id, ...it }); created++; }
    }
    res.json({ created });
  });

  app.post('/read-all', requireAuth, async (req, res) => {
    await pool.query('UPDATE notifications SET is_read=1 WHERE user_id=?', [req.user.id]);
    res.json({ ok: true });
  });

  app.use('/', crud(pool, 'notifications', ['title', 'message', 'type', 'ref_id', 'is_read'],
    { required: ['title'], filters: ['type', 'is_read'], order: 'is_read, created_at DESC, id DESC' }));
  app.use((err, req, res, next) => { console.error(err); res.status(500).json({ error: err.message || 'Something went wrong' }); });
  app.listen(PORT, () => console.log(`notification-service on :${PORT}`));
})();
