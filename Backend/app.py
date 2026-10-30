from dotenv import load_dotenv

load_dotenv()
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from database import engine, SessionLocal, Base
from models.user import User
from utils.security import get_password_hash

# Import routers
from routes.auth import router as auth_router
from routes.transaction import router as transaction_router
from routes.budget import router as budget_router
from routes.dashboard import router as dashboard_router
from routes.insights import router as insights_router
from routes.ai import router as ai_router
from routes.report import router as report_router

# Modern FastAPI Lifespan for startup and shutdown actions
@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Automatically create all database tables
    Base.metadata.create_all(bind=engine)
    
    # 2. Seed the demo user if not already present
    db = SessionLocal()
    try:
        demo_user = db.query(User).filter(User.email == "demo@wealthai.com").first()
        if not demo_user:
            hashed_pwd = get_password_hash("demo123")
            # Let the database auto-assign the primary key
            new_user = User(
                email="demo@wealthai.com",
                hashed_password=hashed_pwd,
            )
            db.add(new_user)
            db.commit()
            print("INFO:     Demo user seeded successfully (demo@wealthai.com).")
        else:
            print("INFO:     Demo user already exists.")
    except Exception as e:
        db.rollback()
        print(f"ERROR:    Failed to seed demo user: {e}")
    finally:
        db.close()
        
    yield
    # Shutdown actions (if any) can go here

# Initialize FastAPI App
app = FastAPI(
    title="Agentic AI Personal Finance & Budgeting Assistant API",
    description="Backend services for tracking transactions, managing budgets, and agentic AI recommendations.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Configuration
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    "http://localhost:3002",
    "http://127.0.0.1:3002",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth_router)
app.include_router(transaction_router)
app.include_router(budget_router)
app.include_router(dashboard_router)
app.include_router(insights_router)
app.include_router(ai_router)
app.include_router(report_router)

@app.get("/", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "project": "Agentic AI-Based Personal Finance & Budgeting Assistant Backend",
        "version": "1.0.0"
    }
