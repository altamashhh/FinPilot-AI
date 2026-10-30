import requests

BASE_URL = "http://127.0.0.1:8000"

r = requests.post(f"{BASE_URL}/auth/login",
                  json={"email": "testuser@finpilot.com", "password": "secure123"})
token = r.json()["access_token"]
AUTH = {"Authorization": f"Bearer {token}"}

txs = requests.get(f"{BASE_URL}/transactions/", headers=AUTH).json()
print(f"Transactions: {len(txs)}")

pdf_r = requests.get(f"{BASE_URL}/report/pdf", headers=AUTH)
pdf_bytes = pdf_r.content
print(f"PDF size: {len(pdf_bytes)} bytes ({len(pdf_bytes)/1024:.1f} KB)")
print(f"PDF is valid: {pdf_bytes[:4] == b'%PDF'}")

sections = [b"WealthAI", b"Financial Summary", b"Budget Summary", b"Transaction History", b"AI Financial"]
for s in sections:
    present = s in pdf_bytes
    status = "[OK]" if present else "[MISSING]"
    print(f"  {status} Section '{s.decode()}' present in PDF")

csv_r = requests.get(f"{BASE_URL}/report/csv", headers=AUTH)
lines = csv_r.text.strip().split("\n")
print(f"\nCSV rows: {len(lines)} (header + {len(lines)-1} transactions)")
print(f"CSV header: {lines[0].strip()}")
