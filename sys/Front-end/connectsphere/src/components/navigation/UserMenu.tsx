import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Settings, LogOut, ChevronDown } from 'lucide-react';

interface UserMenuProps {
  user: {
    full_name: string;
    email: string;
    location_zone?: string;
  };
  role?: 'admin' | 'supplier' | 'trader';
}

const UserMenu = ({ user, role = 'trader' }: UserMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
    setIsOpen(false);
  };

  const profilePath = role === 'supplier' ? '/supplier/profile' : '/profile';

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {/* Avatar */}
        <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
          <span className="text-sm font-medium text-primary-700">
            {user.full_name?.charAt(0).toUpperCase() || 'U'}
          </span>
        </div>

        {/* User Info (Hidden on small screens) */}
        <div className="hidden lg:block text-left">
          <p className="text-sm font-medium text-gray-900 leading-none">
            {user.full_name}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {user.location_zone || 'No location'}
          </p>
        </div>

        <ChevronDown
          className={`h-4 w-4 text-gray-500 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-1 animate-slideDown">
          {/* User Info */}
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-900">{user.full_name}</p>
            <p className="text-xs text-gray-500 truncate mt-1">{user.email}</p>
            {user.location_zone && (
              <p className="text-xs text-gray-500 mt-1">
                📍 {user.location_zone}
              </p>
            )}
          </div>

          {/* Menu Items */}
          <div className="py-1">
            <Link
              to={profilePath}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <User className="h-4 w-4" />
              <span>Profile</span>
            </Link>

            {role === 'admin' && (
              <Link
                to="/settings"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </Link>
            )}
          </div>

          {/* Logout */}
          <div className="border-t border-gray-100 py-1">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-2 text-sm text-danger-600 hover:bg-danger-50 transition-colors w-full text-left"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserMenu;

