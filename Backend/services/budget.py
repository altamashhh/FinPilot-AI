from sqlalchemy.orm import Session
from models.budget import Budget
from schemas.budget import BudgetCreate, BudgetUpdate
from typing import List, Optional

def get_budgets(db: Session, user_id: int) -> List[Budget]:
    return db.query(Budget).filter(Budget.user_id == user_id).all()

def get_budget_by_id(db: Session, budget_id: int, user_id: int) -> Optional[Budget]:
    return db.query(Budget).filter(Budget.id == budget_id, Budget.user_id == user_id).first()

def create_budget(db: Session, budget: BudgetCreate, user_id: int) -> Budget:
    # Guard against duplicate categories per user: upsert instead of insert.
    # If a budget for this category already exists, update the limit amount.
    existing = (
        db.query(Budget)
        .filter(Budget.user_id == user_id, Budget.category == budget.category)
        .first()
    )
    if existing:
        existing.limit_amount = budget.limit_amount
        db.commit()
        db.refresh(existing)
        return existing

    db_budget = Budget(
        user_id=user_id,
        category=budget.category,
        limit_amount=budget.limit_amount,
    )
    db.add(db_budget)
    db.commit()
    db.refresh(db_budget)
    return db_budget

def update_budget(db: Session, budget_id: int, budget_update: BudgetUpdate, user_id: int) -> Optional[Budget]:
    db_budget = get_budget_by_id(db, budget_id, user_id)
    if not db_budget:
        return None
    
    update_data = budget_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_budget, key, value)
        
    db.commit()
    db.refresh(db_budget)
    return db_budget

def delete_budget(db: Session, budget_id: int, user_id: int) -> bool:
    db_budget = get_budget_by_id(db, budget_id, user_id)
    if not db_budget:
        return False
    
    db.delete(db_budget)
    db.commit()
    return True
