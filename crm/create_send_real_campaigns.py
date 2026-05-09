import re

with open('send_placement_campaigns.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace DB_PATH
content = content.replace('"crm.db"', '"real_emails.db"')

# Replace table names
content = content.replace('email_contacts', 'real_emails')

# Replace get_next_email_for_institutes function
old_func_pattern = r'def get_next_email_for_institutes.*?return cur\.fetchall\(\)'
new_func = '''def get_next_email_for_institutes(conn, limit: int) -> list:
    """
    Returns up to `limit` real_emails rows — one per domain —
    where the domain has NO 'Sent' or 'Success' email.
    """
    cur = conn.execute("""
        SELECT id, domain, email_address, college_name AS institute_name
        FROM   real_emails
        WHERE  status = 'Not Sent'
          AND  domain NOT IN (
                   SELECT DISTINCT domain
                   FROM   real_emails
                   WHERE  status IN ('Sent', 'Success')
               )
        GROUP  BY domain
        ORDER  BY id
        LIMIT  ?
    """, (limit,))
    return cur.fetchall()'''
content = re.sub(old_func_pattern, new_func, content, flags=re.DOTALL)

# Replace loop variables
content = content.replace('sr_no        = row["institute_sr_no"]', 'sr_no        = ec_id')

with open('send_real_campaigns.py', 'w', encoding='utf-8') as f:
    f.write(content)
print('send_real_campaigns.py created successfully.')
