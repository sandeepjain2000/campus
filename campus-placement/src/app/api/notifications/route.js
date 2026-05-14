import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';

const LIMIT = 50;

function mailboxFromUrl(url) {
  const sp = new URL(url).searchParams.get('mailbox');
  return sp === 'trash' ? 'trash' : 'inbox';
}

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const mailbox = mailboxFromUrl(request.url);

    const res = await query(
      `SELECT id, title, message, type, link, is_read, created_at, deleted_at
       FROM notifications
       WHERE user_id = $1::uuid
         AND (($2 = 'trash' AND deleted_at IS NOT NULL) OR ($2 = 'inbox' AND deleted_at IS NULL))
       ORDER BY created_at DESC
       LIMIT $3`,
      [session.user.id, mailbox, LIMIT],
    );

    const unread = await query(
      `SELECT COUNT(*)::int AS c FROM notifications
       WHERE user_id = $1::uuid AND is_read = false AND deleted_at IS NULL`,
      [session.user.id],
    );

    const settingsRes = await query(
      `SELECT
         COALESCE(NULLIF(TRIM(settings->'adminSettings'->>'fromEmail'), ''), NULLIF(TRIM(settings->'adminSettings'->>'supportEmail'), '')) AS sender
       FROM tenants
       ORDER BY created_at ASC
       LIMIT 1`,
    );
    const notificationSenderEmail = settingsRes.rows[0]?.sender || null;

    return NextResponse.json({
      notifications: res.rows,
      unreadCount: unread.rows[0]?.c ?? 0,
      notificationSenderEmail,
      mailbox,
    });
  } catch (e) {
    console.error('GET /api/notifications', e);
    return NextResponse.json({ error: 'Failed to load notifications' }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { markAllRead, ids, trashIds, restoreIds } = body;

    if (markAllRead) {
      await query(
        `UPDATE notifications SET is_read = true
         WHERE user_id = $1::uuid AND is_read = false AND deleted_at IS NULL`,
        [session.user.id],
      );
      return NextResponse.json({ ok: true });
    }

    if (Array.isArray(ids) && ids.length) {
      await query(
        `UPDATE notifications SET is_read = true
         WHERE user_id = $1::uuid AND id = ANY($2::uuid[]) AND deleted_at IS NULL`,
        [session.user.id, ids],
      );
      return NextResponse.json({ ok: true });
    }

    if (Array.isArray(trashIds) && trashIds.length) {
      await query(
        `UPDATE notifications SET deleted_at = NOW()
         WHERE user_id = $1::uuid AND id = ANY($2::uuid[]) AND deleted_at IS NULL`,
        [session.user.id, trashIds],
      );
      return NextResponse.json({ ok: true });
    }

    if (Array.isArray(restoreIds) && restoreIds.length) {
      await query(
        `UPDATE notifications SET deleted_at = NULL
         WHERE user_id = $1::uuid AND id = ANY($2::uuid[]) AND deleted_at IS NOT NULL`,
        [session.user.id, restoreIds],
      );
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'markAllRead, ids, trashIds, or restoreIds required' }, { status: 400 });
  } catch (e) {
    console.error('PATCH /api/notifications', e);
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { ids, emptyTrash } = body;

    if (emptyTrash === true) {
      await query(`DELETE FROM notifications WHERE user_id = $1::uuid AND deleted_at IS NOT NULL`, [
        session.user.id,
      ]);
      return NextResponse.json({ ok: true });
    }

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'ids array or emptyTrash required' }, { status: 400 });
    }

    await query(
      `DELETE FROM notifications
       WHERE user_id = $1::uuid AND id = ANY($2::uuid[]) AND deleted_at IS NOT NULL`,
      [session.user.id, ids],
    );
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('DELETE /api/notifications', e);
    return NextResponse.json({ error: 'Failed to delete notifications' }, { status: 500 });
  }
}
