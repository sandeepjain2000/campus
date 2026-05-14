'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { useToast } from '@/components/ToastProvider';
import MobileHeader from '@/components/mobile/MobileHeader';
import { Save } from 'lucide-react';

const fetcher = url => fetch(url).then(res => res.json());

export default function mb_Rules() {
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
    return (
      <>
        <MobileHeader title="Placement Rules" />
        <div style={{ padding: '1rem 1rem 5rem 1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 200, borderRadius: '12px' }} />)}
        </div>
      </>
    );
  }

  return (
    <>
      <MobileHeader 
        title="Placement Rules" 
        action={
          <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
            <Save size={16} style={{ marginRight: '0.25rem' }} /> {saving ? 'Saving...' : 'Save'}
          </button>
        } 
      />
      <div className="animate-fadeIn" style={{ padding: '1rem 1rem 5rem 1rem' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card" style={{ padding: '1.25rem' }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '1rem' }}>📋 Offer Rules</h3>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="text-xs text-secondary mb-1 block">Max Offers Per Student</label>
              <input type="number" className="form-input" value={rules.maxOffers} onChange={(e) => setRules({...rules, maxOffers: e.target.value})} style={{ borderRadius: '8px' }} />
            </div>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="text-xs text-secondary mb-1 block">Offer Acceptance Window (days)</label>
              <input type="number" className="form-input" value={rules.acceptanceWindow} onChange={(e) => setRules({...rules, acceptanceWindow: e.target.value})} style={{ borderRadius: '8px' }} />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
              <input type="checkbox" checked={rules.fcfsEnabled} onChange={(e) => setRules({...rules, fcfsEnabled: e.target.checked})} style={{ width: '16px', height: '16px' }} />
              Enable FCFS (First Come First Served)
            </label>
          </div>

          <div className="card" style={{ padding: '1.25rem' }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '1rem' }}>🎓 Eligibility Rules</h3>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="text-xs text-secondary mb-1 block">Minimum CGPA Threshold</label>
              <input type="number" step="0.1" className="form-input" value={rules.minCGPA} onChange={(e) => setRules({...rules, minCGPA: e.target.value})} style={{ borderRadius: '8px' }} />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: rules.allowBacklogs ? '1rem' : '0' }}>
              <input type="checkbox" checked={rules.allowBacklogs} onChange={(e) => setRules({...rules, allowBacklogs: e.target.checked})} style={{ width: '16px', height: '16px' }} />
              Allow Students with Backlogs
            </label>
            {rules.allowBacklogs && (
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="text-xs text-secondary mb-1 block">Max Backlogs Allowed</label>
                <input type="number" className="form-input" value={rules.maxBacklogs} onChange={(e) => setRules({...rules, maxBacklogs: e.target.value})} style={{ borderRadius: '8px' }} />
              </div>
            )}
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
              <input type="checkbox" checked={rules.requirePPT} onChange={(e) => setRules({...rules, requirePPT: e.target.checked})} style={{ width: '16px', height: '16px', marginTop: '2px' }} />
              <span>Require Pre-Placement Talk Before Apply</span>
            </label>
          </div>

          <div className="card" style={{ padding: '1.25rem' }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '1rem' }}>🌟 Dream Company</h3>
            <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: rules.enableDreamCompany ? '1rem' : '0' }}>
              <input type="checkbox" checked={rules.enableDreamCompany} onChange={(e) => setRules({...rules, enableDreamCompany: e.target.checked})} style={{ width: '16px', height: '16px', marginTop: '2px' }} />
              <span>Enable Dream Company Rule Override (Allows placed students to apply for higher-tier)</span>
            </label>
            {rules.enableDreamCompany && (
              <div className="form-group">
                <label className="text-xs text-secondary mb-1 block">Dream Company CTC Multiplier</label>
                <input type="number" step="0.1" className="form-input" value={rules.dreamCompanyMultiplier} onChange={(e) => setRules({...rules, dreamCompanyMultiplier: parseFloat(e.target.value)})} style={{ borderRadius: '8px' }} />
                <div className="text-xs text-tertiary" style={{ marginTop: '0.25rem' }}>E.g., 2.0 means new offer must be 2x current</div>
              </div>
            )}
          </div>

          <div className="card" style={{ padding: '1.25rem' }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '1rem' }}>📅 Season Settings</h3>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="text-xs text-secondary mb-1 block">Placement Season Start</label>
              <input type="date" className="form-input" value={rules.seasonStart} onChange={(e) => setRules({...rules, seasonStart: e.target.value})} style={{ borderRadius: '8px' }} />
            </div>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="text-xs text-secondary mb-1 block">Placement Season End</label>
              <input type="date" className="form-input" value={rules.seasonEnd} onChange={(e) => setRules({...rules, seasonEnd: e.target.value})} style={{ borderRadius: '8px' }} />
            </div>
            <div className="form-group">
              <label className="text-xs text-secondary mb-1 block">Buffer Days Between Drives</label>
              <input type="number" className="form-input" value={rules.bufferDays} onChange={(e) => setRules({...rules, bufferDays: e.target.value})} style={{ borderRadius: '8px' }} />
            </div>
          </div>
          
          <div className="card" style={{ padding: '1.25rem' }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '1rem' }}>🔧 Automation</h3>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
              <input type="checkbox" checked={rules.autoVerify} onChange={(e) => setRules({...rules, autoVerify: e.target.checked})} style={{ width: '16px', height: '16px' }} />
              Auto-Verify Student Profiles
            </label>
          </div>
        </div>

        <button 
          className="btn btn-primary" 
          onClick={handleSave} 
          disabled={saving} 
          style={{ width: '100%', marginTop: '1.5rem', padding: '0.8rem', borderRadius: '12px' }}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </>
  );
}
