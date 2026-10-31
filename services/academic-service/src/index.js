require('./env');
const express = require('express');
const { init } = require('./db');
const crud = require('./crud');
const { requireAuth } = require('./auth');

const PORT = process.env.PORT || 4002;
const app = express();
app.use(express.json());
app.get('/health', (q, r) => r.json({ service: 'academic-service', status: 'ok' }));

(async () => {
  const pool = await init('studysphere_academic', [
    `CREATE TABLE IF NOT EXISTS subjects (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL, name VARCHAR(120) NOT NULL,
      code VARCHAR(30), teacher VARCHAR(120), color VARCHAR(9) DEFAULT '#6D4AFF', credits INT, description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, INDEX(user_id))`,
    `CREATE TABLE IF NOT EXISTS assignments (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL, subject_id INT, title VARCHAR(200) NOT NULL,
      description TEXT, due_date DATE NOT NULL, priority VARCHAR(10) DEFAULT 'medium', status VARCHAR(20) DEFAULT 'pending',
      attachment_url VARCHAR(500), reminder_at DATETIME, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, INDEX(user_id), INDEX(subject_id))`,
    `CREATE TABLE IF NOT EXISTS exams (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL, subject_id INT, title VARCHAR(200) NOT NULL,
      exam_date DATE NOT NULL, start_time VARCHAR(5), venue VARCHAR(120), preparation_status VARCHAR(20) DEFAULT 'not_started',
      marks_obtained DECIMAL(6,2), max_marks DECIMAL(6,2), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, INDEX(user_id), INDEX(subject_id))`,
    `CREATE TABLE IF NOT EXISTS units (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL, subject_id INT NOT NULL, title VARCHAR(200) NOT NULL,
      position INT DEFAULT 0, INDEX(user_id), INDEX(subject_id))`,
    `CREATE TABLE IF NOT EXISTS topics (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL, unit_id INT NOT NULL, subject_id INT,
      title VARCHAR(200) NOT NULL, completed TINYINT(1) DEFAULT 0, revised TINYINT(1) DEFAULT 0, INDEX(user_id), INDEX(unit_id))`,
    `CREATE TABLE IF NOT EXISTS prep_items (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL, exam_id INT NOT NULL, title VARCHAR(300) NOT NULL,
      kind VARCHAR(15) DEFAULT 'checklist', due_date DATE, done TINYINT(1) DEFAULT 0, INDEX(user_id), INDEX(exam_id))`,
  ]);
  const del = (sql, id, uid) => pool.query(sql, [id, uid]);

  app.get('/syllabus', requireAuth, async (req, res) => {
    const uid = req.user.id;
    const [[subjects], [units], [topics]] = await Promise.all([
      pool.query('SELECT * FROM subjects WHERE user_id=? ORDER BY name', [uid]),
      pool.query('SELECT * FROM units WHERE user_id=? ORDER BY position, id', [uid]),
      pool.query('SELECT * FROM topics WHERE user_id=? ORDER BY id', [uid]),
    ]);
    res.json(subjects.map((s) => {
      const us = units.filter((u) => u.subject_id === s.id).map((u) => {
        const ts = topics.filter((t) => t.unit_id === u.id);
        const done = ts.filter((t) => t.completed).length;
        return { ...u, topics: ts, total: ts.length, done, percent: ts.length ? Math.round((done / ts.length) * 100) : 0 };
      });
      const total = us.reduce((a, u) => a + u.total, 0), done = us.reduce((a, u) => a + u.done, 0);
      return { ...s, units: us, total, done, percent: total ? Math.round((done / total) * 100) : 0 };
    }));
  });

  app.use('/subjects', crud(pool, 'subjects', ['name', 'code', 'teacher', 'color', 'credits', 'description'], {
    required: ['name'], search: ['name', 'code', 'teacher'], order: 'name',
    onDelete: async (p, id, uid) => {
      await p.query('DELETE FROM prep_items WHERE user_id=? AND exam_id IN (SELECT id FROM exams WHERE subject_id=?)', [uid, id]);
      for (const t of ['assignments', 'exams', 'units', 'topics']) await p.query(`DELETE FROM ${t} WHERE subject_id=? AND user_id=?`, [id, uid]);
    },
  }));
  app.use('/assignments', crud(pool, 'assignments',
    ['subject_id', 'title', 'description', 'due_date', 'priority', 'status', 'attachment_url', 'reminder_at'],
    { required: ['title', 'due_date'], filters: ['status', 'priority', 'subject_id'], search: ['title', 'description'], dateField: 'due_date', order: 'due_date, id' }));
  app.use('/exams', crud(pool, 'exams',
    ['subject_id', 'title', 'exam_date', 'start_time', 'venue', 'preparation_status', 'marks_obtained', 'max_marks'],
    { required: ['title', 'exam_date'], filters: ['subject_id', 'preparation_status'], search: ['title', 'venue'], dateField: 'exam_date', order: 'exam_date, id',
      onDelete: (p, id, uid) => del('DELETE FROM prep_items WHERE exam_id=? AND user_id=?', id, uid) }));
  app.use('/units', crud(pool, 'units', ['subject_id', 'title', 'position'], {
    required: ['subject_id', 'title'], filters: ['subject_id'], order: 'position, id',
    onDelete: (p, id, uid) => del('DELETE FROM topics WHERE unit_id=? AND user_id=?', id, uid) }));
  app.use('/topics', crud(pool, 'topics', ['unit_id', 'subject_id', 'title', 'completed', 'revised'], {
    required: ['unit_id', 'title'], filters: ['unit_id', 'subject_id'], search: ['title'], order: 'id' }));
  app.use('/prep', crud(pool, 'prep_items', ['exam_id', 'title', 'kind', 'due_date', 'done'], {
    required: ['exam_id', 'title'], filters: ['exam_id', 'kind'], dateField: 'due_date', order: 'done, due_date, id' }));

  app.use((err, req, res, next) => { console.error(err); res.status(500).json({ error: err.message || 'Something went wrong' }); });
  app.listen(PORT, () => console.log(`academic-service on :${PORT}`));
})();
