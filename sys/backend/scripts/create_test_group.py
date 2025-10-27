import sys
sys.path.append('.')
from db.database import get_db
from models import AdminGroup
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

# Check existing groups
db = next(get_db())
groups = db.query(AdminGroup).all()
print(f'Found {len(groups)} groups in database')

for group in groups:
    print(f'Group {group.id}: {group.name}, participants: {group.participants}/{group.max_participants}')

if not groups:
    print('No groups found, creating a test group...')

    # Create a test group
    test_group = AdminGroup(
        name='Cooking Oil 25L',
        description='Refined sunflower cooking oil',
        long_description='Premium cooking oil perfect for bulk purchasing',
        category='Groceries',
        price=65.00,
        original_price=80.00,
        image='/uploads/cooking_oil.jpg',
        max_participants=50,
        end_date=datetime.utcnow() + timedelta(days=10),
        admin_name='ConnectSphere Admin',
        shipping_info='Free shipping when group goal is reached',
        estimated_delivery='2-3 weeks after group completion',
        features=['Bulk pricing', 'Quality guaranteed', 'Group savings'],
        requirements=['Minimum 50 participants required', 'Full payment required to join']
    )

    db.add(test_group)
    db.commit()
    db.refresh(test_group)
    print(f'Created test group with ID: {test_group.id}')
    print(f'Savings: ${test_group.savings}, Discount: {test_group.discount_percentage}%')

db.close()