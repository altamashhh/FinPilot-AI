from pydantic import BaseModel, ConfigDict, Field
from typing import Optional

class BudgetBase(BaseModel):
    category: str = Field(..., description="Category for the budget (e.g. Food, Shopping)")
    limit_amount: float = Field(..., description="Maximum budget spending limit")

class BudgetCreate(BudgetBase):
    pass

class BudgetUpdate(BaseModel):
    category: Optional[str] = Field(None, description="Category for the budget")
    limit_amount: Optional[float] = Field(None, description="Maximum budget spending limit")

class BudgetResponse(BudgetBase):
    id: int
    user_id: int

    model_config = ConfigDict(from_attributes=True)
