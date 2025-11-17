# How New Traders Get Recommendations (User Cold Start)

## Overview
This document explains how the recommendation system handles **new traders** who have **no purchase history** - the "user cold start" problem.

## The Challenge
When a new trader signs up, they have:
- ❌ No transaction history
- ❌ No behavioral data
- ❌ Not in the trained ML models
- ❌ No collaborative filtering signal

Without special handling, they would get **no recommendations** or only **generic popular items**.

## The Solution: User Similarity-Based Recommendations

### 📋 Step 1: Collect Preferences During Registration
When a new trader signs up, they provide:

```python
# User Model - Registration Preferences (lines 40-45)
preferred_categories = Column(JSON, default=list)          # e.g., ["Vegetables", "Grains", "Legumes"]
budget_range = Column(String, default="medium")           # low, medium, high
experience_level = Column(String, default="beginner")     # beginner, intermediate, advanced
preferred_group_sizes = Column(JSON, default=list)        # ["small", "medium", "large"]
participation_frequency = Column(String, default="occasional")  # occasional, regular, frequent
```

These preferences are collected through the registration UI and stored in the database.

### 🔍 Step 2: Find Similar Existing Traders
The system calculates **user similarity** using multiple factors:

```python
# ml/ml.py - calculate_user_similarity() (lines 1641-1702)

1. Preferred Categories (weight: 30%)
   - Uses Jaccard similarity: intersection / union
   - Example: ["Vegetables", "Grains"] vs ["Vegetables", "Fruits"]
   - Score: 1/3 = 0.333

2. Budget Range (weight: 20%)
   - Compares: low (1), medium (2), high (3)
   - Closer budgets = higher similarity

3. Experience Level (weight: 15%)
   - Compares: beginner (1), intermediate (2), advanced (3)
   - Similar experience = higher similarity

4. Preferred Group Sizes (weight: 25%)
   - Uses Jaccard similarity on size preferences
   - Example: ["small", "medium"] vs ["medium", "large"]

5. Participation Frequency (weight: 10%)
   - Compares: occasional (1), regular (2), frequent (3)
   - Similar engagement patterns = higher similarity
```

**Final Similarity Score**: Weighted average of all factors (0-1 scale)

Only users with **similarity > 0.3** are considered "similar enough" to generate recommendations from.

### 🎯 Step 3: Recommend What Similar Traders Joined
The system:
1. Finds the top 50 most similar traders
2. Looks at which **active group buys** they've joined
3. Scores each group based on:
   - **Average similarity** of traders who joined (base score)
   - **Number of similar traders** who joined (+0.2 max boost)
   - **MOQ progress** (+0.05 if 50%+, +0.1 if 75%+)
   - **Deadline urgency** (+0.05 if ≤3 days remaining)

### 📊 Step 4: Generate Personalized Recommendations

```python
# ml/ml.py - get_similarity_based_recommendations() (lines 938-1063)

Example recommendation:
{
    "group_buy_id": 15,
    "product_name": "Fresh Tomatoes - 5kg",
    "category": "Vegetables",
    "recommendation_score": 0.78,
    "reason": "Similar traders joined this group, 3 similar traders participated, Good progress toward target",
    "is_cold_start": true
}
```

## Flow Diagram

```
NEW TRADER REGISTERS
        |
        v
Provides Preferences
(categories, budget, etc.)
        |
        v
        NO PURCHASE HISTORY? ──YES──> Use Similarity-Based Recommendations
        |                                       |
        NO                                      v
        |                              Find Similar Traders
        v                              (similarity > 0.3)
Use ML Models                                  |
(Collaborative Filtering)                      v
                                Get Groups Similar Traders Joined
                                               |
                                               v
                                Score Based on:
                                - Similarity strength
                                - Number of similar joiners
                                - Group metrics
                                               |
                                               v
                                Return Top 10 Recommendations
```

## Implementation Details

### Trigger Condition
```python
# ml/ml.py - get_recommendations_for_user() (lines 636-645)

if user.id not in user_ids:
    print(f"[WARNING] User {user.id} not in training data, checking transaction history")
    
    user_transactions = db.query(Transaction).filter(Transaction.user_id == user.id).count()
    
    if user_transactions == 0:
        print(f"[WARNING] User {user.id} has no transaction history, using similarity-based recommendations")
        return get_similarity_based_recommendations(user, db, active_groups)
```

### Key Functions
1. **`calculate_user_similarity(user1, user2)`** - Computes similarity score between two users
2. **`get_similarity_based_recommendations(user, db, active_groups)`** - Generates recommendations for new users
3. **`get_recommendations_for_user(user, db)`** - Main entry point that routes to appropriate strategy

## Advantages

✅ **Immediate Personalization**: New traders get relevant recommendations from day 1  
✅ **No Cold Start**: Leverages existing user behavior through similarity  
✅ **Leverages Registration Data**: Preferences collected during signup are immediately useful  
✅ **Smooth Transition**: As user gains history, system gradually shifts to ML-based recommendations  
✅ **Collaborative Filtering Without History**: Uses "users like you" approach  

## Transition to ML-Based Recommendations

As a new trader starts making purchases:
1. After **1st purchase** → Still uses similarity-based (minimal data)
2. After **2-3 purchases** → System has enough transaction history
3. After **next ML retraining** → User is included in collaborative filtering models
4. **Future requests** → Uses full hybrid ML approach (NMF + TF-IDF + Popularity)

This creates a **smooth cold-start to warm-start transition**.

## Comparison: New Products vs. New Traders

| Aspect | New Products (Item Cold Start) | New Traders (User Cold Start) |
|--------|--------------------------------|-------------------------------|
| **Problem** | Product not in ML model | User not in ML model |
| **Solution** | `ColdStartHandler` (metadata-based) | User Similarity (collaborative) |
| **Data Used** | Category, price, group metrics | Preferences, similar user behavior |
| **Handler** | `ml/cold_start_handler.py` | `get_similarity_based_recommendations()` |
| **Fallback** | Category matching + price | Similar trader's group joins |

Both work together to ensure **no user ever sees poor recommendations**, regardless of how new they or the products are!

## Testing

Run the test:
```bash
python test/test_new_trader_recommendations.py
```

This test:
1. Creates a brand new trader with preferences
2. Finds similar existing traders
3. Gets recommendations based on what similar traders joined
4. Validates personalization quality

## Configuration

Similarity threshold (minimum similarity to consider):
```python
if similarity > 0.3:  # Only consider users with reasonable similarity
```

To adjust, modify this threshold in `ml/ml.py` line 954.

## Future Enhancements

1. **Hybrid Cold Start**: Combine similarity-based with popular items in user's preferred categories
2. **Category-Specific Popularity**: If no similar users, fall back to "popular in Vegetables" (user's top category)
3. **Progressive Learning**: Update user similarity in real-time as they interact with groups
4. **Cross-Zone Recommendations**: Consider similar traders from other zones if local similarity is low

---

**Last Updated**: November 17, 2025  
**Status**: ✅ Production Ready

