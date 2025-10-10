/**
 * Products API
 */
import api from './api';

export interface Product {
  id: number;
  name: string;
  category: string;
  unit: string;
  description?: string;
  current_price?: number;
  image_url?: string;
  created_at: string;
}

export const productsApi = {
  async getAll(): Promise<Product[]> {
    return api.get<Product[]>('/products');
  },

  async getById(id: number): Promise<Product> {
    return api.get<Product>(`/products/${id}`);
  },

  async create(product: Omit<Product, 'id' | 'created_at'>): Promise<Product> {
    return api.post<Product>('/products', product);
  },

  async update(id: number, product: Partial<Product>): Promise<Product> {
    return api.put<Product>(`/products/${id}`, product);
  },

  async delete(id: number): Promise<void> {
    return api.delete<void>(`/products/${id}`);
  },
};

export default productsApi;
