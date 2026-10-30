import sys
import os
from datetime import datetime

# Configure Python path
backend_path = os.path.dirname(os.path.abspath(__file__))
if backend_path not in sys.path:
    sys.path.append(backend_path)

from database import SessionLocal, Base, engine
from models.user import User
from models.transaction import Transaction
from models.budget import Budget
from utils.security import get_password_hash

def seed_sample_records():
    print("Starting data seeding process...")
    db = SessionLocal()
    try:
        # Ensure demo user exists
        demo_user = db.query(User).filter(User.email == "demo@wealthai.com").first()
        if not demo_user:
            hashed_pwd = get_password_hash("demo123")
            demo_user = User(
                id=1,
                email="demo@wealthai.com",
                hashed_password=hashed_pwd
            )
            db.add(demo_user)
            db.commit()
            db.refresh(demo_user)
            print("Demo user seeded.")
        else:
            print("Demo user already exists.")

        user_id = demo_user.id

        # Delete existing data to avoid duplicates if re-running
        db.query(Transaction).filter(Transaction.user_id == user_id).delete()
        db.query(Budget).filter(Budget.user_id == user_id).delete()
        db.commit()
        print("Existing transaction/budget data cleared for demo user.")

        # 1. Seed Budgets
        budgets_to_seed = [
            Budget(user_id=user_id, category="Housing", limit_amount=2500.0),
            Budget(user_id=user_id, category="Food & Dining", limit_amount=1200.0),
            Budget(user_id=user_id, category="Travel & Transport", limit_amount=500.0),
            Budget(user_id=user_id, category="Shopping", limit_amount=800.0),
            Budget(user_id=user_id, category="Entertainment", limit_amount=200.0)
        ]
        db.add_all(budgets_to_seed)
        db.commit()
        print(f"Seeded {len(budgets_to_seed)} category budgets.")

        # 2. Seed Transactions
        transactions_to_seed = [
            Transaction(
                user_id=user_id,
                amount=-2450.00,
                description="Monthly Mortgage Payment - Chase",
                category="Housing",
                transaction_type="expense",
                transaction_date=datetime.strptime("2023-10-24", "%Y-%m-%d").date()
            ),
            Transaction(
                user_id=user_id,
                amount=-245.12,
                description="Whole Foods Market",
                category="Food & Dining",
                transaction_type="expense",
                transaction_date=datetime.strptime("2023-10-24", "%Y-%m-%d").date()
            ),
            Transaction(
                user_id=user_id,
                amount=6200.00,
                description="Direct Deposit - TechCorp Inc.",
                category="Salary",
                transaction_type="income",
                transaction_date=datetime.strptime("2023-10-23", "%Y-%m-%d").date()
            ),
            Transaction(
                user_id=user_id,
                amount=-112.00,
                description="Central Power Utility",
                category="Bills",
                transaction_type="expense",
                transaction_date=datetime.strptime("2023-10-22", "%Y-%m-%d").date()
            ),
            Transaction(
                user_id=user_id,
                amount=-184.20,
                description="The Capital Grille - Business Dinner",
                category="Food & Dining",
                transaction_type="expense",
                transaction_date=datetime.strptime("2023-10-22", "%Y-%m-%d").date()
            ),
            Transaction(
                user_id=user_id,
                amount=420.50,
                description="Dividend Payment - VTSAX Portfolio",
                category="Investment",
                transaction_type="income",
                transaction_date=datetime.strptime("2023-10-21", "%Y-%m-%d").date()
            ),
            Transaction(
                user_id=user_id,
                amount=-19.99,
                description="Netflix Premium Subscription",
                category="Subscription",
                transaction_type="expense",
                transaction_date=datetime.strptime("2023-10-20", "%Y-%m-%d").date()
            ),
            Transaction(
                user_id=user_id,
                amount=-2499.00,
                description="Apple Store - New MacBook Pro M3",
                category="Shopping",
                transaction_type="expense",
                transaction_date=datetime.strptime("2023-10-19", "%Y-%m-%d").date()
            ),
            Transaction(
                user_id=user_id,
                amount=-58.40,
                description="Chevron Station",
                category="Travel & Transport",
                transaction_type="expense",
                transaction_date=datetime.strptime("2023-10-18", "%Y-%m-%d").date()
            ),
            Transaction(
                user_id=user_id,
                amount=-185.00,
                description="Equinox Membership",
                category="Entertainment",
                transaction_type="expense",
                transaction_date=datetime.strptime("2023-10-15", "%Y-%m-%d").date()
            )
        ]
        db.add_all(transactions_to_seed)
        db.commit()
        print(f"Seeded {len(transactions_to_seed)} transaction records.")
        print("Data seeding completed successfully!")

    except Exception as e:
        db.rollback()
        print(f"ERROR: Seeding failed with exception: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_sample_records()
