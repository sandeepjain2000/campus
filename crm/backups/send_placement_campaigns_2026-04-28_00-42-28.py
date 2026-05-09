#!/usr/bin/env python3
import sys
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')
"""
send_placement_campaigns.py
============================
Campus Placement CRM – Email Campaign Runner

Each run:
  1. Checks all Gmail inboxes for bounce / human-response emails (Gmail labels only —
     no IMAP \\Seen; creates PROCESSED-CAMPUS, BOUNCE-CAMPUS, etc. if missing).
  2. Marks bounced addresses as 'Failure' in crm.db.
  3. Forwards genuine human replies to sandeepjain200019@gmail.com.
  4. Sends an auto-reply to the human respondent.
  5. Sends fresh outreach emails to N institutes (default 2, override with --count N).

Logic per institute:
  - Try emails in order: placement → registrar → vc (placements and tpo are never sent — high bounce)
  - Skip already Sent/Success/Failure addresses
  - Send to the first 'Not Sent' address
  - On next run, if that address bounced ('Failure'), move to the next address

Usage:
    python send_placement_campaigns.py             # sends to 2 institutes
    python send_placement_campaigns.py --count 5  # sends to 5 institutes
    python send_placement_campaigns.py --check-only  # only check bounces/responses
"""

import argparse
import email
import email.utils
import imaplib
import json
import logging
import os
import re
import smtplib
import sqlite3
import ssl
import sys
import time
from datetime import datetime
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

# ═══════════════════════════════════════════════════
# PATHS & CONSTANTS
# ═══════════════════════════════════════════════════
_SCRIPT_DIR      = os.path.dirname(os.path.abspath(__file__))
DB_PATH          = os.path.join(_SCRIPT_DIR, "crm.db")
CONFIG_FILE      = os.path.join(_SCRIPT_DIR, "email_config.json")
TEMPLATE_FILE    = os.path.join(_SCRIPT_DIR, "Mail_Template.htm")

_LOG_DIR = os.path.join(_SCRIPT_DIR, "logs")
os.makedirs(_LOG_DIR, exist_ok=True)
LOG_FILE = os.path.join(
    _LOG_DIR,
    f"campaign_{datetime.now().strftime('%Y-%m-%d_%H-%M-%S')}.log"
)

FORWARD_TO      = "sandeepjain200019@gmail.com"
EMAIL_SUBJECT   = "Introducing PlacementsHub - A Unified Platform for Campus Placements"
SENDER_NAME     = "Sandeep"
IMAP_HOST       = "imap.gmail.com"
IMAP_PORT       = 993
SMTP_HOST       = "smtp.gmail.com"
SMTP_PORT       = 587

# Gmail labels (IMAP mailboxes). Created at runtime if missing. Processing uses
# X-GM-RAW "-label:PROCESSED-CAMPUS" instead of the \\Seen flag.
GMAIL_LABEL_PROCESSED = "PROCESSED-CAMPUS"
GMAIL_LABEL_BOUNCE = "BOUNCE-CAMPUS"
GMAIL_LABEL_BOUNCE_UNMATCHED = "BOUNCE-CAMPUS-UNMATCHED"
GMAIL_LABEL_REPLY = "REPLY-CAMPUS"
GMAIL_LABEL_AUTOREPLY = "AUTOREPLY-CAMPUS"

CAMPUS_GMAIL_LABELS = (
    GMAIL_LABEL_PROCESSED,
    GMAIL_LABEL_BOUNCE,
    GMAIL_LABEL_BOUNCE_UNMATCHED,
    GMAIL_LABEL_REPLY,
    GMAIL_LABEL_AUTOREPLY,
)

# Local parts (before @) excluded from outreach — not stored in DB; filtered at send time.
SKIP_SEND_LOCAL_PARTS = ("placements", "tpo")

AUTOREPLY_BODY = """Hi,

Thanks for your interest — glad this caught your attention.

I'd be happy to walk you through the platform and understand your current placement process to see how this can fit your needs.

Please suggest a time that works for you.

Looking forward to connecting.

Best regards,
Sandeep"""

