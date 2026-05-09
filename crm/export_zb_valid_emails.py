#!/usr/bin/env python3
"""Write one email per line: email_contacts where ZeroBounce status is valid."""
from pathlib import Path
import sqlite3

SCRIPT_DIR = Path(__file__).resolve().parent
DB_PATH = SCRIPT_DIR / "crm.db"
OUT_PATH = SCRIPT_DIR / "zerobounce_valid_emails.txt"


def main() -> None:
    conn = sqlite3.connect(DB_PATH)
    cur = conn.execute(
        """
        SELECT DISTINCT LOWER(TRIM(email_address))
        FROM email_contacts
        WHERE LOWER(TRIM(COALESCE(zb_status, ''))) = 'valid'
        ORDER BY 1
        """
    )
    rows = [r[0] for r in cur.fetchall() if r[0]]
    conn.close()
    OUT_PATH.write_text("\n".join(rows) + ("\n" if rows else ""), encoding="utf-8")
    print(f"{len(rows)} emails -> {OUT_PATH}")


if __name__ == "__main__":
    main()
