import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';

/** Respect explicit empty strings (e.g. clear platform name); only fall back when key absent or null. */
function pickString(payload, key, defaultVal) {
  if (!payload || !Object.prototype.hasOwnProperty.call(payload, key)) {
    return defaultVal;
  }
  const v = payload[key];
  if (v === null || v === undefined) return defaultVal;
  return String(v);
}

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

function resolveSettingsTenantId(session) {
  const id = session?.user?.tenantId ?? session?.user?.tenant_id ?? null;
  return id && String(id).trim() ? String(id).trim() : null;
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
      platformName: pickString(payload, 'platformName', DEFAULTS.platformName),
      supportEmail: pickString(payload, 'supportEmail', DEFAULTS.supportEmail),
      timezone: pickString(payload, 'timezone', DEFAULTS.timezone),
      requireEmailVerification: Boolean(payload?.requireEmailVerification),
      enableTwoFactorAuth: Boolean(payload?.enableTwoFactorAuth),
      sessionTimeoutValue: Number(payload?.sessionTimeoutValue || DEFAULTS.sessionTimeoutValue),
      sessionTimeoutUnit: String(payload?.sessionTimeoutUnit || DEFAULTS.sessionTimeoutUnit),
      rememberDeviceValue: Number(payload?.rememberDeviceValue || DEFAULTS.rememberDeviceValue),
      rememberDeviceUnit: String(payload?.rememberDeviceUnit || DEFAULTS.rememberDeviceUnit),
      smtpHost: String(payload?.smtpHost || ''),
      smtpPort: Number(payload?.smtpPort || DEFAULTS.smtpPort),
      fromEmail: String(payload?.fromEmail || ''),
      storageProvider: String(payload?.storageProvider ?? DEFAULTS.storageProvider),
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
