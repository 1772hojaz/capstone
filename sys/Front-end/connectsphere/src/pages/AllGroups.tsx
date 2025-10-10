import { Search, MapPin, ShoppingCart, User, Users, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AllGroups() {
  const navigate = useNavigate();

  const allGroups = [
    {
      id: 1,
      name: 'Wireless Mechanical Keyboard',
      price: 89.99,
      image: '⌨️',
      description: 'High-performance mechanical keyboard with customizable RGB backlighting and durable switches.',
      participants: 35,
    },
    {
      id: 2,
      name: 'Smart Home Assistant Speaker',
      price: 49.99,
      image: '🔊',
      description: 'Voice-controlled smart speaker with premium sound and integrated AI assistant for home automation.',
      participants: 50,
    },
    {
      id: 3,
      name: 'Portable Espresso Maker',
      price: 34.50,
      image: '☕',
      description: 'Enjoy rich, creamy espresso anywhere with this compact and easy-to-use portable maker. Ideal for travel.',
      participants: 22,
    },
    {
      id: 4,
      name: 'Ergonomic Office Chair',
      price: 199.00,
      image: '🪑',
      description: 'Designed for ultimate comfort and support during long work hours. Features adjustable height and lumbar support.',
      participants: 15,
    },
    {
      id: 5,
      name: 'Premium Coffee Beans (Brazil)',
      price: 24.99,
      image: '☕',
      description: 'Rich, aromatic coffee beans sourced directly from Brazilian farms. Perfect for morning brewing.',
      participants: 8,
    },
    {
      id: 6,
      name: 'Smart LED Light Strips',
      price: 45.00,
      image: '💡',
      description: 'RGB LED strips with app control and voice assistant compatibility. Create the perfect ambiance.',
      participants: 27,
    },
    {
      id: 7,
      name: 'High-Speed USB-C Hub',
      price: 59.99,
      image: '🔌',
      description: 'Multi-port USB-C hub with 4K HDMI output, USB 3.0 ports, and SD card reader for maximum connectivity.',
      participants: 19,
    },
    {
      id: 8,
      name: 'Organic Snack Variety Pack',
      price: 32.50,
      image: '🍿',
      description: 'Assorted organic snacks including nuts, dried fruits, and healthy treats. Perfect for sharing.',
      participants: 42,
    },
    {
      id: 9,
      name: 'Noise-Cancelling Headphones',
      price: 149.99,
      image: '🎧',
      description: 'Premium over-ear headphones with active noise cancellation and 30-hour battery life.',
      participants: 31,
    },
    {
      id: 10,
      name: 'Gaming Mouse Pad XL',
      price: 29.99,
      image: '🖱️',
      description: 'Extra-large gaming mouse pad with smooth surface and anti-slip rubber base.',
      participants: 18,
    },
    {
      id: 11,
      name: 'Designer Succulent Planter',
      price: 39.00,
      image: '🌱',
      description: 'Modern ceramic planter set perfect for small succulents and desk decoration.',
      participants: 12,
    },
    {
      id: 12,
      name: 'Resistance Band Set',
      price: 24.99,
      image: '🏋️',
      description: 'Complete resistance band set with multiple strength levels for home workouts.',
      participants: 25,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
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
              className="text-sm text-gray-700 hover:text-gray-900"
            >
              My Groups
            </button>
            <button 
              onClick={() => navigate('/all-groups')}
              className="text-sm font-medium text-blue-600"
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
            <button className="px-3 sm:px-4 py-2 bg-blue-600 text-white text-xs sm:text-sm rounded-lg hover:bg-blue-700 transition flex items-center gap-2 whitespace-nowrap">
              <ShoppingCart className="w-4 h-4" />
              USD (3)
            </button>
            <button className="px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-700 hover:text-gray-900 whitespace-nowrap">
              ZIG (3)
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

      {/* ML System Status Banner - Clear feedback */}
      <div className="bg-blue-50 border-b border-blue-200 px-3 sm:px-6 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" aria-label="System status: healthy"></div>
            <Zap className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">ML Recommendation System Active</span>
          </div>
        </div>
        <button 
          className="text-sm text-blue-600 hover:text-blue-800 hover:underline transition"
          aria-label="View ML system details"
        >
          View Details
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-3 sm:px-6">
          <nav className="flex gap-4 sm:gap-8">
            <button
              onClick={() => navigate('/trader')}
              className="py-4 text-sm font-medium border-b-2 border-transparent text-gray-600 hover:text-gray-900 transition"
            >
              Recommended
            </button>
            <button
              onClick={() => navigate('/groups')}
              className="py-4 text-sm font-medium border-b-2 border-transparent text-gray-600 hover:text-gray-900 transition"
            >
              My Groups
            </button>
            <button
              onClick={() => navigate('/all-groups')}
              className="py-4 text-sm font-medium border-b-2 border-blue-600 text-blue-600 transition"
            >
              All Groups
            </button>
            <button 
              onClick={() => navigate('/create-group')}
              className="py-4 text-sm font-medium border-b-2 border-transparent text-gray-600 hover:text-gray-900 transition"
            >
              Create Group
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 px-3 sm:px-6 py-4 sm:py-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">All Available Groups</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {allGroups.map((group) => (
              <div key={group.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition">
                {/* Product Image */}
                <div className="h-48 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                  <span className="text-6xl">{group.image}</span>
                </div>

                {/* Product Info */}
                <div className="p-4">
                  <h3 className="text-base font-semibold text-gray-900 mb-2 line-clamp-1">{group.name}</h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{group.description}</p>

                  <div className="flex items-center justify-between mb-3">
                    <span className="text-lg font-bold text-gray-900">${group.price}</span>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Users className="w-4 h-4" />
                      <span>{group.participants}</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => navigate(`/group-chat/${group.id}`)}
                    className="w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
                  >
                    Join Group
                  </button>
                </div>
              </div>
            ))}
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
