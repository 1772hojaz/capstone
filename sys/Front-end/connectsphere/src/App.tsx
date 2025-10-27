import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Toaster } from './components/Toaster';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import TraderDashboard from './pages/TraderDashboard';
import GroupList from './pages/GroupList';
import AllGroups from './pages/AllGroups';
import GroupDetail from './pages/GroupDetail';
import ProfilePage from './pages/ProfilePage';
import GroupModeration from './pages/GroupModeration';
import UserManagement from './pages/UserManagement';
import ProductCatalog from './pages/ProductCatalog';
import SystemSettings from './pages/SystemSettings';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <DataProvider>
          <Router>
            <Toaster />
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />

              {/* Admin-only routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/moderation"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <GroupModeration />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/users"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <UserManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/products"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <ProductCatalog />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute requiredRole="admin">
                    <SystemSettings />
                  </ProtectedRoute>
                }
              />

              {/* Trader-only routes */}
              <Route
                path="/trader"
                element={
                  <ProtectedRoute requiredRole="trader">
                    <TraderDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Protected routes for both roles */}
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/groups"
                element={
                  <ProtectedRoute>
                    <GroupList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/all-groups"
                element={
                  <ProtectedRoute>
                    <AllGroups />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/group/:id"
                element={
                  <ProtectedRoute>
                    <GroupDetail />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Router>
        </DataProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
