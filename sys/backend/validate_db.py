#!/usr/bin/env python3
"""
Database Validation Script
Checks all tables and columns to ensure the database schema matches the models.
Runs automatically when the backend starts.
"""

import sys
from sqlalchemy import inspect, text
from sqlalchemy.exc import SQLAlchemyError
from db.database import engine
from typing import Dict, List, Tuple
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

# Define the expected database schema
EXPECTED_SCHEMA = {
    "users": [
        ("id", "INTEGER"),
        ("email", "VARCHAR"),
        ("hashed_password", "VARCHAR"),
        ("full_name", "VARCHAR"),
        ("is_admin", "BOOLEAN"),
        ("is_supplier", "BOOLEAN"),
        ("is_active", "BOOLEAN"),
        ("location_zone", "VARCHAR"),
        ("cluster_id", "INTEGER"),
        ("company_name", "VARCHAR"),
        ("business_address", "TEXT"),
        ("tax_id", "VARCHAR"),
        ("phone_number", "VARCHAR"),
        ("business_type", "VARCHAR"),
        ("business_description", "TEXT"),
        ("website_url", "VARCHAR"),
        ("supplier_rating", "FLOAT"),
        ("total_orders_fulfilled", "INTEGER"),
        ("is_verified", "BOOLEAN"),
        ("verification_status", "VARCHAR"),
        ("bank_account_name", "VARCHAR"),
        ("bank_account_number", "VARCHAR"),
        ("bank_name", "VARCHAR"),
        ("payment_terms", "VARCHAR"),
        ("preferred_categories", "JSON"),
        ("budget_range", "VARCHAR"),
        ("experience_level", "VARCHAR"),
        ("preferred_group_sizes", "JSON"),
        ("participation_frequency", "VARCHAR"),
        ("email_notifications", "BOOLEAN"),
        ("push_notifications", "BOOLEAN"),
        ("sms_notifications", "BOOLEAN"),
        ("weekly_summary", "BOOLEAN"),
        ("price_alerts_enabled", "BOOLEAN"),
        ("show_recommendations", "BOOLEAN"),
        ("auto_join_groups", "BOOLEAN"),
        ("created_at", "DATETIME"),
    ],
    "products": [
        ("id", "INTEGER"),
        ("name", "VARCHAR"),
        ("description", "TEXT"),
        ("image_url", "VARCHAR"),
        ("unit_price", "FLOAT"),
        ("bulk_price", "FLOAT"),
        ("unit_price_zig", "FLOAT"),
        ("bulk_price_zig", "FLOAT"),
        ("moq", "INTEGER"),
        ("category", "VARCHAR"),
        ("manufacturer", "VARCHAR"),
        ("total_stock", "INTEGER"),
        ("is_active", "BOOLEAN"),
        ("created_at", "DATETIME"),
    ],
    "group_buys": [
        ("id", "INTEGER"),
        ("product_id", "INTEGER"),
        ("creator_id", "INTEGER"),
        ("location_zone", "VARCHAR"),
        ("deadline", "DATETIME"),
        ("total_quantity", "INTEGER"),
        ("total_contributions", "FLOAT"),
        ("total_paid", "FLOAT"),
        ("status", "VARCHAR"),
        ("created_at", "DATETIME"),
        ("completed_at", "DATETIME"),
        ("supplier_status", "VARCHAR"),
        ("supplier_response_at", "DATETIME"),
        ("ready_for_collection_at", "DATETIME"),
        ("supplier_notes", "TEXT"),
    ],
    "contributions": [
        ("id", "INTEGER"),
        ("group_buy_id", "INTEGER"),
        ("user_id", "INTEGER"),
        ("quantity", "INTEGER"),
        ("contribution_amount", "FLOAT"),
        ("paid_amount", "FLOAT"),
        ("is_fully_paid", "BOOLEAN"),
        ("joined_at", "DATETIME"),
        ("is_collected", "BOOLEAN"),
        ("collected_at", "DATETIME"),
        ("qr_code_token", "VARCHAR"),
        ("refund_status", "VARCHAR"),
        ("refunded_at", "DATETIME"),
    ],
    "transactions": [
        ("id", "INTEGER"),
        ("user_id", "INTEGER"),
        ("group_buy_id", "INTEGER"),
        ("product_id", "INTEGER"),
        ("quantity", "INTEGER"),
        ("amount", "FLOAT"),
        ("transaction_type", "VARCHAR"),
        ("created_at", "DATETIME"),
        ("location_zone", "VARCHAR"),
        ("cluster_id", "INTEGER"),
    ],
    "chat_messages": [
        ("id", "INTEGER"),
        ("group_buy_id", "INTEGER"),
        ("user_id", "INTEGER"),
        ("message", "TEXT"),
        ("created_at", "DATETIME"),
    ],
    "ml_models": [
        ("id", "INTEGER"),
        ("model_type", "VARCHAR"),
        ("model_path", "VARCHAR"),
        ("metrics", "JSON"),
        ("trained_at", "DATETIME"),
        ("is_active", "BOOLEAN"),
    ],
    "recommendation_events": [
        ("id", "INTEGER"),
        ("user_id", "INTEGER"),
        ("group_buy_id", "INTEGER"),
        ("recommendation_score", "FLOAT"),
        ("recommendation_reasons", "JSON"),
        ("shown_at", "DATETIME"),
        ("clicked", "BOOLEAN"),
        ("clicked_at", "DATETIME"),
        ("joined", "BOOLEAN"),
        ("joined_at", "DATETIME"),
    ],
    "admin_groups": [
        ("id", "INTEGER"),
        ("name", "VARCHAR"),
        ("description", "TEXT"),
        ("long_description", "TEXT"),
        ("category", "VARCHAR"),
        ("price", "FLOAT"),
        ("original_price", "FLOAT"),
        ("image", "VARCHAR"),
        ("max_participants", "INTEGER"),
        ("participants", "INTEGER"),
        ("created", "DATETIME"),
        ("end_date", "DATETIME"),
        ("admin_name", "VARCHAR"),
        ("shipping_info", "VARCHAR"),
        ("estimated_delivery", "VARCHAR"),
        ("features", "JSON"),
        ("requirements", "JSON"),
        ("is_active", "BOOLEAN"),
        ("product_id", "INTEGER"),
        ("product_name", "VARCHAR"),
        ("product_description", "TEXT"),
        ("total_stock", "INTEGER"),
        ("specifications", "TEXT"),
        ("manufacturer", "VARCHAR"),
        ("pickup_location", "VARCHAR"),
    ],
    "admin_group_joins": [
        ("id", "INTEGER"),
        ("admin_group_id", "INTEGER"),
        ("user_id", "INTEGER"),
        ("quantity", "INTEGER"),
        ("delivery_method", "VARCHAR"),
        ("payment_method", "VARCHAR"),
        ("special_instructions", "TEXT"),
        ("payment_transaction_id", "VARCHAR"),
        ("payment_reference", "VARCHAR"),
        ("joined_at", "DATETIME"),
    ],
    "qr_code_pickups": [
        ("id", "INTEGER"),
        ("qr_code_data", "VARCHAR"),
        ("user_id", "INTEGER"),
        ("group_buy_id", "INTEGER"),
        ("pickup_location", "VARCHAR"),
        ("generated_at", "DATETIME"),
        ("expires_at", "DATETIME"),
        ("is_used", "BOOLEAN"),
        ("used_at", "DATETIME"),
        ("used_by_staff", "VARCHAR"),
        ("used_location", "VARCHAR"),
    ],
    "pickup_locations": [
        ("id", "VARCHAR"),
        ("name", "VARCHAR"),
        ("address", "TEXT"),
        ("city", "VARCHAR"),
        ("province", "VARCHAR"),
        ("phone", "VARCHAR"),
        ("operating_hours", "VARCHAR"),
        ("is_active", "BOOLEAN"),
        ("created_at", "DATETIME"),
    ],
    "supplier_products": [
        ("id", "INTEGER"),
        ("supplier_id", "INTEGER"),
        ("product_id", "INTEGER"),
        ("sku", "VARCHAR"),
        ("stock_level", "INTEGER"),
        ("min_bulk_quantity", "INTEGER"),
        ("is_active", "BOOLEAN"),
        ("created_at", "DATETIME"),
    ],
    "product_pricing_tiers": [
        ("id", "INTEGER"),
        ("supplier_product_id", "INTEGER"),
        ("min_quantity", "INTEGER"),
        ("max_quantity", "INTEGER"),
        ("unit_price", "FLOAT"),
        ("description", "VARCHAR"),
        ("created_at", "DATETIME"),
    ],
    "supplier_orders": [
        ("id", "INTEGER"),
        ("supplier_id", "INTEGER"),
        ("group_buy_id", "INTEGER"),
        ("admin_group_id", "INTEGER"),
        ("order_number", "VARCHAR"),
        ("status", "VARCHAR"),
        ("total_value", "FLOAT"),
        ("total_savings", "FLOAT"),
        ("delivery_method", "VARCHAR"),
        ("delivery_location", "VARCHAR"),
        ("scheduled_delivery_date", "DATETIME"),
        ("special_instructions", "TEXT"),
        ("rejection_reason", "TEXT"),
        ("created_at", "DATETIME"),
        ("confirmed_at", "DATETIME"),
        ("shipped_at", "DATETIME"),
        ("delivered_at", "DATETIME"),
        ("admin_verification_status", "VARCHAR"),
        ("admin_verified_at", "DATETIME"),
        ("qr_codes_generated", "BOOLEAN"),
    ],
    "supplier_order_items": [
        ("id", "INTEGER"),
        ("supplier_order_id", "INTEGER"),
        ("supplier_product_id", "INTEGER"),
        ("quantity", "INTEGER"),
        ("unit_price", "FLOAT"),
        ("total_amount", "FLOAT"),
    ],
    "supplier_pickup_locations": [
        ("id", "INTEGER"),
        ("supplier_id", "INTEGER"),
        ("name", "VARCHAR"),
        ("address", "TEXT"),
        ("city", "VARCHAR"),
        ("province", "VARCHAR"),
        ("phone", "VARCHAR"),
        ("operating_hours", "VARCHAR"),
        ("is_active", "BOOLEAN"),
        ("created_at", "DATETIME"),
    ],
    "supplier_invoices": [
        ("id", "INTEGER"),
        ("supplier_id", "INTEGER"),
        ("order_id", "INTEGER"),
        ("invoice_number", "VARCHAR"),
        ("amount", "FLOAT"),
        ("tax_amount", "FLOAT"),
        ("total_amount", "FLOAT"),
        ("status", "VARCHAR"),
        ("due_date", "DATETIME"),
        ("paid_at", "DATETIME"),
        ("pdf_url", "VARCHAR"),
        ("created_at", "DATETIME"),
    ],
    "supplier_payments": [
        ("id", "INTEGER"),
        ("supplier_id", "INTEGER"),
        ("amount", "FLOAT"),
        ("payment_method", "VARCHAR"),
        ("reference_number", "VARCHAR"),
        ("status", "VARCHAR"),
        ("processed_at", "DATETIME"),
        ("created_at", "DATETIME"),
    ],
    "supplier_notifications": [
        ("id", "INTEGER"),
        ("supplier_id", "INTEGER"),
        ("title", "VARCHAR"),
        ("message", "TEXT"),
        ("type", "VARCHAR"),
        ("is_read", "BOOLEAN"),
        ("created_at", "DATETIME"),
    ],
    "qr_scan_history": [
        ("id", "INTEGER"),
        ("qr_code_data", "VARCHAR"),
        ("scanned_by_user_id", "INTEGER"),
        ("scanned_user_id", "INTEGER"),
        ("group_buy_id", "INTEGER"),
        ("product_id", "INTEGER"),
        ("quantity", "INTEGER"),
        ("amount", "FLOAT"),
        ("scanned_at", "DATETIME"),
        ("pickup_location", "VARCHAR"),
        ("scan_result", "JSON"),
    ],
    "user_behavior_features": [
        ("id", "INTEGER"),
        ("user_id", "INTEGER"),
        ("engagement_score", "FLOAT"),
        ("price_sensitivity_score", "FLOAT"),
        ("top_category_1", "VARCHAR"),
        ("top_category_2", "VARCHAR"),
        ("days_since_last_activity", "INTEGER"),
        ("last_updated", "DATETIME"),
    ],
    "benchmark_results": [
        ("id", "INTEGER"),
        ("model_name", "VARCHAR"),
        ("precision_at_5", "FLOAT"),
        ("precision_at_10", "FLOAT"),
        ("recall_at_5", "FLOAT"),
        ("recall_at_10", "FLOAT"),
        ("ndcg_at_5", "FLOAT"),
        ("ndcg_at_10", "FLOAT"),
        ("map_score", "FLOAT"),
        ("hit_rate", "FLOAT"),
        ("coverage", "FLOAT"),
        ("test_set_size", "INTEGER"),
        ("evaluation_time", "FLOAT"),
        ("run_at", "DATETIME"),
        ("notes", "TEXT"),
    ],
    "orders": [
        ("id", "INTEGER"),
        ("order_number", "VARCHAR"),
        ("supplier_id", "INTEGER"),
        ("group_id", "INTEGER"),
        ("group_name", "VARCHAR"),
        ("trader_count", "INTEGER"),
        ("delivery_location", "VARCHAR"),
        ("total_value", "FLOAT"),
        ("total_savings", "FLOAT"),
        ("status", "VARCHAR"),
        ("delivery_method", "VARCHAR"),
        ("scheduled_delivery_date", "DATETIME"),
        ("special_instructions", "TEXT"),
        ("created_at", "DATETIME"),
        ("updated_at", "DATETIME"),
    ],
    "order_items": [
        ("id", "INTEGER"),
        ("order_id", "INTEGER"),
        ("product_name", "VARCHAR"),
        ("quantity", "INTEGER"),
        ("unit_price", "FLOAT"),
        ("total_amount", "FLOAT"),
    ],
}


