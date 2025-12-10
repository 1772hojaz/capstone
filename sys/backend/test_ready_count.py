#!/usr/bin/env python3
"""Test the Ready count for My Groups"""
import requests

# Login as trader
resp = requests.post('http://localhost:8000/api/auth/login', json={
    'email': 'humphrey.nyahoja@gmail.com',
    'password': 'password123'
})
token = resp.json().get('access_token')

if not token:
    print("Failed to login")
    exit(1)

# Get my groups
headers = {'Authorization': f'Bearer {token}'}
resp = requests.get('http://localhost:8000/api/groups/my-groups', headers=headers)
groups = resp.json()

print(f'Total groups: {len(groups)}')
print()

# Count by status
active = [g for g in groups if not g.get('is_completed', False)]
ready = [g for g in groups if g.get('is_completed') and g.get('status') == 'ready_for_pickup']
past = [g for g in groups if g.get('status') in ['completed', 'delivered']]

print(f'Active: {len(active)}')
print(f'Ready for pickup: {len(ready)}')
print(f'Past (completed/delivered): {len(past)}')
print()

# Show details of all groups
print('All groups:')
for g in groups:
    print(f"  - {g.get('name')}: status={g.get('status')}, is_completed={g.get('is_completed')}")

