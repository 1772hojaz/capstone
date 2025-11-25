#!/usr/bin/env python3
"""
Remove Specific Products
Remove the products: Pawpaw and Yams (Madhumbe)
"""

import sqlite3

def remove_specific_products():
    """Remove specific products by name"""
    
    products_to_remove = ['Pawpaw', 'Yams (Madhumbe)']
    
    # Connect to database
    conn = sqlite3.connect('groupbuy.db')
    cursor = conn.cursor()
    
    print("=" * 80)
    print("REMOVING SPECIFIC PRODUCTS")
    print("=" * 80)
    
    try:
        # Find the products
        placeholders = ','.join(['?'] * len(products_to_remove))
        cursor.execute(f"""
            SELECT id, name, category, image_url
            FROM products 
            WHERE name IN ({placeholders})
            ORDER BY name
        """, products_to_remove)
        
        found_products = cursor.fetchall()
        
        if not found_products:
            print("\n⚠️  No products found to remove.")
            conn.close()
            return
        
        print(f"\n📋 Found {len(found_products)} products to remove:\n")
        for prod_id, name, category, image_url in found_products:
            print(f"  ID: {prod_id:2d} | {name:<30} | {category:<15}")
        
        # Check for related records
        print("\n" + "=" * 80)
        print("CHECKING FOR RELATED RECORDS")
        print("=" * 80)
        
        product_ids = [p[0] for p in found_products]
        id_placeholders = ','.join(['?'] * len(product_ids))
        
        # Check group_buys
        cursor.execute(f"""
            SELECT COUNT(*) FROM group_buys 
            WHERE product_id IN ({id_placeholders})
        """, product_ids)
        group_buys_count = cursor.fetchone()[0]
        
        # Check supplier_products
        cursor.execute(f"""
            SELECT COUNT(*) FROM supplier_products 
            WHERE product_id IN ({id_placeholders})
        """, product_ids)
        supplier_products_count = cursor.fetchone()[0]
        
        # Check transactions
        cursor.execute(f"""
            SELECT COUNT(*) FROM transactions 
            WHERE product_id IN ({id_placeholders})
        """, product_ids)
        transactions_count = cursor.fetchone()[0]
        
        # Check admin_groups (if linked by product_id)
        cursor.execute(f"""
            SELECT COUNT(*) FROM admin_groups 
            WHERE product_id IN ({id_placeholders})
        """, product_ids)
        admin_groups_count = cursor.fetchone()[0]
        
        print(f"\n  Group Buys: {group_buys_count}")
        print(f"  Supplier Products: {supplier_products_count}")
        print(f"  Transactions: {transactions_count}")
        print(f"  Admin Groups: {admin_groups_count}")
        
        total_related = group_buys_count + supplier_products_count + transactions_count + admin_groups_count
        
        if total_related > 0:
            print(f"\n⚠️  WARNING: Found {total_related} related records!")
            print("   Removing these products will affect:")
            if group_buys_count > 0:
                print(f"   - {group_buys_count} group buy(s)")
            if supplier_products_count > 0:
                print(f"   - {supplier_products_count} supplier product listing(s)")
            if transactions_count > 0:
                print(f"   - {transactions_count} transaction(s)")
            if admin_groups_count > 0:
                print(f"   - {admin_groups_count} admin group(s)")
        else:
            print("\n✅ No related records found. Safe to delete.")
        
        # Delete the products
        print("\n" + "=" * 80)
        cursor.execute(f"""
            DELETE FROM products 
            WHERE id IN ({id_placeholders})
        """, product_ids)
        
        removed_count = cursor.rowcount
        conn.commit()
        
        print("✅ REMOVAL COMPLETE")
        print("=" * 80)
        print(f"Removed {removed_count} product(s):")
        for _, name, _, _ in found_products:
            print(f"  ✓ {name}")
        
        # Show updated count
        cursor.execute("SELECT COUNT(*) FROM products")
        remaining = cursor.fetchone()[0]
        print(f"\nRemaining products in database: {remaining}")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        conn.rollback()
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    remove_specific_products()

