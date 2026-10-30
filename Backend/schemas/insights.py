from pydantic import BaseModel, Field
from typing import List, Optional


class InsightAlert(BaseModel):
    """A proactive alert about the user's financial state."""
    type: str = Field(..., description="Alert type: 'budget_overspend', 'unusual_expense', 'low_savings'")
    severity: str = Field(..., description="Severity level: 'info', 'warning', 'critical'")
    message: str = Field(..., description="Human-readable alert message")


class InsightRecommendation(BaseModel):
    """An actionable financial recommendation."""
    type: str = Field(..., description="Recommendation type: 'savings', 'spending', 'budget', 'trend'")
    message: str = Field(..., description="Human-readable recommendation message")


class InsightSummary(BaseModel):
    """High-level financial summary used for insights."""
    total_income: float = Field(default=0.0)
    total_expense: float = Field(default=0.0)
    savings: float = Field(default=0.0)
    savings_rate: float = Field(default=0.0, description="Savings as a percentage of income")
    highest_spending_category: str = Field(default="")
    avg_transaction_amount: float = Field(default=0.0, description="Average expense transaction amount")
    transaction_count: int = Field(default=0)


class InsightsResponse(BaseModel):
    """Complete financial insights response."""
    alerts: List[InsightAlert] = Field(default_factory=list, description="Proactive alerts")
    recommendations: List[InsightRecommendation] = Field(default_factory=list, description="Actionable recommendations")
    summary: InsightSummary = Field(default_factory=InsightSummary, description="Financial summary")
