'use client';
import { useState } from 'react';
import { Trophy, FlaskConical, Palette, School, MapPin, X, CreditCard, Building2, Landmark } from 'lucide-react';

const colleges = [
  {
    id: 'iit-mumbai',
    name: 'Indian Institute of Technology, Mumbai',
    location: 'Mumbai, Maharashtra',
    sponsorshipLevels: [
      {
        category: 'Sports Programs',
        icon: <Trophy size={24} />,
        color: '#3b82f6',
        description: 'Support athletic programs and help students excel in sports',
        tiers: [
          { name: 'Bronze Sponsor', price: '₹5,00,000', label: 'Popular', benefits: ['Logo on team uniforms', 'Website recognition'] },
          { name: 'Silver Sponsor', price: '₹15,00,000', label: 'Popular', benefits: ['Logo on uniforms', 'Website recognition', 'Event banner display'] },
          { name: 'Gold Sponsor', price: '₹35,00,000', label: 'Premium', benefits: ['Logo on uniforms', 'Website recognition', 'Event banner display', 'VIP event access'] },
        ]
      },
      {
        category: 'Science Labs',
        icon: <FlaskConical size={24} />,
        color: '#10b981',
        description: 'Enhance laboratory facilities and scientific equipment',
        tiers: [
          { name: 'Equipment Sponsor', price: '₹10,00,000', benefits: ['Lab naming rights', 'Plaque recognition'] },
          { name: 'Lab Partner', price: '₹25,00,000', benefits: ['Lab naming rights', 'Plaque recognition', 'Student presentation access'] },
        ]
      }
    ]
  },
  {
    id: 'nit-trichy',
    name: 'National Institute of Technology, Trichy',
    location: 'Tiruchirappalli, Tamil Nadu',
    sponsorshipLevels: [
      {
        category: 'Cultural Events',
        icon: <Palette size={24} />,
        color: '#a855f7',
        description: 'Support arts, music, and cultural activities that enrich student life',
        tiers: [
          { name: 'Event Supporter', price: '₹3,00,000', benefits: ['Program acknowledgment', 'Social media recognition'] },
          { name: 'Cultural Partner', price: '₹8,00,000', benefits: ['Program acknowledgment', 'Event tickets'] },
        ]
      }
    ]
  }
];

const PAY_TABS = [
  { id: 'online', label: 'Pay online', icon: CreditCard },
  { id: 'cheque', label: 'Cheque', icon: Building2 },
  { id: 'bank', label: 'Bank transfer', icon: Landmark },
];

