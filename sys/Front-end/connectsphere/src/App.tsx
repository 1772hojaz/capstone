import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import DashboardLayout from './components/DashboardLayout';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import SupplierLandingPage from './pages/SupplierLandingPage';
import SupplierLoginPage from './pages/SupplierLoginPage';
import AdminDashboard from './pages/AdminDashboard';
import TraderDashboard from './pages/TraderDashboard';
import SupplierDashboard from './pages/SupplierDashboard';
import GroupList from './pages/GroupList';
import AllGroups from './pages/AllGroups';
import GroupDetail from './pages/GroupDetail';
import ProfilePage from './pages/ProfilePage';
import GroupModeration from './pages/GroupModeration';
import Users from './pages/Users';
import SystemSettings from './pages/SystemSettings';
import MLBenchmarking from './pages/admin/MLBenchmarking';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentFailure from './pages/PaymentFailure';
import PaymentPage from './pages/PaymentPage';
import DashboardPage from './pages/DashboardPage';
import PricingPage from './pages/PricingPage';
import ContactPage from './pages/ContactPage';
import AnalyticsDashboard from './components/analytics/AnalyticsDashboard';

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
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
    </Router>
  );
}

export default App;
