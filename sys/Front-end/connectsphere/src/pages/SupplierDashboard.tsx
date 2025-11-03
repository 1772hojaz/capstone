import React, { useState, useEffect } from 'react';
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ShoppingCart, Users, DollarSign, TrendingUp, Clock, CheckCircle, AlertCircle, Search, Download, Plus, X } from 'lucide-react';
import SupplierLayout from '../components/SupplierLayout';
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
  const [productSearch, setProductSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('orders');

  // Group Moderation State
  const [activeGroups, setActiveGroups] = useState<any[]>([]);
  const [readyForPaymentGroups, setReadyForPaymentGroups] = useState<any[]>([]);
  const [moderationStats, setModerationStats] = useState<any>(null);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [showGroupDetails, setShowGroupDetails] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [generatingQR, setGeneratingQR] = useState(false);
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
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [
        metricsResponse,
        ordersResponse,
        invoicesResponse,
        paymentsResponse,
        paymentDashboardResponse,
        notificationsResponse
      ] = await Promise.all([
        fetch('/api/supplier/dashboard/metrics', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/supplier/orders?status=pending', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/supplier/invoices', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/supplier/payments', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/supplier/payments/dashboard', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/supplier/notifications', { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json();
        setMetrics(metricsData);
      }

      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json();
        setOrders(ordersData);
      }

      if (invoicesResponse.ok) {
        const invoicesData = await invoicesResponse.json();
        setInvoices(invoicesData);
      }

      if (paymentsResponse.ok) {
        const paymentsData = await paymentsResponse.json();
        setPayments(paymentsData);
      }

      if (paymentDashboardResponse.ok) {
        const paymentDashboardData = await paymentDashboardResponse.json();
        setPaymentDashboard(paymentDashboardData);
      }

      if (notificationsResponse.ok) {
        const notificationsData = await notificationsResponse.json();
        setNotifications(notificationsData);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOrderAction = async (orderId: number, action: 'confirm' | 'reject', reason?: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/supplier/orders/${orderId}/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ action, reason })
      });

      if (response.ok) {
        // Refresh orders
        fetchDashboardData();
      }
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

  const handleProcessPayment = async (groupId: number) => {
    try {
      setProcessingPayment(true);
      const result = await apiService.processSupplierGroupPayment(groupId);
      // Refresh data after payment processing
      fetchGroupModerationData();
      alert('Payment processed successfully!');
    } catch (error) {
      console.error('Error processing payment:', error);
      alert('Failed to process payment. Please try again.');
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleGenerateQR = async (groupId: number) => {
    try {
      setGeneratingQR(true);
      const result = await apiService.generateSupplierGroupQR(groupId);
      // Show QR code or download link
      if (result && result.qr_code_data) {
        // You could show a modal with the QR code here
        alert(`QR Code generated successfully! Code: ${result.qr_code_data}`);
      }
    } catch (error) {
      console.error('Error generating QR code:', error);
      alert('Failed to generate QR code. Please try again.');
    } finally {
      setGeneratingQR(false);
    }
  };

  const handleViewGroupDetails = async (groupId: number) => {
    try {
      const groupDetails = await apiService.getSupplierGroupDetails(groupId);
      setSelectedGroup(groupDetails);
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
      {/* Tabs - Clear visual hierarchy and state */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-[73px] z-40">
        <div className="px-3 sm:px-6">
          <nav className="flex gap-4 sm:gap-8" role="tablist" aria-label="Supplier sections">
            <button
              onClick={() => setActiveTab('orders')}
              className={`py-4 text-sm font-medium border-b-2 transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                activeTab === 'orders' 
                  ? 'border-blue-600 text-blue-600 font-semibold' 
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
              role="tab"
              aria-selected={activeTab === 'orders'}
              aria-controls="orders-panel"
            >
              Orders
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-4 text-sm font-medium border-b-2 transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                activeTab === 'analytics' 
                  ? 'border-blue-600 text-blue-600 font-semibold' 
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
              role="tab"
              aria-selected={activeTab === 'analytics'}
              aria-controls="analytics-panel"
            >
              Analytics
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`py-4 text-sm font-medium border-b-2 transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                activeTab === 'products' 
                  ? 'border-blue-600 text-blue-600 font-semibold' 
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
              role="tab"
              aria-selected={activeTab === 'products'}
              aria-controls="groups-panel"
            >
              Groups
            </button>
            <button
              onClick={() => setActiveTab('invoices')}
              className={`py-4 text-sm font-medium border-b-2 transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                activeTab === 'invoices' 
                  ? 'border-blue-600 text-blue-600 font-semibold' 
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
              role="tab"
              aria-selected={activeTab === 'invoices'}
              aria-controls="invoices-panel"
            >
              Invoices
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`py-4 text-sm font-medium border-b-2 transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                activeTab === 'payments' 
                  ? 'border-blue-600 text-blue-600 font-semibold' 
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
              role="tab"
              aria-selected={activeTab === 'payments'}
              aria-controls="payments-panel"
            >
              Payments
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`py-4 text-sm font-medium border-b-2 transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                activeTab === 'notifications' 
                  ? 'border-blue-600 text-blue-600 font-semibold' 
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
              role="tab"
              aria-selected={activeTab === 'notifications'}
              aria-controls="notifications-panel"
            >
              Notifications
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Tab Content */}
                {/* Tab Content */}
        {activeTab === 'orders' && (
          <div className="space-y-8">
            {/* Order Management */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Management</h2>
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                {orders.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No pending orders</h3>
                    <p className="text-gray-600">All orders have been processed.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div key={order.id} className="border border-gray-200 rounded-lg p-6 bg-white">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-semibold text-gray-900">{order.order_number}</h3>
                            <p className="text-sm text-gray-600">{order.group_name}</p>
                            <p className="text-sm text-gray-600">{order.trader_count} traders • {order.delivery_location}</p>
                          </div>
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Pending
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Products</h4>
                            {order.products.map((product, index) => (
                              <div key={index} className="text-sm text-gray-600">
                                {product.name}: {product.quantity} × ${product.unit_price} = ${product.total_amount}
                              </div>
                            ))}
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-semibold text-gray-900">Total: ${order.total_value}</p>
                            <p className="text-sm text-green-600">Savings: ${order.total_savings}</p>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleOrderAction(order.id, 'confirm')}
                            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
                          >
                            <CheckCircle className="h-4 w-4" />
                            Confirm Order
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => handleOrderAction(order.id, 'reject', 'Capacity constraints')}
                            className="flex items-center gap-2 text-red-600 border-red-300 hover:bg-red-50"
                          >
                            <AlertCircle className="h-4 w-4" />
                            Reject Order
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-8">
            {/* Analytics Summary */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Analytics Summary</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <TrendingUp className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Top Products by Revenue</h3>
                      <p className="text-sm text-gray-600">Performance of your products in group buys</p>
                    </div>
                  </div>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={revenueData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
                        <Bar dataKey="revenue" fill="#3B82F6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Users className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Dashboard Metrics</h3>
                      <p className="text-sm text-gray-600">Key performance indicators</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <ShoppingCart className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-gray-600">Total Orders</span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900">{orders.length + pendingGroupBuys.length + paidGroupBuys.length}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-gray-600">Total Revenue</span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900">
                        ${[...orders, ...pendingGroupBuys, ...paidGroupBuys].reduce((sum, item) => sum + (item.total_value || 0), 0).toFixed(2)}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-4 h-4 text-yellow-600" />
                        <span className="text-sm font-medium text-gray-600">Pending Orders</span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900">{orders.length + pendingGroupBuys.length}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-gray-600">Completed Orders</span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900">{paidGroupBuys.length}</p>
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
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-medium"
                >
                  <Plus className="w-5 h-5" />
                  Create New Group
                </button>
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

              {/* Group Moderation Sections - Side by Side */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Active Groups for Moderation */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Active Groups</h3>
                    <p className="text-sm text-gray-600">Groups using your products that are currently active</p>
                  </div>
                </div>
                {activeGroups.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No active groups</h3>
                    <p className="text-gray-600">Groups using your products will appear here when they become active.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Group Details</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Progress</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Product</th>
                          <th className="text-right py-3 px-4 font-medium text-gray-900">Total Amount</th>
                          <th className="text-center py-3 px-4 font-medium text-gray-900">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeGroups.map((group) => (
                          <tr key={group.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-4 px-4">
                              <div className="font-medium text-gray-900">{group.name}</div>
                              <div className="text-sm text-gray-600">by {group.creator}</div>
                              <div className="text-sm text-gray-600">Due: {group.dueDate}</div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="text-sm text-gray-900">{group.members}/{group.targetMembers} members</div>
                              <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                                <div
                                  className="bg-blue-600 h-2 rounded-full"
                                  style={{ width: `${Math.min((group.members / group.targetMembers) * 100, 100)}%` }}
                                ></div>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="text-sm font-medium text-gray-900">{group.product.name}</div>
                              <div className="text-sm text-gray-600">{group.product.regularPrice} → {group.product.bulkPrice}</div>
                            </td>
                            <td className="py-4 px-4 text-right">
                              <div className="font-semibold text-gray-900">{group.totalAmount}</div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex justify-center gap-2">
                                <Button
                                  onClick={() => handleViewGroupDetails(group.id)}
                                  variant="outline"
                                  size="sm"
                                >
                                  View Details
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

              {/* Groups Ready for Payment */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <DollarSign className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Ready for Payment</h3>
                    <p className="text-sm text-gray-600">Groups that have reached target and are ready for payment processing</p>
                  </div>
                </div>

                {readyForPaymentGroups.length === 0 ? (
                  <div className="text-center py-12">
                    <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No groups ready for payment</h3>
                    <p className="text-gray-600">Groups will appear here when they reach their target participation.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Group Details</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Participants</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-900">Product</th>
                          <th className="text-right py-3 px-4 font-medium text-gray-900">Total Amount</th>
                          <th className="text-center py-3 px-4 font-medium text-gray-900">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {readyForPaymentGroups.map((group) => (
                          <tr key={group.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-4 px-4">
                              <div className="font-medium text-gray-900">{group.name}</div>
                              <div className="text-sm text-gray-600">by {group.creator}</div>
                              <div className="text-sm text-gray-600">Category: {group.category}</div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="text-sm text-gray-900">{group.members} members</div>
                              <div className="text-sm text-green-600">Target reached ✓</div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="text-sm font-medium text-gray-900">{group.product.name}</div>
                              <div className="text-sm text-gray-600">{group.product.bulkPrice} each</div>
                            </td>
                            <td className="py-4 px-4 text-right">
                              <div className="font-semibold text-gray-900">{group.totalAmount}</div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex justify-center gap-2">
                                <Button
                                  onClick={() => handleProcessPayment(group.id)}
                                  disabled={processingPayment}
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  {processingPayment ? 'Processing...' : 'Process Payment'}
                                </Button>
                                <Button
                                  onClick={() => handleGenerateQR(group.id)}
                                  disabled={generatingQR}
                                  variant="outline"
                                  size="sm"
                                >
                                  {generatingQR ? 'Generating...' : 'Generate QR'}
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

              {/* Legacy Group Orders Sections - Side by Side */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                                  variant="outline"
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

                {/* Completed Groups Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Completed Group Orders</h3>
                    <p className="text-sm text-gray-600">Successfully delivered orders</p>
                  </div>
                </div>
                {paidGroupBuys.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No completed orders</h3>
                    <p className="text-gray-600">Completed group orders will appear here.</p>
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
                          <th className="text-center py-3 px-4 font-medium text-gray-900">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paidGroupBuys.map((group) => (
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
                            <td className="py-4 px-4 text-center">
                              <Badge variant="default" className="bg-green-100 text-green-800">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Completed
                              </Badge>
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
                            <Button variant="outline" size="sm">
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

    </SupplierLayout>
  );
};

export default SupplierDashboard;