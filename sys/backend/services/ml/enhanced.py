from typing import List, Dict, Any, Tuple, Optional
import numpy as np
import pandas as pd
from datetime import datetime
from sklearn.cluster import KMeans, DBSCAN
from sklearn.preprocessing import StandardScaler, MinMaxScaler
from sklearn.metrics import silhouette_score, davies_bouldin_score, pairwise_distances
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.decomposition import NMF
import shap
import joblib
import os
import json
from fastapi import HTTPException
from sqlalchemy.orm import Session
import logging

logger = logging.getLogger(__name__)

class ExplainableRecommender:
    def __init__(self, db: Session):
        self.db = db
        self.scaler = StandardScaler()
        self.feature_names = None
        self.explainer = None
        self.model = None
        self.cluster_descriptions = {}
        
    def prepare_features(self, transactions: pd.DataFrame) -> Tuple[np.ndarray, List[int]]:
        """
        Prepare features for clustering from transaction data
        
        Args:
            transactions: DataFrame with columns ['trader_id', 'product_id', 'quantity', 'unit_price', 'timestamp']
            
        Returns:
            Tuple of (scaled_features, trader_ids)
        """
        # Feature engineering
        user_features = transactions.groupby('trader_id').agg({
            'quantity': ['sum', 'mean', 'count'],
            'unit_price': ['mean', 'std', 'median'],
            'product_id': 'nunique',
            'timestamp': lambda x: (datetime.now() - x.max()).days  # Days since last purchase
        }).fillna(0)
        
        # Flatten column multi-index
        user_features.columns = ['_'.join(col).strip() for col in user_features.columns.values]
        self.feature_names = user_features.columns.tolist()
        
        # Scale features
        features_scaled = self.scaler.fit_transform(user_features)
        
        return features_scaled, user_features.index.tolist()
    
    def train_clusters(self, features: np.ndarray, method: str = 'kmeans', n_clusters: int = 5, 
                      **kwargs) -> Dict[str, Any]:
        """
        Train clustering model with evaluation
        
        Args:
            features: Scaled feature matrix
            method: 'kmeans' or 'dbscan'
            n_clusters: Number of clusters (for KMeans)
            **kwargs: Additional parameters for clustering algorithm
            
        Returns:
            Dictionary with model and evaluation metrics
        """
        if method.lower() == 'kmeans':
            model = KMeans(
                n_clusters=n_clusters, 
                random_state=42, 
                n_init=10,
                **kwargs
            )
        elif method.lower() == 'dbscan':
            model = DBSCAN(
                eps=kwargs.get('eps', 0.5),
                min_samples=kwargs.get('min_samples', 5),
                **{k: v for k, v in kwargs.items() if k not in ['eps', 'min_samples']}
            )
        else:
            raise ValueError(f"Unsupported clustering method: {method}")
            
        # Fit model
        labels = model.fit_predict(features)
        
        # Handle case where DBSCAN finds noise (-1 label)
        valid_labels = labels[labels != -1]
        n_clusters_found = len(set(valid_labels)) - (1 if -1 in labels else 0)
        
        # Evaluate clustering
        metrics = {}
        if len(set(valid_labels)) > 1:  # Need at least 2 clusters
            try:
                metrics['silhouette_score'] = silhouette_score(features[labels != -1], valid_labels)
                metrics['davies_bouldin_score'] = davies_bouldin_score(features[labels != -1], valid_labels)
            except Exception as e:
                logger.warning(f"Could not calculate clustering metrics: {e}")
                metrics['silhouette_score'] = -1
                metrics['davies_bouldin_score'] = float('inf')
        else:
            metrics['silhouette_score'] = -1
            metrics['davies_bouldin_score'] = float('inf')
            
        metrics['n_clusters'] = n_clusters_found
        metrics['n_noise'] = np.sum(labels == -1) if -1 in labels else 0
        
        self.model = model
        return {
            'model': model,
            'metrics': metrics,
            'labels': labels
        }
    
    def explain_cluster(self, features: np.ndarray, instance_idx: int) -> Dict[str, Any]:
        """
        Explain why a trader was assigned to a cluster using SHAP
        
        Args:
            features: Scaled feature matrix
            instance_idx: Index of the instance to explain
            
        Returns:
            Dictionary with explanation details
        """
        if self.model is None:
            raise ValueError("Model not trained. Call train_clusters() first.")
            
        if not hasattr(self.model, 'predict'):
            raise ValueError("Model must have predict method")
            
        # Create SHAP explainer
        if self.explainer is None:
            self.explainer = shap.KernelExplainer(
                model=self.model.predict,
                data=shap.sample(features, 100)  # Use subset for efficiency
            )
            
        # Calculate SHAP values
        shap_values = self.explainer.shap_values(features[instance_idx:instance_idx+1])
        
        # Get cluster prediction
        cluster = int(self.model.predict(features[instance_idx:instance_idx+1])[0])
        
        # Format feature importance
        feature_importance = [
            {
                'feature': name,
                'importance': float(np.abs(value)),
                'value': float(value),
                'scaled_value': float(features[instance_idx, i])
            }
            for i, (name, value) in enumerate(zip(self.feature_names, shap_values[0]))
        ]
        
        # Sort by absolute importance
        feature_importance.sort(key=lambda x: x['importance'], reverse=True)
        
        return {
            'cluster': cluster,
            'feature_importance': feature_importance[:5],  # Top 5 features
            'instance_features': {
                name: float(value) 
                for name, value in zip(self.feature_names, features[instance_idx])
            }
        }
    
    def generate_cluster_descriptions(self, transactions: pd.DataFrame, labels: np.ndarray) -> Dict[int, str]:
        """Generate human-readable descriptions for each cluster"""
        if len(transactions) != len(labels):
            raise ValueError("Length of transactions must match length of labels")
            
        # Add cluster labels to transactions
        transactions = transactions.copy()
        transactions['cluster'] = labels
        
        # Filter out noise if using DBSCAN
        if -1 in labels:
            transactions = transactions[transactions['cluster'] != -1]
            
        cluster_descriptions = {}
        
        for cluster_id in sorted(transactions['cluster'].unique()):
            cluster_data = transactions[transactions['cluster'] == cluster_id]
            
            # Basic stats
            n_traders = cluster_data['trader_id'].nunique()
            avg_spend = cluster_data.groupby('trader_id')['unit_price'].sum().mean()
            
            # Most common products
            top_products = cluster_data['product_id'].value_counts().head(3)
            top_product_names = [str(pid) for pid in top_products.index]
            
            # Purchase frequency
            purchase_freq = cluster_data.groupby('trader_id')['timestamp'].count().mean()
            
            # Generate description
            description = (
                f"This cluster contains {n_traders} traders who typically spend ${avg_spend:.2f} per week. "
                f"They frequently purchase: {', '.join(top_product_names)}. "
                f"On average, they make {purchase_freq:.1f} purchases per week."
            )
            
            cluster_descriptions[int(cluster_id)] = {
                'description': description,
                'n_traders': int(n_traders),
                'avg_weekly_spend': float(avg_spend),
                'top_products': top_product_names,
                'avg_purchase_freq': float(purchase_freq)
            }
            
        self.cluster_descriptions = cluster_descriptions
        return cluster_descriptions
    
    def generate_recommendations(
        self, 
        trader_id: int,
        transactions: pd.DataFrame,
        n_recommendations: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Generate product recommendations for a trader
        
        Args:
            trader_id: ID of the trader to generate recommendations for
            transactions: DataFrame of all transactions
            n_recommendations: Number of recommendations to return
            
        Returns:
            List of recommendation dictionaries
        """
        if self.model is None:
            raise ValueError("Model not trained. Call train_clusters() first.")
            
        # Get trader's cluster
        trader_transactions = transactions[transactions['trader_id'] == trader_id]
        if trader_transactions.empty:
            return self._get_cold_start_recommendations(transactions, n_recommendations)
            
        # Prepare features for this trader
        features, _ = self.prepare_features(transactions)
        
        # Get cluster for this trader
        cluster = self.model.predict(features[[trader_id]])[0]
        
        # Get other traders in the same cluster
        all_trader_features, all_trader_ids = self.prepare_features(transactions)
        cluster_labels = self.model.predict(all_trader_features)
        similar_traders = [tid for tid, c in zip(all_trader_ids, cluster_labels) 
                          if c == cluster and tid != trader_id]
        
        if not similar_traders:
            return self._get_popular_recommendations(transactions, n_recommendations)
            
        # Get products purchased by similar traders but not by this trader
        trader_products = set(trader_transactions['product_id'].unique())
        similar_purchases = transactions[
            (transactions['trader_id'].isin(similar_traders)) &
            (~transactions['product_id'].isin(trader_products))
        ]
        
        if similar_purchases.empty:
            return self._get_popular_recommendations(transactions, n_recommendations)
            
        # Rank products by frequency among similar traders
        product_scores = similar_purchases['product_id'].value_counts()
        
        # Get top recommendations
        recommendations = []
        for product_id, score in product_scores.head(n_recommendations).items():
            product_data = transactions[transactions['product_id'] == product_id].iloc[0]
            
            # Calculate potential savings (example: 10-30% off for group buys)
            discount = random.uniform(0.1, 0.3)
            original_price = product_data['unit_price']
            discounted_price = original_price * (1 - discount)
            
            recommendations.append({
                'product_id': int(product_id),
                'product_name': product_data.get('product_name', f'Product {product_id}'),
                'category': product_data.get('category', 'Unknown'),
                'original_price': float(original_price),
                'discounted_price': float(discounted_price),
                'discount_percent': int(discount * 100),
                'popularity_score': int(score),
                'reason': f"Popular among {int(score)} similar traders in your cluster"
            })
        
        return recommendations
    
    def _get_cold_start_recommendations(
        self, 
        transactions: pd.DataFrame, 
        n_recommendations: int
    ) -> List[Dict[str, Any]]:
        """Get recommendations for new users with no transaction history"""
        popular_products = transactions['product_id'].value_counts().head(n_recommendations)
        
        recommendations = []
        for product_id, count in popular_products.items():
            product_data = transactions[transactions['product_id'] == product_id].iloc[0]
            
            recommendations.append({
                'product_id': int(product_id),
                'product_name': product_data.get('product_name', f'Product {product_id}'),
                'category': product_data.get('category', 'Unknown'),
                'original_price': float(product_data['unit_price']),
                'discounted_price': float(product_data['unit_price'] * 0.9),  # 10% new user discount
                'discount_percent': 10,
                'popularity_score': int(count),
                'reason': f"Popular choice with {count} purchases in our marketplace"
            })
            
        return recommendations
    
    def _get_popular_recommendations(
        self, 
        transactions: pd.DataFrame, 
        n_recommendations: int
    ) -> List[Dict[str, Any]]:
        """Fallback to most popular products"""
        popular_products = transactions['product_id'].value_counts().head(n_recommendations)
        
        recommendations = []
        for product_id, count in popular_products.items():
            product_data = transactions[transactions['product_id'] == product_id].iloc[0]
            
            recommendations.append({
                'product_id': int(product_id),
                'product_name': product_data.get('product_name', f'Product {product_id}'),
                'category': product_data.get('category', 'Unknown'),
                'original_price': float(product_data['unit_price']),
                'discounted_price': float(product_data['unit_price'] * 0.95),  # 5% discount
                'discount_percent': 5,
                'popularity_score': int(count),
                'reason': f"Popular choice with {count} total purchases"
            })
            
        return recommendations
    
    def save_model(self, filepath: str):
        """Save model and related data to disk"""
        if self.model is None:
            raise ValueError("Model not trained. Nothing to save.")
            
        model_data = {
            'model': self.model,
            'scaler': self.scaler,
            'feature_names': self.feature_names,
            'cluster_descriptions': self.cluster_descriptions,
            'timestamp': datetime.now().isoformat()
        }
        
        os.makedirs(os.path.dirname(filepath) or '.', exist_ok=True)
        joblib.dump(model_data, filepath)
        logger.info(f"Model saved to {filepath}")
    
    @classmethod
    def load_model(cls, filepath: str, db: Session):
        """Load model and related data from disk"""
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"Model file not found: {filepath}")
            
        model_data = joblib.load(filepath)
        
        instance = cls(db)
        instance.model = model_data['model']
        instance.scaler = model_data['scaler']
        instance.feature_names = model_data['feature_names']
        instance.cluster_descriptions = model_data.get('cluster_descriptions', {})
        
        logger.info(f"Model loaded from {filepath} (trained on {model_data['timestamp']})")
        return instance
