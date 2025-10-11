import { Search, MapPin, User, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

export default function GroupList() {
  const navigate = useNavigate();
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedJoinedGroup, setSelectedJoinedGroup] = useState<any>(null);
  const [isJoinedGroupModalOpen, setIsJoinedGroupModalOpen] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState<'USD' | 'ZIG'>('USD');

  const activeGroups = [
    {
      id: 1,
      name: 'Premium Coffee Beans (Brazil)',
      status: 'Active',
      progress: '8/10',
      dueDate: '2024-01-15',
      description: 'High-quality Brazilian coffee beans sourced from sustainable farms. Perfect for espresso and drip coffee.',
      price: '$45.00',
      members: 8,
      targetMembers: 10,
      savings: '$12.00 per member',
    },
    {
      id: 2,
      name: 'Smart LED Light Strips',
      status: 'Pending',
      progress: '5/20',
      dueDate: '2024-07-20',
      description: 'RGB LED light strips with smart home integration. Control via app or voice commands.',
      price: '$28.99',
      members: 5,
      targetMembers: 20,
      savings: '$8.00 per member',
    },
    {
      id: 3,
      name: 'High-Speed USB-C Hub',
      status: 'Completed',
      progress: '10/10',
      dueDate: '2024-07-01',
      description: 'Multi-port USB-C hub with HDMI, USB 3.0, and power delivery. Ideal for laptops and tablets.',
      price: '$35.00',
      members: 10,
      targetMembers: 10,
      savings: '$15.00 per member',
    },
    {
      id: 4,
      name: 'Organic Snack Variety Pack',
      status: 'Active',
      progress: '12/15',
      dueDate: '2024-01-18',
      description: 'Assorted organic snacks including nuts, dried fruits, and healthy bars. Perfect for office or home.',
      price: '$32.50',
      members: 12,
      targetMembers: 15,
      savings: '$10.50 per member',
    },
    {
      id: 5,
      name: 'Noise-Cancelling Headphones',
      status: 'Pending',
      progress: '1/25',
      dueDate: '2024-08-30',
      description: 'Premium wireless headphones with active noise cancellation and 30-hour battery life.',
      price: '$149.99',
      members: 1,
      targetMembers: 25,
      savings: '$50.00 per member',
    },
  ];

  const handleViewDetails = (group: any) => {
    setSelectedGroup(group);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedGroup(null);
  };

  const handleGroupIconClick = (group: any, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent navigation to chat
    setSelectedJoinedGroup(group);
    setIsJoinedGroupModalOpen(true);
  };

  const closeJoinedGroupModal = () => {
    setIsJoinedGroupModalOpen(false);
    setSelectedJoinedGroup(null);
  };

  const joinedGroups = [
    {
      id: 1,
      name: 'Premium Coffee Beans (Brazil)',
      description: 'Rich, Good morning. Nice. We are all in.',
      icon: '☕',
      hasNotification: true,
      unreadCount: 3,
    },
    {
      id: 2,
      name: 'Smart LED Light Strips',
      description: 'Alice Requested to check the delivery status.',
      icon: '💡',
      hasNotification: false,
      unreadCount: 0,
    },
    {
      id: 3,
      name: 'High-Speed USB-C Hub',
      description: 'Group Deal Completed! Your order has been.',
      icon: '🔌',
      hasNotification: false,
      unreadCount: 0,
    },
    {
      id: 4,
      name: 'Organic Snack Variety Pack',
      description: 'You! You invited a new friend, almost.',
      icon: '🍿',
      hasNotification: true,
      unreadCount: 7,
    },
    {
      id: 5,
      name: 'Noise-Cancelling Headphones',
      description: 'Admin: Unfortunately, this group buy did not.',
      icon: '🎧',
      hasNotification: false,
      unreadCount: 0,
    },
    {
      id: 6,
      name: 'Ergonomic Office Chair',
      description: 'New deal for a similar product has.',
      icon: '🪑',
      hasNotification: true,
      unreadCount: 12,
    },
    {
      id: 7,
      name: 'Gaming Mouse Pad XL',
      description: 'Awesome! 2x bigger! 4th creator has joined.',
      icon: '🖱️',
      hasNotification: false,
      unreadCount: 0,
    },
    {
      id: 8,
      name: 'Designer Succulent Planter',
      description: 'Botanic: The next delivery is reported by ord.',
      icon: '🌱',
      hasNotification: false,
      unreadCount: 0,
    },
    {
      id: 9,
      name: 'Resistance Band Set',
      description: 'FitnessGuru: Just used them, great quality!',
      icon: '🏋️',
      hasNotification: false,
      unreadCount: 0,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="px-3 sm:px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8">
          {/* Logo */}
          <button 
            onClick={() => navigate('/trader')}
            className="flex items-center gap-2 hover:opacity-80 transition flex-shrink-0"
          >
            <svg className="w-8 h-8 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
            <span className="text-xl font-semibold text-gray-800">ConnectSphere</span>
          </button>

          {/* Top Navigation */}
          <nav className="hidden md:flex items-center gap-6 flex-1">
            <button 
              onClick={() => navigate('/profile')}
              className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900"
            >
              <User className="w-4 h-4" />
              Profile
            </button>
            <button 
              onClick={() => navigate('/trader')}
              className="text-sm text-gray-700 hover:text-gray-900"
            >
              Recommended
            </button>
            <button 
              onClick={() => navigate('/groups')}
              className="text-sm font-medium text-blue-600"
            >
              My Groups
            </button>
            <button 
              onClick={() => navigate('/all-groups')}
              className="text-sm text-gray-700 hover:text-gray-900"
            >
              All Groups
            </button>
            <button 
              onClick={() => navigate('/create-group')}
              className="text-sm text-gray-700 hover:text-gray-900"
            >
              Create Group
            </button>
          </nav>

          {/* Right Side */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 flex-shrink-0">
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search groups..."
                className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent w-40 lg:w-48"
              />
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-700">
              <MapPin className="w-4 h-4" />
              <span>Harare</span>
            </div>
            <button 
              onClick={() => setSelectedCurrency('USD')}
              className={`px-3 sm:px-4 py-2 text-xs sm:text-sm rounded-lg transition whitespace-nowrap ${
                selectedCurrency === 'USD' 
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              USD
            </button>
            <button 
              onClick={() => setSelectedCurrency('ZIG')}
              className={`px-3 sm:px-4 py-2 text-xs sm:text-sm rounded-lg transition whitespace-nowrap ${
                selectedCurrency === 'ZIG' 
                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              ZIG
            </button>
            <button 
              onClick={() => navigate('/login')}
              className="px-3 sm:px-4 py-2 bg-red-500 text-white text-xs sm:text-sm rounded-lg hover:bg-red-600 transition whitespace-nowrap"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Tabs - Responsive */}
      <div className="bg-white border-b border-gray-200 sticky top-[73px] z-40">
        <div className="px-3 sm:px-6">
          <nav className="flex gap-4 sm:gap-8">
            <button
              onClick={() => navigate('/trader')}
              className="py-3 sm:py-4 text-sm font-medium border-b-2 border-transparent text-gray-600 hover:text-gray-900 transition whitespace-nowrap"
            >
              Recommended
            </button>
            <button
              onClick={() => navigate('/groups')}
              className="py-3 sm:py-4 text-sm font-medium border-b-2 border-blue-600 text-blue-600 transition whitespace-nowrap"
            >
              My Groups
            </button>
            <button
              onClick={() => navigate('/all-groups')}
              className="py-3 sm:py-4 text-sm font-medium border-b-2 border-transparent text-gray-600 hover:text-gray-900 transition whitespace-nowrap"
            >
              All Groups
            </button>
            <button
              onClick={() => navigate('/create-group')}
              className="py-3 sm:py-4 text-sm font-medium border-b-2 border-transparent text-gray-600 hover:text-gray-900 transition whitespace-nowrap"
            >
              Create Group
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content - Responsive */}
      <main className="flex-1 px-3 sm:px-6 py-4 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
          {/* Left Column - Your Group Activities */}
          <div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 max-h-[600px] overflow-y-auto overflow-x-hidden scrollable-container">
              <div className="p-4 sm:p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">My Active Groups</h2>
              </div>
              
              {/* My Active Groups - Responsive Table */}
              <div className="p-4 sm:p-6 border-b border-gray-200">
                <div>
                  <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200 sticky top-[73px] z-10">
                    <tr>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50">Group Name</th>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50">Status</th>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50">Progress</th>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50">Due Date</th>
                      <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {activeGroups.map((group) => (
                      <tr key={group.id} className="hover:bg-gray-50">
                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm text-gray-900">{group.name}</td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                          <span className={`inline-flex px-2 sm:px-2.5 py-0.5 sm:py-1 text-xs font-medium rounded-full ${
                            group.status === 'Active' ? 'bg-green-100 text-green-700' :
                            group.status === 'Completed' ? 'bg-blue-100 text-blue-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {group.status}
                          </span>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm text-gray-700">{group.progress}</td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm text-gray-700">{group.dueDate}</td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4">
                          <button 
                            onClick={() => handleViewDetails(group)}
                            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - My Joined Groups */}
          <div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 max-h-[600px] overflow-y-auto scrollable-container">
              <div className="p-4 sm:p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">My Joined Groups</h2>
              </div>
              <div className="p-4 sm:p-6 space-y-3">
                {joinedGroups.map((group) => (
                  <div 
                    key={group.id} 
                    onClick={() => navigate(`/group-chat/${group.id}`)}
                    className="bg-gray-50 rounded-lg border border-gray-200 p-4 hover:bg-gray-100 hover:shadow-sm transition flex items-start gap-4 cursor-pointer"
                  >
                    <div 
                      onClick={(e) => handleGroupIconClick(group, e)}
                      className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center flex-shrink-0 hover:from-blue-100 hover:to-blue-200 transition-all cursor-pointer"
                    >
                      <span className="text-2xl">{group.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-semibold text-gray-900">{group.name}</h3>
                        {group.hasNotification && group.unreadCount > 0 && (
                          <div className="bg-blue-600 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5 flex-shrink-0">
                            {group.unreadCount > 99 ? '99+' : group.unreadCount}
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mt-1 line-clamp-1">{group.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Past Groups - Full Width Below */}
        <div className="mt-4 sm:mt-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 sm:p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Past Groups</h3>
              <p className="text-sm text-gray-600 mt-1">Summary of your completed group buys.</p>
            </div>
            <div className="p-4 sm:p-6 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Completed Groups:</span>
                <span className="font-semibold text-gray-900">32</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Savings:</span>
                <span className="font-semibold text-gray-900">$1,250.00</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Success Rate:</span>
                <span className="font-semibold text-gray-900">92%</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="px-3 sm:px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0 text-sm text-gray-600">
          <div className="flex gap-4 sm:gap-6">
            <button className="hover:text-gray-900">Product</button>
            <button className="hover:text-gray-900">Resources</button>
            <button className="hover:text-gray-900">Company</button>
          </div>
          <div className="flex items-center gap-4">
            <button className="hover:text-gray-900">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </button>
            <button className="hover:text-gray-900">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
              </svg>
            </button>
            <button className="hover:text-gray-900">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z"/>
              </svg>
            </button>
            <button className="hover:text-gray-900">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </button>
          </div>
        </div>
      </footer>

      {/* Modal for Group Details */}
      {isModalOpen && selectedGroup && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={closeModal}
        >
          <div 
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900">{selectedGroup.name}</h2>
                <div className="mt-2">
                  <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${
                    selectedGroup.status === 'Active' ? 'bg-green-100 text-green-700' :
                    selectedGroup.status === 'Completed' ? 'bg-blue-100 text-blue-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {selectedGroup.status}
                  </span>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="ml-4 text-gray-400 hover:text-gray-600 transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Description */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                <p className="text-gray-700">{selectedGroup.description}</p>
              </div>

              {/* Group Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Price per Person</p>
                  <p className="text-xl font-bold text-gray-900">{selectedGroup.price}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Estimated Savings</p>
                  <p className="text-xl font-bold text-green-600">{selectedGroup.savings}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Progress</p>
                  <p className="text-xl font-bold text-gray-900">{selectedGroup.progress}</p>
                  <div className="mt-2 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${(selectedGroup.members / selectedGroup.targetMembers) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Due Date</p>
                  <p className="text-xl font-bold text-gray-900">{selectedGroup.dueDate}</p>
                </div>
              </div>

              {/* Members Info */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Group Members</h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-blue-800">Current Members</p>
                      <p className="text-2xl font-bold text-blue-900">{selectedGroup.members} / {selectedGroup.targetMembers}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-blue-800">Spots Remaining</p>
                      <p className="text-2xl font-bold text-blue-900">{selectedGroup.targetMembers - selectedGroup.members}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => navigate(`/group-chat/${selectedGroup.id}`)}
                  className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  Go to Group Chat
                </button>
                <button
                  onClick={closeModal}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal for Joined Group Icon Details */}
      {isJoinedGroupModalOpen && selectedJoinedGroup && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={closeJoinedGroupModal}
        >
          <div 
            className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Large Icon Display */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-12 flex items-center justify-center">
              <div className="w-32 h-32 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-8xl">{selectedJoinedGroup.icon}</span>
              </div>
            </div>

            {/* Group Details */}
            <div className="p-6 space-y-4">
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h2 className="text-xl font-bold text-gray-900">{selectedJoinedGroup.name}</h2>
                  {selectedJoinedGroup.hasNotification && selectedJoinedGroup.unreadCount > 0 && (
                    <div className="bg-blue-600 text-white text-sm font-bold rounded-full min-w-[24px] h-6 flex items-center justify-center px-2 flex-shrink-0">
                      {selectedJoinedGroup.unreadCount > 99 ? '99+' : selectedJoinedGroup.unreadCount}
                    </div>
                  )}
                </div>
                <p className="text-gray-600 text-sm">{selectedJoinedGroup.description}</p>
              </div>

              {/* Additional Info */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Group ID:</span>
                  <span className="font-semibold text-gray-900">#{selectedJoinedGroup.id}</span>
                </div>
                {selectedJoinedGroup.unreadCount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Unread Messages:</span>
                    <span className="font-semibold text-blue-600">{selectedJoinedGroup.unreadCount}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    closeJoinedGroupModal();
                    navigate(`/group-chat/${selectedJoinedGroup.id}`);
                  }}
                  className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  Open Group Chat
                </button>
                <button
                  onClick={closeJoinedGroupModal}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
