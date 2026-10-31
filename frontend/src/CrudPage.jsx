import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { api } from './api';
import { useFetch } from './hooks';
import { COLORS } from './lib';
import { Empty, ErrorNote, Field, ItemActions, Modal, PageHeader, Spinner, cx } from './ui';

const toForm = (fields, item, defaults) => {
  const v = {};
  for (const f of fields) {
    let x = item ? item[f.name] : defaults?.[f.name];
    if (f.type === 'checkbox') x = !!x;
    else if (f.type === 'datetime') x = x ? String(x).replace(' ', 'T').slice(0, 16) : '';
    else if (x == null) x = item ? '' : f.default ?? '';
    v[f.name] = x;
  }
  return v;
};
const toPayload = (fields, v) => {
  const p = {};
  for (const f of fields) {
    let x = v[f.name];
    if (f.type === 'number') x = x === '' || x == null ? null : Number(x);
    else if (f.type === 'datetime') x = x ? x.replace('T', ' ') + ':00' : null;
    else if (f.type === 'checkbox') x = !!x;
    else if (f.type === 'select' && f.ref) x = x === '' ? null : Number(x);
    else if (x === '') x = null;
    p[f.name] = x;
  }
  return p;
};

/** Generic list + create/edit modal page driven by a field config. Used by most modules. */
export default function CrudPage({ title, subtitle, icon, endpoint, fields, filters = [], search = false, defaults, itemName = 'item',
  renderItem, groupBy, actions, query, layout = 'list', emptyText, onLoad, validate, addLabel, header }) {
  const { data: subjects } = useFetch('/academic/subjects');
  const byId = useMemo(() => Object.fromEntries((subjects || []).map((s) => [s.id, s])), [subjects]);
  const [items, setItems] = useState(null);
  const [err, setErr] = useState('');
  const [q, setQ] = useState('');
  const [fv, setFv] = useState({});
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [formErr, setFormErr] = useState('');
  const [saving, setSaving] = useState(false);

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    Object.entries({ ...query, ...fv }).forEach(([k, v]) => v !== '' && v != null && p.set(k, v));
    if (q) p.set('q', q);
    return p.toString();
  }, [query, fv, q]);

  const load = useCallback(async () => {
    try { const d = await api(`${endpoint}${qs ? '?' + qs : ''}`); setItems(d); onLoad?.(d); setErr(''); } catch (e) { setErr(e.message); }
  }, [endpoint, qs]);
  useEffect(() => { const t = setTimeout(load, q ? 250 : 0); return () => clearTimeout(t); }, [load]);

  const options = (f) => (f.ref === 'subjects' ? [{ value: '', label: 'None' }, ...(subjects || []).map((s) => ({ value: s.id, label: s.name }))] : f.options || []);
  const openNew = () => { setForm(toForm(fields, null, typeof defaults === 'function' ? defaults() : defaults)); setFormErr(''); setModal({}); };
  const openEdit = (item) => { setForm(toForm(fields, item)); setFormErr(''); setModal({ item }); };

  const save = async (e) => {
    e.preventDefault();
    for (const f of fields) if (f.required && (form[f.name] === '' || form[f.name] == null)) return setFormErr(`${f.label} is required`);
    const v = validate?.(form);
    if (v) return setFormErr(v);
    setSaving(true);
    try {
      const body = toPayload(fields, form);
      if (modal.item) await api(`${endpoint}/${modal.item.id}`, { method: 'PUT', body });
      else await api(endpoint, { method: 'POST', body });
      setModal(null); load();
    } catch (e2) { setFormErr(e2.message); } finally { setSaving(false); }
  };
  const ctxFor = (item) => ({
    subject: byId[item.subject_id], subjects, byId, edit: () => openEdit(item), reload: load,
    remove: async () => { if (window.confirm(`Delete this ${itemName}?`)) { await api(`${endpoint}/${item.id}`, { method: 'DELETE' }); load(); } },
    patch: async (p) => { await api(`${endpoint}/${item.id}`, { method: 'PUT', body: p }); load(); },
  });

  const groups = items && (groupBy ? Object.entries(items.reduce((a, i) => { (a[groupBy(i)] ||= []).push(i); return a; }, {})) : [[null, items]]);
  const row = (item) => {
    const c = ctxFor(item);
    return <div key={item.id}>{renderItem ? renderItem(item, c) : (
      <div className="card flex items-center justify-between p-4"><span className="font-medium">{item.title || item.name}</span><ItemActions c={c} /></div>)}</div>;
  };

  return (
    <div>
      <PageHeader title={title} subtitle={subtitle}>
        {actions}
        <button className="btn-primary" onClick={openNew}><Plus size={16} />{addLabel || `Add ${itemName}`}</button>
      </PageHeader>
      {header}
      {(search || filters.length > 0) && (
        <div className="mb-4 flex flex-wrap gap-2">
          {search && (
            <div className="relative min-w-[200px] flex-1">
              <Search size={16} className="absolute left-3 top-2.5 text-muted" />
              <input className="input !pl-9" placeholder={`Search ${itemName}s`} value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search" />
            </div>
          )}
          {filters.map((f) => (
            <select key={f.name} className="input !w-auto" value={fv[f.name] || ''} onChange={(e) => setFv({ ...fv, [f.name]: e.target.value })} aria-label={f.label}>
              <option value="">{f.label}: all</option>
              {(f.ref === 'subjects' ? (subjects || []).map((s) => ({ value: s.id, label: s.name })) : f.options).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          ))}
        </div>
      )}
      <ErrorNote>{err}</ErrorNote>
      {!items && !err ? <Spinner /> : items && items.length === 0 ? (
        <Empty icon={icon} title={`No ${itemName}s yet`} text={emptyText || `Add your first ${itemName} to get started.`}>
          <button className="btn-primary" onClick={openNew}><Plus size={16} />{addLabel || `Add ${itemName}`}</button>
        </Empty>
      ) : groups && groups.map(([label, list]) => (
        <section key={label || 'all'} className="mb-6">
          {label && <h2 className="mb-2 text-sm font-semibold text-muted">{label}</h2>}
          <div className={cx(layout === 'grid' ? 'grid gap-4 sm:grid-cols-2 xl:grid-cols-3' : 'space-y-3')}>{list.map(row)}</div>
        </section>
      ))}

      {modal && (
        <Modal title={modal.item ? `Edit ${itemName}` : `New ${itemName}`} onClose={() => setModal(null)}>
          <form onSubmit={save} className="space-y-3" noValidate>
            {fields.map((f) => (
              <Field key={f.name} label={f.label + (f.required ? ' *' : '')}>
                {f.type === 'textarea' ? <textarea className="input min-h-[90px]" value={form[f.name]} onChange={(e) => setForm({ ...form, [f.name]: e.target.value })} />
                : f.type === 'select' ? (
                  <select className="input" value={form[f.name]} onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}>
                    {!f.options && !f.ref ? null : options(f).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                ) : f.type === 'checkbox' ? (
                  <input type="checkbox" className="h-4 w-4 accent-brand" checked={form[f.name]} onChange={(e) => setForm({ ...form, [f.name]: e.target.checked })} />
                ) : f.type === 'color' ? (
                  <div className="flex flex-wrap gap-2">{COLORS.map((c) => (
                    <button type="button" key={c} aria-label={`Colour ${c}`} onClick={() => setForm({ ...form, [f.name]: c })}
                      className={cx('h-7 w-7 rounded-full border-2', form[f.name] === c ? 'border-ink' : 'border-transparent')} style={{ background: c }} />))}</div>
                ) : (
                  <input className="input" type={f.type === 'datetime' ? 'datetime-local' : f.type || 'text'} value={form[f.name]} min={f.type === 'number' ? 0 : undefined}
                    onChange={(e) => setForm({ ...form, [f.name]: e.target.value })} />
                )}
              </Field>
            ))}
            <ErrorNote>{formErr}</ErrorNote>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="btn-plain" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn-primary" disabled={saving}>{saving ? 'Saving...' : modal.item ? 'Save changes' : `Add ${itemName}`}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
