export interface Group {
  id: number;
  name: string;
  description: string;
  category?: string;
  price: number;
  original_price?: number;
  originalPrice?: number;
  discountPercentage?: number;
  savings?: number;
  participants?: number;
  participants_count?: number;
  max_participants?: number;
  moq?: number;
  created?: string;
  admin_group_id?: number;
  product_id?: number;
  image_url?: string;
  joined?: boolean;
  current_amount?: number;
  target_amount?: number;
  endDate?: string;
  end_date?: string;
  status?: string;
}

export interface CurrentUser {
  id: number;
  email: string;
  full_name?: string;
  location_zone?: string;
  is_admin?: boolean;
  is_supplier?: boolean;
}

export interface PaymentInit {
  groupId: number;
  groupName: string;
  currentQuantity: number;
  newQuantity: number;
  price: string;
  originalPrice: string;
  action: string;
}
