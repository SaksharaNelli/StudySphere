import { useEffect, useState } from 'react';
import { Plus, Target, Trash2 } from 'lucide-react';
import { api } from '../api';
import { useFetch } from '../hooks';
import { daysLeft, fmtDate, today } from '../lib';
import { Card, Empty, ErrorNote, PageHeader, Progress, Spinner, Tick, cx } from '../ui';

const KINDS = [
  ['checklist', 'Preparation checklist', 'Add a task, for example Finish unit 2 notes'],
  ['revision', 'Revision schedule', 'Add a revision slot, for example Revise normalization'],
  ['practice', 'Practice questions', 'Add a question to practise'],
];

export default function Preparation() {
  const { data: exams, error } = useFetch('/academic/exams');
  const { data: syl } = useFetch('/academic/syllabus');
  const [sel, setSel] = useState(null);
  const [items, setItems] = useState([]);
  const [draft, setDraft] = useState({});
  const upcoming = (exams || []).filter((e) => daysLeft(e.exam_date) >= 0);
  useEffect(() => { if (!sel && upcoming.length) setSel(upcoming[0].id); }, [exams]);
  const load = () => sel && api(`/academic/prep?exam_id=${sel}`).then(setItems);
  useEffect(() => { load(); }, [sel]);

  if (error) return <ErrorNote>{error}</ErrorNote>;
  if (!exams) return <Spinner />;
  const exam = upcoming.find((e) => e.id === sel);
  const checklist = items.filter((i) => i.kind !== 'practice');
  const subj = (syl || []).find((s) => s.id === exam?.subject_id);
  const parts = [];
  if (subj?.total) parts.push(subj.percent);
  if (items.length) parts.push(Math.round((items.filter((i) => i.done).length / items.length) * 100));
  const readiness = parts.length ? Math.round(parts.reduce((a, b) => a + b, 0) / parts.length) : 0;

  const add = async (kind) => {
    const d = draft[kind] || {};
    if (!d.title?.trim()) return;
    await api('/academic/prep', { method: 'POST', body: { exam_id: sel, kind, title: d.title.trim(), due_date: kind === 'revision' ? d.date || today() : null } });
    setDraft({ ...draft, [kind]: {} }); load();
  };
  return (
    <div>
      <PageHeader title="Exam preparation" subtitle="Checklists, revision slots and practice questions for each upcoming exam." />
      {!upcoming.length ? <Empty icon={Target} title="No upcoming exams" text="Add an exam on the Examinations page to start preparing." /> : (
        <>
          <div className="mb-5 flex flex-wrap gap-2">
            {upcoming.map((e) => (
              <button key={e.id} onClick={() => setSel(e.id)} className={cx('rounded-full border px-3.5 py-1.5 text-sm font-medium', sel === e.id ? 'border-brand bg-brand text-white' : 'border-line bg-surface hover:border-brand')}>
                {e.title}<span className="ml-2 opacity-70">{daysLeft(e.exam_date)}d</span></button>
            ))}
          </div>
          {exam && (
            <>
              <Card className="mb-5 p-5">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div><h2 className="text-xl font-bold">{exam.title}</h2><p className="text-sm text-muted">{fmtDate(exam.exam_date)}, {daysLeft(exam.exam_date)} days left</p></div>
                  <div className="text-right"><div className="text-xs text-muted">Readiness</div><div className="font-display text-3xl font-bold text-brand">{readiness}%</div></div>
                </div>
                <div className="mt-3"><Progress value={readiness} height="h-3" /></div>
                <p className="mt-2 text-xs text-muted">Combines syllabus completion{subj ? ` for ${subj.name}` : ''} with finished preparation tasks.</p>
              </Card>
              <div className="grid gap-4 lg:grid-cols-3">
                {KINDS.map(([kind, label, ph]) => (
                  <Card key={kind} className="flex flex-col p-4">
                    <h3 className="mb-3 font-semibold">{label}</h3>
                    <ul className="mb-3 flex-1 space-y-1">
                      {items.filter((i) => i.kind === kind).map((i) => (
                        <li key={i.id} className="flex items-start gap-3 rounded-lg px-1 py-1.5 hover:bg-soft/50">
                          <Tick checked={i.done} onChange={async () => { await api(`/academic/prep/${i.id}`, { method: 'PUT', body: { done: !i.done } }); load(); }} />
                          <div className="flex-1"><div className={cx('text-sm', i.done && 'text-muted line-through')}>{i.title}</div>{i.due_date && <div className="text-xs text-muted">{fmtDate(i.due_date)}</div>}</div>
                          <button className="text-muted/60 hover:text-bad" aria-label="Delete" onClick={async () => { await api(`/academic/prep/${i.id}`, { method: 'DELETE' }); load(); }}><Trash2 size={14} /></button>
                        </li>
                      ))}
                      {!items.some((i) => i.kind === kind) && <li className="text-sm text-muted">Nothing here yet.</li>}
                    </ul>
                    <form className="space-y-2" onSubmit={(e) => { e.preventDefault(); add(kind); }}>
                      <input className="input" placeholder={ph} value={draft[kind]?.title || ''} onChange={(e) => setDraft({ ...draft, [kind]: { ...draft[kind], title: e.target.value } })} />
                      {kind === 'revision' && <input className="input" type="date" value={draft[kind]?.date || today()} onChange={(e) => setDraft({ ...draft, [kind]: { ...draft[kind], date: e.target.value } })} />}
                      <button className="btn-ghost w-full"><Plus size={16} />Add</button>
                    </form>
                  </Card>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
