"""
Explainability Module for SPACS AFRICA.
Generates human-readable explanations for ML recommendations.
"""

from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)


class ExplanationGenerator:
    """
    Generates clear, non-technical explanations for recommendations.
    Combines rule-based templates with ML feature importance.
    """
    
    def __init__(self):
        """Initialize explanation templates."""
        self.templates = {
            'join_group_high_match': (
                "You were grouped with {num_members} traders who also purchase "
                "{product_name} regularly. Joining this group achieves a {discount}% discount."
            ),
            'join_group_category_match': (
                "This {product_name} group matches your interest in {category} products. "
                "{num_members} similar traders are already members, offering a {discount}% savings."
            ),
            'join_group_location': (
                "Traders in {location} are forming a group for {product_name}. "
                "You can save {discount}% by joining before {deadline}."
            ),
            'join_group_recent_purchase': (
                "You recently purchased {product_name}. Join this bulk group to save "
                "{discount}% on your next purchase."
            ),
            'new_group_cluster_demand': (
                "{potential_members} traders in your network frequently buy {product_name}. "
                "Starting a bulk group could save everyone {discount}% on average."
            ),
            'new_group_high_affinity': (
                "Based on your purchase history, {product_name} is a top opportunity for bulk buying. "
                "We estimate {potential_members} traders would join, achieving {discount}% savings."
            ),
            'new_group_category_expansion': (
                "Traders like you often buy {product_name} in the {category} category. "
                "This could be a profitable bulk purchase opportunity with {discount}% potential savings."
            ),
            'product_recommendation': (
                "You might be interested in {product_name}. Similar traders in your area "
                "save an average of {discount}% by buying in bulk."
            )
        }
        
    def explain_join_group_recommendation(
        self,
        product_name: str,
        product_category: str,
        num_members: int,
        discount_percentage: float,
        deadline: datetime,
        score: float,
        user_context: Optional[Dict] = None
    ) -> str:
        """
        Generate explanation for why a user should join an existing group.
        
        Args:
            product_name: Name of the product
            product_category: Product category
            num_members: Number of current group members
            discount_percentage: Discount being offered
            deadline: Group deadline
            score: Recommendation score
            user_context: Additional user context (purchase history, location, etc.)
            
        Returns:
            Human-readable explanation string
        """
        # Choose template based on score and context
        context = user_context or {}
        
        # Check if user has bought this product recently
        if context.get('has_recent_purchase', False):
            template = self.templates['join_group_recent_purchase']
            return template.format(
                product_name=product_name,
                discount=round(discount_percentage, 0)
            )
        
        # Check if user has bought from this category
        if context.get('category_affinity', 0) > 0.5:
            template = self.templates['join_group_category_match']
            return template.format(
                product_name=product_name,
                category=product_category,
                num_members=num_members,
                discount=round(discount_percentage, 0)
            )
        
        # Check for location match
        if context.get('location_match', False):
            template = self.templates['join_group_location']
            location = context.get('location_name', 'your area')
            deadline_str = deadline.strftime('%B %d')
            return template.format(
                location=location,
                product_name=product_name,
                discount=round(discount_percentage, 0),
                deadline=deadline_str
            )
        
        # Default to high match template
        template = self.templates['join_group_high_match']
        return template.format(
            num_members=num_members,
            product_name=product_name,
            discount=round(discount_percentage, 0)
        )
    
    def explain_new_group_recommendation(
        self,
        product_name: str,
        product_category: str,
        potential_members: int,
        discount_percentage: float,
        affinity_score: float,
        user_context: Optional[Dict] = None
    ) -> str:
        """
        Generate explanation for suggesting a new group formation.
        
        Args:
            product_name: Name of the product
            product_category: Product category
            potential_members: Estimated number of potential members
            discount_percentage: Potential discount
            affinity_score: Product affinity score for the cluster
            user_context: Additional user context
            
        Returns:
            Human-readable explanation string
        """
        context = user_context or {}
        
        # High affinity within cluster
        if affinity_score > 0.7:
            template = self.templates['new_group_cluster_demand']
            return template.format(
                potential_members=potential_members,
                product_name=product_name,
                discount=round(discount_percentage, 0)
            )
        
        # User has high affinity for this product
        if context.get('user_product_affinity', 0) > 0.6:
            template = self.templates['new_group_high_affinity']
            return template.format(
                product_name=product_name,
                potential_members=potential_members,
                discount=round(discount_percentage, 0)
            )
        
        # Category-based recommendation
        template = self.templates['new_group_category_expansion']
        return template.format(
            product_name=product_name,
            category=product_category,
            discount=round(discount_percentage, 0)
        )
    
    def explain_product_recommendation(
        self,
        product_name: str,
        discount_percentage: float,
        similar_traders_count: int = 10
    ) -> str:
        """
        Generate explanation for a general product recommendation.
        """
        template = self.templates['product_recommendation']
        return template.format(
            product_name=product_name,
            discount=round(discount_percentage, 0)
        )
    
    def explain_with_features(
        self,
        recommendation_type: str,
        feature_importance: Dict[str, float],
        **kwargs
    ) -> str:
        """
        Generate explanation enriched with ML feature importance.
        
        Args:
            recommendation_type: Type of recommendation
            feature_importance: Dictionary of feature names and their importance scores
            **kwargs: Other parameters needed for explanation
            
        Returns:
            Explanation string with feature insights
        """
        # Generate base explanation
        if recommendation_type == 'join_group':
            base_explanation = self.explain_join_group_recommendation(**kwargs)
        elif recommendation_type == 'new_group':
            base_explanation = self.explain_new_group_recommendation(**kwargs)
        else:
            base_explanation = self.explain_product_recommendation(**kwargs)
        
        # Add feature-based insights if available
        if feature_importance:
            top_features = sorted(
                feature_importance.items(), 
                key=lambda x: abs(x[1]), 
                reverse=True
            )[:2]  # Top 2 features
            
            feature_insights = self._translate_features_to_text(top_features)
            if feature_insights:
                base_explanation += f" {feature_insights}"
        
        return base_explanation
    
    def _translate_features_to_text(self, features: List[tuple]) -> str:
        """
        Translate ML feature importance into human-readable insights.
        
        Args:
            features: List of (feature_name, importance_score) tuples
            
        Returns:
            Human-readable feature insight
        """
        insights = []
        
        feature_translations = {
            'purchase_frequency': "your regular buying pattern",
            'price_sensitivity': "your preference for good deals",
            'avg_transaction_value': "your typical purchase size",
            'product_diversity': "your diverse product interests",
            'location_encoded': "your location proximity to other traders"
        }
        
        for feature_name, importance in features:
            if abs(importance) > 0.2:  # Only mention significant features
                translation = feature_translations.get(feature_name, feature_name)
                insights.append(translation)
        
        if insights:
            if len(insights) == 1:
                return f"This recommendation is based on {insights[0]}."
            else:
                return f"This recommendation considers {insights[0]} and {insights[1]}."
        
        return ""
    
    def generate_cluster_description(
        self,
        cluster_name: str,
        characteristics: Dict[str, Any]
    ) -> str:
        """
        Generate a description of a user cluster for admin reports.
        
        Args:
            cluster_name: Name of the cluster
            characteristics: Cluster statistics
            
        Returns:
            Description string
        """
        avg_freq = characteristics.get('avg_purchase_frequency', 0)
        avg_value = characteristics.get('avg_transaction_value', 0)
        size = characteristics.get('size', 0)
        
        # Determine cluster behavior pattern
        if avg_freq > 3:
            frequency_desc = "high-frequency buyers"
        elif avg_freq > 1:
            frequency_desc = "regular buyers"
        else:
            frequency_desc = "occasional buyers"
        
        if avg_value > 100:
            value_desc = "high-value purchases"
        elif avg_value > 50:
            value_desc = "medium-value purchases"
        else:
            value_desc = "small-scale purchases"
        
        description = (
            f"**{cluster_name}** consists of {size} traders characterized as "
            f"{frequency_desc} who make {value_desc}. "
        )
        
        # Add price sensitivity insight
        price_sens = characteristics.get('avg_price_sensitivity', 0)
        if price_sens > 0.7:
            description += "This group is highly price-conscious and responds well to bulk discounts."
        elif price_sens > 0.4:
            description += "This group balances price and convenience in purchasing decisions."
        else:
            description += "This group prioritizes convenience over price savings."
        
        return description
    
    def calculate_savings_explanation(
        self,
        base_price: float,
        bulk_price: float,
        quantity: int
    ) -> Dict[str, Any]:
        """
        Calculate and explain potential savings.
        
        Returns:
            Dictionary with savings breakdown
        """
        individual_cost = base_price * quantity
        bulk_cost = bulk_price * quantity
        savings = individual_cost - bulk_cost
        savings_percentage = (savings / individual_cost * 100) if individual_cost > 0 else 0
        
        return {
            'individual_cost': round(individual_cost, 2),
            'bulk_cost': round(bulk_cost, 2),
            'total_savings': round(savings, 2),
            'savings_percentage': round(savings_percentage, 2),
            'explanation': (
                f"By buying {quantity} units in bulk, you'll pay ${bulk_cost:.2f} "
                f"instead of ${individual_cost:.2f}, saving ${savings:.2f} "
                f"({savings_percentage:.1f}% discount)."
            )
        }


