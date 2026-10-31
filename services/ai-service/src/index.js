require('./env');
const express = require('express');
const { requireAuth } = require('./auth');

const PORT = process.env.PORT || 4008;
const KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = process.env.AI_MODEL || 'claude-sonnet-5-5';
const app = express();
app.use(express.json({ limit: '1mb' }));
app.get('/health', (q, r) => r.json({ service: 'ai-service', status: 'ok', mode: KEY ? 'claude' : 'offline' }));

const PROMPTS = {
  explain: 'Explain this concept clearly to a college student with a simple example, then list 3 key points.',
  summarize: 'Summarize these notes into concise revision bullet points.',
  practice: 'Write 5 practice questions (mixed difficulty) with short model answers on this topic.',
  syllabus: 'Break this subject or topic into units and topics suitable for a semester syllabus tracker.',
  revision: 'Suggest a focused 3-day revision plan for this topic with specific tasks.',
};

// Offline fallback so the module works without an API key.
function offline(task, text) {
  const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean);
  const head = text.length > 60 ? text.slice(0, 60) + '...' : text;
  switch (task) {
    case 'summarize': return (sentences.length ? sentences.slice(0, 5) : [text]).map((s) => `- ${s}`).join('\n');
    case 'practice': return [`1. Define "${head}" in your own words.`, `2. Give a real-world example of "${head}".`, `3. What are the advantages and limitations of "${head}"?`,
      `4. Compare "${head}" with a related concept.`, `5. Write a short answer on how "${head}" is applied in practice.`].join('\n');
    case 'syllabus': return [`Unit 1: Foundations of ${head}`, '- Definitions and terminology', '- Core principles', `Unit 2: Techniques in ${head}`, '- Methods and algorithms', '- Worked examples', 'Unit 3: Applications and revision', '- Case studies', '- Previous-year questions'].join('\n');
    case 'revision': return ['Day 1: Read your notes and list every definition and formula.', 'Day 2: Solve practice questions without looking at notes.', 'Day 3: Re-attempt mistakes and teach the topic aloud.'].join('\n');
    default: return `Start with the idea behind "${head}": what problem it solves and where it is used.\n\nThen work through one small example by hand, and finish by restating the concept in one sentence.\n\n(Add ANTHROPIC_API_KEY to .env for detailed AI explanations.)`;
  }
}

app.post('/ask', requireAuth, async (req, res) => {
  const { task = 'explain', text = '', subject = '' } = req.body || {};
  if (!text.trim()) return res.status(400).json({ error: 'Enter a topic or paste some notes first' });
  if (!PROMPTS[task]) return res.status(400).json({ error: 'Unknown task' });
  if (!KEY) return res.json({ answer: offline(task, text.trim()), source: 'offline' });
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: MODEL, max_tokens: 1000, system: 'You are StudySphere, a concise, friendly study assistant for college students. Use plain text and short lists.',
        messages: [{ role: 'user', content: `${PROMPTS[task]}${subject ? `\nSubject: ${subject}` : ''}\n\n${text}` }] }),
    });
    const j = await r.json();
    if (!r.ok) throw new Error(j.error?.message || 'AI request failed');
    res.json({ answer: j.content.map((c) => c.text || '').join('\n'), source: 'claude' });
  } catch (e) {
    res.json({ answer: offline(task, text.trim()), source: 'offline', warning: e.message });
  }
});

app.use((err, req, res, next) => { console.error(err); res.status(500).json({ error: err.message || 'Something went wrong' }); });
app.listen(PORT, () => console.log(`ai-service on :${PORT} (${KEY ? 'claude' : 'offline'} mode)`));
