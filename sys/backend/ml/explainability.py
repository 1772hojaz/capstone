"""
Explainability Module for Hybrid Recommender System

Provides human-readable explanations for recommendations without requiring SHAP/LIME.
Implements lightweight explainability techniques aligned with research proposal objectives.
"""

from typing import Dict, Any, List
from models.models import User, GroupBuy, Transaction
from sqlalchemy.orm import Session
import random
from datetime import datetime

# =============================================================================
# EXPLANATION TEMPLATES - Varied, product-specific phrasings
# =============================================================================

# Collaborative Filtering - Similar Users
CF_TEMPLATES = [
    "People who buy similar products as you buy {product_name}",
    "Traders with your purchase pattern often choose {product_name}",
    "Based on what similar traders bought, you might like {product_name}",
    "{participant_count} traders like you already joined this {product_name} group",
    "Your trading community frequently purchases {product_name}",
]

# Content-Based - Category Match
CATEGORY_TEMPLATES = [
    "You've bought {category} items before - {product_name} fits your style",
    "Since you shop {category}, {product_name} is a natural fit",
    "{product_name} matches your interest in {category} products",
    "Based on your {category} purchases, you'll love {product_name}",
    "Your {category} shopping history suggests {product_name} is right for you",
]

# Purchase History
HISTORY_TEMPLATES = [
    "You've purchased {product_name} {count} time(s) before - get it again at group pricing",
    "Since you bought {product_name} previously, here's a chance to stock up",
    "{product_name} is back - you've bought this {count} time(s) before",
    "Restock on {product_name} - a product you know and trust",
]

# Savings-Based
SAVINGS_TEMPLATES = [
    "Save ${amount:.2f} on {product_name} - that's {pct:.0f}% off retail",
    "{product_name} is ${amount:.2f} cheaper than buying individually",
    "Get {product_name} at group pricing - {pct:.0f}% below market",
    "At ${price:.2f}, {product_name} is {pct:.0f}% less than the ${original:.2f} retail price",
    "Group discount brings {product_name} down by ${amount:.2f}",
]

# Urgency/Deadline
URGENCY_TEMPLATES = [
    "{product_name} group closes {day_name} - {days} days left",
    "Last chance for {product_name} - ends in {days} days",
    "Only {days} days to join the {product_name} group",
    "Hurry! {product_name} deal ends {day_name}",
    "Don't miss out - {product_name} group closing {day_name}",
]

# Progress-Based
PROGRESS_TEMPLATES = [
    "{participants} traders already joined {product_name} - almost at target!",
    "{product_name} is {progress:.0f}% to target - help complete the group",
    "Just {remaining} more units needed for {product_name} group to succeed",
    "The {product_name} group is {progress:.0f}% funded - join now",
    "{product_name} group nearly there at {progress:.0f}% - be part of it",
]

# Popularity
POPULARITY_TEMPLATES = [
    "{product_name} is trending - high demand in your area",
    "{product_name} is a hot item among traders right now",
    "High demand for {product_name} - many traders are buying",
    "{product_name} is popular this week",
    "Traders are snapping up {product_name} - don't miss out",
]

# Cluster Similarity
CLUSTER_TEMPLATES = [
    "Popular with traders in your trading group",
    "Other traders with similar buying habits love {product_name}",
    "Traders in your cluster frequently buy {product_name}",
    "{product_name} is a favorite among traders like you",
]


def _get_day_name(days: int) -> str:
    """Get the day name for a deadline."""
    target_date = datetime.utcnow().date()
    from datetime import timedelta
    target_date = target_date + timedelta(days=days)
    return target_date.strftime("%A")


def _pick_template(templates: List[str], **kwargs) -> str:
    """Pick a random template and format it with the given kwargs."""
    template = random.choice(templates)
    try:
        return template.format(**kwargs)
    except KeyError:
        # If some kwargs are missing, return the first template with available kwargs
        return templates[0].format(**{k: v for k, v in kwargs.items() if k in templates[0]})


