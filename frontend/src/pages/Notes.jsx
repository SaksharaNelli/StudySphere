import { Pin, StickyNote } from 'lucide-react';
import CrudPage from '../CrudPage';
import { Badge, ItemActions, SubjectChip, cx } from '../ui';

const CATS = [{ value: 'note', label: 'Note' }, { value: 'concept', label: 'Important concept' }, { value: 'formula', label: 'Formula' }, { value: 'revision', label: 'Revision note' }];
const FIELDS = [
  { name: 'title', label: 'Title', required: true },
  { name: 'subject_id', label: 'Subject', type: 'select', ref: 'subjects' },
  { name: 'category', label: 'Type', type: 'select', options: CATS, default: 'note' },
  { name: 'content', label: 'Content', type: 'textarea' },
  { name: 'pinned', label: 'Pin to top', type: 'checkbox' },
];

export default function Notes() {
  return (
    <CrudPage title="Notes" subtitle="Subject-wise notes, concepts, formulas and revision sheets." icon={StickyNote} endpoint="/notes"
      fields={FIELDS} itemName="note" search layout="grid"
      filters={[{ name: 'category', label: 'Type', options: CATS }, { name: 'subject_id', label: 'Subject', ref: 'subjects' }]}
      renderItem={(n, c) => (
        <div className={cx('card flex h-full flex-col p-4', n.pinned && 'border-brand/40')}>
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold">{n.title}</h3>
            <div className="flex shrink-0">
              <button className={cx('btn-plain !p-1.5', n.pinned && '!text-brand')} onClick={() => c.patch({ pinned: !n.pinned })} aria-label={n.pinned ? 'Unpin' : 'Pin'}><Pin size={16} /></button>
              <ItemActions c={c} />
            </div>
          </div>
          <p className={cx('mt-2 line-clamp-6 flex-1 whitespace-pre-wrap text-sm text-muted', n.category === 'formula' && 'font-mono')}>{n.content}</p>
          <div className="mt-3 flex flex-wrap gap-2"><Badge tone="sky">{CATS.find((x) => x.value === n.category)?.label}</Badge><SubjectChip s={c.subject} /></div>
        </div>
      )} />
  );
}
