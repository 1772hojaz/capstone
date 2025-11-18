import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Package, ShoppingCart, DollarSign, 
  TrendingUp, CheckCircle, Clock, XCircle 
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

export default function SupplierDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch dashboard data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [metricsData, ordersData] = await Promise.all([
          apiService.get('/api/supplier/dashboard/metrics'),
          apiService.get('/api/supplier/orders')
        ]);
        
        setMetrics(metricsData);
        setOrders(ordersData);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        setError('Failed to load dashboard data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleOrderAction = async (orderId: number, action: 'accept' | 'reject') => {
    try {
      await apiService.post(`/api/supplier/orders/${orderId}/${action}`, {});
      // Refresh orders
      const ordersData = await apiService.get('/api/supplier/orders');
      setOrders(ordersData);
    } catch (err) {
      console.error(`Failed to ${action} order:`, err);
      alert(`Failed to ${action} order`);
    }
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
            Groups
          </Button>
          <Button
            variant={activeTab === 'payments' ? 'default' : 'ghost'}
            onClick={() => setActiveTab('payments')}
            leftIcon={<DollarSign className="h-4 w-4" />}
          >
            Payments
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
                    onClick={() => navigate('/supplier/groups/create')}
                    leftIcon={<Package className="h-4 w-4" />}
                  >
                    Create Group
                  </Button>
                </div>

                <EmptyState
                  icon="package"
                  title="No groups yet"
                  description="Create your first group buy to get started"
                  actionLabel="Create Group"
                  onAction={() => navigate('/supplier/groups/create')}
                />
              </div>
            )}

            {/* Payments Tab */}
            {activeTab === 'payments' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="heading-3">Payments</h2>
                </div>

                <EmptyState
                  icon="cart"
                  title="No payments yet"
                  description="Payments for completed orders will appear here"
                />
              </div>
            )}
          </>
        )}
      </PageContainer>

      <MobileBottomNav userRole="supplier" />
    </div>
  );
}
