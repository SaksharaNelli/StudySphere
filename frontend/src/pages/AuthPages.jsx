import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarCheck, ListChecks, Timer } from 'lucide-react';
import { useAuth } from '../auth';
import { ErrorNote, Field } from '../ui';

function Shell({ title, subtitle, children, footer }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-navy p-12 text-white lg:flex">
        <div className="flex items-center gap-2.5"><div className="grid h-10 w-10 place-items-center rounded-xl bg-brand font-display text-xl font-bold">S</div><span className="font-display text-2xl font-bold">StudySphere</span></div>
        <div>
          <h2 className="max-w-md text-4xl font-bold leading-tight">Every deadline, topic and study hour in one place.</h2>
          <ul className="mt-8 space-y-4 text-white/75">
            <li className="flex items-center gap-3"><ListChecks className="text-sky" />Track syllabus progress unit by unit</li>
            <li className="flex items-center gap-3"><CalendarCheck className="text-sky" />Smart plans built from your exams and deadlines</li>
            <li className="flex items-center gap-3"><Timer className="text-sky" />Focus sessions that grow your study streak</li>
          </ul>
        </div>
        <p className="text-sm text-white/40">Built for college students.</p>
      </div>
      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-bold">{title}</h1>
          <p className="mb-6 mt-1 text-muted">{subtitle}</p>
          {children}
          <p className="mt-6 text-center text-sm text-muted">{footer}</p>
        </div>
      </div>
    </div>
  );
}

export function Login() {
  const { login } = useAuth();
  const [f, setF] = useState({ email: '', password: '' });
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(f.email)) return setErr('Enter a valid email address');
    if (!f.password) return setErr('Enter your password');
    setBusy(true);
    try { await login(f.email, f.password); } catch (x) { setErr(x.message); setBusy(false); }
  };
  return (
    <Shell title="Welcome back" subtitle="Log in to pick up where you left off." footer={<>New to StudySphere? <Link className="font-semibold text-brand" to="/register">Create an account</Link></>}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Email"><input id="email" name="email" className="input" type="email" autoComplete="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
        <Field label="Password"><input id="password" name="password" className="input" type="password" autoComplete="current-password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></Field>
        <ErrorNote>{err}</ErrorNote>
        <button className="btn-primary w-full !py-2.5" disabled={busy} id="login-btn">{busy ? 'Logging in...' : 'Log in'}</button>
      </form>
    </Shell>
  );
}

export function Register() {
  const { register } = useAuth();
  const [f, setF] = useState({ name: '', email: '', password: '', college: '', department: '', semester: '', academic_year: '' });
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    if (f.name.trim().length < 2) return setErr('Enter your full name');
    if (!/^\S+@\S+\.\S+$/.test(f.email)) return setErr('Enter a valid email address');
    if (f.password.length < 6) return setErr('Password must be at least 6 characters');
    setBusy(true);
    try { await register(f); } catch (x) { setErr(x.message); setBusy(false); }
  };
  return (
    <Shell title="Create your account" subtitle="Set up your academic workspace in a minute." footer={<>Already registered? <Link className="font-semibold text-brand" to="/login">Log in</Link></>}>
      <form onSubmit={submit} className="space-y-3" noValidate>
        <Field label="Full name"><input name="name" className="input" value={f.name} onChange={set('name')} /></Field>
        <Field label="Email"><input name="email" className="input" type="email" value={f.email} onChange={set('email')} /></Field>
        <Field label="Password"><input name="password" className="input" type="password" autoComplete="new-password" value={f.password} onChange={set('password')} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="College"><input className="input" value={f.college} onChange={set('college')} /></Field>
          <Field label="Department"><input className="input" value={f.department} onChange={set('department')} /></Field>
          <Field label="Semester"><input className="input" value={f.semester} onChange={set('semester')} /></Field>
          <Field label="Academic year"><input className="input" placeholder="2026-27" value={f.academic_year} onChange={set('academic_year')} /></Field>
        </div>
        <ErrorNote>{err}</ErrorNote>
        <button className="btn-primary w-full !py-2.5" disabled={busy} id="register-btn">{busy ? 'Creating account...' : 'Create account'}</button>
      </form>
    </Shell>
  );
}
