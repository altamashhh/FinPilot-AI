from sqlalchemy.orm import Session
from sqlalchemy import func as sql_func
from collections import defaultdict

from models.transaction import Transaction
from models.budget import Budget
from schemas.dashboard import DashboardResponse, CategorySpending, BudgetUtilization


def get_dashboard(db: Session, user_id: int) -> DashboardResponse:
    """
    Calculate and return all dashboard analytics for the authenticated user.

    Computes:
      - Total income (sum of all income transactions)
      - Total expenses (absolute sum of all expense transactions)
      - Net savings (income - expenses)
      - Per-category expense breakdown
      - Budget utilization percentages
      - Highest spending category
    """
    # ── Fetch all user transactions ────────────────────────────────
    transactions = (
        db.query(Transaction)
        .filter(Transaction.user_id == user_id)
        .all()
    )

    # ── Calculate totals ───────────────────────────────────────────
    total_income = 0.0
    total_expense = 0.0
    category_totals: dict[str, float] = defaultdict(float)

    for tx in transactions:
        if tx.transaction_type == "income":
            total_income += abs(tx.amount)
        elif tx.transaction_type == "expense":
            total_expense += abs(tx.amount)
            category_totals[tx.category] += abs(tx.amount)

    savings = total_income - total_expense

    # ── Category spending breakdown ────────────────────────────────
    category_spending = [
        CategorySpending(category=cat, total_spent=round(spent, 2))
        for cat, spent in sorted(category_totals.items(), key=lambda x: x[1], reverse=True)
    ]

    # ── Highest spending category ──────────────────────────────────
    highest_spending_category = ""
    if category_totals:
        highest_spending_category = max(category_totals, key=category_totals.get)

    # ── Budget utilization ─────────────────────────────────────────
    budgets = db.query(Budget).filter(Budget.user_id == user_id).all()
    budget_utilization = []
    for budget in budgets:
        spent = category_totals.get(budget.category, 0.0)
        usage_pct = round((spent / budget.limit_amount) * 100, 2) if budget.limit_amount > 0 else 0.0
        budget_utilization.append(
            BudgetUtilization(
                category=budget.category,
                limit_amount=budget.limit_amount,
                spent=round(spent, 2),
                usage_percentage=usage_pct,
            )
        )

    return DashboardResponse(
        total_income=round(total_income, 2),
        total_expense=round(total_expense, 2),
        savings=round(savings, 2),
        highest_spending_category=highest_spending_category,
        category_spending=category_spending,
        budget_utilization=budget_utilization,
    )
