#!/usr/bin/env python3
"""
Import ZeroBounce results into crm.db and mark blocked emails.

zb_blocked rows are skipped by send_placement_campaigns.py (Generic DB). Goal: cut
hard bounces and risky sends so Gmail (and similar) accounts are less likely to take
reputation damage or spam-folder routing from list quality issues—not a guarantee,
but list hygiene is the main lever under your control.

Default input:
  generic_unsent_vc_registrar_emails_processed_phase1/generic_unsent_vc_registrar_emails_all_results_phase1.csv

Usage:
  python import_zerobounce_generic_results.py
  python import_zerobounce_generic_results.py --csv "path/to/results.csv"
"""

from __future__ import annotations

import argparse
import csv
import sqlite3
from datetime import datetime
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
DB_PATH = SCRIPT_DIR / "crm.db"
DEFAULT_CSV = (
    SCRIPT_DIR
    / "generic_unsent_vc_registrar_emails_processed_phase1"
    / "generic_unsent_vc_registrar_emails_all_results_phase1.csv"
)

# Conservative block policy (ties to sender reputation / bounce avoidance):
# - invalid, do_not_mail: high chance of failure or policy issues if sent
# - unknown: treat as risky for this pipeline; reduces bounce rate on cold outreach
# - valid / catch-all: not blocked here (catch-all may still bounce; optional to add)
BLOCK_STATUSES = {"invalid", "do_not_mail", "unknown"}


def ensure_columns(conn: sqlite3.Connection) -> None:
    cols = {
        row[1]
        for row in conn.execute("PRAGMA table_info(email_contacts)").fetchall()
    }
    alter = []
    if "zb_status" not in cols:
        alter.append("ALTER TABLE email_contacts ADD COLUMN zb_status TEXT")
    if "zb_sub_status" not in cols:
        alter.append("ALTER TABLE email_contacts ADD COLUMN zb_sub_status TEXT")
    if "zb_checked_at" not in cols:
        alter.append("ALTER TABLE email_contacts ADD COLUMN zb_checked_at TEXT")
    if "zb_blocked" not in cols:
        alter.append("ALTER TABLE email_contacts ADD COLUMN zb_blocked INTEGER DEFAULT 0")
    for stmt in alter:
        conn.execute(stmt)
    conn.commit()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--csv", default=str(DEFAULT_CSV), help="Path to ZeroBounce CSV")
    args = parser.parse_args()

    csv_path = Path(args.csv)
    if not csv_path.exists():
        raise FileNotFoundError(f"CSV not found: {csv_path}")
    if not DB_PATH.exists():
        raise FileNotFoundError(f"DB not found: {DB_PATH}")

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    ensure_columns(conn)

    now = datetime.now().isoformat(timespec="seconds")
    total = updated = blocked = 0
    unmatched = []

    with csv_path.open("r", encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            email = (row.get("email_address") or "").strip().lower()
            if not email:
                continue
            zb_status = (row.get("ZB Status") or "").strip().lower()
            zb_sub_status = (row.get("ZB Sub status") or "").strip().lower()
            zb_blocked = 1 if zb_status in BLOCK_STATUSES else 0

            cur = conn.execute(
                """
                UPDATE email_contacts
                SET zb_status = ?,
                    zb_sub_status = ?,
                    zb_checked_at = ?,
                    zb_blocked = ?,
                    upd_on = ?
                WHERE LOWER(email_address) = ?
                """,
                (zb_status, zb_sub_status, now, zb_blocked, now, email),
            )
            total += 1
            if cur.rowcount > 0:
                updated += 1
                if zb_blocked:
                    blocked += 1
            else:
                unmatched.append(email)

    conn.commit()

    counts = conn.execute(
        """
        SELECT
          COUNT(*) AS total_contacts,
          SUM(CASE WHEN COALESCE(zb_blocked,0)=1 THEN 1 ELSE 0 END) AS total_blocked,
          SUM(CASE WHEN zb_status='valid' THEN 1 ELSE 0 END) AS total_valid,
          SUM(CASE WHEN zb_status='catch-all' THEN 1 ELSE 0 END) AS total_catch_all,
          SUM(CASE WHEN zb_status='unknown' THEN 1 ELSE 0 END) AS total_unknown,
          SUM(CASE WHEN zb_status='invalid' THEN 1 ELSE 0 END) AS total_invalid,
          SUM(CASE WHEN zb_status='do_not_mail' THEN 1 ELSE 0 END) AS total_do_not_mail
        FROM email_contacts
        """
    ).fetchone()
    conn.close()

    print(f"Imported rows read: {total}")
    print(f"Matched/updated in DB: {updated}")
    print(f"Marked blocked this run: {blocked}")
    print(f"Unmatched rows: {len(unmatched)}")
    print("DB snapshot:")
    print(dict(counts))
    if unmatched:
        preview = ", ".join(unmatched[:10])
        print(f"Unmatched sample: {preview}")


if __name__ == "__main__":
    main()