# ───────────────────────────────────────────────────
# Bounce detection patterns (from check_bounces.py)
# ───────────────────────────────────────────────────
BOUNCE_SENDERS = [
    "mailer-daemon@googlemail.com",
    "mailer-daemon@google.com",
    "postmaster@",
    "mailer-daemon@",
]
BOUNCE_SUBJECTS = [
    "delivery status notification",
    "undeliverable",
    "mail delivery failed",
    "returned mail",
    "failure notice",
    "delivery failure",
    "non-delivery",
    "message not delivered",
    "unable to deliver",
    "bounce",
]

# Auto-reply patterns — do NOT forward these
AUTOREPLY_INDICATORS = [
    "out of office",
    "auto-reply",
    "auto reply",
    "automatic reply",
    "automatically generated",
    "vacation",
    "away from the office",
    "on leave",
    "i am out",
    "i'm out",
    "will be back",
    "maternity leave",
    "currently unavailable",
    "do not reply",
    "noreply",
    "no-reply",
]

# ═══════════════════════════════════════════════════
# LOGGING
# ═══════════════════════════════════════════════════
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)-7s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(LOG_FILE, mode="w", encoding="utf-8"),
    ]
)
log = logging.getLogger("placement_crm")
log.info(f"[LOG] {LOG_FILE}")

# ═══════════════════════════════════════════════════
# DB HELPERS
# ═══════════════════════════════════════════════════

def open_db() -> sqlite3.Connection:
    if not os.path.exists(DB_PATH):
        log.error(f"DB not found: {DB_PATH}  →  run setup_crm_db.py first")
        sys.exit(1)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def get_sent_addresses(conn) -> set:
    """All addresses we have already attempted (Sent / Success / Failure)."""
    cur = conn.execute(
        "SELECT email_address FROM email_contacts WHERE status IN ('Sent','Success','Failure')"
    )
    return {r["email_address"].lower() for r in cur.fetchall()}


def get_all_sent_only(conn) -> set:
    """Addresses currently in 'Sent' state (awaiting outcome)."""
    cur = conn.execute(
        "SELECT email_address FROM email_contacts WHERE status = 'Sent'"
    )
    return {r["email_address"].lower() for r in cur.fetchall()}


def get_active_sender_accounts(conn) -> set:
    """Return only Gmail accounts that actually sent at least one email."""
    cur = conn.execute(
        "SELECT DISTINCT sender_account FROM email_contacts "
        "WHERE sender_account IS NOT NULL AND sender_account != ''"
    )
    return {r["sender_account"].lower() for r in cur.fetchall()}


def mark_failure(conn, email_address: str) -> bool:
    cur = conn.execute(
        "SELECT id, status FROM email_contacts WHERE email_address = ?",
        (email_address.lower(),)
    )
    row = cur.fetchone()
    if not row or row["status"] == "Failure":
        return False
    conn.execute("""
        UPDATE email_contacts
        SET status = 'Failure', bounce_detected_at = ?, upd_on = ?
        WHERE email_address = ?
    """, (datetime.now().isoformat(), datetime.now().isoformat(), email_address.lower()))
    conn.commit()
    return True


def mark_success(conn, email_address: str) -> bool:
    cur = conn.execute(
        "SELECT id, status FROM email_contacts WHERE email_address = ?",
        (email_address.lower(),)
    )
    row = cur.fetchone()
    if not row or row["status"] == "Success":
        return False
    conn.execute("""
        UPDATE email_contacts
        SET status = 'Success', response_at = ?, upd_on = ?
        WHERE email_address = ?
    """, (datetime.now().isoformat(), datetime.now().isoformat(), email_address.lower()))
    conn.commit()
    return True


def mark_sent(conn, email_id: int, sender_account: str):
    conn.execute("""
        UPDATE email_contacts
        SET status = 'Sent', sent_at = ?, sender_account = ?, upd_on = ?
        WHERE id = ?
    """, (datetime.now().isoformat(), sender_account, datetime.now().isoformat(), email_id))
    conn.commit()