export default function EmployerSponsorshipsPage() {
  const [activeCollegeId, setActiveCollegeId] = useState(colleges[0].id);
  const [sponsorModal, setSponsorModal] = useState(null);
  const [payTab, setPayTab] = useState('online');
  const activeCollege = colleges.find(c => c.id === activeCollegeId);

  const closeModal = () => {
    setSponsorModal(null);
    setPayTab('online');
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
          <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>Sponsor Top <span className="text-primary-600">Institutions</span></h1>
          <p style={{ fontSize: '1.125rem', color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto 0' }}>
            Build your brand presence across premier campuses. Partner with institutions to empower student success and foster long-term recruitment pipelines.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '2rem' }}>
        
        {/* Sidebar: College List */}
        <div>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', fontWeight: 700 }}>Select College</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {colleges.map(college => (
              <div 
                key={college.id}
                onClick={() => setActiveCollegeId(college.id)}
                className="card-hover"
                style={{ 
                  padding: '1rem', 
                  borderRadius: '0.75rem', 
                  cursor: 'pointer',
                  border: activeCollegeId === college.id ? '2px solid var(--primary-500)' : '1px solid var(--border-default)',
                  background: activeCollegeId === college.id ? 'rgba(99, 102, 241, 0.05)' : 'var(--bg-primary)'
                }}
              >
                <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <School size={16} className="text-primary-600" />
                  {college.name}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <MapPin size={12} /> {college.location}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content: Sponsorships for Active College */}
        <div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', fontWeight: 700, paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-default)' }}>
            Opportunities at {activeCollege.name}
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {activeCollege.sponsorshipLevels.map((level, i) => (
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
                    color: 'white'
                  }}>
                    {level.icon}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>{level.category}</h3>
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
                          <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>{tier.name}</h4>
                          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#2563eb' }}>{tier.price}</div>
                        </div>
                        {tier.label && <span className="badge badge-primary">{tier.label}</span>}
                      </div>
                      <ul style={{ padding: 0, listStyle: 'none', margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                        {tier.benefits.map((b, bi) => (
                          <li key={bi} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.375rem' }}>
                            <span style={{ color: level.color, fontWeight: 'bold' }}>✓</span> {b}
                          </li>
                        ))}
                      </ul>
                      <button
                        type="button"
                        className="btn btn-primary"
                        style={{ width: '100%', marginTop: '1rem' }}
                        onClick={() => {
                          setPayTab('online');
                          setSponsorModal({
                            collegeName: activeCollege.name,
                            category: level.category,
                            tierName: tier.name,
                            price: tier.price,
                          });
                        }}
                      >
                        Sponsor Now
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          {activeCollege.sponsorshipLevels.length === 0 && (
             <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                 <p className="text-secondary">No active sponsorship opportunities currently available for this institution.</p>
             </div>
          )}

        </div>
      </div>

      {sponsorModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="sponsor-modal-title"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            background: 'rgba(15, 23, 42, 0.55)',
          }}
          onClick={(e) => e.target === e.currentTarget && closeModal()}
        >
          <div
            className="card"
            style={{
              maxWidth: 520,
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              padding: '1.5rem',
              position: 'relative',
              border: '1px solid var(--border-default)',
              boxShadow: 'var(--shadow-lg)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="btn btn-ghost btn-icon"
              onClick={closeModal}
              aria-label="Close"
              style={{ position: 'absolute', top: '0.75rem', right: '0.75rem' }}
            >
              <X size={20} aria-hidden="true" />
            </button>
            <span className="badge badge-gray" style={{ marginBottom: '0.75rem', display: 'inline-block' }}>Wireframe</span>
            <h2 id="sponsor-modal-title" style={{ margin: '0 0 0.25rem', fontSize: '1.25rem', fontWeight: 800 }}>
              Complete sponsorship
            </h2>
            <p style={{ margin: '0 0 1rem', fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {sponsorModal.tierName} · {sponsorModal.category} · {sponsorModal.collegeName} · <strong>{sponsorModal.price}</strong>
            </p>
            <p style={{ margin: '0 0 1rem', fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>
              Demo only: choose how payment would work in production — gateway, cheque, or bank transfer.
            </p>

            <div
              role="tablist"
              aria-label="Payment method"
              style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '1rem' }}
            >
              {PAY_TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={payTab === id}
                  className={payTab === id ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm'}
                  onClick={() => setPayTab(id)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                >
                  <Icon size={16} aria-hidden="true" /> {label}
                </button>
              ))}
            </div>

            {payTab === 'online' && (
              <div
                className="wireframe-banner"
                style={{
                  display: 'block',
                  background: 'var(--bg-secondary)',
                  borderStyle: 'solid',
                  borderColor: 'var(--border-default)',
                }}
              >
                <strong>Payment gateway (wireframe)</strong>
                <p style={{ margin: '0.75rem 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                  Integrate Razorpay, Stripe, or your bank&apos;s hosted checkout. Here you&apos;d see card / UPI / net banking and a
                  receipt on success.
                </p>
                <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <button type="button" className="btn btn-primary" disabled style={{ opacity: 0.85 }}>
                    Pay {sponsorModal.price} (demo disabled)
                  </button>
                  <span className="text-xs text-secondary">Placeholder — no real charge in this demo.</span>
                </div>
              </div>
            )}

            {payTab === 'cheque' && (
              <div
                className="wireframe-banner"
                style={{
                  display: 'block',
                  background: 'var(--bg-secondary)',
                  borderStyle: 'solid',
                  borderColor: 'var(--border-default)',
                }}
              >
                <strong>Mail a cheque</strong>
                <p style={{ margin: '0.75rem 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                  Make cheque payable to <strong>{sponsorModal.collegeName}</strong> and mention <strong>{sponsorModal.tierName}</strong> on
                  the memo line.
                </p>
                <address
                  style={{
                    marginTop: '1rem',
                    fontSize: '0.875rem',
                    fontStyle: 'normal',
                    lineHeight: 1.6,
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px dashed var(--border-default)',
                    background: 'var(--bg-primary)',
                  }}
                >
                  Sponsorship Cell (Demo Address)
                  <br />
                  Finance &amp; Accounts, Main Campus
                  <br />
                  Mumbai / Tiruchirappalli — 400001 / 620015
                  <br />
                  India
                </address>
              </div>
            )}

            {payTab === 'bank' && (
              <div
                className="wireframe-banner"
                style={{
                  display: 'block',
                  background: 'var(--bg-secondary)',
                  borderStyle: 'solid',
                  borderColor: 'var(--border-default)',
                }}
              >
                <strong>Bank transfer</strong>
                <p style={{ margin: '0.75rem 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                  Use these demo details for NEFT / RTGS / IMPS. Reference: your company name + tier.
                </p>
                <dl
                  style={{
                    margin: '1rem 0 0',
                    display: 'grid',
                    gap: '0.5rem',
                    fontSize: '0.875rem',
                    padding: '1rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px dashed var(--border-default)',
                    background: 'var(--bg-primary)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                    <dt className="text-secondary">Account name</dt>
                    <dd style={{ margin: 0, fontWeight: 600 }}>{sponsorModal.collegeName} (Demo)</dd>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                    <dt className="text-secondary">Bank</dt>
                    <dd style={{ margin: 0, fontWeight: 600 }}>Demo National Bank</dd>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                    <dt className="text-secondary">Account no.</dt>
                    <dd style={{ margin: 0, fontFamily: 'ui-monospace, monospace' }}>50100XXXXXX42</dd>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                    <dt className="text-secondary">IFSC</dt>
                    <dd style={{ margin: 0, fontFamily: 'ui-monospace, monospace' }}>DEMO0001234</dd>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                    <dt className="text-secondary">Branch</dt>
                    <dd style={{ margin: 0 }}>Campus / Institutional</dd>
                  </div>
                </dl>
              </div>
            )}

            <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button type="button" className="btn btn-secondary" onClick={closeModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
