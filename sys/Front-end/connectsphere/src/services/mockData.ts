/**
 * Mock Data for Front-End Development
 * Use this when backend is not available
 * Switch to real API by changing USE_MOCK_DATA in api.ts
 */

export interface MockGroup {
  id: number;
  group_buy_id?: number;
  name: string;
  product_name?: string;
  description: string;
  category: string;
  price: number;
  bulk_price?: number;
  unit_price?: number;
  original_price?: number;
  image_url?: string;
  product_image_url?: string;
  participants: number;
  participants_count?: number;
  moq: number;
  moq_progress?: number;
  // Money tracking (primary)
  current_amount?: number; // Total money collected so far
  target_amount?: number; // Target amount to reach
  amount_progress?: number; // Percentage of target amount reached
  status: string;
  is_completed?: boolean;
  delivery_location?: string;
  created: string;
  created_at?: string;
  end_date?: string;
  supplier_name?: string;
  supplier_email?: string;
  supplier_phone?: string;
  recommendation_score?: number;
  savings_factor?: number;
  quantity?: number;
  total_paid?: number;
}

// Mock Groups Data
export const mockGroups: MockGroup[] = [
  {
    id: 1,
    group_buy_id: 1,
    name: "Premium Arabica Coffee Beans",
    product_name: "Premium Arabica Coffee Beans",
    description: "Freshly roasted premium Arabica coffee beans from Ethiopia. Rich aroma and smooth taste. Perfect for coffee enthusiasts.",
    category: "Beverages",
    price: 24.99,
    bulk_price: 24.99,
    unit_price: 34.99,
    original_price: 34.99,
    image_url: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800&auto=format&fit=crop",
    product_image_url: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=800&auto=format&fit=crop",
    participants: 35,
    participants_count: 35,
    moq: 50,
    moq_progress: 70,
    current_amount: 874.65, // 35 * $24.99
    target_amount: 1249.50, // 50 * $24.99
    amount_progress: 70,
    status: "active",
    is_completed: false,
    delivery_location: "Downtown Market, Harare",
    created: "2024-11-10T10:00:00Z",
    created_at: "2024-11-10T10:00:00Z",
    end_date: "2024-11-25T23:59:59Z",
    supplier_name: "Ethiopian Coffee Co.",
    supplier_email: "info@ethiopiancoffee.co.zw",
    supplier_phone: "+263 123 456 789",
    recommendation_score: 0.92,
    savings_factor: 0.29
  },
  {
    id: 2,
    group_buy_id: 2,
    name: "Organic Quinoa - 5kg Pack",
    product_name: "Organic Quinoa - 5kg Pack",
    description: "Premium organic quinoa, rich in protein and fiber. Perfect for healthy meals and meal prep.",
    category: "Grains & Cereals",
    price: 45.00,
    bulk_price: 45.00,
    unit_price: 65.00,
    original_price: 65.00,
    image_url: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&auto=format&fit=crop",
    product_image_url: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=800&auto=format&fit=crop",
    participants: 48,
    participants_count: 48,
    moq: 50,
    moq_progress: 96,
    current_amount: 2160.00, // 48 * $45.00
    target_amount: 2250.00, // 50 * $45.00
    amount_progress: 96,
    status: "active",
    is_completed: false,
    delivery_location: "Mbare Market",
    created: "2024-11-12T14:30:00Z",
    created_at: "2024-11-12T14:30:00Z",
    end_date: "2024-11-22T23:59:59Z",
    supplier_name: "Organic Foods Zimbabwe",
    recommendation_score: 0.88,
    savings_factor: 0.31
  },
  {
    id: 3,
    group_buy_id: 3,
    name: "Fresh Avocados - Box of 30",
    product_name: "Fresh Avocados - Box of 30",
    description: "Premium grade avocados, perfectly ripe. Great for salads, smoothies, and guacamole.",
    category: "Fruits",
    price: 18.50,
    bulk_price: 18.50,
    unit_price: 28.00,
    original_price: 28.00,
    image_url: "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=800&auto=format&fit=crop",
    product_image_url: "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=800&auto=format&fit=crop",
    participants: 50,
    participants_count: 50,
    moq: 50,
    moq_progress: 100,
    current_amount: 925.00, // 50 * $18.50
    target_amount: 925.00, // 50 * $18.50
    amount_progress: 100,
    status: "ready_for_pickup",
    is_completed: true,
    delivery_location: "Avondale Farmers Market",
    created: "2024-11-08T08:00:00Z",
    created_at: "2024-11-08T08:00:00Z",
    end_date: "2024-11-18T23:59:59Z",
    supplier_name: "Fresh Produce Ltd",
    recommendation_score: 0.85,
    savings_factor: 0.34
  },
  {
    id: 13,
    group_buy_id: 13,
    name: "Wireless Bluetooth Headphones",
    product_name: "Wireless Bluetooth Headphones",
    description: "Premium noise-cancelling wireless headphones with 30-hour battery life. This order has been completed and collected.",
    category: "Electronics",
    price: 89.99,
    bulk_price: 89.99,
    unit_price: 129.99,
    original_price: 129.99,
    image_url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop",
    product_image_url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop",
    participants: 75,
    participants_count: 75,
    moq: 75,
    moq_progress: 100,
    current_amount: 6749.25, // 75 * $89.99
    target_amount: 6749.25, // 75 * $89.99
    amount_progress: 100,
    status: "completed",
    is_completed: true,
    delivery_location: "TechHub Store - Eastgate Mall",
    created: "2024-10-25T08:00:00Z",
    created_at: "2024-10-25T08:00:00Z",
    end_date: "2024-11-05T23:59:59Z",
    supplier_name: "TechHub Electronics",
    recommendation_score: 0.92,
    savings_factor: 0.31
  },
  {
    id: 4,
    group_buy_id: 4,
    name: "Premium Olive Oil - 2L",
    product_name: "Premium Olive Oil - 2L",
    description: "Extra virgin olive oil from Greece. Cold-pressed and perfect for cooking and salads.",
    category: "Others",
    price: 32.99,
    bulk_price: 32.99,
    unit_price: 49.99,
    original_price: 49.99,
    image_url: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=800&auto=format&fit=crop",
    product_image_url: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=800&auto=format&fit=crop",
    participants: 22,
    participants_count: 22,
    moq: 40,
    moq_progress: 55,
    current_amount: 725.78, // 22 * $32.99
    target_amount: 1319.60, // 40 * $32.99
    amount_progress: 55,
    status: "active",
    is_completed: false,
    delivery_location: "Borrowdale Shopping Center",
    created: "2024-11-14T11:00:00Z",
    created_at: "2024-11-14T11:00:00Z",
    end_date: "2024-11-28T23:59:59Z",
    supplier_name: "Mediterranean Imports",
    recommendation_score: 0.78,
    savings_factor: 0.34
  },
  {
    id: 5,
    group_buy_id: 5,
    name: "Whole Chicken - Free Range",
    product_name: "Whole Chicken - Free Range",
    description: "Locally raised free-range chickens. Fresh and healthy, average 2kg per chicken.",
    category: "Meat & Poultry",
    price: 8.99,
    bulk_price: 8.99,
    unit_price: 12.99,
    original_price: 12.99,
    image_url: "https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=800&auto=format&fit=crop",
    product_image_url: "https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=800&auto=format&fit=crop",
    participants: 60,
    participants_count: 60,
    moq: 100,
    moq_progress: 60,
    current_amount: 539.40, // 60 * $8.99
    target_amount: 899.00, // 100 * $8.99
    amount_progress: 60,
    status: "active",
    is_completed: false,
    delivery_location: "Multiple locations available",
    created: "2024-11-15T09:00:00Z",
    created_at: "2024-11-15T09:00:00Z",
    end_date: "2024-11-20T23:59:59Z",
    supplier_name: "Local Poultry Farm",
    recommendation_score: 0.95,
    savings_factor: 0.31
  },
  {
    id: 6,
    group_buy_id: 6,
    name: "Organic Tomatoes - 10kg",
    product_name: "Organic Tomatoes - 10kg",
    description: "Fresh organic tomatoes from local farms. Perfect for sauces, salads, and cooking.",
    category: "Vegetables",
    price: 12.00,
    bulk_price: 12.00,
    unit_price: 18.00,
    original_price: 18.00,
    image_url: "https://images.unsplash.com/photo-1546470427-e26264be0b95?w=800&auto=format&fit=crop",
    product_image_url: "https://images.unsplash.com/photo-1546470427-e26264be0b95?w=800&auto=format&fit=crop",
    participants: 15,
    participants_count: 15,
    moq: 30,
    moq_progress: 50,
    current_amount: 180.00, // 15 * $12.00
    target_amount: 360.00, // 30 * $12.00
    amount_progress: 50,
    status: "active",
    is_completed: false,
    delivery_location: "Mbare Market",
    created: "2024-11-16T07:00:00Z",
    created_at: "2024-11-16T07:00:00Z",
    end_date: "2024-11-21T23:59:59Z",
    supplier_name: "Green Valley Farms",
    recommendation_score: 0.82,
    savings_factor: 0.33
  },
  {
    id: 7,
    group_buy_id: 7,
    name: "Artisan Bread Assortment",
    product_name: "Artisan Bread Assortment",
    description: "Mix of sourdough, whole wheat, and multigrain breads. Freshly baked daily.",
    category: "Bakery",
    price: 15.50,
    bulk_price: 15.50,
    unit_price: 22.00,
    original_price: 22.00,
    image_url: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop",
    product_image_url: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&auto=format&fit=crop",
    participants: 38,
    participants_count: 38,
    moq: 40,
    moq_progress: 95,
    current_amount: 589.00, // 38 * $15.50
    target_amount: 620.00, // 40 * $15.50
    amount_progress: 95,
    status: "active",
    is_completed: false,
    delivery_location: "Avondale",
    created: "2024-11-17T06:00:00Z",
    created_at: "2024-11-17T06:00:00Z",
    end_date: "2024-11-19T23:59:59Z",
    supplier_name: "Artisan Bakery Co.",
    recommendation_score: 0.75,
    savings_factor: 0.30
  },
  {
    id: 8,
    group_buy_id: 8,
    name: "Fresh Salmon Fillets - 1kg",
    product_name: "Fresh Salmon Fillets - 1kg",
    description: "Premium Atlantic salmon fillets. Rich in Omega-3, perfect for grilling or baking.",
    category: "Seafood",
    price: 42.00,
    bulk_price: 42.00,
    unit_price: 59.00,
    original_price: 59.00,
    image_url: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800&auto=format&fit=crop",
    product_image_url: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=800&auto=format&fit=crop",
    participants: 28,
    participants_count: 28,
    moq: 35,
    moq_progress: 80,
    current_amount: 1176.00, // 28 * $42.00
    target_amount: 1470.00, // 35 * $42.00
    amount_progress: 80,
    status: "active",
    is_completed: false,
    delivery_location: "Sam Levy's Village",
    created: "2024-11-17T10:00:00Z",
    created_at: "2024-11-17T10:00:00Z",
    end_date: "2024-11-20T23:59:59Z",
    supplier_name: "Ocean Fresh Imports",
    recommendation_score: 0.90,
    savings_factor: 0.29
  }
];

