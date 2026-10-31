import { useEffect, useState } from 'react';
import { ListChecks, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { api } from '../api';
import { useFetch } from '../hooks';
import { Card, Empty, ErrorNote, PageHeader, Progress, Spinner, Tick, cx } from '../ui';

function AddInline({ placeholder, onAdd, id }) {
  const [v, setV] = useState('');
  return (
    <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (v.trim()) { onAdd(v.trim()); setV(''); } }}>
      <input id={id} className="input" placeholder={placeholder} value={v} onChange={(e) => setV(e.target.value)} />
      <button className="btn-ghost shrink-0" aria-label="Add"><Plus size={16} /></button>
    </form>
  );
}

export default function Syllabus() {
  const { data, error, reload } = useFetch('/academic/syllabus');
  const [sel, setSel] = useState(null);
  useEffect(() => { if (data?.length && !data.find((s) => s.id === sel)) setSel(data[0].id); }, [data]);
  if (error) return <ErrorNote>{error}</ErrorNote>;
  if (!data) return <Spinner />;
  const s = data.find((x) => x.id === sel);
  const run = async (p, opts) => { await api(p, opts); reload(); };

  return (
    <div>
      <PageHeader title="Syllabus tracker" subtitle="Break each subject into units and topics, then tick them off." />
      {!data.length ? <Empty icon={ListChecks} title="No subjects yet" text="Create a subject first, then build its syllabus here." /> : (
        <>
          <div className="mb-5 flex flex-wrap gap-2">
            {data.map((x) => (
              <button key={x.id} onClick={() => setSel(x.id)} className={cx('flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium', sel === x.id ? 'border-brand bg-brand text-white' : 'border-line bg-surface hover:border-brand')}>
                <span className="h-2 w-2 rounded-full" style={{ background: x.color }} />{x.name}<span className="opacity-70">{x.percent}%</span>
              </button>
            ))}
          </div>
          {s && (
            <>
              <Card className="mb-5 p-5">
                <div className="mb-2 flex items-end justify-between"><h2 className="text-xl font-bold">{s.name}</h2><span className="font-display text-3xl font-bold text-brand">{s.percent}%</span></div>
                <Progress value={s.percent} height="h-3" color={s.color} />
                <p className="mt-2 text-sm text-muted">{s.done} of {s.total} topics completed across {s.units.length} unit{s.units.length === 1 ? '' : 's'}.</p>
              </Card>
              <div className="grid gap-4 lg:grid-cols-2">
                {s.units.map((u) => (
                  <Card key={u.id} className="p-4">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <h3 className="font-semibold">{u.title}</h3>
                      <div className="flex items-center gap-2"><span className="text-xs text-muted">{u.done}/{u.total}</span>
                        <button className="btn-plain !p-1.5 hover:!text-bad" aria-label="Delete unit" onClick={() => window.confirm('Delete this unit and its topics?') && run(`/academic/units/${u.id}`, { method: 'DELETE' })}><Trash2 size={15} /></button></div>
                    </div>
                    <Progress value={u.percent} color={s.color} height="h-1.5" />
                    <ul className="my-3 space-y-1">
                      {u.topics.map((t) => (
                        <li key={t.id} className="flex items-center gap-3 rounded-lg px-1 py-1.5 hover:bg-soft/50">
                          <Tick checked={t.completed} label="Topic completed" onChange={() => run(`/academic/topics/${t.id}`, { method: 'PUT', body: { completed: !t.completed } })} />
                          <span className={cx('flex-1 text-sm', t.completed && 'text-muted line-through')}>{t.title}</span>
                          <button title="Mark as revised" aria-label="Toggle revised" onClick={() => run(`/academic/topics/${t.id}`, { method: 'PUT', body: { revised: !t.revised } })}
                            className={cx('rounded-full p-1', t.revised ? 'bg-ok/15 text-ok' : 'text-muted/60 hover:text-brand')}><RotateCcw size={14} /></button>
                          <button className="text-muted/60 hover:text-bad" aria-label="Delete topic" onClick={() => run(`/academic/topics/${t.id}`, { method: 'DELETE' })}><Trash2 size={14} /></button>
                        </li>
                      ))}
                    </ul>
                    <AddInline placeholder="Add a topic" onAdd={(title) => run('/academic/topics', { method: 'POST', body: { unit_id: u.id, subject_id: s.id, title } })} />
                  </Card>
                ))}
                <Card className="border-dashed p-4">
                  <h3 className="mb-3 font-semibold">New unit</h3>
                  <AddInline id="new-unit" placeholder="Unit name, for example Unit 3: Memory" onAdd={(title) => run('/academic/units', { method: 'POST', body: { subject_id: s.id, title, position: s.units.length } })} />
                </Card>
              </div>
              <p className="mt-4 text-xs text-muted">The circular arrow marks a topic as revised, which builds your revision checklist.</p>
            </>
          )}
        </>
      )}
    </div>
  );
}
