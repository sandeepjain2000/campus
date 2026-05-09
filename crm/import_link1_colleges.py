#!/usr/bin/env python3
"""
import_link1_colleges.py
========================
Reads a link file (default: Link1.txt), extracts domains, inserts any NEW institutes into crm.db,
and generates generic email contacts (placement, placements, tpo, registrar, vc)
for each new institute.

Already-existing domains (by domain match) are silently skipped.

Usage:
    python import_link1_colleges.py                        # dry-run preview of Link1.txt
    python import_link1_colleges.py --file link2.txt       # dry-run preview of another file
    python import_link1_colleges.py --file link2.txt --commit  # write to DB
"""

import sqlite3
import os
import sys
import argparse
from urllib.parse import urlparse
from datetime import datetime

_SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH     = os.path.join(_SCRIPT_DIR, "crm.db")
LINK_FILE   = os.path.join(_SCRIPT_DIR, "Link1.txt")

EMAIL_PATTERNS = [
    "placement",
    "placements",
    "tpo",
    "registrar",
    "vc",
]

NOW = datetime.now().isoformat()

# ── Skip non-university / irrelevant domains ──────────────────────────────────
SKIP_DOMAINS = {
    # Govt portals / non-universities
    "evisitors.nic.in",
    "mygov.in",
    "rusa.nic.in",
    "nvsp.in",
    "ugc.ac.in",
    "ugcnetonline.in",
    "deb.ugc.ac.in",
    "deemed.ugc.ac.in",
    "ioe.ugc.ac.in",
    "uamp.ugc.ac.in",
    "ugchindi.ugc.ac.in",
    "ncert.nic.in",
    "iimc.nic.in",
    "parichay.nic.in",
    "scholarship.canarabank.in",
    "aicte-india.org",
    "nta.ac.in",
    "yogamdniy.nic.in",
    # Social media / non-academic
    "twitter.com",
    "x.com",
    "whatsapp.com",
    "facebook.com",
    "youtube.com",
    "linkedin.com",
    "instagram.com",
}


def extract_domain(url: str) -> str | None:
    url = url.strip()
    if not url:
        return None
    try:
        parsed = urlparse(url)
        host = parsed.netloc or parsed.path   # handles bare domains without scheme
        # strip www.
        if host.startswith("www."):
            host = host[4:]
        # strip port if any
        host = host.split(":")[0]
        # strip trailing path fragments (e.g. /kanha or /c)
        host = host.split("/")[0]
        return host.lower() if host else None
    except Exception:
        return None


def load_existing_domains(conn) -> set:
    rows = conn.execute("SELECT domain FROM institutes").fetchall()
    return {r[0].lower() for r in rows}


def get_max_sr_no(conn) -> int:
    row = conn.execute("SELECT MAX(sr_no) FROM institutes").fetchone()
    return row[0] or 0


def run(commit: bool, link_file: str = LINK_FILE):
    # ── Read URLs ──────────────────────────────────────────────────────────────
    with open(link_file, encoding="utf-8") as f:
        raw_urls = f.readlines()

    domains_from_file = []
    for line in raw_urls:
        url = line.strip()
        if not url:
            continue
        dom = extract_domain(url)
        if dom:
            domains_from_file.append((url, dom))

    print(f"[INFO] Parsed {len(domains_from_file)} valid URLs")

    # ── Connect DB ────────────────────────────────────────────────────────────
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row

    existing = load_existing_domains(conn)
    print(f"[INFO] Existing institutes in DB: {len(existing)}")

    next_sr = get_max_sr_no(conn) + 1

    new_institutes = []
    skipped_existing = []
    skipped_skip_list = []
    seen_domains = set()

    for (url, dom) in domains_from_file:
        if dom in SKIP_DOMAINS:
            skipped_skip_list.append(dom)
            continue
        if dom in existing:
            skipped_existing.append(dom)
            continue
        if dom in seen_domains:   # dedup within the file itself
            continue
        seen_domains.add(dom)
        new_institutes.append((next_sr, url, dom))
        next_sr += 1

    print(f"\n[SUMMARY]")
    print(f"  New institutes to add : {len(new_institutes)}")
    print(f"  Already in DB (skip)  : {len(skipped_existing)}")
    print(f"  On skip-list (skip)   : {len(skipped_skip_list)}")
    print()

    if not new_institutes:
        print("[DONE] Nothing new to add.")
        conn.close()
        return

    print(f"{'Sr':>5}  {'Domain':<40}  URL")
    print("  " + "-" * 90)
    for (sr, url, dom) in new_institutes:
        print(f"  {sr:>4}  {dom:<40}  {url}")

    if not commit:
        print(f"\n[DRY-RUN] No changes written. Re-run with --commit to apply.")
        conn.close()
        return

    # ── Insert ────────────────────────────────────────────────────────────────
    email_count = 0
    for (sr_no, website, domain) in new_institutes:
        conn.execute("""
            INSERT OR IGNORE INTO institutes (sr_no, website, domain, institute_name, upd_on)
            VALUES (?, ?, ?, '', ?)
        """, (sr_no, website, domain, NOW))

        inst_id = conn.execute(
            "SELECT id FROM institutes WHERE domain = ?", (domain,)
        ).fetchone()["id"]

        for email_seq, prefix in enumerate(EMAIL_PATTERNS, start=1):
            email_addr = f"{prefix}@{domain}"
            conn.execute("""
                INSERT OR IGNORE INTO email_contacts
                    (institute_id, institute_sr_no, email_seq, email_address, status, upd_on)
                VALUES (?, ?, ?, ?, 'Not Sent', ?)
            """, (inst_id, sr_no, email_seq, email_addr, NOW))
            email_count += 1

    conn.commit()
    conn.close()

    print(f"\n[OK] Inserted {len(new_institutes)} institutes and {email_count} email contacts into {DB_PATH}")
    print(f"     Email patterns used: {', '.join(EMAIL_PATTERNS)}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Import college URLs from a link file into crm.db")
    parser.add_argument("--commit", action="store_true",
                        help="Actually write to the database (default is dry-run preview)")
    parser.add_argument("--file", default=LINK_FILE,
                        help=f"Path to the link file (default: {LINK_FILE})")
    args = parser.parse_args()
    # Resolve relative paths from the script directory
    file_path = args.file if os.path.isabs(args.file) else os.path.join(_SCRIPT_DIR, args.file)
    run(commit=args.commit, link_file=file_path)