def set_forwarded(conn, email_address: str):
    conn.execute("""
        UPDATE email_contacts
        SET forwarded_at = ?, upd_on = ?
        WHERE email_address = ?
    """, (datetime.now().isoformat(), datetime.now().isoformat(), email_address.lower()))
    conn.commit()


def set_autoreply_sent(conn, email_address: str):
    conn.execute("""
        UPDATE email_contacts
        SET autoreply_sent_at = ?, upd_on = ?
        WHERE email_address = ?
    """, (datetime.now().isoformat(), datetime.now().isoformat(), email_address.lower()))
    conn.commit()


def get_next_email_for_institutes(conn, limit: int) -> list:
    """
    Returns up to `limit` email_contact rows — one per institute —
    where the institute has NO 'Sent' or 'Success' email,
    and picks the lowest email_seq that is still 'Not Sent',
    excluding local parts listed in SKIP_SEND_LOCAL_PARTS.
    """
    skip_ph = ",".join("?" * len(SKIP_SEND_LOCAL_PARTS))
    cur = conn.execute(f"""
        SELECT ec.id, ec.institute_id, ec.institute_sr_no,
               ec.email_seq, ec.email_address,
               i.domain, i.institute_name
        FROM   email_contacts ec
        JOIN   institutes i ON i.id = ec.institute_id
        WHERE  ec.status = 'Not Sent'
          AND  LOWER(TRIM(SUBSTR(ec.email_address, 1, INSTR(ec.email_address || '@', '@') - 1)))
               NOT IN ({skip_ph})
          AND  ec.institute_id NOT IN (
                   SELECT DISTINCT institute_id
                   FROM   email_contacts
                   WHERE  status IN ('Sent', 'Success')
               )
        GROUP  BY ec.institute_id
        HAVING ec.email_seq = MIN(ec.email_seq)
        ORDER  BY ec.institute_sr_no
        LIMIT  ?
    """, (*SKIP_SEND_LOCAL_PARTS, limit))
    return cur.fetchall()

# ═══════════════════════════════════════════════════
# SSL / IMAP HELPERS
# ═══════════════════════════════════════════════════

def _ssl_ctx() -> ssl.SSLContext:
    ctx = ssl.create_default_context()
    ctx.minimum_version = ssl.TLSVersion.TLSv1_2
    return ctx


def _imap_connect(address: str, password: str) -> imaplib.IMAP4_SSL:
    mail = imaplib.IMAP4_SSL(IMAP_HOST, IMAP_PORT, ssl_context=_ssl_ctx())
    mail.login(address, password)
    mail.select("INBOX")
    return mail


def ensure_gmail_labels(mail: imaplib.IMAP4_SSL) -> None:
    """CREATE each label if it does not exist (Gmail exposes labels as IMAP folders)."""
    for label in CAMPUS_GMAIL_LABELS:
        try:
            typ, dat = mail.create(label)
            if typ == "OK":
                log.info(f"  Created Gmail label {label!r}")
                continue
            blob = b" ".join(dat) if dat else b""
            if b"ALREADYEXISTS" in blob or b"exists" in blob.lower():
                continue
            log.warning(f"  CREATE {label!r}: {typ} {dat}")
        except imaplib.IMAP4.error as e:
            err = str(e).upper()
            if "ALREADYEXISTS" in err or "[ALREADYEXISTS]" in err:
                continue
            log.warning(f"  CREATE {label!r}: {e}")


def _gmail_raw_uid_search(mail: imaplib.IMAP4_SSL, raw_query: str) -> set:
    """UID SEARCH X-GM-RAW — returns UID bytes (Gmail only)."""
    try:
        typ, data = mail.uid("SEARCH", "X-GM-RAW", raw_query)
    except imaplib.IMAP4.error as e:
        log.warning(f"  X-GM-RAW search failed: {e!r} (query: {raw_query[:80]}…)")
        return set()
    if typ != "OK" or not data or not data[0]:
        return set()
    blob = data[0]
    if not isinstance(blob, bytes) or blob.strip() == b"":
        return set()
    return set(blob.split())


