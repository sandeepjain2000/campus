'use client';
import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { useToast } from '@/components/ToastProvider';

const fetcher = url => fetch(url).then(res => res.json());

export default function CollegeRulesPage() {
  const { data, isLoading } = useSWR('/api/college/rules', fetcher);
  const [rules, setRules] = useState(null);
  const [saving, setSaving] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    if (data) setRules(data);
  }, [data]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/college/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rules),
      });
      if (res.ok) {
        addToast('Rules saved successfully.', 'success');
      } else {
        addToast('Failed to save rules.', 'error');
      }
    } catch {
      addToast('Network error while saving rules.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || !rules) {
    return <div style={{ padding: '2rem' }}>Loading rules...</div>;
  }

  return (
    <div className="animate-fadeIn" style={{ paddingBottom: '3rem' }}>
      {/* Glassmorphic Hero */}
      <div style={{
        position: 'relative', background: 'linear-gradient(135deg, var(--primary-900) 0%, var(--primary-700) 100%)',
        borderRadius: 'var(--radius-xl)', padding: '2.5rem', color: 'white', overflow: 'hidden',
        marginBottom: '2rem', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem'
      }}>
        <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '250px', height: '250px', background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 60%)', borderRadius: '50%' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{ color: '#ffffff', fontSize: '2.25rem', fontWeight: 800, margin: '0 0 0.5rem', letterSpacing: '-0.02em' }}>⚙️ Placement Rules</h1>
          <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.85)', margin: 0 }}>Configure placement policies, eligibility criteria and season settings.</p>
        </div>
        <button className="btn" onClick={handleSave} disabled={saving} style={{ position: 'relative', zIndex: 1, background: 'white', color: 'var(--primary-800)', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', fontWeight: 700 }}>
          {saving ? 'Saving…' : '💾 Save Changes'}
        </button>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="card-header"><h3 className="card-title">📋 Offer Rules</h3></div>
          <div className="form-group">
            <label className="form-label">Max Offers Per Student</label>
            <input type="number" className="form-input" value={rules.maxOffers} onChange={(e) => setRules({...rules, maxOffers: e.target.value})} />
            <span className="form-hint">Maximum number of offers a student can hold simultaneously</span>
          </div>
          <div className="form-group">
            <label className="form-label">Offer Acceptance Window (days)</label>
            <input type="number" className="form-input" value={rules.acceptanceWindow} onChange={(e) => setRules({...rules, acceptanceWindow: e.target.value})} />
            <span className="form-hint">Days students have to accept/reject an offer</span>
          </div>
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input type="checkbox" checked={rules.fcfsEnabled} onChange={(e) => setRules({...rules, fcfsEnabled: e.target.checked})} />
              Enable FCFS (First Come First Served)
            </label>
            <span className="form-hint">Students who apply first get priority in drives</span>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h3 className="card-title">🎓 Eligibility Rules</h3></div>
          <div className="form-group">
            <label className="form-label">Minimum CGPA Threshold</label>
            <input type="number" step="0.1" className="form-input" value={rules.minCGPA} onChange={(e) => setRules({...rules, minCGPA: e.target.value})} />
          </div>
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input type="checkbox" checked={rules.allowBacklogs} onChange={(e) => setRules({...rules, allowBacklogs: e.target.checked})} />
              Allow Students with Backlogs
            </label>
          </div>
          {rules.allowBacklogs && (
            <div className="form-group">
              <label className="form-label">Max Backlogs Allowed</label>
              <input type="number" className="form-input" value={rules.maxBacklogs} onChange={(e) => setRules({...rules, maxBacklogs: e.target.value})} />
            </div>
          )}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input type="checkbox" checked={rules.requirePPT} onChange={(e) => setRules({...rules, requirePPT: e.target.checked})} />
              Require Pre-Placement Talk Before Apply
            </label>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h3 className="card-title">🌟 Dream Company Category</h3></div>
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input type="checkbox" checked={rules.enableDreamCompany} onChange={(e) => setRules({...rules, enableDreamCompany: e.target.checked})} />
              Enable Dream Company Rule Override
            </label>
            <span className="form-hint">Allows placed students to apply for a higher-tier company offer</span>
          </div>
          {rules.enableDreamCompany && (
            <div className="form-group">
              <label className="form-label">Dream Company CTC Multiplier</label>
              <input type="number" step="0.1" className="form-input" value={rules.dreamCompanyMultiplier} onChange={(e) => setRules({...rules, dreamCompanyMultiplier: parseFloat(e.target.value)})} />
              <span className="form-hint">E.g., 2.0 means the new offer must be at least 2x their current offer to apply</span>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header"><h3 className="card-title">📅 Season Settings</h3></div>
          <div className="form-group">
            <label className="form-label">Placement Season Start</label>
            <input type="date" className="form-input" value={rules.seasonStart} onChange={(e) => setRules({...rules, seasonStart: e.target.value})} />
          </div>
          <div className="form-group">
            <label className="form-label">Placement Season End</label>
            <input type="date" className="form-input" value={rules.seasonEnd} onChange={(e) => setRules({...rules, seasonEnd: e.target.value})} />
          </div>
          <div className="form-group">
            <label className="form-label">Buffer Days Between Drives</label>
            <input type="number" className="form-input" value={rules.bufferDays} onChange={(e) => setRules({...rules, bufferDays: e.target.value})} />
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h3 className="card-title">🔧 Automation</h3></div>
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input type="checkbox" checked={rules.autoVerify} onChange={(e) => setRules({...rules, autoVerify: e.target.checked})} />
              Auto-Verify Student Profiles
            </label>
            <span className="form-hint">Automatically verify students upon registration (not recommended)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
