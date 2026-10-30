from pydantic import BaseModel, Field
from typing import List, Optional


class CategorySpending(BaseModel):
    """Breakdown of spending by category."""
    category: str = Field(..., description="Expense category name")
    total_spent: float = Field(..., description="Total amount spent in this category")


class BudgetUtilization(BaseModel):
    """Budget usage percentage per category."""
    category: str = Field(..., description="Budget category name")
    limit_amount: float = Field(..., description="Budget limit for this category")
    spent: float = Field(..., description="Amount spent in this category")
    usage_percentage: float = Field(..., description="Percentage of budget used (0-100+)")


class DashboardResponse(BaseModel):
    """Complete dashboard analytics response."""
    total_income: float = Field(default=0.0, description="Sum of all income transactions")
    total_expense: float = Field(default=0.0, description="Sum of all expense transactions (positive number)")
    savings: float = Field(default=0.0, description="Net savings (total_income - total_expense)")
    highest_spending_category: str = Field(default="", description="Category with the highest spending")
    category_spending: List[CategorySpending] = Field(default_factory=list, description="Spending breakdown by category")
    budget_utilization: List[BudgetUtilization] = Field(default_factory=list, description="Budget usage percentage per category")
