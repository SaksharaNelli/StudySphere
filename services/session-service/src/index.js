require('./env');
const express = require('express');
const { init } = require('./db');
const crud = require('./crud');
const { requireAuth } = require('./auth');

const PORT = process.env.PORT || 4004;
const app = express();
app.use(express.json());
app.get('/health', (q, r) => r.json({ service: 'session-service', status: 'ok' }));

const pad = (n) => String(n).padStart(2, '0');
const fmt = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

(async () => {
  const pool = await init('studysphere_sessions', [
    `CREATE TABLE IF NOT EXISTS sessions (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL, subject_id INT, topic VARCHAR(200),
      minutes INT NOT NULL, session_date DATE NOT NULL, mode VARCHAR(10) DEFAULT 'manual', note VARCHAR(300),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, INDEX(user_id), INDEX(session_date))`,
  ]);

  app.get('/stats', requireAuth, async (req, res) => {
    const [rows] = await pool.query('SELECT session_date d, SUM(minutes) m FROM sessions WHERE user_id=? GROUP BY session_date ORDER BY session_date', [req.user.id]);
    const map = Object.fromEntries(rows.map((r) => [r.d, +r.m]));
    const now = new Date();
    let cur = 0; const c = new Date(now);
    if (!map[fmt(c)]) c.setDate(c.getDate() - 1);
    while (map[fmt(c)]) { cur++; c.setDate(c.getDate() - 1); }
    let longest = 0, run = 0, prev = null;
    for (const r of rows) {
      const dt = new Date(r.d + 'T00:00:00');
      run = prev && Math.round((dt - prev) / 864e5) === 1 ? run + 1 : 1;
      longest = Math.max(longest, run); prev = dt;
    }
    const back = (n) => { const x = new Date(now); x.setDate(x.getDate() - n); return fmt(x); };
    const last7 = [6, 5, 4, 3, 2, 1, 0].map((n) => ({ date: back(n), minutes: map[back(n)] || 0 }));
    const days30 = [...Array(30).keys()].filter((n) => map[back(n)]).length;
    res.json({
      totalMinutes: rows.reduce((a, r) => a + +r.m, 0), todayMinutes: map[fmt(now)] || 0,
      currentStreak: cur, longestStreak: longest, consistency: Math.round((days30 / 30) * 100), last7,
    });
  });

  app.use('/', crud(pool, 'sessions', ['subject_id', 'topic', 'minutes', 'session_date', 'mode', 'note'],
    { required: ['minutes', 'session_date'], filters: ['subject_id', 'mode', 'session_date'], search: ['topic', 'note'], dateField: 'session_date', order: 'session_date DESC, id DESC' }));

  app.use((err, req, res, next) => { console.error(err); res.status(500).json({ error: err.message || 'Something went wrong' }); });
  app.listen(PORT, () => console.log(`session-service on :${PORT}`));
})();
