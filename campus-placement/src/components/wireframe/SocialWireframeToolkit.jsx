'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

const PLATFORMS = {
  twitter: {
    name: 'X (Twitter)',
    hint: 'Wireframe — no post is sent.',
    accent: '#0f1419',
  },
  facebook: {
    name: 'Facebook',
    hint: 'Wireframe — no post is sent.',
    accent: '#1877f2',
  },
  instagram: {
    name: 'Instagram',
    hint: 'Wireframe — no post is sent.',
    accent: '#e4405f',
  },
  linkedin: {
    name: 'LinkedIn',
    hint: 'Wireframe — no post is sent.',
    accent: '#0a66c2',
  },
};

export function IconTwitter({ size = 18, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export function IconFacebook({ size = 18, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

export function IconInstagram({ size = 18, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

export function IconLinkedIn({ size = 18, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

export const SOCIAL_PLATFORM_ORDER = [
  { id: 'twitter', label: 'X / Twitter', Icon: IconTwitter },
  { id: 'facebook', label: 'Facebook', Icon: IconFacebook },
  { id: 'instagram', label: 'Instagram', Icon: IconInstagram },
  { id: 'linkedin', label: 'LinkedIn', Icon: IconLinkedIn },
];

function MockLinkedIn() {
  return (
    <div className="sw-mock sw-mock--li">
      <div>
        <div className="sw-mock-li-card">
          <div className="sw-mock-li-banner" aria-hidden />
          <div className="sw-mock-li-avatar" aria-hidden />
          <div className="sw-mock-li-profile-body">
            <div className="sw-mock-li-name">Placement Office</div>
            <div className="sw-mock-li-sub">Training &amp; Career Services · Mumbai</div>
          </div>
          <div className="sw-mock-li-stat">
            <span>Profile viewers</span>
            <span>128</span>
          </div>
        </div>
      </div>
      <div>
        <div className="sw-mock-li-feed-top">
          <div className="sw-mock-post-logo" style={{ borderRadius: '50%', width: 36, height: 36 }} aria-hidden />
          <div className="sw-mock-li-input">Start a post</div>
        </div>
        <div className="sw-mock-post">
          <div className="sw-mock-post-head">
            <div className="sw-mock-post-logo" aria-hidden />
            <div className="sw-mock-post-meta">
              <strong>Campus Placement Cell</strong>
              <span>12.4K followers · 3h</span>
            </div>
          </div>
          <p className="sw-mock-post-text">
            We&apos;re pleased to announce the <strong>TechCorp Solutions</strong> on-campus drive on{' '}
            <strong>15 Sept 2026</strong>. Eligible branches: CSE, IT, ECE. Register on PlacementHub before the deadline.
            <span style={{ color: '#0a66c2', fontWeight: 600 }}> …see more</span>
          </p>
          <div className="sw-mock-post-media" aria-hidden />
          <div className="sw-mock-post-actions">
            <span>Like</span>
            <span>Comment</span>
            <span>Repost</span>
            <span>Send</span>
          </div>
        </div>
      </div>
      <div className="sw-mock-li-card sw-mock-li-news" style={{ padding: 10 }}>
        <h4>LinkedIn News</h4>
        <ul>
          <li>
            <strong>Campus hiring picks up for 2026</strong>
            <div className="meta">11h ago · 4,802 readers</div>
          </li>
          <li>
            <strong>Internship-to-PPO trends in India</strong>
            <div className="meta">1d ago · 2,114 readers</div>
          </li>
          <li>
            <strong>Engineering salaries: new data</strong>
            <div className="meta">2d ago · 9,331 readers</div>
          </li>
        </ul>
      </div>
    </div>
  );
}

function MockFacebook() {
  return (
    <div className="sw-mock sw-mock--fb">
      <div className="sw-mock-fb-top">
        <div className="sw-mock-fb-logo" aria-hidden>f</div>
        <div className="sw-mock-fb-search">Search</div>
        <span style={{ fontSize: 16, opacity: 0.6 }} aria-hidden>🏠 📹 🏪 👥 🎮</span>
      </div>
      <div className="sw-mock-fb-grid">
        <div className="sw-mock-fb-side">
          <div className="sw-mock-fb-side-item">
            <span style={{ width: 28, height: 28, borderRadius: '50%', background: '#1877f2', flexShrink: 0 }} aria-hidden />
            Placement Cell
          </div>
          <div className="sw-mock-fb-side-item">Friends</div>
          <div className="sw-mock-fb-side-item">Groups</div>
          <div className="sw-mock-fb-side-item">Saved</div>
        </div>
        <div>
          <div className="sw-mock-fb-stories">
            <div className="sw-mock-fb-story">Create story</div>
            <div className="sw-mock-fb-story" aria-hidden />
            <div className="sw-mock-fb-story" aria-hidden />
            <div className="sw-mock-fb-story" aria-hidden />
          </div>
          <div className="sw-mock-fb-composer">
            <div className="sw-mock-fb-composer-row">
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#42b72a' }} aria-hidden />
              <div className="sw-mock-fb-composer-input">What&apos;s on your mind, Placement Cell?</div>
            </div>
            <div className="sw-mock-fb-composer-actions">
              <span>Live video</span>
              <span>Photo/video</span>
              <span>Feeling</span>
            </div>
          </div>
          <div className="sw-mock-post">
            <div className="sw-mock-post-head">
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#f59e0b,#ea580c)' }} aria-hidden />
              <div className="sw-mock-post-meta">
                <strong>Student Council</strong>
                <span>at Main Auditorium · 6h · 🌐</span>
              </div>
            </div>
            <p className="sw-mock-post-text">
              Congratulations to everyone who completed pre-placement training. Next up: <strong>Infosys</strong> briefing session — see PlacementHub calendar for slots.
            </p>
            <div className="sw-mock-post-media" style={{ background: 'linear-gradient(145deg,#14532d,#166534,#22c55e)' }} aria-hidden />
            <div className="sw-mock-post-actions">
              <span>Like</span>
              <span>Comment</span>
              <span>Share</span>
            </div>
          </div>
        </div>
        <div>
          <div className="sw-mock-fb-ad">
            Sponsored
            <div className="sw-mock-fb-ad-box" aria-hidden />
            <div style={{ marginTop: 6, fontWeight: 600, color: '#050505' }}>Upskill weekend workshop</div>
          </div>
          <div className="sw-mock-fb-ad">
            <span style={{ fontSize: 18 }} aria-hidden>🎁</span> <strong>Birthdays</strong>
            <div style={{ marginTop: 6 }}>Sample Alumni&apos;s birthday is today.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MockInstagram() {
  return (
    <div className="sw-mock sw-mock--ig">
      <div className="sw-mock-ig-rail" aria-hidden>
        <span style={{ color: '#262626', display: 'flex' }}>
          <IconInstagram size={22} />
        </span>
        <div className="sw-mock-ig-rail-icon" />
        <div className="sw-mock-ig-rail-icon" />
        <div className="sw-mock-ig-rail-icon" />
        <div className="sw-mock-ig-rail-icon" />
      </div>
      <div className="sw-mock-ig-main">
        <div className="sw-mock-ig-stories">
          {['Your story', 'tpo_cell', 'dept_cse', 'clubs_tech'].map((label) => (
            <div key={label} style={{ flexShrink: 0 }}>
              <div className="sw-mock-ig-story-ring">
                <div className="sw-mock-ig-story-ring-inner">
                  <div className="sw-mock-ig-story-av" aria-hidden />
                </div>
              </div>
              <div className="sw-mock-ig-story-label">{label}</div>
            </div>
          ))}
        </div>
        <div className="sw-mock-ig-post-head">
          <div className="sw-mock-ig-post-av" aria-hidden />
          <div>
            <div className="sw-mock-ig-post-user">placement_hub_official</div>
            <div className="sw-mock-ig-post-time">Mumbai · 2d</div>
          </div>
        </div>
        <p className="sw-mock-post-text" style={{ marginBottom: 10 }}>
          Drive week is here 🎯 Swipe stories for employer line-up. Link in bio → PlacementHub.
        </p>
        <div className="sw-mock-ig-photo" aria-hidden />
        <div className="sw-mock-ig-actions">
          <span>♡ Like</span>
          <span>💬 Comment</span>
          <span>↗ Share</span>
        </div>
      </div>
      <div className="sw-mock-ig-aside">
        <div className="sw-mock-ig-suggest">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#cbd5e1' }} aria-hidden />
            <div>
              <strong style={{ fontSize: 12 }}>you</strong>
              <div style={{ color: '#8e8e8e', fontSize: 10 }}>Placement Cell</div>
            </div>
          </div>
          <span className="sw-mock-ig-follow">Switch</span>
        </div>
        <div style={{ color: '#8e8e8e', fontWeight: 700, fontSize: 11, marginBottom: 8 }}>Suggested for you</div>
        <div className="sw-mock-ig-suggest">
          <span>careers_csdept</span>
          <span className="sw-mock-ig-follow">Follow</span>
        </div>
        <div className="sw-mock-ig-suggest">
          <span>alumni_network_in</span>
          <span className="sw-mock-ig-follow">Follow</span>
        </div>
        <div style={{ marginTop: 16, fontSize: 9, color: '#8e8e8e', lineHeight: 1.6 }}>
          About · Help · Press · API · Jobs
          <br />
          © 2026 PLACEMENTHUB MOCK
        </div>
      </div>
    </div>
  );
}

function MockX() {
  return (
    <div className="sw-mock sw-mock--x">
      <div className="sw-mock-x-nav">
        <div className="sw-mock-x-logo">𝕏</div>
        <div className="sw-mock-x-nav-item is-active">Home</div>
        <div className="sw-mock-x-nav-item">Explore</div>
        <div className="sw-mock-x-nav-item">Notifications</div>
        <div className="sw-mock-x-nav-item">Messages</div>
        <div className="sw-mock-x-nav-item">Profile</div>
        <div className="sw-mock-x-post-btn">Post</div>
      </div>
      <div className="sw-mock-x-feed">
        <div className="sw-mock-x-tabs">
          <div className="sw-mock-x-tab is-active">For you</div>
          <div className="sw-mock-x-tab">Following</div>
        </div>
        <div className="sw-mock-x-compose">
          <div className="sw-mock-x-compose-av" aria-hidden />
          <div className="sw-mock-x-compose-ph">What&apos;s happening?</div>
        </div>
        <div className="sw-mock-post" style={{ borderRadius: 0, border: 'none', borderBottom: '1px solid #eff3f4', boxShadow: 'none' }}>
          <div className="sw-mock-post-head">
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#1d9bf0' }} aria-hidden />
            <div className="sw-mock-post-meta">
              <strong>
                Campus Placements <span style={{ color: '#536471', fontWeight: 400 }}>@campusplace_in</span> · 6h
              </strong>
            </div>
          </div>
          <p className="sw-mock-post-text">
            New drive alert: <strong>GlobalSoft</strong> virtual assessments open for 2026 batch. Register on PlacementHub — window closes Friday.
          </p>
          <div className="sw-mock-x-article">
            <div className="sw-mock-x-article-img" aria-hidden />
            <div className="sw-mock-x-article-body">
              <span style={{ color: '#536471', fontSize: 10 }}>placementhub.edu</span>
              <strong>2026 hiring calendar &amp; eligibility</strong>
              <span style={{ color: '#536471', display: 'block', marginTop: 2 }}>Official campus placement portal — dummy preview.</span>
            </div>
          </div>
          <div className="sw-mock-post-actions" style={{ borderTop: 'none', color: '#536471' }}>
            <span>💬 24</span>
            <span>🔁 12</span>
            <span>♥ 108</span>
            <span>📊 4.2K</span>
          </div>
        </div>
      </div>
      <div className="sw-mock-x-aside">
        <div className="sw-mock-x-search">Search</div>
        <div className="sw-mock-x-trend">
          <h4>What&apos;s happening</h4>
          <ul style={{ margin: 0, padding: 0 }}>
            <li>
              <span style={{ color: '#536471', fontSize: 10 }}>Careers · Trending</span>
              <strong style={{ display: 'block', marginTop: 2 }}>#CampusHiring2026</strong>
            </li>
            <li>
              <span style={{ color: '#536471', fontSize: 10 }}>Technology · Trending</span>
              <strong style={{ display: 'block', marginTop: 2 }}>Pre-placement training</strong>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function PlatformPreview({ platform }) {
  switch (platform) {
    case 'linkedin':
      return <MockLinkedIn />;
    case 'facebook':
      return <MockFacebook />;
    case 'instagram':
      return <MockInstagram />;
    case 'twitter':
      return <MockX />;
    default:
      return null;
  }
}

/**
 * @param {{ platform: string | null; contextTitle?: string; onClose: () => void }} props
 */
export function SocialWireframeModal({ platform, contextTitle = 'College channel', onClose }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!platform) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [platform, onClose]);

  if (!platform || !mounted) return null;
  const meta = PLATFORMS[platform];
  if (!meta) return null;

  const modal = (
    <div
      className="modal-overlay social-wireframe-modal-overlay"
      role="presentation"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal modal-xl social-wireframe-modal" role="dialog" aria-modal="true" aria-labelledby="social-wireframe-title">
        <div className="modal-header">
          <h2 className="modal-title" id="social-wireframe-title">
            {meta.name}
            <span className="badge badge-gray" style={{ marginLeft: '0.5rem', verticalAlign: 'middle' }}>Wireframe</span>
          </h2>
          <button type="button" className="modal-close" aria-label="Close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body social-wireframe-modal-body">
          <p className="text-sm text-secondary" style={{ marginTop: 0 }}>
            {meta.hint} Layout below mimics a typical desktop {meta.name} home feed with <strong>placement-themed dummy copy</strong> only. Configure real URLs in{' '}
            <strong>College Settings</strong>. Preview for {contextTitle}.
          </p>

          <div className="social-wireframe-preview-scroll">
            <div className="sw-mock-badge-strip">Dummy UI — not your real account · nothing is posted</div>
            <PlatformPreview platform={platform} />
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

/**
 * Dashboard: opens wireframe modal on click
 */
export function DashboardSocialWireframeDock({ onOpen }) {
  return (
    <div className="dashboard-social-dock">
      <div className="dashboard-social-dock-label">
        <span className="badge badge-gray">Wireframe</span>
        <span className="text-sm text-secondary">Preview college social channels (dummy)</span>
      </div>
      <div className="dashboard-social-dock-icons">
        {SOCIAL_PLATFORM_ORDER.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            className="dashboard-social-icon-btn"
            title={`${label} — wireframe preview`}
            aria-label={`Open ${label} wireframe`}
            onClick={() => onOpen(id)}
          >
            <Icon size={20} />
          </button>
        ))}
      </div>
    </div>
  );
}
