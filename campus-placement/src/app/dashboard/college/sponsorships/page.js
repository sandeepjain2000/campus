'use client';
import { useState } from 'react';
import { useToast } from '@/components/ToastProvider';

import { Trophy, FlaskConical, Palette } from 'lucide-react';

const sponsorshipLevels = [
  {
    category: 'Sports Programs',
    icon: <Trophy size={24} />,
    color: '#3b82f6',
    description: 'Support our athletic programs and help students excel in sports',
    tiers: [
      { name: 'Bronze Sponsor', price: '$5,000', label: 'Popular', benefits: ['Logo on team uniforms', 'Website recognition'] },
      { name: 'Silver Sponsor', price: '$15,000', label: 'Popular', benefits: ['Logo on team uniforms', 'Website recognition', 'Event banner display'] },
      { name: 'Gold Sponsor', price: '$35,000', label: 'Premium', benefits: ['Logo on team uniforms', 'Website recognition', 'Event banner display', 'VIP event access'] },
    ]
  },
  {
    category: 'Science Labs',
    icon: <FlaskConical size={24} />,
    color: '#10b981',
    description: 'Enhance our laboratory facilities and scientific equipment',
    tiers: [
      { name: 'Equipment Sponsor', price: '$10,000', benefits: ['Lab naming rights', 'Plaque recognition'] },
      { name: 'Lab Partner', price: '$25,000', benefits: ['Lab naming rights', 'Plaque recognition', 'Student presentation access'] },
    ]
  },
  {
    category: 'Cultural Events',
    icon: <Palette size={24} />,
    color: '#a855f7',
    description: 'Support arts, music, and cultural activities that enrich student life',
    tiers: [
      { name: 'Event Supporter', price: '$3,000', benefits: ['Program acknowledgment', 'Social media recognition'] },
      { name: 'Cultural Partner', price: '$8,000', benefits: ['Program acknowledgment', 'Event tickets'] },
    ]
  }
];

export default function CollegeSponsorshipsPage() {
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState('All Categories');

  const showNotReady = (label) => {
    addToast(`${label} is not available yet in this build.`, 'info');
  };

  return (
    <div className="animate-fadeIn">
      {/* Hero Section */}
      <div style={{
        background: 'var(--bg-primary)',
        borderRadius: '1.5rem',
        padding: '3rem 2rem',
        textAlign: 'center',
        marginBottom: '3rem',
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid var(--border-default)',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>Invest in the <span className="text-primary-600">Future</span></h1>
          <p style={{ fontSize: '1.125rem', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto 2rem' }}>
            Partner with us to empower student success through sponsorship opportunities that create lasting impact in education, sports, and technology.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button className="btn btn-primary" onClick={() => showNotReady('Download guide')}>Download Guide</button>
            <button className="btn btn-secondary" onClick={() => showNotReady('Schedule meeting')}>Schedule Meeting</button>
          </div>
        </div>
      </div>

      <div className="text-center" style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Sponsorship Opportunities</h2>
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          {['All Categories', 'Sports Programs', 'Science Labs', 'Cultural Events'].map(tab => (
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
        {sponsorshipLevels.filter(s => activeTab === 'All Categories' || s.category === activeTab).map((level, i) => (
          <div key={i} className="card" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
              <div style={{ 
                background: level.color, 
                width: '50px', 
                height: '50px', 
                borderRadius: '1rem', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                fontSize: '1.5rem',
                color: 'white'
              }}>
                {level.icon}
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
                  borderLeft: `4px solid ${level.color}`
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
                        <span style={{ color: level.color }}>✓</span> {b}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

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
