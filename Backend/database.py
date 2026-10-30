
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Read database URL from environment variables.
# Fall back to SQLite for local development.
SQLALCHEMY_DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite:///./finance.db"
)

# SQLite requires check_same_thread=False.
connect_args = {}

if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

# Create database engine
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True
)

# Session Local factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# Declarative base for ORM Models
Base = declarative_base()

# DB Dependency helper
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
