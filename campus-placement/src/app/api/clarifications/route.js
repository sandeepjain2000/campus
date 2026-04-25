import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';

const MAX_QUESTIONS = 5;

function defaultPayload() {
  return { batches: [] };
}

async function resolveTenantId(session) {
  const id = session?.user?.tenant_id ?? session?.user?.tenantId ?? null;
  if (id) return id;
  const fallback = await query(
    `SELECT id
     FROM tenants
     WHERE type = 'college'
     ORDER BY created_at ASC
     LIMIT 1`
  );
  return fallback.rows[0]?.id || null;
}

async function loadPayload(tenantId) {
  const res = await query(`SELECT settings FROM tenants WHERE id = $1::uuid`, [tenantId]);
  const settings = res.rows[0]?.settings || {};
  const payload = settings.clarifications;
  if (!payload || !Array.isArray(payload.batches)) return defaultPayload();
  return payload;
}

async function savePayload(tenantId, payload) {
  const existing = await query(`SELECT settings FROM tenants WHERE id = $1::uuid`, [tenantId]);
  const settings = existing.rows[0]?.settings || {};
  const merged = { ...settings, clarifications: payload };
  await query(
    `UPDATE tenants
     SET settings = $1::jsonb, updated_at = NOW()
     WHERE id = $2::uuid`,
    [JSON.stringify(merged), tenantId]
  );
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const tenantId = await resolveTenantId(session);
    if (!tenantId) return NextResponse.json(defaultPayload());
    const payload = await loadPayload(tenantId);
    return NextResponse.json(payload);
  } catch (error) {
    console.error('Failed to load clarifications:', error);
    return NextResponse.json({ error: 'Failed to load clarifications' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['college_admin', 'super_admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const tenantId = await resolveTenantId(session);
    if (!tenantId) return NextResponse.json({ error: 'Tenant context missing' }, { status: 400 });

    const body = await request.json();
    const company = String(body?.company || '').trim();
    const postedBy = String(body?.postedBy || '').trim();
    const questionTexts = Array.isArray(body?.questionTexts) ? body.questionTexts : [];
    const trimmed = questionTexts.map((t) => String(t || '').trim()).filter(Boolean).slice(0, MAX_QUESTIONS);
    if (!company || !postedBy || trimmed.length === 0) {
      return NextResponse.json({ error: 'company, postedBy and at least one question are required' }, { status: 400 });
    }

    const payload = await loadPayload(tenantId);
    const id = `b-${Date.now()}`;
    const batch = {
      id,
      company,
      postedBy,
      postedAt: new Date().toISOString().slice(0, 10),
      questions: trimmed.map((text, i) => ({
        id: `q-${id}-${i}`,
        text,
        answer: '',
        answeredBy: '',
      })),
    };
    payload.batches = [batch, ...(payload.batches || [])];
    await savePayload(tenantId, payload);
    return NextResponse.json(payload);
  } catch (error) {
    console.error('Failed to publish clarification batch:', error);
    return NextResponse.json({ error: 'Failed to publish clarification batch' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['employer', 'super_admin', 'college_admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const tenantId = await resolveTenantId(session);
    if (!tenantId) return NextResponse.json({ error: 'Tenant context missing' }, { status: 400 });

    const body = await request.json();
    const batchId = String(body?.batchId || '').trim();
    const questionId = String(body?.questionId || '').trim();
    const answer = String(body?.answer || '').trim();
    const answeredBy = String(body?.answeredBy || '').trim();
    if (!batchId || !questionId || !answer) {
      return NextResponse.json({ error: 'batchId, questionId and answer are required' }, { status: 400 });
    }

    const payload = await loadPayload(tenantId);
    const batch = payload.batches.find((b) => b.id === batchId);
    if (!batch) return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    const q = batch.questions.find((x) => x.id === questionId);
    if (!q) return NextResponse.json({ error: 'Question not found' }, { status: 404 });

    q.answer = answer;
    q.answeredBy = answeredBy || 'Recruitment Team';
    await savePayload(tenantId, payload);
    return NextResponse.json(payload);
  } catch (error) {
    console.error('Failed to save clarification answer:', error);
    return NextResponse.json({ error: 'Failed to save clarification answer' }, { status: 500 });
  }
}
