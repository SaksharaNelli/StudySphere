import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '../api';
import { addDays, parse, today, ymd, fmtLong } from '../lib';
import { Card, PageHeader, cx } from '../ui';

const TYPES = {
  assignment: ['Assignment', 'bg-sky/15 text-sky'], exam: ['Exam', 'bg-bad/15 text-bad'],
  study: ['Study', 'bg-brand/10 text-brand'], revision: ['Revision', 'bg-warn/15 text-warn'],
};

export default function CalendarPage() {
  const [view, setView] = useState('month');
  const [cur, setCur] = useState(today());
  const [events, setEvents] = useState([]);

  const range = useMemo(() => {
    const c = parse(cur);
    if (view === 'day') return [cur, cur];
    if (view === 'week') { const s = addDays(cur, -c.getDay()); return [s, addDays(s, 6)]; }
    const first = new Date(c.getFullYear(), c.getMonth(), 1), last = new Date(c.getFullYear(), c.getMonth() + 1, 0);
    const s = addDays(ymd(first), -first.getDay());
    return [s, addDays(ymd(last), 6 - last.getDay())];
  }, [cur, view]);

  useEffect(() => {
    const [from, to] = range, qs = `?from=${from}&to=${to}`;
    Promise.all([
      api('/academic/assignments' + qs), api('/academic/exams' + qs), api('/planner/plans' + qs), api('/academic/prep' + qs + '&kind=revision'),
    ]).then(([a, e, p, r]) => setEvents([
      ...a.map((x) => ({ date: x.due_date, type: 'assignment', title: x.title })),
      ...e.map((x) => ({ date: x.exam_date, type: 'exam', title: x.title, time: x.start_time })),
      ...p.map((x) => ({ date: x.plan_date, type: 'study', title: x.title, time: x.start_time })),
      ...r.map((x) => ({ date: x.due_date, type: 'revision', title: x.title })),
    ])).catch(() => setEvents([]));
  }, [range]);

  const on = (d) => events.filter((e) => e.date === d).sort((a, b) => (a.time || '99').localeCompare(b.time || '99'));
  const days = []; for (let d = range[0]; d <= range[1]; d = addDays(d, 1)) days.push(d);
  const step = (n) => { const c = parse(cur); if (view === 'month') c.setMonth(c.getMonth() + n); else c.setDate(c.getDate() + n * (view === 'week' ? 7 : 1)); setCur(ymd(c)); };
  const title = view === 'day' ? fmtLong(cur) : view === 'week' ? `${parse(range[0]).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} to ${parse(range[1]).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}` : parse(cur).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const Pill = ({ e }) => <div className={cx('truncate rounded-md px-1.5 py-0.5 text-xs font-medium', TYPES[e.type][1])} title={e.title}>{e.time ? e.time + ' ' : ''}{e.title}</div>;

  return (
    <div>
      <PageHeader title="Academic calendar" subtitle="Assignments, exams, study sessions and revision in one view.">
        <div className="flex rounded-xl bg-soft p-1">
          {['month', 'week', 'day'].map((v) => <button key={v} onClick={() => setView(v)} className={cx('rounded-lg px-3 py-1 text-sm font-semibold capitalize', view === v ? 'bg-surface text-brand shadow-card' : 'text-muted')}>{v}</button>)}
        </div>
      </PageHeader>
      <Card className="p-4">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button className="btn-plain !p-1.5" onClick={() => step(-1)} aria-label="Previous"><ChevronLeft size={18} /></button>
            <button className="btn-plain !p-1.5" onClick={() => step(1)} aria-label="Next"><ChevronRight size={18} /></button>
            <button className="btn-ghost !py-1" onClick={() => setCur(today())}>Today</button>
          </div>
          <h2 className="text-lg font-bold">{title}</h2>
          <div className="hidden gap-3 text-xs text-muted sm:flex">{Object.values(TYPES).map(([l, c]) => <span key={l} className={cx('rounded-full px-2 py-0.5', c)}>{l}</span>)}</div>
        </div>
        {view === 'day' ? (
          <div className="space-y-2">{on(cur).length ? on(cur).map((e, i) => <div key={i} className={cx('rounded-xl p-3 text-sm font-medium', TYPES[e.type][1])}>{e.time && <b>{e.time} </b>}{e.title} <span className="opacity-70">({TYPES[e.type][0]})</span></div>) : <p className="py-10 text-center text-muted">Nothing scheduled for this day.</p>}</div>
        ) : (
          <>
            {view === 'month' && <div className="mb-1 grid grid-cols-7 text-center text-xs text-muted">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => <div key={d}>{d}</div>)}</div>}
            <div className={cx('grid gap-1', view === 'month' ? 'grid-cols-7' : 'grid-cols-1 sm:grid-cols-7')}>
              {days.map((d) => {
                const ev = on(d), inMonth = parse(d).getMonth() === parse(cur).getMonth(), lim = view === 'month' ? 3 : 20;
                return (
                  <button key={d} onClick={() => { setCur(d); setView('day'); }}
                    className={cx('min-h-[84px] rounded-xl border p-1.5 text-left align-top hover:border-brand', view === 'week' && 'sm:min-h-[200px]', d === today() ? 'border-brand bg-brand/5' : 'border-line', view === 'month' && !inMonth && 'opacity-40')}>
                    <div className={cx('mb-1 text-xs font-semibold', d === today() && 'text-brand')}>{view === 'week' ? parse(d).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' }) : parse(d).getDate()}</div>
                    <div className="space-y-0.5">{ev.slice(0, lim).map((e, i) => <Pill key={i} e={e} />)}{ev.length > lim && <div className="text-xs text-muted">+{ev.length - lim} more</div>}</div>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
