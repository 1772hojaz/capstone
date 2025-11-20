import { useState, useEffect } from 'react';
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line, PieChart, Pie, Cell } from 'recharts';
import analyticsService from '../../services/analyticsService';

const AnalyticsDashboard = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const response = await analyticsService.fetchDashboardData();
        setData(response);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
    const interval = setInterval(loadData, 300000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, []);

  if (loading) return (
    <div className="flex justify-center items-center py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  );

  if (error) return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <p className="text-red-700">Failed to load analytics: {error}</p>
    </div>
  );

  if (!data) return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <p className="text-gray-700">No analytics data available</p>
    </div>
  );

  const displayData = data;
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28'];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Recommendation Analytics</h1>

      {/* Alerts Section */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">System Alerts</h2>
        {displayData.alerts?.length > 0 ? (
          displayData.alerts.map((alert: any, i: number) => (
            <div key={i} className={`p-3 rounded-lg mb-2 ${
              alert.type === 'global' ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'
            }`}>
              <p className={alert.type === 'global' ? 'text-red-700' : 'text-yellow-700'}>
                {alert.message}
              </p>
            </div>
          ))
        ) : (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-green-700">No active alerts</p>
          </div>
        )}
      </div>

      {/* Performance Charts */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recommendation Performance</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={displayData.performance.dates.map((date: string, index: number) => ({
              date,
              lift: displayData.performance.score_lift[index]
            }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="lift"
                stroke="#3B82F6"
                strokeWidth={2}
                name="Recommendation Lift"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Segmentation Charts */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">User Segmentation</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={displayData.segmentation.segments.map((segment: string, index: number) => ({
                  name: segment,
                  value: displayData.segmentation.user_count[index]
                }))}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {displayData.segmentation.segments.map((_: string, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
