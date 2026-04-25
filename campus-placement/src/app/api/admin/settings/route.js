import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';

const DEFAULTS = {
  platformName: 'PlacementHub',
  supportEmail: 'support@placementhub.com',
  timezone: 'Asia/Kolkata',
  requireEmailVerification: true,
  enableTwoFactorAuth: false,
  sessionTimeoutValue: 24,
  sessionTimeoutUnit: 'hours',
  rememberDeviceValue: 14,
  rememberDeviceUnit: 'days',
  smtpHost: '',
  smtpPort: 587,
  fromEmail: '',
  storageProvider: 'Local Filesystem',
  maxUploadSizeMb: 5,
};

async function resolveSettingsTenantId(session) {
  if (session?.user?.tenantId) return session.user.tenantId;
  if (session?.user?.tenant_id) return session.user.tenant_id;
  const fallback = await query(`SELECT id FROM tenants ORDER BY created_at ASC LIMIT 1`);
  return fallback.rows[0]?.id || null;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = await resolveSettingsTenantId(session);
    if (!tenantId) return NextResponse.json(DEFAULTS);

    const res = await query(`SELECT settings FROM tenants WHERE id = $1::uuid`, [tenantId]);
    const settings = res.rows[0]?.settings || {};
    const adminSettings = settings.adminSettings || {};
    return NextResponse.json({ ...DEFAULTS, ...adminSettings });
  } catch (error) {
    console.error('Failed to load admin settings:', error);
    return NextResponse.json({ error: 'Failed to load admin settings' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tenantId = await resolveSettingsTenantId(session);
    if (!tenantId) {
      return NextResponse.json({ error: 'No tenant available to persist settings' }, { status: 400 });
    }

    const payload = await request.json();
    const normalized = {
      platformName: String(payload?.platformName || DEFAULTS.platformName),
      supportEmail: String(payload?.supportEmail || DEFAULTS.supportEmail),
      timezone: String(payload?.timezone || DEFAULTS.timezone),
      requireEmailVerification: Boolean(payload?.requireEmailVerification),
      enableTwoFactorAuth: Boolean(payload?.enableTwoFactorAuth),
      sessionTimeoutValue: Number(payload?.sessionTimeoutValue || DEFAULTS.sessionTimeoutValue),
      sessionTimeoutUnit: String(payload?.sessionTimeoutUnit || DEFAULTS.sessionTimeoutUnit),
      rememberDeviceValue: Number(payload?.rememberDeviceValue || DEFAULTS.rememberDeviceValue),
      rememberDeviceUnit: String(payload?.rememberDeviceUnit || DEFAULTS.rememberDeviceUnit),
      smtpHost: String(payload?.smtpHost || ''),
      smtpPort: Number(payload?.smtpPort || DEFAULTS.smtpPort),
      fromEmail: String(payload?.fromEmail || ''),
      storageProvider: String(payload?.storageProvider || DEFAULTS.storageProvider),
      maxUploadSizeMb: Number(payload?.maxUploadSizeMb || DEFAULTS.maxUploadSizeMb),
    };

    const existing = await query(`SELECT settings FROM tenants WHERE id = $1::uuid`, [tenantId]);
    const currentSettings = existing.rows[0]?.settings || {};
    const merged = { ...currentSettings, adminSettings: normalized };
    await query(
      `UPDATE tenants
       SET settings = $1::jsonb, updated_at = NOW()
       WHERE id = $2::uuid`,
      [JSON.stringify(merged), tenantId]
    );

    return NextResponse.json({ success: true, message: 'Settings saved successfully' });
  } catch (error) {
    console.error('Failed to save admin settings:', error);
    return NextResponse.json({ error: 'Failed to save admin settings' }, { status: 500 });
  }
}