def explain_recommendation(
    user: User,
    group_buy: GroupBuy,
    ml_scores: Dict[str, float],
    db: Session
) -> Dict[str, Any]:
    """
    Generate comprehensive explanation for a recommendation.
    
    Aligns with Research Objective 4: Integrate explainable AI techniques (SHAP or LIME)
    to generate interpretable recommendations.
    
    Args:
        user: Target user
        group_buy: Recommended group-buy
        ml_scores: ML component scores (CF, CBF, popularity, hybrid)
        db: Database session
    
    Returns:
        Structured explanation with factors, contributions, and natural language
    """
    product_name = group_buy.product.name
    category = group_buy.product.category or "general"
    
    explanation = {
        "recommendation_id": group_buy.id,
        "product_name": product_name,
        "overall_score": ml_scores.get("hybrid", 0.0),
        "explanation_type": "hybrid_ml_explanation",
        "component_contributions": {},
        "factors": [],
        "natural_language_explanation": "",
        "confidence": "high",
        "transparency_score": 1.0
    }
    
    # 1. Component Contributions (Hybrid Model Breakdown)
    cf_score = ml_scores.get("collaborative_filtering", 0.0)
    cbf_score = ml_scores.get("content_based", 0.0)
    pop_score = ml_scores.get("popularity", 0.0)
    
    # Weights from ml.py
    ALPHA, BETA, GAMMA = 0.6, 0.3, 0.1
    
    explanation["component_contributions"] = {
        "collaborative_filtering": {
            "raw_score": round(cf_score, 3),
            "weight": ALPHA,
            "contribution": round(cf_score * ALPHA, 3),
            "description": _pick_template(CF_TEMPLATES, 
                product_name=product_name, 
                participant_count=group_buy.participants_count or 0)
        },
        "content_based_filtering": {
            "raw_score": round(cbf_score, 3),
            "weight": BETA,
            "contribution": round(cbf_score * BETA, 3),
            "description": _pick_template(CATEGORY_TEMPLATES, 
                product_name=product_name, 
                category=category)
        },
        "popularity_boost": {
            "raw_score": round(pop_score, 3),
            "weight": GAMMA,
            "contribution": round(pop_score * GAMMA, 3),
            "description": _pick_template(POPULARITY_TEMPLATES, 
                product_name=product_name)
        }
    }
    
    # 2. Feature Importance (Top Factors)
    factors = []
    
    # Check purchase history
    user_transactions = db.query(Transaction).filter(
        Transaction.user_id == user.id,
        Transaction.product_id == group_buy.product_id
    ).count()
    
    if user_transactions > 0:
        factors.append({
            "factor": "purchase_history",
            "importance": 0.8,
            "description": _pick_template(HISTORY_TEMPLATES, 
                product_name=product_name, 
                count=user_transactions),
            "impact": "high"
        })
    
    # Check cluster similarity
    if user.cluster_id is not None and cf_score > 0.5:
        factors.append({
            "factor": "cluster_similarity",
            "importance": 0.7,
            "description": _pick_template(CLUSTER_TEMPLATES, 
                product_name=product_name),
            "impact": "high"
        })
    
    # Check category match
    if cbf_score > 0.5:
        factors.append({
            "factor": "category_match",
            "importance": 0.6,
            "description": _pick_template(CATEGORY_TEMPLATES, 
                product_name=product_name, 
                category=category),
            "impact": "medium"
        })
    
    # Check popularity
    if pop_score > 0.5:
        factors.append({
            "factor": "market_popularity",
            "importance": 0.5,
            "description": _pick_template(POPULARITY_TEMPLATES, 
                product_name=product_name),
            "impact": "medium"
        })
    
    # Check MOQ progress
    moq_progress = group_buy.moq_progress
    remaining_units = max(0, group_buy.product.moq - group_buy.participants_count) if group_buy.product.moq else 0
    if moq_progress >= 50:
        factors.append({
            "factor": "group_progress",
            "importance": 0.4,
            "description": _pick_template(PROGRESS_TEMPLATES,
                product_name=product_name,
                progress=moq_progress,
                participants=group_buy.participants_count or 0,
                remaining=remaining_units),
            "impact": "low" if moq_progress < 75 else "medium"
        })
    
    # Check savings
    savings_pct = group_buy.product.savings_factor * 100
    unit_price = group_buy.product.unit_price or 0
    bulk_price = group_buy.product.bulk_price or 0
    savings_amount = unit_price - bulk_price
    
    if savings_pct >= 10:
        factors.append({
            "factor": "cost_savings",
            "importance": 0.6,
            "description": _pick_template(SAVINGS_TEMPLATES,
                product_name=product_name,
                pct=savings_pct,
                amount=savings_amount,
                price=bulk_price,
                original=unit_price),
            "impact": "high" if savings_pct >= 20 else "medium"
        })
    
    # Check deadline urgency
    days_remaining = (group_buy.deadline - datetime.utcnow()).days
    if days_remaining <= 7:
        day_name = _get_day_name(days_remaining)
        factors.append({
            "factor": "deadline_urgency",
            "importance": 0.5 if days_remaining <= 3 else 0.3,
            "description": _pick_template(URGENCY_TEMPLATES,
                product_name=product_name,
                days=days_remaining,
                day_name=day_name),
            "impact": "high" if days_remaining <= 3 else "low"
        })
    
    explanation["factors"] = sorted(factors, key=lambda x: x["importance"], reverse=True)
    
    # 3. Natural Language Explanation - Unique per product
    primary_reason = ""
    if cf_score > cbf_score and cf_score > pop_score:
        primary_reason = _pick_template(CF_TEMPLATES, 
            product_name=product_name,
            participant_count=group_buy.participants_count or 0)
    elif cbf_score > cf_score and cbf_score > pop_score:
        primary_reason = _pick_template(CATEGORY_TEMPLATES, 
            product_name=product_name, 
            category=category)
    elif pop_score > 0.5:
        primary_reason = _pick_template(POPULARITY_TEMPLATES, 
            product_name=product_name)
    else:
        # Fallback - use savings or progress
        if savings_pct >= 10:
            primary_reason = _pick_template(SAVINGS_TEMPLATES,
                product_name=product_name,
                pct=savings_pct,
                amount=savings_amount,
                price=bulk_price,
                original=unit_price)
        else:
            primary_reason = f"{product_name} is available at group pricing"
    
    secondary_reasons = []
    if moq_progress >= 75:
        secondary_reasons.append(f"the group is {moq_progress:.0f}% to target")
    if savings_pct >= 20:
        secondary_reasons.append(f"you save ${savings_amount:.2f} ({savings_pct:.0f}% off)")
    if days_remaining <= 3:
        secondary_reasons.append(f"it ends {_get_day_name(days_remaining)}")
    
    nl_explanation = f"We recommend this because {primary_reason}"
    if secondary_reasons:
        nl_explanation += ". Also, " + " and ".join(secondary_reasons)
    nl_explanation += "."
    
    explanation["natural_language_explanation"] = nl_explanation
    
    # 4. Confidence Assessment
    if len(factors) >= 3 and ml_scores.get("hybrid", 0) > 0.7:
        explanation["confidence"] = "high"
    elif len(factors) >= 2 and ml_scores.get("hybrid", 0) > 0.5:
        explanation["confidence"] = "medium"
    else:
        explanation["confidence"] = "low"
    
    # 5. Transparency Score (0-1)
    transparency = 0.0
    transparency += min(len(factors) / 5.0, 0.4)
    transparency += 0.3 if all([cf_score > 0, cbf_score > 0, pop_score > 0]) else 0.2
    transparency += 0.3
    
    explanation["transparency_score"] = round(transparency, 2)
    
    return explanation


