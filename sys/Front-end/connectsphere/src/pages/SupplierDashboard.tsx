import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Package, ShoppingCart, DollarSign, 
  TrendingUp, CheckCircle, Clock, XCircle, Eye, X, Users, Calendar, Tag, Upload 
} from 'lucide-react';
import apiService from '../services/api';
import TopNavigation from '../components/navigation/TopNavigation';
import MobileBottomNav from '../components/navigation/MobileBottomNav';
import { PageContainer, PageHeader } from '../components/layout/index';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input, Textarea } from '../components/ui/Input';
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
  image: string;
  participants: number;
  total_quantity?: number;
  max_participants: number;
  current_amount?: number;
  target_amount?: number;
  status: string;
  has_order?: boolean;  // NEW: Indicates if SupplierOrder already exists
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


export default function SupplierDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [showGroupDetails, setShowGroupDetails] = useState(false);
  
  // Create Group Form State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    long_description: '',
    category: '',
    price: '',
    original_price: '',
    image: '',
    max_participants: '',
    end_date: '',
    shipping_info: '',
    estimated_delivery: '',
    manufacturer: '',
    total_stock: '',
    features: '',
    requirements: ''
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploadingImage, setUploadingImage] = useState(false);

  // Fetch dashboard data from API
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all data in parallel
        const [metricsData, ordersData, groupsData, paymentsData] = await Promise.all([
          apiService.get('/api/supplier/dashboard/metrics'),
          apiService.get('/api/supplier/orders'),
          apiService.get('/api/supplier/groups'),
          apiService.get('/api/supplier/payments')
        ]);

        setMetrics(metricsData || {
          pending_orders: 0,
          active_groups: 0,
          monthly_revenue: 0,
          total_savings_generated: 0
        });
        setOrders(ordersData || []);
        setGroups(groupsData || []);
        setPayments(paymentsData || []);
      } catch (err: any) {
        console.error('Error fetching dashboard data:', err);
        setError(err.response?.data?.detail || 'Failed to load dashboard data');
        // Initialize with empty data on error
        setMetrics({
          pending_orders: 0,
          active_groups: 0,
          monthly_revenue: 0,
          total_savings_generated: 0
        });
        setOrders([]);
        setGroups([]);
        setPayments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleOrderAction = async (orderId: number, action: 'accept' | 'reject') => {
    try {
      // Call backend API to update order status
      const actionData = {
        action: action === 'accept' ? 'confirm' : 'reject',
        delivery_method: 'pickup',
        reason: action === 'reject' ? 'Order rejected by supplier' : undefined
      };
      
      await apiService.post(`/api/supplier/orders/${orderId}/action`, actionData);
      
      // Update order status locally after successful API call
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId 
            ? { ...order, status: action === 'accept' ? 'confirmed' : 'rejected' }
            : order
        )
      );
      
      // Update metrics
      if (action === 'accept') {
        setMetrics(prev => prev ? { ...prev, pending_orders: prev.pending_orders - 1 } : null);
      }
      
      // Show success message
      alert(action === 'accept' ? 'Order accepted successfully!' : 'Order rejected successfully!');
      
    } catch (error: any) {
      console.error('Failed to update order:', error);
      alert(error.message || `Failed to ${action} order. Please try again.`);
    }
  };

  const handleViewGroup = (group: Group) => {
    setSelectedGroup(group);
    setShowGroupDetails(true);
  };

  // Handle image upload
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle create group form submission
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      let imageUrl = formData.image;

      // Upload image if file is selected
      if (imageFile) {
        setUploadingImage(true);
        try {
          const uploadResult = await apiService.uploadSupplierImage(imageFile);
          imageUrl = uploadResult.image_url;
        } catch (err: any) {
          alert('Failed to upload image: ' + err.message);
          return;
        } finally {
          setUploadingImage(false);
        }
      }

      if (!imageUrl) {
        alert('Please upload an image');
        return;
      }

      const createData = {
        name: formData.name,
        description: formData.description,
        long_description: formData.long_description || formData.description,
        category: formData.category,
        price: parseFloat(formData.price),
        original_price: parseFloat(formData.original_price),
        image: imageUrl,
        max_participants: parseInt(formData.max_participants),
        end_date: new Date(formData.end_date).toISOString(),
        admin_name: 'Supplier',
        shipping_info: formData.shipping_info,
        estimated_delivery: formData.estimated_delivery,
        manufacturer: formData.manufacturer,
        total_stock: parseInt(formData.total_stock) || 100,
        features: formData.features ? formData.features.split(',').map(f => f.trim()) : [],
        requirements: formData.requirements ? formData.requirements.split(',').map(r => r.trim()) : []
      };

      // Call supplier create group endpoint
      await apiService.post('/api/supplier/groups/create', createData);
      
      // Reset form and close modal
      setFormData({
        name: '',
        description: '',
        long_description: '',
        category: '',
        price: '',
        original_price: '',
        image: '',
        max_participants: '',
        end_date: '',
        shipping_info: '',
        estimated_delivery: '',
        manufacturer: '',
        total_stock: '',
        features: '',
        requirements: ''
      });
      setImageFile(null);
      setImagePreview('');
      setShowCreateModal(false);
      
      // Refresh groups data
      const groupsData = await apiService.get('/api/supplier/groups');
      setGroups(groupsData || []);
      alert('Group created successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to create group');
    } finally {
      setIsCreating(false);
    }
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
            Groups ({groups.length})
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
                    onClick={() => setShowCreateModal(true)}
                    leftIcon={<Package className="h-4 w-4" />}
                  >
                    Create Group
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {groups.map((group) => (
                    <Card key={group.id} variant="elevated" padding="lg">
                      <div className="space-y-4">
                        {/* Product Image */}
                        {group.image && (
                          <div className="relative w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
                            <img
                              src={group.image}
                              alt={group.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        
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
                            <p className="body-sm text-gray-600">Units Sold</p>
                            <p className="text-xl font-bold text-primary-600">
                              {group.total_quantity || group.participants}/{group.max_participants}
                            </p>
                            {group.participants > 0 && (
                              <p className="text-xs text-gray-500">
                                {group.participants} {group.participants === 1 ? 'person' : 'people'}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Money Progress */}
                        {group.current_amount !== undefined && group.target_amount !== undefined && (
                          <div className="space-y-1">
                            <div className="flex justify-between text-xs text-gray-600">
                              <span>${group.current_amount.toFixed(2)} raised</span>
                              <span>${group.target_amount.toFixed(2)} target</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-success-500 h-2 rounded-full transition-all"
                                style={{ width: `${Math.min((group.current_amount / group.target_amount) * 100, 100)}%` }}
                              />
                            </div>
                          </div>
                        )}

                        <div className="pt-3 border-t border-gray-200">
                          <div className="flex items-center justify-between body-sm text-gray-600">
                            <span>End Date</span>
                            <span>{new Date(group.end_date).toLocaleDateString()}</span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          {group.status === 'ready_for_payment' && !group.has_order && (
                            <Button
                              variant="default"
                              size="sm"
                              fullWidth
                              onClick={async () => {
                                if (confirm('Convert this completed group into an order?')) {
                                  try {
                                    const result = await apiService.post(
                                      `/api/supplier/groups/${group.id}/process-payment`
                                    );
                                    alert(result.message || 'Order created successfully!');
                                    // Refresh data
                                    const [ordersData, groupsData] = await Promise.all([
                                      apiService.get('/api/supplier/orders'),
                                      apiService.get('/api/supplier/groups')
                                    ]);
                                    setOrders(ordersData || []);
                                    setGroups(groupsData || []);
                                  } catch (err: any) {
                                    alert(err.message || 'Failed to create order');
                                  }
                                }
                              }}
                              leftIcon={<CheckCircle className="h-4 w-4" />}
                            >
                              Create Order
                            </Button>
                          )}
                          {group.status === 'ready_for_payment' && group.has_order && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                              <div className="flex items-center justify-center gap-2 text-green-700">
                                <CheckCircle className="h-5 w-5" />
                                <span className="font-medium text-sm">Order Created</span>
                              </div>
                              <p className="text-xs text-green-600 mt-1">
                                Check the Orders tab to accept/reject
                              </p>
                            </div>
                          )}
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
              {/* Product Image */}
              {selectedGroup.image && (
                <div className="relative w-full h-64 bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={selectedGroup.image}
                    alt={selectedGroup.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

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
                    <Package className="h-4 w-4 text-success-600" />
                    <p className="body-sm text-gray-600">Units Sold</p>
                  </div>
                  <p className="text-2xl font-bold text-success-600">
                    {selectedGroup.total_quantity || selectedGroup.participants}/{selectedGroup.max_participants}
                  </p>
                  {selectedGroup.participants > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      {selectedGroup.participants} {selectedGroup.participants === 1 ? 'person' : 'people'}
                    </p>
                  )}
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
                      ${(selectedGroup.current_amount || (selectedGroup.price * selectedGroup.participants)).toLocaleString()}
                    </span>
                  </div>
                </div>
              </Card>

              {/* Progress Bar */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="body-sm text-gray-600">Progress</span>
                  <span className="body-sm font-semibold text-gray-900">
                    {selectedGroup.current_amount !== undefined && selectedGroup.target_amount !== undefined
                      ? Math.round((selectedGroup.current_amount / selectedGroup.target_amount) * 100)
                      : Math.round(((selectedGroup.total_quantity || selectedGroup.participants) / selectedGroup.max_participants) * 100)
                    }%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all ${
                      (selectedGroup.total_quantity || selectedGroup.participants) >= selectedGroup.max_participants
                        ? 'bg-success-500'
                        : 'bg-primary-500'
                    }`}
                    style={{ 
                      width: `${selectedGroup.current_amount !== undefined && selectedGroup.target_amount !== undefined
                        ? Math.min((selectedGroup.current_amount / selectedGroup.target_amount) * 100, 100)
                        : Math.min(((selectedGroup.total_quantity || selectedGroup.participants) / selectedGroup.max_participants) * 100, 100)
                      }%` 
                    }}
                  />
                </div>
                {selectedGroup.current_amount !== undefined && selectedGroup.target_amount !== undefined && (
                  <div className="flex justify-between text-xs text-gray-600 mt-1">
                    <span>${selectedGroup.current_amount.toFixed(2)} raised</span>
                    <span>${selectedGroup.target_amount.toFixed(2)} target</span>
                  </div>
                )}
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

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Create New Group</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900">Basic Information</h4>
                
                <Input
                  label="Group Name"
                  placeholder="e.g., Bulk Rice Purchase"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Select category</option>
                    <option value="Grocery">Grocery</option>
                    <option value="Vegetables">Vegetables</option>
                    <option value="Fruits">Fruits</option>
                    <option value="Grains & Cereals">Grains & Cereals</option>
                    <option value="Cooking Essentials">Cooking Essentials</option>
                    <option value="Meat & Poultry">Meat & Poultry</option>
                    <option value="Fish & Kapenta">Fish & Kapenta</option>
                    <option value="Dairy Products">Dairy Products</option>
                    <option value="Beverages">Beverages</option>
                    <option value="Others">Others</option>
                  </select>
                </div>

                <Textarea
                  label="Description"
                  placeholder="Describe the group buy opportunity..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  required
                />

                <Textarea
                  label="Long Description (Optional)"
                  placeholder="Detailed information about the product and group buy..."
                  value={formData.long_description}
                  onChange={(e) => setFormData({ ...formData, long_description: e.target.value })}
                  rows={4}
                />
              </div>

              {/* Pricing */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900">Pricing</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Regular Price ($)"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.original_price}
                    onChange={(e) => setFormData({ ...formData, original_price: e.target.value })}
                    required
                  />

                  <Input
                    label="Bulk Price ($)"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>

                {/* Price Savings Preview */}
                {formData.original_price && formData.price && (
                  <Card variant="filled" className="p-3 bg-green-50 border-green-200">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-green-700">Savings per unit:</span>
                      <span className="font-bold text-green-700">
                        ${(parseFloat(formData.original_price) - parseFloat(formData.price)).toFixed(2)}
                        {' '}
                        ({((1 - parseFloat(formData.price) / parseFloat(formData.original_price)) * 100).toFixed(0)}% off)
                      </span>
                    </div>
                  </Card>
                )}
              </div>

              {/* Group Details */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900">Group Details</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Max Participants"
                    type="number"
                    placeholder="10"
                    value={formData.max_participants}
                    onChange={(e) => setFormData({ ...formData, max_participants: e.target.value })}
                    helperText="Maximum number of participants"
                    required
                  />

                  <Input
                    label="End Date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    required
                  />
                </div>

                <Input
                  label="Total Stock"
                  type="number"
                  placeholder="100"
                  value={formData.total_stock}
                  onChange={(e) => setFormData({ ...formData, total_stock: e.target.value })}
                  helperText="Total units available"
                />

                <Input
                  label="Manufacturer"
                  placeholder="Manufacturer name"
                  value={formData.manufacturer}
                  onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                />
              </div>

              {/* Delivery Information */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900">Delivery Information</h4>
                
                <Input
                  label="Shipping Info"
                  placeholder="Delivery method and details"
                  value={formData.shipping_info}
                  onChange={(e) => setFormData({ ...formData, shipping_info: e.target.value })}
                />

                <Input
                  label="Estimated Delivery"
                  placeholder="e.g., 3-5 business days"
                  value={formData.estimated_delivery}
                  onChange={(e) => setFormData({ ...formData, estimated_delivery: e.target.value })}
                />
              </div>

              {/* Image Upload */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900">Product Image</h4>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-2 text-gray-500" />
                        <p className="text-sm text-gray-500">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageChange}
                      />
                    </label>
                  </div>

                  {/* Image Preview */}
                  {imagePreview && (
                    <div className="relative rounded-lg overflow-hidden border-2 border-gray-200">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-48 object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImageFile(null);
                          setImagePreview('');
                          setFormData({ ...formData, image: '' });
                        }}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}

                  {uploadingImage && (
                    <div className="text-center text-sm text-gray-600">
                      Uploading image...
                    </div>
                  )}
                </div>
              </div>

              {/* Optional Fields */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900">Additional Details (Optional)</h4>
                
                <Input
                  label="Features (comma-separated)"
                  placeholder="e.g., Organic, Fair Trade, Non-GMO"
                  value={formData.features}
                  onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                  helperText="Separate features with commas"
                />

                <Input
                  label="Requirements (comma-separated)"
                  placeholder="e.g., Minimum order: 5 units, Advance payment required"
                  value={formData.requirements}
                  onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                  helperText="Separate requirements with commas"
                />
              </div>

              {/* Submit Button */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                  disabled={isCreating}
                  fullWidth
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isCreating || uploadingImage}
                  fullWidth
                >
                  {isCreating ? 'Creating...' : 'Create Group'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
