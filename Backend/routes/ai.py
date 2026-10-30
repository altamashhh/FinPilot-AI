from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from models.user import User
from schemas.ai import AdviceResponse, ChatRequest, ChatResponse
from services.ai_advisor import get_ai_advice, get_chat_response
from utils.security import get_current_user

router = APIRouter(
    tags=["AI Advisor"],
)


@router.post("/ai/advice", response_model=AdviceResponse)
def ai_advice(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate personalised financial advice using AI (Gemini or fallback)."""
    advice_list = get_ai_advice(db, current_user.id)
    return AdviceResponse(advice=advice_list)


@router.post("/chat", response_model=ChatResponse)
def ai_chat(
    payload: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """AI-powered financial chat assistant with full user context."""
    answer = get_chat_response(db, current_user.id, payload.message)
    return ChatResponse(answer=answer)
