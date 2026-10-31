const express = require('express');
const { requireAuth } = require('./auth');

// Generic user-scoped CRUD router: every query is filtered by the logged-in user's id.
module.exports = function crud(pool, table, fields, opts = {}) {
  const r = express.Router();
  r.use(requireAuth);
  const pick = (b = {}) => {
    const o = {};
    for (const f of fields) if (b[f] !== undefined) o[f] = b[f] === '' ? null : b[f];
    return o;
  };
  const one = async (id, uid) => (await pool.query(`SELECT * FROM ${table} WHERE id=? AND user_id=?`, [id, uid]))[0][0];

  r.get('/', async (req, res) => {
    const where = ['user_id=?'], args = [req.user.id];
    for (const f of opts.filters || [])
      if (req.query[f] !== undefined && req.query[f] !== '') { where.push(`${f}=?`); args.push(req.query[f]); }
    if (opts.dateField) {
      if (req.query.from) { where.push(`${opts.dateField}>=?`); args.push(req.query.from); }
      if (req.query.to) { where.push(`${opts.dateField}<=?`); args.push(req.query.to); }
    }
    if (req.query.q && opts.search) {
      where.push('(' + opts.search.map((f) => `${f} LIKE ?`).join(' OR ') + ')');
      opts.search.forEach(() => args.push(`%${req.query.q}%`));
    }
    const [rows] = await pool.query(`SELECT * FROM ${table} WHERE ${where.join(' AND ')} ORDER BY ${opts.order || 'id DESC'}`, args);
    res.json(rows);
  });

  r.post('/', async (req, res) => {
    const d = pick(req.body);
    for (const f of opts.required || []) if (d[f] == null) return res.status(400).json({ error: `${f.replace(/_/g, ' ')} is required` });
    d.user_id = req.user.id;
    const [ins] = await pool.query(`INSERT INTO ${table} SET ?`, d);
    res.status(201).json(await one(ins.insertId, req.user.id));
  });

  r.put('/:id', async (req, res) => {
    if (!(await one(req.params.id, req.user.id))) return res.status(404).json({ error: 'Not found' });
    const d = pick(req.body);
    if (Object.keys(d).length) await pool.query(`UPDATE ${table} SET ? WHERE id=? AND user_id=?`, [d, req.params.id, req.user.id]);
    res.json(await one(req.params.id, req.user.id));
  });

  r.delete('/:id', async (req, res) => {
    if (!(await one(req.params.id, req.user.id))) return res.status(404).json({ error: 'Not found' });
    if (opts.onDelete) await opts.onDelete(pool, req.params.id, req.user.id);
    await pool.query(`DELETE FROM ${table} WHERE id=? AND user_id=?`, [req.params.id, req.user.id]);
    res.json({ ok: true });
  });
  return r;
};
