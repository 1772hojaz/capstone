from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, scoped_session
from contextlib import contextmanager
from typing import Generator
import logging
import os
import sys

# Add project root to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.config import settings

logger = logging.getLogger(__name__)

# Create database engine
engine = create_engine(
    str(settings.SQLALCHEMY_DATABASE_URI),
    pool_pre_ping=True,
    pool_size=20,
    max_overflow=10,
    pool_recycle=3600,
    pool_timeout=30,
    connect_args={"connect_timeout": 5},
)

# Create session factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    expire_on_commit=False,
)

# Scoped session for thread safety
ScopedSession = scoped_session(SessionLocal)

# Base class for models
Base = declarative_base()

def get_db() -> Generator:
    """
    Dependency function that yields database sessions.
    Handles session lifecycle and ensures proper cleanup.
    """
    db = ScopedSession()
    try:
        yield db
        db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f"Database error: {str(e)}", exc_info=True)
        raise
    finally:
        db.close()

@contextmanager
def get_db_session() -> Generator:
    """
    Context manager for database sessions.
    Usage:
        with get_db_session() as db:
            # Use db session here
            pass
    """
    db = ScopedSession()
    try:
        yield db
        db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f"Database error in session: {str(e)}", exc_info=True)
        raise
    finally:
        db.close()

def init_db() -> None:
    """Initialize database tables"""
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully")
    except Exception as e:
        logger.error(f"Error initializing database: {str(e)}", exc_info=True)
        raise

def close_db_connection() -> None:
    """Close all database connections"""
    try:
        ScopedSession.remove()
        engine.dispose()
        logger.info("Database connections closed")
    except Exception as e:
        logger.error(f"Error closing database connections: {str(e)}", exc_info=True)
        raise
