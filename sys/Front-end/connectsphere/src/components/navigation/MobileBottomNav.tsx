import { Link, useLocation } from 'react-router-dom';
import { Home, ShoppingCart, Package, User } from 'lucide-react';

interface NavItem {
  label: string;
  path: string;
  icon: typeof Home;
}

interface MobileBottomNavProps {
  userRole?: 'admin' | 'supplier' | 'trader';
}

const MobileBottomNav = ({ userRole = 'trader' }: MobileBottomNavProps) => {
  const location = useLocation();

  const getNavItems = (): NavItem[] => {
    if (userRole === 'admin') {
      return [
        { label: 'Dashboard', path: '/admin', icon: Home },
        { label: 'Users', path: '/users', icon: User },
        { label: 'Groups', path: '/all-groups', icon: Package },
        { label: 'Settings', path: '/settings', icon: User },
      ];
    }

    if (userRole === 'supplier') {
      return [
        { label: 'Dashboard', path: '/supplier/dashboard', icon: Home },
        { label: 'Groups', path: '/all-groups', icon: Package },
        { label: 'Orders', path: '/supplier/dashboard', icon: ShoppingCart },
        { label: 'Profile', path: '/supplier/profile', icon: User },
      ];
    }

    // Trader (default)
    return [
      { label: 'Home', path: '/trader', icon: Home },
      { label: 'Browse', path: '/all-groups', icon: ShoppingCart },
      { label: 'My Groups', path: '/groups', icon: Package },
      { label: 'Profile', path: '/profile', icon: User },
    ];
  };

  const navItems = getNavItems();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-area-pb">
      <div className="grid grid-cols-4 h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center gap-1 transition-colors min-w-touch min-h-touch ${
                active
                  ? 'text-primary-600'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Icon className={`h-5 w-5 ${active ? 'stroke-[2.5]' : ''}`} />
              <span className={`text-xs ${active ? 'font-medium' : ''}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;

