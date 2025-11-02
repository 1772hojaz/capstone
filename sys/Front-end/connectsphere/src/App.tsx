import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/supplier" element={<SupplierLandingPage />} />
        <Route path="/supplier/login" element={<SupplierLoginPage />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/trader" element={<TraderDashboard />} />
        <Route path="/supplier/dashboard" element={<SupplierDashboard />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/groups" element={<GroupList />} />
        <Route path="/all-groups" element={<AllGroups />} />
        <Route path="/group/:id" element={<GroupDetail />} />
        <Route path="/moderation" element={<GroupModeration />} />
        <Route path="/users" element={<Users />} />
        <Route path="/settings" element={<SystemSettings />} />
      </Routes>
    </Router>
  );
}

export default App;
