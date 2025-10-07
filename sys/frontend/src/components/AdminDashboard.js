import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI, productsAPI, mlAPI } from '../api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut, Radar } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [groups, setGroups] = useState([]);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [reports, setReports] = useState(null);
  const [trainingViz, setTrainingViz] = useState(null);
  const [retrainingStatus, setRetrainingStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [currency, setCurrency] = useState('USD'); // 'USD' or 'ZiG'
  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    image_url: '',
    unit_price: '',
    bulk_price: '',
    unit_price_zig: '',
    bulk_price_zig: '',
    moq: '',
    category: ''
  });
  const navigate = useNavigate();

  // Helper function to format price based on selected currency
  const formatPrice = (product, priceType = 'unit') => {
    if (!product) return '0.00';
    
    if (currency === 'ZiG') {
      const price = priceType === 'unit' ? product.unit_price_zig : product.bulk_price_zig;
      return price ? price.toFixed(2) : '0.00';
    } else {
      const price = priceType === 'unit' ? product.unit_price : product.bulk_price;
      return price ? price.toFixed(2) : '0.00';
    }
  };

  const getCurrencySymbol = () => currency === 'ZiG' ? 'ZiG' : '$';
  const getCurrencyPosition = () => currency === 'ZiG' ? 'after' : 'before';

  const displayPrice = (price) => {
    if (getCurrencyPosition() === 'before') {
      return `${getCurrencySymbol()}${price}`;
    } else {
      return `${price} ${getCurrencySymbol()}`;
    }
  };

  useEffect(() => {
    if (activeTab === 'dashboard') fetchDashboardStats();
    if (activeTab === 'groups') fetchGroups();
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'products') fetchProducts();
    if (activeTab === 'reports') fetchReports();
    if (activeTab === 'ml-training') fetchTrainingVisualization();
  }, [activeTab]);

  const fetchDashboardStats = async () => {
    try {
      const response = await adminAPI.getDashboard();
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchGroups = async () => {
    try {
      const response = await adminAPI.getAllGroups();
      setGroups(response.data);
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await adminAPI.getAllUsers();
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await productsAPI.getAll({ is_active: null });
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchReports = async () => {
    try {
      const response = await adminAPI.getReports({ period: 'month' });
      setReports(response.data);
    } catch (error) {
      console.error('Error fetching reports:', error);
    }
  };

  const fetchTrainingVisualization = async () => {
    try {
      console.log('Fetching training visualization...');
      const response = await mlAPI.getTrainingVisualization();
      console.log('Training visualization response:', response.data);
      setTrainingViz(response.data);
    } catch (error) {
      console.error('Error fetching training visualization:', error);
      console.error('Error response:', error.response);
      // If it's a 404, it means no model has been trained yet
      if (error.response?.status === 404) {
        setTrainingViz(null);
      } else {
        setTrainingViz(null);
      }
    }
  };

  const handleRetrain = async () => {
    if (!window.confirm('Retrain ML models? This may take a few moments.')) return;
    
    try {
      setLoading(true);
      const response = await mlAPI.retrain();
      setRetrainingStatus(response.data);
      alert(response.data.message);
      if (response.data.status === 'success') {
        fetchTrainingVisualization();
      }
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to retrain models');
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteGroup = async (id) => {
    if (!window.confirm('Mark this group-buy as completed?')) return;
    
    try {
      setLoading(true);
      await adminAPI.completeGroup(id);
      alert('Group-buy completed successfully');
      fetchGroups();
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to complete group-buy');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelGroup = async (id) => {
    if (!window.confirm('Cancel this group-buy?')) return;
    
    try {
      setLoading(true);
      await adminAPI.cancelGroup(id);
      alert('Group-buy cancelled successfully');
      fetchGroups();
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to cancel group-buy');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await productsAPI.create({
        ...productForm,
        unit_price: parseFloat(productForm.unit_price),
        bulk_price: parseFloat(productForm.bulk_price),
        unit_price_zig: parseFloat(productForm.unit_price_zig),
        bulk_price_zig: parseFloat(productForm.bulk_price_zig),
        moq: parseInt(productForm.moq)
      });
      alert('Product created successfully');
      setShowProductForm(false);
      setProductForm({
        name: '',
        description: '',
        image_url: '',
        unit_price: '',
        bulk_price: '',
        unit_price_zig: '',
        bulk_price_zig: '',
        moq: '',
        category: ''
      });
      fetchProducts();
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to create product');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleProduct = async (id, currentStatus) => {
    try {
      await productsAPI.update(id, { is_active: !currentStatus });
      fetchProducts();
    } catch (error) {
      alert('Failed to update product');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const StatCard = ({ title, value, icon, color }) => (
    <div className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${color}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-800">{value}</p>
        </div>
        <div className="text-4xl">{icon}</div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-indigo-600 to-purple-600 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
              <p className="text-indigo-100 text-sm mt-1">Manage your Group-Buy Platform</p>
            </div>
            <div className="flex items-center space-x-4">
              {/* Currency Toggle */}
              <div className="flex items-center bg-white/20 rounded-lg p-1">
                <button
                  onClick={() => setCurrency('USD')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    currency === 'USD'
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  USD ($)
                </button>
                <button
                  onClick={() => setCurrency('ZiG')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    currency === 'ZiG'
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-white hover:bg-white/10'
                  }`}
                >
                  ZiG
                </button>
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'dashboard', label: 'Dashboard' },
              { id: 'products', label: 'Products' },
              { id: 'groups', label: 'Group-Buys' },
              { id: 'users', label: 'Users' },
              { id: 'reports', label: 'Reports' },
              { id: 'ml-training', label: 'ML Training' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && stats && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <StatCard
                title="Total Users"
                value={stats.total_users}
                icon=""
                color="border-blue-500"
              />
              <StatCard
                title="Active Products"
                value={stats.total_products}
                icon=""
                color="border-green-500"
              />
              <StatCard
                title="Active Group-Buys"
                value={stats.active_group_buys}
                icon=""
                color="border-yellow-500"
              />
              <StatCard
                title="Completed Group-Buys"
                value={stats.completed_group_buys}
                icon=""
                color="border-purple-500"
              />
              <StatCard
                title="Total Revenue"
                value={`$${stats.total_revenue.toFixed(2)}`}
                icon=""
                color="border-green-600"
              />
              <StatCard
                title="Total Savings"
                value={`$${stats.total_savings.toFixed(2)}`}
                icon=""
                color="border-indigo-500"
              />
            </div>
          </div>
        )}

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">Products Management</h2>
              <button
                onClick={() => setShowProductForm(!showProductForm)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
              >
                + Add Product
              </button>
            </div>

            {showProductForm && (
              <form onSubmit={handleCreateProduct} className="bg-white p-6 rounded-lg shadow-md mb-6">
                <h3 className="text-lg font-semibold mb-4">Add New Product</h3>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Product Name"
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    className="px-3 py-2 border rounded-md"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Category"
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    className="px-3 py-2 border rounded-md"
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Unit Price (USD)"
                    value={productForm.unit_price}
                    onChange={(e) => setProductForm({ ...productForm, unit_price: e.target.value })}
                    className="px-3 py-2 border rounded-md"
                    required
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Bulk Price (USD)"
                    value={productForm.bulk_price}
                    onChange={(e) => setProductForm({ ...productForm, bulk_price: e.target.value })}
                    className="px-3 py-2 border rounded-md"
                    required
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Unit Price (ZiG)"
                    value={productForm.unit_price_zig}
                    onChange={(e) => setProductForm({ ...productForm, unit_price_zig: e.target.value })}
                    className="px-3 py-2 border rounded-md"
                    required
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Bulk Price (ZiG)"
                    value={productForm.bulk_price_zig}
                    onChange={(e) => setProductForm({ ...productForm, bulk_price_zig: e.target.value })}
                    className="px-3 py-2 border rounded-md"
                    required
                  />
                  <input
                    type="number"
                    placeholder="MOQ"
                    value={productForm.moq}
                    onChange={(e) => setProductForm({ ...productForm, moq: e.target.value })}
                    className="px-3 py-2 border rounded-md"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Image URL"
                    value={productForm.image_url}
                    onChange={(e) => setProductForm({ ...productForm, image_url: e.target.value })}
                    className="px-3 py-2 border rounded-md"
                  />
                  <textarea
                    placeholder="Description"
                    value={productForm.description}
                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                    className="px-3 py-2 border rounded-md col-span-2"
                    rows="3"
                    required
                  />
                </div>
                <div className="mt-4 flex space-x-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                  >
                    Create Product
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowProductForm(false)}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bulk Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">MOQ</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Savings</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <img
                            src={product.image_url || 'https://via.placeholder.com/50'}
                            alt={product.name}
                            className="w-10 h-10 rounded object-cover mr-3"
                          />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{product.name}</div>
                            <div className="text-xs text-blue-600 mt-0.5">
                              <span>{product.description}</span>
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">{product.category}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {displayPrice(formatPrice(product, 'unit'))}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">
                        {displayPrice(formatPrice(product, 'bulk'))}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {product.moq}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                        {(product.savings_factor * 100).toFixed(0)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          product.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {product.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleToggleProduct(product.id, product.is_active)}
                          className={`${
                            product.is_active ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'
                          }`}
                        >
                          {product.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Groups Tab */}
        {activeTab === 'groups' && (
          <div>
            <h2 className="text-2xl font-semibold mb-6">Group-Buys Management</h2>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Creator</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Progress</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Participants</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {groups.map((group) => (
                    <tr key={group.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {group.product_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {group.creator_email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {group.location_zone}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${Math.min(group.moq_progress, 100)}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-600">{group.moq_progress.toFixed(0)}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {group.participants_count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          group.status === 'active' ? 'bg-green-100 text-green-800' :
                          group.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {group.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        {group.status === 'active' && (
                          <>
                            <button
                              onClick={() => handleCompleteGroup(group.id)}
                              disabled={loading || !group.is_fully_funded}
                              className="text-green-600 hover:text-green-900 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Complete
                            </button>
                            <button
                              onClick={() => handleCancelGroup(group.id)}
                              disabled={loading}
                              className="text-red-600 hover:text-red-900"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div>
            <h2 className="text-2xl font-semibold mb-6">Users Management</h2>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cluster</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transactions</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Spent</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.location_zone}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.cluster_id !== null ? `Cluster ${user.cluster_id}` : 'Not clustered'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.total_transactions}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${user.total_spent.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && reports && (
          <div>
            <h2 className="text-2xl font-semibold mb-6">Reports & Analytics</h2>
            
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                title="Total Group-Buys"
                value={reports.total_group_buys}
                icon=""
                color="border-blue-500"
              />
              <StatCard
                title="Successful"
                value={reports.successful_group_buys}
                icon=""
                color="border-green-500"
              />
              <StatCard
                title="Total Participants"
                value={reports.total_participants}
                icon=""
                color="border-purple-500"
              />
              <StatCard
                title="Avg Savings"
                value={`${reports.avg_savings.toFixed(1)}%`}
                icon=""
                color="border-yellow-500"
              />
            </div>

            {/* Charts Section */}
            <div className="space-y-6">
              {/* Top Products Chart */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Top Products Performance</h3>
                <div className="h-80">
                  <Bar
                    data={{
                      labels: reports.top_products.map(item => item.product),
                      datasets: [
                        {
                          label: 'Number of Group-Buys',
                          data: reports.top_products.map(item => item.group_count),
                          backgroundColor: 'rgba(59, 130, 246, 0.8)',
                          borderColor: 'rgb(59, 130, 246)',
                          borderWidth: 2,
                        }
                      ]
                    }}
                    options={{
                      indexAxis: 'y',
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false,
                        },
                        tooltip: {
                          callbacks: {
                            label: function(context) {
                              return `${context.parsed.x} group-buys`;
                            }
                          }
                        }
                      },
                      scales: {
                        x: {
                          beginAtZero: true,
                          title: {
                            display: true,
                            text: 'Number of Group-Buys'
                          },
                          ticks: {
                            precision: 0
                          }
                        },
                        y: {
                          title: {
                            display: true,
                            text: 'Product'
                          }
                        }
                      }
                    }}
                  />
                </div>
              </div>

              {/* Cluster Distribution & Success Rate */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Cluster Distribution Doughnut */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">User Cluster Distribution</h3>
                  <div className="h-80 flex items-center justify-center">
                    <Doughnut
                      data={{
                        labels: reports.cluster_distribution.map(item => `Cluster ${item.cluster_id}`),
                        datasets: [
                          {
                            data: reports.cluster_distribution.map(item => item.user_count),
                            backgroundColor: [
                              'rgba(59, 130, 246, 0.8)',
                              'rgba(16, 185, 129, 0.8)',
                              'rgba(249, 115, 22, 0.8)',
                              'rgba(139, 92, 246, 0.8)',
                              'rgba(236, 72, 153, 0.8)',
                            ],
                            borderColor: [
                              'rgb(59, 130, 246)',
                              'rgb(16, 185, 129)',
                              'rgb(249, 115, 22)',
                              'rgb(139, 92, 246)',
                              'rgb(236, 72, 153)',
                            ],
                            borderWidth: 2,
                          }
                        ]
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'right',
                          },
                          tooltip: {
                            callbacks: {
                              label: function(context) {
                                const total = reports.cluster_distribution.reduce((sum, item) => sum + item.user_count, 0);
                                const percentage = ((context.parsed / total) * 100).toFixed(1);
                                return `${context.label}: ${context.parsed} users (${percentage}%)`;
                              }
                            }
                          }
                        }
                      }}
                    />
                  </div>
                </div>

                {/* Success Rate Bar Chart */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">Success Metrics</h3>
                  <div className="h-80">
                    <Bar
                      data={{
                        labels: ['Total Group-Buys', 'Successful', 'Failed/Cancelled'],
                        datasets: [
                          {
                            label: 'Count',
                            data: [
                              reports.total_group_buys,
                              reports.successful_group_buys,
                              reports.total_group_buys - reports.successful_group_buys
                            ],
                            backgroundColor: [
                              'rgba(59, 130, 246, 0.8)',
                              'rgba(16, 185, 129, 0.8)',
                              'rgba(239, 68, 68, 0.8)',
                            ],
                            borderColor: [
                              'rgb(59, 130, 246)',
                              'rgb(16, 185, 129)',
                              'rgb(239, 68, 68)',
                            ],
                            borderWidth: 2,
                          }
                        ]
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            display: false,
                          },
                          tooltip: {
                            callbacks: {
                              label: function(context) {
                                const percentage = ((context.parsed.y / reports.total_group_buys) * 100).toFixed(1);
                                return `${context.parsed.y} (${percentage}%)`;
                              }
                            }
                          }
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            title: {
                              display: true,
                              text: 'Number of Group-Buys'
                            },
                            ticks: {
                              precision: 0
                            }
                          }
                        }
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Participation & Savings Overview */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Participation & Savings Analysis</h3>
                <div className="h-80">
                  <Line
                    data={{
                      labels: reports.top_products.map(item => item.product),
                      datasets: [
                        {
                          label: 'Group-Buys Created',
                          data: reports.top_products.map(item => item.group_count),
                          borderColor: 'rgb(59, 130, 246)',
                          backgroundColor: 'rgba(59, 130, 246, 0.1)',
                          tension: 0.4,
                          fill: true,
                          yAxisID: 'y',
                        },
                        {
                          label: 'Avg Savings %',
                          data: reports.top_products.map(() => reports.avg_savings),
                          borderColor: 'rgb(16, 185, 129)',
                          backgroundColor: 'rgba(16, 185, 129, 0.1)',
                          tension: 0.4,
                          fill: true,
                          yAxisID: 'y1',
                        }
                      ]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      interaction: {
                        mode: 'index',
                        intersect: false,
                      },
                      plugins: {
                        legend: {
                          position: 'top',
                        },
                      },
                      scales: {
                        y: {
                          type: 'linear',
                          display: true,
                          position: 'left',
                          title: {
                            display: true,
                            text: 'Number of Group-Buys'
                          },
                          beginAtZero: true,
                        },
                        y1: {
                          type: 'linear',
                          display: true,
                          position: 'right',
                          title: {
                            display: true,
                            text: 'Savings %'
                          },
                          beginAtZero: true,
                          grid: {
                            drawOnChartArea: false,
                          },
                        },
                      }
                    }}
                  />
                </div>
              </div>

              {/* Data Tables */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Products Table */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">Top Products (Detail)</h3>
                  <div className="space-y-3">
                    {reports.top_products.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl font-bold text-blue-600">#{index + 1}</span>
                          <span className="text-gray-700 font-medium">{item.product}</span>
                        </div>
                        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                          {item.group_count} groups
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Cluster Distribution Table */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">Cluster Distribution (Detail)</h3>
                  <div className="space-y-3">
                    {reports.cluster_distribution.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-4 h-4 rounded-full" style={{
                            backgroundColor: [
                              'rgb(59, 130, 246)',
                              'rgb(16, 185, 129)',
                              'rgb(249, 115, 22)',
                              'rgb(139, 92, 246)',
                              'rgb(236, 72, 153)',
                            ][index % 5]
                          }}></div>
                          <span className="text-gray-700 font-medium">Cluster {item.cluster_id}</span>
                        </div>
                        <div className="text-right">
                          <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-semibold">
                            {item.user_count} users
                          </span>
                          <div className="text-xs text-gray-500 mt-1">
                            {((item.user_count / reports.total_participants) * 100).toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ML Training Tab */}
        {activeTab === 'ml-training' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">ML Training & Analytics</h2>
                <p className="text-gray-600 mt-1">Hybrid Recommender System: NMF Collaborative Filtering + TF-IDF Content-Based + K-Means Clustering</p>
              </div>
              <button
                onClick={handleRetrain}
                disabled={loading}
                className="bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center space-x-2"
              >
                <span>{loading ? 'Training...' : 'Retrain Models'}</span>
              </button>
            </div>

            {/* Info Banner */}
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-purple-900 mb-2">Understanding the Visualizations</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-purple-800">
                    <div>
                      <p className="font-medium mb-1">Silhouette Score</p>
                      <p className="text-purple-700">Measures cluster quality (-1 to +1). Higher is better. Above 0.2 is good.</p>
                    </div>
                    <div>
                      <p className="font-medium mb-1">Cluster Centers</p>
                      <p className="text-purple-700">Shows which products each cluster prefers. Helps identify user segments.</p>
                    </div>
                    <div>
                      <p className="font-medium mb-1">Hybrid Weights</p>
                      <p className="text-purple-700">CF: 60% (user similarity) + CBF: 40% (product features) + Pop: 10% (trending items)</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {retrainingStatus && (
              <div className={`p-4 rounded-lg ${retrainingStatus.status === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                <p className={`font-semibold ${retrainingStatus.status === 'success' ? 'text-green-800' : 'text-red-800'}`}>
                  {retrainingStatus.message}
                </p>
                {retrainingStatus.training_details && (
                  <div className="mt-2 text-sm text-gray-600">
                    <p>Silhouette Score: {retrainingStatus.training_details.silhouette_score?.toFixed(3)}</p>
                    <p>Number of Clusters: {retrainingStatus.training_details.n_clusters}</p>
                  </div>
                )}
              </div>
            )}

            {!trainingViz ? (
              <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-8 text-center">
                <p className="text-blue-900 font-bold text-xl mb-2">No Training Data Available</p>
                <p className="text-blue-700 mb-4">Train the ML models to visualize clustering performance and user behavior patterns</p>
                <div className="bg-white rounded-lg p-4 text-left max-w-md mx-auto mb-4">
                  <p className="text-sm text-gray-700 font-semibold mb-2">What you'll see after training:</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>Silhouette score analysis (cluster quality)</li>
                    <li>Elbow method visualization (optimal K selection)</li>
                    <li>Cluster size distribution charts</li>
                    <li>User behavior patterns across clusters</li>
                    <li>Product preference analysis by cluster</li>
                  </ul>
                </div>
                <button
                  onClick={handleRetrain}
                  disabled={loading}
                  className="bg-indigo-600 text-white px-8 py-4 rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-semibold text-lg shadow-lg"
                >
                  {loading ? 'Training Models...' : 'Train Models Now'}
                </button>
              </div>
            ) : (
              <>
                {/* Clustering Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-2">Optimal Clusters</h3>
                    <p className="text-4xl font-bold text-indigo-600">{trainingViz.optimal_k}</p>
                  </div>
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-2">Silhouette Score</h3>
                    <p className="text-4xl font-bold text-green-600">
                      {trainingViz.silhouette_scores[trainingViz.cluster_range.indexOf(trainingViz.optimal_k)]?.toFixed(3)}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">Range: -1 to 1 (higher is better)</p>
                  </div>
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-2">Total Users</h3>
                    <p className="text-4xl font-bold text-purple-600">
                      {trainingViz.cluster_sizes.reduce((a, b) => a + b, 0)}
                    </p>
                  </div>
                </div>

                {/* Hybrid Weights Visualization */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">Hybrid Recommender Weights</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    How different ML components contribute to final recommendations
                  </p>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Doughnut Chart */}
                    <div className="h-80 flex items-center justify-center">
                      <Doughnut
                        data={{
                          labels: [
                            'Collaborative Filtering (CF)',
                            'Content-Based Filtering (CBF)',
                            'Popularity Boost'
                          ],
                          datasets: [
                            {
                              data: [60, 40, 10],
                              backgroundColor: [
                                'rgba(59, 130, 246, 0.8)',   // Blue for CF
                                'rgba(139, 92, 246, 0.8)',   // Purple for CBF
                                'rgba(249, 115, 22, 0.8)',   // Orange for Popularity
                              ],
                              borderColor: [
                                'rgb(59, 130, 246)',
                                'rgb(139, 92, 246)',
                                'rgb(249, 115, 22)',
                              ],
                              borderWidth: 2,
                            }
                          ]
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: 'bottom',
                              labels: {
                                padding: 15,
                                font: {
                                  size: 12
                                }
                              }
                            },
                            tooltip: {
                              callbacks: {
                                label: function(context) {
                                  return `${context.label}: ${context.parsed}% weight`;
                                }
                              }
                            }
                          }
                        }}
                      />
                    </div>
                    
                    {/* Explanation Cards */}
                    <div className="space-y-4">
                      {/* CF Card */}
                      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-blue-900">
                            Collaborative Filtering
                          </h4>
                          <span className="text-2xl font-bold text-blue-600">60%</span>
                        </div>
                        <p className="text-sm text-blue-800">
                          Uses NMF (Non-negative Matrix Factorization) to find patterns in user purchase behavior. 
                          Recommends products that similar users have bought.
                        </p>
                      </div>
                      
                      {/* CBF Card */}
                      <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded-r-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-purple-900">
                            Content-Based Filtering
                          </h4>
                          <span className="text-2xl font-bold text-purple-600">40%</span>
                        </div>
                        <p className="text-sm text-purple-800">
                          Uses TF-IDF to analyze product descriptions, categories, and features. 
                          Recommends products similar to what the user has purchased before.
                        </p>
                      </div>
                      
                      {/* Popularity Card */}
                      <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-orange-900">
                            Popularity Boost
                          </h4>
                          <span className="text-2xl font-bold text-orange-600">10%</span>
                        </div>
                        <p className="text-sm text-orange-800">
                          Boosts trending items that many users are purchasing. 
                          Ensures popular products get visibility even for new users.
                        </p>
                      </div>
                      
                      {/* Formula */}
                      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 p-4 rounded-lg">
                        <p className="text-sm font-mono text-center text-indigo-900 font-semibold">
                          Final Score = (0.6 × CF) + (0.4 × CBF) + (0.1 × Popularity)
                        </p>
                        <p className="text-xs text-center text-indigo-700 mt-2">
                          Hybrid fusion combines all three approaches for best results
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Elbow Method Chart */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">Elbow Method - Silhouette Scores</h3>
                  <div className="h-80">
                    <Line
                      data={{
                        labels: trainingViz.cluster_range.map(k => `K=${k}`),
                        datasets: [
                          {
                            label: 'Silhouette Score',
                            data: trainingViz.silhouette_scores,
                            borderColor: 'rgb(59, 130, 246)',
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            fill: true,
                            tension: 0.4,
                            pointBackgroundColor: trainingViz.cluster_range.map(
                              (k, idx) => k === trainingViz.optimal_k ? 'rgb(34, 197, 94)' : 'rgb(59, 130, 246)'
                            ),
                            pointRadius: trainingViz.cluster_range.map(
                              (k) => k === trainingViz.optimal_k ? 8 : 5
                            ),
                            pointHoverRadius: 10,
                          }
                        ]
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'top',
                          },
                          title: {
                            display: true,
                            text: 'Higher silhouette score indicates better cluster separation'
                          },
                          tooltip: {
                            callbacks: {
                              label: function(context) {
                                const isOptimal = trainingViz.cluster_range[context.dataIndex] === trainingViz.optimal_k;
                                return `Score: ${context.parsed.y.toFixed(3)}${isOptimal ? ' (Optimal)' : ''}`;
                              }
                            }
                          }
                        },
                        scales: {
                          y: {
                            beginAtZero: false,
                            title: {
                              display: true,
                              text: 'Silhouette Score'
                            }
                          },
                          x: {
                            title: {
                              display: true,
                              text: 'Number of Clusters'
                            }
                          }
                        }
                      }}
                    />
                  </div>
                </div>

                {/* Inertia Chart */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">Elbow Method - Inertia (Within-Cluster Sum of Squares)</h3>
                  <div className="h-80">
                    <Line
                      data={{
                        labels: trainingViz.cluster_range.map(k => `K=${k}`),
                        datasets: [
                          {
                            label: 'Inertia',
                            data: trainingViz.inertia_scores,
                            borderColor: 'rgb(249, 115, 22)',
                            backgroundColor: 'rgba(249, 115, 22, 0.1)',
                            fill: true,
                            tension: 0.4,
                            pointBackgroundColor: trainingViz.cluster_range.map(
                              (k, idx) => k === trainingViz.optimal_k ? 'rgb(34, 197, 94)' : 'rgb(249, 115, 22)'
                            ),
                            pointRadius: trainingViz.cluster_range.map(
                              (k) => k === trainingViz.optimal_k ? 8 : 5
                            ),
                            pointHoverRadius: 10,
                          }
                        ]
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'top',
                          },
                          title: {
                            display: true,
                            text: 'Look for the "elbow" - where inertia decrease slows down'
                          },
                          tooltip: {
                            callbacks: {
                              label: function(context) {
                                const isOptimal = trainingViz.cluster_range[context.dataIndex] === trainingViz.optimal_k;
                                return `Inertia: ${context.parsed.y.toFixed(2)}${isOptimal ? ' (Optimal)' : ''}`;
                              }
                            }
                          }
                        },
                        scales: {
                          y: {
                            beginAtZero: false,
                            title: {
                              display: true,
                              text: 'Inertia (Lower is Better)'
                            }
                          },
                          x: {
                            title: {
                              display: true,
                              text: 'Number of Clusters'
                            }
                          }
                        }
                      }}
                    />
                  </div>
                </div>

                {/* Cluster Distribution */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Cluster Size Distribution - Doughnut Chart */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-4">Cluster Size Distribution</h3>
                    <div className="h-80 flex items-center justify-center">
                      <Doughnut
                        data={{
                          labels: trainingViz.cluster_sizes.map((_, idx) => `Cluster ${idx}`),
                          datasets: [
                            {
                              data: trainingViz.cluster_sizes,
                              backgroundColor: [
                                'rgba(59, 130, 246, 0.8)',
                                'rgba(16, 185, 129, 0.8)',
                                'rgba(249, 115, 22, 0.8)',
                                'rgba(139, 92, 246, 0.8)',
                                'rgba(236, 72, 153, 0.8)',
                                'rgba(245, 158, 11, 0.8)',
                                'rgba(20, 184, 166, 0.8)',
                                'rgba(239, 68, 68, 0.8)',
                              ],
                              borderColor: [
                                'rgb(59, 130, 246)',
                                'rgb(16, 185, 129)',
                                'rgb(249, 115, 22)',
                                'rgb(139, 92, 246)',
                                'rgb(236, 72, 153)',
                                'rgb(245, 158, 11)',
                                'rgb(20, 184, 166)',
                                'rgb(239, 68, 68)',
                              ],
                              borderWidth: 2,
                            }
                          ]
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: 'right',
                            },
                            tooltip: {
                              callbacks: {
                                label: function(context) {
                                  const total = trainingViz.cluster_sizes.reduce((a, b) => a + b, 0);
                                  const percentage = ((context.parsed / total) * 100).toFixed(1);
                                  return `${context.label}: ${context.parsed} users (${percentage}%)`;
                                }
                              }
                            }
                          }
                        }}
                      />
                    </div>
                  </div>

                  {/* Cluster Size Distribution - Bar Chart */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-4">Users per Cluster</h3>
                    <div className="h-80">
                      <Bar
                        data={{
                          labels: trainingViz.cluster_sizes.map((_, idx) => `Cluster ${idx}`),
                          datasets: [
                            {
                              label: 'Number of Users',
                              data: trainingViz.cluster_sizes,
                              backgroundColor: 'rgba(99, 102, 241, 0.8)',
                              borderColor: 'rgb(99, 102, 241)',
                              borderWidth: 2,
                            }
                          ]
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              display: false,
                            },
                            tooltip: {
                              callbacks: {
                                label: function(context) {
                                  const total = trainingViz.cluster_sizes.reduce((a, b) => a + b, 0);
                                  const percentage = ((context.parsed.y / total) * 100).toFixed(1);
                                  return `${context.parsed.y} users (${percentage}%)`;
                                }
                              }
                            }
                          },
                          scales: {
                            y: {
                              beginAtZero: true,
                              title: {
                                display: true,
                                text: 'Number of Users'
                              },
                              ticks: {
                                precision: 0
                              }
                            },
                            x: {
                              title: {
                                display: true,
                                text: 'Cluster ID'
                              }
                            }
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Cluster Centers */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Radar Chart */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-4">Cluster Characteristics - Top Products</h3>
                    <div className="h-96">
                      {trainingViz.feature_names && trainingViz.feature_names.length > 0 ? (
                        <Radar
                          data={{
                            labels: trainingViz.feature_names.map(name => 
                              name.length > 20 ? name.substring(0, 17) + '...' : name
                            ),
                            datasets: trainingViz.cluster_centers.map((center, idx) => ({
                              label: `Cluster ${idx} (${trainingViz.cluster_sizes[idx]} users)`,
                              data: center,
                              backgroundColor: [
                                'rgba(59, 130, 246, 0.2)',
                                'rgba(16, 185, 129, 0.2)',
                                'rgba(249, 115, 22, 0.2)',
                                'rgba(139, 92, 246, 0.2)',
                                'rgba(236, 72, 153, 0.2)',
                                'rgba(245, 158, 11, 0.2)',
                                'rgba(20, 184, 166, 0.2)',
                                'rgba(239, 68, 68, 0.2)',
                              ][idx % 8],
                              borderColor: [
                                'rgb(59, 130, 246)',
                                'rgb(16, 185, 129)',
                                'rgb(249, 115, 22)',
                                'rgb(139, 92, 246)',
                                'rgb(236, 72, 153)',
                                'rgb(245, 158, 11)',
                                'rgb(20, 184, 166)',
                                'rgb(239, 68, 68)',
                              ][idx % 8],
                              borderWidth: 2,
                            }))
                          }}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            scales: {
                              r: {
                                beginAtZero: true,
                                suggestedMin: 0,
                                suggestedMax: 1,
                                ticks: {
                                  stepSize: 0.2
                                }
                              }
                            },
                            plugins: {
                              legend: {
                                position: 'top',
                                labels: {
                                  boxWidth: 15,
                                  font: {
                                    size: 11
                                  }
                                }
                              },
                              tooltip: {
                                callbacks: {
                                  title: function(context) {
                                    return trainingViz.feature_names[context[0].dataIndex];
                                  },
                                  label: function(context) {
                                    return `${context.dataset.label}: ${context.parsed.r.toFixed(3)}`;
                                  }
                                }
                              }
                            }
                          }}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-500">
                          <p>No feature data available</p>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-4">
                      Shows purchase patterns for top {trainingViz.feature_names?.length || 0} most popular products. 
                      Higher values indicate stronger preference for that product in the cluster.
                    </p>
                  </div>

                  {/* Table */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-4">Cluster Centers - Top Product Preferences</h3>
                    <div className="overflow-x-auto max-h-96">
                      {trainingViz.feature_names && trainingViz.feature_names.length > 0 ? (
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50 sticky top-0">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase sticky left-0 bg-gray-50 z-10">
                                Cluster
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Size
                              </th>
                              {trainingViz.feature_names.map((name, idx) => (
                                <th key={idx} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">
                                  {name.length > 15 ? name.substring(0, 12) + '...' : name}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {trainingViz.cluster_centers.map((center, clusterIdx) => (
                              <tr key={clusterIdx} className={clusterIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-inherit">
                                  Cluster {clusterIdx}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                  {trainingViz.cluster_sizes[clusterIdx]} users
                                </td>
                                {center.map((value, featureIdx) => (
                                  <td key={featureIdx} className={`px-4 py-3 whitespace-nowrap text-sm font-medium ${
                                    value > 0.5 ? 'text-green-600 font-bold' : 
                                    value > 0.3 ? 'text-green-500' :
                                    value > 0.1 ? 'text-gray-700' : 
                                    'text-gray-400'
                                  }`}>
                                    {value.toFixed(3)}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <div className="flex items-center justify-center py-8 text-gray-500">
                          <p>No cluster data available</p>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-4">
                      Values represent normalized purchase intensity (0-1 scale). 
                      <span className="text-green-600 font-medium"> Green</span> = high preference, 
                      <span className="text-gray-400 font-medium"> Gray</span> = low preference.
                      Hover over column headers to see full product names.
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;