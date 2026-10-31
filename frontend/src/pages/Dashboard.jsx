import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { CalendarClock, ClipboardList, Clock, Flame, GraduationCap } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../auth';
import { daysLeft, fmtDate, fmtLong, hm, relDay, today } from '../lib';
import { Badge, Card, ErrorNote, Progress, Spinner, Stat, Tick, cx } from '../ui';

const greet = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'; };

export default function Dashboard() {
  const { user } = useAuth();
  const [d, setD] = useState(null);
  const [err, setErr] = useState('');
  const load = () => Promise.all([
    api('/academic/assignments'), api('/academic/exams'), api('/planner/plans?plan_date=' + today()), api('/planner/goals?goal_date=' + today()), api('/academic/syllabus'), api('/sessions/stats'),
  ]).then(([assignments, exams, plans, goals, syllabus, stats]) => setD({ assignments, exams, plans, goals, syllabus, stats })).catch((e) => setErr(e.message));
  useEffect(() => { load(); }, []);
  if (err) return <ErrorNote>{err}</ErrorNote>;
  if (!d) return <Spinner />;

  const open = d.assignments.filter((a) => a.status !== 'completed');
  const overdue = open.filter((a) => daysLeft(a.due_date) < 0).length;
  const exams = d.exams.filter((e) => daysLeft(e.exam_date) >= 0).slice(0, 3);
  const doneGoals = d.goals.filter((g) => g.done).length;
  const avg = d.syllabus.length ? Math.round(d.syllabus.reduce((a, s) => a + s.percent, 0) / d.syllabus.length) : 0;
  const subj = Object.fromEntries(d.syllabus.map((s) => [s.id, s]));
  const toggle = async (path, id, body) => { await api(`${path}/${id}`, { method: 'PUT', body }); load(); };

  return (
    <div className="space-y-6">
      <div className="card relative overflow-hidden bg-navy p-6 text-white !border-navy sm:p-8">
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand/40 blur-2xl" />
        <div className="absolute -bottom-20 right-24 h-48 w-48 rounded-full bg-sky/30 blur-2xl" />
        <div className="relative">
          <p className="text-sm text-white/60">{fmtLong(today())}</p>
          <h1 className="mt-1 text-3xl font-bold sm:text-4xl">{greet()}, {user.name.split(' ')[0]}</h1>
          <p className="mt-2 max-w-xl text-white/75">
            {open.length ? `You have ${open.length} open assignment${open.length === 1 ? '' : 's'}${overdue ? `, ${overdue} overdue` : ''}` : 'No open assignments'}
            {exams[0] ? ` and ${exams[0].title} ${relDay(daysLeft(exams[0].exam_date)).toLowerCase()}.` : '.'}
          </p>
          <div className="mt-5 flex gap-3"><Link to="/focus" className="btn bg-white text-navy hover:bg-white/90">Start focus session</Link><Link to="/planner" className="btn bg-white/10 text-white hover:bg-white/20">Open planner</Link></div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={ClipboardList} label="Open assignments" value={open.length} hint={overdue ? `${overdue} overdue` : 'Nothing overdue'} tone={overdue ? 'bad' : 'brand'} />
        <Stat icon={GraduationCap} label="Upcoming exams" value={d.exams.filter((e) => daysLeft(e.exam_date) >= 0).length} hint={exams[0] ? `Next: ${fmtDate(exams[0].exam_date)}` : 'None scheduled'} tone="sky" />
        <Stat icon={Clock} label="Studied today" value={hm(d.stats.todayMinutes)} hint={`${hm(d.stats.totalMinutes)} in total`} tone="ok" />
        <Stat icon={Flame} label="Study streak" value={`${d.stats.currentStreak} days`} hint={`Longest: ${d.stats.longestStreak} days`} tone="warn" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-bold">Study time, last 7 days</h2><Link to="/analytics" className="text-sm font-semibold text-brand">Full analytics</Link></div>
          <div className="h-44">
            <ResponsiveContainer>
              <AreaChart data={d.stats.last7.map((x) => ({ day: new Date(x.date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short' }), min: x.minutes }))}>
                <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6D4AFF" stopOpacity={0.45} /><stop offset="100%" stopColor="#6D4AFF" stopOpacity={0} /></linearGradient></defs>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: 'rgb(var(--c-muted))', fontSize: 12 }} />
                <Tooltip formatter={(v) => [hm(v), 'Studied']} contentStyle={{ borderRadius: 12 }} />
                <Area type="monotone" dataKey="min" stroke="#6D4AFF" strokeWidth={3} fill="url(#g)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-bold">Today's goals</h2><span className="text-sm text-muted">{doneGoals}/{d.goals.length}</span></div>
          <Progress value={d.goals.length ? (doneGoals / d.goals.length) * 100 : 0} />
          <ul className="mt-4 space-y-2">
            {d.goals.length === 0 && <li className="text-sm text-muted">No goals yet. <Link className="font-semibold text-brand" to="/goals">Set one</Link></li>}
            {d.goals.slice(0, 5).map((g) => <li key={g.id} className="flex items-start gap-3"><Tick checked={g.done} onChange={() => toggle('/planner/goals', g.id, { done: !g.done })} /><span className={cx('text-sm', g.done && 'text-muted line-through')}>{g.title}</span></li>)}
          </ul>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-bold">Upcoming deadlines</h2><Link to="/assignments" className="text-sm font-semibold text-brand">All</Link></div>
          <ul className="space-y-3">
            {open.slice(0, 5).map((a) => { const n = daysLeft(a.due_date); return (
              <li key={a.id} className="flex items-start justify-between gap-2"><div className="min-w-0"><div className="truncate text-sm font-medium">{a.title}</div><div className="text-xs text-muted">{subj[a.subject_id]?.name || 'No subject'}</div></div>
                <Badge tone={n < 0 ? 'bad' : n <= 2 ? 'warn' : 'sky'}>{relDay(n)}</Badge></li>); })}
            {!open.length && <li className="text-sm text-muted">You are all caught up.</li>}
          </ul>
        </Card>
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-bold">Upcoming exams</h2><Link to="/exams" className="text-sm font-semibold text-brand">All</Link></div>
          <ul className="space-y-3">
            {exams.map((e) => <li key={e.id} className="flex items-center gap-3"><div className="rounded-xl bg-brand/10 px-2.5 py-1.5 text-center text-brand"><div className="font-display text-lg font-bold leading-none">{daysLeft(e.exam_date)}</div><div className="text-[10px]">days</div></div>
              <div className="min-w-0"><div className="truncate text-sm font-medium">{e.title}</div><div className="text-xs text-muted">{fmtDate(e.exam_date)}{e.venue ? `, ${e.venue}` : ''}</div></div></li>)}
            {!exams.length && <li className="text-sm text-muted">No upcoming exams.</li>}
          </ul>
        </Card>
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between"><h2 className="flex items-center gap-2 text-lg font-bold"><CalendarClock size={18} className="text-brand" />Today's schedule</h2><Link to="/planner" className="text-sm font-semibold text-brand">Plan</Link></div>
          <ul className="space-y-3">
            {d.plans.map((p) => <li key={p.id} className="flex items-start gap-3"><Tick checked={p.status === 'done'} onChange={() => toggle('/planner/plans', p.id, { status: p.status === 'done' ? 'planned' : 'done' })} />
              <div className="min-w-0"><div className={cx('truncate text-sm font-medium', p.status === 'done' && 'text-muted line-through')}>{p.title}</div><div className="text-xs text-muted">{p.start_time} for {p.duration_min} min</div></div></li>)}
            {!d.plans.length && <li className="text-sm text-muted">Nothing planned. Generate a smart plan to fill your day.</li>}
          </ul>
        </Card>
      </div>

      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-bold">Academic progress</h2><span className="text-sm text-muted">Overall syllabus: <b className="text-ink">{avg}%</b></span></div>
        <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
          {d.syllabus.map((s) => <div key={s.id}><div className="mb-1 flex justify-between text-sm"><span className="font-medium">{s.name}</span><span className="text-muted">{s.percent}%</span></div><Progress value={s.percent} color={s.color} /></div>)}
          {!d.syllabus.length && <p className="text-sm text-muted">Add subjects and syllabus topics to see your progress.</p>}
        </div>
      </Card>
    </div>
  );
}
