#!/usr/bin/env python3
"""
clean_and_import_link3.py
=========================
1. Reads link3.txt
2. Filters out:
   - Blank / incomplete URLs (no valid domain, bare www., broken https// etc.)
   - .gov / .gov.in domains
   - UGC portals (ugc.ac.in, deb.ugc.ac.in, etc.)
   - Social media (facebook, twitter, instagram, youtube, linkedin, whatsapp)
   - Non-college domains (mygov, parichay, nvsp, rusa, aicte, scholarship, etc.)
   - Deduplicates by domain
3. Saves cleaned list to link3_clean.txt
4. Imports new institutes + generic emails into crm.db (dry-run unless --commit)

Usage:
    python clean_and_import_link3.py            # clean + dry-run
    python clean_and_import_link3.py --commit   # clean + write to DB
"""

import sqlite3
import os
import re
import argparse
from urllib.parse import urlparse
from datetime import datetime

_SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH     = os.path.join(_SCRIPT_DIR, "crm.db")
LINK_FILE   = os.path.join(_SCRIPT_DIR, "link3.txt")
CLEAN_FILE  = os.path.join(_SCRIPT_DIR, "link3_clean.txt")

NOW = datetime.now().isoformat()

EMAIL_PATTERNS = ["placement", "placements", "tpo", "registrar", "vc"]

# ── Domains / TLDs / keywords to SKIP ────────────────────────────────────────
SKIP_EXACT_DOMAINS = {
    # Social media
    "facebook.com", "twitter.com", "x.com", "instagram.com",
    "youtube.com", "linkedin.com", "whatsapp.com",
    # Govt portals (non-college)
    "mygov.in", "parichay.nic.in", "nvsp.in", "rusa.nic.in",
    "evisitors.nic.in", "yogamdniy.nic.in",
    "ncert.nic.in", "iimc.nic.in",
    "nta.ac.in",
    # UGC family
    "ugc.ac.in", "ugcnetonline.in", "deb.ugc.ac.in", "deemed.ugc.ac.in",
    "ioe.ugc.ac.in", "uamp.ugc.ac.in", "ugchindi.ugc.ac.in",
    # Scholarship / canara bank
    "scholarship.canarabank.in",
    # AICTE
    "aicte-india.org",
    # Nagaland ISP
    "nagaland.net.in",
    # edtech generic
    "edtech.edu.in",
    # misc non-academic
    "mnrindia.org", "nayanta.org", "kav.org.in",
}

# TLD patterns that indicate government sites
GOV_TLDS = re.compile(r'\.(gov|gov\.in)$', re.IGNORECASE)

# Patterns that indicate the domain is broken / incomplete
BROKEN_PATTERNS = [
    re.compile(r'^www\.$'),              # bare www.
    re.compile(r'^https?://$'),          # scheme only
    re.compile(r'https?//'),             # malformed https//...
    re.compile(r'\.ac$'),                # .ac without country (e.g. dgu.ac, rgu.ac)
    re.compile(r'\.\s*$'),               # ends with just a dot
]

# Domains with only path/sub-page duplicates — keep the root domain
def normalize_domain(url: str):
    """Return (cleaned_url, domain) or (None, None) if invalid/skippable."""
    url = url.strip().rstrip(',')

    # Fix common typo: https//  →  https://
    url = re.sub(r'^https?//', lambda m: m.group(0).replace('//', '://'), url)

    if not url or url in ('', '\r', '\n'):
        return None, None

    # Must start with http(s):// or we skip
    if not re.match(r'^https?://', url, re.IGNORECASE):
        return None, None

    # Check broken patterns against full URL
    for pat in BROKEN_PATTERNS:
        if pat.search(url):
            return None, None

    try:
        parsed = urlparse(url)
        host = parsed.netloc or ''
        if not host:
            return None, None

        # Strip port
        host = host.split(':')[0].lower()

        # Strip www.
        if host.startswith('www.'):
            host = host[4:]

        # Must have at least one dot (i.e. a real domain)
        if '.' not in host:
            return None, None

        # .gov / .gov.in → skip
        if GOV_TLDS.search(host):
            return None, None

        # Exact domain skip list
        if host in SKIP_EXACT_DOMAINS:
            return None, None

        # Sub-domains of skip list (e.g. something.ugc.ac.in)
        for skip in SKIP_EXACT_DOMAINS:
            if host.endswith('.' + skip):
                return None, None

        # Domains ending in .ac (without country code) are broken
        if host.endswith('.ac'):
            return None, None

        # Reconstruct a clean URL using just scheme + domain (strip sub-paths)
        clean_url = f"{parsed.scheme}://{host}/"
        return clean_url, host

    except Exception:
        return None, None


