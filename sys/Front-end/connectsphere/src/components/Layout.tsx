import type { ReactNode } from 'react';
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Bell, Menu, X, LogOut } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
  title?: string;
}

const Layout = ({ children, title = 'Dashboard' }: LayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex justify-between items-center max-w-7xl mx-auto">
            {/* Logo */}
            <button 
              onClick={() => navigate('/admin')}
              className="flex items-center gap-2 sm:gap-3 hover:scale-105 transition-transform duration-200 flex-shrink-0"
            >
              <div className="relative">
                <svg className="w-7 h-7 sm:w-8 sm:h-8 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
              <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                ConnectSphere
              </span>
            </button>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-3">
              <nav className="flex gap-1 bg-gray-100 rounded-lg p-1">
                <button 
                  onClick={() => navigate('/admin')}
                  className={`px-3 xl:px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 whitespace-nowrap ${
                    location.pathname === '/admin' 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  Dashboard
                </button>
                <button 
                  onClick={() => navigate('/users')}
                  className={`px-3 xl:px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 whitespace-nowrap ${
                    location.pathname === '/users' 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  Users
                </button>
                <button 
                  onClick={() => navigate('/moderation')}
                  className={`px-3 xl:px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 whitespace-nowrap ${
                    location.pathname === '/moderation' 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  Moderation
                </button>
                <button 
                  onClick={() => navigate('/products')}
                  className={`px-3 xl:px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 whitespace-nowrap ${
                    location.pathname === '/products' 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  Products
                </button>
                <button 
                  onClick={() => navigate('/settings')}
                  className={`px-3 xl:px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 whitespace-nowrap ${
                    location.pathname === '/settings' 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  Settings
                </button>
              </nav>

              {/* Desktop Actions */}
              <div className="flex items-center gap-2">
                {/* Search */}
                <div className="relative hidden xl:block">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search..."
                    className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none w-40 transition-all duration-200"
                  />
                </div>

                {/* Notifications */}
                <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>

                {/* User & Logout */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate('/login')}
                    className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white text-sm font-medium rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="hidden xl:inline">Logout</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Mobile Right Side */}
            <div className="flex lg:hidden items-center gap-2">
              {/* Mobile Notifications */}
              <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden mt-4 pb-4 border-t border-gray-200 pt-4">
              <nav className="flex flex-col gap-2">
                <button 
                  onClick={() => {
                    navigate('/admin');
                    setMobileMenuOpen(false);
                  }}
                  className={`px-4 py-3 text-left text-sm font-medium rounded-lg transition-all duration-200 ${
                    location.pathname === '/admin' 
                      ? 'bg-blue-50 text-blue-600' 
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Dashboard
                </button>
                <button 
                  onClick={() => {
                    navigate('/users');
                    setMobileMenuOpen(false);
                  }}
                  className={`px-4 py-3 text-left text-sm font-medium rounded-lg transition-all duration-200 ${
                    location.pathname === '/users' 
                      ? 'bg-blue-50 text-blue-600' 
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Users
                </button>
                <button 
                  onClick={() => {
                    navigate('/moderation');
                    setMobileMenuOpen(false);
                  }}
                  className={`px-4 py-3 text-left text-sm font-medium rounded-lg transition-all duration-200 ${
                    location.pathname === '/moderation' 
                      ? 'bg-blue-50 text-blue-600' 
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Moderation
                </button>
                <button 
                  onClick={() => {
                    navigate('/products');
                    setMobileMenuOpen(false);
                  }}
                  className={`px-4 py-3 text-left text-sm font-medium rounded-lg transition-all duration-200 ${
                    location.pathname === '/products' 
                      ? 'bg-blue-50 text-blue-600' 
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Products
                </button>
                <button 
                  onClick={() => {
                    navigate('/settings');
                    setMobileMenuOpen(false);
                  }}
                  className={`px-4 py-3 text-left text-sm font-medium rounded-lg transition-all duration-200 ${
                    location.pathname === '/settings' 
                      ? 'bg-blue-50 text-blue-600' 
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Settings
                </button>
                
                {/* Mobile Logout */}
                <button
                  onClick={() => {
                    navigate('/login');
                    setMobileMenuOpen(false);
                  }}
                  className="mt-4 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white text-sm font-medium rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-sm"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto w-full">
        <div className="mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            {title}
          </h1>
          <div className="h-1 w-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full mt-2"></div>
        </div>
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="px-6 py-4 flex flex-col sm:flex-row justify-between items-center text-sm text-gray-600 max-w-7xl mx-auto gap-4">
          <div className="flex gap-6">
            <button className="hover:text-blue-600 transition-colors duration-200">System Status</button>
            <button className="hover:text-blue-600 transition-colors duration-200">Activity Logs</button>
            <button className="hover:text-blue-600 transition-colors duration-200">Help Center</button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Powered by</span>
            <span className="font-semibold text-blue-600">ConnectSphere</span>
            <span className="text-gray-400">•</span>
            <span className="text-gray-500">© 2025</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