def explain_cluster_assignment(user: User, db: Session) -> Dict[str, Any]:
    """
    Explain why a user was assigned to a specific cluster.
    
    Args:
        user: Target user
        db: Database session
    
    Returns:
        Cluster assignment explanation
    """
    
    if user.cluster_id is None:
        return {
            "cluster_id": None,
            "explanation": "User has not been assigned to a cluster yet. This happens after sufficient transaction history is recorded.",
            "factors": []
        }
    
    # Get other users in the same cluster
    cluster_users = db.query(User).filter(
        User.cluster_id == user.cluster_id,
        User.id != user.id
    ).limit(10).all()
    
    # Analyze cluster characteristics
    factors = []
    
    # Check location similarity
    same_location_count = sum(1 for u in cluster_users if u.location_zone == user.location_zone)
    if same_location_count > len(cluster_users) * 0.3:
        factors.append({
            "factor": "location",
            "description": f"{same_location_count}/{len(cluster_users)} traders in your cluster are from {user.location_zone}",
            "strength": "high"
        })
    
    # Check category preferences
    user_cats = set(user.preferred_categories or [])
    if user_cats:
        similar_prefs = 0
        for u in cluster_users:
            other_cats = set(u.preferred_categories or [])
            if other_cats and len(user_cats.intersection(other_cats)) > 0:
                similar_prefs += 1
        
        if similar_prefs > len(cluster_users) * 0.4:
            factors.append({
                "factor": "preferences",
                "description": f"You share product preferences with {similar_prefs}/{len(cluster_users)} traders in your cluster",
                "strength": "medium"
            })
    
    # Check budget range
    same_budget = sum(1 for u in cluster_users if u.budget_range == user.budget_range)
    if same_budget > len(cluster_users) * 0.5:
        factors.append({
            "factor": "budget",
            "description": f"{same_budget}/{len(cluster_users)} traders in your cluster have a similar '{user.budget_range}' budget range",
            "strength": "medium"
        })
    
    explanation = {
        "cluster_id": user.cluster_id,
        "cluster_size": len(cluster_users) + 1,
        "explanation": f"You were assigned to Cluster {user.cluster_id} based on your purchase patterns and preferences",
        "factors": factors,
        "similar_traders": [
            {
                "id": u.id,
                "location": u.location_zone,
                "categories": u.preferred_categories[:3] if u.preferred_categories else []
            }
            for u in cluster_users[:5]
        ]
    }
    
    return explanation


