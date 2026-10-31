import { GraduationCap, MapPin } from 'lucide-react';
import CrudPage from '../CrudPage';
import { daysLeft, fmtDate, today } from '../lib';
import { Badge, ItemActions, SubjectChip, cx } from '../ui';

const PREP = [{ value: 'not_started', label: 'Not started' }, { value: 'in_progress', label: 'In progress' }, { value: 'ready', label: 'Ready' }];
const TONE = { not_started: 'muted', in_progress: 'warn', ready: 'ok' };
const FIELDS = [
  { name: 'title', label: 'Exam title', required: true },
  { name: 'subject_id', label: 'Subject', type: 'select', ref: 'subjects' },
  { name: 'exam_date', label: 'Exam date', type: 'date', required: true },
  { name: 'start_time', label: 'Start time', type: 'time' },
  { name: 'venue', label: 'Venue' },
  { name: 'preparation_status', label: 'Preparation', type: 'select', options: PREP, default: 'not_started' },
  { name: 'marks_obtained', label: 'Marks obtained', type: 'number' },
  { name: 'max_marks', label: 'Maximum marks', type: 'number' },
];

export default function Exams() {
  return (
    <CrudPage title="Examinations" subtitle="Your timetable, countdowns and results." icon={GraduationCap} endpoint="/academic/exams"
      fields={FIELDS} itemName="exam" search layout="grid" defaults={() => ({ exam_date: today() })}
      filters={[{ name: 'preparation_status', label: 'Preparation', options: PREP }, { name: 'subject_id', label: 'Subject', ref: 'subjects' }]}
      renderItem={(e, c) => {
        const d = daysLeft(e.exam_date), past = d < 0;
        return (
          <div className="card p-4">
            <div className="flex items-start justify-between gap-2">
              <div className={cx('rounded-xl px-3 py-2 text-center', past ? 'bg-muted/15 text-muted' : d <= 3 ? 'bg-bad/15 text-bad' : 'bg-brand/10 text-brand')}>
                <div className="font-display text-2xl font-bold leading-none">{past ? 'Done' : d}</div>
                {!past && <div className="mt-0.5 text-xs">{d === 1 ? 'day left' : 'days left'}</div>}
              </div>
              <ItemActions c={c} />
            </div>
            <h3 className="mt-3 text-lg font-semibold">{e.title}</h3>
            <div className="mt-1 text-sm text-muted">{fmtDate(e.exam_date)}{e.start_time ? `, ${e.start_time}` : ''}</div>
            {e.venue && <div className="mt-1 flex items-center gap-1 text-sm text-muted"><MapPin size={14} />{e.venue}</div>}
            <div className="mt-3 flex flex-wrap items-center gap-2"><SubjectChip s={c.subject} /><Badge tone={TONE[e.preparation_status]}>{PREP.find((p) => p.value === e.preparation_status)?.label}</Badge></div>
            {e.max_marks != null && e.marks_obtained != null && (
              <div className="mt-3 rounded-xl bg-soft px-3 py-2 text-sm">Result: <b>{+e.marks_obtained}</b> / {+e.max_marks} ({Math.round((e.marks_obtained / e.max_marks) * 100)}%)</div>
            )}
          </div>
        );
      }} />
  );
}
