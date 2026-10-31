import { BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import CrudPage from '../CrudPage';
import { useFetch } from '../hooks';
import { ItemActions, Progress } from '../ui';

const FIELDS = [
  { name: 'name', label: 'Subject name', required: true }, { name: 'code', label: 'Subject code' }, { name: 'teacher', label: 'Teacher' },
  { name: 'credits', label: 'Credits', type: 'number' }, { name: 'color', label: 'Colour', type: 'color', default: '#6D4AFF' },
  { name: 'description', label: 'Description', type: 'textarea' },
];

export default function Subjects() {
  const { data: syllabus } = useFetch('/academic/syllabus');
  const { data: assignments } = useFetch('/academic/assignments');
  const { data: exams } = useFetch('/academic/exams');
  const info = (id) => ({
    syl: (syllabus || []).find((s) => s.id === id),
    a: (assignments || []).filter((x) => x.subject_id === id && x.status !== 'completed').length,
    e: (exams || []).filter((x) => x.subject_id === id).length,
  });
  return (
    <CrudPage title="Subjects" subtitle="Everything for a course in one card: progress, work and exams." icon={BookOpen} endpoint="/academic/subjects"
      fields={FIELDS} search itemName="subject" layout="grid" emptyText="Add your subjects first, then attach assignments, exams and syllabus to them."
      renderItem={(s, c) => {
        const { syl, a, e } = info(s.id);
        return (
          <div className="card overflow-hidden">
            <div className="h-2" style={{ background: s.color }} />
            <div className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0"><h3 className="truncate text-lg font-semibold">{s.name}</h3><p className="text-sm text-muted">{[s.code, s.teacher].filter(Boolean).join(', ') || 'No details yet'}</p></div>
                <ItemActions c={c} />
              </div>
              {s.description && <p className="mt-2 line-clamp-2 text-sm text-muted">{s.description}</p>}
              <div className="mt-4">
                <div className="mb-1 flex justify-between text-xs text-muted"><span>Syllabus progress</span><span>{syl?.percent || 0}%</span></div>
                <Progress value={syl?.percent || 0} color={s.color} />
              </div>
              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-soft px-2.5 py-1">{a} open assignment{a === 1 ? '' : 's'}</span>
                <span className="rounded-full bg-soft px-2.5 py-1">{e} exam{e === 1 ? '' : 's'}</span>
                <Link to="/syllabus" className="rounded-full bg-brand/10 px-2.5 py-1 font-semibold text-brand">Open syllabus</Link>
              </div>
            </div>
          </div>
        );
      }} />
  );
}