def _campus_inbox_candidate_uids(mail: imaplib.IMAP4_SSL) -> set:
    """
    Messages from the last ~30 days that are not yet tagged PROCESSED-CAMPUS,
    matching bounce / campaign-reply heuristics (Gmail web search syntax).
    """
    ns = f"newer_than:30d -label:{GMAIL_LABEL_PROCESSED}"
    subj_head = EMAIL_SUBJECT.split(" - ")[0].strip().replace('"', r"\"")
    fragments = [
        f"{ns} from:mailer-daemon@googlemail.com",
        f"{ns} from:mailer-daemon@google.com",
        f"{ns} from:mailer-daemon",
        f"{ns} from:postmaster",
        f"{ns} subject:undeliverable",
        f'{ns} subject:"mail delivery failed"',
        f'{ns} subject:"delivery status"',
        f'{ns} subject:"failure notice"',
        f'{ns} subject:"{subj_head}"',
    ]
    uids: set = set()
    for frag in fragments:
        uids |= _gmail_raw_uid_search(mail, frag)
    return uids


def _imap_uid_copy_to_label(mail: imaplib.IMAP4_SSL, uid: bytes, label: str) -> bool:
    """Add a Gmail label by copying the message into that IMAP mailbox."""
    try:
        typ, _ = mail.uid("COPY", uid, label)
        return typ == "OK"
    except Exception as e:
        log.warning(f"  UID COPY {uid!r} → {label!r}: {e}")
        return False


def _tag_campus_message(
    mail: imaplib.IMAP4_SSL,
    uid: bytes,
    *outcome_labels: str,
) -> None:
    """Apply PROCESSED-CAMPUS plus optional outcome labels (BOUNCE-CAMPUS, …)."""
    chain = (GMAIL_LABEL_PROCESSED,) + outcome_labels
    for mbox in chain:
        if not _imap_uid_copy_to_label(mail, uid, mbox):
            log.warning(f"  Could not add label {mbox!r} to UID {uid!r}")

# ═══════════════════════════════════════════════════
# BOUNCE / RESPONSE DETECTION
# ═══════════════════════════════════════════════════

def is_bounce(msg) -> bool:
    sender  = (msg.get("From", "") or "").lower()
    subject = (msg.get("Subject", "") or "").lower()
    for p in BOUNCE_SENDERS:
        if p in sender:
            return True
    for p in BOUNCE_SUBJECTS:
        if p in subject:
            return True
    return False


def is_autoreply(msg) -> bool:
    subject = (msg.get("Subject", "") or "").lower()
    sender  = (msg.get("From", "") or "").lower()
    auto_hdr = (msg.get("Auto-Submitted", "") or "").lower()
    if auto_hdr and auto_hdr != "no":
        return True
    for p in AUTOREPLY_INDICATORS:
        if p in subject or p in sender:
            return True
    return False


def extract_bounced_addresses(msg, known: set) -> list:
    found = []
    for hdr in ["X-Failed-Recipients", "Final-Recipient", "Original-Recipient"]:
        val = msg.get(hdr, "") or ""
        for addr in re.findall(r'[\w._%+\-]+@[\w.\-]+\.[a-zA-Z]{2,}', val):
            if addr.lower() in known:
                found.append(addr.lower())
    if not found:
        for part in msg.walk():
            ct = part.get_content_type()
            if ct in ("text/plain", "message/delivery-status"):
                try:
                    body = part.get_payload(decode=True)
                    if body:
                        txt = body.decode("utf-8", errors="replace")
                        for addr in re.findall(r'[\w._%+\-]+@[\w.\-]+\.[a-zA-Z]{2,}', txt):
                            if addr.lower() in known:
                                found.append(addr.lower())
                except Exception:
                    pass
    return list(set(found))


def extract_reply_from_address(msg) -> str:
    """Return the sender address of a human reply."""
    reply_to = msg.get("Reply-To", "") or ""
    frm      = msg.get("From", "") or ""
    for candidate in [reply_to, frm]:
        addrs = email.utils.getaddresses([candidate])
        for name, addr in addrs:
            if addr:
                return addr.lower()
    return ""

