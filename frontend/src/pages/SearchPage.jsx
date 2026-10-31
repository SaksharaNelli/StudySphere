import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { api } from '../api';
import { fmtDate } from '../lib';
import { Badge, Card, Empty, ErrorNote, PageHeader, Spinner, cx } from '../ui';

const TYPES = { subjects: ['Subjects', '/subjects', (x) => x.name, (x) => [x.code, x.teacher].filter(Boolean).join(', ')], assignments: ['Assignments', '/assignments', (x) => x.title, (x) => `Due ${fmtDate(x.due_date)}`],
  exams: ['Exams', '/exams', (x) => x.title, (x) => fmtDate(x.exam_date)], topics: ['Syllabus topics', '/syllabus', (x) => x.title, (x) => (x.completed ? 'Completed' : 'Not completed')], notes: ['Notes', '/notes', (x) => x.title, (x) => (x.content || '').slice(0, 90)] };

export default function SearchPage() {
  const [params] = useSearchParams();
  const q = params.get('q') || '';
  const [on, setOn] = useState(Object.keys(TYPES));
  const [res, setRes] = useState(null); const [err, setErr] = useState('');
  useEffect(() => {
    setRes(null);
    api(`/search?q=${encodeURIComponent(q)}&types=${on.join(',')}`).then(setRes).catch((e) => setErr(e.message));
  }, [q, on]);
  const total = res ? Object.values(res).reduce((a, l) => a + l.length, 0) : 0;
  return (
    <div>
      <PageHeader title={q ? `Results for "${q}"` : 'Search'} subtitle="Search across subjects, assignments, exams, syllabus topics and notes." />
      <div className="mb-5 flex flex-wrap gap-2">
        {Object.entries(TYPES).map(([k, [label]]) => (
          <button key={k} onClick={() => setOn(on.includes(k) ? on.filter((x) => x !== k) : [...on, k])} className={cx('rounded-full border px-3 py-1.5 text-sm font-medium', on.includes(k) ? 'border-brand bg-brand text-white' : 'border-line bg-surface text-muted')}>{label}</button>
        ))}
      </div>
      <ErrorNote>{err}</ErrorNote>
      {!res && !err ? <Spinner /> : res && total === 0 ? <Empty icon={Search} title="No matches" text="Try a different word or turn on more filters." /> : res && (
        <div className="space-y-6">
          {Object.entries(res).filter(([, l]) => l.length).map(([k, list]) => (
            <section key={k}>
              <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-muted">{TYPES[k][0]}<Badge tone="muted">{list.length}</Badge></h2>
              <div className="grid gap-3 sm:grid-cols-2">{list.map((x) => (
                <Link key={x.id} to={TYPES[k][1]}><Card className="p-4 hover:border-brand"><div className="font-semibold">{TYPES[k][2](x)}</div><div className="mt-0.5 line-clamp-2 text-sm text-muted">{TYPES[k][3](x) || ' '}</div></Card></Link>))}</div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
