# Database Seeding Guide

## Admin Groups Seeding

The `seed_admin_groups.py` script populates the database with sample admin-created group buys featuring Zimbabwe products.

### Usage

**Basic seeding (skips if groups exist):**
```bash
python seed_admin_groups.py
```

**Clear existing groups and reseed:**
```bash
python seed_admin_groups.py --clear
```

or

```bash
python seed_admin_groups.py -c
```

### What Gets Seeded

The script creates 9 admin groups across different categories:

#### Active Groups (5):
1. **Mealie Meal 10kg Bags** - Cooking Essentials
2. **Mazoe Orange Crush 2L** - Beverages
3. **Chitenge Fabric 6 Yards** - Clothing & Textiles
4. **Compound D Fertilizer 50kg** - Seeds & Fertilizers
5. **Stone Sculptures** - Arts & Crafts

#### Ready for Payment (2):
1. **Exercise Books 48 Pages** - Stationery & Books
2. **Geisha Bath Soap 100g** - Household Items

#### Completed Groups (2):
1. **Kapenta (Dried Fish) 5kg** - Fish & Kapenta
2. **Charcoal 20kg Bags** - Fuel & Energy

### Features

- ✅ Realistic Zimbabwe product data
- ✅ Proper categorization using Zimbabwe-specific categories
- ✅ Different group states (active, ready for payment, completed)
- ✅ Cloudinary-compatible image URLs
- ✅ Detailed product information (manufacturer, stock, features, requirements)
- ✅ Proper date handling (past dates for completed, future for active)
- ✅ **Automatic trader creation** - Creates 100 traders if needed
- ✅ **Group joins** - Creates `AdminGroupJoin` records for ready and completed groups
- ✅ **Realistic participation** - Distributes stock quantities across participants

### What Happens During Seeding

1. **Checks for admin user** - Creates one if missing
2. **Checks for traders** - Creates up to 100 traders for group joins
3. **Creates active groups** - 5 groups with `is_active=True`
4. **Creates ready for payment groups** - 2 groups with:
   - `is_active=True`
   - Full participant joins
   - Total quantity purchased >= total_stock
5. **Creates completed groups** - 2 groups with:
   - `is_active=False`
   - Full participant joins showing successful completion

### Prerequisites

- Admin user (created automatically if missing)
- Traders (created automatically if < 100)
- Database tables must be created (run migrations first)

### Notes

- The script checks for existing admin groups before seeding
- Use `--clear` flag to remove all existing admin groups before seeding
- The frontend no longer uses mock data and relies entirely on the database

### Related Files

- **Frontend:** `sys/Front-end/connectsphere/src/pages/GroupModeration.tsx` - Displays the groups
- **Backend:** `sys/backend/models/groups.py` - Admin group endpoints
- **Models:** `sys/backend/models/models.py` - AdminGroup model definition

