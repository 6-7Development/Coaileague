"""
ACME SIMULATION DATA PURGE
===========================
Removes all data created by acme_hard_persist.py.
Run this when you're done verifying and want to clean up.

Usage: python3 scripts/acme_purge_sim.py
"""
import os, psycopg2, shutil
from pathlib import Path

DB_URL = os.environ.get("DATABASE_URL")
if not DB_URL:
    print("❌ DATABASE_URL not set"); exit(1)

conn = psycopg2.connect(DB_URL)
conn.autocommit = True
cur  = conn.cursor()

WS = "dev-acme-security-ws"
TABLES = [
    ("document_vault",         "id LIKE 'sim-dv-%%'"),
    ("pay_stubs",              "id LIKE 'sim-stub-%%'"),
    ("payroll_entries",        "id LIKE 'sim-pe-%%'"),
    ("payroll_runs",           "id LIKE 'sim-payroll-run-%%'"),
    ("invoice_line_items",     "id LIKE 'sim-li-%%'"),
    ("invoices",               "id LIKE 'sim-inv-%%'"),
    ("time_entries",           "id LIKE 'sim-te-%%'"),
    ("shifts",                 "id LIKE 'sim-shift-%%'"),
    ("employee_certifications","id LIKE 'sim-cert-%%'"),
]

print("ACME Simulation Data Purge")
print("="*40)
total = 0
for table, where in TABLES:
    cur.execute(f"DELETE FROM {table} WHERE {where}")
    n = cur.rowcount
    total += n
    print(f"  {table}: {n} rows deleted")

# Purge local PDFs/images
out_dir = Path("/tmp/acme_sim_docs")
if out_dir.exists():
    shutil.rmtree(out_dir)
    print(f"  Local docs: {out_dir} removed")

conn.close()
print(f"\nTotal: {total} rows purged ✅")
print("ACME sandbox is clean.")
