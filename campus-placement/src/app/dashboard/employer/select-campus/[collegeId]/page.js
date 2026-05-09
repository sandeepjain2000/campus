'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import { Building2, Mail, Phone, GraduationCap, Users, Briefcase, ArrowLeft } from 'lucide-react';
import { formatDate, formatStatus } from '@/lib/utils';
import EntityLogo from '@/components/EntityLogo';

const fetcher = async (url) => {
  const res = await fetch(url, { credentials: 'include' });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error || 'Failed to load campus details');
  return json;
};

function normalizeApprovalStatus(raw) {
  if (raw == null || raw === '') return null;
  const s = String(raw).trim().toLowerCase();
  return ['approved', 'pending', 'rejected', 'blacklisted'].includes(s) ? s : null;
}

export default function EmployerCampusDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const collegeId = String(params?.collegeId || '');
  const { data, error, isLoading } = useSWR('/api/employer/campuses', fetcher);

  const college = (data?.colleges || []).find((c) => c.id === collegeId) || null;
  const status = normalizeApprovalStatus(college?.approval_status);
  const placementPct = college?.total_students > 0
    ? Math.round((Number(college.placed_students || 0) / Number(college.total_students)) * 100)
    : null;

  const openCampusWorkspace = () => {
    if (!college) return;
    sessionStorage.setItem(
      'activeCampus',
      JSON.stringify({ id: college.id, name: college.name, slug: college.slug, city: college.city, state: college.state }),
    );
    try {
      window.dispatchEvent(new Event('placementhub-active-campus'));
    } catch {
      // ignore
    }
    router.replace('/dashboard/employer');
  };

  if (isLoading) {
    return <div className="skeleton" style={{ height: 260, borderRadius: 'var(--radius-lg)' }} />;
  }

  if (error || !college) {
    return (
      <div className="card">
        <p style={{ color: 'var(--danger-600)', marginBottom: '0.75rem' }}>
          {error?.message || 'Campus not found.'}
        </p>
        <Link href="/dashboard/employer/select-campus" className="btn btn-secondary">
          Back to campuses
        </Link>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn" style={{ display: 'grid', gap: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
        <button type="button" className="btn btn-ghost" onClick={() => router.push('/dashboard/employer/select-campus')}>
          <ArrowLeft size={15} style={{ marginRight: '0.35rem' }} />
          Back
        </button>
        {status === 'approved' && (
          <button type="button" className="btn btn-primary" onClick={openCampusWorkspace}>
            Open campus workspace
          </button>
        )}
      </div>

      <div className="card" style={{ display: 'grid', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <EntityLogo name={college.name} website={college.website} size="md" shape="rounded" />
          <div>
            <h1 style={{ margin: 0, fontSize: '1.25rem' }}>{college.name}</h1>
            <p className="text-secondary" style={{ margin: '0.15rem 0 0' }}>
              {[college.city, college.state].filter(Boolean).join(', ') || 'Location not set'}
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
          <div className="card" style={{ margin: 0 }}>
            <p className="text-tertiary text-xs">Status</p>
            <p style={{ margin: '0.25rem 0 0', fontWeight: 700 }}>{formatStatus(status || 'not requested')}</p>
          </div>
          <div className="card" style={{ margin: 0 }}>
            <p className="text-tertiary text-xs">Students</p>
            <p style={{ margin: '0.25rem 0 0', fontWeight: 700 }}>{college.total_students || 0}</p>
          </div>
          <div className="card" style={{ margin: 0 }}>
            <p className="text-tertiary text-xs">Placement rate</p>
            <p style={{ margin: '0.25rem 0 0', fontWeight: 700 }}>{placementPct != null ? `${placementPct}%` : '—'}</p>
          </div>
          <div className="card" style={{ margin: 0 }}>
            <p className="text-tertiary text-xs">Active drives</p>
            <p style={{ margin: '0.25rem 0 0', fontWeight: 700 }}>{college.active_drives || 0}</p>
          </div>
        </div>

        <div style={{ display: 'grid', gap: '0.75rem', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
          <div className="card" style={{ margin: 0 }}>
            <p className="text-tertiary text-xs">Contact</p>
            <p style={{ margin: '0.4rem 0 0', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Mail size={14} /> {college.email || '—'}
            </p>
            <p style={{ margin: '0.35rem 0 0', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Phone size={14} /> {college.phone || '—'}
            </p>
          </div>
          <div className="card" style={{ margin: 0 }}>
            <p className="text-tertiary text-xs">Accreditation</p>
            <p style={{ margin: '0.4rem 0 0', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <GraduationCap size={14} /> {[college.accreditation, college.naac_grade ? `NAAC ${college.naac_grade}` : null].filter(Boolean).join(' · ') || '—'}
            </p>
            <p style={{ margin: '0.35rem 0 0', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Building2 size={14} /> {college.nirf_rank ? `NIRF #${college.nirf_rank}` : 'NIRF not set'}
            </p>
          </div>
          <div className="card" style={{ margin: 0 }}>
            <p className="text-tertiary text-xs">Partnership timeline</p>
            <p style={{ margin: '0.4rem 0 0', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Users size={14} /> Requested: {college.requested_at ? formatDate(college.requested_at) : '—'}
            </p>
            <p style={{ margin: '0.35rem 0 0', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Briefcase size={14} /> Approved: {college.approved_at ? formatDate(college.approved_at) : '—'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
