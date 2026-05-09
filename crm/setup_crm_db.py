#!/usr/bin/env python3
import sys
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')
    sys.stderr.reconfigure(encoding='utf-8')
"""
setup_crm_db.py
===============
One-time script to create crm.db (SQLite) and seed it with:
  - 30 institutes (from the provided URL list)
  - 5 email contacts per institute (placement, placements, tpo, registrar, vc)

Run once:
    python setup_crm_db.py

Re-running will skip if the DB already exists (use --reset to wipe and recreate).
"""

import sqlite3
import os
import sys
import argparse
from datetime import datetime

# ─────────────────────────────────────────
# CONFIG
# ─────────────────────────────────────────
_SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH     = os.path.join(_SCRIPT_DIR, "crm.db")

NOW = datetime.now().isoformat()

# ─────────────────────────────────────────
# INSTITUTE LIST  (sr_no, website, domain)
# ─────────────────────────────────────────
INSTITUTES = [
    ( 1, "http://cuo.ac.in/",                    "cuo.ac.in"),
    ( 2, "http://evisitors.nic.in/",              "evisitors.nic.in"),
    ( 3, "http://rusa.nic.in/",                   "rusa.nic.in"),
    ( 4, "http://www.amu.ac.in/",                 "amu.ac.in"),
    ( 5, "http://www.aus.ac.in/",                 "aus.ac.in"),
    ( 6, "http://www.bbau.ac.in/",                "bbau.ac.in"),
    ( 7, "http://www.bhu.ac.in/",                 "bhu.ac.in"),
    ( 8, "http://www.cuh.ac.in/",                 "cuh.ac.in"),
    ( 9, "http://www.cuhimachal.ac.in/",          "cuhimachal.ac.in"),
    (10, "http://www.cuj.ac.in/",                 "cuj.ac.in"),
    (11, "http://www.cujammu.ac.in/",             "cujammu.ac.in"),
    (12, "http://www.cuk.ac.in/",                 "cuk.ac.in"),
    (13, "http://www.cukashmir.ac.in/",           "cukashmir.ac.in"),
    (14, "http://www.cup.ac.in/",                 "cup.ac.in"),
    (15, "http://www.curaj.ac.in/",               "curaj.ac.in"),
    (16, "http://www.nvsp.in/",                   "nvsp.in"),
    (17, "http://www.sanskrit.nic.in/",           "sanskrit.nic.in"),
    (18, "https://cau.ac.in/",                    "cau.ac.in"),
    (19, "https://cutn.ac.in/",                   "cutn.ac.in"),
    (20, "https://dhsgsu.edu.in/",                "dhsgsu.edu.in"),
    (21, "https://gsv.ac.in/",                    "gsv.ac.in"),
    (22, "https://parichay.nic.in/",              "parichay.nic.in"),
    (23, "https://scholarship.canarabank.in/",    "scholarship.canarabank.in"),
    (24, "https://www.aicte-india.org/",          "aicte-india.org"),
    (25, "https://www.cug.ac.in/",                "cug.ac.in"),
    (26, "https://www.cukerala.ac.in/",           "cukerala.ac.in"),
    (27, "https://www.cusb.ac.in/",               "cusb.ac.in"),
    (28, "https://www.efluniversity.ac.in/",      "efluniversity.ac.in"),
    (29, "https://www.nta.ac.in/",                "nta.ac.in"),
    (30, "https://www.rpcau.ac.in/",              "rpcau.ac.in"),
]

# Email prefixes — order matters (tried left-to-right per institute)
EMAIL_PATTERNS = [
    "placement",
    "placements",
    "tpo",
    "registrar",
    "vc",
]

# ─────────────────────────────────────────
# DB SCHEMA
# ─────────────────────────────────────────
DDL = """
CREATE TABLE IF NOT EXISTS institutes (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    sr_no           INTEGER UNIQUE NOT NULL,
    website         TEXT    NOT NULL,
    domain          TEXT    NOT NULL,
    institute_name  TEXT    DEFAULT '',
    upd_on          TEXT
);

CREATE TABLE IF NOT EXISTS email_contacts (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    institute_id        INTEGER NOT NULL REFERENCES institutes(id),
    institute_sr_no     INTEGER NOT NULL,
    email_seq           INTEGER NOT NULL,          -- 1=placement,2=placements,3=tpo,4=registrar,5=vc
    email_address       TEXT    NOT NULL UNIQUE,
    status              TEXT    DEFAULT 'Not Sent', -- Not Sent | Sent | Success | Failure
    sent_at             TEXT,
    response_at         TEXT,
    bounce_detected_at  TEXT,
    forwarded_at        TEXT,
    autoreply_sent_at   TEXT,
    sender_account      TEXT,                      -- which Gmail was used to send
    zb_status           TEXT,                      -- ZeroBounce status (valid/invalid/do_not_mail/...)
    zb_sub_status       TEXT,                      -- ZeroBounce sub-status
    zb_checked_at       TEXT,                      -- when ZeroBounce result imported
    zb_blocked          INTEGER DEFAULT 0,         -- 1 => suppress from sending
    notes               TEXT,
    upd_on              TEXT
);

CREATE TABLE IF NOT EXISTS send_runs (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    script          TEXT,
    started_at      TEXT,
    finished_at     TEXT,
    emails_sent     INTEGER DEFAULT 0,
    emails_failed   INTEGER DEFAULT 0,
    bounces_found   INTEGER DEFAULT 0,
    responses_found INTEGER DEFAULT 0,
    notes           TEXT
);
"""

