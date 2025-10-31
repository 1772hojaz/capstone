import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Package, Users, DollarSign, TrendingUp, ShoppingCart, AlertCircle, CheckCircle, Clock, MapPin, FileText, CreditCard, Bell, Upload } from 'lucide-react';

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
  const [pickupLocations, setPickupLocations] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [paymentDashboard, setPaymentDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('orders');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [
        metricsResponse,
        ordersResponse,
        locationsResponse,
        invoicesResponse,
        paymentsResponse,
        paymentDashboardResponse,
        notificationsResponse
      ] = await Promise.all([
        fetch('/api/supplier/dashboard/metrics', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/supplier/orders?status=pending', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/supplier/pickup-locations', { headers: { Authorization: `Bearer ${token}` } }),
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

      if (locationsResponse.ok) {
        const locationsData = await locationsResponse.json();
        setPickupLocations(locationsData);
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

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  const revenueData = metrics?.top_products.map(product => ({
    name: product.name.length > 15 ? product.name.substring(0, 15) + '...' : product.name,
    revenue: product.revenue
  })) || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Supplier Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage your products and orders</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.pending_orders || 0}</div>
              <p className="text-xs text-muted-foreground">Awaiting confirmation</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Groups</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.active_groups || 0}</div>
              <p className="text-xs text-muted-foreground">Using your products</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${metrics?.monthly_revenue.toFixed(2) || '0.00'}</div>
              <p className="text-xs text-muted-foreground">Last 30 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Savings</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${metrics?.total_savings_generated.toFixed(2) || '0.00'}</div>
              <p className="text-xs text-muted-foreground">Generated for traders</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="orders" className="space-y-6">
          <TabsList className="grid w-full grid-cols-7">
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="locations">Locations</TabsTrigger>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Order Inbox</CardTitle>
              </CardHeader>
              <CardContent>
                {orders.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No pending orders</p>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div key={order.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-semibold">{order.order_number}</h3>
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
                            <h4 className="font-medium mb-2">Products</h4>
                            {order.products.map((product, index) => (
                              <div key={index} className="text-sm">
                                {product.name}: {product.quantity} × ${product.unit_price} = ${product.total_amount}
                              </div>
                            ))}
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-semibold">Total: ${order.total_value}</p>
                            <p className="text-sm text-green-600">Savings: ${order.total_savings}</p>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleOrderAction(order.id, 'confirm')}
                            className="flex items-center gap-2"
                          >
                            <CheckCircle className="h-4 w-4" />
                            Confirm Order
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => handleOrderAction(order.id, 'reject', 'Capacity constraints')}
                            className="flex items-center gap-2"
                          >
                            <AlertCircle className="h-4 w-4" />
                            Reject Order
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Top Products by Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={revenueData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
                      <Bar dataKey="revenue" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Order Status Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <p className="text-gray-500">Analytics coming soon</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="products" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Product Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Product management interface coming soon</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="locations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Pickup Locations</CardTitle>
              </CardHeader>
              <CardContent>
                {pickupLocations.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No pickup locations configured</p>
                ) : (
                  <div className="space-y-4">
                    {pickupLocations.map((location) => (
                      <div key={location.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold">{location.name}</h3>
                            <p className="text-sm text-gray-600">{location.address}</p>
                            <p className="text-sm text-gray-600">{location.city}, {location.province}</p>
                            <p className="text-sm text-gray-600">Phone: {location.phone}</p>
                            <p className="text-sm text-gray-600">Hours: {location.operating_hours}</p>
                          </div>
                          <Badge variant={location.is_active ? "default" : "secondary"}>
                            {location.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="invoices" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Invoices</CardTitle>
              </CardHeader>
              <CardContent>
                {invoices.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No invoices generated yet</p>
                ) : (
                  <div className="space-y-4">
                    {invoices.map((invoice) => (
                      <div key={invoice.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-semibold">{invoice.invoice_number}</h3>
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
                            <p className="text-lg font-semibold">${invoice.total_amount}</p>
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
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Payment Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  {paymentDashboard && (
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span>Total Earnings:</span>
                        <span className="font-semibold">${paymentDashboard.total_earnings}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Pending Payments:</span>
                        <span className="font-semibold">${paymentDashboard.pending_payments}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Next Payout:</span>
                        <span className="font-semibold">
                          {new Date(paymentDashboard.next_payout_date).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Processing Fee:</span>
                        <span className="font-semibold">{(paymentDashboard.processing_fee_rate * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Payment History</CardTitle>
                </CardHeader>
                <CardContent>
                  {payments.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No payment history</p>
                  ) : (
                    <div className="space-y-2">
                      {payments.slice(0, 5).map((payment) => (
                        <div key={payment.id} className="flex justify-between items-center py-2 border-b">
                          <div>
                            <p className="font-medium">${payment.amount}</p>
                            <p className="text-sm text-gray-600">{payment.payment_method}</p>
                          </div>
                          <Badge variant={payment.status === 'completed' ? 'default' : 'secondary'}>
                            {payment.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
              </CardHeader>
              <CardContent>
                {notifications.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No notifications</p>
                ) : (
                  <div className="space-y-4">
                    {notifications.map((notification) => (
                      <div key={notification.id} className={`border rounded-lg p-4 ${!notification.is_read ? 'bg-blue-50' : ''}`}>
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-semibold">{notification.title}</h3>
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
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SupplierDashboard;