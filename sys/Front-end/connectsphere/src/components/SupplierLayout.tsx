import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, LogOut } from 'lucide-react';

interface SupplierLayoutProps {
  children: ReactNode;
}

const SupplierLayout = ({ children }: SupplierLayoutProps) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex flex-col" role="application">
      {/* Skip link for keyboard users */}
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 bg-white px-3 py-2 rounded-md shadow">Skip to content</a>

      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="px-4 sm:px-6 py-3 sm:py-4">
          <div className="max-w-7xl mx-auto">
            {/* Logo and Actions Row */}
            <div className="flex justify-between items-center">
              {/* Logo */}
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  onClick={() => navigate('/supplier')}
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
                <span className="text-xs text-gray-500 font-medium -mt-1">Supplier Dashboard</span>
              </div>

              {/* Supplier Actions */}
              <div className="flex items-center gap-2">
                {/* Notifications */}
                <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>

                {/* Logout */}
                <button
                  onClick={() => navigate('/supplier')}
                  className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white text-sm font-medium rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden xl:inline">Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main id="main-content" className="flex-1 px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto w-full" role="main">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="px-6 py-4 flex flex-col sm:flex-row justify-between items-center text-sm text-gray-600 max-w-7xl mx-auto gap-4">
          <div className="flex gap-6">
            <button className="hover:text-blue-600 transition-colors duration-200">Help Center</button>
            <button className="hover:text-blue-600 transition-colors duration-200">Support</button>
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

export default SupplierLayout;