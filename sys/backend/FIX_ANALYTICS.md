# Fix Analytics Tables

The analytics tables have schema issues. Run this command to fix them:

```bash
cd /home/humphrey/capstone/sys/backend
python db/reset_analytics_tables.py
```

This will:
1. Drop the old analytics tables with incorrect schema
2. Recreate them with the correct schema (SQLite-compatible)

After running this, the analytics ETL errors will be resolved.

## What was fixed:
- Changed `server_default='now()'` (PostgreSQL-only) to `default=datetime.utcnow` (works with SQLite)
- Changed `ARRAY(Integer)` to `ARRAYString` (Text-based for SQLite, ARRAY for PostgreSQL)
- Ensured all columns in `UserBehaviorFeatures` match the model definition

