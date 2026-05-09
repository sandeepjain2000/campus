'use client';

import { useCallback, useEffect, useState } from 'react';
import { loadClarifications, publishClarificationBatch } from '@/lib/demoClarifications';
import { useToast } from '@/components/ToastProvider';
import {
  Search,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Building2,
  Download,
  FileText,
  Lightbulb,
  Plus,
  X,
} from 'lucide-react';

export default function StudentClarificationsPage() {
  const [data, setData] = useState({ batches: [] });
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState('');
  const [openBatchIds, setOpenBatchIds] = useState(new Set());
  const [showPostForm, setShowPostForm] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addToast } = useToast();

  const refresh = useCallback(async () => {
    try {
      const payload = await loadClarifications();
      setData(payload);
    } catch {
      setData({ batches: [] });
    }
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(t);
  }, [refresh]);

  useEffect(() => {
    const q = search.trim().toLowerCase();
    setFiltered(
      q
        ? data.batches.filter(
            (b) =>
              b.company.toLowerCase().includes(q) ||
              b.questions.some((qn) => qn.text.toLowerCase().includes(q)),
          )
        : data.batches,
    );
  }, [search, data.batches]);

  const toggleBatch = (id) => {
    setOpenBatchIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

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
      setShowPostForm(false);
      addToast('Question posted successfully!', 'success');
      void refresh();
    } catch (err) {
      addToast(err.message || 'Failed to post question', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const exportAsText = (batch) => {
    const lines = [`Clarifications — ${batch.company}`, `Posted by: ${batch.postedBy}`, `Date: ${batch.postedAt}`, ''];
    batch.questions.forEach((q, i) => {
      lines.push(`Q${i + 1}: ${q.text}`);
      lines.push(`A: ${q.answer || 'Awaiting company response.'}`);
      lines.push('');
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${batch.company.replace(/\s+/g, '_')}_clarifications.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportAsCsv = (batch) => {
    const rows = [['Question', 'Answer', 'Answered By']];
    batch.questions.forEach((q) => {
      rows.push([`"${q.text}"`, `"${q.answer || 'Awaiting response'}"`, `"${q.answeredBy || ''}"`]);
    });
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${batch.company.replace(/\s+/g, '_')}_clarifications.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="animate-fadeIn" style={{ maxWidth: '860px', margin: '0 auto' }}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div className="page-header-left" style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '50%',
              background: 'var(--primary-100)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <MessageSquare size={18} color="var(--primary-600)" />
            </div>
            <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>Clarifications</h1>
          </div>
          <p className="text-secondary" style={{ margin: 0, fontSize: '0.9rem' }}>
            Ask questions about specific companies. Answers will be provided by the company or Placement Office.
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowPostForm((v) => !v)}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}
        >
          {showPostForm ? <X size={16} /> : <Plus size={16} />}
          {showPostForm ? 'Cancel' : 'Post Question'}
        </button>
      </div>

      {/* Post Question Form */}
      {showPostForm && (
        <div className="card" style={{ marginBottom: '1.5rem', borderLeft: '4px solid var(--primary-500)' }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 600 }}>New Question</h3>
          <form onSubmit={handlePostQuestion} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label className="form-label">Company Name</label>
              <div style={{ position: 'relative' }}>
                <Building2 size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
                <input
                  type="text"
                  className="form-input"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Google, Acme Corp"
                  required
                  style={{ paddingLeft: '2.25rem' }}
                />
              </div>
            </div>
            <div>
              <label className="form-label">Your Question</label>
              <textarea
                className="form-input"
                value={questionText}
                onChange={(e) => setQuestionText(e.target.value)}
                placeholder="What would you like to know about this company's process, role, or requirements?"
                rows={3}
                required
                style={{ resize: 'vertical' }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowPostForm(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={isSubmitting || !companyName.trim() || !questionText.trim()}>
                {isSubmitting ? 'Posting...' : 'Post Question'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search Filter */}
      <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
        <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)', pointerEvents: 'none' }} />
        <input
          type="text"
          className="form-input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search companies or questions…"
          style={{ paddingLeft: '2.5rem', borderRadius: '999px', background: 'var(--surface-2)' }}
        />
      </div>

      {/* Company Accordion List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {filtered.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--gray-400)' }}>
            <MessageSquare size={32} style={{ marginBottom: '0.75rem', opacity: 0.4 }} />
            <p style={{ margin: 0 }}>No clarification threads found{search ? ` for "${search}"` : ''}.</p>
          </div>
        ) : (
          filtered.map((batch) => {
            const isOpen = openBatchIds.has(batch.id);
            const answeredCount = batch.questions.filter((q) => q.answer).length;
            return (
              <div
                key={batch.id}
                className="card"
                style={{
                  padding: 0,
                  overflow: 'hidden',
                  border: isOpen ? '1px solid var(--primary-300)' : '1px solid var(--gray-200)',
                  transition: 'border-color 0.2s',
                }}
              >
                {/* Accordion Header */}
                <button
                  onClick={() => toggleBatch(batch.id)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: '1rem',
                    padding: '1rem 1.25rem', background: 'none', border: 'none',
                    cursor: 'pointer', textAlign: 'left',
                    background: isOpen ? 'var(--primary-50)' : 'var(--surface)',
                    transition: 'background 0.2s',
                  }}
                >
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '10px',
                    background: 'var(--primary-100)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', flexShrink: 0,
                  }}>
                    <Building2 size={18} color="var(--primary-600)" />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--gray-900)', marginBottom: '0.2rem' }}>
                      {batch.company}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>
                      Posted by {batch.postedBy} · {batch.postedAt}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                    <span style={{
                      padding: '0.2rem 0.7rem', borderRadius: '999px',
                      background: 'var(--gray-100)', color: 'var(--gray-600)',
                      fontSize: '0.78rem', fontWeight: 500,
                    }}>
                      {batch.questions.length} Question{batch.questions.length !== 1 ? 's' : ''}
                    </span>
                    {answeredCount > 0 && (
                      <span style={{
                        padding: '0.2rem 0.7rem', borderRadius: '999px',
                        background: 'var(--success-100, #dcfce7)', color: 'var(--success-700, #15803d)',
                        fontSize: '0.78rem', fontWeight: 500,
                      }}>
                        {answeredCount} Answered
                      </span>
                    )}
                    {isOpen ? <ChevronUp size={18} color="var(--primary-600)" /> : <ChevronDown size={18} color="var(--gray-400)" />}
                  </div>
                </button>

                {/* Expanded Content */}
                {isOpen && (
                  <div style={{ padding: '1.25rem', borderTop: '1px solid var(--gray-200)', background: 'var(--surface)' }}>
                    {/* Export Row */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginBottom: '1.25rem' }}>
                      <button
                        className="btn btn-secondary"
                        style={{ fontSize: '0.8rem', padding: '0.35rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                        onClick={() => exportAsText(batch)}
                      >
                        <FileText size={14} /> Export as Text
                      </button>
                      <button
                        className="btn btn-secondary"
                        style={{ fontSize: '0.8rem', padding: '0.35rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                        onClick={() => exportAsCsv(batch)}
                      >
                        <Download size={14} /> Export as CSV
                      </button>
                    </div>

                    {/* Q&A Thread */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                      {batch.questions.map((q, idx) => (
                        <div key={q.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          {/* Question */}
                          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                            <div style={{
                              width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                              background: 'var(--gray-200)', display: 'flex', alignItems: 'center',
                              justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: 'var(--gray-600)',
                            }}>
                              Q{idx + 1}
                            </div>
                            <div style={{
                              flex: 1, background: 'var(--gray-50)', border: '1px solid var(--gray-200)',
                              borderRadius: '0 12px 12px 12px', padding: '0.75rem 1rem',
                            }}>
                              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--gray-500)', marginBottom: '0.3rem' }}>
                                {batch.postedBy}
                              </div>
                              <div style={{ fontSize: '0.9rem', color: 'var(--gray-800)', lineHeight: '1.5' }}>{q.text}</div>
                            </div>
                          </div>

                          {/* Answer */}
                          {q.answer ? (
                            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', paddingLeft: '2rem' }}>
                              <div style={{
                                flex: 1, background: 'var(--primary-50)', border: '1px solid var(--primary-200)',
                                borderRadius: '12px 12px 12px 0', padding: '0.75rem 1rem',
                              }}>
                                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--primary-600)', marginBottom: '0.3rem' }}>
                                  {q.answeredBy || batch.company} · Official Answer
                                </div>
                                <div style={{ fontSize: '0.9rem', color: 'var(--gray-800)', lineHeight: '1.5' }}>{q.answer}</div>
                              </div>
                              <div style={{
                                width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                                background: 'var(--primary-100)', display: 'flex', alignItems: 'center',
                                justifyContent: 'center',
                              }}>
                                <Building2 size={14} color="var(--primary-600)" />
                              </div>
                            </div>
                          ) : (
                            <div style={{ paddingLeft: '3.75rem' }}>
                              <span style={{
                                fontSize: '0.8rem', color: 'var(--gray-400)',
                                fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '0.4rem',
                              }}>
                                ⏳ Awaiting response from {batch.company}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Tip Box */}
      <div style={{
        marginTop: '2rem', padding: '1rem 1.25rem', borderRadius: '10px',
        background: 'var(--warning-50, #fffbeb)', border: '1px solid var(--warning-200, #fde68a)',
        display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
      }}>
        <Lightbulb size={18} color="var(--warning-500, #f59e0b)" style={{ flexShrink: 0, marginTop: '2px' }} />
        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--warning-800, #92400e)', lineHeight: '1.6' }}>
          <strong>Tip:</strong> You can export individual company discussions as Text or CSV for future reference.
          Answers are provided by the company or the Placement Office during the in-person visit.
        </p>
      </div>
    </div>
  );
}
