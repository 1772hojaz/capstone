import Layout from '../components/Layout';
import { Search, Shield, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

const GroupModeration = () => {
  const pendingGroups = [
    {
      id: 1,
      name: 'Premium Watches Collective',
      creator: 'John Smith',
      category: 'Accessories',
      members: 0,
      created: '2024-01-15',
      description: 'A group for watch enthusiasts looking for premium timepieces at discounted prices.',
      flags: [],
    },
    {
      id: 2,
      name: 'Organic Food Co-op',
      creator: 'Sarah Johnson',
      category: 'Food',
      members: 5,
      created: '2024-01-14',
      description: 'Bulk buying organic produce and groceries from local farms.',
      flags: ['Needs verification'],
    },
    {
      id: 3,
      name: 'Gaming Gear Hub',
      creator: 'Mike Davis',
      category: 'Gaming',
      members: 12,
      created: '2024-01-13',
      description: 'Group buying for gaming peripherals, consoles, and accessories.',
      flags: [],
    },
  ];

  const reportedContent = [
    {
      id: 1,
      group: 'Tech Gadgets Collective',
      reporter: 'User#4521',
      reason: 'Spam content',
      date: '2024-01-15',
      severity: 'Medium',
    },
    {
      id: 2,
      group: 'Fashion Forward',
      reporter: 'User#7832',
      reason: 'Inappropriate listing',
      date: '2024-01-14',
      severity: 'High',
    },
  ];

  return (
    <Layout title="Group Moderation" user="Admin User">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-6 h-6 text-blue-600" />
          <p className="text-gray-600">Oversee and moderate group-buy listings, ensuring compliance and quality.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">Pending Review</p>
          <p className="text-2xl font-bold text-yellow-600">{pendingGroups.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">Reported Content</p>
          <p className="text-2xl font-bold text-red-600">{reportedContent.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">Approved Today</p>
          <p className="text-2xl font-bold text-green-600">8</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">Rejected Today</p>
          <p className="text-2xl font-bold text-gray-600">2</p>
        </div>
      </div>

      {/* Pending Groups */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Pending Group Approvals</h3>
        </div>
        <div className="p-6 space-y-4">
          {pendingGroups.map((group) => (
            <div key={group.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="text-base font-semibold text-gray-900">{group.name}</h4>
                    {group.flags.length > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">
                        <AlertTriangle className="w-3 h-3" />
                        {group.flags[0]}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{group.description}</p>
                  <div className="flex gap-4 text-xs text-gray-500">
                    <span>Creator: <span className="font-medium">{group.creator}</span></span>
                    <span>Category: <span className="font-medium">{group.category}</span></span>
                    <span>Members: <span className="font-medium">{group.members}</span></span>
                    <span>Created: <span className="font-medium">{group.created}</span></span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition">
                  <CheckCircle className="w-4 h-4" />
                  Approve
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition">
                  <XCircle className="w-4 h-4" />
                  Reject
                </button>
                <button className="px-4 py-2 border border-gray-300 text-sm rounded-lg hover:bg-gray-50 transition">
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reported Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Reported Content</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search reports..."
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Group Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reporter</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Severity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {reportedContent.map((report) => (
                <tr key={report.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{report.group}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{report.reporter}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{report.reason}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{report.date}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      report.severity === 'High' ? 'bg-red-100 text-red-800' :
                      report.severity === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {report.severity}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <button className="text-blue-600 hover:text-blue-800 font-medium mr-3">Investigate</button>
                    <button className="text-gray-600 hover:text-gray-800 font-medium">Dismiss</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
};

export default GroupModeration;