# ═══════════════════════════════════════════════════
# SMTP SENDER
# ═══════════════════════════════════════════════════

def send_email(
    sender_address: str,
    sender_password: str,
    to_address: str,
    subject: str,
    html_body: str,
    plain_body: str = "",
    reply_to: str = None,
) -> bool:
    try:
        msg = MIMEMultipart("alternative")
        msg["From"]    = f"{SENDER_NAME} <{sender_address}>"
        msg["To"]      = to_address
        msg["Subject"] = subject
        if reply_to:
            msg["Reply-To"] = reply_to

        if plain_body:
            msg.attach(MIMEText(plain_body, "plain"))
        msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.ehlo()
            server.starttls(context=_ssl_ctx())
            server.login(sender_address, sender_password)
            server.sendmail(sender_address, [to_address], msg.as_string())
        return True
    except Exception as e:
        log.error(f"    SMTP error sending to {to_address}: {e}")
        return False


def send_autoreply(sender_address: str, sender_password: str, to_address: str) -> bool:
    subject = "Re: " + EMAIL_SUBJECT
    html_body = AUTOREPLY_BODY.replace("\n", "<br>")
    return send_email(
        sender_address, sender_password,
        to_address,
        subject,
        f"<pre style='font-family:Arial,sans-serif'>{html_body}</pre>",
        AUTOREPLY_BODY,
    )


def forward_email(
    sender_address: str,
    sender_password: str,
    original_msg,
    from_address: str,
) -> bool:
    """Forward the original human-reply email to FORWARD_TO."""
    try:
        fwd = MIMEMultipart("mixed")
        fwd["From"]    = f"{SENDER_NAME} <{sender_address}>"
        fwd["To"]      = FORWARD_TO
        fwd["Subject"] = f"[FWD – Human Reply] {original_msg.get('Subject','')}"

        note = MIMEText(
            f"<p><b>Forwarded human reply from:</b> {from_address}</p><hr>",
            "html"
        )
        fwd.attach(note)

        # Attach original as RFC822
        attachment = email.mime.message.MIMEMessage(original_msg)
        fwd.attach(attachment)

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.ehlo()
            server.starttls(context=_ssl_ctx())
            server.login(sender_address, sender_password)
            server.sendmail(sender_address, [FORWARD_TO], fwd.as_string())
        return True
    except Exception as e:
        log.error(f"    Forward error: {e}")
        return False

# ═══════════════════════════════════════════════════
# INBOX CHECKER
# ═══════════════════════════════════════════════════

