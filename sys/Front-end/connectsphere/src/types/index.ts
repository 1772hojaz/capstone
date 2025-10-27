// Type definitions for the ConnectSphere application

export interface User {
  id: number;
  email: string;
  full_name: string;
  is_admin: boolean;
  is_active: boolean;
  location_zone: string;
  cluster_id?: number;
  created_at: string;
  updated_at?: string;
  preferred_categories?: string[];
  budget_range?: string;
  experience_level?: string;
  preferred_group_sizes?: string[];
  participation_frequency?: string;
  email_notifications?: boolean;
}

export interface Product {
  id: number;
  product_name: string;
  category: string;
  description: string;
  long_description?: string;
  unit_price: number;
  bulk_price: number;
  moq: number;
  image_url?: string;
  is_active: boolean;
  supplier_id?: number;
  created_at?: string;
  updated_at?: string;
}

export interface GroupBuy {
  id: number;
  product_id: number;
  product_name: string;
  product_image_url?: string;
  location_zone: string;
  moq: number;
  deadline: string;
  status: 'active' | 'completed' | 'cancelled';
  total_quantity: number;
  moq_progress: number;
  participants_count: number;
  price: number;
  original_price: number;
  description?: string;
  long_description?: string;
  category?: string;
  created_at?: string;
  admin_created: boolean;
  admin_name?: string;
  discount_percentage?: number;
  total_contributions?: number;
  total_paid?: number;
  is_fully_funded?: boolean;
}

export interface MLScores {
  collaborative_filtering: number;
  content_based: number;
  popularity: number;
  hybrid: number;
}

export interface Recommendation {
  group_buy_id: number;
  product_id: number;
  product_name: string;
  product_image_url?: string;
  unit_price: number;
  bulk_price: number;
  moq: number;
  savings_factor: number;
  savings: number;
  location_zone: string;
  deadline: string;
  total_quantity: number;
  moq_progress: number;
  participants_count: number;
  recommendation_score: number;
  reason: string;
  ml_scores?: MLScores;
  description?: string;
  long_description?: string;
  category?: string;
  created_at?: string;
  admin_created: boolean;
  admin_name?: string;
  discount_percentage: number;
  shipping_info?: string;
  estimated_delivery?: string;
  features?: string[];
  requirements?: string[];
}

export interface DashboardStats {
  total_users: number;
  total_products: number;
  active_group_buys: number;
  completed_group_buys: number;
  total_revenue: number;
  total_savings: number;
}

export interface Transaction {
  id: number;
  user_id: number;
  group_buy_id: number;
  amount: number;
  status: string;
  created_at: string;
}

export interface MLSystemStatus {
  status: string;
  models_loaded: {
    clustering: boolean;
    nmf_collaborative_filtering: boolean;
    tfidf_content_based: boolean;
    scaler: boolean;
    feature_store: boolean;
  };
  last_training?: string;
  model_performance?: {
    silhouette_score: number;
  };
  model_components?: {
    collaborative_filtering: {
      method: string;
      rank: number;
      weight: number;
    };
    content_based_filtering: {
      method: string;
      vocabulary_size: number;
      weight: number;
    };
  };
}

export interface ApiError {
  detail: string;
  status?: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  full_name: string;
  location_zone: string;
}
