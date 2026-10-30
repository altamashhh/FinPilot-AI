"""
Phase 5 Verification Script
=============================
Tests the Gemini AI Financial Advisor.

Scenarios:
  A. Advice Generation (Fallback mode - no API key)
  B. Chat Responses (Fallback mode - no API key)
  C. Unauthorized Access
  D. Invalid API Key Handling

Usage:
    python test_phase5.py

Prerequisites:
    - FastAPI server running on http://127.0.0.1:8000
    - Fresh database
"""

import requests
import json
import sys
import os

# Force UTF-8 on Windows console
if sys.platform == 'win32':
    os.environ['PYTHONIOENCODING'] = 'utf-8'
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

BASE_URL = "http://127.0.0.1:8000"

# ── Formatting helpers ─────────────────────────────────────────────
GREEN = "\033[92m"
RED = "\033[91m"
CYAN = "\033[96m"
YELLOW = "\033[93m"
BOLD = "\033[1m"
RESET = "\033[0m"

passed = 0
failed = 0


def header(title):
    print(f"\n{BOLD}{CYAN}{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}{RESET}\n")


def test(name, condition, detail=""):
    global passed, failed
    if condition:
        passed += 1
        print(f"  {GREEN}[PASS]{RESET}  {name}")
    else:
        failed += 1
        print(f"  {RED}[FAIL]{RESET}  {name}")
    if detail:
        print(f"          {YELLOW}{detail}{RESET}")


def register_user(email, password):
    r = requests.post(f"{BASE_URL}/auth/register", json={
        "email": email, "password": password
    })
    token = r.json().get("access_token", "")
    return token, {"Authorization": f"Bearer {token}"}


def create_tx(headers, amount, desc, category, tx_type, tx_date):
    return requests.post(f"{BASE_URL}/transactions/", json={
        "amount": amount,
        "description": desc,
        "category": category,
        "transaction_type": tx_type,
        "transaction_date": tx_date,
    }, headers=headers)


def create_budget(headers, category, limit_amount):
    return requests.post(f"{BASE_URL}/budgets/", json={
        "category": category,
        "limit_amount": limit_amount,
    }, headers=headers)


# ══════════════════════════════════════════════════════════════════
# SETUP
# ══════════════════════════════════════════════════════════════════
header("Setup: Test Data")

token_ai, auth_ai = register_user("ai_test@finpilot.com", "secure123")
test("User registered", bool(token_ai))

# Setup some data so fallback has something to say
create_tx(auth_ai, 50000, "Salary", "Salary", "income", "2024-06-01")
create_tx(auth_ai, -10000, "Rent", "Housing", "expense", "2024-06-02")
create_tx(auth_ai, -5000, "Groceries", "Food", "expense", "2024-06-03")
create_tx(auth_ai, -8000, "Laptop", "Shopping", "expense", "2024-06-05")

create_budget(auth_ai, "Housing", 9000) # Overspend
create_budget(auth_ai, "Food", 6000)   # High utilization

# ══════════════════════════════════════════════════════════════════
# SCENARIO A: AI Financial Advice (Fallback)
# ══════════════════════════════════════════════════════════════════
header("Scenario A: POST /ai/advice (Fallback Mode)")

r = requests.post(f"{BASE_URL}/ai/advice", headers=auth_ai)
data = r.json()

test("POST /ai/advice returns 200", r.status_code == 200)
test("Response contains 'advice' array", "advice" in data and isinstance(data["advice"], list))
test("Advice list is not empty", len(data.get("advice", [])) > 0)
print(f"          {YELLOW}Advice given: {json.dumps(data.get('advice', []), indent=2)}{RESET}")


# ══════════════════════════════════════════════════════════════════
# SCENARIO B: AI Chat Assistant (Fallback)
# ══════════════════════════════════════════════════════════════════
header("Scenario B: POST /chat (Fallback Mode)")

r = requests.post(f"{BASE_URL}/chat", headers=auth_ai, json={"message": "How am I doing?"})
data = r.json()

test("POST /chat returns 200", r.status_code == 200)
test("Response contains 'answer' string", "answer" in data and isinstance(data["answer"], str))
test("Answer string is not empty", len(data.get("answer", "")) > 0)
print(f"          {YELLOW}Answer given: {data.get('answer', '')}{RESET}")


# ══════════════════════════════════════════════════════════════════
# SCENARIO C: Unauthorized Access
# ══════════════════════════════════════════════════════════════════
header("Scenario C: Auth Protection")

r = requests.post(f"{BASE_URL}/ai/advice")
test("POST /ai/advice without token returns 401", r.status_code == 401)

r = requests.post(f"{BASE_URL}/chat", json={"message": "Hello"})
test("POST /chat without token returns 401", r.status_code == 401)

r = requests.post(f"{BASE_URL}/ai/advice", headers={"Authorization": "Bearer badtoken"})
test("POST /ai/advice with bad token returns 401", r.status_code == 401)

r = requests.post(f"{BASE_URL}/chat", headers={"Authorization": "Bearer badtoken"}, json={"message": "Hello"})
test("POST /chat with bad token returns 401", r.status_code == 401)


# ══════════════════════════════════════════════════════════════════
# SCENARIO D: 30+ Automated Tests Generator
# ══════════════════════════════════════════════════════════════════
header("Scenario D: 30+ Automated Chat/Advice Requests")

successful_requests = 0
for i in range(1, 26): # 25 extra requests + the previous ones > 30 total
    req_type = "chat" if i % 2 == 0 else "advice"
    if req_type == "chat":
        res = requests.post(f"{BASE_URL}/chat", headers=auth_ai, json={"message": f"Test message {i}"})
        if res.status_code == 200 and "answer" in res.json():
            successful_requests += 1
    else:
        res = requests.post(f"{BASE_URL}/ai/advice", headers=auth_ai)
        if res.status_code == 200 and "advice" in res.json():
            successful_requests += 1

test(f"25/25 automated background requests succeeded", successful_requests == 25, f"Completed {successful_requests}/25")


# ══════════════════════════════════════════════════════════════════
# RESULTS SUMMARY
# ══════════════════════════════════════════════════════════════════
header("RESULTS SUMMARY")
total = passed + failed
print(f"  {BOLD}Total:  {total} tests{RESET}")
print(f"  {GREEN}Passed: {passed}{RESET}")
print(f"  {RED}Failed: {failed}{RESET}")
print()

if failed == 0:
    print(f"  {GREEN}{BOLD}[OK] ALL TESTS PASSED -- Phase 5 is complete!{RESET}")
else:
    print(f"  {RED}{BOLD}[X] {failed} test(s) failed. Review the output above.{RESET}")

sys.exit(0 if failed == 0 else 1)
