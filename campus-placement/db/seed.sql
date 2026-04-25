-- ============================================
-- Campus Placement SaaS - Seed Data
-- ============================================

-- Default password for all seeded users: 'Admin@123'
-- bcrypt hash: $2b$10$ltqrYuTkwv8DSRWH/v5kyeuL2KX7OX8IwqYect/Bbp/8kZOXcVp82

-- Reset existing data so this script is re-runnable in test environments.
TRUNCATE TABLE
  audit_logs,
  message_templates,
  notifications,
  clarification_questions,
  clarification_batches,
  sponsorship_opportunities,
  offers,
  shortlists,
  application_status_log,
  program_applications,
  job_posting_visibility,
  applications,
  drive_rounds,
  placement_drives,
  job_postings,
  student_education,
  student_documents,
  student_projects,
  student_skills,
  student_profiles,
  employer_approvals,
  employer_ratings,
  college_calendar,
  college_facilities,
  college_settings,
  employer_profiles,
  users,
  tenants
RESTART IDENTITY CASCADE;

-- NOTE:
-- sponsorship opportunities and clarifications are now first-class tables.
-- dedicated interview-slot table is still pending (current app uses college_calendar for slot events).

-- 1. Create Tenants (Colleges)
INSERT INTO tenants (id, name, slug, type, city, state, email, accreditation, naac_grade, established_year) VALUES
('a1000000-0000-0000-0000-000000000001', 'Indian Institute of Technology, Madras', 'iit-madras', 'college', 'Chennai', 'Tamil Nadu', 'placement@iitm.edu', 'AICTE', 'A++', 1958),
('a1000000-0000-0000-0000-000000000002', 'National Institute of Technology, Trichy', 'nit-trichy', 'college', 'Tiruchirappalli', 'Tamil Nadu', 'placement@nitt.edu', 'AICTE', 'A+', 1964),
('a1000000-0000-0000-0000-000000000003', 'Birla Institute of Technology, Pilani', 'bits-pilani', 'college', 'Pilani', 'Rajasthan', 'placement@bits.edu', 'AICTE', 'A+', 1964);

-- 2. Create Users
-- Super Admin
INSERT INTO users (id, email, password_hash, role, first_name, last_name, is_active, is_verified) VALUES
('b1000000-0000-0000-0000-000000000001', 'admin@placementhub.com', '$2b$10$ltqrYuTkwv8DSRWH/v5kyeuL2KX7OX8IwqYect/Bbp/8kZOXcVp82', 'super_admin', 'Platform', 'Admin', true, true);

