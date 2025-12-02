# Database Validation System

## Overview
The database validation system automatically checks and fixes database schema issues when the backend starts.

## Files

### `validate_db.py`
Main validation script that:
- Checks all tables exist
- Verifies all required columns are present
- Automatically adds missing columns with appropriate defaults
- Generates a detailed validation report

### How It Works

1. **Startup Integration**: The validation runs automatically when `main.py` starts (see `startup_event()`)
2. **Schema Definition**: Expected schema is defined in `EXPECTED_SCHEMA` dictionary in `validate_db.py`
3. **Auto-Migration**: Missing columns are automatically added with appropriate defaults
4. **Logging**: All validation steps and migrations are logged to console

### Manual Usage

Run validation manually:
```bash
cd /home/humphrey/capstone/sys/backend
python validate_db.py
```

### Expected Tables

The system validates 31 tables including:
- Core: `users`, `products`, `group_buys`, `contributions`, `transactions`
- Admin: `admin_groups`, `admin_group_joins`
- Supplier: `supplier_orders`, `supplier_products`, `supplier_invoices`, etc.
- ML: `ml_models`, `recommendation_events`, `user_behavior_features`, `benchmark_results`
- QR/Pickup: `qr_code_pickups`, `pickup_locations`, `qr_scan_history`
- Analytics: `events_raw`, `session_metrics`, `feature_store`

### Column Validation

For each table, the script validates:
- All required columns exist
- Column types match expected schema (normalized for SQLite compatibility)
- Foreign key relationships are valid

### Auto-Migration Examples

When missing columns are detected, the script automatically runs migrations like:
```sql
ALTER TABLE contributions ADD COLUMN is_collected BOOLEAN DEFAULT 0;
ALTER TABLE contributions ADD COLUMN collected_at DATETIME;
ALTER TABLE contributions ADD COLUMN qr_code_token VARCHAR;
ALTER TABLE contributions ADD COLUMN refund_status VARCHAR;
ALTER TABLE contributions ADD COLUMN refunded_at DATETIME;
```

### Adding New Tables/Columns

To add new tables or columns to validation:

1. **Define the model** in `models/models.py`:
   ```python
   class NewTable(Base):
       __tablename__ = "new_table"
       id = Column(Integer, primary_key=True)
       name = Column(String, nullable=False)
       # ... other columns
   ```

2. **Add to validation schema** in `validate_db.py`:
   ```python
   EXPECTED_SCHEMA = {
       # ... existing tables
       "new_table": [
           ("id", "INTEGER"),
           ("name", "VARCHAR"),
           # ... other columns
       ],
   }
   ```

3. **Run validation**:
   ```bash
   python validate_db.py
   ```

The script will automatically detect the missing table/columns and provide instructions.

### Troubleshooting

#### Missing Tables
If entire tables are missing:
```bash
python create_tables.py
```

This will create all tables defined in the models.

#### Schema Mismatch
If you see errors about schema mismatches:
1. Check the model definition in `models/models.py`
2. Update `EXPECTED_SCHEMA` in `validate_db.py` if needed
3. Run `python validate_db.py` to apply migrations

#### Manual Column Addition
If auto-migration fails, you can manually add columns:
```bash
sqlite3 groupbuy.db "ALTER TABLE table_name ADD COLUMN column_name TYPE DEFAULT value;"
```

### Current Schema Issues Fixed

The validation system has automatically fixed:
- ✅ Added `is_collected`, `collected_at`, `qr_code_token`, `refund_status`, `refunded_at` to `contributions`
- ✅ Added `admin_verification_status`, `admin_verified_at`, `qr_codes_generated` to `supplier_orders`
- ✅ Added `manufacturer`, `total_stock` to `products`
- ✅ Added `supplier_status`, `supplier_response_at`, `ready_for_collection_at`, `supplier_notes` to `group_buys`
- ✅ Created `benchmark_results` table

### Integration with Backend

The validation is integrated into `main.py`:
```python
@app.on_event("startup")
async def startup_event():
    # Validate database schema FIRST
    from validate_db import check_and_fix_database
    db_valid = check_and_fix_database()
    if not db_valid:
        logger.error("Database validation failed!")
    else:
        logger.info("Database schema validated successfully!")
    
    # ... rest of startup logic
```

### Best Practices

1. **Always run validation after pulling changes** that modify models
2. **Check logs during startup** for any validation warnings
3. **Keep EXPECTED_SCHEMA in sync** with model definitions
4. **Test locally before deploying** schema changes
5. **Backup database before major migrations**

### Performance

- Validation typically completes in < 1 second
- Only missing columns are migrated (no unnecessary changes)
- Minimal impact on startup time
- Safe to run multiple times (idempotent)

### Future Enhancements

Potential improvements:
- [ ] Support for column type changes (currently only adds missing columns)
- [ ] Support for dropping deprecated columns
- [ ] Database backup before migrations
- [ ] Migration rollback support
- [ ] Version tracking for migrations
- [ ] Support for other databases (PostgreSQL, MySQL)
