from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from models.user import User
from schemas.insights import InsightsResponse
from services.insights import generate_insights
from utils.security import get_current_user

router = APIRouter(
    prefix="/insights",
    tags=["Insights"],
)


@router.get("/", response_model=InsightsResponse)
def get_insights(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate and return proactive financial insights for the authenticated user."""
    return generate_insights(db, current_user.id)
