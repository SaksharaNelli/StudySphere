import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { api } from '../api';
import { useFetch } from '../hooks';
import { Badge, Card, ErrorNote, Field, PageHeader } from '../ui';

const TASKS = [['explain', 'Explain a concept'], ['summarize', 'Summarize my notes'], ['practice', 'Practice questions'], ['syllabus', 'Break down a syllabus'], ['revision', 'Revision plan']];

export default function Assistant() {
  const { data: subjects } = useFetch('/academic/subjects');
  const [task, setTask] = useState('explain');
  const [subject, setSubject] = useState('');
  const [text, setText] = useState('');
  const [res, setRes] = useState(null);
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const ask = async (e) => {
    e.preventDefault(); setBusy(true); setErr('');
    try { setRes(await api('/ai/ask', { method: 'POST', body: { task, text, subject } })); } catch (x) { setErr(x.message); } finally { setBusy(false); }
  };
  return (
    <div>
      <PageHeader title="AI study assistant" subtitle="Explanations, summaries, practice questions and revision ideas." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <form onSubmit={ask} className="space-y-4">
            <div className="flex flex-wrap gap-2">{TASKS.map(([k, l]) => <button type="button" key={k} onClick={() => setTask(k)} className={`rounded-full border px-3 py-1.5 text-sm font-medium ${task === k ? 'border-brand bg-brand text-white' : 'border-line hover:border-brand'}`}>{l}</button>)}</div>
            <Field label="Subject (optional)"><select className="input" value={subject} onChange={(e) => setSubject(e.target.value)}><option value="">Any</option>{(subjects || []).map((s) => <option key={s.id}>{s.name}</option>)}</select></Field>
            <Field label={task === 'summarize' ? 'Paste your notes' : 'Topic or question'}><textarea id="ai-input" className="input min-h-[160px]" value={text} onChange={(e) => setText(e.target.value)} placeholder="For example: How does the two-phase locking protocol work?" /></Field>
            <ErrorNote>{err}</ErrorNote>
            <button className="btn-primary" disabled={busy}><Sparkles size={16} />{busy ? 'Thinking...' : 'Ask assistant'}</button>
          </form>
        </Card>
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-bold">Answer</h2>{res && <Badge tone={res.source === 'claude' ? 'ok' : 'muted'}>{res.source === 'claude' ? 'AI-generated' : 'Offline mode'}</Badge>}</div>
          {res ? <div className="whitespace-pre-wrap text-sm leading-relaxed">{res.answer}</div> : <p className="text-sm text-muted">Your answer will appear here. Without an API key the assistant gives simple template answers; add ANTHROPIC_API_KEY to .env for full AI responses.</p>}
          {res?.warning && <p className="mt-3 text-xs text-warn">AI request failed ({res.warning}), so this is an offline answer.</p>}
        </Card>
      </div>
    </div>
  );
}
