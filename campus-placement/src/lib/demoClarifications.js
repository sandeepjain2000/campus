/**
 * Demo-only shared store for student–company clarifications (sessionStorage).
 * Max 5 questions per batch; TPO / Placement Committee publishes; companies answer once.
 */

const KEY = 'placementhub_demo_clarifications_v1';

const defaultPayload = () => ({
  batches: [
    {
      id: 'b-seed-1',
      company: 'TCS',
      postedBy: 'IIT Madras — Placement Committee',
      postedAt: '2026-09-08',
      questions: [
        { id: 'q1', text: 'What is the joining timeline for campus hires?', answer: 'July 2027 for selected candidates, subject to degree completion.', answeredBy: 'TCS Recruitment' },
        { id: 'q2', text: 'Will internship performance be considered for PPO?', answer: 'Yes; managers submit a structured evaluation before the PPO panel.', answeredBy: 'TCS Recruitment' },
        { id: 'q3', text: 'Is there a bond or service agreement?', answer: 'Standard service agreement details are shared in the offer pack after selection.', answeredBy: 'TCS Recruitment' },
      ],
    },
    {
      id: 'b-seed-2',
      company: 'Infosys',
      postedBy: 'IIT Madras — TPO',
      postedAt: '2026-09-12',
      questions: [
        { id: 'q4', text: 'Are system design topics in scope for the specialist track?', answer: '', answeredBy: '' },
        { id: 'q5', text: 'What is the window for online assessments?', answer: '', answeredBy: '' },
      ],
    },
    {
      id: 'b-seed-3',
      company: 'TechCorp',
      postedBy: 'IIT Madras — Placement Committee',
      postedAt: '2026-09-14',
      questions: [
        { id: 'q6', text: 'Is work-from-office mandatory in Year 1?', answer: '', answeredBy: '' },
      ],
    },
  ],
});

export function loadClarifications() {
  if (typeof window === 'undefined') return defaultPayload();
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return defaultPayload();
    const parsed = JSON.parse(raw);
    if (!parsed?.batches) return defaultPayload();
    return parsed;
  } catch {
    return defaultPayload();
  }
}

export function saveClarifications(payload) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(KEY, JSON.stringify(payload));
}

export function publishClarificationBatch({ company, postedBy, questionTexts }) {
  const trimmed = questionTexts.map((t) => t.trim()).filter(Boolean).slice(0, 5);
  if (!trimmed.length) return loadClarifications();
  const p = loadClarifications();
  const id = `b-${Date.now()}`;
  const batch = {
    id,
    company,
    postedBy,
    postedAt: new Date().toISOString().slice(0, 10),
    questions: trimmed.map((text, i) => ({
      id: `q-${id}-${i}`,
      text,
      answer: '',
      answeredBy: '',
    })),
  };
  p.batches = [batch, ...p.batches];
  saveClarifications(p);
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('clarifications-updated'));
  return p;
}

export function saveAnswer(batchId, questionId, answer, answeredBy) {
  const p = loadClarifications();
  const b = p.batches.find((x) => x.id === batchId);
  if (!b) return p;
  const q = b.questions.find((x) => x.id === questionId);
  if (!q) return p;
  q.answer = answer.trim();
  q.answeredBy = answeredBy.trim();
  saveClarifications(p);
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('clarifications-updated'));
  return p;
}

export const CLARIFICATION_RULES = {
  maxQuestions: 5,
};
