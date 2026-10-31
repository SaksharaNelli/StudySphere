// Loads realistic demo data through the gateway. Run after `npm run dev` is up: npm run seed
const API = process.env.API || 'http://localhost:8080/api';
const call = async (p, method = 'GET', body, token) => {
  const r = await fetch(API + p, { method, headers: { 'Content-Type': 'application/json', ...(token && { Authorization: 'Bearer ' + token }) }, body: body && JSON.stringify(body) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`${p}: ${j.error || r.status}`);
  return j;
};
const pad = (n) => String(n).padStart(2, '0');
const d = (n) => { const x = new Date(); x.setDate(x.getDate() + n); return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`; };

(async () => {
  const creds = { email: 'demo@studysphere.dev', password: 'demo1234' };
  let auth;
  try { auth = await call('/auth/login', 'POST', creds); }
  catch { auth = await call('/auth/register', 'POST', { name: 'Demo Student', ...creds, college: 'Sample Institute of Technology', department: 'Computer Science', semester: '5', academic_year: '2026-27' }); }
  const t = auth.token;
  if ((await call('/academic/subjects', 'GET', null, t)).length) return console.log('Demo data already present. Login: demo@studysphere.dev / demo1234');

  const subjectDefs = [
    ['Database Management Systems', 'CS501', 'Dr. Rao', '#6D4AFF', ['Relational Model', ['ER Diagrams', true], ['Keys and Constraints', true], 'Relational Algebra'], ['Normalization', ['Functional Dependencies', true], '1NF to BCNF', 'Transactions']],
    ['Operating Systems', 'CS502', 'Prof. Mehta', '#5B9DFF', ['Processes', ['Process States', true], 'Scheduling', 'Synchronization'], ['Memory', 'Paging', 'Virtual Memory']],
    ['Computer Networks', 'CS503', 'Dr. Iyer', '#14A3B8', ['Network Layers', ['OSI vs TCP/IP', true], 'Routing'], ['Transport', 'TCP Congestion Control', 'UDP']],
    ['Discrete Mathematics', 'MA504', 'Prof. Nair', '#8E7BFF', ['Logic', ['Propositions', true], ['Proof Techniques', true]], ['Graph Theory', 'Trees', 'Graph Coloring']],
  ];
  const subjects = [];
  for (const [name, code, teacher, color, ...units] of subjectDefs) {
    const s = await call('/academic/subjects', 'POST', { name, code, teacher, color, credits: 4 }, t); subjects.push(s);
    for (const [i, [title, ...topics]] of units.entries()) {
      const u = await call('/academic/units', 'POST', { subject_id: s.id, title, position: i }, t);
      for (const tp of topics) { const [tt, done] = Array.isArray(tp) ? tp : [tp, false]; await call('/academic/topics', 'POST', { unit_id: u.id, subject_id: s.id, title: tt, completed: !!done }, t); }
    }
  }
  const A = [[0, 'ER diagram case study', 2, 'high', 'pending'], [1, 'CPU scheduling simulator', 5, 'high', 'in_progress'], [2, 'Subnetting worksheet', 1, 'medium', 'pending'],
    [3, 'Graph theory problem set', 9, 'low', 'pending'], [0, 'SQL practice lab', -2, 'medium', 'pending'], [1, 'Deadlock report', -6, 'low', 'completed']];
  for (const [i, title, due, priority, status] of A) await call('/academic/assignments', 'POST', { subject_id: subjects[i].id, title, due_date: d(due), priority, status, description: 'Submit through the department portal.' }, t);
  const E = [[0, 'DBMS Mid-term', 6, 'Hall A', 'in_progress'], [1, 'OS Unit Test', 12, 'Room 204', 'not_started'], [2, 'CN Quiz', 18, 'Lab 3', 'not_started'], [3, 'Maths Internal 1', -10, 'Hall B', 'ready', 42, 50]];
  for (const [i, title, due, venue, preparation_status, marks_obtained, max_marks] of E) {
    const e = await call('/academic/exams', 'POST', { subject_id: subjects[i].id, title, exam_date: d(due), start_time: '10:00', venue, preparation_status, marks_obtained, max_marks }, t);
    if (due > 0) {
      await call('/academic/prep', 'POST', { exam_id: e.id, title: 'Finish all unit notes', kind: 'checklist', done: true }, t);
      await call('/academic/prep', 'POST', { exam_id: e.id, title: 'Solve previous-year papers', kind: 'checklist' }, t);
      await call('/academic/prep', 'POST', { exam_id: e.id, title: 'Revise important formulas', kind: 'revision', due_date: d(due - 2) }, t);
      await call('/academic/prep', 'POST', { exam_id: e.id, title: 'Explain the main concepts without notes.', kind: 'practice' }, t);
    }
  }
  await call('/planner/smart-plan', 'POST', { days: 5, hours_per_day: 3 }, t);
  for (const g of ['Finish 2 DBMS topics', 'Solve 10 SQL queries', 'Revise OS scheduling']) await call('/planner/goals', 'POST', { title: g, goal_date: d(0), done: g.startsWith('Solve') }, t);
  for (const [n, min] of [[8, 50], [7, 75], [5, 90], [4, 60], [3, 120], [2, 45], [1, 80], [0, 50]])
    await call('/sessions', 'POST', { subject_id: subjects[n % 4].id, topic: 'Focused study', minutes: min, session_date: d(-n), mode: 'focus' }, t);
  await call('/notes', 'POST', { subject_id: subjects[0].id, title: 'Normal forms cheat sheet', category: 'revision', pinned: true, content: '1NF: atomic values. 2NF: no partial dependency. 3NF: no transitive dependency. BCNF: every determinant is a candidate key.' }, t);
  await call('/notes', 'POST', { subject_id: subjects[1].id, title: 'Scheduling formulas', category: 'formula', content: 'Turnaround = Completion - Arrival. Waiting = Turnaround - Burst.' }, t);
  await call('/notes', 'POST', { subject_id: subjects[2].id, title: 'TCP three-way handshake', category: 'concept', content: 'SYN, SYN-ACK, ACK establishes a reliable connection before data transfer.' }, t);
  console.log('Demo data loaded. Login: demo@studysphere.dev / demo1234');
})().catch((e) => { console.error('Seed failed:', e.message, '\nIs `npm run dev` running?'); process.exit(1); });
