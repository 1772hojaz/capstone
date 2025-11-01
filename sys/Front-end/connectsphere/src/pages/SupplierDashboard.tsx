import React, { useState, useEffect } from 'react';
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ShoppingCart, Users, DollarSign, TrendingUp, Clock, CheckCircle, AlertCircle, Search, Download } from 'lucide-react';
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

  useEffect(() => {
    fetchDashboardData();
    fetchProducts();
    fetchGroupBuys();
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
            {/* Group Management */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Group Management</h2>
              
              {/* Group Management Actions */}
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-6">
                <div className="flex-1 max-w-md">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search groups..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="inline-flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Export Groups
                  </Button>
                </div>
              </div>

              {/* Pending Groups Table */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Clock className="w-5 w-5 text-yellow-600" />
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
                        {pendingGroupBuys
                          .filter(group =>
                            group.order_number.toLowerCase().includes(productSearch.toLowerCase()) ||
                            group.group_name.toLowerCase().includes(productSearch.toLowerCase()) ||
                            group.delivery_location.toLowerCase().includes(productSearch.toLowerCase())
                          )
                          .map((group) => (
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
                        {paidGroupBuys
                          .filter(group =>
                            group.order_number.toLowerCase().includes(productSearch.toLowerCase()) ||
                            group.group_name.toLowerCase().includes(productSearch.toLowerCase()) ||
                            group.delivery_location.toLowerCase().includes(productSearch.toLowerCase())
                          )
                          .map((group) => (
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
    </SupplierLayout>
  );
};

export default SupplierDashboard;