// Mock User's Groups (for GroupList page)
export const mockMyGroups: MockGroup[] = [
  {
    ...mockGroups[0],
    quantity: 2,
    total_paid: 49.98,
    status: "active",
    is_completed: false
  },
  {
    ...mockGroups[2],
    quantity: 1,
    total_paid: 18.50,
    status: "ready_for_pickup",
    is_completed: true
  },
  {
    ...mockGroups[4],
    quantity: 3,
    total_paid: 26.97,
    status: "active",
    is_completed: false
  },
  {
    id: 13,
    group_buy_id: 13,
    name: "Wireless Bluetooth Headphones",
    product_name: "Wireless Bluetooth Headphones",
    description: "Premium noise-cancelling wireless headphones with 30-hour battery life. This order has been completed and collected.",
    category: "Electronics",
    price: 89.99,
    bulk_price: 89.99,
    unit_price: 129.99,
    original_price: 129.99,
    image_url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop",
    product_image_url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop",
    participants: 75,
    participants_count: 75,
    moq: 75,
    moq_progress: 100,
    current_amount: 6749.25,
    target_amount: 6749.25,
    amount_progress: 100,
    quantity: 1,
    total_paid: 89.99,
    status: "completed",
    is_completed: true,
    delivery_location: "TechHub Store - Eastgate Mall",
    created: "2024-10-25T08:00:00Z",
    created_at: "2024-10-25T08:00:00Z",
    end_date: "2024-11-05T23:59:59Z",
    supplier_name: "TechHub Electronics",
    recommendation_score: 0.92,
    savings_factor: 0.31
  },
  {
    id: 14,
    group_buy_id: 14,
    name: "Premium Coffee Beans - 5kg",
    product_name: "Premium Coffee Beans - 5kg",
    description: "Freshly roasted Arabica coffee beans. Goal reached! Waiting for supplier to prepare order for pickup.",
    category: "Food",
    price: 35.00,
    bulk_price: 35.00,
    unit_price: 50.00,
    original_price: 50.00,
    image_url: "https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=800&auto=format&fit=crop",
    product_image_url: "https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=800&auto=format&fit=crop",
    participants: 30,
    participants_count: 30,
    moq: 30,
    moq_progress: 100,
    current_amount: 1050.00, // 30 * $35.00
    target_amount: 1050.00, // 30 * $35.00
    amount_progress: 100,
    quantity: 2,
    total_paid: 70.00,
    status: "active", // Still active, but goal reached
    is_completed: false,
    delivery_location: "Downtown Coffee Hub",
    created: "2024-11-10T08:00:00Z",
    created_at: "2024-11-10T08:00:00Z",
    end_date: "2024-11-20T23:59:59Z",
    supplier_name: "Premium Roasters Ltd",
    recommendation_score: 0.88,
    savings_factor: 0.30
  }
];