def check_inbox(
    gmail_address: str,
    app_password: str,
    sent_addresses: set,
    conn: sqlite3.Connection,
    smtp_profiles: dict,
) -> dict:
    """
    Scan inbox for:
      - Bounce emails  → mark Failure
      - Human replies  → mark Success, forward, autoreply
    Returns counts dict.

    Gmail-only: creates label mailboxes if missing, finds candidates with
    UID SEARCH X-GM-RAW (newer_than:30d -label:PROCESSED-CAMPUS), never uses
    IMAP \\Seen. After handling, UID COPY adds PROCESSED-CAMPUS plus an outcome
    label (BOUNCE-CAMPUS, REPLY-CAMPUS, …).
    """
    counts = {"bounces": 0, "responses": 0}

    # Pick any available sender account for autoreply/forward
    first_sender = list(smtp_profiles.keys())[0]
    first_pass   = smtp_profiles[first_sender]

    try:
        log.info(f"  Connecting to {gmail_address} …")
        mail = _imap_connect(gmail_address, app_password)
        ensure_gmail_labels(mail)

        message_uids = _campus_inbox_candidate_uids(mail)
        log.info(f"  Found {len(message_uids)} candidate UID(s) (Gmail raw search)")

        ids_list   = sorted(message_uids, key=lambda u: int(u))
        reconnects = 0

        # ── PASS 1: Headers only (tiny payload, very fast) ──────────
        HDRFETCH = "(BODY.PEEK[HEADER.FIELDS (FROM SUBJECT AUTO-SUBMITTED X-FAILED-RECIPIENTS)])"
        relevant_uids: list = []
        log.info(f"  Pass 1: scanning headers of {len(ids_list)} email(s)...")

        i = 0
        while i < len(ids_list):
            uid = ids_list[i]
            try:
                if i > 0 and i % 100 == 0:
                    try: mail.noop()
                    except Exception: pass
                    log.info(f"    ...{i}/{len(ids_list)} headers done")

                _, hdr_data = mail.uid("FETCH", uid, HDRFETCH)
                if not hdr_data or not isinstance(hdr_data[0], tuple):
                    i += 1; continue
                raw_hdr = hdr_data[0][1]
                if not isinstance(raw_hdr, bytes):
                    i += 1; continue

                h        = email.message_from_bytes(raw_hdr)
                sender   = (h.get("From", "") or "").lower()
                subject  = (h.get("Subject", "") or "").lower()
                failed_r = (h.get("X-Failed-Recipients", "") or "").lower()

                is_bounce_hdr = (
                    any(p in sender for p in BOUNCE_SENDERS)
                    or any(p in subject for p in BOUNCE_SUBJECTS)
                    or bool(failed_r)
                )
                is_reply_hdr = (
                    EMAIL_SUBJECT[:20].lower() in subject
                    or "placementshub" in subject
                    or "placement" in subject
                )
                if is_bounce_hdr or is_reply_hdr:
                    relevant_uids.append(uid)

                i += 1

            except (ssl.SSLError, OSError, imaplib.IMAP4.abort) as e:
                if reconnects >= 3:
                    log.warning(f"  Reconnect limit (pass1); skipping {uid!r}")
                    i += 1; continue
                reconnects += 1
                log.warning(f"  Reconnecting ({reconnects}/3)...")
                time.sleep(2 * reconnects)
                try:
                    mail = _imap_connect(gmail_address, app_password)
                    ensure_gmail_labels(mail)
                except Exception: break
            except Exception as e:
                log.warning(f"  Header read error {uid!r}: {e}")
                i += 1

        log.info(f"  Pass 1 done — {len(relevant_uids)}/{len(ids_list)} need full fetch.")

        # ── PASS 2: Full body only for relevant emails ─────────────
        reconnects = 0
        i = 0
        while i < len(relevant_uids):
            uid = relevant_uids[i]
            try:
                _, data = mail.uid("FETCH", uid, "(BODY.PEEK[])")
                if not data or not isinstance(data[0], tuple):
                    i += 1; continue
                raw = data[0][1]
                if not isinstance(raw, bytes):
                    i += 1; continue

                msg = email.message_from_bytes(raw)

                if is_bounce(msg):
                    bounced_addrs = extract_bounced_addresses(msg, sent_addresses)
                    for addr in bounced_addrs:
                        if mark_failure(conn, addr):
                            log.info(f"  [BOUNCE->FAILURE] {addr}")
                            counts["bounces"] += 1
                    if bounced_addrs:
                        _tag_campus_message(mail, uid, GMAIL_LABEL_BOUNCE)
                    else:
                        _tag_campus_message(mail, uid, GMAIL_LABEL_BOUNCE_UNMATCHED)
                else:
                    reply_from = extract_reply_from_address(msg)
                    subject    = (msg.get("Subject", "") or "").lower()

                    is_campaign_reply = (
                        EMAIL_SUBJECT[:20].lower() in subject
                        or "placementshub" in subject
                        or "placement" in subject
                        or any(addr in reply_from for addr in sent_addresses)
                    )

                    if is_campaign_reply and not is_autoreply(msg):
                        matched_addr = None
                        for addr in sent_addresses:
                            domain = addr.split("@")[-1]
                            if domain in reply_from:
                                matched_addr = addr
                                break

                        if matched_addr or is_campaign_reply:
                            log.info(f"  [HUMAN REPLY] from: {reply_from}")
                            if matched_addr:
                                mark_success(conn, matched_addr)
                            fwd_ok = forward_email(first_sender, first_pass, msg, reply_from)
                            if fwd_ok:
                                log.info(f"  [FORWARDED] to {FORWARD_TO}")
                                if matched_addr:
                                    set_forwarded(conn, matched_addr)
                            ar_ok = send_autoreply(first_sender, first_pass, reply_from)
                            if ar_ok:
                                log.info(f"  [AUTOREPLY SENT] to {reply_from}")
                                if matched_addr:
                                    set_autoreply_sent(conn, matched_addr)
                            counts["responses"] += 1
                            _tag_campus_message(mail, uid, GMAIL_LABEL_REPLY)
                    elif is_autoreply(msg) and is_campaign_reply:
                        _tag_campus_message(mail, uid, GMAIL_LABEL_AUTOREPLY)

                i += 1

            except (ssl.SSLError, OSError, imaplib.IMAP4.abort) as e:
                if reconnects >= 3:
                    log.warning(f"  Reconnect limit (pass2); skipping {uid!r}")
                    i += 1; continue
                reconnects += 1
                log.warning(f"  Reconnecting ({reconnects}/3)...")
                time.sleep(2 * reconnects)
                try:
                    mail = _imap_connect(gmail_address, app_password)
                    ensure_gmail_labels(mail)
                except Exception: break
            except Exception as e:
                log.warning(f"  Could not read msg {uid!r}: {e}")
                i += 1

        try:
            mail.logout()
        except Exception:
            pass

    except imaplib.IMAP4.error as e:
        log.error(f"  IMAP error for {gmail_address}: {e}")
    except Exception as e:
        log.error(f"  Error checking {gmail_address}: {e}")

    return counts

