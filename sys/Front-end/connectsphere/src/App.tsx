import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import TraderDashboard from './pages/TraderDashboard';
import GroupList from './pages/GroupList';
import AllGroups from './pages/AllGroups';
import ProfilePage from './pages/ProfilePage';
import GroupModeration from './pages/GroupModeration';
import UserManagement from './pages/UserManagement';
import ProductCatalog from './pages/ProductCatalog';
import SystemSettings from './pages/SystemSettings';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/trader" element={<TraderDashboard />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/groups" element={<GroupList />} />
        <Route path="/all-groups" element={<AllGroups />} />
        <Route path="/moderation" element={<GroupModeration />} />
        <Route path="/users" element={<UserManagement />} />
        <Route path="/products" element={<ProductCatalog />} />
        <Route path="/settings" element={<SystemSettings />} />
      </Routes>
    </Router>
  );
}

export default App;
