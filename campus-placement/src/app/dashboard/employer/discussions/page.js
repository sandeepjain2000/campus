'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { loadClarifications, saveAnswer } from '@/lib/demoClarifications';
import { ConvBubble, ConvThread } from '@/components/messaging/ConvBubble';

function companyFromSession(email, tenantName) {
  const e = (email || '').toLowerCase();
  const t = (tenantName || '').toLowerCase();
  if (e.includes('infosys') || t.includes('infosys')) return 'Infosys';
  if (e.includes('techcorp') || t.includes('techcorp')) return 'TechCorp';
  return null;
}

const collegeThreadsSeed = [
  {
    id: 1,
    campus: 'IIT Madras',
    topic: 'Interview panel availability for Oct 7',
    lastActivity: '3h ago',
    replies: [
      { by: 'TCS — Campus Hiring', text: 'Please confirm rooms A2/A3 are blocked for our morning panel.', role: 'company' },
      { by: 'IIT Madras Placement Cell', text: 'Confirmed. AV checklist shared separately.', role: 'college' },
    ],
  },
  {
    id: 2,
    campus: 'NIT Trichy',
    topic: 'Accessibility & specialization records export',
    lastActivity: 'Yesterday',
    replies: [
      { by: 'TCS — Campus Hiring', text: 'We need a CSV of shortlisted students with specialization for logistics planning.', role: 'company' },
      { by: 'NIT Trichy Placement Cell', text: 'Export will be shared via secure link before the visit.', role: 'college' },
    ],
  },
];