# ═══════════════════════════════════════════════════
# TEMPLATE LOADER
# ═══════════════════════════════════════════════════

def load_template(institute_name: str = "", domain: str = "") -> str:
    with open(TEMPLATE_FILE, "r", encoding="utf-8") as f:
        html = f.read()
    recipient = institute_name if institute_name else f"Placement Team"
    html = html.replace("{{RecipientName}}", recipient)
    html = html.replace("{{YourName}}", "Sandeep")
    html = html.replace("{{YourContact}}", "sandeepjain200019@gmail.com")
    return html

# ═══════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════

def main():
    parser = argparse.ArgumentParser(description="Campus Placement CRM – Email Campaign")
    parser.add_argument("--count",      type=int, default=2,
                        help="Number of institutes to email this run (default: 2)")
    parser.add_argument("--check-only", action="store_true",
                        help="Only check bounces/responses; do not send new emails")
    args = parser.parse_args()

    os.system("cls" if os.name == "nt" else "clear")
    log.info("=" * 64)
    log.info("  PLACEMENT CRM – CAMPAIGN RUNNER")
    log.info(f"  Run : {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    log.info(f"  Mode: {'Check only' if args.check_only else f'Send up to {args.count} institute(s)'}")
    log.info("=" * 64)

    # ── Load config ──────────────────────────────────────
    if not os.path.exists(CONFIG_FILE):
        log.error(f"Config not found: {CONFIG_FILE}")
        return
    with open(CONFIG_FILE) as f:
        config = json.load(f)
    smtp_profiles: dict = config.get("profiles", {})
    if not smtp_profiles:
        log.error("No profiles found in email_config.json")
        return

    profile_list = list(smtp_profiles.items())   # [(address, password), …]
    log.info(f"  Gmail accounts available: {len(profile_list)}")

    # ── Open DB ──────────────────────────────────────────
    conn = open_db()

    # ── Log this run ─────────────────────────────────────
    cur = conn.execute(
        "INSERT INTO send_runs (script, started_at) VALUES ('campaign_runner', ?)",
        (datetime.now().isoformat(),)
    )
    conn.commit()
    run_id = cur.lastrowid

    # ── Step 1: Check inboxes (only accounts that sent emails) ──
    log.info("\n[STEP 1] Checking inboxes for bounces and human replies...")
    sent_addresses    = get_all_sent_only(conn)
    active_senders    = get_active_sender_accounts(conn)
    log.info(f"  Monitoring {len(sent_addresses)} 'Sent' address(es)")

    if not sent_addresses:
        log.info("  No 'Sent' emails yet — skipping inbox check.")
        total_bounces, total_responses = 0, 0
    else:
        # Filter: only check accounts that actually sent something
        accounts_to_check = [
            (addr, pwd) for addr, pwd in profile_list
            if addr.lower() in active_senders
        ]
        log.info(f"  Checking {len(accounts_to_check)}/{len(profile_list)} accounts "
                 f"(only those that sent emails)")

        total_bounces   = 0
        total_responses = 0

        for gmail_address, app_password in accounts_to_check:
            log.info(f"\n  > {gmail_address}")
            counts = check_inbox(
                gmail_address, app_password,
                sent_addresses, conn, smtp_profiles
            )
            total_bounces   += counts["bounces"]
            total_responses += counts["responses"]

    log.info(f"\n  Bounces found   : {total_bounces}")
    log.info(f"  Human responses : {total_responses}")

    if args.check_only:
        log.info("\n  --check-only mode: skipping send step.")
        _finish_run(conn, run_id, 0, 0, total_bounces, total_responses)
        conn.close()
        return

    # ── Step 2: Send outreach emails ─────────────────────
    log.info(f"\n[STEP 2] Sending to up to {args.count} institute(s)...")

    pending = get_next_email_for_institutes(conn, args.count)
    log.info(f"  Institutes ready: {len(pending)}")

    emails_sent   = 0
    emails_failed = 0
    sender_idx    = 0   # round-robin through profiles

    for row in pending:
        ec_id        = row["id"]
        sr_no        = row["institute_sr_no"]
        email_addr   = row["email_address"]
        domain       = row["domain"]
        inst_name    = row["institute_name"] or ""

        # Pick next sender account (round-robin)
        sender_address, sender_password = profile_list[sender_idx % len(profile_list)]
        sender_idx += 1

        log.info(f"\n  [{sr_no:02d}] Sending to: {email_addr}")
        log.info(f"       From  : {sender_address}")

        html_body = load_template(institute_name=inst_name, domain=domain)

        ok = send_email(
            sender_address, sender_password,
            email_addr,
            EMAIL_SUBJECT,
            html_body,
        )

        if ok:
            mark_sent(conn, ec_id, sender_address)
            log.info(f"       [OK] Sent successfully")
            emails_sent += 1
        else:
            log.warning(f"       [FAIL] Send failed - not marking as Sent")
            emails_failed += 1

        # Small delay to avoid rate limits
        time.sleep(3)

    # ── Summary ───────────────────────────────────────────
    log.info("\n" + "=" * 64)
    log.info(f"  Emails sent      : {emails_sent}")
    log.info(f"  Send failures    : {emails_failed}")
    log.info(f"  Bounces detected : {total_bounces}")
    log.info(f"  Human responses  : {total_responses}")
    log.info("=" * 64)

    _finish_run(conn, run_id, emails_sent, emails_failed, total_bounces, total_responses)
    conn.close()


def _finish_run(conn, run_id, sent, failed, bounces, responses):
    conn.execute("""
        UPDATE send_runs
        SET finished_at    = ?,
            emails_sent    = ?,
            emails_failed  = ?,
            bounces_found  = ?,
            responses_found = ?,
            notes          = ?
        WHERE id = ?
    """, (
        datetime.now().isoformat(),
        sent, failed, bounces, responses,
        f"sent={sent}, failed={failed}, bounces={bounces}, responses={responses}",
        run_id
    ))
    conn.commit()


if __name__ == "__main__":
    # Need MIMEMessage for forward
    import email.mime.message
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n  Cancelled.")
    except Exception as e:
        import traceback
        log.error(f"Fatal error: {e}")
        traceback.print_exc()
    finally:
        input("\n  Press Enter to exit…")
