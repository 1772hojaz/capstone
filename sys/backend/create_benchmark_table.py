"""
Create benchmark_results table
Run this migration to add the ML benchmarking table to the database
"""
import sys
import os

# Add backend to path
sys.path.append(os.path.dirname(__file__))

from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Text, Index
from sqlalchemy.ext.declarative import declarative_base
from db.database import Base, engine, SessionLocal
from models.models import BenchmarkResult

def create_benchmark_table():
    """Create the benchmark_results table"""
    print("=" * 70)
    print("CREATING BENCHMARK_RESULTS TABLE")
    print("=" * 70)
    
    try:
        # Create all tables defined in Base metadata
        # This will only create tables that don't exist yet
        Base.metadata.create_all(bind=engine)
        
        print("\n✅ Successfully created benchmark_results table!")
        print("\nTable schema:")
        print("  - id: Primary key")
        print("  - model_name: Model identifier (hybrid, random, etc.)")
        print("  - precision_at_5: Precision@5 metric")
        print("  - precision_at_10: Precision@10 metric")
        print("  - recall_at_5: Recall@5 metric")
        print("  - recall_at_10: Recall@10 metric")
        print("  - ndcg_at_5: NDCG@5 metric")
        print("  - ndcg_at_10: NDCG@10 metric")
        print("  - map_score: Mean Average Precision")
        print("  - hit_rate: Hit rate metric")
        print("  - coverage: Coverage metric")
        print("  - test_set_size: Number of test users")
        print("  - evaluation_time: Time taken (seconds)")
        print("  - run_at: Timestamp of benchmark run")
        print("  - notes: Optional notes")
        
        # Verify table was created
        db = SessionLocal()
        try:
            # Try to query the table
            result = db.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='benchmark_results'")
            table_exists = result.fetchone() is not None
            
            if table_exists:
                print("\n✅ Verified: benchmark_results table exists in database")
            else:
                print("\n⚠️  Warning: Table creation command executed but table not found in database")
        except Exception as e:
            print(f"\n⚠️  Could not verify table creation: {e}")
        finally:
            db.close()
        
        print("\n" + "=" * 70)
        print("You can now run benchmarks from the admin dashboard!")
        print("=" * 70)
        
    except Exception as e:
        print(f"\n❌ Error creating table: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    return True

if __name__ == "__main__":
    success = create_benchmark_table()
    sys.exit(0 if success else 1)





