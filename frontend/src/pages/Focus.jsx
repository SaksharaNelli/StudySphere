import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Coffee, Pause, Play, RotateCcw } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../auth';
import { useFetch } from '../hooks';
import { hm, today } from '../lib';
import { Card, Field, PageHeader, cx } from '../ui';

function beep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)(), o = ctx.createOscillator(), g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination); o.frequency.value = 660; g.gain.value = 0.15; o.start(); o.stop(ctx.currentTime + 0.6);
  } catch { /* audio not available */ }
}
const mmss = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

export default function Focus() {
  const { user } = useAuth();
  const set = user.settings || {};
  const [params] = useSearchParams();
  const { data: subjects } = useFetch('/academic/subjects');
  const { data: stats, reload: reloadStats } = useFetch('/sessions/stats');
  const { data: history, reload: reloadHist } = useFetch('/sessions?mode=focus');
  const [focusMin, setFocusMin] = useState(set.focus_minutes || 25);
  const [breakMin, setBreakMin] = useState(set.break_minutes || 5);
  const [mode, setMode] = useState('focus');
  const [left, setLeft] = useState((set.focus_minutes || 25) * 60);
  const [running, setRunning] = useState(false);
  const [cycles, setCycles] = useState(0);
  const [subject, setSubject] = useState(params.get('subject') || '');
  const [topic, setTopic] = useState(params.get('topic') || '');
  const [saved, setSaved] = useState('');
  const endRef = useRef(0);
  const L = useRef({}); L.current = { mode, focusMin, breakMin, subject, topic, cycles, long: set.long_break_minutes || 15 };

  const total = (mode === 'focus' ? focusMin : breakMin) * 60;
  const finish = async () => {
    const c = L.current; beep(); setRunning(false);
    if (c.mode === 'focus') {
      try { await api('/sessions', { method: 'POST', body: { subject_id: c.subject ? +c.subject : null, topic: c.topic || null, minutes: c.focusMin, session_date: today(), mode: 'focus' } }); setSaved(`Session saved: ${c.focusMin} minutes.`); reloadStats(); reloadHist(); } catch (e) { setSaved(e.message); }
      const n = c.cycles + 1; setCycles(n); setMode('break'); setLeft((n % 4 === 0 ? c.long : c.breakMin) * 60);
    } else { setMode('focus'); setLeft(c.focusMin * 60); }
  };
  useEffect(() => {
    if (!running) return;
    endRef.current = Date.now() + left * 1000;
    const id = setInterval(() => {
      const rem = Math.round((endRef.current - Date.now()) / 1000);
      if (rem <= 0) { clearInterval(id); finish(); } else setLeft(rem);
    }, 250);
    return () => clearInterval(id);
  }, [running]);
  useEffect(() => { document.title = running ? `${mmss(left)} StudySphere` : 'StudySphere'; return () => { document.title = 'StudySphere'; }; }, [left, running]);

  const reset = () => { setRunning(false); setMode('focus'); setLeft(focusMin * 60); };
  const applyMinutes = (kind, v) => {
    const n = Math.max(1, Math.min(180, +v || 1));
    if (kind === 'focus') { setFocusMin(n); if (!running && mode === 'focus') setLeft(n * 60); } else { setBreakMin(n); if (!running && mode === 'break') setLeft(n * 60); }
  };
  const R = 110, C = 2 * Math.PI * R, pct = 1 - left / total;
  const todays = (history || []).filter((h) => h.session_date === today());

  return (
    <div>
      <PageHeader title="Focus mode" subtitle="Work in focused blocks with short breaks. Finished blocks are saved to your history." />
      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="flex flex-col items-center p-6 lg:col-span-3">
          <div className="flex rounded-xl bg-soft p-1 text-sm font-semibold">
            <span className={cx('rounded-lg px-4 py-1', mode === 'focus' ? 'bg-surface text-brand shadow-card' : 'text-muted')}>Focus</span>
            <span className={cx('flex items-center gap-1 rounded-lg px-4 py-1', mode === 'break' ? 'bg-surface text-brand shadow-card' : 'text-muted')}><Coffee size={14} />Break</span>
          </div>
          <div className="relative my-6 h-64 w-64">
            <svg viewBox="0 0 260 260" className="h-full w-full -rotate-90">
              <circle cx="130" cy="130" r={R} fill="none" stroke="rgb(var(--c-soft))" strokeWidth="14" />
              <circle cx="130" cy="130" r={R} fill="none" strokeWidth="14" strokeLinecap="round" stroke={mode === 'focus' ? 'rgb(var(--c-brand))' : 'rgb(var(--c-sky))'}
                strokeDasharray={C} strokeDashoffset={C * (1 - pct)} style={{ transition: 'stroke-dashoffset .3s linear' }} />
            </svg>
            <div className="absolute inset-0 grid place-items-center text-center">
              <div><div className="font-display text-6xl font-bold tabular-nums" id="timer-display">{mmss(left)}</div><div className="text-sm text-muted">{mode === 'focus' ? 'Stay with one topic' : 'Step away from the screen'}</div></div>
            </div>
          </div>
          <div className="flex gap-3">
            <button className="btn-primary !px-6 !py-2.5" onClick={() => setRunning(!running)} id="timer-toggle">{running ? <><Pause size={18} />Pause</> : <><Play size={18} />{left < total ? 'Resume' : 'Start'}</>}</button>
            <button className="btn-ghost !py-2.5" onClick={reset}><RotateCcw size={16} />Reset</button>
          </div>
          {saved && <p className="mt-4 text-sm text-ok">{saved}</p>}
          <div className="mt-6 grid w-full max-w-md gap-3 sm:grid-cols-2">
            <Field label="Subject"><select className="input" value={subject} onChange={(e) => setSubject(e.target.value)}><option value="">General</option>{(subjects || []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></Field>
            <Field label="Topic"><input className="input" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="What are you studying?" /></Field>
            <Field label="Focus minutes"><input className="input" type="number" min="1" max="180" value={focusMin} onChange={(e) => applyMinutes('focus', e.target.value)} /></Field>
            <Field label="Break minutes"><input className="input" type="number" min="1" max="60" value={breakMin} onChange={(e) => applyMinutes('break', e.target.value)} /></Field>
          </div>
        </Card>
        <div className="space-y-4 lg:col-span-2">
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-4"><div className="text-xs text-muted">Today</div><div className="font-display text-2xl font-bold">{hm(stats?.todayMinutes || 0)}</div></Card>
            <Card className="p-4"><div className="text-xs text-muted">All-time study</div><div className="font-display text-2xl font-bold">{hm(stats?.totalMinutes || 0)}</div></Card>
            <Card className="p-4"><div className="text-xs text-muted">Blocks this visit</div><div className="font-display text-2xl font-bold">{cycles}</div></Card>
            <Card className="p-4"><div className="text-xs text-muted">Streak</div><div className="font-display text-2xl font-bold">{stats?.currentStreak || 0} days</div></Card>
          </div>
          <Card className="p-4">
            <h3 className="mb-3 font-semibold">Focus history</h3>
            {(history || []).length === 0 ? <p className="text-sm text-muted">Complete a focus block to see it here.</p> : (
              <ul className="space-y-2">{(history || []).slice(0, 6).map((h) => (
                <li key={h.id} className="flex items-center justify-between text-sm"><span className="truncate">{h.topic || 'Focus session'}</span><span className="ml-2 shrink-0 text-muted">{h.session_date === today() ? 'Today' : h.session_date}, {hm(h.minutes)}</span></li>))}</ul>
            )}
            {todays.length > 0 && <p className="mt-3 text-xs text-muted">{todays.length} focus block{todays.length === 1 ? '' : 's'} saved today.</p>}
          </Card>
        </div>
      </div>
    </div>
  );
}
