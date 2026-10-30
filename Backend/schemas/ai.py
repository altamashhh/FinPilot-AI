from pydantic import BaseModel, Field
from typing import List, Optional


class AdviceResponse(BaseModel):
    """Response schema for AI financial advice."""
    advice: List[str] = Field(
        default_factory=list,
        description="List of personalized financial advice strings",
    )


class ChatRequest(BaseModel):
    """Request schema for AI chat assistant."""
    message: str = Field(..., description="User's financial question")


class ChatResponse(BaseModel):
    """Response schema for AI chat assistant."""
    answer: str = Field(..., description="AI-generated contextual answer")
