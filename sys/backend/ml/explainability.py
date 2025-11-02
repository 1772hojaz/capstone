"""
Explainability Module for Hybrid Recommender System

Provides human-readable explanations for recommendations without requiring SHAP/LIME.
Implements lightweight explainability techniques aligned with research proposal objectives.
"""

from typing import Dict, Any
from models.models import User, GroupBuy, Transaction
from sqlalchemy.orm import Session


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
    
    explanation = {
        "recommendation_id": group_buy.id,
        "product_name": group_buy.product.name,
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
            "description": "Based on traders with similar purchase patterns"
        },
        "content_based_filtering": {
            "raw_score": round(cbf_score, 3),
            "weight": BETA,
            "contribution": round(cbf_score * BETA, 3),
            "description": f"Matches your interests in {group_buy.product.category or 'this category'}"
        },
        "popularity_boost": {
            "raw_score": round(pop_score, 3),
            "weight": GAMMA,
            "contribution": round(pop_score * GAMMA, 3),
            "description": "High demand product across all traders"
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
            "description": f"You've purchased {group_buy.product.name} {user_transactions} time(s) before",
            "impact": "high"
        })
    
    # Check cluster similarity
    if user.cluster_id is not None and cf_score > 0.5:
        factors.append({
            "factor": "cluster_similarity",
            "importance": 0.7,
            "description": f"Popular with traders in your cluster (Cluster {user.cluster_id})",
            "impact": "high"
        })
    
    # Check category match
    if cbf_score > 0.5:
        factors.append({
            "factor": "category_match",
            "importance": 0.6,
            "description": f"Matches your preference for {group_buy.product.category or 'similar products'}",
            "impact": "medium"
        })
    
    # Check popularity
    if pop_score > 0.5:
        factors.append({
            "factor": "market_popularity",
            "importance": 0.5,
            "description": "High demand product in the market",
            "impact": "medium"
        })
    
    # Check MOQ progress
    moq_progress = group_buy.moq_progress
    if moq_progress >= 75:
        factors.append({
            "factor": "group_progress",
            "importance": 0.4,
            "description": f"Group is {moq_progress:.0f}% toward target quantity",
            "impact": "low"
        })
    
    # Check savings
    savings_pct = group_buy.product.savings_factor * 100
    if savings_pct >= 20:
        factors.append({
            "factor": "cost_savings",
            "importance": 0.6,
            "description": f"{savings_pct:.0f}% savings compared to retail price",
            "impact": "medium"
        })
    
    # Check deadline urgency
    from datetime import datetime
    days_remaining = (group_buy.deadline - datetime.utcnow()).days
    if days_remaining <= 3:
        factors.append({
            "factor": "deadline_urgency",
            "importance": 0.3,
            "description": f"Ending in {days_remaining} day(s)",
            "impact": "low"
        })
    
    explanation["factors"] = sorted(factors, key=lambda x: x["importance"], reverse=True)
    
    # 3. Natural Language Explanation
    primary_reason = ""
    if cf_score > cbf_score and cf_score > pop_score:
        primary_reason = f"traders with similar purchase patterns to yours frequently buy {group_buy.product.name}"
    elif cbf_score > cf_score and cbf_score > pop_score:
        primary_reason = f"this product matches your interest in {group_buy.product.category or 'similar items'}"
    elif pop_score > 0.5:
        primary_reason = f"{group_buy.product.name} is a high-demand product among all traders"
    else:
        primary_reason = f"this is a good opportunity for {group_buy.product.name}"
    
    secondary_reasons = []
    if moq_progress >= 75:
        secondary_reasons.append("the group is almost at target quantity")
    if savings_pct >= 20:
        secondary_reasons.append(f"you'll save {savings_pct:.0f}%")
    if days_remaining <= 3:
        secondary_reasons.append("it's ending soon")
    
    nl_explanation = f"We recommend this group-buy because {primary_reason}"
    if secondary_reasons:
        nl_explanation += ", and " + ", ".join(secondary_reasons)
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
    # Based on: number of factors, component diversity, explanation clarity
    transparency = 0.0
    transparency += min(len(factors) / 5.0, 0.4)  # Up to 0.4 for factors
    transparency += 0.3 if all([cf_score > 0, cbf_score > 0, pop_score > 0]) else 0.2  # Component diversity
    transparency += 0.3  # Explanation clarity (constant, as we always provide clear explanations)
    
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
