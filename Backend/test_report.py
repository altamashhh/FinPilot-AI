"""
Quick test for the new GET /report/pdf and GET /report/csv endpoints.
Run with: .\venv\Scripts\python test_report.py
Requires server running on http://127.0.0.1:8000
"""
import sys, os
import requests

if sys.platform == 'win32':
    os.environ['PYTHONIOENCODING'] = 'utf-8'
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

BASE_URL = "http://127.0.0.1:8000"
GREEN = "\033[92m"
RED   = "\033[91m"
CYAN  = "\033[96m"
BOLD  = "\033[1m"
RESET = "\033[0m"

passed = 0
failed = 0

def header(t):
    print(f"\n{BOLD}{CYAN}{'='*60}\n  {t}\n{'='*60}{RESET}\n")

def test(name, condition, detail=""):
    global passed, failed
    if condition:
        passed += 1
        print(f"  {GREEN}[PASS]{RESET}  {name}")
    else:
        failed += 1
        print(f"  {RED}[FAIL]{RESET}  {name}")
    if detail:
        print(f"        {detail}")

# ── Setup: login as testuser ──────────────────────────────────────
header("Setup: Authenticate")
r = requests.post(f"{BASE_URL}/auth/login",
                  json={"email": "testuser@finpilot.com", "password": "secure123"})
test("Login as testuser returns 200", r.status_code == 200, f"status={r.status_code}")
TOKEN = r.json().get("access_token", "")
test("Got access token", bool(TOKEN))
AUTH = {"Authorization": f"Bearer {TOKEN}"}

# ── PDF endpoint ─────────────────────────────────────────────────
header("GET /report/pdf")
r = requests.get(f"{BASE_URL}/report/pdf", headers=AUTH)
test("Returns 200", r.status_code == 200, f"status={r.status_code}, body={r.text[:200] if r.status_code!=200 else ''}")
test("Content-Type is application/pdf", "application/pdf" in r.headers.get("Content-Type",""), f"got: {r.headers.get('Content-Type')}")
test("Content-Disposition is attachment", "attachment" in r.headers.get("Content-Disposition",""), f"got: {r.headers.get('Content-Disposition')}")
test("Filename contains 'wealthai_report'", "wealthai_report" in r.headers.get("Content-Disposition",""))
test("Body starts with PDF magic bytes (%PDF)", r.content[:4] == b"%PDF", f"first 4 bytes: {r.content[:4]}")
test("PDF is >10 KB (has content)", len(r.content) > 10_000, f"size={len(r.content)} bytes")

# ── CSV endpoint ─────────────────────────────────────────────────
header("GET /report/csv")
r2 = requests.get(f"{BASE_URL}/report/csv", headers=AUTH)
test("Returns 200", r2.status_code == 200, f"status={r2.status_code}")
test("Content-Type is text/csv", "text/csv" in r2.headers.get("Content-Type",""), f"got: {r2.headers.get('Content-Type')}")
test("Content-Disposition is attachment", "attachment" in r2.headers.get("Content-Disposition",""))
test("Filename contains 'wealthai_transactions'", "wealthai_transactions" in r2.headers.get("Content-Disposition",""))
lines = r2.text.strip().split("\n")
test("Has header row", lines[0].startswith("Date"), f"header: {lines[0][:80]}")
test("Has data rows (>1 rows total)", len(lines) > 1, f"total rows: {len(lines)}")
print(f"          CSV header: {lines[0].strip()}")
print(f"          Total rows: {len(lines)} (including header)")

# ── Auth protection ───────────────────────────────────────────────
header("Auth Protection")
r3 = requests.get(f"{BASE_URL}/report/pdf")
r4 = requests.get(f"{BASE_URL}/report/csv")
r5 = requests.get(f"{BASE_URL}/report/pdf", headers={"Authorization": "Bearer badtoken"})
r6 = requests.get(f"{BASE_URL}/report/csv", headers={"Authorization": "Bearer badtoken"})
test("PDF without token returns 401", r3.status_code == 401)
test("CSV without token returns 401", r4.status_code == 401)
test("PDF with bad token returns 401", r5.status_code == 401)
test("CSV with bad token returns 401", r6.status_code == 401)

# ── Summary ────────────────────────────────────────────────────────
header("RESULTS SUMMARY")
total = passed + failed
print(f"  {BOLD}Total:  {total} tests{RESET}")
print(f"  {GREEN}Passed: {passed}{RESET}")
print(f"  {RED}Failed: {failed}{RESET}\n")
if failed == 0:
    print(f"  {GREEN}{BOLD}[OK] ALL REPORT TESTS PASSED!{RESET}")
else:
    print(f"  {RED}{BOLD}[X] {failed} test(s) failed.{RESET}")

sys.exit(0 if failed == 0 else 1)