def get_existing_columns(table_name: str) -> Dict[str, str]:
    """Get existing columns and their types from a table"""
    try:
        with engine.connect() as conn:
            result = conn.execute(text(f"PRAGMA table_info({table_name})"))
            columns = {}
            for row in result.fetchall():
                col_name = row[1]
                col_type = row[2].upper()
                columns[col_name] = col_type
            return columns
    except Exception as e:
        logger.error(f"Error getting columns for {table_name}: {e}")
        return {}


def normalize_type(db_type: str) -> str:
    """Normalize database column types for comparison"""
    db_type = db_type.upper()
    
    # Map SQLite types to generic types
    type_mappings = {
        "INT": "INTEGER",
        "TINYINT": "INTEGER",
        "SMALLINT": "INTEGER",
        "MEDIUMINT": "INTEGER",
        "BIGINT": "INTEGER",
        "UNSIGNED BIG INT": "INTEGER",
        "INT2": "INTEGER",
        "INT8": "INTEGER",
        "CHARACTER": "VARCHAR",
        "NCHAR": "VARCHAR",
        "NVARCHAR": "VARCHAR",
        "CLOB": "TEXT",
        "REAL": "FLOAT",
        "DOUBLE": "FLOAT",
        "DOUBLE PRECISION": "FLOAT",
        "NUMERIC": "FLOAT",
        "DECIMAL": "FLOAT",
    }
    
    # Check for exact matches
    if db_type in type_mappings:
        return type_mappings[db_type]
    
    # Check for VARCHAR with length
    if db_type.startswith("VARCHAR") or db_type.startswith("CHARACTER"):
        return "VARCHAR"
    
    # Check for DATETIME variants
    if "DATE" in db_type or "TIME" in db_type or "TIMESTAMP" in db_type:
        return "DATETIME"
    
    # Check for BOOLEAN variants
    if db_type in ["BOOL", "BOOLEAN", "TINYINT(1)"]:
        return "BOOLEAN"
    
    return db_type


