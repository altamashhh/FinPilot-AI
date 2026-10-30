from pydantic import BaseModel, ConfigDict, Field
from datetime import date
from typing import Optional

class TransactionBase(BaseModel):
    amount: float = Field(..., description="Amount of the transaction")
    description: str = Field(..., description="Details/description of the transaction")
    category: str = Field(..., description="Category (e.g. Food, Travel, Salary)")
    transaction_type: str = Field(..., description="Type of transaction: 'income' or 'expense'")
    transaction_date: date = Field(..., description="Date of the transaction")

class TransactionCreate(BaseModel):
    """Schema for creating a transaction. Category is optional — if omitted or empty,
    it will be auto-detected from the description."""
    amount: float = Field(..., description="Amount of the transaction")
    description: str = Field(..., description="Details/description of the transaction")
    category: Optional[str] = Field(None, description="Category (auto-detected if empty or omitted)")
    transaction_type: str = Field(..., description="Type of transaction: 'income' or 'expense'")
    transaction_date: date = Field(..., description="Date of the transaction")

class TransactionUpdate(BaseModel):
    amount: Optional[float] = Field(None, description="Amount of the transaction")
    description: Optional[str] = Field(None, description="Details/description of the transaction")
    category: Optional[str] = Field(None, description="Category (e.g. Food, Travel, Salary)")
    transaction_type: Optional[str] = Field(None, description="Type of transaction: 'income' or 'expense'")
    transaction_date: Optional[date] = Field(None, description="Date of the transaction")

class TransactionResponse(TransactionBase):
    id: int
    user_id: int

    model_config = ConfigDict(from_attributes=True)

class CategorizeRequest(BaseModel):
    """Schema for the auto-categorize endpoint."""
    description: str = Field(..., description="Transaction description to categorize")

class CategorizeResponse(BaseModel):
    """Schema for the auto-categorize endpoint response."""
    category: str = Field(..., description="Detected category")
