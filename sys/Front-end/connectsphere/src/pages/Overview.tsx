import { Users, Eye, ShoppingBag, DollarSign } from 'lucide-react';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar } from 'recharts';
import StatCard from '../components/StatCard';
import Layout from '../components/Layout';
import apiService from '../services/api';
import { useState, useEffect } from 'react';

const Overview = () => {
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [activityData, setActivityData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Load dashboard stats
        const stats = await apiService.getDashboardStats();
        setDashboardStats(stats);

        // Load activity data from backend (last 6 months)
        try {
          const activity = await apiService.getActivityData({ months: 6 });
          // activity is expected as [{ month, month_key, groups, users }, ...]
          setActivityData((activity || []).map((d: any) => ({ month: d.month, groups: d.groups, users: d.users })));
        } catch (err) {
          console.warn('Failed to load activity data from API, falling back to empty array', err);
          setActivityData([]);
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
        setError('Failed to load dashboard data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  return (
    <Layout title="Overview">
      <div className="space-y-8">
        {/* Analytics Summary */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Analytics Summary</h2>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700">{error}</p>
            </div>
          ) : dashboardStats ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Total Users"
                value={dashboardStats.total_users?.toString() || "0"}
                icon={<Users className="w-6 h-6" />}
                color="blue"
              />
              <StatCard
                title="Active Groups"
                value={dashboardStats.active_group_buys?.toString() || "0"}
                icon={<Eye className="w-6 h-6" />}
                color="green"
              />
              <StatCard
                title="Total Transactions"
                value={dashboardStats.total_transactions?.toString() || "0"}
                icon={<ShoppingBag className="w-6 h-6" />}
                color="blue"
              />
              <StatCard
                title="Revenue"
                value={`$${dashboardStats.total_revenue?.toFixed(2) || "0.00"}`}
                icon={<DollarSign className="w-6 h-6" />}
                color="red"
              />
            </div>
          ) : null}
        </div>

        {/* Platform Activity */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Platform Activity</h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activityData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="groups" fill="#3B82F6" name="New Groups" />
                  <Bar dataKey="users" fill="#93C5FD" name="New Users" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Overview;