// Mock User Data
export const mockUser = {
  id: 1,
  email: "trader@connectsphere.com",
  full_name: "John Trader",
  location_zone: "Harare",
  is_admin: false,
  is_supplier: false,
  preferred_categories: ["Beverages", "Fruits", "Meat & Poultry"],
  budget_range: "medium",
  experience_level: "intermediate",
  joined_date: "2024-01-15T00:00:00Z"
};

// Mock Recommendations (for TraderDashboard)
export const mockRecommendations: MockGroup[] = [
  mockGroups[0], // Coffee - 92% match
  mockGroups[4], // Chicken - 95% match
  mockGroups[7], // Salmon - 90% match
  mockGroups[1], // Quinoa - 88% match
  mockGroups[2], // Avocados - 85% match
  mockGroups[5], // Tomatoes - 82% match
  mockGroups[3], // Olive Oil - 78% match
  mockGroups[6], // Bread - 75% match
].sort((a, b) => (b.recommendation_score || 0) - (a.recommendation_score || 0));

// Mock Payment Response
export const mockPaymentResponse = {
  success: true,
  payment_url: "https://checkout.flutterwave.com/mock-payment",
  tx_ref: `TX-${Date.now()}`,
  transaction_id: `TRX-${Date.now()}`,
  amount: 49.98,
  status: "pending"
};

// Helper function to simulate API delay
export const simulateDelay = (ms: number = 500) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Helper to get a specific group by ID
export const getMockGroupById = (id: number): MockGroup | undefined => {
  return mockGroups.find(g => g.id === id || g.group_buy_id === id);
};

// Helper to filter groups by category
export const getMockGroupsByCategory = (category: string): MockGroup[] => {
  if (category === 'All') return mockGroups;
  return mockGroups.filter(g => g.category === category);
};

// Helper to search groups
export const searchMockGroups = (query: string): MockGroup[] => {
  const lowerQuery = query.toLowerCase();
  return mockGroups.filter(g => 
    g.name.toLowerCase().includes(lowerQuery) ||
    g.description.toLowerCase().includes(lowerQuery) ||
    g.category.toLowerCase().includes(lowerQuery)
  );
};

export default {
  groups: mockGroups,
  myGroups: mockMyGroups,
  user: mockUser,
  recommendations: mockRecommendations,
  paymentResponse: mockPaymentResponse,
  getMockGroupById,
  getMockGroupsByCategory,
  searchMockGroups,
  simulateDelay
};

