"""
Database connection and session management for SPACS AFRICA.
Handles PostgreSQL connection pooling and session lifecycle.
"""

import os
from typing import Generator
from sqlalchemy import create_engine, event, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import QueuePool
from contextlib import contextmanager
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Get database URL from environment
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://spacs_user:spacs_secure_password_2025@localhost:5432/spacs_africa"
)

# Create SQLAlchemy engine with connection pooling
engine = create_engine(
    DATABASE_URL,
    poolclass=QueuePool,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,  # Verify connections before using
    pool_recycle=3600,   # Recycle connections after 1 hour
    echo=False,          # Set to True for SQL query logging in development
)

# Create SessionLocal class
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# Base class for ORM models
Base = declarative_base()


# Event listener to set timezone for each connection
@event.listens_for(engine, "connect")
def set_timezone(dbapi_connection, connection_record):
    """Set timezone to UTC for consistency."""
    cursor = dbapi_connection.cursor()
    cursor.execute("SET timezone='UTC'")
    cursor.close()


def get_db() -> Generator[Session, None, None]:
    """
    Dependency function that yields a database session.
    Used in FastAPI dependency injection.
    
    Usage:
        @app.get("/users")
        def get_users(db: Session = Depends(get_db)):
            return db.query(User).all()
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@contextmanager
def get_db_context():
    """
    Context manager for database sessions.
    Use when you need a DB session outside of FastAPI request context.
    
    Usage:
        with get_db_context() as db:
            users = db.query(User).all()
    """
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def init_db():
    """
    Initialize database - create all tables.
    This is typically run on application startup.
    Note: Schema is primarily managed by init.sql, this is a backup.
    """
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully")
    except Exception as e:
        logger.error(f"Error creating database tables: {e}")
        raise


def check_db_connection() -> bool:
    """
    Check if database connection is healthy.
    Returns True if connection is successful, False otherwise.
    """
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        logger.info("Database connection successful")
        return True
    except Exception as e:
        logger.error(f"Database connection failed: {e}")
        return False


def close_db_connections():
    """
    Dispose of all database connections.
    Should be called on application shutdown.
    """
    engine.dispose()
    logger.info("Database connections closed")


# ========================================
# Database Utility Functions
# ========================================

def execute_raw_sql(sql: str, params: dict = None) -> list:
    """
    Execute raw SQL query and return results.
    Use with caution - prefer ORM queries when possible.
    
    Args:
        sql: SQL query string
        params: Dictionary of parameters for parameterized queries
        
    Returns:
        List of result rows
    """
    with get_db_context() as db:
        result = db.execute(text(sql), params or {})
        return [dict(row._mapping) for row in result]


def get_table_row_count(table_name: str) -> int:
    """
    Get the number of rows in a table.
    Useful for monitoring and analytics.
    """
    sql = f"SELECT COUNT(*) as count FROM {table_name}"
    result = execute_raw_sql(sql)
    return result[0]['count'] if result else 0


def truncate_table(table_name: str, cascade: bool = False):
    """
    Truncate a table (delete all rows).
    WARNING: Use with extreme caution, especially in production!
    
    Args:
        table_name: Name of the table to truncate
        cascade: If True, also truncate dependent tables
    """
    cascade_clause = "CASCADE" if cascade else ""
    sql = f"TRUNCATE TABLE {table_name} {cascade_clause}"
    with get_db_context() as db:
        db.execute(text(sql))
    logger.warning(f"Table {table_name} truncated")


# ========================================
# Health Check
# ========================================

def get_db_health() -> dict:
    """
    Get database health metrics.
    Used by the /health endpoint.
    """
    try:
        with engine.connect() as connection:
            # Get database version
            version_result = connection.execute(text("SELECT version()"))
            version = version_result.fetchone()[0]
            
            # Get database size
            size_result = connection.execute(text("""
                SELECT pg_size_pretty(pg_database_size(current_database())) as size
            """))
            size = size_result.fetchone()[0]
            
            # Get number of active connections
            conn_result = connection.execute(text("""
                SELECT count(*) as connections 
                FROM pg_stat_activity 
                WHERE datname = current_database()
            """))
            active_connections = conn_result.fetchone()[0]
            
            return {
                "status": "healthy",
                "version": version.split(',')[0],  # Just the version number
                "database_size": size,
                "active_connections": active_connections,
                "pool_size": engine.pool.size(),
                "pool_checked_in": engine.pool.checkedin()
            }
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        return {
            "status": "unhealthy",
            "error": str(e)
        }


if __name__ == "__main__":
    # Test database connection when run directly
    print("Testing database connection...")
    if check_db_connection():
        print("✓ Database connection successful")
        health = get_db_health()
        print(f"✓ Database health: {health}")
    else:
        print("✗ Database connection failed")
