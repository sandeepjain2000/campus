'use client';

import useSWR from 'swr';
import Link from 'next/link';
import {
  CheckCircle2,
  Circle,
  Trophy,
  ArrowRight,
  UserCheck,
  FileText,
  Briefcase,
  Building2,
  CalendarPlus,
  Upload,
  Settings,
  Users,
  Inbox,
  Rocket
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import PageError from '@/components/PageError';

const fetcher = (url) => fetch(url).then((res) => res.json());

const STEP_ICONS = {
  academic: UserCheck,
  resume: FileText,
  apply: Briefcase,
  profile: Building2,
  drive: CalendarPlus,
  offers: Upload,
  settings: Settings,
  employers: Building2,
  students: Users,
  colleges: Building2,
};

export default function GettingStartedPage() {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const { data, error, isLoading } = useSWR(userId ? '/api/user/onboarding' : null, fetcher);

  if (isLoading) {
    return (
      <main className="page-content">
        <div className="skeleton skeleton-heading" style={{ width: '30%', marginBottom: '2rem' }} />
        <div className="skeleton skeleton-card" style={{ height: '300px' }} />
      </main>
    );
  }

  if (error) return <PageError error={error} />;
  
  const steps = data?.progress?.steps || [];
  const completedCount = steps.filter((s) => s.completed).length;
  const totalCount = steps.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 100;
  const nextStep = steps.find((s) => !s.completed);
  const isComplete = data?.progress?.isComplete || completedCount === totalCount;

  return (
    <main className="page-content animate-fadeIn" style={{ paddingBottom: '3rem' }}>
      {/* High-Fidelity Glassmorphic Hero Banner */}
      <div 
        style={{
          position: 'relative',
          background: 'linear-gradient(135deg, var(--primary-900) 0%, var(--primary-700) 100%)',
          borderRadius: 'var(--radius-xl)',
          padding: '2.5rem',
          color: 'white',
          overflow: 'hidden',
          marginBottom: '2.5rem',
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1.5rem',
        }}
      >
        {/* Decorative Elements */}
        <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '250px', height: '250px', background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 60%)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '-50px', left: '10%', width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 60%)', borderRadius: '50%' }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '600px' }}>
          <h1 style={{ color: 'white', fontSize: '2.25rem', fontWeight: 800, margin: '0 0 0.5rem', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Rocket size={28} /> Getting Started
          </h1>
          <p style={{ fontSize: '1.05rem', color: 'rgba(255,255,255,0.85)', margin: 0, lineHeight: 1.5 }}>
            Complete these steps to set up your account and get the most out of the platform.
          </p>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 800, margin: '0 auto', overflow: 'hidden', border: '1px solid var(--border-default)' }}>
        {/* Header / Progress Section */}
        <div style={{ padding: '2rem', borderBottom: '1px solid var(--border-default)', background: 'var(--bg-secondary)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
            <div style={{
              width: 56, height: 56, borderRadius: '16px', background: 'var(--primary-100)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--primary-200)',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
            }}>
              <Trophy size={28} style={{ color: 'var(--primary-700)' }} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                {isComplete ? 'You’re All Set!' : 'Account Setup Progress'}
              </h2>
              <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-secondary)', marginTop: '0.2rem', fontWeight: 500 }}>
                {isComplete ? 'You have completed all the recommended setup steps.' : `You've completed ${completedCount} out of ${totalCount} steps.`}
              </p>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div style={{ height: 10, background: 'var(--gray-200)', borderRadius: 999, overflow: 'hidden', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)' }}>
            <div style={{
              height: '100%', width: `${progressPercent}%`,
              background: isComplete ? 'var(--success-500)' : 'linear-gradient(90deg, var(--primary-500), var(--primary-600))',
              borderRadius: 999, transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
            }} />
          </div>
        </div>

        {/* Steps List */}
        <div style={{ padding: '1.5rem 2rem' }}>
          {steps.map((step) => {
            const Icon = STEP_ICONS[step.id] || Circle;
            const isCompleted = step.completed;
            const isNext = step === nextStep;

            return (
               <Link
                key={step.id}
                href={step.href}
                className="card-hover"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1.25rem',
                  padding: '1.25rem 1.5rem',
                  borderRadius: 'var(--radius-lg)',
                  textDecoration: 'none',
                  background: isNext ? 'var(--primary-50)' : 'var(--bg-primary)',
                  border: `1px solid ${isNext ? 'var(--primary-200)' : 'var(--border-default)'}`,
                  marginBottom: '0.75rem',
                  transition: 'all 0.2s ease',
                  boxShadow: isNext ? '0 4px 6px -1px rgba(79, 70, 229, 0.1)' : 'none',
                }}
              >
                {/* Step Icon */}
                <div style={{
                  width: 44, height: 44, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: isCompleted ? 'var(--success-100)' : isNext ? 'var(--primary-600)' : 'var(--bg-secondary)',
                  color: isCompleted ? 'var(--success-600)' : isNext ? 'white' : 'var(--text-tertiary)',
                }}>
                  {isCompleted ? (
                    <CheckCircle2 size={22} strokeWidth={2.5} />
                  ) : (
                    <Icon size={20} />
                  )}
                </div>

                {/* Step Content */}
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: '1.1rem', fontWeight: isNext ? 800 : 600,
                    color: isCompleted ? 'var(--text-tertiary)' : 'var(--text-primary)',
                    textDecoration: isCompleted ? 'line-through' : 'none',
                    textDecorationColor: 'var(--text-tertiary)',
                  }}>
                    {step.title}
                  </div>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.2rem', fontWeight: 500 }}>
                    {isCompleted ? 'Completed' : isNext ? 'Click here to continue' : 'Pending'}
                  </div>
                </div>

                {/* Action Arrow */}
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: isNext ? 'var(--primary-600)' : 'transparent',
                  color: isNext ? '#fff' : 'var(--text-tertiary)',
                  border: isNext ? 'none' : '1px solid var(--border-default)',
                  transition: 'transform 0.2s ease',
                  transform: isNext ? 'translateX(0)' : 'none',
                }}>
                  {isCompleted ? <CheckCircle2 size={18} /> : <ArrowRight size={18} />}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}
