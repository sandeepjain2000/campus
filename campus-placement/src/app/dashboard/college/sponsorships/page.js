'use client';
import { useMemo, useState } from 'react';
import { useToast } from '@/components/ToastProvider';
import useSWR from 'swr';

import { Trophy, FlaskConical, Palette } from 'lucide-react';

const fetcher = async (url) => {
  const res = await fetch(url);
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || 'Failed to load sponsorship opportunities');
  return json;
};

const categoryMeta = {
  'Campus Infrastructure': { icon: <Trophy size={24} />, color: '#3b82f6' },
  'Research & Labs': { icon: <FlaskConical size={24} />, color: '#10b981' },
  'Alumni Mentorship': { icon: <Palette size={24} />, color: '#a855f7' },
};

const settingsFetcher = async (url) => {
  const res = await fetch(url);
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error || 'Failed to load settings');
  return json;
};

export default function CollegeSponsorshipsPage() {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState('All Categories');
  const { data, error } = useSWR('/api/college/sponsorships', fetcher);
  const { data: settingsData } = useSWR('/api/college/settings', settingsFetcher);

  const sponsorshipLevels = useMemo(() => (Array.isArray(data?.categories) ? data.categories : []), [data]);
  const collegeName = data?.collegeName || 'Your Institution';
  const placementEmail = String(settingsData?.placementOfficer?.email || '').trim();

  const downloadGuide = () => {
    const lines = sponsorshipLevels.flatMap((level) => [
      `${level.category}`,
      `${level.description || ''}`,
      ...level.tiers.map((tier) => `- ${tier.name}: ${tier.price} (${(tier.benefits || []).join('; ')})`),
      '',
    ]);
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'college_sponsorship_guide.txt';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    addToast('Sponsorship guide downloaded.', 'success');
  };

  const scheduleMeeting = () => {
    if (!placementEmail) {
      addToast('Add a placement officer email in Settings, then try again.', 'warning');
      return;
    }
    window.location.href = `mailto:${encodeURIComponent(placementEmail)}?subject=${encodeURIComponent(
      `Sponsorship discussion with ${collegeName}`,
    )}`;
  };

  const tabs = useMemo(
    () => ['All Categories', ...sponsorshipLevels.map((s) => s.category)],
    [sponsorshipLevels]
  );

  const visibleLevels = useMemo(
    () => sponsorshipLevels.filter((s) => activeTab === 'All Categories' || s.category === activeTab),
    [activeTab, sponsorshipLevels]
  );

  return (
    <div className="animate-fadeIn" style={{ paddingBottom: '3rem' }}>
      {/* Glassmorphic Hero */}
      <div style={{
        position: 'relative', background: 'linear-gradient(135deg, var(--primary-900) 0%, var(--primary-700) 100%)',
        borderRadius: 'var(--radius-xl)', padding: '2.5rem', color: 'white', overflow: 'hidden',
        marginBottom: '2.5rem', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
        textAlign: 'center',
      }}>
        <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '250px', height: '250px', background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 60%)', borderRadius: '50%' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0 0 0.75rem', letterSpacing: '-0.02em' }}>
            Invest in the <span style={{ color: 'rgba(255,255,255,0.75)' }}>Future</span>
          </h1>
          <p style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.85)', maxWidth: 560, margin: '0 auto 1.75rem' }}>
            Live sponsorship opportunities for {collegeName}. Use this as your college-facing catalog of active sponsor tiers.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn" onClick={downloadGuide} style={{ background: 'white', color: 'var(--primary-800)', border: 'none', fontWeight: 700 }}>Download Guide</button>
            <button className="btn" onClick={scheduleMeeting} style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', backdropFilter: 'blur(10px)' }}>Schedule Meeting</button>
          </div>
        </div>
      </div>

      <div className="text-center" style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Sponsorship Opportunities</h2>
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          {tabs.map(tab => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`btn ${activeTab === tab ? 'btn-primary' : 'btn-ghost'}`}
              style={{ borderRadius: '2rem' }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
        {visibleLevels.map((level, i) => {
          const meta = categoryMeta[level.category] || { icon: <Trophy size={24} />, color: '#3b82f6' };
          return (
          <div key={i} className="card" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ 
                background: meta.color, 
                width: '50px', 
                height: '50px', 
                borderRadius: '1rem', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontSize: '1.5rem',
                color: 'white'
              }}>
                {meta.icon}
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{level.category}</h3>
                <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{level.description}</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {level.tiers.map((tier, ti) => (
                <div key={ti} style={{ 
                  background: 'var(--bg-secondary)', 
                  borderRadius: '1rem', 
                  padding: '1.5rem',
                  borderLeft: `4px solid ${meta.color}`
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '1rem' }}>{tier.name}</h4>
                      <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#2563eb' }}>{tier.price}</div>
                    </div>
                    {tier.label && <span className="badge badge-primary">{tier.label}</span>}
                  </div>
                  <ul style={{ padding: 0, listStyle: 'none', margin: 0, fontSize: '0.875rem' }}>
                    {tier.benefits.map((b, bi) => (
                      <li key={bi} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <span style={{ color: meta.color }}>✓</span> {b}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )})}
      </div>

      {error && (
        <div className="card" style={{ marginTop: '1rem' }}>
          <p className="text-secondary">Failed to load sponsorship opportunities.</p>
        </div>
      )}
      {!error && sponsorshipLevels.length === 0 && (
        <div className="card" style={{ marginTop: '1rem' }}>
          <p className="text-secondary">No active sponsorship opportunities found.</p>
        </div>
      )}

      <style jsx>{`
        .btn-white {
          background: white;
          color: #2563eb;
          font-weight: 600;
          padding: 0.75rem 1.5rem;
          border-radius: 2rem;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-white:hover {
          background: #f8fafc;
          transform: translateY(-2px);
        }
        .btn-outline-white {
          background: transparent;
          color: white;
          font-weight: 600;
          padding: 0.75rem 1.5rem;
          border-radius: 2rem;
          border: 2px solid white;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-outline-white:hover {
          background: rgba(255,255,255,0.1);
          transform: translateY(-2px);
        }
      `}</style>
    </div>
  );
}
