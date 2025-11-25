#!/usr/bin/env python3
"""
Drop and recreate analytics tables with the correct schema.
This fixes schema mismatches between old and new table definitions.
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from db.database import engine
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

def reset_analytics_tables():
    """Drop and recreate all analytics tables."""
    print("Resetting analytics tables...")
    
    tables_to_reset = [
        SearchQuery.__table__,
        SessionMetrics.__table__,
        FeatureStore.__table__,
        UserSimilarity.__table__,
        UserGroupInteractionMatrix.__table__,
        GroupPerformanceMetrics.__table__,
        UserBehaviorFeatures.__table__,
        EventsRaw.__table__,
    ]
    
    # Drop tables in reverse order (to handle foreign keys)
    print("\nDropping existing tables...")
    for table in tables_to_reset:
        try:
            table.drop(bind=engine, checkfirst=True)
            print(f"  ✓ Dropped {table.name}")
        except Exception as e:
            print(f"  - {table.name} (didn't exist or error: {e})")
    
    # Create tables
    print("\nCreating new tables...")
    for table in reversed(tables_to_reset):
        table.create(bind=engine, checkfirst=True)
        print(f"  ✓ Created {table.name}")
    
    print("\n✅ Analytics tables reset successfully!")

if __name__ == "__main__":
    reset_analytics_tables()

