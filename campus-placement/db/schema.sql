-- ============================================
-- Campus Placement SaaS - Database Schema
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. TENANTS (Colleges / Groups)
-- ============================================
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    type VARCHAR(20) DEFAULT 'college' CHECK (type IN ('college', 'group')),
    logo_url TEXT,
    website VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    phone VARCHAR(20),
    email VARCHAR(255),
    communication_email VARCHAR(255),
    accreditation VARCHAR(100),
    naac_grade VARCHAR(10),
    nirf_rank INTEGER,
    established_year INTEGER,
    is_active BOOLEAN DEFAULT true,
    settings JSONB DEFAULT '{}',
    parent_tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_tenants_parent ON tenants(parent_tenant_id);
CREATE INDEX idx_tenants_communication_email ON tenants(communication_email);

-- ============================================
-- 2. USERS
-- ============================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    communication_email VARCHAR(255),
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('super_admin', 'college_admin', 'employer', 'student')),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    phone VARCHAR(20),
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    email_verified_at TIMESTAMP,
    email_verification_token VARCHAR(64),
    email_verification_expires_at TIMESTAMP,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_communication_email ON users(communication_email);
CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_email_verification_token ON users(email_verification_token) WHERE email_verification_token IS NOT NULL;

-- Reference departments (registration dropdown; global catalog)
CREATE TABLE IF NOT EXISTS reference_departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(120) NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT reference_departments_name_unique UNIQUE (name)
);

CREATE INDEX IF NOT EXISTS idx_reference_departments_sort ON reference_departments (sort_order, name);

-- ============================================
-- 3. STUDENT PROFILES
-- ============================================
CREATE TABLE student_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    roll_number VARCHAR(50),
    enrollment_number VARCHAR(50),
    department VARCHAR(100),
    branch VARCHAR(100),
    batch_year INTEGER,
    graduation_year INTEGER,
    cgpa DECIMAL(4,2),
    tenth_percentage DECIMAL(5,2),
    twelfth_percentage DECIMAL(5,2),
    diploma_percentage DECIMAL(5,2),
    backlogs_active INTEGER DEFAULT 0,
    backlogs_history INTEGER DEFAULT 0,
    gender VARCHAR(20),
    date_of_birth DATE,
    category VARCHAR(50),
    linkedin_url VARCHAR(255),
    github_url VARCHAR(255),
    portfolio_url VARCHAR(255),
    expected_salary_min DECIMAL(12,2),
    expected_salary_max DECIMAL(12,2),
    preferred_locations TEXT[],
    willing_to_relocate BOOLEAN DEFAULT true,
    placement_status VARCHAR(30) DEFAULT 'unplaced' CHECK (placement_status IN ('unplaced', 'placed', 'opted_out', 'higher_studies')),
    offers_count INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT false,
    is_alumni BOOLEAN NOT NULL DEFAULT false,
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMP,
    resume_url TEXT,
    bio TEXT,
    affiliated_institution_name VARCHAR(255),
    member_tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_student_tenant ON student_profiles(tenant_id);
CREATE INDEX idx_student_member_tenant ON student_profiles(member_tenant_id);
CREATE INDEX idx_student_department ON student_profiles(department);
CREATE INDEX idx_student_batch ON student_profiles(batch_year);
CREATE INDEX idx_student_status ON student_profiles(placement_status);

-- ============================================
-- 4. STUDENT SKILLS
-- ============================================
CREATE TABLE student_skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
    skill_name VARCHAR(100) NOT NULL,
    proficiency VARCHAR(20) DEFAULT 'intermediate' CHECK (proficiency IN ('beginner', 'intermediate', 'advanced', 'expert')),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_skills_student ON student_skills(student_id);

