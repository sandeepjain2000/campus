-- ============================================
-- Campus Placement SaaS - Seed Data
-- ============================================

-- Password hash for 'password123' using bcrypt
-- $2a$10$rQEY0tLx6Fy1JXqFVUxWOeZk5JGqV0IV2Ld6X5MOLyVCfYl1GKHWK

-- 1. Create Tenants (Colleges)
INSERT INTO tenants (id, name, slug, type, city, state, email, accreditation, naac_grade, established_year) VALUES
('a1000000-0000-0000-0000-000000000001', 'Indian Institute of Technology, Mumbai', 'iit-mumbai', 'college', 'Mumbai', 'Maharashtra', 'placement@iitm.edu', 'AICTE', 'A++', 1958),
('a1000000-0000-0000-0000-000000000002', 'National Institute of Technology, Trichy', 'nit-trichy', 'college', 'Tiruchirappalli', 'Tamil Nadu', 'placement@nitt.edu', 'AICTE', 'A+', 1964),
('a1000000-0000-0000-0000-000000000003', 'Birla Institute of Technology, Pilani', 'bits-pilani', 'college', 'Pilani', 'Rajasthan', 'placement@bits.edu', 'AICTE', 'A+', 1964);

-- 2. Create Users
-- Super Admin
INSERT INTO users (id, email, password_hash, role, first_name, last_name, is_active, is_verified) VALUES
('b1000000-0000-0000-0000-000000000001', 'admin@placementhub.com', '$2a$10$rQEY0tLx6Fy1JXqFVUxWOeZk5JGqV0IV2Ld6X5MOLyVCfYl1GKHWK', 'super_admin', 'Platform', 'Admin', true, true);

-- College Admins
INSERT INTO users (id, tenant_id, email, password_hash, role, first_name, last_name, is_active, is_verified) VALUES
('b1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001', 'admin@iitm.edu', '$2a$10$rQEY0tLx6Fy1JXqFVUxWOeZk5JGqV0IV2Ld6X5MOLyVCfYl1GKHWK', 'college_admin', 'Rajesh', 'Kumar', true, true),
('b1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000002', 'admin@nitt.edu', '$2a$10$rQEY0tLx6Fy1JXqFVUxWOeZk5JGqV0IV2Ld6X5MOLyVCfYl1GKHWK', 'college_admin', 'Priya', 'Sharma', true, true),
('b1000000-0000-0000-0000-000000000012', 'a1000000-0000-0000-0000-000000000003', 'admin@bits.edu', '$2a$10$rQEY0tLx6Fy1JXqFVUxWOeZk5JGqV0IV2Ld6X5MOLyVCfYl1GKHWK', 'college_admin', 'Suresh', 'Rao', true, true);

-- Employers
INSERT INTO users (id, email, password_hash, role, first_name, last_name, is_active, is_verified) VALUES
('b1000000-0000-0000-0000-000000000004', 'hr@techcorp.com', '$2a$10$rQEY0tLx6Fy1JXqFVUxWOeZk5JGqV0IV2Ld6X5MOLyVCfYl1GKHWK', 'employer', 'Anita', 'Desai', true, true),
('b1000000-0000-0000-0000-000000000005', 'hr@globalsoft.com', '$2a$10$rQEY0tLx6Fy1JXqFVUxWOeZk5JGqV0IV2Ld6X5MOLyVCfYl1GKHWK', 'employer', 'Vikram', 'Singh', true, true),
('b1000000-0000-0000-0000-000000000006', 'hr@infosys.com', '$2a$10$rQEY0tLx6Fy1JXqFVUxWOeZk5JGqV0IV2Ld6X5MOLyVCfYl1GKHWK', 'employer', 'Meera', 'Nair', true, true),
('b1000000-0000-0000-0000-000000000013', 'hr@academic.nitt.edu', '$2a$10$rQEY0tLx6Fy1JXqFVUxWOeZk5JGqV0IV2Ld6X5MOLyVCfYl1GKHWK', 'employer', 'NITT', 'Academic Affairs', true, true),
('b1000000-0000-0000-0000-000000000014', 'hr@alumni.bits.edu', '$2a$10$rQEY0tLx6Fy1JXqFVUxWOeZk5JGqV0IV2Ld6X5MOLyVCfYl1GKHWK', 'employer', 'BITS', 'Alumni Association', true, true);

-- Students (IIT Mumbai)
INSERT INTO users (id, tenant_id, email, password_hash, role, first_name, last_name, is_active, is_verified) VALUES
('b1000000-0000-0000-0000-000000000007', 'a1000000-0000-0000-0000-000000000001', 'arjun.verma@iitm.edu', '$2a$10$rQEY0tLx6Fy1JXqFVUxWOeZk5JGqV0IV2Ld6X5MOLyVCfYl1GKHWK', 'student', 'Arjun', 'Verma', true, true),
('b1000000-0000-0000-0000-000000000008', 'a1000000-0000-0000-0000-000000000001', 'sneha.iyer@iitm.edu', '$2a$10$rQEY0tLx6Fy1JXqFVUxWOeZk5JGqV0IV2Ld6X5MOLyVCfYl1GKHWK', 'student', 'Sneha', 'Iyer', true, true),
('b1000000-0000-0000-0000-000000000009', 'a1000000-0000-0000-0000-000000000001', 'rohan.patel@iitm.edu', '$2a$10$rQEY0tLx6Fy1JXqFVUxWOeZk5JGqV0IV2Ld6X5MOLyVCfYl1GKHWK', 'student', 'Rohan', 'Patel', true, true),
('b1000000-0000-0000-0000-000000000010', 'a1000000-0000-0000-0000-000000000001', 'kavya.reddy@iitm.edu', '$2a$10$rQEY0tLx6Fy1JXqFVUxWOeZk5JGqV0IV2Ld6X5MOLyVCfYl1GKHWK', 'student', 'Kavya', 'Reddy', true, true),
('b1000000-0000-0000-0000-000000000011', 'a1000000-0000-0000-0000-000000000001', 'amit.sharma@iitm.edu', '$2a$10$rQEY0tLx6Fy1JXqFVUxWOeZk5JGqV0IV2Ld6X5MOLyVCfYl1GKHWK', 'student', 'Amit', 'Sharma', true, true),
('b1000000-0000-0000-0000-000000000015', 'a1000000-0000-0000-0000-000000000002', 'sneha.rao@nitt.edu', '$2a$10$rQEY0tLx6Fy1JXqFVUxWOeZk5JGqV0IV2Ld6X5MOLyVCfYl1GKHWK', 'student', 'Sneha', 'Rao', true, true),
('b1000000-0000-0000-0000-000000000016', 'a1000000-0000-0000-0000-000000000003', 'rohan.mehta@bits.edu', '$2a$10$rQEY0tLx6Fy1JXqFVUxWOeZk5JGqV0IV2Ld6X5MOLyVCfYl1GKHWK', 'student', 'Rohan', 'Mehta', true, true);

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

-- 4b. Employer campus approvals (demo: approved partnerships so employers can enter a campus)
INSERT INTO employer_approvals (tenant_id, employer_id, status, approved_at) VALUES
('a1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'approved', NOW()),
('a1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000003', 'approved', NOW()),
('a1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000001', 'approved', NOW()),
('a1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000003', 'approved', NOW());

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
