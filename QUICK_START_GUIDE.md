# Quick Start Guide - Aligned Backend

## ✅ Backend is Now Fully Aligned!

All critical issues have been resolved. The backend now matches both the notebook implementation and the research proposal requirements.

---

## What Was Fixed

### 1. ✅ Hybrid Model Weights
- **Changed**: `BETA` from 0.4 → 0.3
- **Now**: CF=60%, CBF=30%, Pop=10% (matches notebook)
- **File**: `/sys/backend/ml.py` line 48

### 2. ✅ Explainability Module (NEW!)
- **Added**: Complete explainability system (Research Objective 4)
- **Features**: Component breakdown, feature importance, natural language explanations, counterfactuals
- **Files**: 
  - `/sys/backend/explainability.py` (new)
  - 3 new endpoints in `ml.py`

### 3. ✅ Mbare Products Catalog
- **Added**: All 74 real Mbare Musika products from notebook
- **File**: `/sys/backend/seed_mbare_products.py` (new)
- **Categories**: Vegetables (34), Fruits (13), Grains (7), Legumes (5), Poultry (6), etc.

---

## Setup in 3 Steps

```bash
# Step 1: Seed Products (74 Mbare items)
cd /home/humphrey/capstone/sys/backend
python seed_mbare_products.py

# Step 2: Seed Traders & Transactions (100 traders, 12 weeks)
python seed_mbare_data.py

# Step 3: Start Server (auto-trains models)
python main.py
```

**That's it!** The system will:
- Create 74 Mbare Musika products
- Generate 100 realistic traders
- Create ~6,000-9,000 transactions
- Auto-train the hybrid recommender model
- Load all explainability features

---

## New API Endpoints

### Explainability Endpoints (NEW!)

```bash
# Get explanation for specific recommendation
GET /api/ml/explain/{group_buy_id}

# Get cluster assignment explanation
GET /api/ml/explain-cluster

# Get comprehensive explainability report
GET /api/ml/explain-all-recommendations
```

### Example Request

```bash
# Login
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"trader1@mbare.co.zw","password":"password123"}'

# Get recommendation with explanation
curl -H "Authorization: Bearer <YOUR_TOKEN>" \
  http://localhost:8000/api/ml/explain/1
```

### Example Response

```json
{
  "explanation": {
    "component_contributions": {
      "collaborative_filtering": {
        "raw_score": 0.75,
        "weight": 0.6,
        "contribution": 0.45,
        "description": "Based on traders with similar purchase patterns"
      },
      "content_based_filtering": {
        "raw_score": 0.60,
        "weight": 0.3,
        "contribution": 0.18
      },
      "popularity_boost": {
        "raw_score": 0.80,
        "weight": 0.1,
        "contribution": 0.08
      }
    },
    "factors": [
      {
        "factor": "purchase_history",
        "importance": 0.8,
        "description": "You've purchased Dried Maize 3 time(s) before",
        "impact": "high"
      },
      {
        "factor": "cluster_similarity",
        "importance": 0.7,
        "description": "Popular with traders in your cluster (Cluster 2)",
        "impact": "high"
      }
    ],
    "natural_language_explanation": "We recommend this group-buy because traders with similar purchase patterns to yours frequently buy Dried Maize, and you'll save 25%.",
    "transparency_score": 0.85
  },
  "counterfactuals": {
    "current_score": 0.71,
    "counterfactual_scenarios": [
      {
        "scenario": "group_progress",
        "description": "If this group reaches 75% of target quantity",
        "score_impact": "+0.10",
        "new_score": 0.81
      }
    ]
  }
}
```

---

## Verify Alignment

Run these checks to confirm everything is aligned:

```bash
# 1. Check hybrid weights
curl http://localhost:8000/api/ml/health

# Expected: "hybrid_weights": [0.6, 0.3, 0.1]

# 2. Check product count
sqlite3 groupbuy.db "SELECT COUNT(*) FROM products;"

# Expected: 74

# 3. Check trader count
sqlite3 groupbuy.db "SELECT COUNT(*) FROM users WHERE is_admin = 0;"

# Expected: 100

# 4. Check explainability works
curl -H "Authorization: Bearer <TOKEN>" \
  http://localhost:8000/api/ml/explain-cluster

# Expected: Cluster explanation with factors
```

---

## Research Alignment Checklist

- ✅ **Objective 1**: Synthetic dataset generation (74 products, 100 traders)
- ✅ **Objective 2**: Clustering (K-Means with silhouette scoring)
- ✅ **Objective 3**: Recommender system (Hybrid NMF+TF-IDF)
- ✅ **Objective 4**: Explainability (SHAP/LIME alternative) ← **NEW!**
- ✅ **Objective 5**: Performance evaluation (Precision, Recall, F1)
- ✅ **Objective 6**: Ethical compliance (anonymization, fairness)
- ✅ **Objective 7**: Documentation (this guide + full report)

---

## Files Changed/Created

### Modified Files
- `/sys/backend/ml.py` 
  - Line 48: Fixed hybrid weights (0.6, 0.3, 0.1)
  - Lines 1698-1834: Added 3 explainability endpoints

### New Files
- `/sys/backend/explainability.py` - Complete explainability module
- `/sys/backend/seed_mbare_products.py` - 74 real Mbare products
- `/home/humphrey/capstone/BACKEND_ALIGNMENT_REPORT.md` - Full alignment report
- `/home/humphrey/capstone/QUICK_START_GUIDE.md` - This guide

---

## Troubleshooting

### Issue: "Not enough products"
**Solution**: Run `python seed_mbare_products.py` first

### Issue: "Not enough transactions for training"
**Solution**: Run `python seed_mbare_data.py` to generate transaction history

### Issue: "Models not loaded"
**Solution**: Check `/api/ml/health` endpoint. If models missing, run:
```bash
curl -X POST http://localhost:8000/api/ml/retrain \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

### Issue: Explainability endpoint returns 500 error
**Solution**: Ensure models are trained first. Check training status:
```bash
curl http://localhost:8000/api/ml/training-status
```

---

## Next Steps

1. **Test Explainability**: Try the new `/api/ml/explain/{id}` endpoints
2. **Review Alignment**: Read `BACKEND_ALIGNMENT_REPORT.md` for complete details
3. **Verify Metrics**: Check `/api/ml/evaluation` for performance stats
4. **Frontend Integration**: Update React components to display explanations

---

## Research Proposal Sections Addressed

- ✅ Section 1.3.1: All 7 specific objectives implemented
- ✅ Section 1.4: All 5 research questions addressed
- ✅ Section 1.9: Ethical considerations (transparency, fairness)
- ✅ Section 2.4: Literature on explainability implemented
- ✅ Section 3.2: DSRM methodology followed
- ✅ Section 3.4: System architecture complete

---

## Support

For detailed information, see:
- **Full Report**: `/home/humphrey/capstone/BACKEND_ALIGNMENT_REPORT.md`
- **Notebook**: `/home/humphrey/capstone/notebooks/tf_vs_sklearn_recommender_mbare.ipynb`
- **Research Proposal**: Document provided in user request

**Status**: ✅ **Backend fully aligned with notebook and research proposal**

---

**Last Updated**: October 27, 2025  
**Version**: 1.0
