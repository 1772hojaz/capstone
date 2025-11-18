import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Package, DollarSign, TrendingUp,
  ShoppingCart, Eye, BarChart3, Clock
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import apiService from '../services/api';
import TopNavigation from '../components/navigation/TopNavigation';
import MobileBottomNav from '../components/navigation/MobileBottomNav';
import { PageContainer, PageHeader } from '../components/layout/index';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { SkeletonCard } from '../components/feedback/Skeleton';
import { ErrorAlert } from '../components/feedback/ErrorAlert';

interface AdminMetrics {
  total_users: number;
  active_groups: number;
  total_revenue: number;
  pending_orders: number;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [metricsData, revenueData] = await Promise.all([
          apiService.get('/api/admin/dashboard/metrics'),
          apiService.get('/api/admin/analytics/revenue')
        ]);
        
        setMetrics(metricsData);
        setChartData(revenueData);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        setError('Failed to load dashboard data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const quickActions = [
    { icon: Users, label: 'Manage Users', path: '/admin/users', color: 'primary' },
    { icon: Package, label: 'Manage Groups', path: '/admin/groups', color: 'success' },
    { icon: ShoppingCart, label: 'View Orders', path: '/admin/orders', color: 'warning' },
    { icon: BarChart3, label: 'Analytics', path: '/admin/analytics', color: 'info' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-16 md:pb-0">
      <TopNavigation userRole="admin" />
      
      <PageContainer>
        <PageHeader
          title="Admin Dashboard"
          description="Monitor platform activity and manage operations"
          breadcrumbs={[
            { label: 'Home' }
          ]}
          actions={
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              leftIcon={<TrendingUp className="h-4 w-4" />}
            >
              Refresh
            </Button>
          }
        />

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

        {/* Dashboard Content */}
        {!loading && !error && metrics && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card variant="elevated" padding="lg">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="body-sm text-gray-600 mb-1">Total Users</p>
                    <p className="text-3xl font-bold text-gray-900">{metrics.total_users}</p>
                    <Badge variant="success" size="sm" className="mt-2">
                      Active
                    </Badge>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center">
                    <Users className="h-6 w-6 text-primary-600" />
                  </div>
                </div>
              </Card>

              <Card variant="elevated" padding="lg">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="body-sm text-gray-600 mb-1">Active Groups</p>
                    <p className="text-3xl font-bold text-gray-900">{metrics.active_groups}</p>
                    <Badge variant="info" size="sm" className="mt-2">
                      Running
                    </Badge>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-success-100 flex items-center justify-center">
                    <Package className="h-6 w-6 text-success-600" />
                  </div>
                </div>
              </Card>

              <Card variant="elevated" padding="lg">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="body-sm text-gray-600 mb-1">Total Revenue</p>
                    <p className="text-3xl font-bold text-gray-900">${metrics.total_revenue.toLocaleString()}</p>
                    <Badge variant="success" size="sm" className="mt-2">
                      +12.5%
                    </Badge>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-warning-100 flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-warning-600" />
                  </div>
                </div>
              </Card>

              <Card variant="elevated" padding="lg">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="body-sm text-gray-600 mb-1">Pending Orders</p>
                    <p className="text-3xl font-bold text-gray-900">{metrics.pending_orders}</p>
                    <Badge variant="warning" size="sm" className="mt-2">
                      Awaiting
                    </Badge>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-info-100 flex items-center justify-center">
                    <Clock className="h-6 w-6 text-info-600" />
                  </div>
                </div>
              </Card>
            </div>

            {/* Revenue Chart */}
            {chartData.length > 0 && (
              <Card variant="default" padding="lg">
                <h3 className="heading-4 mb-4">Revenue Overview</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="revenue" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            )}

            {/* Quick Actions */}
            <Card variant="default" padding="lg">
              <h3 className="heading-4 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {quickActions.map((action) => (
                  <button
                    key={action.path}
                    onClick={() => navigate(action.path)}
                    className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-lg hover:bg-gray-100 hover:shadow-md transition-all group"
                  >
                    <div className={`h-16 w-16 rounded-full bg-${action.color}-100 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                      <action.icon className={`h-8 w-8 text-${action.color}-600`} />
                    </div>
                    <span className="heading-6 text-gray-900">{action.label}</span>
                  </button>
                ))}
              </div>
            </Card>

            {/* Recent Activity */}
            <Card variant="default" padding="lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="heading-4">Recent Activity</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/admin/activity')}
                  leftIcon={<Eye className="h-4 w-4" />}
                >
                  View All
                </Button>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-success-100 flex items-center justify-center">
                      <Package className="h-5 w-5 text-success-600" />
                    </div>
                    <div>
                      <p className="body font-medium">New group created</p>
                      <p className="body-sm text-gray-600">Electronics Bundle • 2 minutes ago</p>
                    </div>
                  </div>
                  <Badge variant="success" size="sm">New</Badge>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="body font-medium">5 new users registered</p>
                      <p className="body-sm text-gray-600">Today</p>
                    </div>
                  </div>
                  <Badge variant="info" size="sm">Users</Badge>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-warning-100 flex items-center justify-center">
                      <ShoppingCart className="h-5 w-5 text-warning-600" />
                    </div>
                    <div>
                      <p className="body font-medium">Order completed</p>
                      <p className="body-sm text-gray-600">Order #12345 • 1 hour ago</p>
                    </div>
                  </div>
                  <Badge variant="success" size="sm">Complete</Badge>
                </div>
              </div>
            </Card>
          </div>
        )}
      </PageContainer>

      <MobileBottomNav userRole="admin" />
    </div>
  );
}
