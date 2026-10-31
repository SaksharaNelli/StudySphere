import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useFetch } from '../hooks';
import { Card, ErrorNote, PageHeader, Spinner } from '../ui';

const tick = { fill: 'rgb(var(--c-muted))', fontSize: 12 };
const tip = { contentStyle: { borderRadius: 12, border: '1px solid rgb(var(--c-line))' } };
const short = (s) => new Date(s + 'T00:00:00').toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

export default function Analytics() {
  const { data: d, error } = useFetch('/analytics/overview');
  if (error) return <ErrorNote>{error}</ErrorNote>;
  if (!d) return <Spinner />;
  const a = d.assignmentStats;
  const pie = [['Completed', a.completed, '#2FB67C'], ['Pending', a.pending, '#5B9DFF'], ['Overdue', a.overdue, '#E5576B']].map(([name, value, color]) => ({ name, value, color }));
  return (
    <div>
      <PageHeader title="Academic analytics" subtitle="Assignments, study hours, syllabus and exam readiness at a glance." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-1 text-lg font-bold">Assignment completion</h2><p className="mb-2 text-sm text-muted">{a.completionRate}% of {a.total} assignments completed</p>
          <div className="h-56"><ResponsiveContainer><PieChart><Pie data={pie} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>{pie.map((p) => <Cell key={p.name} fill={p.color} />)}</Pie><Tooltip {...tip} /></PieChart></ResponsiveContainer></div>
          <div className="flex justify-center gap-4 text-xs text-muted">{pie.map((p) => <span key={p.name} className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full" style={{ background: p.color }} />{p.name} ({p.value})</span>)}</div>
        </Card>
        <Card className="p-5">
          <h2 className="mb-1 text-lg font-bold">Study hours, last 14 days</h2><p className="mb-2 text-sm text-muted">{d.weekly.hours}h this week, {d.weekly.previousHours}h the week before</p>
          <div className="h-64"><ResponsiveContainer><BarChart data={d.hoursByDay.map((x) => ({ ...x, day: short(x.date) }))}><CartesianGrid vertical={false} stroke="rgb(var(--c-line))" /><XAxis dataKey="day" tick={tick} axisLine={false} tickLine={false} interval={1} /><YAxis tick={tick} axisLine={false} tickLine={false} width={28} /><Tooltip {...tip} formatter={(v) => [`${v} h`, 'Studied']} /><Bar dataKey="hours" fill="#6D4AFF" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div>
        </Card>
        <Card className="p-5">
          <h2 className="mb-3 text-lg font-bold">Syllabus progress by subject</h2>
          <div className="h-64"><ResponsiveContainer><BarChart layout="vertical" data={d.syllabusProgress}><CartesianGrid horizontal={false} stroke="rgb(var(--c-line))" /><XAxis type="number" domain={[0, 100]} tick={tick} axisLine={false} tickLine={false} /><YAxis type="category" dataKey="subject" tick={tick} width={110} axisLine={false} tickLine={false} /><Tooltip {...tip} formatter={(v) => [`${v}%`, 'Complete']} /><Bar dataKey="percent" radius={[0, 6, 6, 0]}>{d.syllabusProgress.map((s) => <Cell key={s.subject} fill={s.color} />)}</Bar></BarChart></ResponsiveContainer></div>
        </Card>
        <Card className="p-5">
          <h2 className="mb-3 text-lg font-bold">Subject-wise productivity</h2>
          {d.subjectProductivity.length === 0 ? <p className="py-16 text-center text-sm text-muted">Log study sessions to see where your time goes.</p> : (
            <div className="h-64"><ResponsiveContainer><BarChart data={d.subjectProductivity}><CartesianGrid vertical={false} stroke="rgb(var(--c-line))" /><XAxis dataKey="subject" tick={tick} axisLine={false} tickLine={false} tickFormatter={(s) => (s.length > 10 ? s.slice(0, 9) + '...' : s)} /><YAxis tick={tick} axisLine={false} tickLine={false} width={28} /><Tooltip {...tip} formatter={(v) => [`${v} h`, 'Studied']} /><Bar dataKey="hours" radius={[6, 6, 0, 0]}>{d.subjectProductivity.map((s) => <Cell key={s.subject} fill={s.color} />)}</Bar></BarChart></ResponsiveContainer></div>
          )}
        </Card>
        <Card className="p-5 lg:col-span-2">
          <h2 className="mb-3 text-lg font-bold">Examination readiness</h2>
          {d.examReadiness.length === 0 ? <p className="text-sm text-muted">No upcoming exams.</p> : (
            <div className="h-60"><ResponsiveContainer><BarChart data={d.examReadiness}><CartesianGrid vertical={false} stroke="rgb(var(--c-line))" /><XAxis dataKey="title" tick={tick} axisLine={false} tickLine={false} /><YAxis domain={[0, 100]} tick={tick} axisLine={false} tickLine={false} width={32} /><Tooltip {...tip} formatter={(v, n, p) => [`${v}% ready, ${p.payload.daysLeft} days left`, p.payload.subject]} /><Bar dataKey="readiness" fill="#5B9DFF" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div>
          )}
        </Card>
      </div>
    </div>
  );
}
