import { Link, useLocation } from 'react-router-dom';
import { Home, ShoppingCart, Package, Users, Settings, Shield, QrCode, Brain } from 'lucide-react';

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
        { label: 'Users', path: '/users', icon: Users },
        { label: 'Moderation', path: '/moderation', icon: Shield },
        { label: 'ML', path: '/admin/ml-analytics', icon: Brain },
        { label: 'QR', path: '/admin/qr-scanner', icon: QrCode },
        { label: 'Settings', path: '/settings', icon: Settings },
      ];
    }

    if (userRole === 'supplier') {
      return [
        { label: 'Dashboard', path: '/supplier/dashboard', icon: Home },
        { label: 'Orders', path: '/supplier/dashboard', icon: ShoppingCart },
      ];
    }

    // Trader (default)
    return [
      { label: 'Home', path: '/trader', icon: Home },
      { label: 'Browse', path: '/all-groups', icon: ShoppingCart },
      { label: 'My Groups', path: '/groups', icon: Package },
    ];
  };

  const navItems = getNavItems();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] safe-area-pb">
      <div className={`grid h-16 ${userRole === 'admin' ? 'grid-cols-6' : userRole === 'supplier' ? 'grid-cols-2' : 'grid-cols-3'}`}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <Link
              key={item.path}
              to={item.path}
              className="flex flex-col items-center justify-center gap-1 transition-all duration-200 min-w-touch min-h-touch touch-manipulation relative"
            >
              {active && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-primary-500 rounded-b-full" />
              )}
              <div className={`flex flex-col items-center gap-1 ${
                active ? 'transform scale-110' : ''
              }`}>
                <div className={`p-2 rounded-xl transition-all relative ${
                  active 
                    ? 'bg-primary-500 text-white shadow-md' 
                    : 'text-gray-500'
                }`}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className={`text-[10px] transition-all ${
                  active 
                    ? 'font-semibold text-primary-600' 
                    : 'font-medium text-gray-600'
                }`}>
                  {item.label}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;


