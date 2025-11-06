import React, { useState, useEffect } from 'react';
import { Badge } from "../components/ui/badge";
import Button from "../components/ui/Button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, ComposedChart, Line } from 'recharts';
import { ShoppingCart, Users, DollarSign, TrendingUp, Clock, CheckCircle, AlertCircle, Plus, X, Package, Edit2, Save, XCircle } from 'lucide-react';
import SupplierLayout from '../components/SupplierLayout';
// @ts-ignore
import apiService from '../services/api';

interface DashboardMetrics {
  pending_orders: number;
  active_groups: number;
  monthly_revenue: number;
  total_savings_generated: number;
  top_products: Array<{
    name: string;
    revenue: number;
  }>;
}

interface Order {
  id: number;
  order_number: string;
  group_id: number | null;
  group_name: string;
  trader_count: number;
  delivery_location: string;
  products: Array<{
    name: string;
    quantity: number;
    unit_price: number;
    total_amount: number;
  }>;
  total_value: number;
  total_savings: number;
  status: string;
  created_at: string;
}

const SupplierDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [paymentDashboard, setPaymentDashboard] = useState<any>(null);
  const [pendingGroupBuys, setPendingGroupBuys] = useState<any[]>([]);
  const [paidGroupBuys, setPaidGroupBuys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('products');

  // Earnings state
  const [earningsData, setEarningsData] = useState<any>(null);
  const [earningsHistory, setEarningsHistory] = useState<any[]>([]);
  const [revenueTrends, setRevenueTrends] = useState<any[]>([]);
  const [topEarningProducts, setTopEarningProducts] = useState<any[]>([]);

  // Group Moderation State
  const [activeGroups, setActiveGroups] = useState<any[]>([]);
  const [readyForPaymentGroups, setReadyForPaymentGroups] = useState<any[]>([]);
  const [moderationStats, setModerationStats] = useState<any>(null);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [showGroupDetails, setShowGroupDetails] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedGroup, setEditedGroup] = useState<any>(null);
  const [editedImage, setEditedImage] = useState<File | null>(null);
  const [editedImagePreview, setEditedImagePreview] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroup, setNewGroup] = useState({
    name: '',
    description: '',
    category: '',
    targetMembers: '',
    price: '',
    dueDate: '',
    location: '',
    productName: '',
    productDescription: '',
    productImage: null as File | null,
    imagePreview: null as string | null,
    regularPrice: '',
    bulkPrice: '',
    totalStock: '',
    specifications: '',
    manufacturer: '',
    warranty: ''
  });

  useEffect(() => {
    fetchDashboardData();
    fetchProducts();
    fetchGroupBuys();
    fetchGroupModerationData();
    fetchEarningsData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [
        metricsResponse,
        ordersResponse,
        invoicesResponse,
        paymentsResponse,
        paymentDashboardResponse,
        notificationsResponse
      ] = await Promise.all([
        apiService.getSupplierDashboardMetrics(),
        apiService.getSupplierOrders(),
        apiService.getSupplierInvoices(),
        apiService.getSupplierPayments(),
        apiService.getPaymentDashboard(),
        apiService.getSupplierNotifications()
      ]);

      setMetrics(metricsResponse);
      setOrders(Array.isArray(ordersResponse) ? ordersResponse : []);
      setInvoices(Array.isArray(invoicesResponse) ? invoicesResponse : []);
      setPayments(Array.isArray(paymentsResponse) ? paymentsResponse : []);
      setPaymentDashboard(paymentDashboardResponse);
      setNotifications(Array.isArray(notificationsResponse) ? notificationsResponse : []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOrderAction = async (orderId: number, action: 'confirm' | 'reject', reason?: string) => {
    try {
      await apiService.processOrderAction(orderId, action, reason);
      // Refresh orders
      fetchDashboardData();
    } catch (error) {
      console.error('Error processing order:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      await apiService.getSupplierProducts();
      // Products data fetched but not currently used in group management tab
    } catch (error) {
      console.error('Error fetching supplier products:', error);
    }
  };

  const fetchGroupBuys = async () => {
    try {
      const pending = await apiService.getSupplierOrders('pending');
      const paid = await apiService.getSupplierOrders('paid');
      setPendingGroupBuys(Array.isArray(pending) ? pending : []);
      setPaidGroupBuys(Array.isArray(paid) ? paid : []);
    } catch (error) {
      console.error('Error fetching group buys:', error);
    }
  };

  const fetchGroupModerationData = async () => {
    try {
      const [activeGroupsData, readyGroupsData, statsData] = await Promise.all([
        apiService.getSupplierActiveGroups(),
        apiService.getSupplierReadyForPaymentGroups(),
        apiService.getSupplierGroupModerationStats()
      ]);

      setActiveGroups(Array.isArray(activeGroupsData) ? activeGroupsData : []);
      setReadyForPaymentGroups(Array.isArray(readyGroupsData) ? readyGroupsData : []);
      setModerationStats(statsData);
    } catch (error) {
      console.error('Error fetching group moderation data:', error);
    }
  };

  const fetchEarningsData = async () => {
    try {
      // For now, we'll aggregate data from existing sources
      // In a real implementation, this would call dedicated earnings API endpoints
      const payments = await apiService.getSupplierPayments();
      const paymentDashboard = await apiService.getPaymentDashboard();

      // Calculate earnings summary from payments data
      const totalEarnings = Array.isArray(payments) ? payments
        .filter(p => p.status === 'completed')
        .reduce((sum, p) => sum + (p.amount || 0), 0) : 0;

      const pendingPayout = paymentDashboard?.pending_payments || 0;
      const availableBalance = paymentDashboard?.available_balance || 0;

      setEarningsData({
        totalEarnings,
        pendingPayout,
        availableBalance,
        monthlyRevenue: paymentDashboard?.monthly_revenue || 0,
        avgOrderValue: paymentDashboard?.avg_order_value || 0
      });

      setEarningsHistory(Array.isArray(payments) ? payments.slice(0, 10) : []);

      // Mock revenue trends data (in real app, this would come from API)
      setRevenueTrends([
        { month: 'Jul', revenue: 8500, orders: 85 },
        { month: 'Aug', revenue: 9200, orders: 92 },
        { month: 'Sep', revenue: 10100, orders: 101 },
        { month: 'Oct', revenue: 11800, orders: 118 },
        { month: 'Nov', revenue: 12450, orders: 124 },
        { month: 'Dec', revenue: 13200, orders: 132 }
      ]);

      // Mock top earning products (in real app, this would come from API)
      setTopEarningProducts([
        { name: 'Wireless Headphones', earnings: 2850, orders: 45 },
        { name: 'Smart Watch', earnings: 2340, orders: 32 },
        { name: 'Laptop Stand', earnings: 1890, orders: 28 },
        { name: 'Phone Case', earnings: 1560, orders: 52 },
        { name: 'USB Cable', earnings: 1240, orders: 38 }
      ]);

    } catch (error) {
      console.error('Error fetching earnings data:', error);
      // Set fallback data
      setEarningsData({
        totalEarnings: 0,
        pendingPayout: 0,
        availableBalance: 0,
        monthlyRevenue: 0,
        avgOrderValue: 0
      });
      setEarningsHistory([]);
      setRevenueTrends([]);
      setTopEarningProducts([]);
    }
  };

  const handleViewGroupDetails = async (groupId: number) => {
    try {
      const groupDetails = await apiService.getSupplierGroupDetails(groupId);
      setSelectedGroup(groupDetails);
      setEditedGroup({ ...groupDetails });
      setEditedImage(null);
      setEditedImagePreview(null);
      setIsEditMode(false);
      setShowGroupDetails(true);
    } catch (error) {
      console.error('Error fetching group details:', error);
      alert('Failed to load group details.');
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  const revenueData = metrics?.top_products.map(product => ({
    name: product.name.length > 15 ? product.name.substring(0, 15) + '...' : product.name,
    revenue: product.revenue
  })) || [];

  return (
    <SupplierLayout>
      {/* Enhanced Header with Quick Actions */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-100 border-b border-gray-200 mb-6">
        <div className="px-6 py-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Supplier Dashboard</h1>
              <p className="text-gray-600 mt-2">Manage your products, orders, and group buying opportunities</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => window.location.href = '/supplier/profile'}
                className="inline-flex items-center px-4 py-2 bg-white text-gray-700 font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors duration-200 shadow-md"
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Edit Profile
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Metrics Cards */}
      {metrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 px-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-200 border border-blue-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-500 rounded-xl shadow-md">
                <ShoppingCart className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-blue-600">This Month</p>
                <p className="text-xs text-blue-500">vs last month</p>
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-1">{metrics.pending_orders}</p>
            <p className="text-sm text-gray-600 font-medium">Pending Orders</p>
            {metrics.pending_orders > 0 && (
              <div className="mt-3 flex items-center text-xs text-blue-600">
                <Clock className="w-3 h-3 mr-1" />
                Requires action
              </div>
            )}
          </div>

          <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-200 border border-green-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-500 rounded-xl shadow-md">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-green-600">Active</p>
                <p className="text-xs text-green-500">Live groups</p>
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-1">{metrics.active_groups}</p>
            <p className="text-sm text-gray-600 font-medium">Active Groups</p>
            <div className="mt-3 flex items-center text-xs text-green-600">
              <TrendingUp className="w-3 h-3 mr-1" />
              Growing participation
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-violet-100 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-200 border border-purple-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-500 rounded-xl shadow-md">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-purple-600">30 Days</p>
                <p className="text-xs text-purple-500">Revenue</p>
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-1">${metrics.monthly_revenue.toFixed(2)}</p>
            <p className="text-sm text-gray-600 font-medium">Monthly Revenue</p>
            <div className="mt-3 flex items-center text-xs text-purple-600">
              <TrendingUp className="w-3 h-3 mr-1" />
              +12% from last month
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-amber-100 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-200 border border-orange-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-orange-500 rounded-xl shadow-md">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-orange-600">Total</p>
                <p className="text-xs text-orange-500">Saved</p>
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-1">${metrics.total_savings_generated.toFixed(2)}</p>
            <p className="text-sm text-gray-600 font-medium">Savings Generated</p>
            <div className="mt-3 flex items-center text-xs text-orange-600">
              <Users className="w-3 h-3 mr-1" />
              For customers
            </div>
          </div>
        </div>
      )}

      {/* Tabs - Enhanced design */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40 mx-6 rounded-t-xl">
        <div className="px-6">
          <nav className="flex gap-8" role="tablist" aria-label="Supplier sections">
            {[
              { id: 'analytics', label: 'Analytics & Insights', icon: TrendingUp },
              { id: 'earnings', label: 'Earnings', icon: DollarSign },
              { id: 'products', label: 'Product Management', icon: Package },
              { id: 'groups', label: 'Group Management', icon: Users }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center py-4 text-sm font-medium border-b-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  activeTab === id 
                    ? 'border-blue-600 text-blue-600 font-semibold' 
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
                role="tab"
                aria-selected={activeTab === id}
                aria-controls={`${id}-panel`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content Container */}
      <div className="bg-white mx-6 rounded-b-xl shadow-sm border border-t-0 border-gray-200">
        <main className="flex-1 p-6">
          {/* Tab Content */}
      <main className="flex-1 px-6 py-8">
        {/* Tab Content */}


        {activeTab === 'analytics' && (
          <div className="space-y-8">
            {/* Analytics Header */}
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Analytics & Insights</h2>
                <p className="text-gray-600 mt-1">Comprehensive analytics for your group buying business</p>
              </div>
              <div className="flex gap-2">
                <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option>Last 7 days</option>
                  <option>Last 30 days</option>
                  <option>Last 90 days</option>
                  <option>Last year</option>
                </select>
              </div>
            </div>

            {/* Key Metrics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-200 border border-blue-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-500 rounded-xl shadow-md">
                    <ShoppingCart className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-blue-600">Total Orders</p>
                    <p className="text-xs text-blue-500">+12% vs last month</p>
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900 mb-1">{orders.length + pendingGroupBuys.length + paidGroupBuys.length}</p>
                <p className="text-sm text-gray-600 font-medium">All time orders</p>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-200 border border-green-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-green-500 rounded-xl shadow-md">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-green-600">Total Revenue</p>
                    <p className="text-xs text-green-500">+8% vs last month</p>
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900 mb-1">
                  ${[...orders, ...pendingGroupBuys, ...paidGroupBuys].reduce((sum, item) => sum + (item.total_value || 0), 0).toFixed(2)}
                </p>
                <p className="text-sm text-gray-600 font-medium">Lifetime earnings</p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-violet-100 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-200 border border-purple-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-purple-500 rounded-xl shadow-md">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-purple-600">Avg Group Size</p>
                    <p className="text-xs text-purple-500">Target: 15 members</p>
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900 mb-1">
                  {activeGroups.length > 0 ? Math.round(activeGroups.reduce((sum, group) => sum + (group.members || 0), 0) / activeGroups.length) : 0}
                </p>
                <p className="text-sm text-gray-600 font-medium">Members per group</p>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-amber-100 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-200 border border-orange-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-orange-500 rounded-xl shadow-md">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-orange-600">Success Rate</p>
                    <p className="text-xs text-orange-500">Groups completed</p>
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900 mb-1">
                  {activeGroups.length > 0 ? Math.round((readyForPaymentGroups.length / (activeGroups.length + readyForPaymentGroups.length)) * 100) : 0}%
                </p>
                <p className="text-sm text-gray-600 font-medium">Completion rate</p>
              </div>
            </div>

            {/* Analytics Content */}
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue vs Orders Chart */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <BarChart className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Revenue vs Orders</h3>
                      <p className="text-sm text-gray-600">Monthly performance comparison</p>
                    </div>
                  </div>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={[
                        { month: 'Jan', revenue: 4500, orders: 45 },
                        { month: 'Feb', revenue: 5200, orders: 52 },
                        { month: 'Mar', revenue: 4800, orders: 48 },
                        { month: 'Apr', revenue: 6100, orders: 61 },
                        { month: 'May', revenue: 5500, orders: 55 },
                        { month: 'Jun', revenue: 6700, orders: 67 }
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip />
                        <Bar yAxisId="left" dataKey="revenue" fill="#3B82F6" name="Revenue ($)" />
                        <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#10B981" strokeWidth={3} name="Orders" />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Group Performance */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Users className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Group Performance</h3>
                      <p className="text-sm text-gray-600">Success rates by category</p>
                    </div>
                  </div>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[
                        { category: 'Electronics', success: 85, total: 100 },
                        { category: 'Fashion', success: 78, total: 95 },
                        { category: 'Home', success: 92, total: 98 },
                        { category: 'Beauty', success: 88, total: 92 },
                        { category: 'Food', success: 76, total: 85 }
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="category" />
                        <YAxis />
                        <Tooltip formatter={(value, name) => [name === 'success' ? `${value}%` : value, name === 'success' ? 'Success Rate' : 'Total Groups']} />
                        <Bar dataKey="success" fill="#10B981" name="Success Rate (%)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Top Products */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Package className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Top Products</h3>
                      <p className="text-sm text-gray-600">By revenue</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {revenueData.slice(0, 5).map((product, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                            {index + 1}
                          </span>
                          <span className="text-sm font-medium text-gray-900 truncate">{product.name}</span>
                        </div>
                        <span className="text-sm font-bold text-gray-900">${product.revenue}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Customer Insights */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <Users className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Customer Insights</h3>
                      <p className="text-sm text-gray-600">Behavior analysis</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">New Customers</span>
                      <span className="text-lg font-bold text-gray-900">68%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Repeat Customers</span>
                      <span className="text-lg font-bold text-gray-900">32%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Avg Order Value</span>
                      <span className="text-lg font-bold text-gray-900">$127.50</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Customer Lifetime Value</span>
                      <span className="text-lg font-bold text-gray-900">$892.30</span>
                    </div>
                  </div>
                </div>

                {/* Geographic Distribution */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <TrendingUp className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Top Locations</h3>
                      <p className="text-sm text-gray-600">By order volume</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {[
                      { location: 'Downtown', orders: 145, percentage: 32 },
                      { location: 'Midtown', orders: 98, percentage: 22 },
                      { location: 'Uptown', orders: 87, percentage: 19 },
                      { location: 'Suburbs', orders: 76, percentage: 17 },
                      { location: 'Other', orders: 42, percentage: 10 }
                    ].map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-gray-900">{item.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${item.percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-bold text-gray-900">{item.orders}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'earnings' && (
          <div className="space-y-8">
            {/* Earnings Header */}
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Earnings Dashboard</h2>
                <p className="text-gray-600 mt-1">Track your revenue, payments, and financial performance</p>
              </div>
              <div className="flex gap-2">
                <select className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option>Last 7 days</option>
                  <option>Last 30 days</option>
                  <option>Last 90 days</option>
                  <option>Last year</option>
                </select>
              </div>
            </div>

            {/* Earnings Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-200 border border-green-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-green-500 rounded-xl shadow-md">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-green-600">Total Earnings</p>
                    <p className="text-xs text-green-500">+15% vs last month</p>
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900 mb-1">
                  ${earningsData?.totalEarnings?.toFixed(2) || '0.00'}
                </p>
                <p className="text-sm text-gray-600 font-medium">Lifetime earnings</p>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-200 border border-blue-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-500 rounded-xl shadow-md">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-blue-600">Monthly Revenue</p>
                    <p className="text-xs text-blue-500">Current month</p>
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900 mb-1">${earningsData?.monthlyRevenue?.toFixed(2) || '0.00'}</p>
                <p className="text-sm text-gray-600 font-medium">This month</p>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-violet-100 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-200 border border-purple-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-purple-500 rounded-xl shadow-md">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-purple-600">Pending Payout</p>
                    <p className="text-xs text-purple-500">Next payout: Dec 15</p>
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900 mb-1">${earningsData?.pendingPayout?.toFixed(2) || '0.00'}</p>
                <p className="text-sm text-gray-600 font-medium">Available for payout</p>
              </div>

              <div className="bg-gradient-to-br from-orange-50 to-amber-100 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-200 border border-orange-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-orange-500 rounded-xl shadow-md">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-orange-600">Avg Order Value</p>
                    <p className="text-xs text-orange-500">Per completed group</p>
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900 mb-1">${earningsData?.avgOrderValue?.toFixed(2) || '0.00'}</p>
                <p className="text-sm text-gray-600 font-medium">Average per order</p>
              </div>
            </div>

            {/* Earnings Analytics */}
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Trends */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <TrendingUp className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Revenue Trends</h3>
                      <p className="text-sm text-gray-600">Monthly earnings over time</p>
                    </div>
                  </div>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={revenueTrends}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip formatter={(value, name) => [name === 'revenue' ? `$${value}` : value, name === 'revenue' ? 'Revenue' : 'Orders']} />
                        <Area type="monotone" dataKey="revenue" stroke="#10B981" fill="#10B981" fillOpacity={0.3} name="Revenue ($)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Earnings by Category */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <BarChart className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Earnings by Category</h3>
                      <p className="text-sm text-gray-600">Revenue breakdown by product category</p>
                    </div>
                  </div>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[
                        { category: 'Electronics', earnings: 4500, percentage: 34 },
                        { category: 'Fashion', earnings: 3200, percentage: 24 },
                        { category: 'Home', earnings: 2800, percentage: 21 },
                        { category: 'Beauty', earnings: 1800, percentage: 14 },
                        { category: 'Food', earnings: 1100, percentage: 8 }
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="category" />
                        <YAxis />
                        <Tooltip formatter={(value, name) => [name === 'earnings' ? `$${value}` : `${value}%`, name === 'earnings' ? 'Earnings' : 'Percentage']} />
                        <Bar dataKey="earnings" fill="#3B82F6" name="Earnings ($)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Top Earning Products */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Package className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Top Earning Products</h3>
                      <p className="text-sm text-gray-600">By revenue generated</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {topEarningProducts.map((product, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">
                            {index + 1}
                          </span>
                          <div>
                            <span className="text-sm font-medium text-gray-900 block">{product.name}</span>
                            <span className="text-xs text-gray-500">{product.orders} orders</span>
                          </div>
                        </div>
                        <span className="text-sm font-bold text-gray-900">${product.earnings}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Payment History */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Recent Payments</h3>
                      <p className="text-sm text-gray-600">Payment history and status</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {earningsHistory.slice(0, 5).map((payment, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-gray-900">${payment.amount}</p>
                          <p className="text-xs text-gray-600">{new Date(payment.date).toLocaleDateString()}</p>
                          <p className="text-xs text-gray-500">{payment.method || 'Bank Transfer'}</p>
                        </div>
                        <Badge variant={payment.status === 'completed' ? 'default' : 'secondary'}>
                          {payment.status || 'completed'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Earnings Summary */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <DollarSign className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Earnings Summary</h3>
                      <p className="text-sm text-gray-600">Financial overview</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total Revenue</span>
                      <span className="text-lg font-bold text-gray-900">${earningsData?.totalEarnings?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Platform Fees (5%)</span>
                      <span className="text-lg font-bold text-red-600">-${((earningsData?.totalEarnings || 0) * 0.05).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Net Earnings</span>
                      <span className="text-lg font-bold text-green-600">${((earningsData?.totalEarnings || 0) * 0.95).toFixed(2)}</span>
                    </div>
                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Paid Out</span>
                        <span className="text-lg font-bold text-blue-600">${((earningsData?.totalEarnings || 0) * 0.95 - (earningsData?.pendingPayout || 0)).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-sm text-gray-600">Available Balance</span>
                        <span className="text-lg font-bold text-purple-600">${earningsData?.pendingPayout?.toFixed(2) || '0.00'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'products' && (
          <div className="space-y-8">
            {/* Group Moderation Dashboard */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Group Moderation</h2>
              </div>
              
              {/* Moderation Stats */}
              {moderationStats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Users className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Active Groups</p>
                        <p className="text-2xl font-bold text-gray-900">{moderationStats.active_groups || 0}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <DollarSign className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Ready for Payment</p>
                        <p className="text-2xl font-bold text-gray-900">{moderationStats.ready_for_payment || 0}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-yellow-100 rounded-lg">
                        <AlertCircle className="w-5 h-5 text-yellow-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Requires Action</p>
                        <p className="text-2xl font-bold text-gray-900">{moderationStats.required_action || 0}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Users className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Total Members</p>
                        <p className="text-2xl font-bold text-gray-900">{moderationStats.total_members || 0}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}



              {/* Orders Related to Products */}
              <div className="grid grid-cols-1 gap-6">
                {/* Pending Group Orders */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Clock className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Pending Group Orders</h3>
                    <p className="text-sm text-gray-600">Orders awaiting your confirmation</p>
                  </div>
                </div>
                {pendingGroupBuys.length === 0 ? (
                  <div className="text-center py-12">
                    <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No pending orders</h3>
                    <p className="text-gray-600">All group orders have been processed.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Order Details</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Group Info</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Products</th>
                          <th className="text-right py-3 px-4 font-medium text-gray-900">Total Value</th>
                          <th className="text-center py-3 px-4 font-medium text-gray-900">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingGroupBuys.map((group) => (
                          <tr key={group.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-4 px-4">
                              <div className="font-medium text-gray-900">{group.order_number}</div>
                              <div className="text-sm text-gray-600">{new Date(group.created_at).toLocaleDateString()}</div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="font-medium text-gray-900">{group.group_name}</div>
                              <div className="text-sm text-gray-600">{group.trader_count} traders</div>
                              <div className="text-sm text-gray-600">{group.delivery_location}</div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="text-sm">
                                {group.products.slice(0, 2).map((product: any, index: number) => (
                                  <div key={index} className="truncate max-w-xs">
                                    {product.name} × {product.quantity}
                                  </div>
                                ))}
                                {group.products.length > 2 && (
                                  <div className="text-gray-500">+{group.products.length - 2} more</div>
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-4 text-right">
                              <div className="font-semibold text-gray-900">${group.total_value}</div>
                              <div className="text-sm text-green-600">Savings: ${group.total_savings}</div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex justify-center gap-2">
                                <Button
                                  onClick={() => handleOrderAction(group.id, 'confirm')}
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Confirm
                                </Button>
                                <Button
                                  onClick={() => handleOrderAction(group.id, 'reject', 'Capacity constraints')}
                                  variant="secondary"
                                  size="sm"
                                  className="text-red-600 border-red-300 hover:bg-red-50"
                                >
                                  <AlertCircle className="h-4 w-4 mr-1" />
                                  Reject
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'groups' && (
          <div className="space-y-8">
            {/* Group Management Header */}
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Group Management</h2>
                <p className="text-gray-600 mt-1">Manage your active groups and track payment-ready opportunities</p>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-md hover:shadow-lg"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create New Group
              </button>
            </div>

            {/* Group Management Stats */}
            {moderationStats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-1.5 bg-blue-100 rounded-md">
                      <Users className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">Active</span>
                  </div>
                  <p className="text-xs text-gray-600 mb-1">Active Groups</p>
                  <p className="text-xl font-bold text-blue-600">{moderationStats.active_groups || 0}</p>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-1.5 bg-green-100 rounded-md">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">Completed</span>
                  </div>
                  <p className="text-xs text-gray-600 mb-1">Completed Group Orders</p>
                  <p className="text-xl font-bold text-green-600">{moderationStats.ready_for_payment || 0}</p>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-1.5 bg-purple-100 rounded-md">
                      <Users className="w-4 h-4 text-purple-600" />
                    </div>
                    <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded">Total</span>
                  </div>
                  <p className="text-xs text-gray-600 mb-1">Total Members</p>
                  <p className="text-xl font-bold text-purple-600">{moderationStats.total_members || 0}</p>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-1.5 bg-orange-100 rounded-md">
                      <Clock className="w-4 h-4 text-orange-600" />
                    </div>
                    <span className="text-xs font-medium text-orange-600 bg-orange-50 px-2 py-1 rounded">Pending</span>
                  </div>
                  <p className="text-xs text-gray-600 mb-1">Pending Orders</p>
                  <p className="text-xl font-bold text-orange-600">{moderationStats.pending_orders || 0}</p>
                </div>
              </div>
            )}

            {/* Active Groups and Ready for Payment Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Active Groups */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-md">
                        <Users className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">Active Groups</h3>
                        <p className="text-sm text-gray-500 mt-0.5">Currently active group buying opportunities</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-bold bg-blue-100 text-blue-700 shadow-sm">
                      {activeGroups.length} Groups
                    </span>
                  </div>
                </div>
                <div className="p-6 max-h-[500px] overflow-y-auto space-y-4 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
                  {activeGroups.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No active groups</h3>
                      <p className="text-gray-600">Create your first group to get started.</p>
                    </div>
                  ) : (
                    activeGroups.map((group) => (
                      <div key={group.id} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg transition-all duration-300 hover:border-blue-300 transform hover:-translate-y-1">
                        <div className="flex items-start gap-4 mb-4">
                          <div className="flex-shrink-0">
                            <img
                              src={group.product?.image || group.image || '/api/placeholder/150/100'}
                              alt={group.product?.name || group.name}
                              className="w-32 h-24 object-cover rounded-xl border-2 border-gray-200 shadow-md"
                            />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="text-lg font-bold text-gray-900">{group.name}</h4>
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-blue-100 text-blue-700 rounded-full shadow-sm">
                                <Users className="w-3 h-3" /> {group.members}/{group.targetMembers}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{group.description}</p>
                            <div className="flex flex-wrap gap-3 text-xs text-gray-600 mb-4">
                              <span className="px-2 py-1 bg-gray-100 rounded-full">Category: <span className="font-semibold text-gray-800">{group.category}</span></span>
                              <span className="px-2 py-1 bg-gray-100 rounded-full">Due: <span className="font-semibold text-gray-800">{group.dueDate}</span></span>
                              <span className="px-2 py-1 bg-blue-100 rounded-full">Amount: <span className="font-semibold text-blue-700">{group.totalAmount}</span></span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleViewGroupDetails(group.id)}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg"
                          >
                            <Edit2 className="w-4 h-4" />
                            Manage
                          </button>
                          <button 
                            onClick={() => handleViewGroupDetails(group.id)}
                            className="px-4 py-2.5 border-2 border-gray-300 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Completed Group Orders */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 via-emerald-50 to-green-50">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-md">
                        <CheckCircle className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">Completed Group Orders</h3>
                        <p className="text-sm text-gray-500 mt-0.5">Groups that have been completed</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-bold bg-green-100 text-green-700 shadow-sm">
                      {readyForPaymentGroups.length} Groups
                    </span>
                  </div>
                </div>
                <div className="p-6 max-h-[500px] overflow-y-auto space-y-4 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
                  {readyForPaymentGroups.length === 0 ? (
                    <div className="text-center py-12">
                      <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No completed groups</h3>
                      <p className="text-gray-600">Completed groups will appear here.</p>
                    </div>
                  ) : (
                    readyForPaymentGroups.map((group: any) => (
                      <div key={group.id} className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-5 hover:shadow-lg transition-all duration-300 hover:border-green-300 transform hover:-translate-y-1">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-3">
                              <h4 className="text-lg font-bold text-gray-900">{group.name}</h4>
                              <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold bg-green-500 text-white rounded-full shadow-md">
                                <CheckCircle className="w-3 h-3" /> Completed
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-3 mt-4">
                              <div className="bg-white p-3 rounded-xl shadow-sm">
                                <p className="text-xs text-gray-500 mb-1 font-medium">Members</p>
                                <p className="text-lg font-bold text-gray-900">{group.members}/{group.targetMembers}</p>
                              </div>
                              <div className="bg-white p-3 rounded-xl shadow-sm">
                                <p className="text-xs text-gray-500 mb-1 font-medium">Total Amount</p>
                                <p className="text-lg font-bold text-green-600">{group.totalAmount}</p>
                              </div>
                              <div className="bg-white p-3 rounded-xl shadow-sm">
                                <p className="text-xs text-gray-500 mb-1 font-medium">Category</p>
                                <p className="text-sm font-bold text-gray-900">{group.category}</p>
                              </div>
                              <div className="bg-white p-3 rounded-xl shadow-sm">
                                <p className="text-xs text-gray-500 mb-1 font-medium">Due Date</p>
                                <p className="text-sm font-bold text-gray-900">{group.dueDate}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleViewGroupDetails(group.id)}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-sm font-medium rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-md hover:shadow-lg"
                          >
                            <CheckCircle className="w-4 h-4" />
                            View Details
                          </button>
                          <button
                            onClick={() => handleViewGroupDetails(group.id)}
                            className="px-4 py-2.5 border-2 border-gray-300 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
                          >
                            View
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'invoices' && (
          <div className="space-y-8">
            {/* Invoices */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Invoices</h2>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                {invoices.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 text-gray-400">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No invoices generated yet</h3>
                    <p className="text-gray-600">Invoices will appear here once orders are processed.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {invoices.map((invoice) => (
                      <div key={invoice.id} className="border border-gray-200 rounded-lg p-6 bg-white">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-semibold text-gray-900">{invoice.invoice_number}</h3>
                            <p className="text-sm text-gray-600">Order #{invoice.order_id}</p>
                            <p className="text-sm text-gray-600">Due: {new Date(invoice.due_date).toLocaleDateString()}</p>
                          </div>
                          <Badge variant={
                            invoice.status === 'paid' ? 'default' :
                            invoice.status === 'overdue' ? 'destructive' : 'secondary'
                          }>
                            {invoice.status.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-lg font-semibold text-gray-900">${invoice.total_amount}</p>
                            <p className="text-sm text-gray-600">Including ${invoice.tax_amount} tax</p>
                          </div>
                          {invoice.pdf_url && (
                            <Button variant="secondary" size="sm">
                              Download PDF
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="space-y-8">
            {/* Payment Management */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Management</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <DollarSign className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Payment Summary</h3>
                      <p className="text-sm text-gray-600">Your earnings and payment status</p>
                    </div>
                  </div>
                  {paymentDashboard && (
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Earnings:</span>
                        <span className="font-semibold text-gray-900">${paymentDashboard.total_earnings}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Pending Payments:</span>
                        <span className="font-semibold text-gray-900">${paymentDashboard.pending_payments}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Next Payout:</span>
                        <span className="font-semibold text-gray-900">
                          {new Date(paymentDashboard.next_payout_date).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Processing Fee:</span>
                        <span className="font-semibold text-gray-900">{(paymentDashboard.processing_fee_rate * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <TrendingUp className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Payment History</h3>
                      <p className="text-sm text-gray-600">Recent payment transactions</p>
                    </div>
                  </div>
                  {payments.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 mx-auto mb-2 text-gray-400">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                      </div>
                      <p className="text-sm text-gray-500">No payment history</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {payments.slice(0, 5).map((payment) => (
                        <div key={payment.id} className="flex justify-between items-center py-2 border-b border-gray-100">
                          <div>
                            <p className="font-medium text-gray-900">${payment.amount}</p>
                            <p className="text-sm text-gray-600">{payment.payment_method}</p>
                          </div>
                          <Badge variant={payment.status === 'completed' ? 'default' : 'secondary'}>
                            {payment.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-8">
            {/* Notifications */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Notifications</h2>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                {notifications.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 mx-auto mb-4 text-gray-400">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 17h5l-5 5v-5zM4.868 12.683A17.925 17.925 0 012 21.994v-3.11c0-1.907.432-3.722 1.248-5.372L5.25 8.25l-.382-.765A17.935 17.935 0 014.868 12.683zM9 5a7 7 0 0114 0c0 5.466-4.936 9.949-11 10.163V21l-2-2v-3.837C3.936 14.949 0 10.466 0 5a7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
                    <p className="text-gray-600">You'll receive notifications about orders and updates here.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {notifications.map((notification) => (
                      <div key={notification.id} className={`border rounded-lg p-4 ${!notification.is_read ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'}`}>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                            <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                            <p className="text-xs text-gray-500 mt-2">
                              {new Date(notification.created_at).toLocaleString()}
                            </p>
                          </div>
                          <Badge variant="outline">{notification.type}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Create Group Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl max-w-2xl w-full m-4 flex flex-col max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Create New Group</h2>
                  <p className="text-sm text-gray-600 mt-1">Create a new group buying opportunity using your products</p>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Product Details Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                      <input
                        type="text"
                        value={newGroup.productName}
                        onChange={(e) => setNewGroup({...newGroup, productName: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter product name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Product Description</label>
                      <textarea
                        value={newGroup.productDescription}
                        onChange={(e) => setNewGroup({...newGroup, productDescription: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-32"
                        placeholder="Enter product description"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Regular Price</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={newGroup.regularPrice}
                        onChange={(e) => setNewGroup({...newGroup, regularPrice: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Regular retail price"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bulk Price</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={newGroup.bulkPrice}
                        onChange={(e) => setNewGroup({...newGroup, bulkPrice: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Group buy price per unit"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Product Image</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (e) => {
                                setNewGroup(prev => ({
                                  ...prev,
                                  productImage: file,
                                  imagePreview: e.target?.result as string
                                }));
                              };
                              reader.readAsDataURL(file);
                            } else {
                              setNewGroup(prev => ({
                                ...prev,
                                productImage: null,
                                imagePreview: null
                              }));
                            }
                          }}
                          className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                        {newGroup.productImage && (
                          <span className="text-sm text-green-600">✓ Image selected</span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-gray-500">Upload a product image (PNG, JPG up to 5MB)</p>

                      {newGroup.imagePreview && (
                        <div className="mt-4">
                          <p className="text-sm font-medium text-gray-700 mb-2">Image Preview:</p>
                          <div className="relative inline-block">
                            <img
                              src={newGroup.imagePreview}
                              alt="Product preview"
                              className="w-32 h-32 object-cover rounded-lg border-2 border-gray-300 shadow-md"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setNewGroup(prev => ({
                                  ...prev,
                                  productImage: null,
                                  imagePreview: null
                                }));
                                const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
                                if (fileInput) fileInput.value = '';
                              }}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                              title="Remove image"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Total Stock Available</label>
                      <input
                        type="number"
                        min="0"
                        value={newGroup.totalStock}
                        onChange={(e) => setNewGroup({...newGroup, totalStock: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Available stock"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Specifications</label>
                      <textarea
                        value={newGroup.specifications}
                        onChange={(e) => setNewGroup({...newGroup, specifications: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-20"
                        placeholder="Product specifications"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Manufacturer/Brand</label>
                      <input
                        type="text"
                        value={newGroup.manufacturer}
                        onChange={(e) => setNewGroup({...newGroup, manufacturer: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter manufacturer or brand"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Group Buy Details Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Group Buy Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Group Name</label>
                      <input
                        type="text"
                        value={newGroup.name}
                        onChange={(e) => setNewGroup({...newGroup, name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter group name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                      <select
                        value={newGroup.category}
                        onChange={(e) => setNewGroup({...newGroup, category: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select category</option>
                        <option value="electronics">Electronics</option>
                        <option value="fashion">Fashion & Clothing</option>
                        <option value="home">Home & Living</option>
                        <option value="beauty">Beauty & Health</option>
                        <option value="sports">Sports & Outdoor</option>
                        <option value="food">Food & Groceries</option>
                        <option value="vegetables">Vegetables</option>
                        <option value="fruits">Fruits</option>
                        <option value="books">Books & Stationery</option>
                        <option value="automotive">Automotive & Parts</option>
                        <option value="tools">Tools & Hardware</option>
                        <option value="furniture">Furniture & Decor</option>
                        <option value="appliances">Appliances</option>
                        <option value="toys">Toys & Games</option>
                        <option value="jewelry">Jewelry & Accessories</option>
                        <option value="pet">Pet Supplies</option>
                        <option value="garden">Garden & Outdoor</option>
                        <option value="music">Music & Instruments</option>
                        <option value="art">Art & Crafts</option>
                        <option value="office">Office Supplies</option>
                        <option value="medical">Medical & Pharmacy</option>
                        <option value="baby">Baby & Kids</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Target Members</label>
                      <input
                        type="number"
                        min="1"
                        value={newGroup.targetMembers}
                        onChange={(e) => setNewGroup({...newGroup, targetMembers: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter target number of members"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea
                        value={newGroup.description}
                        onChange={(e) => setNewGroup({...newGroup, description: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-32"
                        placeholder="Enter group description"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                      <input
                        type="date"
                        value={newGroup.dueDate}
                        onChange={(e) => setNewGroup({...newGroup, dueDate: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Location</label>
                      <input
                        type="text"
                        value={newGroup.location}
                        onChange={(e) => setNewGroup({...newGroup, location: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter pickup location"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50 mt-auto">
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-6 py-2.5 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    try {
                      // Validate required fields
                      if (!newGroup.name.trim()) {
                        alert('Group name is required');
                        return;
                      }
                      if (!newGroup.productName.trim()) {
                        alert('Product name is required');
                        return;
                      }
                      if (!newGroup.category) {
                        alert('Category is required');
                        return;
                      }
                      if (!newGroup.targetMembers || parseInt(newGroup.targetMembers) <= 0) {
                        alert('Target members must be a positive number');
                        return;
                      }
                      if (!newGroup.regularPrice || parseFloat(newGroup.regularPrice) <= 0) {
                        alert('Regular price must be a positive number');
                        return;
                      }
                      if (!newGroup.bulkPrice || parseFloat(newGroup.bulkPrice) <= 0) {
                        alert('Bulk price must be a positive number');
                        return;
                      }
                      if (!newGroup.dueDate) {
                        alert('Due date is required');
                        return;
                      }

                      let imageUrl = '';
                      if (newGroup.productImage) {
                        const uploadResult = await apiService.uploadSupplierImage(newGroup.productImage);
                        imageUrl = uploadResult.image_url;
                      }

                      const groupData = {
                        name: newGroup.name,
                        description: newGroup.description,
                        long_description: newGroup.productDescription,
                        category: newGroup.category,
                        price: parseFloat(newGroup.bulkPrice),
                        original_price: parseFloat(newGroup.regularPrice),
                        image: imageUrl,
                        max_participants: parseInt(newGroup.targetMembers),
                        end_date: new Date(newGroup.dueDate).toISOString(),
                        admin_name: "Supplier",
                        shipping_info: "Free shipping when group goal is reached",
                        estimated_delivery: "2-3 weeks after group completion",
                        features: [],
                        requirements: [],
                        product_name: newGroup.productName,
                        product_description: newGroup.productDescription,
                        total_stock: parseInt(newGroup.totalStock) || null,
                        specifications: newGroup.specifications,
                        manufacturer: newGroup.manufacturer,
                        pickup_location: newGroup.location
                      };

                      await apiService.createSupplierGroup(groupData);

                      setNewGroup({
                        name: '',
                        description: '',
                        category: '',
                        targetMembers: '',
                        price: '',
                        dueDate: '',
                        location: '',
                        productName: '',
                        productDescription: '',
                        productImage: null,
                        imagePreview: null,
                        regularPrice: '',
                        bulkPrice: '',
                        totalStock: '',
                        specifications: '',
                        manufacturer: '',
                        warranty: ''
                      });
                      setShowCreateModal(false);

                      fetchGroupModerationData();

                    } catch (error) {
                      console.error('Error:', error);
                      alert('Failed to create group. Please try again.');
                    }
                  }}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create Group
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Group Details/Edit Modal */}
      {showGroupDetails && selectedGroup && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => {
            setShowGroupDetails(false);
            setIsEditMode(false);
          }}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full m-4 flex flex-col max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-md">
                    <Package className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {isEditMode ? 'Edit Group Details' : 'Group Details'}
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      {isEditMode ? 'Update group buying information' : 'View complete group information'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!isEditMode ? (
                    <button
                      onClick={() => setIsEditMode(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-md"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditedGroup({ ...selectedGroup });
                          setEditedImage(null);
                          setEditedImagePreview(null);
                          setIsEditMode(false);
                        }}
                        className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            // Handle image upload first if a new image was selected
                            let imageUrl = editedGroup.image;
                            if (editedImage) {
                              const uploadResult = await apiService.uploadSupplierImage(editedImage);
                              imageUrl = uploadResult.image_url;
                            }

                            // Prepare update data
                            const updateData: any = {
                              name: editedGroup.name,
                              description: editedGroup.description,
                              long_description: editedGroup.long_description || editedGroup.description,
                              category: editedGroup.category,
                              price: parseFloat(editedGroup.price),
                              original_price: parseFloat(editedGroup.original_price),
                              max_participants: parseInt(editedGroup.max_participants || editedGroup.targetMembers),
                              shipping_info: editedGroup.shipping_info,
                              estimated_delivery: editedGroup.estimated_delivery
                            };

                            // Add image if it was changed
                            if (editedImage) {
                              updateData.image = imageUrl;
                            }

                            // Add end_date if it exists
                            if (editedGroup.end_date) {
                              updateData.end_date = typeof editedGroup.end_date === 'string' 
                                ? editedGroup.end_date 
                                : new Date(editedGroup.end_date).toISOString();
                            }

                            // Update the group via API
                            const response = await fetch(`http://localhost:8000/api/supplier/groups/${editedGroup.id}`, {
                              method: 'PUT',
                              headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${localStorage.getItem('token')}`
                              },
                              body: JSON.stringify(updateData)
                            });

                            if (!response.ok) {
                              const error = await response.json();
                              throw new Error(error.detail || 'Failed to update group');
                            }

                            // Refresh data
                            fetchGroupModerationData();

                            // Update the selected group with new data
                            const updatedResponse = await fetch(`http://localhost:8000/api/supplier/groups/${editedGroup.id}`, {
                              headers: {
                                'Authorization': `Bearer ${localStorage.getItem('token')}`
                              }
                            });
                            const updatedGroup = await updatedResponse.json();
                            setSelectedGroup(updatedGroup);
                            setEditedGroup(updatedGroup);

                            // Reset image state
                            setEditedImage(null);
                            setEditedImagePreview(null);
                            setIsEditMode(false);
                            alert('Group updated successfully!');
                          } catch (error: any) {
                            console.error('Failed to update group:', error);
                            alert(error.message || 'Failed to update group. Please try again.');
                          }
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all duration-200 shadow-md"
                      >
                        <Save className="w-4 h-4" />
                        Save Changes
                      </button>
                    </div>
                  )}
                  <button
                    onClick={() => {
                      setShowGroupDetails(false);
                      setIsEditMode(false);
                    }}
                    className="text-gray-400 hover:text-gray-600 p-2"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50">
              {/* Group Image */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Group Image</h3>
                {isEditMode ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Update Group Image</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              // Create image preview
                              const reader = new FileReader();
                              reader.onload = (e) => {
                                setEditedImage(file);
                                setEditedImagePreview(e.target?.result as string);
                              };
                              reader.readAsDataURL(file);
                            } else {
                              // Clear preview if no file selected
                              setEditedImage(null);
                              setEditedImagePreview(null);
                            }
                          }}
                          className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                        {editedImage && (
                          <span className="text-sm text-green-600">✓ New image selected</span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-gray-500">Upload a new image (PNG, JPG up to 5MB) or leave empty to keep current image</p>
                    </div>

                    {/* Image Preview */}
                    <div className="relative">
                      <img
                        src={editedImagePreview || editedGroup.image || '/api/placeholder/400/300'}
                        alt={editedGroup.name}
                        className="w-full h-64 object-cover rounded-xl shadow-md border-2 border-gray-200"
                      />
                      {(editedImage || editedImagePreview) && (
                        <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                          New Image
                        </div>
                      )}
                      {editedImage && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditedImage(null);
                            setEditedImagePreview(null);
                            // Clear the file input
                            const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
                            if (fileInput) fileInput.value = '';
                          }}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                          title="Remove new image"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <img
                    src={selectedGroup.image || '/api/placeholder/400/300'}
                    alt={selectedGroup.name}
                    className="w-full h-64 object-cover rounded-xl shadow-md"
                  />
                )}
              </div>

              {/* Basic Information */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Group Name</label>
                    {isEditMode ? (
                      <input
                        type="text"
                        value={editedGroup.name || ''}
                        onChange={(e) => setEditedGroup({ ...editedGroup, name: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    ) : (
                      <p className="text-base text-gray-900 font-medium">{selectedGroup.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    {isEditMode ? (
                      <input
                        type="text"
                        value={editedGroup.category || ''}
                        onChange={(e) => setEditedGroup({ ...editedGroup, category: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    ) : (
                      <p className="text-base text-gray-900 font-medium">{selectedGroup.category}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Created by</label>
                    <p className="text-base text-purple-600 font-medium">{selectedGroup.creator || selectedGroup.admin_name || 'Supplier'}</p>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    {isEditMode ? (
                      <textarea
                        value={editedGroup.description || ''}
                        onChange={(e) => setEditedGroup({ ...editedGroup, description: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-24"
                      />
                    ) : (
                      <p className="text-base text-gray-700">{selectedGroup.description}</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Long Description</label>
                    {isEditMode ? (
                      <textarea
                        value={editedGroup.long_description || editedGroup.description || ''}
                        onChange={(e) => setEditedGroup({ ...editedGroup, long_description: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-32"
                      />
                    ) : (
                      <p className="text-base text-gray-700">{selectedGroup.long_description || selectedGroup.description}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Pricing Information */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Pricing Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bulk Price</label>
                    {isEditMode ? (
                      <input
                        type="number"
                        step="0.01"
                        value={editedGroup.price || ''}
                        onChange={(e) => setEditedGroup({ ...editedGroup, price: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    ) : (
                      <p className="text-xl text-green-600 font-bold">${selectedGroup.price}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Original Price</label>
                    {isEditMode ? (
                      <input
                        type="number"
                        step="0.01"
                        value={editedGroup.original_price || ''}
                        onChange={(e) => setEditedGroup({ ...editedGroup, original_price: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    ) : (
                      <p className="text-xl text-gray-500 font-bold line-through">${selectedGroup.original_price}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Savings</label>
                    <p className="text-xl text-blue-600 font-bold">
                      ${((selectedGroup.original_price || 0) - (selectedGroup.price || 0)).toFixed(2)}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Discount</label>
                    <p className="text-xl text-purple-600 font-bold">
                      {(((selectedGroup.original_price - selectedGroup.price) / selectedGroup.original_price) * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Participants Information */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Participants Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Current Participants</label>
                    <p className="text-2xl text-blue-600 font-bold">{selectedGroup.participants || selectedGroup.members || 0}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Target Participants</label>
                    {isEditMode ? (
                      <input
                        type="number"
                        value={editedGroup.max_participants || editedGroup.targetMembers || ''}
                        onChange={(e) => setEditedGroup({ ...editedGroup, max_participants: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    ) : (
                      <p className="text-2xl text-gray-900 font-bold">{selectedGroup.max_participants || selectedGroup.targetMembers}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Progress</label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${Math.min(
                              ((selectedGroup.participants || selectedGroup.members || 0) / 
                              (selectedGroup.max_participants || selectedGroup.targetMembers || 1)) * 100, 
                              100
                            )}%` 
                          }}
                        ></div>
                      </div>
                      <span className="text-sm font-semibold text-gray-700">
                        {Math.round(
                          ((selectedGroup.participants || selectedGroup.members || 0) / 
                          (selectedGroup.max_participants || selectedGroup.targetMembers || 1)) * 100
                        )}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Delivery Information */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Delivery Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Shipping Info</label>
                    {isEditMode ? (
                      <textarea
                        value={editedGroup.shipping_info || ''}
                        onChange={(e) => setEditedGroup({ ...editedGroup, shipping_info: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-20"
                      />
                    ) : (
                      <p className="text-base text-gray-700">{selectedGroup.shipping_info || 'No shipping info available'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Estimated Delivery</label>
                    {isEditMode ? (
                      <input
                        type="text"
                        value={editedGroup.estimated_delivery || ''}
                        onChange={(e) => setEditedGroup({ ...editedGroup, estimated_delivery: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    ) : (
                      <p className="text-base text-gray-700">{selectedGroup.estimated_delivery || 'To be determined'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                    {isEditMode ? (
                      <input
                        type="datetime-local"
                        value={editedGroup.end_date ? new Date(editedGroup.end_date).toISOString().slice(0, 16) : ''}
                        onChange={(e) => setEditedGroup({ ...editedGroup, end_date: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    ) : (
                      <p className="text-base text-gray-700">
                        {selectedGroup.end_date ? new Date(selectedGroup.end_date).toLocaleString() : 'No end date set'}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-semibold ${
                      selectedGroup.is_active 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {selectedGroup.is_active ? (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Active
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4" />
                          Inactive
                        </>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Product Details */}
              {selectedGroup.product && (
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Product Name</label>
                      <p className="text-base text-gray-900 font-medium">{selectedGroup.product.name}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Manufacturer</label>
                      <p className="text-base text-gray-900">{selectedGroup.product.manufacturer || 'N/A'}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Total Stock</label>
                      <p className="text-base text-gray-900">{selectedGroup.product.totalStock || 'N/A'} units</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Regular Price</label>
                      <p className="text-base text-gray-500">{selectedGroup.product.regularPrice}</p>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Product Description</label>
                      <p className="text-base text-gray-700">{selectedGroup.product.description}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

        </main>
      </div>
    </SupplierLayout>
  );
};

export default SupplierDashboard;