def validate_table(table_name: str, expected_columns: List[Tuple[str, str]]) -> Tuple[List[str], List[str]]:
    """
    Validate a table against expected schema
    Returns (missing_columns, extra_columns)
    """
    existing = get_existing_columns(table_name)
    
    if not existing:
        # Table doesn't exist
        return [col[0] for col in expected_columns], []
    
    expected_dict = {col[0]: normalize_type(col[1]) for col in expected_columns}
    existing_normalized = {name: normalize_type(typ) for name, typ in existing.items()}
    
    missing = []
    for col_name, col_type in expected_dict.items():
        if col_name not in existing_normalized:
            missing.append(col_name)
    
    # We don't report extra columns as errors - they might be intentional additions
    extra = [col for col in existing_normalized if col not in expected_dict]
    
    return missing, extra


def generate_migration_sql(table_name: str, missing_columns: List[str]) -> List[str]:
    """Generate SQL statements to add missing columns"""
    sql_statements = []
    
    expected_dict = {col[0]: col[1] for col in EXPECTED_SCHEMA.get(table_name, [])}
    
    for col_name in missing_columns:
        if col_name in expected_dict:
            col_type = expected_dict[col_name]
            
            # Add default values based on type
            default_clause = ""
            if col_type == "BOOLEAN":
                default_clause = " DEFAULT 0"
            elif col_type == "INTEGER" and col_name != "id":
                if "count" in col_name or "quantity" in col_name or "level" in col_name:
                    default_clause = " DEFAULT 0"
            elif col_type == "FLOAT":
                default_clause = " DEFAULT 0.0"
            
            # Special cases for certain columns
            if col_name == "is_active":
                default_clause = " DEFAULT 1"
            elif col_name == "status":
                default_clause = " DEFAULT 'pending'"
            elif col_name == "created_at" or col_name == "joined_at":
                default_clause = " DEFAULT CURRENT_TIMESTAMP"
            
            sql = f"ALTER TABLE {table_name} ADD COLUMN {col_name} {col_type}{default_clause};"
            sql_statements.append(sql)
    
    return sql_statements


