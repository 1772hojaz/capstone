from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

# Use SQLite for local development (change to PostgreSQL for production)
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./groupbuy.db")

POOL_SIZE = int(os.getenv("DB_POOL_SIZE", "10"))
MAX_OVERFLOW = int(os.getenv("DB_MAX_OVERFLOW", "20"))
POOL_TIMEOUT = int(os.getenv("DB_POOL_TIMEOUT", "30"))
POOL_RECYCLE = int(os.getenv("DB_POOL_RECYCLE", "1800"))  # 30 minutes

is_sqlite = "sqlite" in DATABASE_URL

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if is_sqlite else {},
    pool_pre_ping=True,
    pool_size=None if is_sqlite else POOL_SIZE,
    max_overflow=None if is_sqlite else MAX_OVERFLOW,
    pool_timeout=None if is_sqlite else POOL_TIMEOUT,
    pool_recycle=None if is_sqlite else POOL_RECYCLE,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Optional read-replica support for analytics-heavy reads
READ_REPLICA_URL = os.getenv("READ_REPLICA_URL")
read_engine = None
ReadSessionLocal = None
if READ_REPLICA_URL:
    read_engine = create_engine(
        READ_REPLICA_URL,
        pool_pre_ping=True,
        pool_size=None if "sqlite" in READ_REPLICA_URL else POOL_SIZE,
        max_overflow=None if "sqlite" in READ_REPLICA_URL else MAX_OVERFLOW,
        pool_timeout=None if "sqlite" in READ_REPLICA_URL else POOL_TIMEOUT,
        pool_recycle=None if "sqlite" in READ_REPLICA_URL else POOL_RECYCLE,
        connect_args={"check_same_thread": False} if "sqlite" in READ_REPLICA_URL else {},
    )
    ReadSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=read_engine)

def get_read_db():
    if ReadSessionLocal is None:
        # Fallback to primary if no replica configured
        yield from get_db()
        return
    db = ReadSessionLocal()
    try:
        yield db
    finally:
        db.close()
