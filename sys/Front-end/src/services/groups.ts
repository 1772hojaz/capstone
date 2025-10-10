/**
 * Group-Buys API
 */
import api from './api';

export interface GroupBuy {
  id: number;
  product_id: number;
  product_name?: string;
  initiator_id: number;
  initiator_name?: string;
  target_quantity: number;
  current_quantity: number;
  deadline: string;
  status: 'open' | 'closed' | 'completed' | 'cancelled';
  price_per_unit: number;
  created_at: string;
}

export interface GroupBuyParticipant {
  id: number;
  group_buy_id: number;
  user_id: number;
  user_name?: string;
  quantity: number;
  joined_at: string;
}

export const groupsApi = {
  async getAll(): Promise<GroupBuy[]> {
    return api.get<GroupBuy[]>('/groups');
  },

  async getById(id: number): Promise<GroupBuy> {
    return api.get<GroupBuy>(`/groups/${id}`);
  },

  async create(groupBuy: Omit<GroupBuy, 'id' | 'created_at' | 'current_quantity' | 'status'>): Promise<GroupBuy> {
    return api.post<GroupBuy>('/groups', groupBuy);
  },

  async join(groupBuyId: number, quantity: number): Promise<GroupBuyParticipant> {
    return api.post<GroupBuyParticipant>(`/groups/${groupBuyId}/join`, { quantity });
  },

  async leave(groupBuyId: number): Promise<void> {
    return api.post<void>(`/groups/${groupBuyId}/leave`, {});
  },

  async getParticipants(groupBuyId: number): Promise<GroupBuyParticipant[]> {
    return api.get<GroupBuyParticipant[]>(`/groups/${groupBuyId}/participants`);
  },

  async getUserGroupBuys(): Promise<GroupBuy[]> {
    return api.get<GroupBuy[]>('/groups/my');
  },
};

export default groupsApi;
