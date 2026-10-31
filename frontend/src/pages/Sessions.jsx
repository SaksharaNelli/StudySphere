import { History } from 'lucide-react';
import CrudPage from '../CrudPage';
import { useFetch } from '../hooks';
import { fmtLong, hm, today } from '../lib';
import { Badge, ItemActions, Stat, SubjectChip } from '../ui';
import { Clock, Flame, CalendarDays } from 'lucide-react';

const FIELDS = [
  { name: 'subject_id', label: 'Subject', type: 'select', ref: 'subjects' },
  { name: 'topic', label: 'Topic' },
  { name: 'minutes', label: 'Duration (minutes)', type: 'number', required: true },
  { name: 'session_date', label: 'Date', type: 'date', required: true },
  { name: 'note', label: 'Note' },
];

export default function Sessions() {
  const { data: st, reload } = useFetch('/sessions/stats');
  return (
    <CrudPage title="Session history" subtitle="Every study session, with subject, topic and duration." icon={History} endpoint="/sessions"
      fields={FIELDS} itemName="session" addLabel="Log session" search defaults={() => ({ session_date: today(), minutes: 45 })}
      filters={[{ name: 'subject_id', label: 'Subject', ref: 'subjects' }]} groupBy={(s) => fmtLong(s.session_date)} onLoad={reload}
      header={st && (
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <Stat icon={Clock} label="Total study time" value={hm(st.totalMinutes)} />
          <Stat icon={CalendarDays} label="Studied today" value={hm(st.todayMinutes)} tone="sky" />
          <Stat icon={Flame} label="Current streak" value={`${st.currentStreak} day${st.currentStreak === 1 ? '' : 's'}`} tone="warn" />
        </div>
      )}
      renderItem={(s, c) => (
        <div className="card flex items-center gap-3 p-4">
          <div className="min-w-[64px] rounded-xl bg-soft px-2 py-1.5 text-center font-display font-bold text-brand">{hm(s.minutes)}</div>
          <div className="min-w-0 flex-1">
            <div className="font-medium">{s.topic || 'Study session'}</div>
            <div className="mt-1 flex flex-wrap items-center gap-2"><SubjectChip s={c.subject} />{s.mode === 'focus' && <Badge tone="brand">Focus mode</Badge>}{s.note && <span className="text-xs text-muted">{s.note}</span>}</div>
          </div>
          <ItemActions c={c} />
        </div>
      )} />
  );
}