def generate_recommendation_explanation(
    recommendation_data: Dict[str, Any],
    user_context: Optional[Dict[str, Any]] = None
) -> str:
    """
    Main function to generate explanations for recommendations.
    
    Args:
        recommendation_data: Dictionary containing recommendation details
        user_context: Additional user context
        
    Returns:
        Human-readable explanation
    """
    generator = ExplanationGenerator()
    
    rec_type = recommendation_data.get('recommendation_type')
    
    if rec_type == 'join_group':
        return generator.explain_join_group_recommendation(
            product_name=recommendation_data['product_name'],
            product_category=recommendation_data.get('category', 'general'),
            num_members=recommendation_data.get('current_members', 0),
            discount_percentage=recommendation_data.get('discount_percentage', 0),
            deadline=recommendation_data.get('deadline', datetime.now() + timedelta(days=7)),
            score=recommendation_data.get('score', 0),
            user_context=user_context
        )
    
    elif rec_type == 'new_group':
        return generator.explain_new_group_recommendation(
            product_name=recommendation_data['product_name'],
            product_category=recommendation_data.get('category', 'general'),
            potential_members=recommendation_data.get('potential_members', 5),
            discount_percentage=recommendation_data.get('discount_percentage', 0),
            affinity_score=recommendation_data.get('affinity_score', 0.5),
            user_context=user_context
        )
    
    else:
        return generator.explain_product_recommendation(
            product_name=recommendation_data['product_name'],
            discount_percentage=recommendation_data.get('discount_percentage', 15)
        )


if __name__ == "__main__":
    # Test explanation generation
    print("Testing Explanation Generator...\n")
    
    generator = ExplanationGenerator()
    
    # Test join group explanation
    explanation1 = generator.explain_join_group_recommendation(
        product_name="Rice - 50kg Bag",
        product_category="Grains",
        num_members=8,
        discount_percentage=22.5,
        deadline=datetime.now() + timedelta(days=5),
        score=0.85,
        user_context={'has_recent_purchase': True}
    )
    print("Join Group Explanation:")
    print(f"  {explanation1}\n")
    
    # Test new group explanation
    explanation2 = generator.explain_new_group_recommendation(
        product_name="Cooking Oil - 5L",
        product_category="Cooking Essentials",
        potential_members=12,
        discount_percentage=20.0,
        affinity_score=0.75
    )
    print("New Group Explanation:")
    print(f"  {explanation2}\n")
    
    # Test savings calculation
    savings = generator.calculate_savings_explanation(
        base_price=45.00,
        bulk_price=36.00,
        quantity=10
    )
    print("Savings Explanation:")
    print(f"  {savings['explanation']}\n")
    
    print("✓ Explanation generator test completed successfully")
