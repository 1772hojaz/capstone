import Layout from '../components/Layout';
import { Search, UserPlus, Download, TrendingUp, TrendingDown, MoreVertical, AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
// @ts-ignore
import apiService from '../services/api';

const UserManagement = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        const userData = await apiService.getAllUsers();
        setUsers(userData);
      } catch (err) {
        console.error('Failed to fetch users:', err);
        setError('Failed to load user data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Calculate stats from user data
  const totalUsers = users.length;
  const activeUsers = users.filter(user => user.status === 'active').length;
  const suspendedUsers = users.filter(user => user.status === 'suspended').length;
  const newUsersToday = users.filter(user => {
    const today = new Date();
    const userDate = new Date(user.created_at || user.date_joined);
    return userDate.toDateString() === today.toDateString();
  }).length;

  // Filter users based on search and filters
  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchTerm || 
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    return matchesSearch && matchesStatus && matchesRole;
  });

  return (
    <Layout title="User Management">
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading users...</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">Total Users</p>
                <TrendingUp className="w-4 h-4 text-gray-400" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{totalUsers}</p>
              <p className="text-xs text-green-600 mt-1">+15% this month</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">Active Users</p>
                <TrendingUp className="w-4 h-4 text-gray-400" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{activeUsers}</p>
              <p className="text-xs text-green-600 mt-1">+5% last week</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">New Users Today</p>
                <TrendingUp className="w-4 h-4 text-gray-400" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{newUsersToday}</p>
              <p className="text-xs text-green-600 mt-1">+2 users</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">Suspended Users</p>
                <TrendingDown className="w-4 h-4 text-gray-400" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{suspendedUsers}</p>
              <p className="text-xs text-red-600 mt-1">-1 since last month</p>
            </div>
          </div>

          {/* Filters and Actions */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Status: All</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="inactive">Inactive</option>
              </select>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Role: All</option>
                <option value="user">User</option>
                <option value="admin">Admin</option>
                <option value="moderator">Moderator</option>
              </select>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setRoleFilter('all');
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition"
              >
                Reset Filters
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition">
                <UserPlus className="w-4 h-4" />
                Add New User
              </button>
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition">
                <Download className="w-4 h-4" />
                Export Data
              </button>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-base font-semibold text-gray-900">User Accounts ({filteredUsers.length})</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input type="checkbox" className="rounded border-gray-300" />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Active</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <input type="checkbox" className="rounded border-gray-300" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                            {user.username.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm font-medium text-gray-900">{user.username}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">{user.email}</td>
                      <td className="px-6 py-4 text-sm text-gray-700 capitalize">{user.role}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${
                          user.status === 'active' ? 'bg-green-100 text-green-700' :
                          user.status === 'suspended' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                      </td>
                      <td className="px-6 py-4">
                        <button className="text-gray-400 hover:text-gray-600">
                          <MoreVertical className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-center gap-2">
              <button className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900">
                &lt; Previous
              </button>
              <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded">1</button>
              <button className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900">2</button>
              <button className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900">3</button>
              <button className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900">
                Next &gt;
              </button>
            </div>
          </div>
        </>
      )}
    </Layout>
  );
};

export default UserManagement;
