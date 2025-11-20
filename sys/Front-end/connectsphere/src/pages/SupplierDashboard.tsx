import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Package, ShoppingCart, DollarSign, 
  TrendingUp, CheckCircle, Clock, XCircle, Eye, X, Users, Calendar, Tag 
} from 'lucide-react';
import apiService from '../services/api';
import TopNavigation from '../components/navigation/TopNavigation';
import MobileBottomNav from '../components/navigation/MobileBottomNav';
import { PageContainer, PageHeader } from '../components/layout/index';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { SkeletonCard } from '../components/feedback/Skeleton';
import { ErrorAlert } from '../components/feedback/ErrorAlert';
import { EmptyState } from '../components/feedback/EmptyState';

type TabType = 'overview' | 'orders' | 'groups' | 'payments';

interface DashboardMetrics {
  pending_orders: number;
  active_groups: number;
  monthly_revenue: number;
  total_savings_generated: number;
}

interface Order {
  id: number;
  order_number: string;
  group_name: string;
  trader_count: number;
  total_value: number;
  status: string;
  created_at: string;
}

interface Group {
  id: number;
  name: string;
  category: string;
  price: number;
  original_price: number;
  participants: number;
  max_participants: number;
  status: string;
  end_date: string;
  created_at: string;
}

interface Payment {
  id: number;
  payment_reference: string;
  order_number: string;
  amount: number;
  status: string;
  payment_method: string;
  processed_at: string;
  expected_transfer_date?: string;
}

// Mock data for supplier dashboard
const MOCK_METRICS: DashboardMetrics = {
  pending_orders: 8,
  active_groups: 12,
  monthly_revenue: 15480,
  total_savings_generated: 8920
};

