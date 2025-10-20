import { Search, MapPin, User, Users, ArrowLeft, Zap, Calendar, Tag, Clock } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useState } from 'react';

export default function GroupDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [selectedCurrency, setSelectedCurrency] = useState<'USD' | 'ZIG'>('USD');
  const [joiningGroup, setJoiningGroup] = useState(false);
  const [joinSuccess, setJoinSuccess] = useState<string | null>(null);

  // Mock group data - in real app, this would come from API based on the ID
  const groupData = {
    id: parseInt(id || '1'),
    name: 'Wireless Mechanical Keyboard',
    price: 89.99,
    originalPrice: 129.99,
    image: 'https://media.istockphoto.com/id/814423752/photo/eye-of-model-with-colorful-art-make-up-close-up.jpg?s=612x612&w=0&k=20&c=l15OdMWjgCKycMMShP8UK94ELVlEGvt7GmB_esHWPYE=',
    description: 'High-performance mechanical keyboard with customizable RGB backlighting and durable switches. Features premium Cherry MX switches, full aluminum frame, and programmable keys for ultimate gaming and productivity experience.',
    longDescription: 'This premium wireless mechanical keyboard combines cutting-edge technology with ergonomic design. The keyboard features Cherry MX Red switches for smooth, responsive typing, customizable RGB backlighting with 16.8 million colors, and a durable aluminum frame that can withstand heavy use. The wireless connectivity supports both 2.4GHz and Bluetooth 5.0, giving you the flexibility to connect to multiple devices. With a 70-hour battery life and fast charging capabilities, this keyboard is perfect for both office work and gaming sessions.',
    participants: 35,
    maxParticipants: 50,
    category: 'Electronics',
    created: '2024-01-10',
    endDate: '2024-02-10',
    matchScore: 95,
    reason: 'Based on your interest in tech accessories',
    adminCreated: true,
    adminName: 'TechDeals Admin',
    savings: 40.00,
    discountPercentage: 30,
    shippingInfo: 'Free shipping when group goal is reached',
    estimatedDelivery: '2-3 weeks after group completion',
    features: [
      'Cherry MX Red mechanical switches',
      'Customizable RGB backlighting',
      'Wireless connectivity (2.4GHz + Bluetooth)',
      '70-hour battery life',
      'Aluminum frame construction',
      'Programmable keys',
      'Windows/Mac compatible'
    ],
    requirements: [
      'Minimum 50 participants required',
      'Payment due upon group completion',
      'No refunds after group goal reached',
      'Shipping to supported countries only'
    ]
  };

  // Join group handler
  const handleJoinGroup = async () => {
    setJoiningGroup(true);
    try {
      // TODO: Replace with actual API call to join group
      await new Promise(resolve => setTimeout(resolve, 1000));

      setJoinSuccess(`Successfully joined "${groupData.name}"! Check My Groups to track progress.`);
      setTimeout(() => setJoinSuccess(null), 5000);
    } catch (error) {
      console.error('Failed to join group:', error);
      // TODO: Show error message
    } finally {
      setJoiningGroup(false);
    }
  };

  const progressPercentage = (groupData.participants / groupData.maxParticipants) * 100;
  const isGoalReached = groupData.participants >= groupData.maxParticipants;

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
              className="text-sm font-medium text-blue-600"
            >
              Recommended
            </button>
            <button
              onClick={() => navigate('/groups')}
              className="text-sm text-gray-700 hover:text-gray-900"
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

      {/* Back Button */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-3 sm:px-6 py-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to Groups</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 px-3 sm:px-6 py-6 sm:py-8">
        <div className="max-w-4xl mx-auto">
          {/* Success Message */}
          {joinSuccess && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
              <div className="text-green-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-green-800 font-medium">{joinSuccess}</p>
            </div>
          )}

          {/* Group Header */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
            <div className="md:flex">
              {/* Product Image */}
              <div className="md:w-1/2 h-64 md:h-auto bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-8">
                {groupData.image.startsWith('http') ? (
                  <img src={groupData.image} alt={groupData.name} className="max-h-full max-w-full object-contain" />
                ) : (
                  <span className="text-8xl">{groupData.image}</span>
                )}
              </div>

              {/* Product Info */}
              <div className="md:w-1/2 p-6 md:p-8">
                {/* Badges */}
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                    {groupData.category}
                  </span>
                  {groupData.matchScore && (
                    <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                      {groupData.matchScore}% Match
                    </span>
                  )}
                  <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
                    Admin Created
                  </span>
                </div>

                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">{groupData.name}</h1>

                {/* Price Section */}
                <div className="mb-4">
                  <div className="flex items-baseline gap-3 mb-1">
                    <span className="text-3xl font-bold text-blue-600">${groupData.price}</span>
                    <span className="text-lg text-gray-400 line-through">${groupData.originalPrice}</span>
                    <span className="text-lg font-semibold text-green-600">Save ${groupData.savings}</span>
                  </div>
                  <p className="text-sm text-gray-600">{groupData.discountPercentage}% off group buy price</p>
                </div>

                {/* Progress Section */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <Users className="w-4 h-4" />
                      <span>{groupData.participants} of {groupData.maxParticipants} joined</span>
                    </span>
                    <span className="text-sm text-gray-500">{Math.round(progressPercentage)}% complete</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden mb-2">
                    <div
                      className={`h-3 rounded-full transition-all duration-300 ${
                        isGoalReached ? 'bg-green-600' : 'bg-blue-600'
                      }`}
                      style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                    ></div>
                  </div>
                  {isGoalReached ? (
                    <p className="text-sm text-green-600 font-medium">🎉 Group goal reached! Processing orders...</p>
                  ) : (
                    <p className="text-sm text-gray-600">{groupData.maxParticipants - groupData.participants} more participants needed</p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={handleJoinGroup}
                    disabled={joiningGroup || isGoalReached}
                    className={`flex-1 px-6 py-3 text-sm font-semibold rounded-lg transition ${
                      joiningGroup
                        ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                        : isGoalReached
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {joiningGroup ? 'Joining...' : isGoalReached ? 'Group Completed' : 'Join Group Buy'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Information */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* Main Description */}
            <div className="md:col-span-2 space-y-6">
              {/* Description */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Description</h2>
                <p className="text-gray-700 leading-relaxed mb-4">{groupData.longDescription}</p>

                {/* Features */}
                <div className="mb-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Key Features</h3>
                  <ul className="space-y-2">
                    {groupData.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Requirements */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Group Requirements</h2>
                <ul className="space-y-3">
                  {groupData.requirements.map((requirement, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-medium text-blue-600">{index + 1}</span>
                      </div>
                      <span className="text-gray-700">{requirement}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Group Stats */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Group Information</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Created</p>
                      <p className="text-sm text-gray-600">{new Date(groupData.created).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Ends</p>
                      <p className="text-sm text-gray-600">{new Date(groupData.endDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Created by</p>
                      <p className="text-sm text-gray-600">{groupData.adminName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Tag className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Category</p>
                      <p className="text-sm text-gray-600">{groupData.category}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Shipping & Delivery */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Shipping & Delivery</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Shipping</p>
                      <p className="text-sm text-gray-600">{groupData.shippingInfo}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Estimated Delivery</p>
                      <p className="text-sm text-gray-600">{groupData.estimatedDelivery}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recommendation Reason */}
              {groupData.reason && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6">
                  <div className="flex items-start gap-3">
                    <Zap className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-semibold text-blue-900 mb-1">Why Recommended</h3>
                      <p className="text-sm text-blue-700">{groupData.reason}</p>
                    </div>
                  </div>
                </div>
              )}
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
    </div>
  );
}