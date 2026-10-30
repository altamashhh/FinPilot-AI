"""
Gemini AI Financial Advisor
============================
Uses the Google Gemini API to generate personalised financial advice
and contextual chat answers based on the user's transactions, budgets,
dashboard analytics, and insights.

Includes a graceful fallback when the Gemini API key is missing or
the API call fails.
"""

import json
import os
import re
from typing import List

from sqlalchemy.orm import Session

from services.dashboard import get_dashboard
from services.insights import generate_insights
from models.transaction import Transaction
from models.budget import Budget


# ── Gemini client (lazy-initialised) ──────────────────────────────

def _get_gemini_client():
    """
    Return a configured google.genai.Client, or None if the API key
    is not set or is invalid.
    """
    api_key = os.environ.get("GEMINI_API_KEY", "").strip()
    if not api_key:
        print("ERROR: GEMINI_API_KEY is not set in .env — AI will use fallback responses.")
        return None
    # Google Gemini API keys always start with 'AIza'
    if not api_key.startswith("AIza"):
        print(
            f"ERROR: GEMINI_API_KEY looks invalid (starts with '{api_key[:6]}...', expected 'AIza...'). "
            "Please replace it with a real key from https://aistudio.google.com/app/apikey"
        )
        return None
    try:
        from google import genai
        client = genai.Client(api_key=api_key)
        return client
    except Exception as e:
        print(f"ERROR: Failed to initialise Gemini client: {e}")
        return None


def _call_gemini(prompt: str) -> str | None:
    """
    Send a prompt to Gemini and return the text response,
    or None on failure.
    """
    client = _get_gemini_client()
    if client is None:
        print("WARNING: Gemini client not initialised (GEMINI_API_KEY missing?). Using fallback.")
        return None
    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
        )
        return response.text
    except Exception as e:
        print(f"WARNING: Gemini API call failed ({type(e).__name__}: {e}). Using fallback.")
        return None


# ── Context builder ───────────────────────────────────────────────

def _build_financial_context(db: Session, user_id: int) -> str:
    """
    Aggregate the user's financial data into a single structured
    text block suitable for injection into an LLM prompt.
    """
    # Dashboard analytics
    dashboard = get_dashboard(db, user_id)
    # Insights
    insights = generate_insights(db, user_id)

    # Recent transactions (last 20)
    recent_txs = (
        db.query(Transaction)
        .filter(Transaction.user_id == user_id)
        .order_by(Transaction.transaction_date.desc())
        .limit(20)
        .all()
    )
    tx_lines = []
    for tx in recent_txs:
        tx_lines.append(
            f"  - {tx.transaction_date} | {tx.transaction_type} | "
            f"{tx.category} | Rs.{abs(tx.amount)} | {tx.description}"
        )

    # Budgets
    budgets = db.query(Budget).filter(Budget.user_id == user_id).all()
    budget_lines = [f"  - {b.category}: Rs.{b.limit_amount}" for b in budgets]

    # Alerts
    alert_lines = [f"  - [{a.severity.upper()}] {a.message}" for a in insights.alerts]

    # Recommendations from insights engine
    rec_lines = [f"  - {r.message}" for r in insights.recommendations]

    context = f"""
=== USER FINANCIAL PROFILE ===

SUMMARY:
  Total Income:  Rs.{dashboard.total_income}
  Total Expense: Rs.{dashboard.total_expense}
  Net Savings:   Rs.{dashboard.savings}
  Savings Rate:  {insights.summary.savings_rate}%
  Highest Spending Category: {dashboard.highest_spending_category}

CATEGORY SPENDING:
{chr(10).join(f'  - {cs.category}: Rs.{cs.total_spent}' for cs in dashboard.category_spending)}

BUDGETS:
{chr(10).join(budget_lines) if budget_lines else '  (none set)'}

BUDGET UTILIZATION:
{chr(10).join(f'  - {bu.category}: Rs.{bu.spent} / Rs.{bu.limit_amount} ({bu.usage_percentage}%)' for bu in dashboard.budget_utilization)}

ALERTS:
{chr(10).join(alert_lines) if alert_lines else '  (none)'}

INSIGHTS ENGINE RECOMMENDATIONS:
{chr(10).join(rec_lines) if rec_lines else '  (none)'}

RECENT TRANSACTIONS (up to 20):
{chr(10).join(tx_lines) if tx_lines else '  (none)'}
"""
    return context.strip()


