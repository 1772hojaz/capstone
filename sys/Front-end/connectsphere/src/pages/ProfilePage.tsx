import { useState, useEffect } from 'react';
import { User, Camera, Mail, Phone, MapPin as Location, Calendar, Edit2, Save, X, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/api';

export default function ProfilePage() {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [profileData, setProfileData] = useState({
    full_name: '',
    email: '',
    location_zone: '',
    bio: '',
    joinDate: '',
    preferred_categories: [],
    budget_range: 'medium',
    experience_level: 'beginner',
    preferred_group_sizes: [],
    participation_frequency: 'occasional',
    // Additional preferences
    show_recommendations: true,
    auto_join_groups: true,
    price_alerts: false,
    // Notification settings
    email_notifications: true,
    push_notifications: true,
    sms_notifications: false,
    weekly_summary: true,
    price_alerts_enabled: false
  });

  const [stats, setStats] = useState([
    { label: 'Groups Joined', value: '0' },
    { label: 'Active Deals', value: '0' },
    { label: 'Total Savings', value: '$0' },
    { label: 'Success Rate', value: '0%' },
  ]);

  // Fetch user profile and stats on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch user profile
        const userProfile = await apiService.getCurrentUser();
        
        // Fetch user stats
        const userStats = await apiService.getPastGroupsSummary();
        const userGroups = await apiService.getMyGroups();

        // Update profile data
        setProfileData({
          ...userProfile,
          joinDate: 'January 2024', // This would come from backend if available
          bio: `Experienced ${userProfile.experience_level} trader specializing in ${userProfile.preferred_categories.join(', ')}.` // Generate bio from profile data
        });

        // Update stats
        const activeGroups = userGroups.filter((group: any) => group.status === 'active').length;
        setStats([
          { label: 'Groups Joined', value: userStats.completed_groups?.toString() || '0' },
          { label: 'Active Deals', value: activeGroups.toString() },
          { label: 'Total Savings', value: `$${userStats.all_time_savings?.toString() || '0'}` },
          { label: 'Success Rate', value: `${userStats.success_rate?.toString() || '0'}%` },
        ]);

      } catch (err) {
        console.error('Failed to load user data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      // Prepare data for backend (only send fields that can be updated)
      const updateData = {
        full_name: profileData.full_name,
        location_zone: profileData.location_zone,
        preferred_categories: profileData.preferred_categories,
        budget_range: profileData.budget_range,
        experience_level: profileData.experience_level,
        preferred_group_sizes: profileData.preferred_group_sizes,
        participation_frequency: profileData.participation_frequency,
        show_recommendations: profileData.show_recommendations,
        auto_join_groups: profileData.auto_join_groups,
        price_alerts: profileData.price_alerts,
        email_notifications: profileData.email_notifications,
        push_notifications: profileData.push_notifications,
        sms_notifications: profileData.sms_notifications,
        weekly_summary: profileData.weekly_summary,
        price_alerts_enabled: profileData.price_alerts_enabled
      };

      await apiService.updateProfile(updateData);
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to save profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError(null);
    // Reset to original data by refetching
    fetchUserData();
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      await apiService.changePassword({
        current_password: currentPassword,
        new_password: newPassword
      });

      // Clear form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      // Show success message
      alert('Password changed successfully!');
    } catch (err) {
      console.error('Failed to change password:', err);
      setError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const fetchUserData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch user profile
      const userProfile = await apiService.getCurrentUser();
      
      // Fetch user stats
      const userStats = await apiService.getPastGroupsSummary();
      const userGroups = await apiService.getMyGroups();

      // Update profile data
      setProfileData({
        ...userProfile,
        joinDate: 'January 2024', // This would come from backend if available
        bio: `Experienced ${userProfile.experience_level} trader specializing in ${userProfile.preferred_categories.join(', ')}.`, // Generate bio from profile data
        // Initialize additional preferences with defaults if not set
        show_recommendations: userProfile.show_recommendations !== undefined ? userProfile.show_recommendations : true,
        auto_join_groups: userProfile.auto_join_groups !== undefined ? userProfile.auto_join_groups : true,
        price_alerts: userProfile.price_alerts !== undefined ? userProfile.price_alerts : false
      });

      // Update stats
      const activeGroups = userGroups.filter((group: any) => group.status === 'active').length;
      setStats([
        { label: 'Groups Joined', value: userStats.completed_groups?.toString() || '0' },
        { label: 'Active Deals', value: activeGroups.toString() },
        { label: 'Total Savings', value: `$${userStats.all_time_savings?.toString() || '0'}` },
        { label: 'Success Rate', value: `${userStats.success_rate?.toString() || '0'}%` },
      ]);

    } catch (err) {
      console.error('Failed to load user data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="px-3 sm:px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8">
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          
          {/* Logo */}
          <button 
            onClick={() => navigate('/trader')}
            className="flex items-center gap-2 hover:opacity-80 transition flex-shrink-0"
          >
            <svg className="w-8 h-8 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
            <span className="text-xl font-semibold text-gray-800">ConnectSphere</span>
          </button>

          {/* Spacer */}
          <div className="flex-1"></div>

          {/* Right Side - Only Logout */}
          <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
            <button 
              onClick={() => navigate('/login')}
              className="px-3 sm:px-4 py-2 bg-red-500 text-white text-xs sm:text-sm rounded-lg hover:bg-red-600 transition whitespace-nowrap"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-3 sm:px-6 py-4 sm:py-8">
        <div className="max-w-5xl mx-auto">
          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2">
                <div className="text-red-500"></div>
                <p className="text-red-700">{error}</p>
                <button
                  onClick={() => fetchUserData()}
                  className="ml-auto bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          {/* Profile Header */}
          {!loading && !error && (
            <>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-6">
            <div className="flex items-start gap-6">
              {/* Profile Picture */}
              <div className="relative">
                <div className="w-32 h-32 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                  <User className="w-16 h-16 text-white" />
                </div>
                <button className="absolute bottom-0 right-0 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center hover:bg-blue-700 transition shadow-lg">
                  <Camera className="w-5 h-5 text-white" />
                </button>
              </div>

              {/* Profile Info */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{profileData.full_name}</h1>
                    <p className="text-gray-600 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Member since {profileData.joinDate}
                    </p>
                  </div>
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit Profile
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={handleSave}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                      >
                        <Save className="w-4 h-4" />
                        Save
                      </button>
                      <button
                        onClick={handleCancel}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </button>
                    </div>
                  )}
                </div>

                {/* Contact Info */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-gray-400" />
                    {isEditing ? (
                      <input
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                        className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                      />
                    ) : (
                      <span className="text-gray-700">{profileData.email}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <Location className="w-5 h-5 text-gray-400" />
                    {isEditing ? (
                      <input
                        type="text"
                        value={profileData.location_zone}
                        onChange={(e) => setProfileData({ ...profileData, location_zone: e.target.value })}
                        className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                      />
                    ) : (
                      <span className="text-gray-700">{profileData.location_zone}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Bio */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">About Me</h3>
              {isEditing ? (
                <textarea
                  value={profileData.bio}
                  onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              ) : (
                <p className="text-gray-600">{profileData.bio}</p>
              )}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {stats.map((stat, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Activity Sections */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* Section Tabs */}
            <div className="border-b border-gray-200">
              <nav className="flex px-6">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`py-4 px-4 text-sm font-medium border-b-2 transition ${
                    activeTab === 'profile'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Profile Settings
                </button>
                <button
                  onClick={() => setActiveTab('preferences')}
                  className={`py-4 px-4 text-sm font-medium border-b-2 transition ${
                    activeTab === 'preferences'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Preferences
                </button>
                <button
                  onClick={() => setActiveTab('notifications')}
                  className={`py-4 px-4 text-sm font-medium border-b-2 transition ${
                    activeTab === 'notifications'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Notifications
                </button>
                <button
                  onClick={() => setActiveTab('security')}
                  className={`py-4 px-4 text-sm font-medium border-b-2 transition ${
                    activeTab === 'security'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Security
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h3>
                    <p className="text-sm text-gray-600">
                      Update your personal information and how others see you on the platform.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Display Name</label>
                      <input
                        type="text"
                        defaultValue="Sarah P."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                      <input
                        type="text"
                        defaultValue="@sarahp"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'preferences' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Shopping Preferences</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Customize your group buying experience and product recommendations.
                    </p>
                  </div>
                  <div className="space-y-4">
                    <label className="flex items-center gap-3">
                      <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 rounded" />
                      <span className="text-sm text-gray-700">Show ML-powered recommendations</span>
                    </label>
                    <label className="flex items-center gap-3">
                      <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 rounded" />
                      <span className="text-sm text-gray-700">Auto-join groups based on preferences</span>
                    </label>
                    <label className="flex items-center gap-3">
                      <input type="checkbox" className="w-4 h-4 text-blue-600 rounded" />
                      <span className="text-sm text-gray-700">Enable price alerts</span>
                    </label>
                  </div>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Settings</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Choose how you want to be notified about group activities.
                    </p>
                  </div>
                  <div className="space-y-4">
                    <label className="flex items-center gap-3">
                      <input 
                        type="checkbox" 
                        checked={profileData.email_notifications}
                        onChange={(e) => setProfileData({ ...profileData, email_notifications: e.target.checked })}
                        className="w-4 h-4 text-blue-600 rounded" 
                      />
                      <span className="text-sm text-gray-700">Email notifications for new group deals</span>
                    </label>
                    <label className="flex items-center gap-3">
                      <input 
                        type="checkbox" 
                        checked={profileData.push_notifications}
                        onChange={(e) => setProfileData({ ...profileData, push_notifications: e.target.checked })}
                        className="w-4 h-4 text-blue-600 rounded" 
                      />
                      <span className="text-sm text-gray-700">Push notifications for deal updates</span>
                    </label>
                    <label className="flex items-center gap-3">
                      <input 
                        type="checkbox" 
                        checked={profileData.sms_notifications}
                        onChange={(e) => setProfileData({ ...profileData, sms_notifications: e.target.checked })}
                        className="w-4 h-4 text-blue-600 rounded" 
                      />
                      <span className="text-sm text-gray-700">SMS alerts for closing deals</span>
                    </label>
                    <label className="flex items-center gap-3">
                      <input 
                        type="checkbox" 
                        checked={profileData.weekly_summary}
                        onChange={(e) => setProfileData({ ...profileData, weekly_summary: e.target.checked })}
                        className="w-4 h-4 text-blue-600 rounded" 
                      />
                      <span className="text-sm text-gray-700">Weekly summary emails</span>
                    </label>
                    <label className="flex items-center gap-3">
                      <input 
                        type="checkbox" 
                        checked={profileData.price_alerts_enabled}
                        onChange={(e) => setProfileData({ ...profileData, price_alerts_enabled: e.target.checked })}
                        className="w-4 h-4 text-blue-600 rounded" 
                      />
                      <span className="text-sm text-gray-700">Price alerts for favorite products</span>
                    </label>
                  </div>

                  {/* Save Button for Notifications */}
                  <div className="pt-4 border-t border-gray-200">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? 'Saving...' : 'Save Notification Settings'}
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Settings</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Manage your account security and authentication.
                    </p>
                  </div>
                  
                  {/* Change Password Section */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="text-md font-semibold text-gray-900 mb-3">Change Password</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                        <input
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter current password"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Enter new password"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Confirm new password"
                        />
                      </div>
                      <button
                        onClick={handleChangePassword}
                        disabled={saving || !currentPassword || !newPassword || !confirmPassword}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      >
                        {saving ? 'Changing...' : 'Change Password'}
                      </button>
                    </div>
                  </div>

                  {/* Two-Factor Authentication (placeholder for now) */}
                  <div className="space-y-4">
                    <div>
                      <label className="flex items-center gap-3">
                        <input type="checkbox" className="w-4 h-4 text-blue-600 rounded" />
                        <span className="text-sm text-gray-700">Enable two-factor authentication</span>
                      </label>
                      <p className="text-xs text-gray-500 mt-1">Add an extra layer of security to your account</p>
                    </div>
                    
                    {/* Login History (placeholder) */}
                    <div>
                      <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm">
                        View Login History
                      </button>
                      <p className="text-xs text-gray-500 mt-1">See recent login activity on your account</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
        )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="px-6 py-4 flex justify-between items-center text-sm text-gray-600">
          <div className="flex gap-6">
            <button className="hover:text-gray-900">Product</button>
            <button className="hover:text-gray-900">Resources</button>
            <button className="hover:text-gray-900">Company</button>
          </div>
          <div className="flex items-center gap-4">
            <button className="hover:text-gray-900">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </button>
            <button className="hover:text-gray-900">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
              </svg>
            </button>
            <button className="hover:text-gray-900">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z"/>
              </svg>
            </button>
            <button className="hover:text-gray-900">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
