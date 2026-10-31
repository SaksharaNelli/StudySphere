import { useState } from 'react';
import { api } from '../api';
import { useAuth } from '../auth';
import { Card, ErrorNote, Field, PageHeader } from '../ui';

const TOGGLES = [['notify_assignments', 'Assignment deadlines'], ['notify_exams', 'Examinations'], ['notify_sessions', 'Study sessions'], ['notify_goals', 'Daily goals']];

export default function SettingsPage() {
  const { user, setUser } = useAuth();
  const [p, setP] = useState({ name: user.name, college: user.college || '', department: user.department || '', semester: user.semester || '', academic_year: user.academic_year || '', theme: user.theme || 'light' });
  const [s, setS] = useState(user.settings);
  const [pw, setPw] = useState({ current_password: '', new_password: '' });
  const [msg, setMsg] = useState(''); const [err, setErr] = useState('');
  const save = async (e) => {
    e.preventDefault(); setErr(''); setMsg('');
    try {
      const body = { ...p, settings: { ...s, focus_minutes: +s.focus_minutes, break_minutes: +s.break_minutes, long_break_minutes: +s.long_break_minutes, daily_goal_minutes: +s.daily_goal_minutes } };
      if (pw.new_password) Object.assign(body, pw);
      const r = await api('/auth/me', { method: 'PUT', body }); setUser(r.user); setPw({ current_password: '', new_password: '' }); setMsg('Settings saved.');
    } catch (x) { setErr(x.message); }
  };
  const t = (k) => (e) => setP({ ...p, [k]: e.target.value });
  const n = (k) => (e) => setS({ ...s, [k]: e.target.value });
  return (
    <div>
      <PageHeader title="Profile and settings" subtitle="Your student details, theme, reminders and study preferences." />
      <form onSubmit={save} className="grid gap-6 lg:grid-cols-2">
        <Card className="space-y-3 p-5">
          <h2 className="text-lg font-bold">Student profile</h2>
          <Field label="Full name"><input className="input" value={p.name} onChange={t('name')} /></Field>
          <Field label="Email"><input className="input opacity-60" value={user.email} disabled /></Field>
          <Field label="College"><input className="input" value={p.college} onChange={t('college')} /></Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Department"><input className="input" value={p.department} onChange={t('department')} /></Field>
            <Field label="Semester"><input className="input" value={p.semester} onChange={t('semester')} /></Field>
            <Field label="Year"><input className="input" value={p.academic_year} onChange={t('academic_year')} /></Field>
          </div>
        </Card>
        <Card className="space-y-3 p-5">
          <h2 className="text-lg font-bold">Appearance and study</h2>
          <Field label="Theme"><select className="input" value={p.theme} onChange={t('theme')}><option value="light">Light</option><option value="dark">Dark</option></select></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Focus minutes"><input className="input" type="number" min="1" value={s.focus_minutes} onChange={n('focus_minutes')} /></Field>
            <Field label="Break minutes"><input className="input" type="number" min="1" value={s.break_minutes} onChange={n('break_minutes')} /></Field>
            <Field label="Long break minutes"><input className="input" type="number" min="1" value={s.long_break_minutes} onChange={n('long_break_minutes')} /></Field>
            <Field label="Daily study target (min)"><input className="input" type="number" min="10" value={s.daily_goal_minutes} onChange={n('daily_goal_minutes')} /></Field>
          </div>
        </Card>
        <Card className="p-5">
          <h2 className="mb-3 text-lg font-bold">Reminders</h2>
          {TOGGLES.map(([k, l]) => <label key={k} className="flex items-center justify-between border-b border-line py-2.5 last:border-0"><span className="text-sm font-medium">{l}</span><input type="checkbox" className="h-4 w-4 accent-brand" checked={s[k] !== false} onChange={(e) => setS({ ...s, [k]: e.target.checked })} /></label>)}
        </Card>
        <Card className="space-y-3 p-5">
          <h2 className="text-lg font-bold">Change password</h2>
          <Field label="Current password"><input className="input" type="password" autoComplete="current-password" value={pw.current_password} onChange={(e) => setPw({ ...pw, current_password: e.target.value })} /></Field>
          <Field label="New password"><input className="input" type="password" autoComplete="new-password" value={pw.new_password} onChange={(e) => setPw({ ...pw, new_password: e.target.value })} /></Field>
        </Card>
        <div className="lg:col-span-2"><ErrorNote>{err}</ErrorNote>{msg && <p className="mb-3 text-sm text-ok">{msg}</p>}<button className="btn-primary" id="save-settings">Save changes</button></div>
      </form>
    </div>
  );
}
