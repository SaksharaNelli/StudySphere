import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Lightbulb } from 'lucide-react';
import { useFetch } from '../hooks';
import { Badge, Card, ErrorNote, PageHeader, Progress, Spinner } from '../ui';

const BORDER = { bad: 'border-l-bad', warn: 'border-l-warn', sky: 'border-l-sky', ok: 'border-l-ok' };
const tick = { fill: 'rgb(var(--c-muted))', fontSize: 12 };

export default function Insights() {
  const { data: d, error } = useFetch('/analytics/overview');
  if (error) return <ErrorNote>{error}</ErrorNote>;
  if (!d) return <Spinner />;
  const needs = [...d.syllabusProgress].filter((s) => s.total > 0).sort((a, b) => a.percent - b.percent).slice(0, 3);
  return (
    <div>
      <PageHeader title="Productivity insights" subtitle="What needs attention this week, based on your own data." />
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-3 lg:col-span-3">
          {d.insights.map((i, n) => (
            <Card key={n} className={`flex gap-3 border-l-4 p-4 ${BORDER[i.tone] || ''}`}>
              <Lightbulb size={20} className="mt-0.5 shrink-0 text-brand" />
              <div><h3 className="font-semibold">{i.title}</h3><p className="text-sm text-muted">{i.text}</p></div>
            </Card>
          ))}
        </div>
        <div className="space-y-6 lg:col-span-2">
          <Card className="p-5">
            <h2 className="mb-3 text-lg font-bold">Weekly study summary</h2>
            <div className="flex items-end gap-3"><span className="font-display text-4xl font-bold text-brand">{d.weekly.hours}h</span><span className="pb-1 text-sm text-muted">last 7 days (previous: {d.weekly.previousHours}h)</span></div>
          </Card>
          <Card className="p-5">
            <h2 className="mb-3 text-lg font-bold">Needs more preparation</h2>
            <div className="space-y-4">{needs.map((s) => <div key={s.subject}><div className="mb-1 flex justify-between text-sm"><span className="font-medium">{s.subject}</span><Badge tone={s.percent < 40 ? 'bad' : 'warn'}>{s.percent}%</Badge></div><Progress value={s.percent} color={s.color} /></div>)}{!needs.length && <p className="text-sm text-muted">Add syllabus topics to see this.</p>}</div>
          </Card>
        </div>
        <Card className="p-5 lg:col-span-5">
          <h2 className="mb-1 text-lg font-bold">Workload for the next 7 days</h2><p className="mb-3 text-sm text-muted">Assignments due and exams per day.</p>
          <div className="h-56"><ResponsiveContainer><BarChart data={d.workload}><CartesianGrid vertical={false} stroke="rgb(var(--c-line))" /><XAxis dataKey="label" tick={tick} axisLine={false} tickLine={false} /><YAxis allowDecimals={false} tick={tick} axisLine={false} tickLine={false} width={24} /><Tooltip contentStyle={{ borderRadius: 12 }} />
            <Bar dataKey="assignments" name="Assignments due" stackId="a" fill="#5B9DFF" /><Bar dataKey="exams" name="Exams" stackId="a" fill="#6D4AFF" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div>
        </Card>
      </div>
    </div>
  );
}
