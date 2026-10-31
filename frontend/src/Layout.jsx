import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import { BarChart3, Bell, BookOpen, CalendarClock, CalendarDays, CheckCheck, ChevronsLeft, ClipboardList, FileText, Flame, History, LayoutDashboard,
  Lightbulb, ListChecks, LogOut, Menu, Moon, RefreshCw, Search, Settings, Sparkles, StickyNote, Sun, Target, Timer } from 'lucide-react';
import { api } from './api';
import { useAuth } from './auth';
import { cx } from './ui';

const NAV = [
  ['Overview', [['/', 'Dashboard', LayoutDashboard], ['/calendar', 'Calendar', CalendarDays]]],
  ['Academics', [['/subjects', 'Subjects', BookOpen], ['/assignments', 'Assignments', ClipboardList], ['/exams', 'Exams', FileText], ['/syllabus', 'Syllabus', ListChecks], ['/preparation', 'Exam prep', Target]]],
  ['Study', [['/planner', 'Study planner', CalendarClock], ['/focus', 'Focus mode', Timer], ['/goals', 'Goals and streak', Flame], ['/sessions', 'Session history', History], ['/notes', 'Notes', StickyNote]]],
  ['Insights', [['/analytics', 'Analytics', BarChart3], ['/insights', 'Productivity', Lightbulb], ['/assistant', 'AI assistant', Sparkles]]],
];

function Notifications() {
  const [open, setOpen] = useState(false);
  const [list, setList] = useState([]);
  const ref = useRef(null);
  const load = () => api('/notifications').then(setList).catch(() => {});
  const refresh = async () => { await api('/notifications/generate', { method: 'POST' }).catch(() => {}); load(); };
  useEffect(() => { refresh(); }, []);
  useEffect(() => {
    const h = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  const unread = list.filter((n) => !n.is_read).length;
  return (
    <div className="relative" ref={ref}>
      <button className="btn-plain relative !p-2" onClick={() => setOpen(!open)} aria-label="Notifications">
        <Bell size={20} />
        {unread > 0 && <span className="absolute right-0.5 top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-bad px-1 text-[10px] font-bold text-white">{unread}</span>}
      </button>
      {open && (
        <div className="card absolute right-0 z-40 mt-2 w-[min(92vw,360px)] overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <h3 className="font-semibold">Reminders</h3>
            <div className="flex gap-1">
              <button className="btn-plain !p-1.5" onClick={refresh} aria-label="Check for new reminders"><RefreshCw size={16} /></button>
              <button className="btn-plain !p-1.5" onClick={async () => { await api('/notifications/read-all', { method: 'POST' }); load(); }} aria-label="Mark all as read"><CheckCheck size={16} /></button>
            </div>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {list.length === 0 && <p className="p-6 text-center text-sm text-muted">You are all caught up.</p>}
            {list.slice(0, 20).map((n) => (
              <button key={n.id} className={cx('block w-full border-b border-line px-4 py-3 text-left last:border-0 hover:bg-soft/50', !n.is_read && 'bg-soft/40')}
                onClick={async () => { await api(`/notifications/${n.id}`, { method: 'PUT', body: { is_read: true } }); load(); }}>
                <div className="flex items-center gap-2 text-sm font-semibold">{!n.is_read && <span className="h-2 w-2 rounded-full bg-brand" />}{n.title}</div>
                <div className="text-sm text-muted">{n.message}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Layout() {
  const { user, setUser, logout } = useAuth();
  const nav = useNavigate();
  const [collapsed, setCollapsed] = useState(localStorage.getItem('ss_collapsed') === '1');
  const [mobile, setMobile] = useState(false);
  const [q, setQ] = useState('');
  const toggle = () => { const v = !collapsed; setCollapsed(v); localStorage.setItem('ss_collapsed', v ? '1' : '0'); };
  const flipTheme = async () => {
    const theme = user.theme === 'dark' ? 'light' : 'dark';
    setUser({ ...user, theme });
    api('/auth/me', { method: 'PUT', body: { theme } }).catch(() => {});
  };
  const initials = user.name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

  const side = (
    <aside className={cx('flex h-full flex-col bg-navy text-white transition-[width] duration-200', collapsed ? 'lg:w-[76px]' : 'lg:w-64', 'w-64')}>
      <div className="flex h-16 items-center gap-2.5 px-5">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand font-display text-lg font-bold">S</div>
        <span className={cx('font-display text-xl font-bold', collapsed && 'lg:hidden')}>StudySphere</span>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        {NAV.map(([group, items]) => (
          <div key={group} className="mb-3">
            <div className={cx('px-3 pb-1 pt-2 text-xs text-white/40', collapsed && 'lg:hidden')}>{group}</div>
            {items.map(([to, label, Icon]) => (
              <NavLink key={to} to={to} end={to === '/'} onClick={() => setMobile(false)} title={label}
                className={({ isActive }) => cx('mb-0.5 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive ? 'bg-brand text-white' : 'text-white/70 hover:bg-white/10 hover:text-white', collapsed && 'lg:justify-center')}>
                <Icon size={19} className="shrink-0" /><span className={cx(collapsed && 'lg:hidden')}>{label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
      <NavLink to="/settings" onClick={() => setMobile(false)} className={({ isActive }) => cx('mx-3 mb-3 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium', isActive ? 'bg-brand' : 'text-white/70 hover:bg-white/10', collapsed && 'lg:justify-center')}>
        <Settings size={19} /><span className={cx(collapsed && 'lg:hidden')}>Settings</span>
      </NavLink>
    </aside>
  );

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="hidden lg:block">{side}</div>
      {mobile && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-navy/60" onClick={() => setMobile(false)} />
          <div className="relative h-full w-64">{side}</div>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-line bg-surface px-3 sm:px-6">
          <button className="btn-plain !p-2 lg:hidden" onClick={() => setMobile(true)} aria-label="Open menu"><Menu size={20} /></button>
          <button className="btn-plain hidden !p-2 lg:inline-flex" onClick={toggle} aria-label="Collapse sidebar"><ChevronsLeft size={20} className={cx(collapsed && 'rotate-180')} /></button>
          <form className="relative max-w-md flex-1" onSubmit={(e) => { e.preventDefault(); if (q.trim()) nav('/search?q=' + encodeURIComponent(q.trim())); }}>
            <Search size={16} className="absolute left-3 top-2.5 text-muted" />
            <input className="input !rounded-full !pl-9" placeholder="Search subjects, assignments, notes..." value={q} onChange={(e) => setQ(e.target.value)} aria-label="Global search" />
          </form>
          <div className="ml-auto flex items-center gap-1">
            <button className="btn-plain !p-2" onClick={flipTheme} aria-label="Toggle theme">{user.theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}</button>
            <Notifications />
            <Link to="/settings" className="ml-1 grid h-9 w-9 place-items-center rounded-full bg-brand text-sm font-bold text-white" title={user.name}>{initials}</Link>
            <button className="btn-plain !p-2" onClick={logout} aria-label="Log out" title="Log out"><LogOut size={19} /></button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8"><div className="mx-auto max-w-6xl"><Outlet /></div></main>
      </div>
    </div>
  );
}
