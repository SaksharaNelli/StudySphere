require('./env');
const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'studysphere-dev-secret';

function requireAuth(req, res, next) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Please log in to continue' });
  try {
    req.user = jwt.verify(token, SECRET);
    req.token = token;
    next();
  } catch {
    res.status(401).json({ error: 'Your session has expired. Please log in again' });
  }
}
module.exports = { requireAuth, SECRET };
