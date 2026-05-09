import sqlite3
import os

CRM_DB = r"c:\Users\sandeep\Downloads\Claudes\CampusPlacement\crm\crm.db"
REAL_EMAILS_DB = r"c:\Users\sandeep\Downloads\Claudes\CampusPlacement\crm\real_emails.db"

CATEGORIES = {
    "Placement / TPO": ["placement", "placements", "tpo", "tnp", "placementcell", "tnpoffice", "office.placement", "placementofficer", "placements.iiitsricity", "fic.placement", "pic.tnp", "ic_tnp", "tp", "c2p", "tnp_fic"],
    "Registrar": ["registrar"],
    "VC / Pro-VC": ["vc", "provc"],
    "Admissions": ["admissions"],
    "Dean / Director / Principal": ["dean", "director", "principal", "directoroffice", "officeofdirector", "director_dyptc", "director_iac", "prinviit", "principal.scoe"],
    "General (Info/Contact)": ["info", "contact"],
    "COE / Corporate Relations": ["coe", "corporaterelations"],
}

def get_local_part(email):
    if not email or '@' not in email:
        return None
    return email.split('@')[0].lower().strip()

def get_category(local_part):
    for cat, prefixes in CATEGORIES.items():
        if local_part in prefixes:
            return cat
    return "Other / Personal"

def analyze():
    all_stats = {} # category -> {status -> count}
    
    for db_path, table in [(CRM_DB, "email_contacts"), (REAL_EMAILS_DB, "real_emails")]:
        if not os.path.exists(db_path):
            continue
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        try:
            rows = conn.execute(f"SELECT email_address, status FROM {table}").fetchall()
            for row in rows:
                local_part = get_local_part(row['email_address'])
                cat = get_category(local_part)
                if cat not in all_stats:
                    all_stats[cat] = {}
                status = row['status']
                all_stats[cat][status] = all_stats[cat].get(status, 0) + 1
        finally:
            conn.close()
            
    return all_stats

stats = analyze()

print("# Success/Failure Analysis by Email Type (Combined DBs)")
print("\n| Type | Sent | Success (Replies) | Failure (Bounces) | Bounce Rate | Success Rate |")
print("| :--- | :---: | :---: | :---: | :---: | :---: |")

# Sort by Total attempted
sorted_cats = sorted(stats.keys(), key=lambda c: sum(stats[c].values()), reverse=True)

for cat in sorted_cats:
    s = stats[cat]
    sent = s.get('Sent', 0)
    success = s.get('Success', 0)
    failure = s.get('Failure', 0)
    total_attempted = sent + success + failure
    
    if total_attempted == 0:
        continue
        
    bounce_rate = (failure / total_attempted * 100) if total_attempted > 0 else 0
    success_rate = (success / total_attempted * 100) if total_attempted > 0 else 0
    
    print(f"| {cat} | {sent} | {success} | {failure} | {bounce_rate:.1f}% | {success_rate:.1f}% |")

print("\n**Note**: 'Sent' includes emails that are currently pending (no bounce or reply detected yet).")
