import { useState } from 'react';
import { CalendarClock, Play, Wand2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import CrudPage from '../CrudPage';
import { api } from '../api';
import { fmtLong, today } from '../lib';
import { Badge, Card, ErrorNote, ItemActions, SubjectChip, Tick, cx } from '../ui';

const FIELDS = [
  { name: 'title', label: 'Session title', required: true },
  { name: 'subject_id', label: 'Subject', type: 'select', ref: 'subjects' },
  { name: 'topic', label: 'Topic' },
  { name: 'plan_date', label: 'Date', type: 'date', required: true },
  { name: 'start_time', label: 'Start time', type: 'time', default: '17:00' },
  { name: 'duration_min', label: 'Duration (minutes)', type: 'number', default: 45 },
];

export default function Planner() {
  const [days, setDays] = useState(7);
  const [hours, setHours] = useState(3);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ err: '', ok: '' });
  const [tick, setTick] = useState(0);
  const generate = async () => {
    setBusy(true); setMsg({ err: '', ok: '' });
    try {
      const r = await api('/planner/smart-plan', { method: 'POST', body: { days, hours_per_day: hours } });
      setMsg({ err: '', ok: `Added ${r.created} study blocks across ${r.subjects.join(', ')}.` }); setTick(tick + 1);
    } catch (e) { setMsg({ err: e.message, ok: '' }); } finally { setBusy(false); }
  };
  return (
    <CrudPage key={tick} title="Study planner" subtitle="Daily and weekly schedules for your study sessions." icon={CalendarClock} endpoint="/planner/plans"
      fields={FIELDS} itemName="study session" addLabel="Add session" query={{ from: today() }} defaults={() => ({ plan_date: today() })}
      filters={[{ name: 'subject_id', label: 'Subject', ref: 'subjects' }, { name: 'status', label: 'Status', options: [{ value: 'planned', label: 'Planned' }, { value: 'done', label: 'Done' }] }]}
      groupBy={(p) => (p.plan_date === today() ? 'Today' : fmtLong(p.plan_date))}
      header={
        <Card className="mb-6 p-5">
          <div className="flex flex-wrap items-end gap-4">
            <div className="min-w-[220px] flex-1">
              <h2 className="flex items-center gap-2 text-lg font-bold"><Wand2 size={18} className="text-brand" />Smart study planner</h2>
              <p className="mt-1 text-sm text-muted">Builds a plan from your exam dates, assignment deadlines and unfinished syllabus topics.</p>
            </div>
            <label className="text-sm"><span className="mb-1 block font-medium">Days</span>
              <select className="input !w-24" value={days} onChange={(e) => setDays(+e.target.value)}>{[3, 5, 7, 10, 14].map((n) => <option key={n}>{n}</option>)}</select></label>
            <label className="text-sm"><span className="mb-1 block font-medium">Hours per day</span>
              <select className="input !w-24" value={hours} onChange={(e) => setHours(+e.target.value)}>{[1, 2, 3, 4, 5, 6].map((n) => <option key={n}>{n}</option>)}</select></label>
            <button className="btn-primary" onClick={generate} disabled={busy} id="generate-plan">{busy ? 'Planning...' : 'Generate plan'}</button>
          </div>
          <div className="mt-3"><ErrorNote>{msg.err}</ErrorNote>{msg.ok && <p className="text-sm text-ok">{msg.ok}</p>}</div>
        </Card>
      }
      renderItem={(p, c) => {
        const done = p.status === 'done';
        return (
          <div className="card flex items-center gap-3 p-4">
            <Tick checked={done} onChange={() => c.patch({ status: done ? 'planned' : 'done' })} label="Mark session done" />
            <div className="w-14 shrink-0 text-sm font-semibold text-brand">{p.start_time || '--:--'}</div>
            <div className="min-w-0 flex-1">
              <div className={cx('font-medium', done && 'text-muted line-through')}>{p.title}</div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted"><SubjectChip s={c.subject} /><span>{p.duration_min} min</span>{p.source === 'smart' && <Badge tone="brand">Smart plan</Badge>}</div>
            </div>
            {!done && <Link className="btn-plain !p-1.5" to={`/focus?subject=${p.subject_id || ''}&topic=${encodeURIComponent(p.topic || p.title)}`} aria-label="Start focus session"><Play size={16} /></Link>}
            <ItemActions c={c} />
          </div>
        );
      }} />
  );
}
