import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Home, Users, Package, Settings, BarChart3, ShoppingCart, User } from 'lucide-react';
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
        { label: 'All Groups', path: '/all-groups', icon: Package },
        { label: 'Analytics', path: '/analytics', icon: BarChart3 },
        { label: 'Settings', path: '/settings', icon: Settings },
      ];
    }

    if (role === 'supplier') {
      return [
        { label: 'Dashboard', path: '/supplier/dashboard', icon: Home },
        { label: 'All Groups', path: '/all-groups', icon: Package },
        { label: 'Profile', path: '/supplier/profile', icon: User },
      ];
    }

    // Trader (default)
    return [
      { label: 'Home', path: '/trader', icon: Home },
      { label: 'Browse Groups', path: '/all-groups', icon: ShoppingCart },
      { label: 'My Groups', path: '/groups', icon: Package },
      { label: 'Profile', path: '/profile', icon: User },
    ];
  };

  const navigationItems = getNavigationItems();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="max-w-content mx-auto px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link 
            to={role === 'admin' ? '/admin' : role === 'supplier' ? '/supplier/dashboard' : '/trader'} 
            className="flex items-center gap-2 transition-opacity hover:opacity-80"
          >
            <svg className="h-8 w-8 text-primary-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
            <span className="text-xl font-semibold text-gray-900">ConnectSphere</span>
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
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
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
              className="md:hidden inline-flex items-center justify-center h-10 w-10 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <nav className="px-4 py-3 space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                    active
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Info (Mobile) */}
          {user && (
            <div className="border-t border-gray-200 px-4 py-3">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-sm font-medium text-primary-700">
                    {user.full_name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{user.full_name}</p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  localStorage.removeItem('token');
                  navigate('/login');
                  setIsMenuOpen(false);
                }}
                className="w-full px-4 py-2 text-sm font-medium text-danger-600 bg-danger-50 hover:bg-danger-100 rounded-lg transition-colors"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default TopNavigation;

