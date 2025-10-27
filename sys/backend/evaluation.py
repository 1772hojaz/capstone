from typing import List, Dict, Any, Tuple, Optional
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from sklearn.metrics import precision_score, recall_score, f1_score, mean_squared_error
from sklearn.model_selection import train_test_split
import matplotlib.pyplot as plt
import seaborn as sns
import json
import os
import logging

logger = logging.getLogger(__name__)

class RecommendationEvaluator:
    """
    Class for evaluating recommendation system performance
    """
    
    def __init__(self, transactions: pd.DataFrame):
        """
        Initialize evaluator with transaction data
        
        Args:
            transactions: DataFrame with columns ['trader_id', 'product_id', 'quantity', 'unit_price', 'timestamp']
        """
        self.transactions = transactions
        self.metrics = {}
        self._prepare_data()
    
    def _prepare_data(self):
        """Prepare data for evaluation"""
        # Sort by timestamp and split into train/test
        self.transactions = self.transactions.sort_values('timestamp')
        
        # Use the most recent 20% of transactions for testing
        split_idx = int(0.8 * len(self.transactions))
        self.train_data = self.transactions.iloc[:split_idx]
        self.test_data = self.transactions.iloc[split_idx:]
        
        # Create user-item matrices
        self.train_matrix = self._create_user_item_matrix(self.train_data)
        self.test_matrix = self._create_user_item_matrix(self.test_data)
        
        # Get list of all users and items
        self.all_users = set(self.train_matrix.index) | set(self.test_matrix.index)
        self.all_items = set(self.train_matrix.columns) | set(self.test_matrix.columns)
    
    def _create_user_item_matrix(self, data: pd.DataFrame) -> pd.DataFrame:
        """Create a user-item interaction matrix"""
        # Count interactions
        interaction_counts = data.groupby(['trader_id', 'product_id']).size().reset_index(name='interaction_count')
        
        # Create pivot table
        matrix = interaction_counts.pivot(
            index='trader_id',
            columns='product_id',
            values='interaction_count'
        ).fillna(0).astype(int)
        
        return matrix
    
    def evaluate_recommendations(
        self,
        recommendations: Dict[int, List[int]],
        k_values: List[int] = [5, 10, 20]
    ) -> Dict[str, float]:
        """
        Evaluate recommendations against test data
        
        Args:
            recommendations: Dictionary mapping user_id to list of recommended item_ids
            k_values: List of k values to evaluate precision@k, recall@k, etc.
            
        Returns:
            Dictionary of evaluation metrics
        """
        results = {}
        
        # Convert test data to user-item sets
        test_user_items = {
            user: set(self.test_matrix.columns[self.test_matrix.loc[user] > 0]) 
            for user in self.test_matrix.index if user in recommendations
        }
        
        for k in k_values:
            # Calculate precision@k and recall@k
            precisions = []
            recalls = []
            f1_scores = []
            
            for user, true_items in test_user_items.items():
                if user not in recommendations:
                    continue
                    
                pred_items = set(recommendations[user][:k])
                n_true_positives = len(pred_items & true_items)
                
                # Precision@k = (# of recommended items that are relevant) / (# of recommended items)
                precision = n_true_positives / len(pred_items) if pred_items else 0
                
                # Recall@k = (# of recommended items that are relevant) / (# of relevant items)
                recall = n_true_positives / len(true_items) if true_items else 0
                
                # F1@k = 2 * (precision * recall) / (precision + recall)
                f1 = 2 * (precision * recall) / (precision + recall + 1e-10)
                
                precisions.append(precision)
                recalls.append(recall)
                f1_scores.append(f1)
            
            # Store average metrics
            results[f'precision@{k}'] = np.mean(precisions) if precisions else 0
            results[f'recall@{k}'] = np.mean(recalls) if recalls else 0
            results[f'f1@{k}'] = np.mean(f1_scores) if f1_scores else 0
        
        # Calculate coverage
        all_recommended_items = set()
        for items in recommendations.values():
            all_recommended_items.update(items)
        
        results['coverage'] = len(all_recommended_items) / len(self.all_items)
        
        # Calculate novelty (average popularity rank of recommended items)
        item_popularity = self.train_matrix.astype(bool).sum(axis=0)
        novelty_scores = []
        
        for user, items in recommendations.items():
            if not items:
                continue
                
            # Get popularity of recommended items (lower is more popular)
            popularity_ranks = [item_popularity.get(item, 0) for item in items]
            novelty_scores.append(np.mean(popularity_ranks))
        
        results['novelty'] = np.mean(novelty_scores) if novelty_scores else 0
        
        # Calculate diversity (1 - average similarity between all pairs of recommendations)
        diversity_scores = []
        
        for user, items in recommendations.items():
            if len(items) < 2:
                continue
                
            # For simplicity, use Jaccard similarity
            similarities = []
            for i in range(len(items)):
                for j in range(i+1, len(items)):
                    item1 = items[i]
                    item2 = items[j]
                    
                    # Users who bought item1
                    users1 = set(self.train_matrix.index[self.train_matrix[item1] > 0])
                    # Users who bought item2
                    users2 = set(self.train_matrix.index[self.train_matrix[item2] > 0])
                    
                    # Jaccard similarity
                    if not users1 and not users2:
                        similarity = 0
                    else:
                        similarity = len(users1 & users2) / len(users1 | users2)
                    
                    similarities.append(similarity)
            
            if similarities:
                avg_similarity = np.mean(similarities)
                diversity_scores.append(1 - avg_similarity)
        
        results['diversity'] = np.mean(diversity_scores) if diversity_scores else 0
        
        self.metrics = results
        return results
    
    def evaluate_clustering(
        self, 
        features: np.ndarray, 
        labels: np.ndarray,
        metric: str = 'all'
    ) -> Dict[str, float]:
        """
        Evaluate clustering quality
        
        Args:
            features: Feature matrix used for clustering
            labels: Cluster assignments
            metric: Which metrics to compute ('all', 'silhouette', 'davies_bouldin')
            
        Returns:
            Dictionary of clustering metrics
        """
        metrics = {}
        
        # Filter out noise if using DBSCAN
        valid_indices = labels != -1
        if not np.any(valid_indices):
            return {'error': 'No valid clusters found (all points marked as noise)'}
            
        filtered_features = features[valid_indices]
        filtered_labels = labels[valid_indices]
        
        # Only calculate metrics if we have at least 2 clusters and 2 samples per cluster
        unique_labels = np.unique(filtered_labels)
        if len(unique_labels) < 2:
            return {'error': 'Need at least 2 clusters for evaluation'}
            
        if metric in ['all', 'silhouette']:
            try:
                from sklearn.metrics import silhouette_score
                metrics['silhouette_score'] = silhouette_score(filtered_features, filtered_labels)
            except Exception as e:
                logger.warning(f"Could not calculate silhouette score: {e}")
                metrics['silhouette_score'] = -1
        
        if metric in ['all', 'davies_bouldin']:
            try:
                from sklearn.metrics import davies_bouldin_score
                metrics['davies_bouldin_score'] = davies_bouldin_score(filtered_features, filtered_labels)
            except Exception as e:
                logger.warning(f"Could not calculate Davies-Bouldin score: {e}")
                metrics['davies_bouldin_score'] = float('inf')
        
        # Additional metrics
        cluster_sizes = np.bincount(filtered_labels[filtered_labels >= 0])
        metrics.update({
            'n_clusters': len(unique_labels),
            'avg_cluster_size': np.mean(cluster_sizes),
            'min_cluster_size': np.min(cluster_sizes),
            'max_cluster_size': np.max(cluster_sizes),
            'n_noise': np.sum(labels == -1) if -1 in labels else 0
        })
        
        self.clustering_metrics = metrics
        return metrics
    
    def plot_metrics(self, metrics: Dict[str, float], save_path: str = None):
        """
        Plot evaluation metrics
        
        Args:
            metrics: Dictionary of metrics to plot
            save_path: If provided, save the plot to this path
        """
        # Filter metrics that start with precision@, recall@, or f1@
        precision_metrics = {k: v for k, v in metrics.items() if k.startswith('precision@')}
        recall_metrics = {k: v for k, v in metrics.items() if k.startswith('recall@')}
        f1_metrics = {k: v for k, v in metrics.items() if k.startswith('f1@')}
        
        # Create figure with subplots
        fig, axes = plt.subplots(2, 2, figsize=(15, 12))
        
        # Plot precision, recall, f1 at different k values
        if precision_metrics or recall_metrics or f1_metrics:
            k_values = sorted([int(k.split('@')[1]) for k in precision_metrics.keys()])
            
            if precision_metrics:
                axes[0, 0].plot(k_values, [precision_metrics[f'precision@{k}'] for k in k_values], 'o-')
                axes[0, 0].set_title('Precision@k')
                axes[0, 0].set_xlabel('k')
                axes[0, 0].set_ylabel('Precision')
                axes[0, 0].grid(True)
            
            if recall_metrics:
                axes[0, 1].plot(k_values, [recall_metrics[f'recall@{k}'] for k in k_values], 'o-', color='orange')
                axes[0, 1].set_title('Recall@k')
                axes[0, 1].set_xlabel('k')
                axes[0, 1].set_ylabel('Recall')
                axes[0, 1].grid(True)
            
            if f1_metrics:
                axes[1, 0].plot(k_values, [f1_metrics[f'f1@{k}'] for k in k_values], 'o-', color='green')
                axes[1, 0].set_title('F1-Score@k')
                axes[1, 0].set_xlabel('k')
                axes[1, 0].set_ylabel('F1-Score')
                axes[1, 0].grid(True)
        
        # Plot other metrics
        other_metrics = {
            k: v for k, v in metrics.items() 
            if not k.startswith(('precision@', 'recall@', 'f1@'))
            and not k.startswith(('silhouette_', 'davies_bouldin_'))
        }
        
        if other_metrics:
            sns.barplot(x=list(other_metrics.keys()), y=list(other_metrics.values()), ax=axes[1, 1])
            axes[1, 1].set_title('Other Metrics')
            axes[1, 1].tick_params(axis='x', rotation=45)
            axes[1, 1].grid(True)
        
        plt.tight_layout()
        
        if save_path:
            os.makedirs(os.path.dirname(save_path) or '.', exist_ok=True)
            plt.savefig(save_path, bbox_inches='tight')
            plt.close()
        else:
            plt.show()
    
    def save_metrics(self, filepath: str):
        """Save metrics to a JSON file"""
        metrics = {
            'recommendation_metrics': self.metrics,
            'clustering_metrics': getattr(self, 'clustering_metrics', {}),
            'timestamp': datetime.now().isoformat()
        }
        
        os.makedirs(os.path.dirname(filepath) or '.', exist_ok=True)
        with open(filepath, 'w') as f:
            json.dump(metrics, f, indent=2)
        
        logger.info(f"Metrics saved to {filepath}")
    
    @classmethod
    def load_metrics(cls, filepath: str):
        """Load metrics from a JSON file"""
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"Metrics file not found: {filepath}")
            
        with open(filepath, 'r') as f:
            metrics = json.load(f)
            
        return metrics
