import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Settings, LogOut, ChevronDown, MapPin, Edit2 } from 'lucide-react';

interface UserMenuProps {
  user: {
    full_name: string;
    email: string;
    location_zone?: string;
  };
  role?: 'admin' | 'supplier' | 'trader';
}

const AVAILABLE_LOCATIONS = [
  'Harare',
  'Bulawayo',
  'Chitungwiza',
  'Mutare',
  'Gweru',
  'Kwekwe',
  'Kadoma',
  'Masvingo',
  'Chinhoyi',
  'Norton',
  'Marondera',
  'Ruwa',
  'Chegutu',
  'Zvishavane',
  'Bindura',
  'Victoria Falls',
];

const UserMenu = ({ user, role = 'trader' }: UserMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [location, setLocation] = useState(user.location_zone || '');
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

  const handleSaveLocation = () => {
    // TODO: Call API to update location
    // For now, just update local state
    setIsEditingLocation(false);
    // You can add API call here: apiService.updateUserLocation(location);
  };

  const handleCancelEdit = () => {
    setLocation(user.location_zone || '');
    setIsEditingLocation(false);
  };

  const profilePath = role === 'supplier' ? '/supplier/profile' : '/profile';

  const handleMobileClick = () => {
    navigate(profilePath);
  };

  const handleDesktopClick = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Mobile: Navigate to Profile */}
      <button
        onClick={handleMobileClick}
        className="md:hidden flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-all touch-manipulation"
      >
        {/* Avatar */}
        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-sm">
          <span className="text-sm font-semibold text-white">
            {user.full_name?.charAt(0).toUpperCase() || 'U'}
          </span>
        </div>
      </button>

      {/* Desktop: Dropdown Menu */}
      <button
        onClick={handleDesktopClick}
        className="hidden md:flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {/* Avatar */}
        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-sm">
          <span className="text-sm font-semibold text-white">
            {user.full_name?.charAt(0).toUpperCase() || 'U'}
          </span>
        </div>

        {/* User Info (Desktop only) */}
        <div className="hidden lg:block text-left">
          <p className="text-sm font-medium text-gray-900 leading-none">
            {user.full_name}
          </p>
          <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {location || 'No location'}
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
        <div className="absolute right-0 mt-2 w-72 md:w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-1 animate-slideDown z-50">
          {/* User Info */}
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-900">{user.full_name}</p>
            <p className="text-xs text-gray-500 truncate mt-1">{user.email}</p>
            
            {/* Location Section */}
            {!isEditingLocation ? (
              <div className="flex items-center justify-between mt-2 group">
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <MapPin className="h-3 w-3" />
                  <span>{location || 'No location set'}</span>
                </div>
                {role === 'trader' && (
                  <button
                    onClick={() => setIsEditingLocation(true)}
                    className="md:opacity-0 md:group-hover:opacity-100 p-2 md:p-1 hover:bg-gray-100 active:bg-gray-200 rounded transition-opacity touch-manipulation"
                    title="Edit location"
                  >
                    <Edit2 className="h-4 w-4 md:h-3 md:w-3 text-gray-600" />
                  </button>
                )}
              </div>
            ) : (
              <div className="mt-2 space-y-2">
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-2 md:px-2 md:py-1.5 text-sm md:text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                  autoFocus
                >
                  <option value="">Select location</option>
                  {AVAILABLE_LOCATIONS.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveLocation}
                    className="flex-1 px-3 py-2 md:px-2 md:py-1 text-sm md:text-xs font-medium text-white bg-primary-600 hover:bg-primary-700 active:bg-primary-800 rounded transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="flex-1 px-3 py-2 md:px-2 md:py-1 text-sm md:text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Menu Items */}
          <div className="py-1">
            <Link
              to={profilePath}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-3 md:py-2 text-sm text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation"
            >
              <User className="h-5 w-5 md:h-4 md:w-4" />
              <span>Profile</span>
            </Link>

            {role === 'admin' && (
              <Link
                to="/settings"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 px-4 py-3 md:py-2 text-sm text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation"
              >
                <Settings className="h-5 w-5 md:h-4 md:w-4" />
                <span>Settings</span>
              </Link>
            )}
          </div>

          {/* Logout */}
          <div className="border-t border-gray-100 py-1">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 md:py-2 text-sm text-danger-600 hover:bg-danger-50 active:bg-danger-100 transition-colors w-full text-left touch-manipulation"
            >
              <LogOut className="h-5 w-5 md:h-4 md:w-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserMenu;


