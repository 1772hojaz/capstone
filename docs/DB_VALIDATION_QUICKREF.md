# Database Validation - Quick Reference

## 🚀 Quick Start

The database validation system runs **automatically** when you start the backend!

```bash
cd /home/humphrey/capstone/sys/backend
python main.py
```

## 📋 What It Does

✅ Checks all 31 tables exist  
✅ Verifies all required columns are present  
✅ Automatically adds missing columns  
✅ Sets appropriate default values  
✅ Logs all changes clearly  

## 🔧 Manual Validation

```bash
# Run validation standalone
cd /home/humphrey/capstone/sys/backend
python validate_db.py
```

## 📊 Current Status

**Database State**: ✅ VALID  
**Tables**: 31/31 present  
**Columns**: All required columns present  
**Last Validation**: Fixed 10 missing columns  

## 🛠️ Common Commands

### Check contributions table
```bash
sqlite3 groupbuy.db "PRAGMA table_info(contributions);"
```

### List all tables
```bash
sqlite3 groupbuy.db ".tables"
```

### Create missing tables
```bash
python create_tables.py
```

### View validation logs
Look for output starting with:
```
======================================================================
DATABASE SCHEMA VALIDATION
======================================================================
```

## ✨ Fixed Issues

### Contributions Table
- ✅ is_collected
- ✅ collected_at  
- ✅ qr_code_token
- ✅ refund_status
- ✅ refunded_at

### Supplier Orders Table
- ✅ admin_verification_status
- ✅ admin_verified_at
- ✅ qr_codes_generated

### Other Tables
- ✅ products (manufacturer, total_stock)
- ✅ group_buys (supplier fields)
- ✅ benchmark_results (created table)

## 📚 Documentation

- **Complete Guide**: `DB_VALIDATION_README.md`
- **Implementation Details**: `DB_VALIDATION_SUMMARY.md`
- **Source Code**: `validate_db.py`

## 🔥 Key Features

1. **Automatic**: Runs on startup
2. **Safe**: Non-destructive, only adds columns
3. **Smart**: Appropriate defaults based on column type
4. **Fast**: < 1 second validation
5. **Idempotent**: Safe to run multiple times

## ⚠️ Troubleshooting

### "Table does not exist"
```bash
python create_tables.py
```

### "Failed to add column"
Check the error message and manually add:
```bash
sqlite3 groupbuy.db "ALTER TABLE table_name ADD COLUMN column_name TYPE DEFAULT value;"
```

### Validation fails on startup
Check logs for specific errors. You can skip validation temporarily by commenting out the validation code in `main.py`.

## 🎯 Best Practices

1. ✅ Always check startup logs for validation status
2. ✅ Run validation after pulling code changes
3. ✅ Keep EXPECTED_SCHEMA up to date
4. ✅ Backup database before major changes
5. ✅ Test locally before deploying

## 📞 Need Help?

1. Check `DB_VALIDATION_README.md` for detailed documentation
2. Review `DB_VALIDATION_SUMMARY.md` for implementation details  
3. Look at validation logs for specific errors
4. Check database schema: `sqlite3 groupbuy.db ".schema table_name"`

## ✅ Success Indicators

When validation succeeds, you'll see:
```
INFO: ✅ Database schema is valid!
```

When migrations are applied:
```
INFO: ✅ Applied N migrations
```

## 🚫 Error Indicators

When validation fails:
```
WARNING: ⚠️  Found X missing tables
WARNING: ⚠️  Found Y missing columns
```

Follow the instructions in the output to resolve.

---

**Created**: November 16, 2025  
**Status**: Production Ready  
**Version**: 1.0
