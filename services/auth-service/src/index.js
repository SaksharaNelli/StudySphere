require('./env');
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { init } = require('./db');
const { requireAuth, SECRET } = require('./auth');

const PORT = process.env.PORT || 4001;
const DEFAULT_SETTINGS = {
  focus_minutes: 25, break_minutes: 5, long_break_minutes: 15, daily_goal_minutes: 120,
  notify_assignments: true, notify_exams: true, notify_sessions: true, notify_goals: true,
};
const app = express();
app.use(express.json());
app.get('/health', (q, r) => r.json({ service: 'auth-service', status: 'ok' }));

const toUser = (u) => {
  const { password_hash, ...rest } = u;
  if (typeof rest.settings === 'string') { try { rest.settings = JSON.parse(rest.settings); } catch { rest.settings = {}; } }
  rest.settings = { ...DEFAULT_SETTINGS, ...(rest.settings || {}) };
  return rest;
};
const sign = (u) => jwt.sign({ id: u.id, email: u.email, name: u.name }, SECRET, { expiresIn: '7d' });

(async () => {
  const pool = await init('studysphere_auth', [
    `CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(120) NOT NULL, email VARCHAR(160) NOT NULL UNIQUE,
      password_hash VARCHAR(100) NOT NULL, college VARCHAR(160), department VARCHAR(120), semester VARCHAR(20),
      academic_year VARCHAR(20), theme VARCHAR(10) DEFAULT 'light', settings JSON,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`,
  ]);
  const byId = async (id) => (await pool.query('SELECT * FROM users WHERE id=?', [id]))[0][0];

  app.post('/register', async (req, res) => {
    const { name, email, password, college, department, semester, academic_year } = req.body || {};
    if (!name || name.trim().length < 2) return res.status(400).json({ error: 'Enter your full name' });
    if (!/^\S+@\S+\.\S+$/.test(email || '')) return res.status(400).json({ error: 'Enter a valid email address' });
    if (!password || password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
    const mail = email.toLowerCase();
    const [ex] = await pool.query('SELECT id FROM users WHERE email=?', [mail]);
    if (ex.length) return res.status(409).json({ error: 'An account with this email already exists' });
    const [ins] = await pool.query('INSERT INTO users SET ?', {
      name: name.trim(), email: mail, password_hash: await bcrypt.hash(password, 10),
      college: college || null, department: department || null, semester: semester || null,
      academic_year: academic_year || null, settings: JSON.stringify(DEFAULT_SETTINGS),
    });
    const u = await byId(ins.insertId);
    res.status(201).json({ token: sign(u), user: toUser(u) });
  });

  app.post('/login', async (req, res) => {
    const { email, password } = req.body || {};
    const [rows] = await pool.query('SELECT * FROM users WHERE email=?', [(email || '').toLowerCase()]);
    const u = rows[0];
    if (!u || !(await bcrypt.compare(password || '', u.password_hash)))
      return res.status(401).json({ error: 'Incorrect email or password' });
    res.json({ token: sign(u), user: toUser(u) });
  });

  app.post('/logout', requireAuth, (req, res) => res.json({ ok: true })); // stateless JWT: client discards the token

  app.get('/me', requireAuth, async (req, res) => {
    const u = await byId(req.user.id);
    if (!u) return res.status(404).json({ error: 'Account not found' });
    res.json({ user: toUser(u) });
  });

  app.put('/me', requireAuth, async (req, res) => {
    const b = req.body || {};
    const d = {};
    for (const f of ['name', 'college', 'department', 'semester', 'academic_year', 'theme']) if (b[f] !== undefined) d[f] = b[f] === '' ? null : b[f];
    if (d.name !== undefined && (!d.name || d.name.length < 2)) return res.status(400).json({ error: 'Enter your full name' });
    if (b.settings) d.settings = JSON.stringify({ ...DEFAULT_SETTINGS, ...b.settings });
    if (b.new_password) {
      const u = await byId(req.user.id);
      if (!(await bcrypt.compare(b.current_password || '', u.password_hash))) return res.status(400).json({ error: 'Current password is incorrect' });
      if (b.new_password.length < 6) return res.status(400).json({ error: 'New password must be at least 6 characters' });
      d.password_hash = await bcrypt.hash(b.new_password, 10);
    }
    if (Object.keys(d).length) await pool.query('UPDATE users SET ? WHERE id=?', [d, req.user.id]);
    res.json({ user: toUser(await byId(req.user.id)) });
  });

  app.use((err, req, res, next) => { console.error(err); res.status(500).json({ error: err.message || 'Something went wrong' }); });
  app.listen(PORT, () => console.log(`auth-service on :${PORT}`));
})();
