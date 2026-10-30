from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models.user import User
from schemas.transaction import (
    TransactionCreate, TransactionUpdate, TransactionResponse,
    CategorizeRequest, CategorizeResponse,
)
from utils.security import get_current_user
from services.categorizer import auto_categorize
import services.transaction as service
from typing import List

router = APIRouter(
    prefix="/transactions",
    tags=["Transactions"]
)

@router.post("/auto-categorize", response_model=CategorizeResponse)
def categorize_transaction(
    payload: CategorizeRequest,
    current_user: User = Depends(get_current_user),
):
    """Detect category from a transaction description using keyword rules."""
    category = auto_categorize(payload.description)
    return CategorizeResponse(category=category)

@router.post("/", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
def create_transaction(
    transaction: TransactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return service.create_transaction(db, transaction, current_user.id)

@router.get("/", response_model=List[TransactionResponse])
def get_transactions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return service.get_transactions(db, current_user.id)

@router.get("/{transaction_id}", response_model=TransactionResponse)
def get_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_tx = service.get_transaction_by_id(db, transaction_id, current_user.id)
    if not db_tx:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Transaction with ID {transaction_id} not found."
        )
    return db_tx

@router.put("/{transaction_id}", response_model=TransactionResponse)
def update_transaction(
    transaction_id: int,
    transaction_update: TransactionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    updated_tx = service.update_transaction(db, transaction_id, transaction_update, current_user.id)
    if not updated_tx:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Transaction with ID {transaction_id} not found."
        )
    return updated_tx

@router.delete("/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_transaction(
    transaction_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    success = service.delete_transaction(db, transaction_id, current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Transaction with ID {transaction_id} not found."
        )
    return None