-- ============================================
-- 5. STUDENT EDUCATION
-- ============================================
CREATE TABLE student_education (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
    institution VARCHAR(255) NOT NULL,
    degree VARCHAR(100) NOT NULL,
    field_of_study VARCHAR(100),
    start_year INTEGER,
    end_year INTEGER,
    grade VARCHAR(20),
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 6. STUDENT DOCUMENTS
-- ============================================
CREATE TABLE student_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL,
    document_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_size INTEGER,
    is_verified BOOLEAN DEFAULT false,
    uploaded_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 7. STUDENT PROJECTS
-- ============================================
CREATE TABLE student_projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    tech_stack TEXT[],
    project_url VARCHAR(255),
    github_url VARCHAR(255),
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 8. EMPLOYER PROFILES
-- ============================================
CREATE TABLE employer_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    company_name VARCHAR(255) NOT NULL,
    company_slug VARCHAR(100) UNIQUE,
    industry VARCHAR(100),
    company_type VARCHAR(50) CHECK (company_type IN ('mnc', 'startup', 'psu', 'private', 'government', 'ngo', 'other')),
    company_size VARCHAR(50),
    founded_year INTEGER,
    website VARCHAR(255),
    logo_url TEXT,
    description TEXT,
    headquarters VARCHAR(255),
    locations TEXT[],
    linkedin_url VARCHAR(255),
    glassdoor_url VARCHAR(255),
    contact_person VARCHAR(255),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    is_verified BOOLEAN DEFAULT false,
    is_blacklisted BOOLEAN DEFAULT false,
    blacklist_reason TEXT,
    reliability_score DECIMAL(3,1) DEFAULT 0,
    total_hires INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_employer_company ON employer_profiles(company_name);

-- ============================================
-- 9. JOB POSTINGS
-- ============================================
CREATE TABLE job_postings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employer_id UUID REFERENCES employer_profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    job_type VARCHAR(30) CHECK (job_type IN ('full_time', 'internship', 'contract', 'ppo', 'hackathon', 'short_project', 'mentorship', 'guest_faculty')),
    category VARCHAR(100),
    locations TEXT[],
    salary_min DECIMAL(12,2),
    salary_max DECIMAL(12,2),
    salary_currency VARCHAR(3) DEFAULT 'INR',
    bond_duration_months INTEGER DEFAULT 0,
    bond_penalty DECIMAL(12,2),
    eligible_branches TEXT[],
    min_cgpa DECIMAL(4,2),
    max_backlogs INTEGER DEFAULT 0,
    min_tenth_pct DECIMAL(5,2),
    min_twelfth_pct DECIMAL(5,2),
    batch_year INTEGER,
    skills_required TEXT[],
    perks TEXT[],
    vacancies INTEGER DEFAULT 1,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'closed', 'cancelled')),
    is_visible BOOLEAN NOT NULL DEFAULT false,
    published_at TIMESTAMPTZ,
    additional_info TEXT,
    application_deadline TIMESTAMP,
    is_anonymous BOOLEAN DEFAULT false,
    min_experience_years INTEGER,
    max_experience_years INTEGER,
    work_mode VARCHAR(20),
    notice_period_days INTEGER,
    seniority_level VARCHAR(40),
    education_level VARCHAR(40),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_jobs_employer ON job_postings(employer_id);
CREATE INDEX idx_jobs_status ON job_postings(status);

-- ============================================
-- 10. PLACEMENT DRIVES
-- ============================================
CREATE TABLE placement_drives (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    employer_id UUID REFERENCES employer_profiles(id) ON DELETE CASCADE,
    job_id UUID REFERENCES job_postings(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    drive_type VARCHAR(30) DEFAULT 'on_campus' CHECK (drive_type IN ('on_campus', 'off_campus', 'virtual', 'hybrid')),
    drive_date DATE,
    start_time TIME,
    end_time TIME,
    venue VARCHAR(255),
    status VARCHAR(30) DEFAULT 'requested' CHECK (status IN ('requested', 'approved', 'scheduled', 'in_progress', 'completed', 'cancelled')),
    max_students INTEGER,
    registered_count INTEGER DEFAULT 0,
    selected_count INTEGER DEFAULT 0,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP,
    requires_ppt BOOLEAN DEFAULT false,
    ppt_completed BOOLEAN DEFAULT false,
    notes TEXT,
    ctc_breakup TEXT,
    social_shared TEXT[] DEFAULT '{}',
    attached_staff_user_ids UUID[] DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_drives_tenant ON placement_drives(tenant_id);
CREATE INDEX idx_drives_employer ON placement_drives(employer_id);
CREATE INDEX idx_drives_status ON placement_drives(status);
CREATE INDEX idx_drives_date ON placement_drives(drive_date);

-- ============================================
-- 11. DRIVE ROUNDS
-- ============================================
CREATE TABLE drive_rounds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    drive_id UUID REFERENCES placement_drives(id) ON DELETE CASCADE,
    round_number INTEGER NOT NULL,
    round_type VARCHAR(50) NOT NULL CHECK (round_type IN ('ppt', 'aptitude', 'coding', 'group_discussion', 'technical_interview', 'hr_interview', 'assignment', 'other')),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    scheduled_date DATE,
    start_time TIME,
    end_time TIME,
    venue VARCHAR(255),
    is_eliminatory BOOLEAN DEFAULT true,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 12. APPLICATIONS
-- ============================================
CREATE TABLE applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
    drive_id UUID REFERENCES placement_drives(id) ON DELETE CASCADE,
    job_id UUID REFERENCES job_postings(id) ON DELETE SET NULL,
    status VARCHAR(30) DEFAULT 'applied' CHECK (status IN ('applied', 'shortlisted', 'in_progress', 'selected', 'rejected', 'withdrawn', 'on_hold')),
    current_round INTEGER DEFAULT 0,
    applied_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    withdrawal_reason TEXT,
    notes TEXT,
    UNIQUE(student_id, drive_id)
);

CREATE INDEX idx_app_student ON applications(student_id);
CREATE INDEX idx_app_drive ON applications(drive_id);
CREATE INDEX idx_app_status ON applications(status);

CREATE TABLE job_posting_visibility (
    job_id UUID NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (job_id, tenant_id)
);

CREATE INDEX idx_job_visibility_tenant ON job_posting_visibility(tenant_id);

CREATE TABLE program_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES student_profiles(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
    status VARCHAR(30) NOT NULL DEFAULT 'applied' CHECK (status IN ('applied', 'shortlisted', 'in_progress', 'selected', 'rejected', 'withdrawn', 'on_hold')),
    notes TEXT,
    applied_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, job_id)
);