# ── Fallback responses ────────────────────────────────────────────

def _fallback_advice(db: Session, user_id: int) -> List[str]:
    """
    Generate rule-based advice when Gemini is unavailable.
    Uses the insights engine and dashboard data.
    """
    insights = generate_insights(db, user_id)
    dashboard = get_dashboard(db, user_id)
    advice: List[str] = []

    # Budget overspend
    for alert in insights.alerts:
        if alert.type == "budget_overspend":
            advice.append(f"Alert: {alert.message}. Consider reducing spending in this category.")
        elif alert.type == "unusual_expense":
            advice.append(f"Alert: {alert.message}. Review if this was necessary.")
        elif alert.type == "low_savings":
            advice.append("Your savings rate is critically low. Aim to save at least 20% of your income.")

    # Savings recommendations
    for rec in insights.recommendations:
        if rec.type == "savings":
            advice.append(rec.message)
        elif rec.type == "spending":
            advice.append(rec.message)

    # Budget utilization
    for bu in dashboard.budget_utilization:
        if bu.usage_percentage > 90:
            advice.append(
                f"{bu.category} spending is at {bu.usage_percentage}% of budget. "
                f"Consider reducing expenses here."
            )

    if not advice:
        advice.append("Your finances look healthy! Keep up the good work.")

    return advice


def _fallback_chat(question: str, db: Session, user_id: int) -> str:
    """
    Generate a rule-based chat answer when Gemini is unavailable.
    Analyses keywords in the user's question to return a relevant response.
    """
    dashboard = get_dashboard(db, user_id)
    insights = generate_insights(db, user_id)

    q = question.lower()

    # ── Savings / savings rate ────────────────────────────────────
    if any(kw in q for kw in ["saving", "savings", "save", "savings rate", "savings goal"]):
        savings_rate = insights.summary.savings_rate
        tip = ""
        if savings_rate < 10:
            tip = " This is critically low — aim for at least 20%."
        elif savings_rate < 20:
            tip = " Try to push this above 20% by trimming discretionary spending."
        else:
            tip = " Great job! Keep it up and consider investing the surplus."
        return (
            f"Your current savings are Rs.{dashboard.savings} "
            f"({savings_rate}% of income).{tip}"
        )

    # ── Spending / expenses ───────────────────────────────────────
    if any(kw in q for kw in ["spend", "spending", "expense", "expenses", "cost", "costs", "budget"]):
        cat_lines = ", ".join(
            f"{cs.category}: Rs.{cs.total_spent}"
            for cs in dashboard.category_spending[:5]
        )
        return (
            f"Your total expenses are Rs.{dashboard.total_expense}. "
            f"Top spending categories: {cat_lines}. "
            f"Your highest category is {dashboard.highest_spending_category}."
        )

    # ── Income ───────────────────────────────────────────────────
    if any(kw in q for kw in ["income", "earn", "salary", "revenue"]):
        return (
            f"Your recorded income is Rs.{dashboard.total_income}. "
            f"After expenses of Rs.{dashboard.total_expense}, "
            f"you have Rs.{dashboard.savings} remaining (savings rate: {insights.summary.savings_rate}%)."
        )

    # ── Budget utilization ────────────────────────────────────────
    if any(kw in q for kw in ["budget", "limit", "over budget", "overspent"]):
        over = [
            bu for bu in dashboard.budget_utilization if bu.usage_percentage > 100
        ]
        near = [
            bu for bu in dashboard.budget_utilization
            if 80 <= bu.usage_percentage <= 100
        ]
        lines = []
        if over:
            lines.append("Over budget: " + ", ".join(f"{b.category} ({b.usage_percentage}%)" for b in over))
        if near:
            lines.append("Near limit: " + ", ".join(f"{b.category} ({b.usage_percentage}%)" for b in near))
        if not lines:
            lines.append("All your budgets are within limits. Great discipline!")
        return " | ".join(lines)

    # ── Alerts / warnings ────────────────────────────────────────
    if any(kw in q for kw in ["alert", "warning", "issue", "problem", "risk"]):
        alert_msgs = [a.message for a in insights.alerts]
        if alert_msgs:
            return "Active alerts: " + " | ".join(alert_msgs)
        return "No active alerts — your finances look healthy!"

    # ── Recommendations ───────────────────────────────────────────
    if any(kw in q for kw in ["recommend", "advice", "suggest", "tip", "improve", "how to"]):
        recs = [r.message for r in insights.recommendations[:3]]
        if recs:
            return "Recommendations: " + " | ".join(recs)
        return "Your finances look healthy! No specific recommendations at the moment."

    # ── Summary / overview ────────────────────────────────────────
    if any(kw in q for kw in ["summary", "overview", "report", "total", "overall"]):
        return (
            f"Financial summary — Income: Rs.{dashboard.total_income} | "
            f"Expenses: Rs.{dashboard.total_expense} | "
            f"Savings: Rs.{dashboard.savings} ({insights.summary.savings_rate}%) | "
            f"Top category: {dashboard.highest_spending_category}."
        )

    # ── Generic fallback (still uses question context) ────────────
    parts = [
        f"Regarding your question about '{question}': "
        f"You have Rs.{dashboard.total_income} income, "
        f"Rs.{dashboard.total_expense} expenses, and Rs.{dashboard.savings} saved "
        f"(savings rate: {insights.summary.savings_rate}%)."
    ]
    if dashboard.highest_spending_category:
        parts.append(f"Your highest spending category is {dashboard.highest_spending_category}.")
    active_alerts = [a.message for a in insights.alerts]
    if active_alerts:
        parts.append("Active alerts: " + "; ".join(active_alerts[:2]))
    return " ".join(parts)


