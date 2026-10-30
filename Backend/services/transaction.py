from sqlalchemy.orm import Session
from models.transaction import Transaction
from schemas.transaction import TransactionCreate, TransactionUpdate
from services.categorizer import auto_categorize
from typing import List, Optional

def get_transactions(db: Session, user_id: int) -> List[Transaction]:
    return db.query(Transaction).filter(Transaction.user_id == user_id).order_by(Transaction.transaction_date.desc()).all()

def get_transaction_by_id(db: Session, transaction_id: int, user_id: int) -> Optional[Transaction]:
    return db.query(Transaction).filter(Transaction.id == transaction_id, Transaction.user_id == user_id).first()

def create_transaction(db: Session, transaction: TransactionCreate, user_id: int) -> Transaction:
    # Auto-categorize if category is not provided or empty
    category = transaction.category
    if not category or not category.strip():
        category = auto_categorize(transaction.description)

    db_tx = Transaction(
        user_id=user_id,
        amount=transaction.amount,
        description=transaction.description,
        category=category,
        transaction_type=transaction.transaction_type,
        transaction_date=transaction.transaction_date
    )
    db.add(db_tx)
    db.commit()
    db.refresh(db_tx)
    return db_tx

def update_transaction(db: Session, transaction_id: int, transaction_update: TransactionUpdate, user_id: int) -> Optional[Transaction]:
    db_tx = get_transaction_by_id(db, transaction_id, user_id)
    if not db_tx:
        return None
    
    update_data = transaction_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_tx, key, value)
        
    db.commit()
    db.refresh(db_tx)
    return db_tx

def delete_transaction(db: Session, transaction_id: int, user_id: int) -> bool:
    db_tx = get_transaction_by_id(db, transaction_id, user_id)
    if not db_tx:
        return False
    
    db.delete(db_tx)
    db.commit()
    return True
