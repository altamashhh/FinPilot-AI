"""
Agentic Financial Insights Engine
==================================
Analyzes user financial behavior and generates proactive alerts
and actionable recommendations.

Rules implemented:
  1. Budget Overspend Detection
  2. High Spending Category Detection
  3. Savings Rate Analysis
  4. Spending Trend Analysis (current vs previous month)
  5. Unusual Expense Detection (> 2x average)
"""

from collections import defaultdict
from datetime import date, timedelta
from typing import List

from sqlalchemy.orm import Session

from models.budget import Budget
from models.transaction import Transaction
from schemas.insights import (
    InsightAlert,
    InsightRecommendation,
    InsightsResponse,
    InsightSummary,
)


def _get_month_range(ref_date: date, offset: int = 0):
    """Return (first_day, last_day) for the month at `offset` months from ref_date."""
    month = ref_date.month + offset
    year = ref_date.year
    while month < 1:
        month += 12
        year -= 1
    while month > 12:
        month -= 12
        year += 1
    first_day = date(year, month, 1)
    # last day: first day of next month minus 1 day
    if month == 12:
        last_day = date(year + 1, 1, 1) - timedelta(days=1)
    else:
        last_day = date(year, month + 1, 1) - timedelta(days=1)
    return first_day, last_day


def generate_insights(db: Session, user_id: int, reference_date: date | None = None) -> InsightsResponse:
    """
    Generate financial insights for a user.

    Args:
        db: Database session.
        user_id: Authenticated user's ID.
        reference_date: Optional date to anchor month calculations
                        (defaults to today). Useful for testing.

    Returns:
        InsightsResponse with alerts, recommendations, and summary.
    """
    if reference_date is None:
        reference_date = date.today()

    alerts: List[InsightAlert] = []
    recommendations: List[InsightRecommendation] = []

    # ── Fetch ALL user transactions ────────────────────────────────
    all_transactions = (
        db.query(Transaction)
        .filter(Transaction.user_id == user_id)
        .all()
    )

    # ── Overall totals ─────────────────────────────────────────────
    total_income = 0.0
    total_expense = 0.0
    category_spending: dict[str, float] = defaultdict(float)
    expense_amounts: list[float] = []

    for tx in all_transactions:
        if tx.transaction_type == "income":
            total_income += abs(tx.amount)
        elif tx.transaction_type == "expense":
            amt = abs(tx.amount)
            total_expense += amt
            category_spending[tx.category] += amt
            expense_amounts.append(amt)

    savings = total_income - total_expense
    savings_rate = round(((total_income - total_expense) / total_income) * 100, 2) if total_income > 0 else 0.0
    avg_expense = round(sum(expense_amounts) / len(expense_amounts), 2) if expense_amounts else 0.0

    # Highest spending category
    highest_cat = ""
    if category_spending:
        highest_cat = max(category_spending, key=category_spending.get)

    # ── 1. Budget Overspend Detection ──────────────────────────────
    budgets = db.query(Budget).filter(Budget.user_id == user_id).all()
    for budget in budgets:
        spent = category_spending.get(budget.category, 0.0)
        if spent > budget.limit_amount:
            overspend = round(spent - budget.limit_amount, 2)
            alerts.append(InsightAlert(
                type="budget_overspend",
                severity="critical",
                message=f"{budget.category} budget exceeded by Rs.{overspend}",
            ))

    # ── 2. High Spending Category Detection ────────────────────────
    if highest_cat:
        recommendations.append(InsightRecommendation(
            type="spending",
            message=f"{highest_cat} is your highest spending category this month.",
        ))

    # ── 3. Savings Rate Analysis ───────────────────────────────────
    if total_income > 0:
        if savings_rate < 10:
            alerts.append(InsightAlert(
                type="low_savings",
                severity="critical",
                message="Your savings rate is critically low.",
            ))
        elif savings_rate <= 20:
            recommendations.append(InsightRecommendation(
                type="savings",
                message="Consider increasing monthly savings.",
            ))
        else:
            recommendations.append(InsightRecommendation(
                type="savings",
                message="Healthy savings rate.",
            ))

    # ── 4. Spending Trend Analysis (current vs previous month) ────
    cur_start, cur_end = _get_month_range(reference_date, offset=0)
    prev_start, prev_end = _get_month_range(reference_date, offset=-1)

    cur_month_cat: dict[str, float] = defaultdict(float)
    prev_month_cat: dict[str, float] = defaultdict(float)

    for tx in all_transactions:
        if tx.transaction_type != "expense":
            continue
        amt = abs(tx.amount)
        if cur_start <= tx.transaction_date <= cur_end:
            cur_month_cat[tx.category] += amt
        elif prev_start <= tx.transaction_date <= prev_end:
            prev_month_cat[tx.category] += amt

    # Compare categories present in both months
    for cat in set(cur_month_cat) | set(prev_month_cat):
        cur_val = cur_month_cat.get(cat, 0.0)
        prev_val = prev_month_cat.get(cat, 0.0)
        if prev_val > 0 and cur_val > prev_val:
            pct_increase = round(((cur_val - prev_val) / prev_val) * 100, 0)
            if pct_increase >= 10:
                recommendations.append(InsightRecommendation(
                    type="trend",
                    message=f"{cat} spending increased by {int(pct_increase)}%.",
                ))

    # ── 5. Unusual Expense Detection ──────────────────────────────
    if avg_expense > 0:
        threshold = 2 * avg_expense
        for tx in all_transactions:
            if tx.transaction_type == "expense" and abs(tx.amount) > threshold:
                alerts.append(InsightAlert(
                    type="unusual_expense",
                    severity="warning",
                    message=f"Large expense detected: Rs.{abs(tx.amount)}",
                ))

    # ── Build summary ─────────────────────────────────────────────
    summary = InsightSummary(
        total_income=round(total_income, 2),
        total_expense=round(total_expense, 2),
        savings=round(savings, 2),
        savings_rate=savings_rate,
        highest_spending_category=highest_cat,
        avg_transaction_amount=avg_expense,
        transaction_count=len(expense_amounts),
    )

    return InsightsResponse(
        alerts=alerts,
        recommendations=recommendations,
        summary=summary,
    )