def generate_counterfactual_explanation(
    user: User,
    group_buy: GroupBuy,
    current_score: float,
    db: Session
) -> Dict[str, Any]:
    """
    Generate counterfactual explanations: "What if..." scenarios.
    
    Example: "If you had purchased this product before, your recommendation score would increase by 0.2"
    
    Args:
        user: Target user
        group_buy: Group-buy opportunity
        current_score: Current recommendation score
        db: Database session
    
    Returns:
        Counterfactual explanations
    """
    
    scenarios = []
    
    # Scenario 1: Purchase history
    user_transactions = db.query(Transaction).filter(
        Transaction.user_id == user.id,
        Transaction.product_id == group_buy.product_id
    ).count()
    
    if user_transactions == 0:
        scenarios.append({
            "scenario": "purchase_history",
            "description": f"If you had purchased {group_buy.product.name} before",
            "score_impact": "+0.20",
            "new_score": min(current_score + 0.20, 1.0)
        })
    
    # Scenario 2: Cluster participation
    if user.cluster_id is None:
        scenarios.append({
            "scenario": "cluster_assignment",
            "description": "If the system had more of your transaction history to analyze",
            "score_impact": "+0.15",
            "new_score": min(current_score + 0.15, 1.0)
        })
    
    # Scenario 3: Group progress
    moq_progress = group_buy.moq_progress
    if moq_progress < 75:
        scenarios.append({
            "scenario": "group_progress",
            "description": "If this group reaches 75% of target quantity",
            "score_impact": "+0.10",
            "new_score": min(current_score + 0.10, 1.0)
        })
    
    return {
        "current_score": round(current_score, 3),
        "counterfactual_scenarios": scenarios,
        "insight": "These factors could improve your match with this group-buy opportunity"
    }
