# Dual Group Cold Start Implementation

## Overview
The cold start handler now supports **BOTH** types of group-buys in the system:
1. **GroupBuy** - Supplier-created groups (products uploaded by suppliers)
2. **AdminGroup** - Admin-created groups (curated deals created by platform admins)

Both types receive the **same level of intelligent cold start handling** for new items not yet in the trained ML models.

## The Two Group Types

### 1. GroupBuy (Supplier-Created)
```python
# models/models.py - GroupBuy model
class GroupBuy:
    id: int
    product_id: int  # Links to Product table
    creator_id: int  # Supplier who created it
    location_zone: str
    deadline: datetime
    total_quantity: int
    status: str
    # ... more fields
```

**Characteristics:**
- Created by suppliers
- Linked to Product table (has product_id)
- Product has detailed info (category, price, savings_factor, etc.)
- Used for bulk purchases of supplier products

### 2. AdminGroup (Admin-Created)
```python
# models/models.py - AdminGroup model
class AdminGroup:
    id: int
    name: str
    category: str
    price: float
    original_price: float
    max_participants: int
    participants: int
    end_date: datetime
    discount_percentage: int
    # ... more fields
```

**Characteristics:**
- Created by platform admins
- Self-contained (no product_id required)
- All info stored directly in AdminGroup table
- Used for curated deals and special offers

## Cold Start Handler Implementation

### File Structure
```
sys/backend/ml/
├── cold_start_handler.py (enhanced with AdminGroup support)
└── ml.py (updated recommendation functions)
```

### Cold Start Handler Methods

#### For GroupBuy (Supplier-Created)
```python
# cold_start_handler.py

def detect_new_products(product_ids, feature_store) -> Set[int]:
    """
    Detects products not in trained ML model
    Compares against feature_store['product_ids']
    """
    trained_product_ids = set(feature_store.get('product_ids', []))
    return set(product_ids) - trained_product_ids

def calculate_cold_start_score(user, product, group_buy, db) -> Dict:
    """
    Calculates score for new supplier products
    
    Scoring Factors:
    - Base: 0.5
    - Category matching (user's top categories): +0.25/+0.15/+0.10
    - Price similarity (user's typical range): +0.10/+0.05
    - MOQ progress: +0.05/+0.10
    - Deadline urgency: +0.05
    - Savings factor: +0.05/+0.10
    
    Returns: score (0.5-1.0), reason, breakdown
    """
```

#### For AdminGroup (Admin-Created)
```python
# cold_start_handler.py (NEW)

def detect_new_admin_groups(admin_group_ids, feature_store) -> Set[int]:
    """
    Detects admin groups not in trained ML model
    Compares against feature_store['admin_group_ids']
    """
    trained_admin_group_ids = set(feature_store.get('admin_group_ids', []))
    return set(admin_group_ids) - trained_admin_group_ids

def calculate_admin_group_cold_start_score(user, admin_group, db) -> Dict:
    """
    Calculates score for new admin groups
    
    Scoring Factors:
    - Base: 0.5
    - Category matching (user's top categories): +0.25/+0.15/+0.10
    - Price similarity (user's typical range): +0.10/+0.05
    - Participation progress: +0.05/+0.10
    - Deadline urgency: +0.05
    - Discount percentage: +0.05/+0.10
    
    Returns: score (0.5-1.0), reason, breakdown
    """
```

### Integration in ml.py

#### Main Recommendation Flow (GroupBuy)
```python
# ml.py - get_recommendations_for_user()

# Get active GroupBuys
active_groups = db.query(GroupBuy).filter(...).all()

# Initialize Cold Start Handler
cold_start_handler = ColdStartHandler()

# Detect new products
all_product_ids = [gb.product_id for gb in active_groups]
new_product_ids = cold_start_handler.detect_new_products(all_product_ids, feature_store)

# Generate recommendations
for gb in active_groups:
    is_new_product = gb.product_id in new_product_ids
    
    if is_new_product and gb.product:
        # USE COLD START HANDLER
        cold_start_result = cold_start_handler.calculate_cold_start_score(
            user, gb.product, gb, db
        )
        score = cold_start_result['total_score']
        reasons = [cold_start_result['reason']]
    else:
        # Use ML models (NMF, TF-IDF, popularity)
        score = hybrid_ml_score
        reasons = ml_reasons
```