CREATE INDEX idx_program_app_student ON program_applications(student_id);
CREATE INDEX idx_program_app_job ON program_applications(job_id);

-- ============================================
-- 13. APPLICATION STATUS LOG (Audit Trail)
-- ============================================
CREATE TABLE application_status_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
    from_status VARCHAR(30),
    to_status VARCHAR(30) NOT NULL,
    changed_by UUID REFERENCES users(id),
    remarks TEXT,
    changed_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 14. SHORTLISTS
-- ============================================
CREATE TABLE shortlists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
    round_id UUID REFERENCES drive_rounds(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'qualified' CHECK (status IN ('qualified', 'eliminated', 'waitlisted', 'absent')),
    score DECIMAL(6,2),
    feedback TEXT,
    evaluated_by UUID REFERENCES users(id),
    evaluated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 15. OFFERS
-- ============================================
CREATE TABLE offers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
    student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
    employer_id UUID REFERENCES employer_profiles(id) ON DELETE CASCADE,
    drive_id UUID REFERENCES placement_drives(id) ON DELETE SET NULL,
    job_title VARCHAR(255),
    salary DECIMAL(12,2),
    salary_currency VARCHAR(3) DEFAULT 'INR',
    joining_date DATE,
    location VARCHAR(255),
    offer_letter_url TEXT,
    reported_company_name VARCHAR(255),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired', 'revoked')),
    deadline TIMESTAMP,
    accepted_at TIMESTAMP,
    rejected_at TIMESTAMP,
    rejection_reason TEXT,
    is_latest SMALLINT NOT NULL DEFAULT 1 CHECK (is_latest IN (0, 1)),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_offers_student ON offers(student_id);
CREATE INDEX idx_offers_student_is_latest ON offers(student_id) WHERE is_latest = 1;
CREATE INDEX idx_offers_employer ON offers(employer_id);
CREATE INDEX idx_offers_status ON offers(status);

-- ============================================
-- 16. COLLEGE SETTINGS
-- ============================================
CREATE TABLE college_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
    max_offers_per_student INTEGER DEFAULT 2,
    offer_acceptance_window_days INTEGER DEFAULT 7,
    min_cgpa_threshold DECIMAL(4,2) DEFAULT 0,
    allow_backlog_students BOOLEAN DEFAULT true,
    max_backlogs_allowed INTEGER DEFAULT 2,
    require_ppt_before_apply BOOLEAN DEFAULT false,
    auto_verify_students BOOLEAN DEFAULT false,
    placement_season_start DATE,
    placement_season_end DATE,
    buffer_days_between_drives INTEGER DEFAULT 1,
    fcfs_enabled BOOLEAN DEFAULT true,
    sponsorship_cheque_payable_to VARCHAR(280),
    sponsorship_bank_account_name VARCHAR(280),
    sponsorship_bank_name VARCHAR(160),
    sponsorship_bank_account_number VARCHAR(64),
    sponsorship_bank_ifsc VARCHAR(20),
    sponsorship_bank_branch VARCHAR(280),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 17. COLLEGE CALENDAR
-- ============================================
CREATE TABLE college_calendar (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    event_type VARCHAR(30) CHECK (event_type IN ('exam', 'holiday', 'festival', 'placement_drive', 'interview_slot', 'workshop', 'other')),
    start_date DATE NOT NULL,
    end_date DATE,
    is_blocking BOOLEAN DEFAULT false,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_calendar_tenant ON college_calendar(tenant_id);
CREATE INDEX idx_calendar_dates ON college_calendar(start_date, end_date);

-- ============================================
-- 18. COLLEGE FACILITIES
-- ============================================
CREATE TABLE college_facilities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    facility_type VARCHAR(50),
    capacity INTEGER,
    has_projector BOOLEAN DEFAULT false,
    has_ac BOOLEAN DEFAULT false,
    has_wifi BOOLEAN DEFAULT true,
    has_video_conf BOOLEAN DEFAULT false,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 19. EMPLOYER APPROVALS
-- ============================================
CREATE TABLE employer_approvals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    employer_id UUID REFERENCES employer_profiles(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'blacklisted', 'revoked')),
    status_before_revoke VARCHAR(20),
    revoked_at TIMESTAMP,
    revoked_by UUID REFERENCES users(id),
    revoked_by_role VARCHAR(20),
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP,
    rejection_reason TEXT,
    coordination_poc_user_ids UUID[] DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(tenant_id, employer_id)
);

