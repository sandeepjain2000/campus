const mockGetServerSession = jest.fn();
const mockQuery = jest.fn();

jest.mock('next-auth/next', () => ({
  getServerSession: (...args) => mockGetServerSession(...args),
}));

jest.mock('@/lib/db', () => ({
  query: (...args) => mockQuery(...args),
}));

jest.mock('@/lib/offersLatestFlag', () => ({
  refreshOfferLatestFlagsForStudent: jest.fn(),
}));

const { POST } = require('../route');

const TENANT_ID = 'a1000000-0000-0000-0000-000000000001';
const OTHER_TENANT_ID = 'a1000000-0000-0000-0000-000000000002';
const STUDENT_ID = 's1000000-0000-0000-0000-000000000001';
const EMPLOYER_ID = 'e1000000-0000-0000-0000-000000000001';

function buildRequest(csvContent) {
  const file = {
    name: 'offers.csv',
    text: async () => csvContent,
  };
  return {
    formData: async () => ({
      get: (key) => (key === 'file' ? file : null),
    }),
  };
}

describe('POST /api/college/offers/upload', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetServerSession.mockResolvedValue({
      user: { role: 'college_admin', tenantId: TENANT_ID },
    });
    mockQuery.mockImplementation(async (sql, params) => {
      if (String(sql).includes('student_profiles')) {
        return { rows: [{ id: STUDENT_ID }] };
      }
      return { rows: [] };
    });
  });

  it('successfully uploads offers with matching college_id and valid employer_id', async () => {
    const csvContent = [
      'roll_number,college_id,employer_id,company_name,job_title,salary,location,deadline,status',
      `CS001,${TENANT_ID},${EMPLOYER_ID},Google,Software Engineer,100000,Bangalore,2026-05-15,pending`,
    ].join('\n');

    const res = await POST(buildRequest(csvContent));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.accepted).toBe(1);
    expect(body.errors).toHaveLength(0);

    // Verify INSERT query contained EMPLOYER_ID
    const insertCall = mockQuery.mock.calls.find(call => String(call[0]).includes('INSERT INTO offers'));
    expect(insertCall).toBeDefined();
    expect(insertCall[1][1]).toBe(EMPLOYER_ID); // employer_id parameter
  });

  it('rejects row when college_id does not match the college admin\'s campus ID', async () => {
    const csvContent = [
      'roll_number,college_id,employer_id,company_name,job_title,salary,location,deadline,status',
      `CS001,${OTHER_TENANT_ID},${EMPLOYER_ID},Google,Software Engineer,100000,Bangalore,2026-05-15,pending`,
    ].join('\n');

    const res = await POST(buildRequest(csvContent));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.accepted).toBe(0);
    expect(body.errors).toHaveLength(1);
    expect(body.errors[0].message).toContain("college_id / tenant_id in CSV does not match the college admin's campus ID");
  });

  it('ignores invalid employer_id UUID and saves NULL instead', async () => {
    const csvContent = [
      'roll_number,college_id,employer_id,company_name,job_title,salary,location,deadline,status',
      `CS001,${TENANT_ID},invalid-uuid-here,Google,Software Engineer,100000,Bangalore,2026-05-15,pending`,
    ].join('\n');

    const res = await POST(buildRequest(csvContent));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.accepted).toBe(1);
    expect(body.errors).toHaveLength(0);

    // Verify INSERT query saved NULL for employer_id
    const insertCall = mockQuery.mock.calls.find(call => String(call[0]).includes('INSERT INTO offers'));
    expect(insertCall).toBeDefined();
    expect(insertCall[1][1]).toBeNull();
  });
});
