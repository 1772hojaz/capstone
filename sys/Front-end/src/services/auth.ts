/**
 * Authentication API
 */
import api from './api';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
  phone_number?: string;
  is_admin?: boolean;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user_id: number;
  is_admin: boolean;
  location_zone: string;
}

export interface User {
  id: number;
  email: string;
  full_name: string;
  phone_number?: string;
  is_admin: boolean;
  created_at: string;
}

export const authApi = {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    if (response.access_token) {
      api.setToken(response.access_token);
    }
    return response;
  },

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/register', userData);
    if (response.access_token) {
      api.setToken(response.access_token);
    }
    return response;
  },

  async getCurrentUser(): Promise<User> {
    return api.get<User>('/auth/me');
  },

  logout() {
    api.clearToken();
  },

  isAuthenticated(): boolean {
    return !!api.getToken();
  }
};

export default authApi;
