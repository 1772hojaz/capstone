import { Search, MapPin, User, Zap, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

const TraderDashboard = () => {
  const navigate = useNavigate();
  const activeTab = 'recommended';
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState<'USD' | 'ZIG'>('USD');

  const recommendations = [
    {
      id: 1,
      name: 'Wireless Mechanical Keyboard',
      price: 89.99,
      image: 'https://media.istockphoto.com/id/814423752/photo/eye-of-model-with-colorful-art-make-up-close-up.jpg?s=612x612&w=0&k=20&c=l15OdMWjgCKycMMShP8UK94ELVlEGvt7GmB_esHWPYE=',
      description: 'High-performance mechanical keyboard with customizable RGB backlighting and durable switches.',
      participants: 35,
      reason: 'Based on your interest in tech accessories',
      matchScore: 95,
    },
    {
      id: 2,
      name: 'Smart Home Assistant Speaker',
      price: 49.99,
      image: 'https://media.istockphoto.com/id/814423752/photo/eye-of-model-with-colorful-art-make-up-close-up.jpg?s=612x612&w=0&k=20&c=l15OdMWjgCKycMMShP8UK94ELVlEGvt7GmB_esHWPYE=',
      description: 'Voice-controlled smart speaker with premium sound and integrated AI assistant for home automation.',
      participants: 50,
      reason: 'Popular in Harare · Trending now',
      matchScore: 88,
    },
    {
      id: 3,
      name: 'Portable Espresso Maker',
      price: 34.50,
      image: 'https://media.istockphoto.com/id/814423752/photo/eye-of-model-with-colorful-art-make-up-close-up.jpg?s=612x612&w=0&k=20&c=l15OdMWjgCKycMMShP8UK94ELVlEGvt7GmB_esHWPYE=',
      description: 'Enjoy rich, creamy espresso anywhere with this compact and easy-to-use portable maker. Ideal for travel.',
      participants: 22,
      reason: 'Similar to items you viewed',
      matchScore: 82,
    },
    {
      id: 4,
      name: 'Ergonomic Office Chair',
      price: 199.00,
      image: 'https://media.istockphoto.com/id/814423752/photo/eye-of-model-with-colorful-art-make-up-close-up.jpg?s=612x612&w=0&k=20&c=l15OdMWjgCKycMMShP8UK94ELVlEGvt7GmB_esHWPYE=',
      description: 'Designed for ultimate comfort and support during long work hours. Features adjustable height and lumbar support.',
      participants: 15,
      reason: 'Matches your search history',
      matchScore: 90,
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
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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

      {/* Tabs - Clear visual hierarchy and state */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-[73px] z-40">
        <div className="px-3 sm:px-6">
          <nav className="flex gap-4 sm:gap-8" role="tablist" aria-label="Content sections">
            <button
              onClick={() => navigate('/trader')}
              role="tab"
              aria-selected="true"
              aria-controls="recommended-panel"
              className="py-4 text-sm font-semibold border-b-2 border-blue-600 text-blue-600 transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Recommended
            </button>
            <button
              onClick={() => navigate('/groups')}
              role="tab"
              aria-selected="false"
              className="py-4 text-sm font-medium border-b-2 border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300 transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              My Groups
            </button>
            <button
              onClick={() => navigate('/all-groups')}
              role="tab"
              aria-selected="false"
              className="py-4 text-sm font-medium border-b-2 border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300 transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              All Groups
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content - Responsive padding */}
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Clear, prominent heading - Responsive */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">Recommended For You</h1>
            <div className="flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs sm:text-sm font-medium w-fit">
              <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>AI Powered</span>
            </div>
          </div>
          <p className="text-sm sm:text-base text-gray-600">Personalized group buys created by admins based on your interests and activity · Save up to 40%</p>
        </div>

        {/* Product Grid - Visual hierarchy with better spacing */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {recommendations.map((product) => (
            <div 
              key={product.id} 
              className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg hover:border-blue-300 transition-all duration-200 group"
              role="article"
              aria-label={`${product.name} group buy`}
            >
              {/* Product Image with better visual appeal */}
              <div className="h-48 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center relative overflow-hidden">
                {product.image.startsWith('http') ? (
                  <img 
                    src={product.image} 
                    alt={product.name} 
                    className="h-32 object-contain group-hover:scale-110 transition-transform duration-200" 
                  />
                ) : (
                  <span className="text-6xl group-hover:scale-110 transition-transform duration-200">{product.image}</span>
                )}
                {/* Discount badge for visual appeal */}
                <div className="absolute top-3 right-3 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-sm">
                  Save 30%
                </div>
                {/* Match score badge */}
                <div className="absolute top-3 left-3 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-sm">
                  {product.matchScore}% Match
                </div>
              </div>

              {/* Product Info - Clear hierarchy */}
              <div className="p-5">
                {/* Recommendation reason - Clear explanation */}
                <div className="flex items-center gap-1.5 mb-2">
                  <Zap className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                  <p className="text-xs text-blue-600 font-medium">{product.reason}</p>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 min-h-[3.5rem]">{product.name}</h3>
                
                {/* Price with visual emphasis */}
                <div className="mb-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-blue-600">${product.price}</span>
                    <span className="text-sm text-gray-400 line-through">${(product.price / 0.7).toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-green-600 font-medium">Group Buy Price</p>
                </div>
                
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{product.description}</p>
                
                {/* Progress indicator - Clear feedback */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="flex items-center gap-1 text-gray-700">
                      <Users className="w-4 h-4" />
                      <span className="font-medium">{product.participants} joined</span>
                    </span>
                    <span className="text-gray-500">50 needed</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(product.participants / 50) * 100}%` }}
                      role="progressbar"
                      aria-valuenow={product.participants}
                      aria-valuemin={0}
                      aria-valuemax={50}
                    ></div>
                  </div>
                </div>

                {/* Clear call-to-action */}
                <button 
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 active:bg-blue-800 transition-colors duration-150 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm"
                  aria-label={`Join ${product.name} group buy`}
                >
                  Join Group Buy
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* How Group Buying Works - Educational, clear explanation - Responsive */}
        <div className="bg-gradient-to-br from-white to-blue-50 rounded-xl shadow-sm border border-blue-200 p-4 sm:p-6 lg:p-8">
          <div className="flex flex-col sm:flex-row items-start gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-xl">💡</span>
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">How Group Buying Works</h2>
              <p className="text-sm text-gray-600">Save money by buying together with others</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6">
            {/* Step 1 */}
            <div className="text-center p-3 sm:p-4 bg-white rounded-lg sm:bg-transparent">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl sm:text-3xl">👥</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">1. Browse Admin-Created Groups</h3>
              <p className="text-xs sm:text-sm text-gray-600">Browse deals and join groups created by admins for products you want</p>
            </div>
            
            {/* Step 2 */}
            <div className="text-center p-3 sm:p-4 bg-white rounded-lg sm:bg-transparent">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl sm:text-3xl">⏱️</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">2. Wait for Goal</h3>
              <p className="text-xs sm:text-sm text-gray-600">More people join, bigger the discount gets</p>
            </div>
            
            {/* Step 3 */}
            <div className="text-center p-3 sm:p-4 bg-white rounded-lg sm:bg-transparent">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-2xl sm:text-3xl">🎉</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base">3. Deal Unlocked</h3>
              <p className="text-xs sm:text-sm text-gray-600">Everyone gets the discounted price and product ships</p>
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-3 sm:p-4 border border-blue-200">
            <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
              <strong className="text-gray-900">💰 Example:</strong> A $100 item can drop to $70 when 50 people join. 
              The more participants, the lower the price for everyone! <strong className="text-blue-600">No risk</strong> - 
              you only pay if the group reaches its goal.
            </p>
          </div>
        </div>
      </main>

      {/* Footer - Responsive */}
      <footer className="bg-white border-t border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 md:gap-6">
            {/* Navigation links */}
            <nav className="flex flex-wrap justify-center gap-4 sm:gap-6" aria-label="Footer navigation">
              <button className="text-sm text-gray-600 hover:text-gray-900 transition">About</button>
              <button className="text-sm text-gray-600 hover:text-gray-900 transition">Help Center</button>
              <button className="text-sm text-gray-600 hover:text-gray-900 transition">Terms</button>
              <button className="text-sm text-gray-600 hover:text-gray-900 transition">Privacy</button>
            </nav>
            
            {/* Social media - accessible labels */}
            <div className="flex items-center gap-4" role="navigation" aria-label="Social media links">
              <button className="text-gray-600 hover:text-blue-600 transition p-2 hover:bg-gray-100 rounded" aria-label="Facebook">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </button>
              <button className="text-gray-600 hover:text-blue-400 transition p-2 hover:bg-gray-100 rounded" aria-label="Twitter">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
              </button>
              <button className="text-gray-600 hover:text-pink-600 transition p-2 hover:bg-gray-100 rounded" aria-label="Instagram">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z"/>
                </svg>
              </button>
              <button className="text-gray-600 hover:text-blue-700 transition p-2 hover:bg-gray-100 rounded" aria-label="LinkedIn">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </button>
            </div>
            
            {/* Copyright */}
            <div className="text-sm text-gray-500">
              © 2025 ConnectSphere. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default TraderDashboard;