const MOCK_ORDERS: Order[] = [
  {
    id: 1,
    order_number: "ORD-2024-001",
    group_name: "Organic Tomatoes - Group Buy",
    trader_count: 15,
    total_value: 525.00,
    status: "pending",
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 2,
    order_number: "ORD-2024-002",
    group_name: "Fresh Spinach - Group Buy",
    trader_count: 12,
    total_value: 504.00,
    status: "pending",
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 3,
    order_number: "ORD-2024-003",
    group_name: "Sweet Potatoes - Group Buy",
    trader_count: 20,
    total_value: 700.00,
    status: "pending",
    created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 4,
    order_number: "ORD-2024-004",
    group_name: "Mixed Bell Peppers - Group Buy",
    trader_count: 10,
    total_value: 560.00,
    status: "accepted",
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 5,
    order_number: "ORD-2024-005",
    group_name: "Fresh Carrots - Group Buy",
    trader_count: 18,
    total_value: 378.00,
    status: "accepted",
    created_at: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 6,
    order_number: "ORD-2024-006",
    group_name: "Fresh Lettuce Bundle - Group Buy",
    trader_count: 14,
    total_value: 392.00,
    status: "completed",
    created_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 7,
    order_number: "ORD-2024-007",
    group_name: "Butternut Squash - Group Buy",
    trader_count: 9,
    total_value: 283.50,
    status: "completed",
    created_at: new Date(Date.now() - 60 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 8,
    order_number: "ORD-2024-008",
    group_name: "Fresh Broccoli - Group Buy",
    trader_count: 11,
    total_value: 539.00,
    status: "pending",
    created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
  }
];

const MOCK_GROUPS: Group[] = [
  {
    id: 1,
    name: "Organic Tomatoes - Group Buy",
    category: "Vegetables",
    price: 3.50,
    original_price: 5.00,
    participants: 45,
    max_participants: 50,
    status: "active",
    end_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 2,
    name: "Fresh Spinach - Group Buy",
    category: "Vegetables",
    price: 4.20,
    original_price: 6.00,
    participants: 38,
    max_participants: 50,
    status: "active",
    end_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 3,
    name: "Sweet Potatoes - Group Buy",
    category: "Vegetables",
    price: 2.50,
    original_price: 3.50,
    participants: 50,
    max_participants: 50,
    status: "completed",
    end_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 4,
    name: "Mixed Bell Peppers - Group Buy",
    category: "Vegetables",
    price: 5.60,
    original_price: 8.00,
    participants: 42,
    max_participants: 50,
    status: "active",
    end_date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 5,
    name: "Fresh Carrots - Group Buy",
    category: "Vegetables",
    price: 2.10,
    original_price: 3.00,
    participants: 48,
    max_participants: 50,
    status: "active",
    end_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 6,
    name: "Fresh Lettuce Bundle - Group Buy",
    category: "Vegetables",
    price: 2.80,
    original_price: 4.00,
    participants: 50,
    max_participants: 50,
    status: "completed",
    end_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 7,
    name: "Fresh Green Beans - Group Buy",
    category: "Vegetables",
    price: 3.85,
    original_price: 5.50,
    participants: 32,
    max_participants: 50,
    status: "active",
    end_date: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 8,
    name: "Butternut Squash - Group Buy",
    category: "Vegetables",
    price: 3.15,
    original_price: 4.50,
    participants: 28,
    max_participants: 50,
    status: "active",
    end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 9,
    name: "Fresh Cucumbers - Group Buy",
    category: "Vegetables",
    price: 2.45,
    original_price: 3.50,
    participants: 40,
    max_participants: 50,
    status: "active",
    end_date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 10,
    name: "Fresh Broccoli - Group Buy",
    category: "Vegetables",
    price: 4.90,
    original_price: 7.00,
    participants: 35,
    max_participants: 50,
    status: "active",
    end_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const MOCK_PAYMENTS: Payment[] = [
  {
    id: 1,
    payment_reference: "PAY-2024-001",
    order_number: "ORD-2024-006",
    amount: 392.00,
    status: "completed",
    payment_method: "Bank Transfer",
    processed_at: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 2,
    payment_reference: "PAY-2024-002",
    order_number: "ORD-2024-007",
    amount: 283.50,
    status: "completed",
    payment_method: "Bank Transfer",
    processed_at: new Date(Date.now() - 60 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 3,
    payment_reference: "PAY-2024-003",
    order_number: "ORD-2024-004",
    amount: 560.00,
    status: "pending",
    payment_method: "Bank Transfer",
    processed_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    expected_transfer_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 4,
    payment_reference: "PAY-2024-004",
    order_number: "ORD-2024-005",
    amount: 378.00,
    status: "processing",
    payment_method: "Bank Transfer",
    processed_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    expected_transfer_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 5,
    payment_reference: "PAY-2024-005",
    order_number: "ORD-2024-003",
    amount: 700.00,
    status: "pending",
    payment_method: "Bank Transfer",
    processed_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    expected_transfer_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
  }
];

export default function SupplierDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(MOCK_METRICS);
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);
  const [groups, setGroups] = useState<Group[]>(MOCK_GROUPS);
  const [payments, setPayments] = useState<Payment[]>(MOCK_PAYMENTS);
  const [loading, setLoading] = useState(false); // Set to false to show mock data immediately
  const [error, setError] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [showGroupDetails, setShowGroupDetails] = useState(false);

  // Use mock data instead of API calls
  useEffect(() => {
    // Simulate loading for better UX
    setLoading(true);
    setTimeout(() => {
      setMetrics(MOCK_METRICS);
      setOrders(MOCK_ORDERS);
      setGroups(MOCK_GROUPS);
      setPayments(MOCK_PAYMENTS);
      setLoading(false);
    }, 500);
  }, []);

  const handleOrderAction = async (orderId: number, action: 'accept' | 'reject') => {
    // Mock: Update order status locally
    setOrders(prevOrders => 
      prevOrders.map(order => 
        order.id === orderId 
          ? { ...order, status: action === 'accept' ? 'accepted' : 'rejected' }
          : order
      )
    );
    
    // Update metrics
    if (action === 'accept') {
      setMetrics(prev => prev ? { ...prev, pending_orders: prev.pending_orders - 1 } : null);
    }
  };

  const handleViewGroup = (group: Group) => {
    setSelectedGroup(group);
    setShowGroupDetails(true);
  };

  const handleCloseGroupDetails = () => {
    setShowGroupDetails(false);
    setSelectedGroup(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-16 md:pb-0">
      <TopNavigation userRole="supplier" />
      
      <PageContainer>
        <PageHeader
          title="Supplier Dashboard"
          description="Manage your orders, groups, and payments"
          breadcrumbs={[
            { label: 'Home' }
          ]}
        />

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          <Button
            variant={activeTab === 'overview' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('overview')}
            leftIcon={<LayoutDashboard className="h-4 w-4" />}
          >
            Overview
          </Button>
          <Button
            variant={activeTab === 'orders' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('orders')}
            leftIcon={<ShoppingCart className="h-4 w-4" />}
          >
            Orders ({orders.filter(o => o.status === 'pending').length})
          </Button>
          <Button
            variant={activeTab === 'groups' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('groups')}
            leftIcon={<Package className="h-4 w-4" />}
          >
            Groups ({groups.filter(g => g.status === 'active').length})
          </Button>
          <Button
            variant={activeTab === 'payments' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('payments')}
            leftIcon={<DollarSign className="h-4 w-4" />}
          >
            Payments ({payments.length})
          </Button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        )}

        {/* Error State */}
        {error && (
          <ErrorAlert
            title="Unable to load dashboard"
            message={error}
            onRetry={() => window.location.reload()}
            variant="card"
          />
        )}

        {/* Tab Content */}
        {!loading && !error && (
          <>
            {/* Overview Tab */}
            {activeTab === 'overview' && metrics && (
              <div className="space-y-6">
                {/* Metric Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card variant="elevated" padding="lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="body-sm text-gray-600 mb-1">Pending Orders</p>
                        <p className="text-3xl font-bold text-gray-900">{metrics.pending_orders}</p>
                      </div>
                      <div className="h-12 w-12 rounded-full bg-warning-100 flex items-center justify-center">
                        <Clock className="h-6 w-6 text-warning-600" />
                      </div>
                    </div>
                  </Card>

                  <Card variant="elevated" padding="lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="body-sm text-gray-600 mb-1">Active Groups</p>
                        <p className="text-3xl font-bold text-gray-900">{metrics.active_groups}</p>
                      </div>
                      <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center">
                        <Package className="h-6 w-6 text-primary-600" />
                      </div>
                    </div>
                  </Card>

                  <Card variant="elevated" padding="lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="body-sm text-gray-600 mb-1">Monthly Revenue</p>
                        <p className="text-3xl font-bold text-gray-900">${metrics.monthly_revenue.toLocaleString()}</p>
                      </div>
                      <div className="h-12 w-12 rounded-full bg-success-100 flex items-center justify-center">
                        <DollarSign className="h-6 w-6 text-success-600" />
                      </div>
                    </div>
                  </Card>

                  <Card variant="elevated" padding="lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="body-sm text-gray-600 mb-1">Total Savings</p>
                        <p className="text-3xl font-bold text-gray-900">${metrics.total_savings_generated.toLocaleString()}</p>
                      </div>
                      <div className="h-12 w-12 rounded-full bg-info-100 flex items-center justify-center">
                        <TrendingUp className="h-6 w-6 text-info-600" />
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Recent Orders */}
                <Card variant="default" padding="lg">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="heading-4">Recent Orders</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setActiveTab('orders')}
                    >
                      View All
                    </Button>
                  </div>

                  {orders.slice(0, 5).length === 0 ? (
                    <EmptyState
                      icon="package"
                      title="No orders yet"
                      description="Orders will appear here once traders join your groups"
                    />
                  ) : (
                    <div className="space-y-3">
                      {orders.slice(0, 5).map((order) => (
                        <div
                          key={order.id}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex-1">
                            <p className="heading-6">{order.group_name}</p>
                            <p className="body-sm text-gray-600">
                              Order #{order.order_number} • {order.trader_count} traders
                            </p>
                          </div>
                          <div className="text-right mr-4">
                            <p className="heading-6">${order.total_value.toLocaleString()}</p>
                            <Badge 
                              variant={
                                order.status === 'pending' ? 'warning' :
                                order.status === 'confirmed' ? 'info' :
                                order.status === 'shipped' ? 'secondary' :
                                order.status === 'delivered' ? 'success' : 'ghost'
                              }
                              size="sm"
                            >
                              {order.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="heading-3">All Orders</h2>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate('/supplier/orders')}
                    >
                      Filter
                    </Button>
                  </div>
                </div>

                {orders.length === 0 ? (
                  <EmptyState
                    icon="package"
                    title="No orders"
                    description="Orders from completed groups will appear here"
                  />
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {orders.map((order) => (
                      <Card key={order.id} variant="elevated" padding="lg">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="heading-5">{order.group_name}</h3>
                              <Badge 
                                variant={
                                  order.status === 'pending' ? 'warning' :
                                  order.status === 'confirmed' ? 'info' :
                                  order.status === 'shipped' ? 'secondary' :
                                  order.status === 'delivered' ? 'success' : 'ghost'
                                }
                              >
                                {order.status}
                              </Badge>
                            </div>
                            <div className="flex flex-wrap gap-4 body-sm text-gray-600">
                              <span>Order #{order.order_number}</span>
                              <span>•</span>
                              <span>{order.trader_count} traders</span>
                              <span>•</span>
                              <span>{new Date(order.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="body-sm text-gray-600">Total Value</p>
                              <p className="text-2xl font-bold text-gray-900">
                                ${order.total_value.toLocaleString()}
                              </p>
                            </div>

                            {order.status === 'pending' && (
                              <div className="flex gap-2">
                                <Button
                                  variant="success"
                                  size="sm"
                                  onClick={() => handleOrderAction(order.id, 'accept')}
                                  leftIcon={<CheckCircle className="h-4 w-4" />}
                                >
                                  Accept
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleOrderAction(order.id, 'reject')}
                                  leftIcon={<XCircle className="h-4 w-4" />}
                                >
                                  Reject
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Groups Tab */}
            {activeTab === 'groups' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="heading-3">My Groups</h2>
                  <Button
                    onClick={() => navigate('/create-group')}
                    leftIcon={<Package className="h-4 w-4" />}
                  >
                    Create Group
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {groups.map((group) => (
                    <Card key={group.id} variant="elevated" padding="lg">
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="heading-5 flex-1">{group.name}</h3>
                            <Badge 
                              variant={
                                group.status === 'active' ? 'success' :
                                group.status === 'completed' ? 'secondary' : 'ghost'
                              }
                            >
                              {group.status}
                            </Badge>
                          </div>
                          <p className="body-sm text-gray-600">{group.category}</p>
                        </div>

                        <div className="flex items-center justify-between">
                          <div>
                            <p className="body-sm text-gray-600">Price</p>
                            <div className="flex items-center gap-2">
                              <p className="text-xl font-bold text-gray-900">${group.price}</p>
                              <p className="body-sm text-gray-500 line-through">${group.original_price}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="body-sm text-gray-600">Participants</p>
                            <p className="text-xl font-bold text-primary-600">
                              {group.participants}/{group.max_participants}
                            </p>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-gray-200">
                          <div className="flex items-center justify-between body-sm text-gray-600">
                            <span>End Date</span>
                            <span>{new Date(group.end_date).toLocaleDateString()}</span>
                          </div>
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          fullWidth
                          onClick={() => handleViewGroup(group)}
                          leftIcon={<Eye className="h-4 w-4" />}
                        >
                          View Details
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Payments Tab */}
            {activeTab === 'payments' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="heading-3">Payments</h2>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {payments.map((payment) => (
                    <Card key={payment.id} variant="elevated" padding="lg">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="heading-5">Payment #{payment.payment_reference}</h3>
                            <Badge 
                              variant={
                                payment.status === 'completed' ? 'success' :
                                payment.status === 'processing' ? 'info' :
                                payment.status === 'pending' ? 'warning' : 'ghost'
                              }
                            >
                              {payment.status}
                            </Badge>
                          </div>
                          <div className="space-y-1 body-sm text-gray-600">
                            <p>Order: {payment.order_number}</p>
                            <p>Method: {payment.payment_method}</p>
                            <p>Processed: {new Date(payment.processed_at).toLocaleDateString()}</p>
                            {payment.expected_transfer_date && (
                              <p className="text-primary-600 font-medium">
                                Expected Transfer: {new Date(payment.expected_transfer_date).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="body-sm text-gray-600 mb-1">Amount</p>
                          <p className="text-3xl font-bold text-success-600">
                            ${payment.amount.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                <Card variant="default" padding="lg" className="bg-primary-50 border-primary-200">
                  <div className="flex items-start gap-3">
                    <DollarSign className="h-6 w-6 text-primary-600 flex-shrink-0" />
                    <div>
                      <h4 className="heading-5 text-primary-900 mb-2">Payment Summary</h4>
                      <div className="space-y-2 body-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-700">Total Completed Payments:</span>
                          <span className="font-semibold text-gray-900">
                            ${payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-700">Pending Payments:</span>
                          <span className="font-semibold text-gray-900">
                            ${payments.filter(p => p.status === 'pending' || p.status === 'processing').reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-primary-200">
                          <span className="text-gray-700 font-semibold">Total Revenue:</span>
                          <span className="font-bold text-gray-900">
                            ${payments.reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </>
        )}
      </PageContainer>

      <MobileBottomNav userRole="supplier" />

      {/* Group Details Modal */}
      {showGroupDetails && selectedGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="heading-3">Group Details</h2>
              <button
                onClick={handleCloseGroupDetails}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Group Name and Status */}
              <div>
                <div className="flex items-start justify-between mb-2">
                  <h3 className="heading-4 flex-1">{selectedGroup.name}</h3>
                  <Badge 
                    variant={
                      selectedGroup.status === 'active' ? 'success' :
                      selectedGroup.status === 'completed' ? 'secondary' : 'ghost'
                    }
                  >
                    {selectedGroup.status.toUpperCase()}
                  </Badge>
                </div>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-primary-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign className="h-4 w-4 text-primary-600" />
                    <p className="body-sm text-gray-600">Current Price</p>
                  </div>
                  <p className="text-2xl font-bold text-primary-600">${selectedGroup.price}</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign className="h-4 w-4 text-gray-600" />
                    <p className="body-sm text-gray-600">Original Price</p>
                  </div>
                  <p className="text-2xl font-bold text-gray-500 line-through">${selectedGroup.original_price}</p>
                </div>

                <div className="bg-success-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="h-4 w-4 text-success-600" />
                    <p className="body-sm text-gray-600">Participants</p>
                  </div>
                  <p className="text-2xl font-bold text-success-600">
                    {selectedGroup.participants}/{selectedGroup.max_participants}
                  </p>
                </div>

                <div className="bg-warning-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="h-4 w-4 text-warning-600" />
                    <p className="body-sm text-gray-600">Savings</p>
                  </div>
                  <p className="text-2xl font-bold text-warning-600">
                    {Math.round(((selectedGroup.original_price - selectedGroup.price) / selectedGroup.original_price) * 100)}%
                  </p>
                </div>
              </div>

              {/* Group Information */}
              <Card variant="default" padding="lg">
                <h4 className="heading-5 mb-4">Group Information</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-gray-500" />
                      <span className="body-sm text-gray-600">Category</span>
                    </div>
                    <span className="body-sm font-semibold text-gray-900">{selectedGroup.category}</span>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="body-sm text-gray-600">Created Date</span>
                    </div>
                    <span className="body-sm font-semibold text-gray-900">
                      {new Date(selectedGroup.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="body-sm text-gray-600">End Date</span>
                    </div>
                    <span className="body-sm font-semibold text-gray-900">
                      {new Date(selectedGroup.end_date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-gray-500" />
                      <span className="body-sm text-gray-600">Total Revenue</span>
                    </div>
                    <span className="text-xl font-bold text-success-600">
                      ${(selectedGroup.price * selectedGroup.participants).toLocaleString()}
                    </span>
                  </div>
                </div>
              </Card>

              {/* Progress Bar */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="body-sm text-gray-600">Group Fill Progress</span>
                  <span className="body-sm font-semibold text-gray-900">
                    {Math.round((selectedGroup.participants / selectedGroup.max_participants) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all ${
                      selectedGroup.participants === selectedGroup.max_participants
                        ? 'bg-success-500'
                        : 'bg-primary-500'
                    }`}
                    style={{ width: `${(selectedGroup.participants / selectedGroup.max_participants) * 100}%` }}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  fullWidth
                  onClick={handleCloseGroupDetails}
                >
                  Close
                </Button>
                {selectedGroup.status === 'active' && (
                  <Button
                    variant="default"
                    fullWidth
                    onClick={() => {
                      navigate(`/edit-group/${selectedGroup.id}`);
                      handleCloseGroupDetails();
                    }}
                  >
                    Edit Group
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
