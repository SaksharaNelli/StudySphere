require('./env');
const express = require('express');
const { init } = require('./db');
const crud = require('./crud');

const PORT = process.env.PORT || 4005;
const app = express();
app.use(express.json());
app.get('/health', (q, r) => r.json({ service: 'notes-service', status: 'ok' }));

(async () => {
  const pool = await init('studysphere_notes', [
    `CREATE TABLE IF NOT EXISTS notes (id INT AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL, subject_id INT, title VARCHAR(200) NOT NULL,
      content TEXT, category VARCHAR(15) DEFAULT 'note', pinned TINYINT(1) DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, INDEX(user_id))`,
  ]);
  app.use('/', crud(pool, 'notes', ['subject_id', 'title', 'content', 'category', 'pinned'],
    { required: ['title'], filters: ['subject_id', 'category'], search: ['title', 'content'], order: 'pinned DESC, updated_at DESC' }));
  app.use((err, req, res, next) => { console.error(err); res.status(500).json({ error: err.message || 'Something went wrong' }); });
  app.listen(PORT, () => console.log(`notes-service on :${PORT}`));
})();