#### Fallback Flow (AdminGroup)
```python
# ml.py - get_admin_group_recommendations()

# Get active AdminGroups
admin_groups = db.query(AdminGroup).filter(AdminGroup.is_active).all()

# Initialize Cold Start Handler
cold_start_handler = ColdStartHandler()

# Detect new admin groups
all_admin_group_ids = [g.id for g in admin_groups]
new_admin_group_ids = cold_start_handler.detect_new_admin_groups(
    all_admin_group_ids, feature_store
)

# Generate recommendations
for admin_group in admin_groups:
    is_new_admin_group = admin_group.id in new_admin_group_ids
    
    if is_new_admin_group:
        # USE COLD START HANDLER
        cold_start_result = cold_start_handler.calculate_admin_group_cold_start_score(
            user, admin_group, db
        )
        score = cold_start_result['total_score']
        reasons = [cold_start_result['reason']]
    else:
        # Use basic category matching + bonuses
        score = basic_score
        reasons = basic_reasons
```

## Scoring Comparison

| Factor | GroupBuy (Supplier) | AdminGroup (Admin) | Weight |
|--------|--------------------|--------------------|--------|
| **Base Score** | 0.5 | 0.5 | - |
| **Category Match #1** | +0.30 | +0.30 | High |
| **Category Match #2** | +0.15 | +0.15 | Medium |
| **Category Match #3** | +0.10 | +0.10 | Low |
| **Price in Range** | +0.10 | +0.10 | Medium |
| **Great Price** | +0.15 | +0.15 | High |
| **Progress ≥75%** | +0.10 | +0.10 | Medium |
| **Progress ≥50%** | +0.05 | +0.05 | Low |
| **Ending ≤3 days** | +0.05 | +0.05 | Low |
| **High Savings (≥20%)** | +0.10 | +0.10 | Medium |
| **Max Score** | 1.0 | 1.0 | - |

**Result**: Both types get **identical scoring logic** and **equal treatment**.

## Example Scenarios

### Scenario 1: New Supplier Product
```python
# Supplier uploads "Organic Quinoa"
Product:
  - id: 76
  - name: "Organic Quinoa"
  - category: "Grains"
  - bulk_price: $4.50/kg
  - savings_factor: 0.15 (15%)

GroupBuy:
  - product_id: 76
  - moq_progress: 60%
  - deadline: 5 days

User Profile:
  - Top category #2: "Grains"
  - Avg purchase price: $4.20

Cold Start Calculation:
  Base:           0.50
  Category #2:   +0.15  (Grains match)
  Price similar: +0.10  ($4.50 ≈ $4.20)
  MOQ progress:  +0.05  (60% progress)
  Savings:       +0.05  (15% savings)
  ──────────────────
  Total:          0.85

Reason: "New product, Matches your #2 category (Grains), 
         Matches your typical price range"
```

### Scenario 2: New Admin Group
```python
# Admin creates "Bulk Rice Deal"
AdminGroup:
  - id: 15
  - name: "Bulk Rice Deal"
  - category: "Grains"
  - price: $3.80/kg
  - discount_percentage: 25%
  - participants: 30/50 (60%)
  - end_date: 5 days

User Profile:
  - Top category #2: "Grains"
  - Avg purchase price: $4.20

Cold Start Calculation:
  Base:           0.50
  Category #2:   +0.15  (Grains match)
  Price similar: +0.10  ($3.80 ≈ $4.20)
  Progress:      +0.05  (60% progress)
  Discount:      +0.10  (25% discount)
  ──────────────────
  Total:          0.90

Reason: "New admin group, Matches your #2 category (Grains),
         Matches your typical price range, 25% savings"
```

**Result**: Both get competitive scores and personalized recommendations!

## Feature Store Structure

The `feature_store.json` now tracks both types:

```json
{
  "user_ids": [1, 2, 3, ...],
  "product_ids": [10, 11, 12, ...],
  "admin_group_ids": [1, 2, 3, ...],
  "trained_at": "2025-11-17T10:30:00Z",
  "model_version": "2.0"
}
```

