import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import PageLoader from './PageLoader';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'trader';
}

export const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { user, isLoading, isAuthenticated } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return <PageLoader message="Checking authentication..." />;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check role-based access
  if (requiredRole === 'admin' && !user?.is_admin) {
    // Non-admin trying to access admin route - redirect to trader dashboard
    return <Navigate to="/trader" replace />;
  }

  if (requiredRole === 'trader' && user?.is_admin) {
    // Admin trying to access trader route - redirect to admin dashboard
    return <Navigate to="/admin" replace />;
  }

  // User is authenticated and has correct role
  return <>{children}</>;
};

export default ProtectedRoute;