def load_existing_domains(conn) -> set:
    rows = conn.execute("SELECT domain FROM institutes").fetchall()
    return {r[0].lower() for r in rows}


def get_max_sr_no(conn) -> int:
    row = conn.execute("SELECT MAX(sr_no) FROM institutes").fetchone()
    return row[0] or 0


def run(commit: bool):
    # ── Step 1: Read & clean ─────────────────────────────────────────────────
    with open(LINK_FILE, encoding='utf-8', errors='replace') as f:
        raw_lines = f.readlines()

    print(f"[INFO] Read {len(raw_lines)} raw lines from {LINK_FILE}")

    seen_domains  = set()
    clean_entries = []   # (clean_url, domain)
    skipped       = []

    for line in raw_lines:
        clean_url, domain = normalize_domain(line)
        if not clean_url:
            skipped.append(line.strip())
            continue
        if domain in seen_domains:
            skipped.append(f"[DUP] {line.strip()}")
            continue
        seen_domains.add(domain)
        clean_entries.append((clean_url, domain))

    print(f"[INFO] Valid unique college domains : {len(clean_entries)}")
    print(f"[INFO] Skipped (invalid/non-college): {len(skipped)}")

    # ── Step 2: Write link3_clean.txt ────────────────────────────────────────
    with open(CLEAN_FILE, 'w', encoding='utf-8') as f:
        for (url, _) in clean_entries:
            f.write(url + '\n')
    print(f"[INFO] Saved cleaned list -> {CLEAN_FILE}")

    # ── Step 3: DB import ────────────────────────────────────────────────────
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row

    existing     = load_existing_domains(conn)
    next_sr      = get_max_sr_no(conn) + 1
    new_insts    = []
    already_in   = []

    for (url, domain) in clean_entries:
        if domain in existing:
            already_in.append(domain)
        else:
            new_insts.append((next_sr, url, domain))
            next_sr += 1

    print(f"\n[SUMMARY]")
    print(f"  New institutes to add : {len(new_insts)}")
    print(f"  Already in DB (skip)  : {len(already_in)}")
    print()

    if not new_insts:
        print("[DONE] Nothing new to add.")
        conn.close()
        return

    print(f"  {'Sr':>5}  {'Domain':<45}  URL")
    print("  " + "-" * 95)
    for (sr, url, dom) in new_insts:
        print(f"  {sr:>5}  {dom:<45}  {url}")

    if not commit:
        print(f"\n[DRY-RUN] No changes written. Re-run with --commit to apply.")
        conn.close()
        return

    # ── Insert ────────────────────────────────────────────────────────────────
    email_count = 0
    for (sr_no, website, domain) in new_insts:
        conn.execute("""
            INSERT OR IGNORE INTO institutes (sr_no, website, domain, institute_name, upd_on)
            VALUES (?, ?, ?, '', ?)
        """, (sr_no, website, domain, NOW))

        inst_id = conn.execute(
            "SELECT id FROM institutes WHERE domain = ?", (domain,)
        ).fetchone()["id"]

        for email_seq, prefix in enumerate(EMAIL_PATTERNS, start=1):
            conn.execute("""
                INSERT OR IGNORE INTO email_contacts
                    (institute_id, institute_sr_no, email_seq, email_address, status, upd_on)
                VALUES (?, ?, ?, ?, 'Not Sent', ?)
            """, (inst_id, sr_no, email_seq, f"{prefix}@{domain}", NOW))
            email_count += 1

    conn.commit()
    conn.close()

    print(f"\n[OK] Inserted {len(new_insts)} institutes and {email_count} email contacts into {DB_PATH}")
    print(f"     Email patterns: {', '.join(EMAIL_PATTERNS)}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Clean link3.txt and import into crm.db")
    parser.add_argument("--commit", action="store_true",
                        help="Write to DB (default is dry-run)")
    args = parser.parse_args()
    run(commit=args.commit)
