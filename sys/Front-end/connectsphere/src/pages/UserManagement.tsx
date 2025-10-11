import Layout from '../components/Layout';
import { Search, UserPlus, Filter, Download, TrendingUp, TrendingDown, MoreVertical } from 'lucide-react';

const UserManagement = () => {
  const users = [
    {
      id: 1,
      name: 'Aisha Sharma',
      email: 'aisha.sharma@example.com',
      role: 'Admin',
      status: 'Active',
      lastActive: '2 hours ago',
      avatar: 'AS',
    },
    {
      id: 2,
      name: 'Benjamin Lee',
      email: 'ben.lee@example.com',
      role: 'Editor',
      status: 'Active',
      lastActive: '1 day ago',
      avatar: 'BL',
    },
    {
      id: 3,
      name: 'Chloe Davis',
      email: 'chloe.d@example.com',
      role: 'User',
      status: 'Suspended',
      lastActive: '3 days ago',
      avatar: 'CD',
    },
    {
      id: 4,
      name: 'Daniel Kim',
      email: 'daniel.k@example.com',
      role: 'User',
      status: 'Active',
      lastActive: '5 minutes ago',
      avatar: 'DK',
    },
    {
      id: 5,
      name: 'Eva Garcia',
      email: 'eva.g@example.com',
      role: 'User',
      status: 'Active',
      lastActive: '1 week ago',
      avatar: 'EG',
    },
    {
      id: 6,
      name: 'Frank White',
      email: 'frank.w@example.com',
      role: 'User',
      status: 'Suspended',
      lastActive: '2 weeks ago',
      avatar: 'FW',
    },
    {
      id: 7,
      name: 'Grace Hall',
      email: 'grace.h@example.com',
      role: 'Editor',
      status: 'Active',
      lastActive: '1 hour ago',
      avatar: 'GH',
    },
    {
      id: 8,
      name: 'Henry Turner',
      email: 'henry.t@example.com',
      role: 'Admin',
      status: 'Active',
      lastActive: '1 month ago',
      avatar: 'HT',
    },
    {
      id: 9,
      name: 'Ivy Chun',
      email: 'ivy.c@example.com',
      role: 'User',
      status: 'Active',
      lastActive: '3 hours ago',
      avatar: 'IC',
    },
    {
      id: 10,
      name: 'Jack Black',
      email: 'jack.b@example.com',
      role: 'User',
      status: 'Pending',
      lastActive: '4 days ago',
      avatar: 'JB',
    },
  ];

  return (
    <Layout title="User Management">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Total Users</p>
            <TrendingUp className="w-4 h-4 text-gray-400" />
          </div>
          <p className="text-3xl font-bold text-gray-900">10</p>
          <p className="text-xs text-green-600 mt-1">+15% this month</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Active Users</p>
            <TrendingUp className="w-4 h-4 text-gray-400" />
          </div>
          <p className="text-3xl font-bold text-gray-900">7</p>
          <p className="text-xs text-green-600 mt-1">+5% last week</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">New Users Today</p>
            <TrendingUp className="w-4 h-4 text-gray-400" />
          </div>
          <p className="text-3xl font-bold text-gray-900">3</p>
          <p className="text-xs text-green-600 mt-1">+2 users</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Suspended Users</p>
            <TrendingDown className="w-4 h-4 text-gray-400" />
          </div>
          <p className="text-3xl font-bold text-gray-900">2</p>
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
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition">
            <Filter className="w-4 h-4" />
            Status: All
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition">
            <Filter className="w-4 h-4" />
            Role: All
          </button>
          <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition">
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
          <h3 className="text-base font-semibold text-gray-900">User Accounts</h3>
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
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <input type="checkbox" className="rounded border-gray-300" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                        {user.avatar}
                      </div>
                      <span className="text-sm font-medium text-gray-900">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">{user.email}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{user.role}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${
                      user.status === 'Active' ? 'bg-green-100 text-green-700' :
                      user.status === 'Suspended' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">{user.lastActive}</td>
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
    </Layout>
  );
};

export default UserManagement;
