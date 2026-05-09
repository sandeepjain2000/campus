'use client';

import { useCallback, useEffect, useState } from 'react';
import { CLARIFICATION_RULES, loadClarifications, publishClarificationBatch } from '@/lib/demoClarifications';
import { ConvBubble, ConvThread } from '@/components/messaging/ConvBubble';
import { useToast } from '@/components/ToastProvider';

export default function StudentClarificationsPage() {
  const [data, setData] = useState({ batches: [] });
  const { addToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [questionText, setQuestionText] = useState('');

  const refresh = useCallback(async () => {
    try {
      const payload = await loadClarifications();
      setData(payload);
    } catch {
      setData({ batches: [] });
    }
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => {
      void refresh();
    }, 0);
    return () => window.clearTimeout(t);
  }, [refresh]);

  const handlePostQuestion = async (e) => {
    e.preventDefault();
    if (!companyName.trim() || !questionText.trim()) return;

    setIsSubmitting(true);
    try {
      await publishClarificationBatch({
        company: companyName,
        postedBy: 'Student',
        questionTexts: [questionText],
      });
      setCompanyName('');
      setQuestionText('');
      addToast('Question posted successfully!', 'success');
      void refresh();
    } catch (err) {
      addToast(err.message || 'Failed to post question', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <div className="page-header-left">
          <h1>❓ Clarifications (companies)</h1>
          <p>
            Post questions for specific companies. 
            Further detail happens during the in-person visit.
          </p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: 600 }}>Post a Question</h3>
        <form onSubmit={handlePostQuestion} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label className="block text-sm font-medium" style={{ marginBottom: '0.25rem' }}>
              Company Name
            </label>
            <input
              type="text"
              className="form-input"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. Acme Corp"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium" style={{ marginBottom: '0.25rem' }}>
              Your Question
            </label>
            <textarea
              className="form-input"
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="Type your question here..."
              rows={3}
              required
              style={{ resize: 'vertical' }}
            />
          </div>
          <div>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting || !companyName.trim() || !questionText.trim()}>
              {isSubmitting ? 'Posting...' : 'Post Question'}
            </button>
          </div>
        </form>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 600 }}>Discussions</h3>
        {data.batches.length === 0 ? (
          <p className="text-secondary text-sm">No clarification threads found.</p>
        ) : (
          data.batches.map((batch) => (
            <details key={batch.id} className="card" style={{ cursor: 'pointer' }}>
              <summary style={{ outline: 'none' }} className="flex justify-between items-center w-full">
                <div style={{ textAlign: 'left' }}>
                  <div className="font-semibold">{batch.company}</div>
                  <div className="text-sm text-secondary">Posted by: {batch.postedBy}</div>
                </div>
                <div className="text-xs text-tertiary flex items-center gap-2">
                  <span>{batch.postedAt}</span>
                  <span>•</span>
                  <span>{batch.questions.length} question{batch.questions.length !== 1 ? 's' : ''}</span>
                  <span className="text-primary-500 font-medium ml-2">Expand ▾</span>
                </div>
              </summary>

              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--gray-200)', cursor: 'default' }}>
                <ConvThread>
                  {batch.questions.map((q) => (
                    <div key={q.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <ConvBubble side="left" label="Question" meta={batch.postedBy}>
                        {q.text}
                      </ConvBubble>
                      {q.answer ? (
                        <ConvBubble side="right" label={q.answeredBy || batch.company} meta="Official answer">
                          {q.answer}
                        </ConvBubble>
                      ) : (
                        <div className="conv-row conv-row--end">
                          <div className="conv-bubble conv-bubble--peer" style={{ maxWidth: '12rem', fontSize: '0.8125rem' }}>
                            Awaiting company response.
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </ConvThread>
              </div>
            </details>
          ))
        )}
      </div>
    </div>
  );
}
