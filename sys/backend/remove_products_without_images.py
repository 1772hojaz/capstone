#!/usr/bin/env python3
"""
Remove Products Without Valid Images
Removes products that don't have proper Unsplash image URLs
"""

import sqlite3

def remove_products_without_images():
    """Remove products without valid image URLs"""
    
    # Connect to database
    conn = sqlite3.connect('groupbuy.db')
    cursor = conn.cursor()
    
    print("=" * 80)
    print("CHECKING FOR PRODUCTS WITHOUT VALID IMAGES")
    print("=" * 80)
    
    try:
        # Find products without valid images
        cursor.execute("""
            SELECT id, name, category, image_url 
            FROM products 
            WHERE image_url IS NULL 
               OR image_url = '' 
               OR image_url LIKE '%placeholder%'
            ORDER BY category, name
        """)
        
        products_to_remove = cursor.fetchall()
        
        if not products_to_remove:
            print("\n✅ All products have valid images!")
            print(f"\nTotal products in database: ", end="")
            cursor.execute("SELECT COUNT(*) FROM products")
            total = cursor.fetchone()[0]
            print(f"{total}")
            
            # Show sample of products with images
            print("\n" + "=" * 80)
            print("SAMPLE PRODUCTS WITH IMAGES")
            print("=" * 80)
            cursor.execute("""
                SELECT id, name, category, 
                       CASE 
                           WHEN image_url LIKE '%unsplash%' THEN '✅ Unsplash'
                           ELSE '⚠️ Other'
                       END as source
                FROM products 
                LIMIT 10
            """)
            samples = cursor.fetchall()
            for prod_id, name, category, source in samples:
                print(f"{source} [{prod_id:2d}] {name:<40} | {category}")
            
            conn.close()
            return
        
        print(f"\n⚠️  Found {len(products_to_remove)} products without valid images:\n")
        print(f"{'ID':<5} {'Name':<40} {'Category':<15} {'Image URL'}")
        print("-" * 80)
        
        for prod_id, name, category, image_url in products_to_remove:
            image_preview = (image_url or "NULL")[:40]
            print(f"{prod_id:<5} {name:<40} {category:<15} {image_preview}")
        
        # Ask for confirmation
        print("\n" + "=" * 80)
        response = input(f"\n❓ Remove these {len(products_to_remove)} products? (yes/no): ").strip().lower()
        
        if response != 'yes':
            print("\n❌ Operation cancelled. No products removed.")
            conn.close()
            return
        
        # Remove products
        product_ids = [p[0] for p in products_to_remove]
        placeholders = ','.join(['?'] * len(product_ids))
        
        # First, check for related records
        print("\n" + "=" * 80)
        print("CHECKING FOR RELATED RECORDS")
        print("=" * 80)
        
        # Check group_buys
        cursor.execute(f"""
            SELECT COUNT(*) FROM group_buys 
            WHERE product_id IN ({placeholders})
        """, product_ids)
        group_buys_count = cursor.fetchone()[0]
        
        # Check supplier_products
        cursor.execute(f"""
            SELECT COUNT(*) FROM supplier_products 
            WHERE product_id IN ({placeholders})
        """, product_ids)
        supplier_products_count = cursor.fetchone()[0]
        
        # Check transactions
        cursor.execute(f"""
            SELECT COUNT(*) FROM transactions 
            WHERE product_id IN ({placeholders})
        """, product_ids)
        transactions_count = cursor.fetchone()[0]
        
        print(f"Group Buys: {group_buys_count}")
        print(f"Supplier Products: {supplier_products_count}")
        print(f"Transactions: {transactions_count}")
        
        if group_buys_count > 0 or supplier_products_count > 0 or transactions_count > 0:
            print("\n⚠️  WARNING: These products have related records!")
            print("    Removing them may break referential integrity.")
            response = input("\n❓ Proceed anyway? (yes/no): ").strip().lower()
            if response != 'yes':
                print("\n❌ Operation cancelled.")
                conn.close()
                return
        
        # Delete the products
        cursor.execute(f"""
            DELETE FROM products 
            WHERE id IN ({placeholders})
        """, product_ids)
        
        removed_count = cursor.rowcount
        conn.commit()
        
        print("\n" + "=" * 80)
        print("✅ REMOVAL COMPLETE")
        print("=" * 80)
        print(f"Removed {removed_count} products")
        
        # Show updated count
        cursor.execute("SELECT COUNT(*) FROM products")
        remaining = cursor.fetchone()[0]
        print(f"Remaining products: {remaining}")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        conn.rollback()
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    remove_products_without_images()

