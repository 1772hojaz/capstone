import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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
        <Route path="/group/:id" element={<GroupDetail />} />
        <Route path="/moderation" element={<GroupModeration />} />
        <Route path="/users" element={<UserManagement />} />
        <Route path="/settings" element={<SystemSettings />} />
      </Routes>
    </Router>
  );
}

export default App;
