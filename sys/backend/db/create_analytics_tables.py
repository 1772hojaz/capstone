#!/usr/bin/env python3
"""
Create analytics tables in the database.
Run this script to set up the analytics schema.
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from db.database import engine, Base
from models.analytics_models import (
    EventsRaw,
    UserBehaviorFeatures,
    GroupPerformanceMetrics,
    UserGroupInteractionMatrix,
    UserSimilarity,
    FeatureStore,
    SessionMetrics,
    SearchQuery,
)

def create_analytics_tables():
    """Create all analytics tables."""
    print("Creating analytics tables...")
    
    # Import all models to ensure they're registered with Base
    tables_to_create = [
        EventsRaw.__table__,
        UserBehaviorFeatures.__table__,
        GroupPerformanceMetrics.__table__,
        UserGroupInteractionMatrix.__table__,
        UserSimilarity.__table__,
        FeatureStore.__table__,
        SessionMetrics.__table__,
        SearchQuery.__table__,
    ]
    
    # Create tables
    Base.metadata.create_all(bind=engine, tables=tables_to_create)
    
    print("✓ Analytics tables created successfully!")
    print("\nCreated tables:")
    for table in tables_to_create:
        print(f"  - {table.name}")

if __name__ == "__main__":
    create_analytics_tables()