def apply_migration(sql_statement: str) -> bool:
    """Apply a single migration SQL statement"""
    try:
        with engine.connect() as conn:
            conn.execute(text(sql_statement))
            conn.commit()
        return True
    except Exception as e:
        logger.error(f"Failed to execute: {sql_statement}")
        logger.error(f"Error: {e}")
        return False


def validate_database() -> Tuple[bool, Dict]:
    """
    Validate entire database schema
    Returns (is_valid, report)
    """
    logger.info("=" * 70)
    logger.info("DATABASE SCHEMA VALIDATION")
    logger.info("=" * 70)
    
    inspector = inspect(engine)
    existing_tables = inspector.get_table_names()
    
    report = {
        "valid": True,
        "missing_tables": [],
        "tables_with_issues": {},
        "migrations_applied": [],
        "total_missing_columns": 0,
    }
    
    # Check for missing tables
    for table_name in EXPECTED_SCHEMA.keys():
        if table_name not in existing_tables:
            report["missing_tables"].append(table_name)
            report["valid"] = False
            logger.warning(f"❌ Table '{table_name}' does not exist")
    
    # Validate existing tables
    for table_name, expected_columns in EXPECTED_SCHEMA.items():
        if table_name not in existing_tables:
            continue
        
        missing, extra = validate_table(table_name, expected_columns)
        
        if missing:
            report["valid"] = False
            report["tables_with_issues"][table_name] = {
                "missing_columns": missing,
                "extra_columns": extra
            }
            report["total_missing_columns"] += len(missing)
            
            logger.warning(f"\n📋 Table: {table_name}")
            logger.warning(f"   Missing columns ({len(missing)}): {', '.join(missing)}")
            
            # Generate and apply migrations
            sql_statements = generate_migration_sql(table_name, missing)
            for sql in sql_statements:
                logger.info(f"   Applying: {sql}")
                if apply_migration(sql):
                    report["migrations_applied"].append(sql)
                    logger.info(f"   ✅ Successfully added column")
                else:
                    logger.error(f"   ❌ Failed to add column")
        
        elif extra:
            # Just informational - not an error
            logger.info(f"\n📋 Table: {table_name}")
            logger.info(f"   Extra columns (informational): {', '.join(extra)}")
    
    # Final report
    logger.info("\n" + "=" * 70)
    logger.info("VALIDATION SUMMARY")
    logger.info("=" * 70)
    
    if report["valid"]:
        logger.info("✅ Database schema is valid!")
    else:
        logger.warning(f"⚠️  Found {len(report['missing_tables'])} missing tables")
        logger.warning(f"⚠️  Found {report['total_missing_columns']} missing columns")
        logger.info(f"✅ Applied {len(report['migrations_applied'])} migrations")
    
    logger.info("=" * 70)
    
    return report["valid"], report


def check_and_fix_database():
    """Main function to validate and fix database schema"""
    try:
        is_valid, report = validate_database()
        
        if report["missing_tables"]:
            logger.warning("\n⚠️  Some tables are missing. Run create_tables.py to create them:")
            logger.warning(f"   python create_tables.py")
            return False
        
        if not is_valid and report["total_missing_columns"] > 0:
            logger.info("\n✅ Database schema has been updated with missing columns")
            logger.info("   Backend can now start safely")
        
        return True
        
    except SQLAlchemyError as e:
        logger.error(f"❌ Database validation failed: {e}")
        return False
    except Exception as e:
        logger.error(f"❌ Unexpected error during validation: {e}")
        return False


if __name__ == "__main__":
    success = check_and_fix_database()
    sys.exit(0 if success else 1)
