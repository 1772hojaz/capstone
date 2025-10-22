import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  MapPin, 
  User, 
  X, 
  Eye, 
  Clock, 
  Users, 
  DollarSign, 
  AlertTriangle,
  Calendar,
  ArrowUpRight,
  ShoppingBag,
  ChevronRight,
  CheckCircle2,
  Loader2,
  HelpCircle,
  LifeBuoy,
  Phone,
  QrCode,
  LineChart,
  Package
} from 'lucide-react';

export default function GroupList() {
  const navigate = useNavigate();
  const [selectedCurrency, setSelectedCurrency] = useState<'USD' | 'ZIG'>('USD');
  const [showQRCode, setShowQRCode] = useState(false);
  const [selectedQRGroup, setSelectedQRGroup] = useState<any>(null);
  const [showGroupDetails, setShowGroupDetails] = useState(false);
  const [selectedGroupDetails, setSelectedGroupDetails] = useState<any>(null);

  const activeGroups = [
    {
      id: 1,
      name: 'Premium Coffee Beans (Brazil)',
      status: 'ready_for_pickup',
      progress: '10/10',
      dueDate: '2024-01-15',
      description: 'High-quality Brazilian coffee beans sourced from sustainable farms. Perfect for espresso and drip coffee.',
      price: '$45.00',
      members: 3,
      targetMembers: 10,
      savings: '$12.00 per member',
      pickupLocation: 'Harare Central Branch',
      orderStatus: 'Waiting for more participants'
    },
    {
      id: 2,
      name: 'Smart LED Light Strips',
      status: 'active',
      progress: '8/20',
      dueDate: '2024-07-20',
      description: 'RGB LED light strips with smart home integration. Control via app or voice commands.',
      price: '$28.99',
      members: 8,
      targetMembers: 20,
      savings: '$8.00 per member',
      pickupLocation: 'Harare Central Branch',
      orderStatus: 'Group active - more participants welcome'
    },
    {
      id: 3,
      name: 'High-Speed USB-C Hub',
      status: 'payment_pending',
      progress: '12/12',
      dueDate: '2024-07-01',
      description: 'Multi-port USB-C hub with HDMI, USB 3.0, and power delivery. Ideal for laptops and tablets.',
      price: '$35.00',
      members: 12,
      targetMembers: 12,
      savings: '$15.00 per member',
      pickupLocation: 'Harare Central Branch',
      orderStatus: 'Payment required - complete to proceed'
    },
    {
      id: 4,
      name: 'Organic Snack Variety Pack',
      status: 'processing',
      progress: '15/15',
      dueDate: '2024-01-18',
      description: 'Assorted organic snacks including nuts, dried fruits, and healthy bars. Perfect for office or home.',
      price: '$32.50',
      members: 15,
      targetMembers: 15,
      savings: '$10.50 per member',
      pickupLocation: 'Harare Central Branch',
      orderStatus: 'Order confirmed - being prepared'
    },
    {
      id: 5,
      name: 'Noise-Cancelling Headphones',
      status: 'ready_for_pickup',
      progress: '25/25',
      dueDate: '2024-08-30',
      description: 'Premium wireless headphones with active noise cancellation and 30-hour battery life.',
      price: '$149.99',
      members: 25,
      targetMembers: 25,
      savings: '$50.00 per member',
      pickupLocation: 'Harare Central Branch',
      orderStatus: 'Ready for pickup - show QR code at branch'
    },
    {
      id: 6,
      name: 'Solar Power Bank Bundle',
      status: 'ready_for_pickup',
      progress: '15/15',
      dueDate: '2024-08-25',
      description: 'High-capacity solar power banks with fast charging capability and multiple ports. Perfect for outdoor activities.',
      price: '$89.99',
      members: 15,
      targetMembers: 15,
      savings: '$30.00 per member',
      pickupLocation: 'Harare Central Branch',
      orderStatus: 'Ready for pickup - show QR code at branch'
    },
    {
      id: 7,
      name: 'Smart Home Security Kit',
      status: 'ready_for_pickup',
      progress: '20/20',
      dueDate: '2024-08-28',
      description: 'Complete home security system with cameras, sensors, and smart notifications. Easy DIY installation.',
      price: '$199.99',
      members: 20,
      targetMembers: 20,
      savings: '$45.00 per member',
      pickupLocation: 'Harare Central Branch',
      orderStatus: 'Ready for pickup - show QR code at branch'
    },
    {
      id: 8,
      name: 'Premium Yoga Set Collection',
      status: 'forming',
      progress: '5/25',
      dueDate: '2024-09-15',
      description: 'High-quality yoga mats, blocks, straps, and carrying bags. Perfect for both beginners and experienced practitioners.',
      price: '$75.00',
      members: 5,
      targetMembers: 25,
      savings: '$25.00 per member',
      pickupLocation: 'Harare Central Branch',
      orderStatus: 'Waiting for more participants'
    },
    {
      id: 9,
      name: 'Gourmet Spice Collection',
      status: 'active',
      progress: '12/30',
      dueDate: '2024-09-20',
      description: 'Premium spice collection from around the world, including rare and exotic varieties. Perfect for cooking enthusiasts.',
      price: '$65.00',
      members: 12,
      targetMembers: 30,
      savings: '$20.00 per member',
      pickupLocation: 'Harare Central Branch',
      orderStatus: 'Group active - more participants welcome'
    },
    {
      id: 10,
      name: 'Smart Watch Series X',
      status: 'payment_pending',
      progress: '18/18',
      dueDate: '2024-09-25',
      description: 'Latest smartwatch with health monitoring, GPS, and extended battery life. Compatible with all smartphones.',
      price: '$199.99',
      members: 18,
      targetMembers: 18,
      savings: '$50.00 per member',
      pickupLocation: 'Harare Central Branch',
      orderStatus: 'Payment required - complete to proceed'
    },
    {
      id: 11,
      name: 'Professional Camera Lens Kit',
      status: 'ready_for_pickup',
      progress: '12/12',
      dueDate: '2024-09-30',
      description: 'Professional-grade camera lenses including wide-angle, telephoto, and macro options. Compatible with major brands.',
      price: '$499.99',
      members: 12,
      targetMembers: 12,
      savings: '$100.00 per member',
      pickupLocation: 'Harare Central Branch',
      orderStatus: 'Ready for pickup - show QR code at branch'
    },
    {
      id: 12,
      name: 'Premium Kitchen Knife Set',
      status: 'processing',
      progress: '20/20',
      dueDate: '2024-10-05',
      description: 'Professional chef-quality knife set with Japanese steel. Includes knife block and sharpening tools.',
      price: '$299.99',
      members: 20,
      targetMembers: 20,
      savings: '$75.00 per member',
      pickupLocation: 'Harare Central Branch',
      orderStatus: 'Order confirmed - being prepared'
    },
    {
      id: 13,
      name: 'Outdoor Camping Package',
      status: 'forming',
      progress: '8/25',
      dueDate: '2024-10-10',
      description: '4-person tent, sleeping bags, camping stove, and essential outdoor gear. Perfect for family adventures.',
      price: '$249.99',
      members: 8,
      targetMembers: 25,
      savings: '$60.00 per member',
      pickupLocation: 'Harare Central Branch',
      orderStatus: 'Waiting for more participants'
    }
  ];

  const handleShowQRCode = (group: any) => {
    setSelectedQRGroup(group);
    setShowQRCode(true);
  };

  const handleViewGroupDetails = (group: any) => {
    setSelectedGroupDetails(group);
    setShowGroupDetails(true);
  };

  const closeQRCodeModal = () => {
    setShowQRCode(false);
    setSelectedQRGroup(null);
  };

  const closeGroupDetailsModal = () => {
    setShowGroupDetails(false);
    setSelectedGroupDetails(null);
  };

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
          </nav>
        </div>
      </div>

      {/* Main Content - Responsive */}
      <main className="flex-1 px-3 sm:px-6 py-6 sm:py-10">
        <div className="max-w-7xl mx-auto space-y-10">
          {/* Page Title */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">My Groups</h1>
            <div className="flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs sm:text-sm font-medium w-fit">
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Your Group Activity</span>
            </div>
          </div>
          
          {/* Two Column Layout for Ready for Collection and My Active Groups */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Ready for Collection Section */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 transition-all duration-300 hover:shadow-xl transform hover:-translate-y-1">
              <div className="p-6 sm:p-8 border-b border-gray-200 bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
                  <CheckCircle2 className="w-7 h-7 text-green-600" />
                  Ready for Collection
                </h2>
                <p className="text-sm text-gray-600 mt-2 ml-9">Groups that are ready for pickup at your selected location</p>
              </div>
              
              <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 300px)' }}>
                {activeGroups.filter(group => group.status === 'ready_for_pickup').length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-gray-400 mb-6 bg-gray-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto">
                      <ShoppingBag className="w-12 h-12" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">No groups ready for collection</h3>
                    <p className="text-gray-600 max-w-sm mx-auto">Groups will appear here when they're ready for pickup at your location</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-6">
                    {activeGroups.filter(group => group.status === 'ready_for_pickup').map((group) => (
                      <div key={group.id} className="bg-gradient-to-br from-green-50 via-emerald-50 to-blue-50 border border-green-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 group">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="p-2 bg-white rounded-lg shadow-sm">
                                <ShoppingBag className="w-5 h-5 text-green-600" />
                              </div>
                              <div>
                                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-green-700 transition-colors">{group.name}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700 border border-green-200">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    Ready for Pickup
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-6 mt-4">
                              <div className="bg-white p-4 rounded-lg shadow-sm">
                                <p className="text-sm text-gray-500 mb-1">Location</p>
                                <div className="flex items-center gap-2">
                                  <MapPin className="w-4 h-4 text-gray-600" />
                                  <p className="text-sm font-medium text-gray-900">{group.pickupLocation}</p>
                                </div>
                              </div>
                              <div className="bg-white p-4 rounded-lg shadow-sm">
                                <p className="text-sm text-gray-500 mb-1">Total Items</p>
                                <div className="flex items-center gap-2">
                                  <Package className="w-4 h-4 text-gray-600" />
                                  <p className="text-sm font-medium text-gray-900">3 items</p>
                                </div>
                              </div>
                              <div className="bg-white p-4 rounded-lg shadow-sm">
                                <p className="text-sm text-gray-500 mb-1">Price</p>
                                <div className="flex items-center gap-2">
                                  <DollarSign className="w-4 h-4 text-gray-600" />
                                  <p className="text-sm font-medium text-gray-900">{group.price}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-100">
                          <button 
                            onClick={() => handleShowQRCode(group)}
                            className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl hover:shadow-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-300 font-medium flex items-center justify-center gap-2"
                          >
                            <QrCode className="w-5 h-5" />
                            Show QR Code for Pickup
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* My Active Groups Section */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 transition-all duration-300 hover:shadow-xl transform hover:-translate-y-1">
              <div className="p-6 sm:p-8 border-b border-gray-200 sticky top-0 bg-gradient-to-r from-blue-50 via-indigo-50 to-violet-50 z-10 backdrop-blur-sm backdrop-filter">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="w-7 h-7 text-blue-600" />
                  </div>
                  My Active Groups
                </h2>
                <p className="text-sm text-gray-600 mt-3">Groups you've joined that are currently active</p>
              </div>
              
              {/* My Active Groups - Responsive Table */}
              <div className="p-6">
                <div className="rounded-xl border border-gray-200 overflow-hidden">
                  <div>
                    {/* Header - Fixed */}
                    <div className="sticky top-0 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                      <div className="grid grid-cols-12 gap-2 px-3 py-3">
                        <div className="col-span-3 text-xs font-semibold text-gray-600 uppercase">Group Name</div>
                        <div className="col-span-2 text-xs font-semibold text-gray-600 uppercase">Status</div>
                        <div className="col-span-3 text-xs font-semibold text-gray-600 uppercase">Progress</div>
                        <div className="col-span-2 text-xs font-semibold text-gray-600 uppercase">Due Date</div>
                        <div className="col-span-2 text-xs font-semibold text-gray-600 uppercase">Actions</div>
                      </div>
                    </div>
                    {/* Body - Scrollable */}
                    <div className="overflow-y-auto overflow-x-hidden" style={{ maxHeight: 'calc(100vh - 300px)' }}>
                      <div className="divide-y divide-gray-200">
                        {activeGroups.filter(group => group.status !== 'ready_for_pickup').map((group) => (
                          <div key={group.id} className="grid grid-cols-12 gap-2 px-3 py-4 hover:bg-gray-50 transition-colors duration-150">
                            <div className="col-span-3">
                              <div className="flex flex-col min-w-0">
                                <span className="font-medium text-gray-900 truncate">{group.name}</span>
                                <span className="text-xs text-gray-500 mt-1 truncate">{group.description}</span>
                              </div>
                            </div>
                            <div className="col-span-2">
                              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full items-center gap-1 ${
                                group.status === 'forming' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                                group.status === 'active' ? 'bg-green-100 text-green-700 border border-green-200' :
                                group.status === 'payment_pending' ? 'bg-yellow-100 text-yellow-700 border border-yellow-200' :
                                group.status === 'processing' ? 'bg-purple-100 text-purple-700 border border-purple-200' :
                                group.status === 'ready_for_pickup' ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                                group.status === 'completed' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                                'bg-red-100 text-red-700 border border-red-200'
                              }`}>
                                {group.status === 'forming' && <Users className="w-3 h-3" />}
                                {group.status === 'active' && <CheckCircle2 className="w-3 h-3" />}
                                {group.status === 'payment_pending' && <DollarSign className="w-3 h-3" />}
                                {group.status === 'processing' && <Loader2 className="w-3 h-3" />}
                                {group.status === 'ready_for_pickup' && <ShoppingBag className="w-3 h-3" />}
                                {group.status === 'completed' && <CheckCircle2 className="w-3 h-3" />}
                                {group.status === 'forming' ? 'Forming Group' :
                                 group.status === 'active' ? 'Active' :
                                 group.status === 'payment_pending' ? 'Payment Due' :
                                 group.status === 'processing' ? 'Processing' :
                                 group.status === 'ready_for_pickup' ? 'Ready for Pickup' :
                                 group.status === 'completed' ? 'Completed' :
                                 'Cancelled'}
                              </span>
                            </div>
                            <div className="col-span-3">
                              <div className="flex items-center">
                                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-blue-600 rounded-full transition-all duration-500"
                                    style={{ 
                                      width: `${(parseInt(group.progress.split('/')[0]) / parseInt(group.progress.split('/')[1])) * 100}%` 
                                    }}
                                  ></div>
                                </div>
                                <span className="ml-3 text-sm text-gray-600">{group.progress}</span>
                              </div>
                            </div>
                            <div className="col-span-2">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                <span className="text-sm text-gray-700">{group.dueDate}</span>
                              </div>
                            </div>
                            <div className="col-span-2">
                              <button
                                onClick={() => handleViewGroupDetails(group)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-all duration-200"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                Details
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Past Groups - Full Width Below */}

          {/* Past Groups - Full Width Below */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 transition-all duration-300 hover:shadow-xl">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Clock className="w-7 h-7 text-indigo-600" />
                    Past Groups
                  </h3>
                  <p className="text-sm text-gray-600 mt-2 ml-9">Summary of your completed admin-created group buys.</p>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-4 py-2">
                  <span className="text-xs text-gray-500 block">All Time Savings</span>
                  <span className="text-2xl font-bold text-green-600">$1,250.00</span>
                </div>
              </div>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Completed Groups</span>
                  <CheckCircle2 className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold text-gray-900">32</span>
                  <span className="text-sm text-gray-500 ml-2">groups</span>
                </div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 border border-green-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Success Rate</span>
                  <LineChart className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold text-gray-900">92</span>
                  <span className="text-sm text-gray-500 ml-2">%</span>
                </div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Avg. Savings/Group</span>
                  <DollarSign className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold text-gray-900">39</span>
                  <span className="text-sm text-gray-500 ml-2">USD</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="px-3 sm:px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0 text-sm text-gray-600">
          <div className="flex gap-4 sm:gap-6">
            <button className="hover:text-gray-900 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4" />
              <span>Help</span>
            </button>
            <button className="hover:text-gray-900 flex items-center gap-1.5">
              <LifeBuoy className="w-4 h-4" />
              <span>Support</span>
            </button>
            <button className="hover:text-gray-900 flex items-center gap-1.5">
              <Phone className="w-4 h-4" />
              <span>Contact</span>
            </button>
          </div>
          <div className="flex items-center gap-4">
          </div>
        </div>
      </footer>

      {/* QR Code Modal */}
      {showQRCode && selectedQRGroup && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-start sm:items-center justify-center z-50 p-4 overflow-auto"
          onClick={closeQRCodeModal}
        >
          <div 
            className="bg-white rounded-lg shadow-xl max-w-full sm:max-w-md w-full max-h-[calc(100vh-3.5rem)] sm:max-h-[calc(100vh-4rem)] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-green-600 to-green-700 p-6 text-white relative">
              <button
                onClick={closeQRCodeModal}
                className="absolute top-4 right-4 text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-1 transition"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="text-center">
                <h2 className="text-xl font-bold">Pickup QR Code</h2>
                <p className="text-green-100 mt-1">Show this at {selectedQRGroup.pickupLocation}</p>
              </div>
            </div>

            {/* QR Code Display */}
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 flex items-center justify-center">
                <div className="text-center">
                  {/* Placeholder QR Code - in real app this would be generated */}
                  <div className="w-40 h-40 sm:w-48 sm:h-48 md:w-56 md:h-56 bg-white border-2 border-gray-200 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <div className="text-center text-gray-400">
                      <div className="text-6xl mb-2">📱</div>
                      <div className="text-sm">QR Code</div>
                      <div className="text-xs mt-1">Order #{selectedQRGroup.id.toString().padStart(6, '0')}</div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">Scan this QR code at the pickup location</p>
                </div>
              </div>

              {/* Order Details */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">Order Details</h3>
                <div className="space-y-1 text-sm text-blue-800">
                  <div className="flex justify-between">
                    <span>Order #:</span>
                    <span className="font-mono">{selectedQRGroup.id.toString().padStart(6, '0')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Product:</span>
                    <span>{selectedQRGroup.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pickup Location:</span>
                    <span>{selectedQRGroup.pickupLocation}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className="text-green-600 font-medium">Ready for Pickup</span>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-900 mb-2">Pickup Instructions</h4>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>• Bring this QR code to {selectedQRGroup.pickupLocation}</li>
                  <li>• Show valid ID if requested</li>
                  <li>• Collect your order and verify contents</li>
                  <li>• Sign receipt upon pickup</li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={closeQRCodeModal}
                  className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition font-medium"
                >
                  Got it - Ready to Pickup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Group Details Modal */}
      {showGroupDetails && selectedGroupDetails && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-start sm:items-center justify-center z-50 p-4 overflow-auto"
          onClick={closeGroupDetailsModal}
        >
          <div 
            className="bg-white rounded-lg shadow-xl max-w-full sm:max-w-lg w-full max-h-[calc(100vh-3.5rem)] sm:max-h-[calc(100vh-4rem)] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white relative">
              <button
                onClick={closeGroupDetailsModal}
                className="absolute top-4 right-4 text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-1 transition"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="text-center">
                <h2 className="text-xl font-bold">Group Details</h2>
                <p className="text-blue-100 mt-1">Group #{selectedGroupDetails.id.toString().padStart(6, '0')}</p>
              </div>
            </div>

            {/* Group Details */}
            <div className="p-6 space-y-4">
              {/* Group Name and Status */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{selectedGroupDetails.name}</h3>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    selectedGroupDetails.status === 'forming' ? 'bg-blue-100 text-blue-700' :
                    selectedGroupDetails.status === 'active' ? 'bg-green-100 text-green-700' :
                    selectedGroupDetails.status === 'payment_pending' ? 'bg-yellow-100 text-yellow-700' :
                    selectedGroupDetails.status === 'processing' ? 'bg-purple-100 text-purple-700' :
                    selectedGroupDetails.status === 'ready_for_pickup' ? 'bg-orange-100 text-orange-700' :
                    selectedGroupDetails.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {selectedGroupDetails.status === 'forming' ? 'Forming Group' :
                     selectedGroupDetails.status === 'active' ? 'Active' :
                     selectedGroupDetails.status === 'payment_pending' ? 'Payment Due' :
                     selectedGroupDetails.status === 'processing' ? 'Processing' :
                     selectedGroupDetails.status === 'ready_for_pickup' ? 'Ready for Pickup' :
                     selectedGroupDetails.status === 'completed' ? 'Completed' :
                     'Cancelled'}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                <p className="text-sm text-gray-700">{selectedGroupDetails.description}</p>
              </div>

              {/* Group Information */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-1">Progress</h4>
                  <p className="text-sm text-blue-800">{selectedGroupDetails.progress}</p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-green-900 mb-1">Price</h4>
                  <p className="text-sm text-green-800">{selectedGroupDetails.price}</p>
                </    div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h4 className="font-semibold text-purple-900 mb-1">Due Date</h4>
                  <p className="text-sm text-purple-800">{selectedGroupDetails.dueDate}</p>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h4 className="font-semibold text-orange-900 mb-1">Savings</h4>
                  <p className="text-sm text-orange-800">{selectedGroupDetails.savings}</p>
                </div>
              </div>

              {/* Pickup Location */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-900 mb-2">Pickup Location</h4>
                <div className="flex items-center gap-2 text-sm text-yellow-800">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {selectedGroupDetails.pickupLocation}
                </div>
              </div>

              {/* Order Status */}
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <h4 className="font-semibold text-indigo-900 mb-2">Order Status</h4>
                <p className="text-sm text-indigo-800">{selectedGroupDetails.orderStatus}</p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={closeGroupDetailsModal}
                  className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  Close
                </button>
                {selectedGroupDetails.status === 'ready_for_pickup' && (
                  <button
                    onClick={() => {
                      closeGroupDetailsModal();
                      handleShowQRCode(selectedGroupDetails);
                    }}
                    className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition font-medium"
                  >
                    Show QR Code
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
