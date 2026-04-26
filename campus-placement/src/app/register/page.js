'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    role: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    // Student fields
    collegeName: '',
    department: '',
    rollNumber: '',
    batchYear: '',
    // Employer fields
    companyName: '',
    industry: '',
    companyWebsite: '',
    // College admin fields
    collegeFullName: '',
    city: '',
    state: '',
    campusBindingToken: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const roles = [
    { id: 'student', label: 'Student', icon: '🎓', desc: 'Looking for placement opportunities' },
    { id: 'employer', label: 'Employer', icon: '🏢', desc: 'Hire talent from campuses' },
    { id: 'college_admin', label: 'College Admin', icon: '🏫', desc: 'Manage your institution\'s placements' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Registration failed');
        return;
      }

      if (data.pendingPlatformApproval) {
        router.push('/login?registered=pending-platform');
      } else {
        router.push('/login?registered=true');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-card animate-slideUp" style={{ maxWidth: '520px' }}>
          <Link href="/" className="auth-logo">
            <div className="sidebar-logo-icon">P</div>
            PlacementHub
          </Link>

          <h1 className="auth-title">Create your account</h1>
          <p className="auth-subtitle">Join thousands of students and employers on PlacementHub</p>

          {/* Steps indicator */}
          <div className="steps" style={{ marginBottom: '1.5rem' }}>
            <div className={`step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
              <div className="step-number">{step > 1 ? '✓' : '1'}</div>
              <span className="step-label">Role</span>
            </div>
            <div className={`step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
              <div className="step-number">{step > 2 ? '✓' : '2'}</div>
              <span className="step-label">Details</span>
            </div>
            <div className={`step ${step >= 3 ? 'active' : ''}`}>
              <div className="step-number">3</div>
              <span className="step-label">Finish</span>
            </div>
          </div>

          {error && (
            <div style={{ 
              padding: '0.75rem 1rem', 
              background: 'var(--danger-50)', 
              border: '1px solid var(--danger-100)',
              borderRadius: 'var(--radius-lg)',
              color: 'var(--danger-600)',
              fontSize: '0.875rem',
              marginBottom: '1rem'
            }}>
              {error}
            </div>
          )}

          {/* Step 1: Role Selection */}
          {step === 1 && (
            <div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
                {roles.map((role) => (
                  <div
                    key={role.id}
                    className={`role-card ${formData.role === role.id ? 'selected' : ''}`}
                    onClick={() => setFormData({ ...formData, role: role.id })}
                    style={{ display: 'flex', alignItems: 'center', gap: '1rem', textAlign: 'left', padding: '1.25rem' }}
                  >
                    <div style={{ fontSize: '2rem' }}>{role.icon}</div>
                    <div>
                      <div className="role-card-name" style={{ fontSize: '0.9375rem' }}>{role.label}</div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '0.125rem' }}>{role.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
              <button
                className="btn btn-primary"
                style={{ width: '100%' }}
                disabled={!formData.role}
                onClick={() => setStep(2)}
              >
                Continue →
              </button>
            </div>
          )}

          {/* Step 2: Personal Details */}
          {step === 2 && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">First Name <span className="required">*</span></label>
                  <input className="form-input" placeholder="First name" value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name</label>
                  <input className="form-input" placeholder="Last name" value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Email <span className="required">*</span></label>
                <input type="email" className="form-input" placeholder="you@example.com" value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
              </div>

              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="form-input" placeholder="+91 99999 99999" value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
              </div>

              {/* Role-specific fields */}
              {formData.role === 'student' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Campus enrollment key <span className="required">*</span></label>
                    <input
                      className="form-input font-mono"
                      placeholder="Provided by your placement office"
                      autoComplete="off"
                      value={formData.campusBindingToken}
                      onChange={(e) => setFormData({ ...formData, campusBindingToken: e.target.value })}
                    />
                    <span className="form-hint">
                      Long random code from your college — not your roll number. Ask the placement cell if you do not have it.
                    </span>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Department <span className="required">*</span></label>
                    <input
                      className="form-input"
                      placeholder="Enter your department (e.g. Aerospace, Chemical, Pharmacy)"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    />
                    <span className="form-hint">Department names vary by institution, so this is entered as free text.</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div className="form-group">
                      <label className="form-label">Roll Number</label>
                      <input className="form-input" placeholder="CS2021001" value={formData.rollNumber}
                        onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Batch Year</label>
                      <input className="form-input" type="number" placeholder="2025" value={formData.batchYear}
                        onChange={(e) => setFormData({ ...formData, batchYear: e.target.value })} />
                    </div>
                  </div>
                </>
              )}

              {formData.role === 'employer' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Company Name <span className="required">*</span></label>
                    <input className="form-input" placeholder="TechCorp Solutions" value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Industry</label>
                    <select className="form-select" value={formData.industry}
                      onChange={(e) => setFormData({ ...formData, industry: e.target.value })}>
                      <option value="">Select Industry</option>
                      <option value="Information Technology">Information Technology</option>
                      <option value="Finance">Finance & Banking</option>
                      <option value="Consulting">Consulting</option>
                      <option value="Manufacturing">Manufacturing</option>
                      <option value="Healthcare">Healthcare</option>
                      <option value="Education">Education</option>
                      <option value="E-commerce">E-commerce</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </>
              )}

              {formData.role === 'college_admin' && (
                <>
                  <div className="form-group">
                    <label className="form-label">College Name <span className="required">*</span></label>
                    <input className="form-input" placeholder="Indian Institute of Technology" value={formData.collegeFullName}
                      onChange={(e) => setFormData({ ...formData, collegeFullName: e.target.value })} required />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div className="form-group">
                      <label className="form-label">City</label>
                      <input className="form-input" placeholder="Mumbai" value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">State</label>
                      <input className="form-input" placeholder="Maharashtra" value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })} />
                    </div>
                  </div>
                </>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button className="btn btn-secondary" onClick={() => setStep(1)} style={{ flex: 1 }}>← Back</button>
                <button 
                  className="btn btn-primary" 
                  style={{ flex: 2 }}
                  disabled={
                    !formData.firstName ||
                    !formData.email ||
                    (formData.role === 'student' &&
                      formData.campusBindingToken.trim().replace(/\s+/g, '').length < 32)
                  }
                  onClick={() => setStep(3)}
                >
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Password */}
          {step === 3 && (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Password <span className="required">*</span></label>
                <input type="password" className="form-input" placeholder="Min 8 characters" value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })} required />
                <span className="form-hint">Must contain uppercase, lowercase, and a number</span>
              </div>

              <div className="form-group">
                <label className="form-label">Confirm Password <span className="required">*</span></label>
                <input type="password" className="form-input" placeholder="Re-enter password" value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} required />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setStep(2)} style={{ flex: 1 }}>← Back</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={loading}>
                  {loading ? 'Creating account...' : 'Create Account'}
                </button>
              </div>
            </form>
          )}

          <div className="auth-footer">
            Already have an account? <Link href="/login">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