export default function EmployerDiscussionsPage() {
  const { data: session } = useSession();
  const [tab, setTab] = useState('clarifications');
  const [collegeThreads, setCollegeThreads] = useState(collegeThreadsSeed);
  const [activeCollegeId, setActiveCollegeId] = useState(collegeThreadsSeed[0].id);
  const [collegeReply, setCollegeReply] = useState('');
  const [searchCollege, setSearchCollege] = useState('');

  const [tick, setTick] = useState(0);
  const batchesAll = useMemo(() => loadClarifications().batches, [tick]);
  const myCompany = companyFromSession(session?.user?.email, session?.user?.tenantName);
  const batches = useMemo(() => {
    if (!myCompany) return batchesAll;
    return batchesAll.filter((b) => b.company === myCompany);
  }, [batchesAll, myCompany]);

  useEffect(() => {
    const on = () => setTick((t) => t + 1);
    window.addEventListener('clarifications-updated', on);
    return () => window.removeEventListener('clarifications-updated', on);
  }, []);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  const [answerDraft, setAnswerDraft] = useState({});

  const submitAnswer = (batchId, qId) => {
    const key = `${batchId}:${qId}`;
    const text = (answerDraft[key] || '').trim();
    if (!text) return;
    saveAnswer(batchId, qId, text, 'Recruitment Team');
    setAnswerDraft((d) => ({ ...d, [key]: '' }));
    refresh();
  };

  const visibleCollege = useMemo(() => {
    const q = searchCollege.trim().toLowerCase();
    if (!q) return collegeThreads;
    return collegeThreads.filter((t) => t.campus.toLowerCase().includes(q) || t.topic.toLowerCase().includes(q));
  }, [collegeThreads, searchCollege]);

  const activeCollege = collegeThreads.find((t) => t.id === activeCollegeId) || visibleCollege[0];

  const sendCollegeReply = () => {
    if (!collegeReply.trim() || !activeCollege) return;
    setCollegeThreads((prev) =>
      prev.map((t) =>
        t.id === activeCollege.id
          ? {
              ...t,
              replies: [...t.replies, { by: 'Recruitment Team', text: collegeReply.trim(), role: 'company' }],
              lastActivity: 'Just now',
            }
          : t,
      ),
    );
    setCollegeReply('');
  };

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div className="page-header-left">
          <h1>💬 Clarifications &amp; college discussions</h1>
          <p>
            <strong>Clarifications</strong>: committee on the <strong>left</strong>, your official replies on the <strong>right</strong>.{' '}
            <strong>Discussions</strong>: college messages on the <strong>left</strong>, your team on the <strong>right</strong>.
          </p>
        </div>
      </div>

      <div className="tabs" style={{ marginBottom: '1rem' }}>
        <button type="button" className={`tab ${tab === 'clarifications' ? 'active' : ''}`} onClick={() => setTab('clarifications')}>
          Clarifications (candidates)
        </button>
        <button type="button" className={`tab ${tab === 'college' ? 'active' : ''}`} onClick={() => setTab('college')}>
          Discussions (college)
        </button>
      </div>

      {tab === 'clarifications' ? (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {myCompany && (
            <p className="text-sm text-secondary" style={{ margin: 0 }}>
              Showing clarification batches for <strong>{myCompany}</strong> (demo filter from your account).
            </p>
          )}
          {!myCompany && (
            <p className="text-sm text-secondary" style={{ margin: 0 }}>
              Demo: showing all companies&apos; batches. Sign in as TechCorp or Infosys to see a filtered view.
            </p>
          )}
          {batches.map((batch) => (
            <div key={batch.id} className="card">
              <div style={{ textAlign: 'left', marginBottom: '0.65rem' }}>
                <span className="badge badge-indigo">{batch.company}</span>
                <div className="text-xs text-tertiary" style={{ marginTop: '0.35rem' }}>
                  {batch.postedAt}
                </div>
                <div className="text-sm text-secondary">Posted by: {batch.postedBy}</div>
              </div>
              <ConvThread>
                {batch.questions.map((q) => (
                  <div key={q.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <ConvBubble side="left" label="Placement committee" meta={batch.postedBy}>
                      {q.text}
                    </ConvBubble>
                    {q.answer ? (
                      <ConvBubble side="right" label={q.answeredBy || 'Recruitment Team'} meta="Official answer">
                        {q.answer}
                      </ConvBubble>
                    ) : (
                      <div className="conv-row conv-row--end">
                        <div className="conv-bubble conv-bubble--self" style={{ minWidth: 'min(100%, 20rem)' }}>
                          <div className="conv-bubble-label" style={{ color: 'rgba(255,255,255,0.9)' }}>
                            Your reply
                          </div>
                          <div className="conv-bubble-input">
                            <input
                              className="form-input"
                              placeholder="Official answer (one response)…"
                              value={answerDraft[`${batch.id}:${q.id}`] || ''}
                              onChange={(e) => setAnswerDraft((d) => ({ ...d, [`${batch.id}:${q.id}`]: e.target.value }))}
                            />
                            <button type="button" className="btn btn-secondary btn-sm" onClick={() => submitAnswer(batch.id, q.id)}>
                              Post
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </ConvThread>
            </div>
          ))}
        </div>
      ) : (
        <div className="card" style={{ display: 'grid', gridTemplateColumns: 'minmax(260px, 320px) 1fr', gap: '1rem' }}>
          <div style={{ borderRight: '1px solid var(--border-default)', paddingRight: '1rem' }}>
            <input className="form-input" placeholder="Search campus or topic…" value={searchCollege} onChange={(e) => setSearchCollege(e.target.value)} />
            <div style={{ marginTop: '0.75rem', display: 'grid', gap: '0.5rem' }}>
              {visibleCollege.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className="btn btn-ghost"
                  style={{
                    justifyContent: 'space-between',
                    border: activeCollegeId === t.id ? '1px solid var(--primary-500)' : '1px solid var(--border-default)',
                    textAlign: 'left',
                  }}
                  onClick={() => setActiveCollegeId(t.id)}
                >
                  <span>
                    <span className="badge badge-blue">{t.campus}</span>
                    <div className="text-sm" style={{ marginTop: '0.25rem' }}>
                      {t.topic}
                    </div>
                  </span>
                  <span className="badge badge-gray">{t.replies.length}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            {activeCollege ? (
              <>
                <span className="badge badge-blue">{activeCollege.campus}</span>
                <h3 style={{ marginTop: '0.5rem' }}>{activeCollege.topic}</h3>
                <div className="text-sm text-secondary">Last activity: {activeCollege.lastActivity}</div>
                <ConvThread>
                  {activeCollege.replies.map((r, idx) => (
                    <ConvBubble
                      key={`${activeCollege.id}-${idx}`}
                      side={r.role === 'company' ? 'right' : 'left'}
                      label={r.role === 'company' ? 'Your organisation' : 'College'}
                      meta={r.by}
                    >
                      {r.text}
                    </ConvBubble>
                  ))}
                </ConvThread>
                <div style={{ marginTop: '1rem' }} className="conv-row conv-row--end">
                  <div className="conv-bubble conv-bubble--self" style={{ minWidth: 'min(100%, 22rem)' }}>
                    <div className="conv-bubble-label" style={{ color: 'rgba(255,255,255,0.9)' }}>
                      Your reply
                    </div>
                    <div className="conv-bubble-input">
                      <input
                        className="form-input"
                        placeholder="Reply to college…"
                        value={collegeReply}
                        onChange={(e) => setCollegeReply(e.target.value)}
                      />
                      <button type="button" className="btn btn-secondary btn-sm" onClick={sendCollegeReply}>
                        Send
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-sm text-tertiary">No thread selected.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
