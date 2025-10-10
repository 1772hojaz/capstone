/**
 * Machine Learning / Recommendations API
 */
import api from './api';

export interface Recommendation {
  product_id: number;
  product_name: string;
  score: number;
  reason: string;
  category?: string;
  price?: number;
}

export interface RecommendationResponse {
  user_id: number;
  recommendations: Recommendation[];
  algorithm: string;
  generated_at: string;
}

export interface MLMetrics {
  silhouette_score: number;
  n_clusters: number;
  nmf_rank?: number;
  tfidf_vocab_size?: number;
}

export interface MLModel {
  id: number;
  model_type: string;
  trained_at: string;
  metrics: MLMetrics;
}

export const mlApi = {
  async getRecommendations(userId?: number): Promise<RecommendationResponse> {
    const endpoint = userId ? `/ml/recommendations/${userId}` : '/ml/recommendations';
    return api.get<RecommendationResponse>(endpoint);
  },

  async retrain(): Promise<{ message: string; metrics: MLMetrics }> {
    return api.post<{ message: string; metrics: MLMetrics }>('/ml/retrain');
  },

  async getModelMetrics(): Promise<MLModel> {
    return api.get<MLModel>('/ml/metrics');
  },

  async getClusterInfo(userId: number): Promise<{ cluster_id: number; similar_users: number[] }> {
    return api.get<{ cluster_id: number; similar_users: number[] }>(`/ml/cluster/${userId}`);
  },
};

export default mlApi;
