export interface Group {
  id: number;
  name: string;
  description: string;
  category?: string;
  price: number;
  original_price?: number;
  participants?: number;
  participants_count?: number;
  max_participants?: number;
  moq?: number;
  created?: string;
  admin_group_id?: number;
  product_id?: number;
}

export interface CurrentUser {
  id: number;
  email: string;
  full_name?: string;
  location_zone?: string;
  is_admin?: boolean;
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
*** End Patch
```} }}} } }}}  assistant to=functions.apply_patch конец ***!

