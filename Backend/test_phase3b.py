"""
Phase 3B Verification Script
=============================
Tests Transaction Auto-Categorization Engine.

Usage:
    python test_phase3b.py

Prerequisites:
    - FastAPI server running on http://127.0.0.1:8000
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
# 0. SETUP — Register & login to get a token
# ══════════════════════════════════════════════════════════════════
header("0. Setup - Get Auth Token")

r = requests.post(f"{BASE_URL}/auth/register", json={
    "email": "cattest@finpilot.com",
    "password": "testpass123"
})
if r.status_code == 201:
    TOKEN = r.json()["access_token"]
    test("Registered test user", True)
else:
    # Already exists, login instead
    r = requests.post(f"{BASE_URL}/auth/login", json={
        "email": "cattest@finpilot.com",
        "password": "testpass123"
    })
    TOKEN = r.json()["access_token"]
    test("Logged in as existing test user", r.status_code == 200)

AUTH = {"Authorization": f"Bearer {TOKEN}"}

# ══════════════════════════════════════════════════════════════════
# 1. AUTO-CATEGORIZE ENDPOINT (20+ examples)
# ══════════════════════════════════════════════════════════════════
header("1. POST /transactions/auto-categorize (25 examples)")

categorize_tests = [
    # Food (6)
    ("Swiggy Order #12345", "Food"),
    ("Zomato Gold Dinner", "Food"),
    ("The Italian Restaurant", "Food"),
    ("Starbucks Cafe Latte", "Food"),
    ("Domino's Pizza Delivery", "Food"),
    ("McDonald's Burger Combo", "Food"),

    # Travel (6)
    ("Uber ride to Airport", "Travel"),
    ("Ola Auto Rickshaw", "Travel"),
    ("HP Fuel Station - Petrol", "Travel"),
    ("Indian Oil Diesel Refill", "Travel"),
    ("Delhi Metro Card Recharge", "Travel"),
    ("Shell Fuel Station", "Travel"),

    # Shopping (4)
    ("Amazon.in - Wireless Earbuds", "Shopping"),
    ("Flipkart - Running Shoes", "Shopping"),
    ("Myntra Fashion Sale", "Shopping"),
    ("Reliance Digital - Laptop", "Shopping"),

    # Bills (5)
    ("Electricity Bill - BSES", "Bills"),
    ("Water Supply Board", "Bills"),
    ("Indane Gas Cylinder", "Bills"),
    ("Airtel Internet Plan", "Bills"),
    ("Jio Mobile Recharge", "Bills"),

    # Income (3)
    ("Monthly Salary - TechCorp", "Income"),
    ("Q3 Performance Bonus", "Income"),
    ("Freelance Web Development", "Income"),

    # Others / Fallback (1)
    ("ATM Cash Withdrawal", "Others"),
]

for description, expected in categorize_tests:
    r = requests.post(f"{BASE_URL}/transactions/auto-categorize",
                      json={"description": description}, headers=AUTH)
    actual = r.json().get("category", "")
    test(f'"{description}" -> {actual}',
         r.status_code == 200 and actual == expected,
         f"expected={expected}, got={actual}" if actual != expected else "")

# ══════════════════════════════════════════════════════════════════
# 2. AUTO-CATEGORIZE INTEGRATION (create without category)
# ══════════════════════════════════════════════════════════════════
header("2. Transaction Creation - Auto-Categorization Integration")

# Create transaction WITHOUT category — should auto-detect
auto_tests = [
    {
        "payload": {
            "amount": -250,
            "description": "Swiggy weekend order",
            "transaction_type": "expense",
            "transaction_date": "2024-06-15"
        },
        "expected_category": "Food"
    },
    {
        "payload": {
            "amount": -500,
            "description": "Uber ride to office",
            "transaction_type": "expense",
            "transaction_date": "2024-06-15"
        },
        "expected_category": "Travel"
    },
    {
        "payload": {
            "amount": -1200,
            "description": "Amazon electronics purchase",
            "transaction_type": "expense",
            "transaction_date": "2024-06-15"
        },
        "expected_category": "Shopping"
    },
    {
        "payload": {
            "amount": -800,
            "description": "Electricity bill payment",
            "transaction_type": "expense",
            "transaction_date": "2024-06-15"
        },
        "expected_category": "Bills"
    },
    {
        "payload": {
            "amount": 50000,
            "description": "Monthly Salary deposit",
            "transaction_type": "income",
            "transaction_date": "2024-06-15"
        },
        "expected_category": "Income"
    },
    {
        "payload": {
            "amount": -300,
            "description": "Gift for friend birthday",
            "transaction_type": "expense",
            "transaction_date": "2024-06-15"
        },
        "expected_category": "Others"
    },
]

for t in auto_tests:
    r = requests.post(f"{BASE_URL}/transactions/", json=t["payload"], headers=AUTH)
    actual_cat = r.json().get("category", "")
    test(f'No category provided: "{t["payload"]["description"]}" -> {actual_cat}',
         r.status_code == 201 and actual_cat == t["expected_category"],
         f"expected={t['expected_category']}, got={actual_cat}" if actual_cat != t["expected_category"] else "")

# ══════════════════════════════════════════════════════════════════
# 3. EXPLICIT CATEGORY PRESERVED
# ══════════════════════════════════════════════════════════════════
header("3. Explicit Category Preserved (Not Overwritten)")

r = requests.post(f"{BASE_URL}/transactions/", json={
    "amount": -100,
    "description": "Swiggy lunch order",
    "category": "Custom Category",
    "transaction_type": "expense",
    "transaction_date": "2024-06-15"
}, headers=AUTH)
actual = r.json().get("category", "")
test(f'Explicit category preserved: "Swiggy lunch order" -> {actual}',
     r.status_code == 201 and actual == "Custom Category",
     f"expected=Custom Category, got={actual}" if actual != "Custom Category" else "")

# ══════════════════════════════════════════════════════════════════
# 4. EMPTY CATEGORY STRING TRIGGERS AUTO-DETECT
# ══════════════════════════════════════════════════════════════════
header("4. Empty Category String Triggers Auto-Detect")

r = requests.post(f"{BASE_URL}/transactions/", json={
    "amount": -75,
    "description": "Flipkart shoes order",
    "category": "",
    "transaction_type": "expense",
    "transaction_date": "2024-06-15"
}, headers=AUTH)
actual = r.json().get("category", "")
test(f'Empty string category: "Flipkart shoes order" -> {actual}',
     r.status_code == 201 and actual == "Shopping",
     f"expected=Shopping, got={actual}" if actual != "Shopping" else "")

# ══════════════════════════════════════════════════════════════════
# 5. ENDPOINT AUTH PROTECTION
# ══════════════════════════════════════════════════════════════════
header("5. Auto-Categorize Endpoint Auth Protection")

r = requests.post(f"{BASE_URL}/transactions/auto-categorize",
                  json={"description": "Swiggy Order"})
test("Without token returns 401", r.status_code == 401)

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
    print(f"  {GREEN}{BOLD}[OK] ALL TESTS PASSED -- Phase 3B is complete!{RESET}")
else:
    print(f"  {RED}{BOLD}[X] {failed} test(s) failed. Review the output above.{RESET}")

sys.exit(0 if failed == 0 else 1)
