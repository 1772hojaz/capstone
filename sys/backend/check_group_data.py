#!/usr/bin/env python3
"""Check group data in database"""
from sqlalchemy import func
from db.database import SessionLocal
from models.models import AdminGroupJoin, AdminGroup

db = SessionLocal()

# Check the Apples Group Buy (ID: 1)
group = db.query(AdminGroup).filter(AdminGroup.id == 1).first()
if group:
    print(f'Group: {group.name}')
    print(f'Price per unit: ${group.price}')
    print(f'Max participants: {group.max_participants}')
    print(f'Target amount: ${group.price * group.max_participants:.2f}')
    
    # Get all joins
    joins = db.query(AdminGroupJoin).filter(AdminGroupJoin.admin_group_id == 1).all()
    print(f'\nJoins ({len(joins)} total):')
    total_qty = 0
    for j in joins:
        print(f'  User {j.user_id}: qty={j.quantity}, paid_amount={j.paid_amount}')
        total_qty += j.quantity
    
    print(f'\nTotal quantity: {total_qty}')
    print(f'Calculated current_amount: ${total_qty * group.price:.2f}')
    print(f'Expected progress: {(total_qty * group.price) / (group.price * group.max_participants) * 100:.1f}%')
else:
    print('Group not found')

db.close()

