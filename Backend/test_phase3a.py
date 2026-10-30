"""
Phase 3A Verification Script
=============================
Tests JWT Authentication + Dashboard Analytics end-to-end.

Usage:
    python test_phase3a.py

Prerequisites:
    - FastAPI server running on http://127.0.0.1:8000
    - Fresh database (run: del finance.db before starting server)
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


# ══════════════════════════════════════════════════════════════════
# 1. HEALTH CHECK
# ══════════════════════════════════════════════════════════════════
header("1. Health Check")
r = requests.get(f"{BASE_URL}/")
test("GET / returns 200", r.status_code == 200)
test("Response contains 'healthy'", r.json().get("status") == "healthy")

# ══════════════════════════════════════════════════════════════════
# 2. REGISTRATION
# ══════════════════════════════════════════════════════════════════
header("2. User Registration")

# Register new user
r = requests.post(f"{BASE_URL}/auth/register", json={
    "email": "testuser@finpilot.com",
    "password": "secure123"
})
test("POST /auth/register returns 201", r.status_code == 201, f"status={r.status_code}")
reg_data = r.json()
test("Response contains access_token", "access_token" in reg_data)
test("token_type is 'bearer'", reg_data.get("token_type") == "bearer")

# Duplicate registration should fail
r = requests.post(f"{BASE_URL}/auth/register", json={
    "email": "testuser@finpilot.com",
    "password": "secure123"
})
test("Duplicate registration returns 400", r.status_code == 400)

# ══════════════════════════════════════════════════════════════════
# 3. LOGIN
# ══════════════════════════════════════════════════════════════════
header("3. User Login")

# Valid login
r = requests.post(f"{BASE_URL}/auth/login", json={
    "email": "testuser@finpilot.com",
    "password": "secure123"
})
test("POST /auth/login returns 200", r.status_code == 200)
login_data = r.json()
TOKEN = login_data.get("access_token", "")
test("Response contains access_token", bool(TOKEN))

# Invalid password
r = requests.post(f"{BASE_URL}/auth/login", json={
    "email": "testuser@finpilot.com",
    "password": "wrongpassword"
})
test("Wrong password returns 401", r.status_code == 401)

# Non-existent user
r = requests.post(f"{BASE_URL}/auth/login", json={
    "email": "nobody@example.com",
    "password": "whatever"
})
test("Non-existent user returns 401", r.status_code == 401)

# ══════════════════════════════════════════════════════════════════
# 4. GET /auth/me (Protected)
# ══════════════════════════════════════════════════════════════════
header("4. GET /auth/me (Protected Endpoint)")

AUTH = {"Authorization": f"Bearer {TOKEN}"}

r = requests.get(f"{BASE_URL}/auth/me", headers=AUTH)
test("GET /auth/me returns 200", r.status_code == 200)
me_data = r.json()
test("Returns correct email", me_data.get("email") == "testuser@finpilot.com")
test("Returns user id", "id" in me_data)

# Without token
r = requests.get(f"{BASE_URL}/auth/me")
test("Without token returns 401", r.status_code == 401)

# With bad token
r = requests.get(f"{BASE_URL}/auth/me", headers={"Authorization": "Bearer invalidtoken"})
test("Invalid token returns 401", r.status_code == 401)

# ══════════════════════════════════════════════════════════════════
# 5. PROTECTED TRANSACTIONS
# ══════════════════════════════════════════════════════════════════
header("5. Protected Transaction Endpoints")

# Without auth
r = requests.get(f"{BASE_URL}/transactions/")
test("GET /transactions without token returns 401", r.status_code == 401)

# Create sample transactions with auth
sample_transactions = [
    {"amount": 5000, "description": "Salary June", "category": "Salary", "transaction_type": "income", "transaction_date": "2024-06-01"},
    {"amount": 1200, "description": "Freelance Project", "category": "Freelance", "transaction_type": "income", "transaction_date": "2024-06-05"},
    {"amount": -800, "description": "Rent Payment", "category": "Housing", "transaction_type": "expense", "transaction_date": "2024-06-02"},
    {"amount": -350, "description": "Grocery Shopping", "category": "Food & Dining", "transaction_type": "expense", "transaction_date": "2024-06-03"},
    {"amount": -150, "description": "Electric Bill", "category": "Bills", "transaction_type": "expense", "transaction_date": "2024-06-04"},
    {"amount": -200, "description": "Restaurant Dinner", "category": "Food & Dining", "transaction_type": "expense", "transaction_date": "2024-06-06"},
    {"amount": -100, "description": "Gas Station", "category": "Travel & Transport", "transaction_type": "expense", "transaction_date": "2024-06-07"},
    {"amount": -250, "description": "Online Shopping", "category": "Shopping", "transaction_type": "expense", "transaction_date": "2024-06-08"},
    {"amount": -75, "description": "Movie Tickets", "category": "Entertainment", "transaction_type": "expense", "transaction_date": "2024-06-09"},
]

created_count = 0
for tx in sample_transactions:
    r = requests.post(f"{BASE_URL}/transactions/", json=tx, headers=AUTH)
    if r.status_code == 201:
        created_count += 1

test(f"Created {created_count}/{len(sample_transactions)} transactions", created_count == len(sample_transactions))

# Verify transactions returned with auth
r = requests.get(f"{BASE_URL}/transactions/", headers=AUTH)
test("GET /transactions with token returns 200", r.status_code == 200)
test(f"Returns {len(r.json())} transactions", len(r.json()) == len(sample_transactions))

# ══════════════════════════════════════════════════════════════════
# 6. PROTECTED BUDGETS
# ══════════════════════════════════════════════════════════════════
header("6. Protected Budget Endpoints")

# Without auth
r = requests.get(f"{BASE_URL}/budgets/")
test("GET /budgets without token returns 401", r.status_code == 401)

# Create sample budgets with auth
sample_budgets = [
    {"category": "Housing", "limit_amount": 1000},
    {"category": "Food & Dining", "limit_amount": 600},
    {"category": "Travel & Transport", "limit_amount": 300},
    {"category": "Shopping", "limit_amount": 400},
    {"category": "Entertainment", "limit_amount": 150},
]

budget_count = 0
for b in sample_budgets:
    r = requests.post(f"{BASE_URL}/budgets/", json=b, headers=AUTH)
    if r.status_code == 201:
        budget_count += 1

test(f"Created {budget_count}/{len(sample_budgets)} budgets", budget_count == len(sample_budgets))

# ══════════════════════════════════════════════════════════════════
# 7. DASHBOARD ANALYTICS
# ══════════════════════════════════════════════════════════════════
header("7. Dashboard Analytics")

# Without auth
r = requests.get(f"{BASE_URL}/dashboard/")
test("GET /dashboard without token returns 401", r.status_code == 401)

# With auth
r = requests.get(f"{BASE_URL}/dashboard/", headers=AUTH)
test("GET /dashboard with token returns 200", r.status_code == 200)
dashboard = r.json()

# Expected values based on sample data:
# Income: 5000 + 1200 = 6200
# Expenses: 800 + 350 + 150 + 200 + 100 + 250 + 75 = 1925
# Savings: 6200 - 1925 = 4275
# Food & Dining: 350 + 200 = 550 (highest)
# Housing: 800
# But Housing = 800 > Food & Dining = 550, so Housing is highest

expected_income = 6200.0
expected_expense = 1925.0
expected_savings = 4275.0

test(f"total_income = {dashboard.get('total_income')} (expected {expected_income})",
     dashboard.get("total_income") == expected_income,
     f"actual={dashboard.get('total_income')}")

test(f"total_expense = {dashboard.get('total_expense')} (expected {expected_expense})",
     dashboard.get("total_expense") == expected_expense,
     f"actual={dashboard.get('total_expense')}")

test(f"savings = {dashboard.get('savings')} (expected {expected_savings})",
     dashboard.get("savings") == expected_savings,
     f"actual={dashboard.get('savings')}")

test("highest_spending_category is 'Housing'",
     dashboard.get("highest_spending_category") == "Housing",
     f"actual={dashboard.get('highest_spending_category')}")

test("category_spending is a non-empty list",
     isinstance(dashboard.get("category_spending"), list) and len(dashboard.get("category_spending", [])) > 0,
     f"count={len(dashboard.get('category_spending', []))}")

test("budget_utilization is a non-empty list",
     isinstance(dashboard.get("budget_utilization"), list) and len(dashboard.get("budget_utilization", [])) > 0,
     f"count={len(dashboard.get('budget_utilization', []))}")

# Verify budget utilization calculations
# Housing budget: limit=1000, spent=800, usage=80%
# Food & Dining: limit=600, spent=550, usage=91.67%
bu = {item["category"]: item for item in dashboard.get("budget_utilization", [])}

if "Housing" in bu:
    test(f"Housing budget: spent={bu['Housing']['spent']}, usage={bu['Housing']['usage_percentage']}%",
         bu["Housing"]["spent"] == 800.0 and bu["Housing"]["usage_percentage"] == 80.0)

if "Food & Dining" in bu:
    test(f"Food & Dining budget: spent={bu['Food & Dining']['spent']}, usage={bu['Food & Dining']['usage_percentage']}%",
         bu["Food & Dining"]["spent"] == 550.0 and bu["Food & Dining"]["usage_percentage"] == 91.67)

# ══════════════════════════════════════════════════════════════════
# 8. USER DATA ISOLATION
# ══════════════════════════════════════════════════════════════════
header("8. User Data Isolation")

# Register a second user
r = requests.post(f"{BASE_URL}/auth/register", json={
    "email": "user2@finpilot.com",
    "password": "password456"
})
test("Registered second user", r.status_code == 201)
TOKEN2 = r.json().get("access_token", "")

# Second user should see zero data
r = requests.get(f"{BASE_URL}/transactions/", headers={"Authorization": f"Bearer {TOKEN2}"})
test("User2 sees 0 transactions", r.status_code == 200 and len(r.json()) == 0)

r = requests.get(f"{BASE_URL}/budgets/", headers={"Authorization": f"Bearer {TOKEN2}"})
test("User2 sees 0 budgets", r.status_code == 200 and len(r.json()) == 0)

r = requests.get(f"{BASE_URL}/dashboard/", headers={"Authorization": f"Bearer {TOKEN2}"})
d2 = r.json()
test("User2 dashboard shows zero totals",
     d2.get("total_income") == 0.0 and d2.get("total_expense") == 0.0 and d2.get("savings") == 0.0)

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
    print(f"  {GREEN}{BOLD}[OK] ALL TESTS PASSED -- Phase 3A is complete!{RESET}")
else:
    print(f"  {RED}{BOLD}[X] {failed} test(s) failed. Review the output above.{RESET}")
    
print(f"\n{BOLD}Full Dashboard Response:{RESET}")
print(json.dumps(dashboard, indent=2))

sys.exit(0 if failed == 0 else 1)
