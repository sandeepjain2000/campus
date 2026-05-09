import sqlite3
import os
import re

CRM_DB = r"c:\Users\sandeep\Downloads\Claudes\CampusPlacement\crm\crm.db"
REAL_EMAILS_DB = r"c:\Users\sandeep\Downloads\Claudes\CampusPlacement\crm\real_emails.db"

def get_local_part(email):
    if not email or '@' not in email:
        return None
    return email.split('@')[0].lower().strip()

def analyze_db(db_path, table_name):
    if not os.path.exists(db_path):
        print(f"Database not found: {db_path}")
        return

    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    
    try:
        query = f"SELECT email_address, status FROM {table_name}"
        rows = conn.execute(query).fetchall()
    except Exception as e:
        print(f"Error reading {table_name} from {db_path}: {e}")
        conn.close()
        return

    stats = {} # local_part -> {status -> count}
    
    for row in rows:
        email = row['email_address']
        status = row['status']
        local_part = get_local_part(email)
        if not local_part:
            continue
            
        if local_part not in stats:
            stats[local_part] = {}
        
        stats[local_part][status] = stats[local_part].get(status, 0) + 1

    conn.close()
    return stats

def print_stats(title, stats):
    print(f"\n=== {title} ===")
    print(f"{'Prefix':<25} | {'Sent':<8} | {'Success':<8} | {'Failure':<8} | {'Success%':<8}")
    print("-" * 70)
    
    # Sort by total Sent/Success/Failure count descending
    sorted_prefixes = sorted(stats.keys(), key=lambda p: sum(stats[p].values()), reverse=True)
    
    for p in sorted_prefixes:
        s_stats = stats[p]
        sent = s_stats.get('Sent', 0)
        success = s_stats.get('Success', 0)
        failure = s_stats.get('Failure', 0)
        total_attempted = sent + success + failure
        
        if total_attempted == 0:
            continue
            
        success_rate = (success / total_attempted * 100) if total_attempted > 0 else 0
        
        # Only show prefixes that have at least one attempt (Sent, Success, or Failure)
        # And maybe filter to only show "generic" looking ones or top N
        print(f"{p:<25} | {sent:<8} | {success:<8} | {failure:<8} | {success_rate:>7.1f}%")

print("Analyzing CRM Database...")
crm_stats = analyze_db(CRM_DB, "email_contacts")
if crm_stats:
    print_stats("CRM Emails (crm.db)", crm_stats)

print("\nAnalyzing Real Emails Database...")
real_stats = analyze_db(REAL_EMAILS_DB, "real_emails")
if real_stats:
    print_stats("Real Emails (real_emails.db)", real_stats)