-- College Admins
INSERT INTO users (id, tenant_id, email, password_hash, role, first_name, last_name, is_active, is_verified) VALUES
('b1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 'admin@iitm.edu', '$2b$10$ltqrYuTkwv8DSRWH/v5kyeuL2KX7OX8IwqYect/Bbp/8kZOXcVp82', 'college_admin', 'Rajesh', 'Kumar', true, true),
('b1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000002', 'admin@nitt.edu', '$2b$10$ltqrYuTkwv8DSRWH/v5kyeuL2KX7OX8IwqYect/Bbp/8kZOXcVp82', 'college_admin', 'Priya', 'Sharma', true, true),
('b1000000-0000-0000-0000-000000000012', 'a1000000-0000-0000-0000-000000000003', 'admin@bits.edu', '$2b$10$ltqrYuTkwv8DSRWH/v5kyeuL2KX7OX8IwqYect/Bbp/8kZOXcVp82', 'college_admin', 'Suresh', 'Rao', true, true),
('b1000000-0000-0000-0000-000000000017', 'a1000000-0000-0000-0000-000000000001', 'committee@iitm.edu', '$2b$10$ltqrYuTkwv8DSRWH/v5kyeuL2KX7OX8IwqYect/Bbp/8kZOXcVp82', 'college_admin', 'Placement', 'Committee', true, true);

-- Employers
INSERT INTO users (id, email, password_hash, role, first_name, last_name, is_active, is_verified) VALUES
('b1000000-0000-0000-0000-000000000004', 'hr@techcorp.com', '$2b$10$ltqrYuTkwv8DSRWH/v5kyeuL2KX7OX8IwqYect/Bbp/8kZOXcVp82', 'employer', 'Anita', 'Desai', true, true),
('b1000000-0000-0000-0000-000000000005', 'hr@globalsoft.com', '$2b$10$ltqrYuTkwv8DSRWH/v5kyeuL2KX7OX8IwqYect/Bbp/8kZOXcVp82', 'employer', 'Vikram', 'Singh', true, true),
('b1000000-0000-0000-0000-000000000006', 'hr@infosys.com', '$2b$10$ltqrYuTkwv8DSRWH/v5kyeuL2KX7OX8IwqYect/Bbp/8kZOXcVp82', 'employer', 'Meera', 'Nair', true, true),
('b1000000-0000-0000-0000-000000000013', 'hr@academic.nitt.edu', '$2b$10$ltqrYuTkwv8DSRWH/v5kyeuL2KX7OX8IwqYect/Bbp/8kZOXcVp82', 'employer', 'NITT', 'Academic Affairs', true, true),
('b1000000-0000-0000-0000-000000000014', 'hr@alumni.bits.edu', '$2b$10$ltqrYuTkwv8DSRWH/v5kyeuL2KX7OX8IwqYect/Bbp/8kZOXcVp82', 'employer', 'BITS', 'Alumni Association', true, true);

-- Students (IIT Mumbai)
INSERT INTO users (id, tenant_id, email, password_hash, role, first_name, last_name, is_active, is_verified) VALUES
('b1000000-0000-0000-0000-000000000007', 'a1000000-0000-0000-0000-000000000001', 'arjun.verma@iitm.edu', '$2b$10$ltqrYuTkwv8DSRWH/v5kyeuL2KX7OX8IwqYect/Bbp/8kZOXcVp82', 'student', 'Arjun', 'Verma', true, true),
('b1000000-0000-0000-0000-000000000008', 'a1000000-0000-0000-0000-000000000001', 'sneha.iyer@iitm.edu', '$2b$10$ltqrYuTkwv8DSRWH/v5kyeuL2KX7OX8IwqYect/Bbp/8kZOXcVp82', 'student', 'Sneha', 'Iyer', true, true),
('b1000000-0000-0000-0000-000000000009', 'a1000000-0000-0000-0000-000000000001', 'rohan.patel@iitm.edu', '$2b$10$ltqrYuTkwv8DSRWH/v5kyeuL2KX7OX8IwqYect/Bbp/8kZOXcVp82', 'student', 'Rohan', 'Patel', true, true),
('b1000000-0000-0000-0000-000000000010', 'a1000000-0000-0000-0000-000000000001', 'kavya.reddy@iitm.edu', '$2b$10$ltqrYuTkwv8DSRWH/v5kyeuL2KX7OX8IwqYect/Bbp/8kZOXcVp82', 'student', 'Kavya', 'Reddy', true, true),
('b1000000-0000-0000-0000-000000000011', 'a1000000-0000-0000-0000-000000000001', 'amit.sharma@iitm.edu', '$2b$10$ltqrYuTkwv8DSRWH/v5kyeuL2KX7OX8IwqYect/Bbp/8kZOXcVp82', 'student', 'Amit', 'Sharma', true, true),
('b1000000-0000-0000-0000-000000000015', 'a1000000-0000-0000-0000-000000000002', 'sneha.rao@nitt.edu', '$2b$10$ltqrYuTkwv8DSRWH/v5kyeuL2KX7OX8IwqYect/Bbp/8kZOXcVp82', 'student', 'Sneha', 'Rao', true, true),
('b1000000-0000-0000-0000-000000000016', 'a1000000-0000-0000-0000-000000000003', 'rohan.mehta@bits.edu', '$2b$10$ltqrYuTkwv8DSRWH/v5kyeuL2KX7OX8IwqYect/Bbp/8kZOXcVp82', 'student', 'Rohan', 'Mehta', true, true);

-- 3. College Settings
INSERT INTO college_settings (tenant_id, max_offers_per_student, offer_acceptance_window_days, min_cgpa_threshold, placement_season_start, placement_season_end) VALUES
('a1000000-0000-0000-0000-000000000001', 2, 7, 6.0, '2026-08-01', '2027-05-31'),
('a1000000-0000-0000-0000-000000000002', 1, 5, 6.5, '2026-08-01', '2027-05-31'),
('a1000000-0000-0000-0000-000000000003', 2, 7, 6.0, '2026-08-01', '2027-05-31');

-- 4. Employer Profiles
INSERT INTO employer_profiles (id, user_id, company_name, company_slug, industry, company_type, company_size, website, description, headquarters, locations) VALUES
('c1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000004', 'TechCorp Solutions', 'techcorp', 'Information Technology', 'mnc', '10000+', 'https://techcorp.com', 'Leading global technology solutions provider specializing in AI, cloud computing, and enterprise software.', 'Bangalore, India', ARRAY['Bangalore', 'Hyderabad', 'Mumbai', 'Pune']),
('c1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000005', 'GlobalSoft Technologies', 'globalsoft', 'Information Technology', 'mnc', '5000-10000', 'https://globalsoft.com', 'Enterprise software development and consulting company with operations in 20+ countries.', 'Pune, India', ARRAY['Pune', 'Chennai', 'Noida']),
('c1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000006', 'Infosys Limited', 'infosys', 'Information Technology', 'mnc', '10000+', 'https://infosys.com', 'Global leader in next-generation digital services and consulting.', 'Bangalore, India', ARRAY['Bangalore', 'Mysuru', 'Pune', 'Hyderabad', 'Chennai']),
('c1000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000013', 'NIT Trichy Academic Affairs', 'nitt-academic', 'Education', 'government', '1000-5000', 'https://nitt.edu', 'Academic hiring and guest faculty management for NIT Trichy.', 'Trichy, India', ARRAY['Trichy']),
('c1000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000014', 'BITS Alumni Association', 'bits-alumni', 'Education', 'ngo', '10000+', 'https://bits-alumni.org', 'Connecting current students with established alumni for mentorship and guidance.', 'Pilani, India', ARRAY['Pilani']);

-- 4b. Employer campus approvals: none in seed — employers request tie-ups from the app.

-- 5. Student Profiles
INSERT INTO student_profiles (user_id, tenant_id, roll_number, department, branch, batch_year, graduation_year, cgpa, tenth_percentage, twelfth_percentage, gender, placement_status, is_verified, bio) VALUES
('b1000000-0000-0000-0000-000000000007', 'a1000000-0000-0000-0000-000000000001', 'CS2021001', 'Computer Science', 'Computer Science & Engineering', 2021, 2025, 8.72, 94.5, 91.2, 'male', 'unplaced', true, 'Passionate about AI/ML and full-stack development. Looking for challenging opportunities in technology.'),
('b1000000-0000-0000-0000-000000000008', 'a1000000-0000-0000-0000-000000000001', 'CS2021002', 'Computer Science', 'Computer Science & Engineering', 2021, 2025, 9.15, 96.0, 93.8, 'female', 'unplaced', true, 'Interested in data science, NLP, and backend engineering. Active contributor to open-source.'),
('b1000000-0000-0000-0000-000000000009', 'a1000000-0000-0000-0000-000000000001', 'EC2021001', 'Electronics', 'Electronics & Communication', 2021, 2025, 7.65, 88.0, 85.5, 'male', 'unplaced', true, 'Experienced in embedded systems and IoT. Strong fundamentals in signal processing.'),
('b1000000-0000-0000-0000-000000000010', 'a1000000-0000-0000-0000-000000000001', 'CS2021003', 'Computer Science', 'Computer Science & Engineering', 2021, 2025, 8.45, 92.0, 89.0, 'female', 'placed', true, 'Full-stack developer with experience in React, Node.js, and Python. Placed at TechCorp.'),
('b1000000-0000-0000-0000-000000000011', 'a1000000-0000-0000-0000-000000000001', 'ME2021001', 'Mechanical', 'Mechanical Engineering', 2021, 2025, 7.20, 85.0, 82.0, 'male', 'unplaced', true, 'Interested in product design and manufacturing automation.'),
('b1000000-0000-0000-0000-000000000015', 'a1000000-0000-0000-0000-000000000002', 'CS2021101', 'Computer Science', 'Computer Science & Engineering', 2021, 2025, 8.90, 95.0, 92.5, 'female', 'unplaced', true, 'Full stack developer with passion for building scalable web applications.'),
('b1000000-0000-0000-0000-000000000016', 'a1000000-0000-0000-0000-000000000003', 'CS2021201', 'Computer Science', 'Computer Science & Engineering', 2021, 2025, 9.20, 98.0, 96.0, 'male', 'unplaced', true, 'AI/ML enthusiast. Working on deep learning applications and research.');

-- 6. Student Skills
INSERT INTO student_skills (student_id, skill_name, proficiency) VALUES
((SELECT id FROM student_profiles WHERE roll_number = 'CS2021001'), 'Python', 'advanced'),
((SELECT id FROM student_profiles WHERE roll_number = 'CS2021001'), 'JavaScript', 'advanced'),
((SELECT id FROM student_profiles WHERE roll_number = 'CS2021001'), 'React', 'intermediate'),
((SELECT id FROM student_profiles WHERE roll_number = 'CS2021001'), 'Machine Learning', 'intermediate'),
((SELECT id FROM student_profiles WHERE roll_number = 'CS2021001'), 'SQL', 'advanced'),
((SELECT id FROM student_profiles WHERE roll_number = 'CS2021002'), 'Python', 'expert'),
((SELECT id FROM student_profiles WHERE roll_number = 'CS2021002'), 'TensorFlow', 'advanced'),
((SELECT id FROM student_profiles WHERE roll_number = 'CS2021002'), 'NLP', 'advanced'),
((SELECT id FROM student_profiles WHERE roll_number = 'CS2021002'), 'Java', 'intermediate'),
((SELECT id FROM student_profiles WHERE roll_number = 'CS2021002'), 'Docker', 'intermediate'),
((SELECT id FROM student_profiles WHERE roll_number = 'EC2021001'), 'C/C++', 'advanced'),
((SELECT id FROM student_profiles WHERE roll_number = 'EC2021001'), 'VHDL', 'intermediate'),
((SELECT id FROM student_profiles WHERE roll_number = 'EC2021001'), 'Arduino', 'advanced'),
((SELECT id FROM student_profiles WHERE roll_number = 'EC2021001'), 'Python', 'intermediate');

-- 7. Job Postings
INSERT INTO job_postings (id, employer_id, title, description, job_type, category, locations, salary_min, salary_max, eligible_branches, min_cgpa, max_backlogs, batch_year, skills_required, vacancies, status) VALUES
('d1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'Software Development Engineer', 'Join our engineering team to build scalable products used by millions. Work on cutting-edge technologies including cloud computing, microservices, and distributed systems.', 'full_time', 'Engineering', ARRAY['Bangalore', 'Hyderabad'], 1200000, 1800000, ARRAY['Computer Science & Engineering', 'Information Technology'], 7.0, 0, 2025, ARRAY['Java', 'Python', 'DSA', 'System Design'], 15, 'published'),
('d1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000001', 'Data Science Intern', 'Work with our data science team on real-world problems in ML and analytics. 6-month internship with PPO opportunity.', 'internship', 'Data Science', ARRAY['Bangalore'], 60000, 80000, ARRAY['Computer Science & Engineering', 'Mathematics'], 8.0, 0, 2025, ARRAY['Python', 'Machine Learning', 'Statistics'], 5, 'published'),
('d1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000002', 'Full Stack Developer', 'Build enterprise-grade web applications using modern JavaScript frameworks and cloud technologies.', 'full_time', 'Engineering', ARRAY['Pune', 'Chennai'], 1000000, 1500000, ARRAY['Computer Science & Engineering', 'Information Technology', 'Electronics & Communication'], 6.5, 1, 2025, ARRAY['React', 'Node.js', 'PostgreSQL'], 10, 'published'),
('d1000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000003', 'Systems Engineer', 'Join Infosys as a Systems Engineer and work on cutting-edge projects across domains.', 'full_time', 'Engineering', ARRAY['Bangalore', 'Mysuru', 'Pune'], 800000, 1000000, ARRAY['Computer Science & Engineering', 'Electronics & Communication', 'Mechanical Engineering', 'Electrical Engineering'], 6.0, 0, 2025, ARRAY['Java', 'SQL', 'Problem Solving'], 50, 'published'),
('d1000000-0000-0000-0000-000000000005', 'c1000000-0000-0000-0000-000000000001', 'TechCorp Innovations Hackathon', 'Join the largest coding hackathon. Build innovative solutions using GenAI and win amazing prizes + PPO opportunities.', 'hackathon', 'Engineering', ARRAY['Virtual'], 0, 0, ARRAY['Computer Science & Engineering', 'Information Technology'], 0.0, 0, 2025, ARRAY['Problem Solving', 'Coding'], 100, 'published'),
('d1000000-0000-0000-0000-000000000006', 'c1000000-0000-0000-0000-000000000002', 'GlobalSoft Summer Project', 'Short term summer project on modernizing legacy systems using microservices architecture.', 'short_project', 'Engineering', ARRAY['Remote'], 20000, 30000, ARRAY['Computer Science & Engineering'], 7.0, 0, 2025, ARRAY['Java', 'Spring Boot', 'Microservices'], 10, 'published'),
('d1000000-0000-0000-0000-000000000007', 'c1000000-0000-0000-0000-000000000005', 'Alumni Mentorship Program 2026', 'Get paired with senior industry leaders who are alumni of BITS Pilani for a 6-month mentorship covering career guidance, interview prep, and networking.', 'mentorship', 'Career Growth', ARRAY['Virtual'], 0, 0, ARRAY['Computer Science & Engineering', 'Electronics & Communication', 'Mechanical Engineering'], 0.0, 0, 2025, ARRAY['Communication', 'Leadership'], 50, 'published'),
('d1000000-0000-0000-0000-000000000008', 'c1000000-0000-0000-0000-000000000004', 'Guest Faculty in AI/ML', 'Looking for industry experts to conduct a 2-week workshop on Advanced Machine Learning and Neural Networks for pre-final year students.', 'guest_faculty', 'Education', ARRAY['Trichy'], 100000, 150000, ARRAY['Computer Science & Engineering'], 0.0, 0, 0, ARRAY['AI/ML', 'Teaching', 'Industry Experience'], 2, 'published');

-- 8. Placement Drives
INSERT INTO placement_drives (id, tenant_id, employer_id, job_id, title, description, drive_type, drive_date, start_time, end_time, venue, status, max_students, registered_count) VALUES
('e1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001', 'TechCorp - SDE Recruitment Drive', 'Annual recruitment drive for Software Development Engineer positions.', 'on_campus', '2026-09-15', '09:00', '17:00', 'Placement Hall A', 'scheduled', 100, 45),
('e1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000003', 'GlobalSoft - Full Stack Developer Hiring', 'Hiring full stack developers for Pune and Chennai offices.', 'virtual', '2026-09-22', '10:00', '16:00', 'Online (Zoom)', 'approved', 80, 32),
('e1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000004', 'Infosys - Mass Recruitment 2026', 'Mega hiring drive for Systems Engineer role across multiple branches.', 'on_campus', '2026-10-05', '08:30', '18:00', 'Main Auditorium', 'requested', 200, 0);

-- 9. Drive Rounds
INSERT INTO drive_rounds (drive_id, round_number, round_type, title, scheduled_date, is_eliminatory) VALUES
('e1000000-0000-0000-0000-000000000001', 1, 'aptitude', 'Online Aptitude Test', '2026-09-15', true),
('e1000000-0000-0000-0000-000000000001', 2, 'coding', 'Coding Round', '2026-09-15', true),
('e1000000-0000-0000-0000-000000000001', 3, 'technical_interview', 'Technical Interview', '2026-09-16', true),
('e1000000-0000-0000-0000-000000000001', 4, 'hr_interview', 'HR Interview', '2026-09-16', false),
('e1000000-0000-0000-0000-000000000002', 1, 'coding', 'Online Coding Assessment', '2026-09-22', true),
('e1000000-0000-0000-0000-000000000002', 2, 'technical_interview', 'Technical Interview (Video)', '2026-09-23', true),
('e1000000-0000-0000-0000-000000000002', 3, 'hr_interview', 'HR Discussion', '2026-09-23', false);

-- 10. Applications
INSERT INTO applications (student_id, drive_id, job_id, status, current_round, applied_at) VALUES
((SELECT id FROM student_profiles WHERE roll_number = 'CS2021001'), 'e1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001', 'shortlisted', 2, NOW() - INTERVAL '5 days'),
((SELECT id FROM student_profiles WHERE roll_number = 'CS2021002'), 'e1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001', 'in_progress', 3, NOW() - INTERVAL '5 days'),
((SELECT id FROM student_profiles WHERE roll_number = 'CS2021001'), 'e1000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000003', 'applied', 0, NOW() - INTERVAL '2 days'),
((SELECT id FROM student_profiles WHERE roll_number = 'CS2021003'), 'e1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001', 'selected', 4, NOW() - INTERVAL '5 days');

-- 11. Offers
INSERT INTO offers (application_id, student_id, employer_id, drive_id, job_title, salary, joining_date, location, status, deadline) VALUES
((SELECT a.id FROM applications a JOIN student_profiles s ON a.student_id = s.id WHERE s.roll_number = 'CS2021003' AND a.drive_id = 'e1000000-0000-0000-0000-000000000001'),
 (SELECT id FROM student_profiles WHERE roll_number = 'CS2021003'),
 'c1000000-0000-0000-0000-000000000001',
 'e1000000-0000-0000-0000-000000000001',
 'Software Development Engineer',
 1500000, '2026-07-01', 'Bangalore', 'accepted', NOW() + INTERVAL '7 days');

-- 12. Notifications
INSERT INTO notifications (user_id, title, message, type, link) VALUES
('b1000000-0000-0000-0000-000000000007', 'Shortlisted for TechCorp Drive', 'Congratulations! You have been shortlisted for the coding round at TechCorp.', 'success', '/dashboard/student/applications'),
('b1000000-0000-0000-0000-000000000008', 'Interview Scheduled', 'Your technical interview for TechCorp SDE position is scheduled for Sep 16.', 'drive', '/dashboard/student/applications'),
('b1000000-0000-0000-0000-000000000002', 'New Drive Request', 'Infosys has requested a placement drive on Oct 5, 2026. Please review.', 'info', '/dashboard/college/drives'),
('b1000000-0000-0000-0000-000000000010', 'Offer Received!', 'You have received an offer from TechCorp for SDE position. Accept before deadline.', 'offer', '/dashboard/student/offers');

-- 13. Job posting visibility (critical for student-side visibility)
INSERT INTO job_posting_visibility (job_id, tenant_id) VALUES
('d1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001'),
('d1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001'),
('d1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000001'),
('d1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000001'),
('d1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000001'),
('d1000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000001'),
('d1000000-0000-0000-0000-000000000007', 'a1000000-0000-0000-0000-000000000003'),
('d1000000-0000-0000-0000-000000000008', 'a1000000-0000-0000-0000-000000000002'),
('d1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000002'),
('d1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000002');

-- 14. Employer approvals (workflow coverage: approved + pending + rejected)
INSERT INTO employer_approvals (tenant_id, employer_id, status, approved_by, approved_at, rejection_reason, created_at) VALUES
('a1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'approved', 'b1000000-0000-0000-0000-000000000002', NOW() - INTERVAL '25 days', NULL, NOW() - INTERVAL '30 days'),
('a1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000002', 'approved', 'b1000000-0000-0000-0000-000000000002', NOW() - INTERVAL '20 days', NULL, NOW() - INTERVAL '24 days'),
('a1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000003', 'pending', NULL, NULL, NULL, NOW() - INTERVAL '3 days'),
('a1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000003', 'approved', 'b1000000-0000-0000-0000-000000000003', NOW() - INTERVAL '16 days', NULL, NOW() - INTERVAL '18 days'),
('a1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000001', 'rejected', 'b1000000-0000-0000-0000-000000000003', NOW() - INTERVAL '7 days', 'Past no-show in prior drive cycle', NOW() - INTERVAL '9 days'),
('a1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000005', 'approved', 'b1000000-0000-0000-0000-000000000012', NOW() - INTERVAL '11 days', NULL, NOW() - INTERVAL '13 days');

-- 15. Program applications (internships / projects / hackathons / mentorship / guest faculty)
INSERT INTO program_applications (student_id, job_id, status, notes, applied_at) VALUES
((SELECT id FROM student_profiles WHERE roll_number = 'CS2021001'), 'd1000000-0000-0000-0000-000000000002', 'applied', 'Interested in NLP-focused workstreams.', NOW() - INTERVAL '6 days'),
((SELECT id FROM student_profiles WHERE roll_number = 'CS2021002'), 'd1000000-0000-0000-0000-000000000002', 'shortlisted', 'Strong ML profile.', NOW() - INTERVAL '8 days'),
((SELECT id FROM student_profiles WHERE roll_number = 'CS2021003'), 'd1000000-0000-0000-0000-000000000005', 'selected', 'Hackathon finalist.', NOW() - INTERVAL '12 days'),
((SELECT id FROM student_profiles WHERE roll_number = 'CS2021201'), 'd1000000-0000-0000-0000-000000000007', 'applied', 'Alumni mentorship request.', NOW() - INTERVAL '4 days'),
((SELECT id FROM student_profiles WHERE roll_number = 'CS2021101'), 'd1000000-0000-0000-0000-000000000006', 'in_progress', 'Summer project technical round scheduled.', NOW() - INTERVAL '10 days'),
((SELECT id FROM student_profiles WHERE roll_number = 'EC2021001'), 'd1000000-0000-0000-0000-000000000008', 'applied', 'Guest faculty assistant applicant.', NOW() - INTERVAL '3 days');

-- 16. Shortlists / round outcomes with scores
INSERT INTO shortlists (application_id, round_id, status, score, feedback, evaluated_by, evaluated_at) VALUES
(
  (SELECT a.id FROM applications a JOIN student_profiles s ON a.student_id = s.id WHERE s.roll_number = 'CS2021001' AND a.drive_id = 'e1000000-0000-0000-0000-000000000001'),
  (SELECT id FROM drive_rounds WHERE drive_id = 'e1000000-0000-0000-0000-000000000001' AND round_number = 1 LIMIT 1),
  'qualified', 78.50, 'Cleared aptitude threshold.', 'b1000000-0000-0000-0000-000000000004', NOW() - INTERVAL '5 days'
),
(
  (SELECT a.id FROM applications a JOIN student_profiles s ON a.student_id = s.id WHERE s.roll_number = 'CS2021002' AND a.drive_id = 'e1000000-0000-0000-0000-000000000001'),
  (SELECT id FROM drive_rounds WHERE drive_id = 'e1000000-0000-0000-0000-000000000001' AND round_number = 2 LIMIT 1),
  'qualified', 84.00, 'Coding round passed.', 'b1000000-0000-0000-0000-000000000004', NOW() - INTERVAL '4 days'
),
(
  (SELECT a.id FROM applications a JOIN student_profiles s ON a.student_id = s.id WHERE s.roll_number = 'CS2021003' AND a.drive_id = 'e1000000-0000-0000-0000-000000000001'),
  (SELECT id FROM drive_rounds WHERE drive_id = 'e1000000-0000-0000-0000-000000000001' AND round_number = 3 LIMIT 1),
  'qualified', 88.25, 'Excellent system design discussion.', 'b1000000-0000-0000-0000-000000000004', NOW() - INTERVAL '3 days'
);

-- 17. Application status audit trail
INSERT INTO application_status_log (application_id, from_status, to_status, changed_by, remarks, changed_at) VALUES
(
  (SELECT a.id FROM applications a JOIN student_profiles s ON a.student_id = s.id WHERE s.roll_number = 'CS2021001' AND a.drive_id = 'e1000000-0000-0000-0000-000000000001'),
  'applied', 'shortlisted', 'b1000000-0000-0000-0000-000000000004', 'Qualified in aptitude + profile screen.', NOW() - INTERVAL '5 days'
),
(
  (SELECT a.id FROM applications a JOIN student_profiles s ON a.student_id = s.id WHERE s.roll_number = 'CS2021002' AND a.drive_id = 'e1000000-0000-0000-0000-000000000001'),
  'shortlisted', 'in_progress', 'b1000000-0000-0000-0000-000000000004', 'Moved to technical interview stage.', NOW() - INTERVAL '4 days'
),
(
  (SELECT a.id FROM applications a JOIN student_profiles s ON a.student_id = s.id WHERE s.roll_number = 'CS2021003' AND a.drive_id = 'e1000000-0000-0000-0000-000000000001'),
  'in_progress', 'selected', 'b1000000-0000-0000-0000-000000000004', 'Final panel approved offer recommendation.', NOW() - INTERVAL '3 days'
);

-- 18. Student documents (placeholder URLs for test)
INSERT INTO student_documents (student_id, document_type, document_name, file_url, file_size, is_verified) VALUES
((SELECT id FROM student_profiles WHERE roll_number = 'CS2021001'), 'resume', 'Arjun_Verma_Resume.pdf', 'https://example-bucket.local/docs/arjun-resume.pdf', 245000, true),
((SELECT id FROM student_profiles WHERE roll_number = 'CS2021002'), 'resume', 'Sneha_Iyer_Resume.pdf', 'https://example-bucket.local/docs/sneha-resume.pdf', 231000, true),
((SELECT id FROM student_profiles WHERE roll_number = 'CS2021003'), 'certificate', 'Kavya_Cloud_Cert.pdf', 'https://example-bucket.local/docs/kavya-cloud-cert.pdf', 188000, false),
((SELECT id FROM student_profiles WHERE roll_number = 'CS2021101'), 'resume', 'Sneha_Rao_Resume.pdf', 'https://example-bucket.local/docs/sneha-rao-resume.pdf', 212000, true);

-- 19. College facilities / venues (for infrastructure booking)
INSERT INTO college_facilities (tenant_id, name, facility_type, capacity, has_projector, has_ac, has_wifi, has_video_conf, is_available) VALUES
('a1000000-0000-0000-0000-000000000001', 'Main Auditorium', 'Auditorium', 350, true, true, true, true, true),
('a1000000-0000-0000-0000-000000000001', 'Interview Room A1', 'Interview Room', 12, true, true, true, false, true),
('a1000000-0000-0000-0000-000000000002', 'Seminar Hall 2', 'Seminar Hall', 120, true, true, true, true, true),
('a1000000-0000-0000-0000-000000000002', 'Placement Cell Meeting Room', 'Meeting Room', 20, true, true, true, true, true),
('a1000000-0000-0000-0000-000000000003', 'Innovation Lab', 'Lab', 45, true, true, true, false, true);

-- 20. Calendar events (placement + workshop + holiday)
INSERT INTO college_calendar (tenant_id, title, event_type, start_date, end_date, is_blocking, description) VALUES
('a1000000-0000-0000-0000-000000000001', 'TechCorp SDE Drive Day 1', 'placement_drive', '2026-09-15', '2026-09-15', true, '{"company":"TechCorp Solutions","roomId":"main-auditorium","roomName":"Main Auditorium","startTime":"09:00","endTime":"17:00","notes":"Aptitude + coding rounds","channels":["website","linkedin"]}'),
('a1000000-0000-0000-0000-000000000001', 'Resume Review Workshop', 'workshop', '2026-09-10', '2026-09-10', false, 'Career Services workshop for pre-final year students.'),
('a1000000-0000-0000-0000-000000000002', 'Infosys Campus Drive', 'placement_drive', '2026-10-05', '2026-10-05', true, '{"company":"Infosys Limited","roomId":"seminar-hall-2","roomName":"Seminar Hall 2","startTime":"08:30","endTime":"18:00","notes":"Mass recruitment process","channels":["website"]}'),
('a1000000-0000-0000-0000-000000000003', 'Placement Orientation 2026', 'other', '2026-08-20', '2026-08-20', false, 'Orientation for final-year placement process timeline.'),
('a1000000-0000-0000-0000-000000000003', 'Dussehra Holiday', 'holiday', '2026-10-26', '2026-10-26', true, 'Institute holiday');

-- 21. Additional applications for richer pipeline (rejected/withdrawn/on_hold)
INSERT INTO applications (student_id, drive_id, job_id, status, current_round, applied_at, withdrawal_reason, notes) VALUES
((SELECT id FROM student_profiles WHERE roll_number = 'ME2021001'), 'e1000000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000004', 'withdrawn', 0, NOW() - INTERVAL '2 days', 'Accepted higher studies admission', 'Withdrew before test round'),
((SELECT id FROM student_profiles WHERE roll_number = 'CS2021101'), 'e1000000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000003', 'rejected', 1, NOW() - INTERVAL '6 days', NULL, 'Did not clear coding benchmark'),
((SELECT id FROM student_profiles WHERE roll_number = 'CS2021201'), 'e1000000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000004', 'on_hold', 1, NOW() - INTERVAL '1 days', NULL, 'Panel decision pending');

-- 22. Additional offers to cover pending/rejected/expired states
INSERT INTO offers (application_id, student_id, employer_id, drive_id, job_title, salary, joining_date, location, status, deadline, rejected_at, rejection_reason) VALUES
(
  (SELECT a.id FROM applications a JOIN student_profiles s ON a.student_id = s.id WHERE s.roll_number = 'CS2021002' AND a.drive_id = 'e1000000-0000-0000-0000-000000000001' LIMIT 1),
  (SELECT id FROM student_profiles WHERE roll_number = 'CS2021002'),
  'c1000000-0000-0000-0000-000000000001',
  'e1000000-0000-0000-0000-000000000001',
  'Software Development Engineer',
  1650000, '2026-07-10', 'Hyderabad', 'pending', NOW() + INTERVAL '3 days', NULL, NULL
),
(
  (SELECT a.id FROM applications a JOIN student_profiles s ON a.student_id = s.id WHERE s.roll_number = 'CS2021101' AND a.drive_id = 'e1000000-0000-0000-0000-000000000002' LIMIT 1),
  (SELECT id FROM student_profiles WHERE roll_number = 'CS2021101'),
  'c1000000-0000-0000-0000-000000000002',
  'e1000000-0000-0000-0000-000000000002',
  'Full Stack Developer',
  1100000, '2026-08-01', 'Pune', 'rejected', NOW() + INTERVAL '2 days', NOW() - INTERVAL '1 day', 'Preferred higher package role'
),
(
  NULL,
  (SELECT id FROM student_profiles WHERE roll_number = 'CS2021001'),
  'c1000000-0000-0000-0000-000000000001',
  NULL,
  'Data Science Intern',
  720000, '2026-06-15', 'Bangalore', 'expired', NOW() - INTERVAL '5 days', NULL, NULL
);

-- 23. Employer ratings (post-placement feedback coverage)
INSERT INTO employer_ratings (employer_id, student_id, drive_id, professionalism, transparency, timeliness, overall_rating, feedback, is_anonymous) VALUES
(
  'c1000000-0000-0000-0000-000000000001',
  (SELECT id FROM student_profiles WHERE roll_number = 'CS2021003'),
  'e1000000-0000-0000-0000-000000000001',
  5, 4, 5, 5, 'Process was clear and interviewers were very professional.', true
),
(
  'c1000000-0000-0000-0000-000000000002',
  (SELECT id FROM student_profiles WHERE roll_number = 'CS2021001'),
  'e1000000-0000-0000-0000-000000000002',
  4, 4, 3, 4, 'Good process overall; schedule updates could be faster.', true
),
(
  'c1000000-0000-0000-0000-000000000003',
  (SELECT id FROM student_profiles WHERE roll_number = 'CS2021101'),
  'e1000000-0000-0000-0000-000000000003',
  3, 4, 3, 3, 'Assessment quality was good, waiting times were high.', true
);

-- 24. Sponsorship opportunities (DB-backed employer sponsorships)
INSERT INTO sponsorship_opportunities (tenant_id, category, description, tier_name, price_inr, benefits, label, is_active) VALUES
('a1000000-0000-0000-0000-000000000001', 'Campus Infrastructure', 'Support learning spaces, labs, and student infrastructure.', 'Bronze Sponsor', 300000, ARRAY['Brand mention on partner wall', 'Quarterly impact summary'], 'Popular', true),
('a1000000-0000-0000-0000-000000000001', 'Campus Infrastructure', 'Support learning spaces, labs, and student infrastructure.', 'Silver Sponsor', 600000, ARRAY['Bronze benefits', 'Feature in campus events bulletin'], NULL, true),
('a1000000-0000-0000-0000-000000000001', 'Campus Infrastructure', 'Support learning spaces, labs, and student infrastructure.', 'Gold Sponsor', 1200000, ARRAY['Silver benefits', 'Priority branding slot on major events'], 'Premium', true),
('a1000000-0000-0000-0000-000000000002', 'Research & Labs', 'Upgrade lab infrastructure and student innovation facilities.', 'Equipment Sponsor', 400000, ARRAY['Lab naming acknowledgement', 'Annual innovation report access'], NULL, true),
('a1000000-0000-0000-0000-000000000002', 'Research & Labs', 'Upgrade lab infrastructure and student innovation facilities.', 'Lab Partner', 900000, ARRAY['Equipment sponsor benefits', 'Mentor day co-branding'], 'Popular', true),
('a1000000-0000-0000-0000-000000000003', 'Alumni Mentorship', 'Fund mentorship and career readiness activities.', 'Community Sponsor', 250000, ARRAY['Brand mention in mentorship portal', 'Program completion highlights'], NULL, true);

-- 25. Clarifications / Q&A (DB-backed)
INSERT INTO clarification_batches (id, tenant_id, company, posted_by, posted_at, created_by, created_at) VALUES
('c2000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001', 'TechCorp Solutions', 'Placement Office', CURRENT_DATE - INTERVAL '3 days', 'b1000000-0000-0000-0000-000000000002', NOW() - INTERVAL '3 days'),
('c2000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 'GlobalSoft Technologies', 'Placement Office', CURRENT_DATE - INTERVAL '1 day', 'b1000000-0000-0000-0000-000000000002', NOW() - INTERVAL '1 day');

INSERT INTO clarification_questions (batch_id, question_text, answer_text, answered_by, answered_at) VALUES
('c2000000-0000-0000-0000-000000000001', 'Is there any relocation support for Hyderabad joining?', 'Yes, first-month accommodation support is provided.', 'TechCorp Recruitment Team', NOW() - INTERVAL '2 days'),
('c2000000-0000-0000-0000-000000000001', 'Will shortlisted students get a mock interview slot?', 'Yes, a mock slot will be published 48 hours before final interviews.', 'Placement Coordinator', NOW() - INTERVAL '2 days'),
('c2000000-0000-0000-0000-000000000002', 'Are ECE students eligible for the Full Stack role?', 'Yes, ECE with minimum CGPA 6.5 are eligible.', 'GlobalSoft Talent Team', NOW() - INTERVAL '12 hours');

-- 26. Student education
INSERT INTO student_education (student_id, institution, degree, field_of_study, start_year, end_year, grade, description) VALUES
((SELECT id FROM student_profiles WHERE roll_number = 'CS2021001'), 'IIT Mumbai', 'B.Tech', 'Computer Science & Engineering', 2021, 2025, '8.72 CGPA', 'Core CS coursework with AI/ML electives.'),
((SELECT id FROM student_profiles WHERE roll_number = 'CS2021002'), 'IIT Mumbai', 'B.Tech', 'Computer Science & Engineering', 2021, 2025, '9.15 CGPA', 'Focus on NLP and distributed systems.'),
((SELECT id FROM student_profiles WHERE roll_number = 'CS2021101'), 'NIT Trichy', 'B.Tech', 'Computer Science & Engineering', 2021, 2025, '8.90 CGPA', 'Strong backend and systems engineering profile.');

-- 27. Student projects
INSERT INTO student_projects (student_id, title, description, tech_stack, project_url, github_url, start_date, end_date) VALUES
((SELECT id FROM student_profiles WHERE roll_number = 'CS2021001'), 'Campus Hiring Analytics Dashboard', 'Dashboard for placement pipeline insights and recruiter conversion tracking.', ARRAY['React', 'Node.js', 'PostgreSQL'], 'https://projects.example.com/hiring-analytics', 'https://github.com/example/hiring-analytics', '2024-01-15', '2024-05-20'),
((SELECT id FROM student_profiles WHERE roll_number = 'CS2021002'), 'Interview Assistant Bot', 'NLP chatbot to answer candidate FAQs before interview rounds.', ARRAY['Python', 'FastAPI', 'Transformers'], 'https://projects.example.com/interview-bot', 'https://github.com/example/interview-bot', '2024-02-10', '2024-06-30'),
((SELECT id FROM student_profiles WHERE roll_number = 'CS2021201'), 'Alumni Mentorship Matcher', 'Recommendation system to pair students with alumni mentors.', ARRAY['Next.js', 'TypeScript', 'PostgreSQL'], 'https://projects.example.com/mentor-match', 'https://github.com/example/mentor-match', '2024-03-01', '2024-07-15');

-- 28. Message templates
INSERT INTO message_templates (tenant_id, name, subject, body, template_type, variables, is_active) VALUES
('a1000000-0000-0000-0000-000000000001', 'Drive Shortlist Notification', 'You are shortlisted for {{driveTitle}}', 'Hi {{studentName}}, congratulations! You are shortlisted for {{driveTitle}} at {{companyName}}. Please check your dashboard for next steps.', 'notification', ARRAY['studentName', 'driveTitle', 'companyName'], true),
('a1000000-0000-0000-0000-000000000001', 'Offer Released Email', 'Offer letter for {{jobTitle}}', 'Dear {{studentName}}, your offer for {{jobTitle}} has been released by {{companyName}}. Review and respond before {{deadline}}.', 'email', ARRAY['studentName', 'jobTitle', 'companyName', 'deadline'], true),
('a1000000-0000-0000-0000-000000000002', 'Interview Reminder', 'Interview reminder: {{driveTitle}}', 'This is a reminder for your interview round scheduled on {{date}} at {{time}} for {{driveTitle}}.', 'email', ARRAY['driveTitle', 'date', 'time'], true);

-- 29. Audit logs
INSERT INTO audit_logs (user_id, tenant_id, action, entity_type, entity_id, old_values, new_values, ip_address, created_at) VALUES
('b1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 'CREATE_DRIVE', 'placement_drives', 'e1000000-0000-0000-0000-000000000001', NULL, '{"status":"scheduled","title":"TechCorp - SDE Recruitment Drive"}', '10.10.1.21', NOW() - INTERVAL '6 days'),
('b1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000001', 'UPDATE_APPLICATION_STATUS', 'applications', (SELECT id FROM applications ORDER BY applied_at ASC LIMIT 1), '{"status":"applied"}', '{"status":"shortlisted"}', '10.10.2.55', NOW() - INTERVAL '5 days'),
('b1000000-0000-0000-0000-000000000001', NULL, 'UPDATE_PLATFORM_SETTINGS', 'tenants', 'a1000000-0000-0000-0000-000000000001', '{"maintenanceMode":false}', '{"maintenanceMode":false,"notice":"Placement week schedule published"}', '10.10.0.10', NOW() - INTERVAL '2 days');

-- 30. Platform feedback + replies
INSERT INTO platform_feedback (id, user_id, title, category, description, status, created_at) VALUES
(
  'f1000000-0000-0000-0000-000000000001',
  'b1000000-0000-0000-0000-000000000007',
  'Need clearer interview timelines',
  'General Feedback',
  'Student dashboard should show exact round times and timezone details.',
  'Under Review',
  NOW() - INTERVAL '6 days'
),
(
  'f1000000-0000-0000-0000-000000000002',
  'b1000000-0000-0000-0000-000000000004',
  'Bulk invite import for interview panels',
  'Feature Request',
  'Employer interview scheduling should support CSV import for panelists.',
  'Planned',
  NOW() - INTERVAL '4 days'
),
(
  'f1000000-0000-0000-0000-000000000003',
  'b1000000-0000-0000-0000-000000000002',
  'Calendar overlap warning not visible',
  'Bug Report',
  'When creating two bookings at same time, the conflict warning did not show.',
  'Submitted',
  NOW() - INTERVAL '2 days'
);

INSERT INTO platform_feedback_replies (feedback_id, author_user_id, message, channel, created_at) VALUES
(
  'f1000000-0000-0000-0000-000000000001',
  'b1000000-0000-0000-0000-000000000001',
  'Thanks for reporting this. We are reviewing timeline UX improvements.',
  'dashboard',
  NOW() - INTERVAL '5 days'
),
(
  'f1000000-0000-0000-0000-000000000002',
  'b1000000-0000-0000-0000-000000000001',
  'Feature accepted into planning for the next release.',
  'dashboard',
  NOW() - INTERVAL '3 days'
),
(
  'f1000000-0000-0000-0000-000000000003',
  'b1000000-0000-0000-0000-000000000001',
  'Could you share repro steps (browser + exact time overlap)?',
  'dashboard',
  NOW() - INTERVAL '1 days'
);
