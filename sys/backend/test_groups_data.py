#!/usr/bin/env python3
"""Test script to check admin groups data"""

from db.database import SessionLocal
from models.models import AdminGroup, AdminGroupJoin
from sqlalchemy import func

db = SessionLocal()

print("\n📊 Checking Admin Groups Data...\n")

# Active groups
active = db.query(AdminGroup).filter(AdminGroup.is_active).all()
print(f"✅ Active Groups: {len(active)}")
for g in active:
    print(f"   - {g.name} (ID: {g.id}, Active: {g.is_active}, Stock: {g.total_stock})")

# Check joins
print(f"\n📋 Checking Group Joins...\n")

all_groups = db.query(AdminGroup).all()
for group in all_groups:
    join_count = db.query(func.count(AdminGroupJoin.id)).filter(
        AdminGroupJoin.admin_group_id == group.id
    ).scalar() or 0
    
    total_quantity = db.query(func.sum(AdminGroupJoin.quantity)).filter(
        AdminGroupJoin.admin_group_id == group.id
    ).scalar() or 0
    
    status = "ACTIVE"
    if not group.is_active:
        status = "COMPLETED"
    elif total_quantity >= (group.total_stock or 0) and group.total_stock:
        status = "READY FOR PAYMENT"
    
    print(f"[{status}] {group.name}")
    print(f"   Joins: {join_count}, Total Qty: {total_quantity}, Stock: {group.total_stock}, Active: {group.is_active}")

# Test the ready for payment logic
print(f"\n🔍 Testing Ready for Payment Logic...\n")

total_quantity_subquery = db.query(
    AdminGroupJoin.admin_group_id,
    func.sum(AdminGroupJoin.quantity).label('total_quantity')
).group_by(AdminGroupJoin.admin_group_id).subquery()

ready_groups = db.query(AdminGroup).join(
    total_quantity_subquery,
    AdminGroup.id == total_quantity_subquery.c.admin_group_id
).filter(
    AdminGroup.is_active,
    AdminGroup.total_stock.isnot(None),
    total_quantity_subquery.c.total_quantity >= AdminGroup.total_stock
).all()

print(f"Ready for Payment Groups (should be 2): {len(ready_groups)}")
for g in ready_groups:
    print(f"   - {g.name}")

# Test completed logic
print(f"\n🔍 Testing Completed Logic...\n")

completed_groups = db.query(AdminGroup).filter(
    ~AdminGroup.is_active |
    (AdminGroup.total_stock.isnot(None) & (AdminGroup.total_stock <= 0))
).all()

print(f"Completed Groups (should be 2): {len(completed_groups)}")
for g in completed_groups:
    print(f"   - {g.name}")

db.close()
print("\n✅ Test complete!")