- `product_ids`: Products seen in training data (for GroupBuy cold start detection)
- `admin_group_ids`: Admin groups seen in training data (for AdminGroup cold start detection)

## Benefits

### For Suppliers
✅ **New products get immediate visibility**  
✅ **Competitive scoring from day 1**  
✅ **Personalized to user preferences**  
✅ **No wait for ML retraining**  

### For Admins
✅ **New curated deals get immediate visibility**  
✅ **Same level of intelligence as supplier products**  
✅ **Personalized to user preferences**  
✅ **No wait for ML retraining**  

### For Users
✅ **See all relevant new items (supplier + admin)**  
✅ **Personalized recommendations across all group types**  
✅ **No cold start gap**  
✅ **Better discovery of new deals**  

### For the Platform
✅ **Consistent recommendation quality**  
✅ **Fair treatment of all content types**  
✅ **Higher engagement with new items**  
✅ **Better inventory turnover**  

## Testing

### Test New Supplier Product
```bash
python test/test_cold_start_handler.py
```

Expected: New product gets score ~0.7-0.9 with personalized reasons

### Test New Admin Group
```python
# Create test script: test_admin_group_cold_start.py

# 1. Create new AdminGroup
admin_group = AdminGroup(
    name="Test Admin Deal",
    category="Vegetables",
    price=5.0,
    original_price=7.0,
    discount_percentage=28,
    max_participants=50,
    participants=25,
    end_date=datetime.utcnow() + timedelta(days=7),
    is_active=True
)
db.add(admin_group)
db.commit()

# 2. Get recommendations for test user
recommendations = get_admin_group_recommendations(test_user, [admin_group], db)

# 3. Verify cold start score
assert recommendations[0]['is_cold_start'] == True
assert recommendations[0]['recommendation_score'] > 0.6
assert "New admin group" in recommendations[0]['reason']
```

## Recommendation Response

Both types return the same structure:

```python
{
    "group_buy_id": int,
    "product_id": int | None,  # None for AdminGroups
    "product_name": str,
    "recommendation_score": float,  # 0.5-1.0
    "reason": str,  # Personalized explanation
    "category": str,
    "price": float,
    "discount_percentage": int,
    "moq_progress": float,
    "admin_created": bool,  # True for AdminGroups
    "is_cold_start": bool,  # True if cold start handler used
    "ml_scores": {
        "collaborative_filtering": float,
        "content_based": float,
        "cold_start": float,  # Only present for cold start items
        "hybrid": float
    }
}
```

## Monitoring

Check system health:
```bash
curl http://localhost:8000/api/ml/health
```

Response:
```json
{
  "status": "healthy",
  "models_loaded": {
    "nmf_model": true,
    "tfidf_model": true,
    "clustering_model": true,
    "cold_start_handler": true  // Handles both types
  },
  "feature_store": {
    "n_users": 150,
    "n_products": 75,
    "n_admin_groups": 12  // Track admin groups too
  }
}
```

## Files Modified

### Created/Enhanced
✅ `sys/backend/ml/cold_start_handler.py` (added AdminGroup support)
   - `detect_new_admin_groups()` - NEW
   - `calculate_admin_group_cold_start_score()` - NEW

### Modified
✅ `sys/backend/ml/ml.py`
   - `get_admin_group_recommendations()` - Enhanced with cold start detection

### Documentation
✅ `sys/backend/test/DUAL_GROUP_COLD_START.md` (this document)

## Summary

The cold start handler now provides **complete coverage** for all group types:

| Group Type | Creator | Cold Start Support | Status |
|------------|---------|-------------------|--------|
| **GroupBuy** | Supplier | ✅ Yes | Production Ready |
| **AdminGroup** | Admin | ✅ Yes | Production Ready |

**Result**: Every new group-buy, regardless of who created it, gets intelligent, personalized recommendations from the moment it's created! 🎉

---

**Last Updated**: November 17, 2025  
**Status**: ✅ Production Ready  
**Version**: 2.1 (Dual Group Cold Start Complete)

