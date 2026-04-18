-- Run once on existing DBs where employer demo had zero approved campuses.
-- TechCorp + Infosys ↔ IIT Mumbai + NIT Trichy (matches seed.sql section 4b).

INSERT INTO employer_approvals (tenant_id, employer_id, status, approved_at) VALUES
('a1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'approved', NOW()),
('a1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000003', 'approved', NOW()),
('a1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000001', 'approved', NOW()),
('a1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000003', 'approved', NOW())
ON CONFLICT (tenant_id, employer_id) DO UPDATE SET
  status = 'approved',
  approved_at = COALESCE(employer_approvals.approved_at, EXCLUDED.approved_at);
