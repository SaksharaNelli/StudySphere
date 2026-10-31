import { useEffect } from 'react';
import { X, Check, Pencil, Trash2 } from 'lucide-react';

export const cx = (...a) => a.filter(Boolean).join(' ');

const TONES = {
  brand: 'bg-brand/10 text-brand', sky: 'bg-sky/15 text-sky', ok: 'bg-ok/15 text-ok',
  warn: 'bg-warn/15 text-warn', bad: 'bg-bad/15 text-bad', muted: 'bg-muted/15 text-muted',
};
export const Badge = ({ tone = 'brand', children }) => (
  <span className={cx('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold', TONES[tone])}>{children}</span>
);
export const Card = ({ className, children, ...p }) => <div className={cx('card', className)} {...p}>{children}</div>;

export function Progress({ value = 0, color = 'rgb(var(--c-brand))', height = 'h-2' }) {
  return (
    <div className={cx('w-full overflow-hidden rounded-full bg-soft', height)} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, value)}%`, background: color }} />
    </div>
  );
}

export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}

export function Empty({ icon: Icon, title, text, children }) {
  return (
    <div className="card flex flex-col items-center px-6 py-12 text-center">
      {Icon && <div className="mb-3 rounded-2xl bg-soft p-3 text-brand"><Icon size={24} /></div>}
      <h3 className="text-lg font-semibold">{title}</h3>
      {text && <p className="mt-1 max-w-sm text-sm text-muted">{text}</p>}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}

export const Spinner = () => <div className="py-16 text-center text-sm text-muted">Loading...</div>;
export const ErrorNote = ({ children }) => children ? <div className="mb-4 rounded-xl bg-bad/10 px-4 py-3 text-sm text-bad">{children}</div> : null;

export function Stat({ icon: Icon, label, value, hint, tone = 'brand' }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className={cx('rounded-xl p-2.5', TONES[tone])}><Icon size={20} /></div>
        <div className="min-w-0">
          <div className="text-xs text-muted">{label}</div>
          <div className="font-display text-2xl font-bold leading-tight">{value}</div>
        </div>
      </div>
      {hint && <div className="mt-2 text-xs text-muted">{hint}</div>}
    </Card>
  );
}

export function Modal({ title, onClose, children }) {
  useEffect(() => {
    const k = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-navy/50 p-0 sm:items-center sm:p-4" onMouseDown={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} onMouseDown={(e) => e.stopPropagation()}
        className="card max-h-[92vh] w-full overflow-y-auto rounded-b-none p-5 sm:max-w-lg sm:rounded-b-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">{title}</h2>
          <button className="btn-plain !p-1.5" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export const Field = ({ label, children }) => (
  <label className="block"><span className="mb-1 block text-sm font-medium">{label}</span>{children}</label>
);

export function Tick({ checked, onChange, label = 'Mark complete' }) {
  return (
    <button type="button" onClick={onChange} aria-label={label} aria-pressed={!!checked}
      className={cx('mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 transition-colors', checked ? 'border-ok bg-ok text-white' : 'border-muted/50 hover:border-brand')}>
      {checked ? <Check size={12} strokeWidth={3} /> : null}
    </button>
  );
}

export const ItemActions = ({ c }) => (
  <div className="flex shrink-0 gap-0.5">
    <button className="btn-plain !p-1.5" onClick={c.edit} aria-label="Edit"><Pencil size={16} /></button>
    <button className="btn-plain !p-1.5 hover:!text-bad" onClick={c.remove} aria-label="Delete"><Trash2 size={16} /></button>
  </div>
);

export const SubjectChip = ({ s }) => s ? (
  <span className="inline-flex items-center gap-1.5 rounded-full bg-soft px-2 py-0.5 text-xs font-medium">
    <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />{s.name}
  </span>
) : null;
