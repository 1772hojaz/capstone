import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import { Spinner } from './components/feedback/Spinner';

// Lazy load all pages
const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const EnhancedRegistrationPage = lazy(() => import('./pages/EnhancedRegistrationPage'));
const SupplierLandingPage = lazy(() => import('./pages/SupplierLandingPage'));
const SupplierLoginPage = lazy(() => import('./pages/SupplierLoginPage'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const TraderDashboard = lazy(() => import('./pages/TraderDashboard'));
const SupplierDashboard = lazy(() => import('./pages/SupplierDashboard'));
const GroupList = lazy(() => import('./pages/GroupList'));
const AllGroups = lazy(() => import('./pages/AllGroups'));
const GroupDetail = lazy(() => import('./pages/GroupDetail'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const GroupModeration = lazy(() => import('./pages/GroupModeration'));
const Users = lazy(() => import('./pages/Users'));
const SystemSettings = lazy(() => import('./pages/SystemSettings'));
const MLBenchmarking = lazy(() => import('./pages/admin/MLBenchmarking'));
const PaymentSuccess = lazy(() => import('./pages/PaymentSuccess'));
const PaymentFailure = lazy(() => import('./pages/PaymentFailure'));
const PaymentPage = lazy(() => import('./pages/PaymentPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const PricingPage = lazy(() => import('./pages/PricingPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const AnalyticsDashboard = lazy(() => import('./components/analytics/AnalyticsDashboard'));
const Products = lazy(() => import('./pages/Products'));
const CreateGroup = lazy(() => import('./pages/CreateGroup'));

// Eager load DashboardLayout since it's needed frequently
import DashboardLayout from './components/DashboardLayout';

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <Spinner size="lg" />
      <p className="mt-4 text-gray-600">Loading...</p>
    </div>
  </div>
);

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={
            <MainLayout>
              <LandingPage />
            </MainLayout>
          } />
          
          <Route path="/login" element={
            <MainLayout>
              <LoginPage />
            </MainLayout>
          } />

          <Route path="/register" element={
            <MainLayout>
              <EnhancedRegistrationPage />
            </MainLayout>
          } />

          <Route path="/supplier" element={
            <MainLayout>
              <SupplierLandingPage />
            </MainLayout>
          } />

          <Route path="/supplier/login" element={
            <MainLayout>
              <SupplierLoginPage />
            </MainLayout>
          } />

          <Route path="/supplier/dashboard" element={
            <MainLayout>
              <SupplierDashboard />
            </MainLayout>
          } />

          <Route path="/supplier/groups/create" element={
            <MainLayout>
              <CreateGroup />
            </MainLayout>
          } />

          <Route path="/profile" element={
            <MainLayout>
              <ProfilePage />
            </MainLayout>
          } />

          <Route path="/supplier/profile" element={
            <MainLayout>
              <ProfilePage />
            </MainLayout>
          } />

          <Route path="/admin" element={
            <MainLayout>
              <AdminDashboard />
            </MainLayout>
          } />

          <Route path="/trader" element={
            <MainLayout>
              <TraderDashboard />
            </MainLayout>
          } />

          <Route path="/dashboard" element={
            <DashboardLayout>
              <DashboardPage />
            </DashboardLayout>
          } />

          <Route path="/dashboard/*" element={
            <DashboardLayout>
              <DashboardPage />
            </DashboardLayout>
          } />

          <Route path="/pricing" element={
            <MainLayout>
              <PricingPage />
            </MainLayout>
          } />

          <Route path="/contact" element={
            <MainLayout>
              <ContactPage />
            </MainLayout>
          } />

          <Route path="/payment" element={
            <MainLayout>
              <PaymentPage />
            </MainLayout>
          } />

          <Route path="/payment/success" element={
            <MainLayout>
              <PaymentSuccess />
            </MainLayout>
          } />

          <Route path="/payment/failure" element={
            <MainLayout>
              <PaymentFailure />
            </MainLayout>
          } />

          <Route path="/groups" element={
            <MainLayout>
              <GroupList />
            </MainLayout>
          } />

          <Route path="/all-groups" element={
            <MainLayout>
              <AllGroups />
            </MainLayout>
          } />

          <Route path="/products" element={
            <MainLayout>
              <Products />
            </MainLayout>
          } />

          <Route path="/group/:id" element={
            <MainLayout>
              <GroupDetail />
            </MainLayout>
          } />

          <Route path="/moderation" element={
            <MainLayout>
              <GroupModeration />
            </MainLayout>
          } />

          <Route path="/users" element={
            <MainLayout>
              <Users />
            </MainLayout>
          } />

          <Route path="/settings" element={
            <MainLayout>
              <SystemSettings />
            </MainLayout>
          } />

          <Route path="/admin/ml-benchmarking" element={
            <MainLayout>
              <MLBenchmarking />
            </MainLayout>
          } />

          <Route path="/analytics" element={<AnalyticsDashboard />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;
