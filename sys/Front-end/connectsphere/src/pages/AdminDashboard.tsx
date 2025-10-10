import Layout from '../components/Layout';
import StatCard from '../components/StatCard';
import { Users, ShoppingBag, DollarSign, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  // Activity Data
  const activityData = [
    { month: 'Jan', groups: 150, users: 180 },
    { month: 'Feb', groups: 180, users: 220 },
    { month: 'Mar', groups: 280, users: 290 },
    { month: 'Apr', groups: 250, users: 270 },
    { month: 'May', groups: 320, users: 350 },
    { month: 'Jun', groups: 380, users: 420 },
  ];

  // Model Performance Data
  const modelData = [
    { name: 'Accuracy', value: 25 },
    { name: 'Precision', value: 25 },
    { name: 'Recall', value: 30 },
    { name: 'F1-Score', value: 20 },
  ];

  const COLORS = ['#2563eb', '#10b981', '#ef4444', '#f59e0b'];

  // Training Stage Data
  const trainingData = [
    { stage: 'Data Quality', score: 85 },
    { stage: 'Feature Engineering', score: 78 },
    { stage: 'Model Iterations', score: 92 },
    { stage: 'Hyperparameter Tuning', score: 75 },
    { stage: 'Deployment Readiness', score: 88 },
  ];

  return (
    <Layout title="Admin Dashboard">
      {/* Analytics Summary */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Analytics Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Users"
            value="1,245"
            icon={<Users className="w-6 h-6" />}
            color="blue"
          />
          <StatCard
            title="Active Groups"
            value="189"
            icon={<ShoppingBag className="w-6 h-6" />}
            color="green"
          />
          <StatCard
            title="Total Transactions"
            value="8,321"
            icon={<TrendingUp className="w-6 h-6" />}
            color="blue"
          />
          <StatCard
            title="Revenue (USD)"
            value="$24,987"
            icon={<DollarSign className="w-6 h-6" />}
            color="red"
          />
        </div>
      </div>

      {/* Platform Activity Overview */}
      <div className="mb-8">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Platform Activity Overview</h3>
          <p className="text-sm text-gray-600 mb-4">Monthly trends for new group creations and user registrations.</p>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={activityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="groups" fill="#2563eb" name="New Groups Created" />
              <Bar dataKey="users" fill="#93c5fd" name="New Users Registered" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ML Training Progress */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">ML Training Progress</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Model Performance Breakdown */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h3 className="text-base font-semibold text-gray-900 mb-2">Model Performance Breakdown</h3>
            <p className="text-sm text-gray-600 mb-4">Distribution of key performance indicators for the recommendation engine.</p>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={modelData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  label
                >
                  {modelData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-2 mt-4 justify-center">
              {modelData.map((item, index) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }}></div>
                  <span className="text-xs text-gray-600">{item.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Training Stage Progression */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h3 className="text-base font-semibold text-gray-900 mb-2">Training Stage Progression</h3>
            <p className="text-sm text-gray-600 mb-4">Current scores across different machine learning development stages.</p>
            <ResponsiveContainer width="100%" height={250}>
              <RadarChart data={trainingData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="stage" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                <Radar name="Progress Score" dataKey="score" stroke="#2563eb" fill="#2563eb" fillOpacity={0.6} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* System Status */}
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 mt-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <h3 className="text-base font-semibold text-gray-900">Overall ML System Status</h3>
          </div>
          <p className="text-sm text-gray-600 mb-3">Monitoring the health and efficiency of all machine learning services.</p>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm font-medium text-green-800">Healthy</p>
            <p className="text-xs text-green-700 mt-1">All models are operational and performing optimally.</p>
          </div>
        </div>
      </div>

      {/* Management Tools */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Management Tools</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <ManagementCard
            icon={<Users className="w-8 h-8" />}
            title="User Management"
            description="View, edit, or remove user accounts and manage their roles and permissions."
            buttonText="Manage Users"
            link="/users"
          />
          <ManagementCard
            icon={<ShoppingBag className="w-8 h-8" />}
            title="Group Moderation"
            description="Oversee and moderate group-buy listings, ensuring compliance and quality."
            buttonText="Moderate Groups"
            link="/moderation"
          />
          <ManagementCard
            icon={<TrendingUp className="w-8 h-8" />}
            title="Product Catalog"
            description="Update and manage the inventory of products available for group buying."
            buttonText="Edit Products"
            link="/products"
          />
          <ManagementCard
            icon={<DollarSign className="w-8 h-8" />}
            title="System Settings"
            description="Configure global platform settings, notifications, and error integration points."
            buttonText="Configure System"
            link="/settings"
          />
        </div>
      </div>
    </Layout>
  );
};

interface ManagementCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  buttonText: string;
  link: string;
}

const ManagementCard = ({ icon, title, description, buttonText, link }: ManagementCardProps) => {
  const navigate = useNavigate();
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 flex flex-col">
      <div className="text-blue-600 mb-4">{icon}</div>
      <h3 className="text-base font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600 mb-4 flex-grow">{description}</p>
      <button
        onClick={() => navigate(link)}
        className="inline-block text-center px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition"
      >
        {buttonText}
      </button>
    </div>
  );
};

export default AdminDashboard;
