import { useState } from 'react';
import { ChevronLeft, ChevronRight, Flame, Target } from 'lucide-react';
import CrudPage from '../CrudPage';
import { useFetch } from '../hooks';
import { useAuth } from '../auth';
import { addDays, fmtLong, hm, today } from '../lib';
import { Card, ItemActions, Progress, Tick, cx } from '../ui';

export default function Goals() {
  const { user } = useAuth();
  const [date, setDate] = useState(today());
  const [items, setItems] = useState([]);
  const { data: st, reload } = useFetch('/sessions/stats');
  const done = items.filter((g) => g.done).length;
  const pct = items.length ? Math.round((done / items.length) * 100) : 0;
  const target = user.settings?.daily_goal_minutes || 120;
  return (
    <CrudPage title="Goals and streak" subtitle="Set what you want to finish each day and keep the streak going." icon={Target} endpoint="/planner/goals"
      fields={[{ name: 'title', label: 'Goal', required: true }, { name: 'goal_date', label: 'Date', type: 'date', required: true }, { name: 'done', label: 'Completed', type: 'checkbox' }]}
      itemName="goal" query={{ goal_date: date }} defaults={() => ({ goal_date: date })} onLoad={(d) => { setItems(d); reload(); }}
      header={
        <div className="mb-6 grid gap-4 lg:grid-cols-3">
          <Card className="relative overflow-hidden bg-navy p-5 text-white !border-navy lg:col-span-1">
            <Flame className="absolute -right-3 -top-3 text-brand/40" size={110} />
            <div className="text-sm text-white/60">Current streak</div>
            <div className="font-display text-5xl font-bold">{st?.currentStreak ?? 0}<span className="ml-1 text-lg font-medium text-white/60">days</span></div>
            <div className="mt-3 flex gap-5 text-sm text-white/70"><span>Longest: {st?.longestStreak ?? 0}</span><span>Consistency: {st?.consistency ?? 0}%</span></div>
          </Card>
          <Card className="p-5 lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <button className="btn-plain !p-1.5" onClick={() => setDate(addDays(date, -1))} aria-label="Previous day"><ChevronLeft size={18} /></button>
              <div className="text-center"><div className="font-semibold">{date === today() ? 'Today' : fmtLong(date)}</div><div className="text-xs text-muted">{done} of {items.length} goals completed</div></div>
              <button className="btn-plain !p-1.5" onClick={() => setDate(addDays(date, 1))} aria-label="Next day"><ChevronRight size={18} /></button>
            </div>
            <Progress value={pct} height="h-3" />
            <div className="mt-4 flex justify-between text-xs text-muted"><span>Study time today: {hm(st?.todayMinutes || 0)}</span><span>Daily target: {hm(target)}</span></div>
            <div className="mt-1"><Progress value={Math.round(((st?.todayMinutes || 0) / target) * 100)} color="rgb(var(--c-sky))" /></div>
          </Card>
        </div>
      }
      renderItem={(g, c) => (
        <div className="card flex items-center gap-3 p-4">
          <Tick checked={g.done} onChange={() => c.patch({ done: !g.done })} label="Toggle goal" />
          <span className={cx('flex-1 font-medium', g.done && 'text-muted line-through')}>{g.title}</span>
          <ItemActions c={c} />
        </div>
      )} />
  );
}
