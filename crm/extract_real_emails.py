import sqlite3
import pandas as pd
import re
import os

CRM_DB = "crm.db"
REAL_EMAILS_DB = "real_emails.db"

FREE_EMAIL_DOMAINS = {
    'gmail.com', 'yahoo.com', 'yahoo.co.in', 'ymail.com', 'hotmail.com', 
    'outlook.com', 'live.com', 'aol.com', 'msn.com', 'rediffmail.com',
    'rocketmail.com', 'icloud.com', 'mail.com'
}

def is_free_email(email):
    if not email or '@' not in email:
        return True
    domain = email.split('@')[-1].lower().strip()
    return domain in FREE_EMAIL_DOMAINS

def get_db_connection(db_file):
    return sqlite3.connect(db_file)

def setup_real_emails_db():
    conn = get_db_connection(REAL_EMAILS_DB)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS real_emails (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email_address TEXT NOT NULL UNIQUE,
            domain TEXT NOT NULL,
            college_name TEXT,
            person_name TEXT,
            source_file TEXT,
            institute_id INTEGER, -- Reference to crm.db institutes table
            status TEXT DEFAULT 'Not Sent',
            upd_on DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    return conn

def extract_emails(text):
    if pd.isna(text):
        return []
    text = str(text)
    # findall emails
    emails = re.findall(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', text)
    return [e.lower() for e in emails]

def get_institute_map():
    conn = get_db_connection(CRM_DB)
    cursor = conn.cursor()
    try:
        cursor.execute("SELECT id, domain FROM institutes")
        rows = cursor.fetchall()
        return {row[1].lower(): row[0] for row in rows}
    except Exception as e:
        print("Error fetching institutes:", e)
        return {}
    finally:
        conn.close()

def insert_emails(conn, emails_data):
    cursor = conn.cursor()
    inserted = 0
    for data in emails_data:
        try:
            cursor.execute('''
                INSERT INTO real_emails (email_address, domain, college_name, person_name, source_file, institute_id)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (data['email'], data['domain'], data['college_name'], data['person_name'], data['source_file'], data['institute_id']))
            inserted += 1
        except sqlite3.IntegrityError:
            # Ignore duplicate emails
            pass
    conn.commit()
    return inserted

def main():
    print("Setting up database...")
    real_db_conn = setup_real_emails_db()
    
    print("Fetching domain mapping from crm.db...")
    domain_to_institute_id = get_institute_map()
    
    emails_to_insert = []
    
    def process_row(email, college_name, person_name, source_file):
        for e in extract_emails(email):
            if is_free_email(e):
                continue
            
            domain = e.split('@')[-1].lower()
            inst_id = domain_to_institute_id.get(domain)
            
            emails_to_insert.append({
                'email': e,
                'domain': domain,
                'college_name': str(college_name) if not pd.isna(college_name) else '',
                'person_name': str(person_name) if not pd.isna(person_name) else '',
                'source_file': source_file,
                'institute_id': inst_id
            })

    files_configs = [
        {
            'file': 'Contact Details of Colleges.xlsx',
            'sheets': {
                'IITs': {'email': 'Mail IDs', 'college': 'College Name', 'person': 'Contact person name'},
                'NITs': {'email': 'Email IDs', 'college': 'Name', 'person': 'Contact Person name'},
                'IIITs': {'email': 'Email ID', 'college': 'Name', 'person': 'Contact Person Name'}
            }
        },
        {
            'file': 'Colleges mail merge.xlsx',
            'sheets': {
                'Pune Mails': {'email': 'mail ids', 'college': 'College', 'person': 'Principal', 'status': 'Merge status'},
                'TPO Mails': {'email': 'Email', 'college': 'College', 'person': None, 'status': 'Merge status'},
                'Punjab Mails': {'email': 'Column A', 'college': 'College', 'person': None, 'status': 'Merge status'},
                'LCBS': {'email': 'Email', 'college': None, 'person': None, 'status': 'Merge status'},
                'Maharastra Mails': {'email': 'Mails', 'college': 'College', 'person': 'Principal'}, # Merge status is Unnamed: 1 maybe? We will check column 'Unnamed: 1' manually or skip if not found
                'Follow-up on Pune Mails': {'email': 'mail ids', 'college': 'College', 'person': 'Principal', 'status': 'Merge status'}
            }
        },
        {
            'file': 'Colleges-C.xlsx',
            'sheets': {
                'Mail ids': {'email': 'Mail id', 'college': None, 'person': None}
            }
        },
        {
            'file': 'Colleges-J.xlsx',
            'sheets': {
                'Mail ids': {'email': 'Mail id', 'college': None, 'person': None}
            }
        },
        {
            'file': 'Colleges-A.xlsx',
            'sheets': {
                'Mail ids': {'email': 'Mail id', 'college': None, 'person': None}
            }
        }
    ]

    for config in files_configs:
        file_name = config['file']
        print(f"Processing {file_name}...")
        if not os.path.exists(file_name):
            print(f"File {file_name} not found.")
            continue
            
        xls = pd.ExcelFile(file_name)
        for sheet_name, cols in config['sheets'].items():
            if sheet_name not in xls.sheet_names:
                continue
            print(f"  Reading sheet: {sheet_name}")
            df = pd.read_excel(xls, sheet_name=sheet_name)
            
            for _, row in df.iterrows():
                # Check merge status
                if 'status' in cols and cols['status'] in df.columns:
                    status_val = str(row[cols['status']]).upper().strip()
                    if 'BOUNCED' in status_val:
                        continue
                        
                email_col = cols['email']
                if email_col not in df.columns:
                    # In Punjab Mails, maybe 'Column A' is actually not the column name, let's just grab the first column or check if it exists
                    continue
                    
                email_val = row[email_col]
                college_val = row[cols['college']] if cols.get('college') and cols['college'] in df.columns else ''
                person_val = row[cols['person']] if cols.get('person') and cols['person'] in df.columns else ''
                
                process_row(email_val, college_val, person_val, f"{file_name} - {sheet_name}")

    print(f"Found {len(emails_to_insert)} valid emails.")
    
    # Remove duplicates within the list to avoid lots of integrity errors
    unique_emails = {}
    for item in emails_to_insert:
        if item['email'] not in unique_emails:
            unique_emails[item['email']] = item
            
    inserted_count = insert_emails(real_db_conn, list(unique_emails.values()))
    print(f"Successfully inserted {inserted_count} new unique real emails into {REAL_EMAILS_DB}.")
    
    real_db_conn.close()

if __name__ == '__main__':
    main()
