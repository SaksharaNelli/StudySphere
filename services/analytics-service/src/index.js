require('./env');
const express = require('express');
const { requireAuth } = require('./auth');

const PORT = process.env.PORT || 4007;
const ACADEMIC = process.env.ACADEMIC_URL || 'http://localhost:4002';
const SESSIONS = process.env.SESSION_URL || 'http://localhost:4004';
const app = express();
app.get('/health', (q, r) => r.json({ service: 'analytics-service', status: 'ok' }));

const pad = (n) => String(n).padStart(2, '0');
const fmt = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const back = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return fmt(d); };
const hrs = (m) => Math.round((m / 60) * 10) / 10;

app.get('/overview', requireAuth, async (req, res) => {
  const h = { Authorization: 'Bearer ' + req.token };
  const get = (u) => fetch(u, { headers: h }).then((r) => (r.ok ? r.json() : [])).catch(() => []);
  const [assignments, exams, syllabus, sessions] = await Promise.all([
    get(ACADEMIC + '/assignments'), get(ACADEMIC + '/exams'), get(ACADEMIC + '/syllabus'), get(SESSIONS + '/'),
  ]);
  const todayStr = fmt(new Date());
  const today = new Date(todayStr + 'T00:00:00');
  const daysTo = (s) => Math.round((new Date(s + 'T00:00:00') - today) / 864e5);

  const completed = assignments.filter((a) => a.status === 'completed').length;
  const overdue = assignments.filter((a) => a.status !== 'completed' && daysTo(a.due_date) < 0).length;
  const assignmentStats = { total: assignments.length, completed, overdue, pending: assignments.length - completed - overdue,
    completionRate: assignments.length ? Math.round((completed / assignments.length) * 100) : 0 };

  const minutesOn = {}; sessions.forEach((s) => (minutesOn[s.session_date] = (minutesOn[s.session_date] || 0) + s.minutes));
  const hoursByDay = [...Array(14).keys()].reverse().map((n) => ({ date: back(n), hours: hrs(minutesOn[back(n)] || 0) }));
  const weekMin = [...Array(7).keys()].reduce((a, n) => a + (minutesOn[back(n)] || 0), 0);
  const prevMin = [...Array(7).keys()].reduce((a, n) => a + (minutesOn[back(n + 7)] || 0), 0);

  const bySubject = {}; sessions.forEach((s) => (bySubject[s.subject_id || 0] = (bySubject[s.subject_id || 0] || 0) + s.minutes));
  const subjectProductivity = Object.entries(bySubject).map(([id, m]) => {
    const s = syllabus.find((x) => x.id === +id);
    return { subject: s ? s.name : 'General', color: s ? s.color : '#8E7BFF', hours: hrs(m) };
  }).sort((a, b) => b.hours - a.hours);

  const syllabusProgress = syllabus.map((s) => ({ subject: s.name, color: s.color, percent: s.percent, done: s.done, total: s.total }));
  const pct = (id) => (syllabus.find((s) => s.id === id) || {}).percent || 0;
  const upcoming = exams.filter((e) => daysTo(e.exam_date) >= 0).sort((a, b) => a.exam_date.localeCompare(b.exam_date));
  const examReadiness = upcoming.map((e) => ({ id: e.id, title: e.title, daysLeft: daysTo(e.exam_date), readiness: pct(e.subject_id),
    subject: (syllabus.find((s) => s.id === e.subject_id) || {}).name || '' }));

  const workload = [...Array(7).keys()].map((n) => {
    const d = new Date(today); d.setDate(d.getDate() + n); const ds = fmt(d);
    return { date: ds, label: d.toLocaleDateString('en-US', { weekday: 'short' }),
      assignments: assignments.filter((a) => a.status !== 'completed' && a.due_date === ds).length, exams: exams.filter((e) => e.exam_date === ds).length };
  });

  const insights = [];
  if (overdue) insights.push({ tone: 'bad', title: `${overdue} overdue assignment${overdue > 1 ? 's' : ''}`, text: 'Clear the overdue work first, then return to your plan.' });
  examReadiness.filter((e) => e.daysLeft <= 21 && e.readiness < 60).slice(0, 3).forEach((e) =>
    insights.push({ tone: 'warn', title: `${e.title} needs more preparation`, text: `${e.daysLeft} day(s) left and only ${e.readiness}% of the syllabus is complete.` }));
  const weak = syllabus.filter((s) => s.total > 0).sort((a, b) => a.percent - b.percent)[0];
  if (weak && weak.percent < 100) insights.push({ tone: 'sky', title: `Focus on ${weak.name}`, text: `Your lowest syllabus progress is ${weak.percent}% (${weak.done} of ${weak.total} topics).` });
  const diff = hrs(weekMin) - hrs(prevMin);
  insights.push({ tone: diff >= 0 ? 'ok' : 'warn', title: `You studied ${hrs(weekMin)}h this week`,
    text: prevMin ? `That is ${Math.abs(diff).toFixed(1)}h ${diff >= 0 ? 'more' : 'less'} than last week.` : 'Keep going to build a weekly baseline.' });
  if (!minutesOn[todayStr]) insights.push({ tone: 'sky', title: 'No study logged today', text: 'A single 25-minute focus session keeps your streak alive.' });

  res.json({ assignmentStats, hoursByDay, subjectProductivity, syllabusProgress, examReadiness, workload, insights,
    weekly: { hours: hrs(weekMin), previousHours: hrs(prevMin) } });
});

app.use((err, req, res, next) => { console.error(err); res.status(500).json({ error: err.message || 'Something went wrong' }); });
app.listen(PORT, () => console.log(`analytics-service on :${PORT}`));
