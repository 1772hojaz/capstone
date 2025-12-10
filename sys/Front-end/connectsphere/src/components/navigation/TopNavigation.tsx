import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Home, Users, Package, Settings, BarChart3, ShoppingCart, Shield, QrCode, Brain, LogOut } from 'lucide-react';
import UserMenu from './UserMenu';
import apiService from '../../services/api';

interface TopNavigationProps {
  userRole?: 'admin' | 'supplier' | 'trader';
}

interface User {
  id: number;
  full_name: string;
  email: string;
  is_admin: boolean;
  is_supplier: boolean;
  location_zone?: string;
}

const TopNavigation = ({ userRole }: TopNavigationProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch current user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const userData = await apiService.getCurrentUser();
          setUser(userData);
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  // Determine user role
  const role = userRole || (user?.is_admin ? 'admin' : user?.is_supplier ? 'supplier' : 'trader');


  // Navigation items based on role
  const getNavigationItems = () => {
    if (role === 'admin') {
      return [
        { label: 'Dashboard', path: '/admin', icon: Home },
        { label: 'Users', path: '/users', icon: Users },
        { label: 'Moderation', path: '/moderation', icon: Shield },
        { label: 'ML Analytics', path: '/admin/ml-analytics', icon: Brain },
        { label: 'QR Scanner', path: '/admin/qr-scanner', icon: QrCode },
        { label: 'Settings', path: '/settings', icon: Settings },
      ];
    }

    if (role === 'supplier') {
      return [
        { label: 'Dashboard', path: '/supplier/dashboard', icon: Home },
      ];
    }

    // Trader (default)
    return [
      { label: 'Home', path: '/trader', icon: Home },
      { label: 'Browse Groups', path: '/all-groups', icon: ShoppingCart },
      { label: 'My Groups', path: '/groups', icon: Package },
    ];
  };

  const navigationItems = getNavigationItems();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white shadow-sm">
      <div className="max-w-content mx-auto px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link 
            to={role === 'admin' ? '/admin' : role === 'supplier' ? '/supplier/dashboard' : '/trader'} 
            className="flex items-center gap-2 transition-transform hover:scale-105 active:scale-95"
          >
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-md">
              <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <span className="text-xl font-bold text-gray-900 hidden sm:block">ConnectSphere</span>
            <span className="text-lg font-bold text-gray-900 sm:hidden">CS</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors relative ${
                    active
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Menu & Mobile Toggle */}
          <div className="flex items-center gap-2">
            {/* User Menu (Desktop) */}
            {!loading && user && (
              <div className="hidden md:block">
                <UserMenu user={user} role={role} />
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`md:hidden inline-flex items-center justify-center h-10 w-10 rounded-xl transition-all touch-manipulation ${
                isMenuOpen
                  ? 'bg-primary-500 text-white shadow-md'
                  : 'text-gray-600 hover:bg-gray-100 active:bg-gray-200'
              }`}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-gradient-to-b from-white to-gray-50">
          {/* User Info (Mobile) - At Top */}
          {user && (
            <Link
              to={role === 'supplier' ? '/supplier/profile' : '/profile'}
              onClick={() => setIsMenuOpen(false)}
              className="block px-4 py-4 bg-white border-b border-gray-200 hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation"
            >
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-md">
                  <span className="text-lg font-bold text-white">
                    {user.full_name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-base font-semibold text-gray-900 truncate">{user.full_name}</p>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-700 capitalize">
                      {role}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 truncate">{user.email}</p>
                  {user.location_zone && (
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {user.location_zone}
                    </p>
                  )}
                </div>
                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          )}

          {/* Navigation Links */}
          <nav className="px-3 py-3 space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-base font-medium transition-all touch-manipulation relative ${
                    active
                      ? 'bg-primary-500 text-white shadow-md'
                      : 'text-gray-700 hover:text-gray-900 hover:bg-white active:bg-gray-100'
                  }`}
                >
                  <Icon className={`h-5 w-5 ${active ? 'text-white' : 'text-gray-500'}`} />
                  <span className="flex-1">{item.label}</span>
                  {active && (
                    <svg className="ml-auto h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </Link>
              );
            })}
            
            {/* Logout Button (Mobile) */}
            <button
              onClick={() => {
                localStorage.removeItem('token');
                navigate('/login');
                setIsMenuOpen(false);
              }}
              className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-base font-medium transition-all touch-manipulation w-full text-left text-red-600 hover:text-red-700 hover:bg-red-50 active:bg-red-100"
            >
              <LogOut className="h-5 w-5" />
              <span>Sign Out</span>
            </button>
          </nav>
        </div>
      )}
    </header>
  );
};

export default TopNavigation;