# ─────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────

def create_db(reset: bool = False):
    if reset and os.path.exists(DB_PATH):
        os.remove(DB_PATH)
        print(f"🗑️  Removed existing DB: {DB_PATH}")

    existed = os.path.exists(DB_PATH)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.executescript(DDL)
    conn.commit()

    if existed and not reset:
        print(f"[WARN] DB already exists at: {DB_PATH}")
        print("    Use --reset to wipe and recreate.")
        conn.close()
        return

    # ── Seed institutes ──
    for (sr_no, website, domain) in INSTITUTES:
        conn.execute("""
            INSERT OR IGNORE INTO institutes (sr_no, website, domain, institute_name, upd_on)
            VALUES (?, ?, ?, '', ?)
        """, (sr_no, website, domain, NOW))
    conn.commit()

    # ── Seed email contacts ──
    cur = conn.execute("SELECT id, sr_no, domain FROM institutes ORDER BY sr_no")
    rows = cur.fetchall()

    seq = 0
    for row in rows:
        institute_id = row["id"]
        sr_no        = row["sr_no"]
        domain       = row["domain"]

        for email_seq, prefix in enumerate(EMAIL_PATTERNS, start=1):
            email_addr = f"{prefix}@{domain}"
            conn.execute("""
                INSERT OR IGNORE INTO email_contacts
                    (institute_id, institute_sr_no, email_seq, email_address,
                     status, upd_on)
                VALUES (?, ?, ?, ?, 'Not Sent', ?)
            """, (institute_id, sr_no, email_seq, email_addr, NOW))
            seq += 1

    conn.commit()
    conn.close()

    print(f"[OK] DB created: {DB_PATH}")
    print(f"   Institutes  : {len(INSTITUTES)}")
    print(f"   Email rows  : {seq}")
    print()
    print("Email contacts seeded (5 patterns per institute):")
    print("  1. placement@<domain>")
    print("  2. placements@<domain>")
    print("  3. tpo@<domain>")
    print("  4. registrar@<domain>")
    print("  5. vc@<domain>")


def show_summary():
    if not os.path.exists(DB_PATH):
        print("DB not found. Run without --summary first.")
        return
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row

    institutes = conn.execute("SELECT COUNT(*) AS c FROM institutes").fetchone()["c"]
    contacts   = conn.execute("SELECT COUNT(*) AS c FROM email_contacts").fetchone()["c"]

    print(f"\n=== CRM Database Summary  ({DB_PATH}) ===")
    print(f"   Institutes   : {institutes}")
    print(f"   Email records: {contacts}")
    print()

    statuses = conn.execute("""
        SELECT status, COUNT(*) AS cnt FROM email_contacts GROUP BY status
    """).fetchall()
    for s in statuses:
        print(f"   {s['status']:<12}: {s['cnt']}")

    print()
    rows = conn.execute("""
        SELECT i.sr_no, i.domain, i.institute_name,
               ec.email_address, ec.status
        FROM   email_contacts ec
        JOIN   institutes i ON i.id = ec.institute_id
        ORDER  BY i.sr_no, ec.email_seq
        LIMIT  20
    """).fetchall()
    print("  Sr  Domain                         Email                                    Status")
    print("  " + "-"*90)
    for r in rows:
        name = r["institute_name"] or "(TBD)"
        print(f"  {r['sr_no']:<4}{r['domain']:<32} {r['email_address']:<40} {r['status']}")

    conn.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="CRM SQLite DB Setup")
    parser.add_argument("--reset",   action="store_true", help="Wipe and recreate the DB")
    parser.add_argument("--summary", action="store_true", help="Show DB summary only")
    args = parser.parse_args()

    if args.summary:
        show_summary()
    else:
        create_db(reset=args.reset)
        show_summary()
