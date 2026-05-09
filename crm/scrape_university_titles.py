#!/usr/bin/env python3
"""
scrape_university_titles.py
============================
Reads URLs from httpakubihar.ac.in.txt, opens each in Chrome,
captures the page tab title (university name), and saves a CSV.
"""

import os
import sys
import csv
import time
import traceback
from pathlib import Path
from datetime import datetime

# ── Script constants ─────────────────────────────────────────────────────────
SCRIPT_NAME = "scrape_university_titles.py"
VERSION     = "1.0.0"
INPUT_FILE  = Path(__file__).parent / "httpakubihar.ac.in.txt"
PAGE_TIMEOUT = 15          # seconds to wait for page load
SHORT_PAUSE  = 1.5         # seconds between URLs

# ── Setup ────────────────────────────────────────────────────────────────────
os.system('cls' if os.name == 'nt' else 'clear')

start_time  = datetime.now()
script_dir  = Path(__file__).parent
output_dir  = script_dir / "logs_and_reports"
output_dir.mkdir(exist_ok=True)

ts          = start_time.strftime('%Y%m%d_%H%M%S')
log_path    = output_dir / f"scrape_university_titles_{ts}.log"
report_path = output_dir / f"scrape_university_titles_report_{ts}.txt"
csv_path    = output_dir / f"university_titles_{ts}.csv"

log_file = open(log_path, 'w', encoding='utf-8')

def log(msg):
    print(msg)
    log_file.write(msg + '\n')
    log_file.flush()

# ── Banner ───────────────────────────────────────────────────────────────────
log("=" * 65)
log(f"  {SCRIPT_NAME}  v{VERSION}")
log(f"  Started : {start_time.strftime('%Y-%m-%d %H:%M:%S')}")
log("=" * 65)
log(f"  Input   : {INPUT_FILE}")
log(f"  Output  : {csv_path}")
log("=" * 65)
print()

# ── Main logic ───────────────────────────────────────────────────────────────
total = 0
success = 0
failed  = 0
skipped = 0
errors  = []

try:
    # -- Import Selenium (install if missing: pip install selenium) -----------
    try:
        from selenium import webdriver
        from selenium.webdriver.chrome.options import Options
        from selenium.webdriver.chrome.service import Service
        from selenium.common.exceptions import WebDriverException, TimeoutException
    except ImportError:
        log("ERROR: selenium not installed. Run:  pip install selenium")
        sys.exit(1)

    # -- Read URLs ------------------------------------------------------------
    if not INPUT_FILE.exists():
        log(f"ERROR: Input file not found: {INPUT_FILE}")
        sys.exit(1)

    urls = [
        line.strip()
        for line in INPUT_FILE.read_text(encoding='utf-8').splitlines()
        if line.strip() and line.strip().startswith('http')
    ]
    total = len(urls)
    log(f"  Found {total} URLs to process\n")

    # -- Chrome options -------------------------------------------------------
    chrome_opts = Options()
    # Visible browser so you can see progress; add --headless below to hide it
    chrome_opts.add_argument("--start-maximized")
    chrome_opts.add_argument("--disable-notifications")
    chrome_opts.add_argument("--disable-popup-blocking")
    chrome_opts.add_argument("--no-sandbox")
    chrome_opts.add_argument("--disable-dev-shm-usage")
    chrome_opts.add_experimental_option("excludeSwitches", ["enable-logging"])

    # -- Start Chrome ---------------------------------------------------------
    log("  Starting Chrome …")
    try:
        driver = webdriver.Chrome(options=chrome_opts)
    except WebDriverException as e:
        log(f"ERROR: Could not start Chrome.\n"
            f"  Make sure ChromeDriver is installed and on PATH.\n"
            f"  Details: {e}")
        sys.exit(1)

    driver.set_page_load_timeout(PAGE_TIMEOUT)
    log("  Chrome started.\n")

    # -- CSV output -----------------------------------------------------------
    csv_file   = open(csv_path, 'w', newline='', encoding='utf-8-sig')
    csv_writer = csv.writer(csv_file)
    csv_writer.writerow(["#", "URL", "University Name (Tab Title)", "Status"])

    # -- Process each URL -----------------------------------------------------
    for idx, url in enumerate(urls, start=1):
        prefix = f"[{idx:>3}/{total}]"
        try:
            driver.get(url)
            time.sleep(SHORT_PAUSE)          # allow JS to settle
            title = driver.title.strip()

            if not title:
                title = "(no title)"
                status = "NO TITLE"
            else:
                status = "OK"

            csv_writer.writerow([idx, url, title, status])
            csv_file.flush()
            log(f"{prefix} ✓  {title[:70]}  ←  {url}")
            success += 1

        except TimeoutException:
            msg = "TIMEOUT"
            csv_writer.writerow([idx, url, "", msg])
            csv_file.flush()
            log(f"{prefix} ⚠  TIMEOUT  ←  {url}")
            errors.append(f"[{idx}] TIMEOUT: {url}")
            failed += 1

        except WebDriverException as e:
            short = str(e).split('\n')[0][:80]
            csv_writer.writerow([idx, url, "", f"ERROR: {short}"])
            csv_file.flush()
            log(f"{prefix} ✗  ERROR: {short}  ←  {url}")
            errors.append(f"[{idx}] {short}: {url}")
            failed += 1

        except Exception as e:
            short = str(e)[:80]
            csv_writer.writerow([idx, url, "", f"ERROR: {short}"])
            csv_file.flush()
            log(f"{prefix} ✗  {short}  ←  {url}")
            errors.append(f"[{idx}] {short}: {url}")
            failed += 1

    csv_file.close()
    driver.quit()
    log("\n  Chrome closed.")
    outcome = "SUCCESS"

except Exception as e:
    outcome = "FAILURE"
    err_detail = traceback.format_exc()
    log(f"\nFATAL ERROR: {e}\n{err_detail}")
    errors.append(f"FATAL: {e}")
    try:
        driver.quit()
    except Exception:
        pass
    sys.exit(1)

finally:
    # ── Summary report ───────────────────────────────────────────────────────
    end_time = datetime.now()
    duration = (end_time - start_time).total_seconds()

    report_lines = [
        "=" * 65,
        f"  SCRIPT REPORT: {SCRIPT_NAME}  v{VERSION}",
        "=" * 65,
        f"  Start Time  : {start_time.strftime('%Y-%m-%d %H:%M:%S')}",
        f"  End Time    : {end_time.strftime('%Y-%m-%d %H:%M:%S')}",
        f"  Duration    : {duration:.1f} seconds",
        f"  Outcome     : {outcome}",
        "-" * 65,
        f"  Summary:",
        f"    Total URLs   : {total}",
        f"    Successful   : {success}",
        f"    Failed/Timeout: {failed}",
        f"    Skipped      : {skipped}",
        f"    CSV saved to : {csv_path}",
        "-" * 65,
        f"  Errors ({len(errors)}):",
    ]
    for err in errors[:30]:
        report_lines.append(f"    {err}")
    if len(errors) > 30:
        report_lines.append(f"    … and {len(errors)-30} more (see log)")
    report_lines.append("=" * 65)

    report_text = '\n'.join(report_lines)

    with open(report_path, 'w', encoding='utf-8') as rpt:
        rpt.write(report_text)

    log("\n" + report_text)
    log(f"\n  Log    : {log_path}")
    log(f"  Report : {report_path}")
    log(f"  CSV    : {csv_path}")

    log_file.close()

sys.exit(0)
