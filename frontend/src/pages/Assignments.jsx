import { Bell, ClipboardList, Paperclip } from 'lucide-react';
import CrudPage from '../CrudPage';
import { daysLeft, fmtDate, relDay, today } from '../lib';
import { Badge, ItemActions, SubjectChip, Tick, cx } from '../ui';

const PRIORITY = [{ value: 'high', label: 'High' }, { value: 'medium', label: 'Medium' }, { value: 'low', label: 'Low' }];
const STATUS = [{ value: 'pending', label: 'Pending' }, { value: 'in_progress', label: 'In progress' }, { value: 'completed', label: 'Completed' }];
const TONE = { high: 'bad', medium: 'warn', low: 'sky' };

const FIELDS = [
  { name: 'title', label: 'Title', required: true },
  { name: 'subject_id', label: 'Subject', type: 'select', ref: 'subjects' },
  { name: 'due_date', label: 'Due date', type: 'date', required: true },
  { name: 'priority', label: 'Priority', type: 'select', options: PRIORITY, default: 'medium' },
  { name: 'status', label: 'Status', type: 'select', options: STATUS, default: 'pending' },
  { name: 'description', label: 'Description', type: 'textarea' },
  { name: 'attachment_url', label: 'Attachment link' },
  { name: 'reminder_at', label: 'Reminder', type: 'datetime' },
];

export default function Assignments() {
  return (
    <CrudPage title="Assignments" subtitle="Track deadlines, priorities and progress." icon={ClipboardList} endpoint="/academic/assignments"
      fields={FIELDS} itemName="assignment" search defaults={() => ({ due_date: today() })}
      filters={[{ name: 'status', label: 'Status', options: STATUS }, { name: 'priority', label: 'Priority', options: PRIORITY }, { name: 'subject_id', label: 'Subject', ref: 'subjects' }]}
      renderItem={(a, c) => {
        const d = daysLeft(a.due_date), done = a.status === 'completed';
        return (
          <div className="card flex items-start gap-3 p-4">
            <Tick checked={done} onChange={() => c.patch({ status: done ? 'pending' : 'completed' })} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className={cx('font-semibold', done && 'text-muted line-through')}>{a.title}</h3>
                <Badge tone={TONE[a.priority]}>{a.priority}</Badge>
                <SubjectChip s={c.subject} />
              </div>
              {a.description && <p className="mt-1 line-clamp-2 text-sm text-muted">{a.description}</p>}
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted">
                <span className={cx(!done && d < 0 && 'font-semibold text-bad')}>Due {fmtDate(a.due_date)}{!done && ` (${relDay(d)})`}</span>
                {a.status === 'in_progress' && <Badge tone="sky">In progress</Badge>}
                {a.attachment_url && <a href={a.attachment_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-brand"><Paperclip size={12} />Attachment</a>}
                {a.reminder_at && <span className="inline-flex items-center gap-1"><Bell size={12} />Reminder set</span>}
              </div>
            </div>
            <ItemActions c={c} />
          </div>
        );
      }} />
  );
}