# ── Public API ────────────────────────────────────────────────────

def get_ai_advice(db: Session, user_id: int) -> List[str]:
    """
    Generate personalised financial advice using Gemini,
    or fall back to rule-based advice if unavailable.
    """
    context = _build_financial_context(db, user_id)

    prompt = f"""You are an expert personal finance advisor. Analyze the following 
user financial data and provide 5-7 specific, actionable pieces of financial advice.

Each piece of advice should be a single concise sentence.
Return ONLY a JSON array of strings. No markdown, no extra text.

Example output:
["Reduce food spending by 15%", "Set up an emergency fund of Rs.50000"]

{context}

Return ONLY the JSON array:"""

    raw = _call_gemini(prompt)
    if raw:
        advice = _parse_advice_list(raw)
        if advice:
            return advice

    # Fallback
    return _fallback_advice(db, user_id)


def get_chat_response(db: Session, user_id: int, message: str) -> str:
    """
    Answer a user's financial question using Gemini with full context,
    or fall back to rule-based response if unavailable.
    """
    context = _build_financial_context(db, user_id)

    prompt = f"""You are a friendly and knowledgeable personal finance assistant.
The user is asking a question about their finances. Use the financial data below
to give a specific, helpful, and concise answer.

{context}

User's question: {message}

Provide a clear, helpful answer in 2-4 sentences:"""

    raw = _call_gemini(prompt)
    if raw and raw.strip():
        return raw.strip()

    # Fallback
    return _fallback_chat(message, db, user_id)


# ── Helpers ───────────────────────────────────────────────────────

def _parse_advice_list(raw: str) -> List[str]:
    """
    Parse the Gemini response into a list of advice strings.
    Handles JSON arrays and also plain numbered/bulleted lists.
    """
    raw = raw.strip()

    # Try JSON parse first
    # Strip markdown code fences if present
    cleaned = re.sub(r'^```(?:json)?\s*', '', raw)
    cleaned = re.sub(r'\s*```$', '', cleaned)
    cleaned = cleaned.strip()

    try:
        parsed = json.loads(cleaned)
        if isinstance(parsed, list) and all(isinstance(s, str) for s in parsed):
            return [s.strip() for s in parsed if s.strip()]
    except (json.JSONDecodeError, TypeError):
        pass

    # Fallback: split by newlines and clean up numbered/bulleted items
    lines = raw.split('\n')
    advice = []
    for line in lines:
        line = line.strip()
        # Remove leading numbers, bullets, dashes
        line = re.sub(r'^[\d]+[.)]\s*', '', line)
        line = re.sub(r'^[-*]\s*', '', line)
        line = line.strip('"').strip()
        if line and len(line) > 5:
            advice.append(line)

    return advice if advice else []