-- ============================================
-- 20. SPONSORSHIP OPPORTUNITIES
-- ============================================
CREATE TABLE sponsorship_opportunities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    category VARCHAR(120) NOT NULL,
    description TEXT,
    tier_name VARCHAR(120) NOT NULL,
    price_inr BIGINT NOT NULL CHECK (price_inr >= 0),
    benefits TEXT[] DEFAULT '{}',
    label VARCHAR(60),
    is_active BOOLEAN DEFAULT true,
    payments_permitted INTEGER NOT NULL DEFAULT 1 CHECK (payments_permitted >= 1 AND payments_permitted <= 36),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sponsorship_opportunities_tenant ON sponsorship_opportunities(tenant_id);
CREATE INDEX idx_sponsorship_opportunities_active ON sponsorship_opportunities(is_active);

CREATE TABLE sponsorship_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    opportunity_id UUID NOT NULL REFERENCES sponsorship_opportunities(id) ON DELETE CASCADE,
    employer_profile_id UUID NOT NULL REFERENCES employer_profiles(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    payment_sequence INTEGER NOT NULL CHECK (payment_sequence >= 1),
    amount_inr BIGINT NOT NULL CHECK (amount_inr > 0),
    method VARCHAR(20) NOT NULL CHECK (method IN ('online', 'cheque', 'bank_transfer')),
    status VARCHAR(40) NOT NULL DEFAULT 'recorded',
    gateway_provider VARCHAR(80),
    gateway_reference VARCHAR(200),
    cheque_mailed_at TIMESTAMPTZ,
    bank_transfer_confirmed_at TIMESTAMPTZ,
    proof_attachment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (opportunity_id, employer_profile_id, payment_sequence)
);

CREATE INDEX idx_sponsorship_payments_tenant_created ON sponsorship_payments(tenant_id, created_at DESC);
CREATE INDEX idx_sponsorship_payments_employer ON sponsorship_payments(employer_profile_id);

