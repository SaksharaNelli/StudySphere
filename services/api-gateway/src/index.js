require('./env');
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { createProxyMiddleware } = require('http-proxy-middleware');


const PORT = process.env.GATEWAY_PORT || 8081;
const SECRET = process.env.JWT_SECRET || 'studysphere-dev-secret';
const U = {
  auth: process.env.AUTH_URL || 'http://localhost:4001',
  academic: process.env.ACADEMIC_URL || 'http://localhost:4002',
  planner: process.env.PLANNER_URL || 'http://localhost:4003',
  sessions: process.env.SESSION_URL || 'http://localhost:4004',
  notes: process.env.NOTES_URL || 'http://localhost:4005',
  notifications: process.env.NOTIFICATION_URL || 'http://localhost:4006',
  analytics: process.env.ANALYTICS_URL || 'http://localhost:4007',
  ai: process.env.AI_URL || 'http://localhost:4008',
};
const app = express();
app.use(cors());
app.get('/health', (q, r) => r.json({ service: 'api-gateway', status: 'ok' }));

app.get('/api/health', async (req, res) => {
  const out = {};
  await Promise.all(Object.entries(U).map(async ([k, u]) => {
    try { const r = await fetch(u + '/health', { signal: AbortSignal.timeout(2000) }); out[k] = r.ok ? 'up' : 'down'; } catch { out[k] = 'down'; }
  }));
  res.json(out);
});

// Global search: fans out to the owning services and merges the results.
app.get('/api/search', async (req, res) => {
  const token = (req.headers.authorization || '').slice(7);
  try { jwt.verify(token, SECRET); } catch { return res.status(401).json({ error: 'Please log in to continue' }); }
  const q = String(req.query.q || '').trim();
  if (!q) return res.json({ subjects: [], assignments: [], exams: [], topics: [], notes: [] });
  const want = String(req.query.types || 'subjects,assignments,exams,topics,notes').split(',');
  const targets = { subjects: `${U.academic}/subjects`, assignments: `${U.academic}/assignments`, exams: `${U.academic}/exams`, topics: `${U.academic}/topics`, notes: `${U.notes}/` };
  const out = {};
  await Promise.all(Object.entries(targets).map(async ([k, u]) => {
    if (!want.includes(k)) { out[k] = []; return; }
    try {
      const r = await fetch(`${u}?q=${encodeURIComponent(q)}`, { headers: { Authorization: 'Bearer ' + token } });
      out[k] = r.ok ? await r.json() : [];
    } catch { out[k] = []; }
  }));
  res.json(out);
});

const routes = { '/api/auth': U.auth, '/api/academic': U.academic, '/api/planner': U.planner, '/api/sessions': U.sessions,
  '/api/notes': U.notes, '/api/notifications': U.notifications, '/api/analytics': U.analytics, '/api/ai': U.ai };
for (const [path, target] of Object.entries(routes)) {
  app.use(path, createProxyMiddleware({
    target, changeOrigin: true, pathRewrite: (p) => { const r = p.startsWith(path) ? p.slice(path.length) : p; return r.startsWith('/') ? r : '/' + r; },
    on: { error: (err, req, res) => res.writeHead && res.writeHead(502, { 'Content-Type': 'application/json' }).end(JSON.stringify({ error: 'This service is not reachable right now. Check that it is running.' })) },
  }));
}
app.listen(PORT, () => console.log(`api-gateway on :${PORT}`));