-- ============================================
-- 21. CLARIFICATION BATCHES + QUESTIONS
-- ============================================
CREATE TABLE clarification_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    company VARCHAR(255) NOT NULL,
    posted_by VARCHAR(255) NOT NULL,
    posted_at DATE NOT NULL DEFAULT CURRENT_DATE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE clarification_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id UUID NOT NULL REFERENCES clarification_batches(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    answer_text TEXT,
    answered_by VARCHAR(255),
    answered_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_clarification_batches_tenant ON clarification_batches(tenant_id, posted_at DESC, created_at DESC);
CREATE INDEX idx_clarification_questions_batch ON clarification_questions(batch_id, created_at ASC);

-- ============================================
-- 22. NOTIFICATIONS
-- ============================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(30) DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error', 'drive', 'offer', 'application')),
    link VARCHAR(255),
    is_read BOOLEAN DEFAULT false,
    is_starred BOOLEAN NOT NULL DEFAULT false,
    deleted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notif_user ON notifications(user_id);
CREATE INDEX idx_notif_read ON notifications(is_read);
CREATE INDEX idx_notif_user_starred ON notifications (user_id, created_at DESC) WHERE deleted_at IS NULL AND is_starred = true;
CREATE INDEX idx_notif_user_trash ON notifications (user_id, created_at DESC) WHERE deleted_at IS NOT NULL;

-- ============================================
-- 23. AUDIT LOGS
-- ============================================
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_tenant ON audit_logs(tenant_id);
CREATE INDEX idx_audit_action ON audit_logs(action);

-- ============================================
-- 24. MESSAGE TEMPLATES
-- ============================================
CREATE TABLE message_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(255),
    body TEXT NOT NULL,
    template_type VARCHAR(20) DEFAULT 'email' CHECK (template_type IN ('email', 'sms', 'notification')),
    variables TEXT[],
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 25. EMPLOYER RATINGS
-- ============================================
CREATE TABLE employer_ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employer_id UUID REFERENCES employer_profiles(id) ON DELETE CASCADE,
    student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
    drive_id UUID REFERENCES placement_drives(id) ON DELETE SET NULL,
    professionalism INTEGER CHECK (professionalism BETWEEN 1 AND 5),
    transparency INTEGER CHECK (transparency BETWEEN 1 AND 5),
    timeliness INTEGER CHECK (timeliness BETWEEN 1 AND 5),
    overall_rating INTEGER CHECK (overall_rating BETWEEN 1 AND 5),
    feedback TEXT,
    is_anonymous BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(student_id, drive_id)
);

-- ============================================
-- 26. PLATFORM FEEDBACK (product loop)
-- ============================================
CREATE TABLE platform_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    title VARCHAR(500) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(40) NOT NULL DEFAULT 'Submitted'
        CHECK (status IN ('Submitted', 'Under Review', 'Planned', 'Closed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_platform_feedback_user ON platform_feedback(user_id);
CREATE INDEX idx_platform_feedback_status ON platform_feedback(status);
CREATE INDEX idx_platform_feedback_created ON platform_feedback(created_at DESC);

-- ============================================
-- 27. PLATFORM FEEDBACK REPLIES (discussion track)
-- ============================================
CREATE TABLE platform_feedback_replies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    feedback_id UUID NOT NULL REFERENCES platform_feedback(id) ON DELETE CASCADE,
    author_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    message TEXT NOT NULL,
    channel VARCHAR(30) NOT NULL DEFAULT 'dashboard',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_feedback_replies_feedback ON platform_feedback_replies(feedback_id, created_at DESC);

-- ============================================
-- 28. SYSTEM EMAIL TEMPLATES (Super Admin)
-- ============================================
CREATE TABLE system_email_templates (
    template_key VARCHAR(64) PRIMARY KEY,
    description TEXT,
    subject_template TEXT NOT NULL,
    body_template TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE email_template_overrides (
    scope_type VARCHAR(20) NOT NULL CHECK (scope_type IN ('employer', 'college')),
    scope_id UUID NOT NULL,
    template_key VARCHAR(64) NOT NULL,
    subject_template TEXT NOT NULL,
    body_template TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    PRIMARY KEY (scope_type, scope_id, template_key)
);

CREATE INDEX idx_email_tpl_override_scope ON email_template_overrides(scope_type, scope_id);

-- ============================================
-- 29. CAMPUS GUEST NEED — EMPLOYER CONFIRMATION EMAILS
-- ============================================
CREATE TABLE campus_guest_confirmation_sends (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID NOT NULL REFERENCES campus_engagement_listings(id) ON DELETE CASCADE,
    employer_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    to_email TEXT NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (listing_id, employer_user_id)
);

CREATE INDEX idx_campus_guest_conf_listing ON campus_guest_confirmation_sends (listing_id);
CREATE INDEX idx_campus_guest_conf_employer ON campus_guest_confirmation_sends (employer_user_id);

-- ============================================
-- 30. MAIL DELIVERY LOGS (outbound email audit)
-- ============================================
CREATE TABLE mail_delivery_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    context VARCHAR(80),
    status VARCHAR(20) NOT NULL CHECK (status IN ('sent', 'skipped', 'failed')),
    skip_reason VARCHAR(80),
    original_to TEXT,
    resolved_to TEXT,
    subject_truncated VARCHAR(500),
    error_message TEXT,
    error_code VARCHAR(100),
    message_id TEXT,
    smtp_response TEXT,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_mail_delivery_logs_created ON mail_delivery_logs (created_at DESC);
CREATE INDEX idx_mail_delivery_logs_status ON mail_delivery_logs (status);
CREATE INDEX idx_mail_delivery_logs_context ON mail_delivery_logs (context);
