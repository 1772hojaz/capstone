import { useState, useEffect } from 'react';
import { 
  User, Camera, Mail, MapPin, Calendar, Edit2, Save, X, 
  Shield, Bell, CreditCard, Settings, TrendingUp, Package,
  CheckCircle, Lock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/api';
import TopNavigation from '../components/navigation/TopNavigation';
import MobileBottomNav from '../components/navigation/MobileBottomNav';
import { PageContainer, PageHeader } from '../components/layout/index';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

const AVAILABLE_LOCATIONS = [
  'Harare',
  'Bulawayo',
  'Chitungwiza',
  'Mutare',
  'Gweru',
  'Kwekwe',
  'Kadoma',
  'Masvingo',
  'Chinhoyi',
  'Norton',
  'Marondera',
  'Ruwa',
  'Chegutu',
  'Zvishavane',
  'Bindura',
  'Beitbridge',
  'Victoria Falls',
  'Kariba',
  'Hwange',
  'Karoi',
];

export default function ProfilePage() {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
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
    // Trader fields
    preferred_categories: [],
    budget_range: 'medium',
    experience_level: 'beginner',
    preferred_group_sizes: [],
    participation_frequency: 'occasional',
    // Supplier fields
    company_name: '',
    business_address: '',
    tax_id: '',
    phone_number: '',
    business_type: 'retailer',
    business_description: '',
    website_url: '',
    bank_account_name: '',
    bank_account_number: '',
    bank_name: '',
    payment_terms: 'net_30',
    is_supplier: false,
    is_admin: false,
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
    { label: 'Groups Joined', value: '0', icon: Package },
    { label: 'Active Deals', value: '0', icon: TrendingUp },
    { label: 'Total Savings', value: '$0', icon: CreditCard },
    { label: 'Success Rate', value: '0%', icon: CheckCircle },
  ]);

  // Fetch user profile and stats on component mount
  useEffect(() => {
    fetchUserData();
  }, []);

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
        bio: userProfile.is_supplier 
          ? `${userProfile.company_name || 'Business'} - ${userProfile.business_type || 'Supplier'} specializing in quality products.`
          : `Experienced ${userProfile.experience_level || 'trader'} specializing in ${userProfile.preferred_categories?.join(', ') || 'various categories'}.`,
        // Initialize additional preferences with defaults if not set
        show_recommendations: userProfile.show_recommendations !== undefined ? userProfile.show_recommendations : true,
        auto_join_groups: userProfile.auto_join_groups !== undefined ? userProfile.auto_join_groups : true,
        price_alerts: userProfile.price_alerts !== undefined ? userProfile.price_alerts : false
      });

      // Update stats based on user type
      if (userProfile.is_supplier) {
        // Supplier stats
        const supplierStats = await apiService.getSupplierStats?.() || {};
        setStats([
          { label: 'Orders Fulfilled', value: userProfile.total_orders_fulfilled?.toString() || '0', icon: Package },
          { label: 'Active Groups', value: supplierStats.active_groups?.toString() || '0', icon: TrendingUp },
          { label: 'Total Revenue', value: `${Number(supplierStats.total_revenue || 0).toFixed(2)}`, icon: CreditCard },
          { label: 'Supplier Rating', value: `${userProfile.supplier_rating?.toFixed(1) || '0'}/5`, icon: CheckCircle },
        ]);
      } else {
        // Trader stats
        const activeGroups = userGroups.filter((group: any) => group.status === 'active').length;
        setStats([
          { label: 'Groups Joined', value: userStats.completed_groups?.toString() || '0', icon: Package },
          { label: 'Active Deals', value: activeGroups.toString(), icon: TrendingUp },
          { label: 'Total Savings', value: `${Number(userStats.all_time_savings || 0).toFixed(2)}`, icon: CreditCard },
          { label: 'Success Rate', value: `${userStats.success_rate?.toString() || '0'}%`, icon: CheckCircle },
        ]);
      }
    } catch (err) {
      console.error('Failed to load user data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      // Prepare data for backend (only send fields that can be updated)
      const updateData: any = {
        full_name: profileData.full_name,
        location_zone: profileData.location_zone,
        email_notifications: profileData.email_notifications,
        push_notifications: profileData.push_notifications,
        sms_notifications: profileData.sms_notifications,
        weekly_summary: profileData.weekly_summary,
        price_alerts_enabled: profileData.price_alerts_enabled
      };

      // Add supplier-specific fields if user is a supplier
      if (profileData.is_supplier) {
        updateData.company_name = profileData.company_name;
        updateData.business_address = profileData.business_address;
        updateData.tax_id = profileData.tax_id;
        updateData.phone_number = profileData.phone_number;
        updateData.business_type = profileData.business_type;
        updateData.business_description = profileData.business_description;
        updateData.website_url = profileData.website_url;
        updateData.bank_account_name = profileData.bank_account_name;
        updateData.bank_account_number = profileData.bank_account_number;
        updateData.bank_name = profileData.bank_name;
        updateData.payment_terms = profileData.payment_terms;
      } else {
        // Add trader-specific fields
        updateData.preferred_categories = profileData.preferred_categories;
        updateData.budget_range = profileData.budget_range;
        updateData.experience_level = profileData.experience_level;
        updateData.preferred_group_sizes = profileData.preferred_group_sizes;
        updateData.participation_frequency = profileData.participation_frequency;
        updateData.show_recommendations = profileData.show_recommendations;
        updateData.auto_join_groups = profileData.auto_join_groups;
        updateData.price_alerts = profileData.price_alerts;
      }

      await apiService.updateProfile(updateData);
      setIsEditing(false);
      setSuccessMessage('Profile updated successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
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
      setSuccessMessage(null);

      await apiService.changePassword({
        current_password: currentPassword,
        new_password: newPassword
      });

      // Clear form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      // Show success message
      setSuccessMessage('Password changed successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Failed to change password:', err);
      setError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const role = profileData.is_admin ? 'admin' : profileData.is_supplier ? 'supplier' : 'trader';

  const tabs = [
    { id: 'profile', label: 'Profile Settings', icon: User },
    { id: 'preferences', label: 'Preferences', icon: Settings },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    ...(profileData.is_supplier ? [{ id: 'banking', label: 'Banking', icon: CreditCard }] : [])
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <TopNavigation userRole={role} />
      
      <PageContainer>
        <PageHeader
          title="My Profile"
          subtitle="Manage your account settings and preferences"
        />

        {/* Success Message */}
        {successMessage && (
          <Card variant="elevated" padding="md" className="mb-6 border-2 border-success-400 bg-success-50">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-success-600" />
              <p className="text-success-700 font-medium">{successMessage}</p>
            </div>
          </Card>
        )}

        {/* Error Message */}
        {error && (
          <Card variant="elevated" padding="md" className="mb-6 border-2 border-danger-400 bg-danger-50">
            <div className="flex items-center gap-3">
              <X className="h-5 w-5 text-danger-600" />
              <p className="text-danger-700 font-medium">{error}</p>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-danger-600 hover:text-danger-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </Card>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-600"></div>
          </div>
        ) : (
          <>
            {/* Profile Header */}
            <Card variant="elevated" padding="none" className="mb-6 overflow-hidden">
              {/* Cover Background */}
              <div className="h-32 bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700"></div>
              
              <div className="px-6 pb-6">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between -mt-16 md:-mt-12">
                  {/* Avatar and Basic Info */}
                  <div className="flex flex-col md:flex-row md:items-end gap-4">
                    {/* Profile Picture */}
                    <div className="relative">
                      <div className="w-32 h-32 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-2xl border-4 border-white">
                        <User className="w-16 h-16 text-white" />
                      </div>
                      <button className="absolute bottom-0 right-0 w-10 h-10 bg-white rounded-full flex items-center justify-center hover:bg-gray-50 transition shadow-lg border-2 border-gray-100">
                        <Camera className="w-5 h-5 text-gray-700" />
                      </button>
                    </div>

                    {/* User Info */}
                    <div className="md:mb-4">
                      <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{profileData.full_name}</h1>
                        <Badge variant={role === 'supplier' ? 'warning' : 'info'} className="capitalize">
                          {role}
                        </Badge>
                      </div>
                      <div className="flex flex-col md:flex-row md:items-center gap-3 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          <span>{profileData.email}</span>
                        </div>
                        <div className="hidden md:block w-1 h-1 bg-gray-400 rounded-full"></div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span>{profileData.location_zone || 'No location set'}</span>
                        </div>
                        <div className="hidden md:block w-1 h-1 bg-gray-400 rounded-full"></div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>Joined {profileData.joinDate}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Edit/Save Buttons */}
                  <div className="mt-4 md:mt-0 md:mb-4">
                    {!isEditing ? (
                      <Button
                        onClick={() => setIsEditing(true)}
                        leftIcon={<Edit2 className="w-4 h-4" />}
                        size="lg"
                      >
                        Edit Profile
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          onClick={handleSave}
                          disabled={saving}
                          variant="success"
                          leftIcon={<Save className="w-4 h-4" />}
                        >
                          {saving ? 'Saving...' : 'Save Changes'}
                        </Button>
                        <Button
                          onClick={handleCancel}
                          variant="secondary"
                          leftIcon={<X className="w-4 h-4" />}
                        >
                          Cancel
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <Card key={index} variant="elevated" padding="lg" className="text-center hover:shadow-xl transition-shadow">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary-100 mb-3">
                      <Icon className="w-6 h-6 text-primary-600" />
                    </div>
                    <p className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
                    <p className="text-xs md:text-sm text-gray-600">{stat.label}</p>
                  </Card>
                );
              })}
            </div>

            {/* Tabs and Content */}
            <Card variant="elevated" padding="none">
              {/* Tab Navigation */}
              <div className="border-b border-gray-200 overflow-x-auto">
                <nav className="flex px-4 md:px-6 min-w-max">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 py-4 px-4 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                          activeTab === tab.id
                            ? 'border-primary-600 text-primary-600'
                            : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === 'profile' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Profile Information</h3>
                      <p className="text-sm text-gray-600">
                        Update your personal information and how others see you on the platform.
                      </p>
                    </div>

                    {/* Bio */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">About Me</label>
                      {isEditing ? (
                        <textarea
                          value={profileData.bio}
                          onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                          rows={3}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="Tell us about yourself..."
                        />
                      ) : (
                        <p className="text-gray-700 bg-gray-50 rounded-lg p-4">{profileData.bio || 'No bio yet'}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {profileData.is_supplier ? (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                            <input
                              type="text"
                              value={profileData.company_name}
                              onChange={(e) => setProfileData({ ...profileData, company_name: e.target.value })}
                              disabled={!isEditing}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Business Type</label>
                            <select
                              value={profileData.business_type}
                              onChange={(e) => setProfileData({ ...profileData, business_type: e.target.value })}
                              disabled={!isEditing}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                            >
                              <option value="retailer">Retailer</option>
                              <option value="wholesaler">Wholesaler</option>
                              <option value="manufacturer">Manufacturer</option>
                              <option value="distributor">Distributor</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                            <input
                              type="tel"
                              value={profileData.phone_number}
                              onChange={(e) => setProfileData({ ...profileData, phone_number: e.target.value })}
                              disabled={!isEditing}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                            <input
                              type="url"
                              value={profileData.website_url}
                              onChange={(e) => setProfileData({ ...profileData, website_url: e.target.value })}
                              disabled={!isEditing}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                            />
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                            <input
                              type="text"
                              value={profileData.full_name}
                              onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                              disabled={!isEditing}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                            <select
                              value={profileData.location_zone}
                              onChange={(e) => setProfileData({ ...profileData, location_zone: e.target.value })}
                              disabled={!isEditing}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                            >
                              <option value="">Select location</option>
                              {AVAILABLE_LOCATIONS.map((location) => (
                                <option key={location} value={location}>
                                  {location}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Experience Level</label>
                            <select
                              value={profileData.experience_level}
                              onChange={(e) => setProfileData({ ...profileData, experience_level: e.target.value })}
                              disabled={!isEditing}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                            >
                              <option value="beginner">Beginner</option>
                              <option value="intermediate">Intermediate</option>
                              <option value="advanced">Advanced</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Budget Range</label>
                            <select
                              value={profileData.budget_range}
                              onChange={(e) => setProfileData({ ...profileData, budget_range: e.target.value })}
                              disabled={!isEditing}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
                            >
                              <option value="low">Low ($0-500)</option>
                              <option value="medium">Medium ($500-2000)</option>
                              <option value="high">High ($2000+)</option>
                            </select>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'preferences' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {profileData.is_supplier ? 'Business Preferences' : 'Shopping Preferences'}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {profileData.is_supplier 
                          ? 'Customize your business settings and preferences.'
                          : 'Customize your group buying experience and product recommendations.'
                        }
                      </p>
                    </div>
                    
                    {profileData.is_supplier ? (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Business Description</label>
                          <textarea
                            value={profileData.business_description}
                            onChange={(e) => setProfileData({ ...profileData, business_description: e.target.value })}
                            rows={4}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="Describe your business..."
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Business Address</label>
                          <textarea
                            value={profileData.business_address}
                            onChange={(e) => setProfileData({ ...profileData, business_address: e.target.value })}
                            rows={2}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="Enter your business address..."
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Tax ID</label>
                            <input
                              type="text"
                              value={profileData.tax_id}
                              onChange={(e) => setProfileData({ ...profileData, tax_id: e.target.value })}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                              placeholder="Tax identification number"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Payment Terms</label>
                            <select
                              value={profileData.payment_terms}
                              onChange={(e) => setProfileData({ ...profileData, payment_terms: e.target.value })}
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            >
                              <option value="net_30">Net 30 days</option>
                              <option value="net_15">Net 15 days</option>
                              <option value="cod">Cash on Delivery</option>
                              <option value="prepaid">Prepaid</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <Card variant="outlined" padding="md" className="hover:border-primary-300 transition-colors">
                          <label className="flex items-start gap-3 cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={profileData.show_recommendations}
                              onChange={(e) => setProfileData({ ...profileData, show_recommendations: e.target.checked })}
                              className="mt-1 w-5 h-5 text-primary-600 rounded focus:ring-2 focus:ring-primary-500" 
                            />
                            <div>
                              <span className="text-sm font-medium text-gray-900 block mb-1">Show ML-powered recommendations</span>
                              <span className="text-xs text-gray-600">Get personalized group suggestions based on your interests</span>
                            </div>
                          </label>
                        </Card>
                        
                        <Card variant="outlined" padding="md" className="hover:border-primary-300 transition-colors">
                          <label className="flex items-start gap-3 cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={profileData.auto_join_groups}
                              onChange={(e) => setProfileData({ ...profileData, auto_join_groups: e.target.checked })}
                              className="mt-1 w-5 h-5 text-primary-600 rounded focus:ring-2 focus:ring-primary-500" 
                            />
                            <div>
                              <span className="text-sm font-medium text-gray-900 block mb-1">Auto-join groups</span>
                              <span className="text-xs text-gray-600">Automatically join groups that match your preferences</span>
                            </div>
                          </label>
                        </Card>
                        
                        <Card variant="outlined" padding="md" className="hover:border-primary-300 transition-colors">
                          <label className="flex items-start gap-3 cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={profileData.price_alerts}
                              onChange={(e) => setProfileData({ ...profileData, price_alerts: e.target.checked })}
                              className="mt-1 w-5 h-5 text-primary-600 rounded focus:ring-2 focus:ring-primary-500" 
                            />
                            <div>
                              <span className="text-sm font-medium text-gray-900 block mb-1">Enable price alerts</span>
                              <span className="text-xs text-gray-600">Get notified when prices drop on your favorite items</span>
                            </div>
                          </label>
                        </Card>
                      </div>
                    )}

                    <div className="pt-4 border-t border-gray-200">
                      <Button
                        onClick={handleSave}
                        disabled={saving}
                        size="lg"
                        leftIcon={<Save className="w-4 h-4" />}
                      >
                        {saving ? 'Saving...' : 'Save Preferences'}
                      </Button>
                    </div>
                  </div>
                )}

                {activeTab === 'notifications' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Notification Settings</h3>
                      <p className="text-sm text-gray-600">
                        Choose how you want to be notified about group activities.
                      </p>
                    </div>
                    
                    <div className="space-y-4">
                      <Card variant="outlined" padding="md" className="hover:border-primary-300 transition-colors">
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={profileData.email_notifications}
                            onChange={(e) => setProfileData({ ...profileData, email_notifications: e.target.checked })}
                            className="mt-1 w-5 h-5 text-primary-600 rounded focus:ring-2 focus:ring-primary-500" 
                          />
                          <div>
                            <span className="text-sm font-medium text-gray-900 block mb-1">Email notifications</span>
                            <span className="text-xs text-gray-600">Receive emails about new group deals and updates</span>
                          </div>
                        </label>
                      </Card>
                      
                      <Card variant="outlined" padding="md" className="hover:border-primary-300 transition-colors">
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={profileData.push_notifications}
                            onChange={(e) => setProfileData({ ...profileData, push_notifications: e.target.checked })}
                            className="mt-1 w-5 h-5 text-primary-600 rounded focus:ring-2 focus:ring-primary-500" 
                          />
                          <div>
                            <span className="text-sm font-medium text-gray-900 block mb-1">Push notifications</span>
                            <span className="text-xs text-gray-600">Get real-time updates for deal progress</span>
                          </div>
                        </label>
                      </Card>
                      
                      <Card variant="outlined" padding="md" className="hover:border-primary-300 transition-colors">
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={profileData.sms_notifications}
                            onChange={(e) => setProfileData({ ...profileData, sms_notifications: e.target.checked })}
                            className="mt-1 w-5 h-5 text-primary-600 rounded focus:ring-2 focus:ring-primary-500" 
                          />
                          <div>
                            <span className="text-sm font-medium text-gray-900 block mb-1">SMS alerts</span>
                            <span className="text-xs text-gray-600">Receive text messages for closing deals</span>
                          </div>
                        </label>
                      </Card>
                      
                      <Card variant="outlined" padding="md" className="hover:border-primary-300 transition-colors">
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={profileData.weekly_summary}
                            onChange={(e) => setProfileData({ ...profileData, weekly_summary: e.target.checked })}
                            className="mt-1 w-5 h-5 text-primary-600 rounded focus:ring-2 focus:ring-primary-500" 
                          />
                          <div>
                            <span className="text-sm font-medium text-gray-900 block mb-1">Weekly summary</span>
                            <span className="text-xs text-gray-600">Get a weekly email summary of your activity</span>
                          </div>
                        </label>
                      </Card>
                      
                      <Card variant="outlined" padding="md" className="hover:border-primary-300 transition-colors">
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={profileData.price_alerts_enabled}
                            onChange={(e) => setProfileData({ ...profileData, price_alerts_enabled: e.target.checked })}
                            className="mt-1 w-5 h-5 text-primary-600 rounded focus:ring-2 focus:ring-primary-500" 
                          />
                          <div>
                            <span className="text-sm font-medium text-gray-900 block mb-1">Price alerts</span>
                            <span className="text-xs text-gray-600">Be notified when your favorite products go on sale</span>
                          </div>
                        </label>
                      </Card>
                    </div>

                    <div className="pt-4 border-t border-gray-200">
                      <Button
                        onClick={handleSave}
                        disabled={saving}
                        size="lg"
                        leftIcon={<Save className="w-4 h-4" />}
                      >
                        {saving ? 'Saving...' : 'Save Notification Settings'}
                      </Button>
                    </div>
                  </div>
                )}

                {activeTab === 'security' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Security Settings</h3>
                      <p className="text-sm text-gray-600">
                        Manage your account security and authentication.
                      </p>
                    </div>
                    
                    {/* Change Password Section */}
                    <Card variant="elevated" padding="lg">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-primary-100 rounded-lg">
                          <Lock className="w-5 h-5 text-primary-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">Change Password</h4>
                          <p className="text-sm text-gray-600">Update your password to keep your account secure</p>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                          <input
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="Enter current password"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                          <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="Enter new password"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                          <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="Confirm new password"
                          />
                        </div>
                        <Button
                          onClick={handleChangePassword}
                          disabled={saving || !currentPassword || !newPassword || !confirmPassword}
                          size="lg"
                          leftIcon={<Lock className="w-4 h-4" />}
                        >
                          {saving ? 'Changing...' : 'Change Password'}
                        </Button>
                      </div>
                    </Card>

                    {/* Two-Factor Authentication */}
                    <Card variant="outlined" padding="lg">
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-warning-100 rounded-lg">
                          <Shield className="w-5 h-5 text-warning-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-1">Two-Factor Authentication</h4>
                          <p className="text-sm text-gray-600 mb-3">Add an extra layer of security to your account</p>
                          <Button variant="secondary" size="md">
                            Enable 2FA
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </div>
                )}

                {profileData.is_supplier && activeTab === 'banking' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Banking Information</h3>
                      <p className="text-sm text-gray-600">
                        Manage your banking details for payments and transactions.
                      </p>
                    </div>
                    
                    <Card variant="elevated" padding="lg">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-success-100 rounded-lg">
                          <CreditCard className="w-5 h-5 text-success-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">Bank Account Details</h4>
                          <p className="text-sm text-gray-600">Securely store your banking information</p>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Account Holder Name</label>
                          <input
                            type="text"
                            value={profileData.bank_account_name}
                            onChange={(e) => setProfileData({ ...profileData, bank_account_name: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="Enter account holder name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Account Number</label>
                          <input
                            type="text"
                            value={profileData.bank_account_number}
                            onChange={(e) => setProfileData({ ...profileData, bank_account_number: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="Enter account number"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Bank Name</label>
                          <input
                            type="text"
                            value={profileData.bank_name}
                            onChange={(e) => setProfileData({ ...profileData, bank_name: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="Enter bank name"
                          />
                        </div>
                      </div>
                    </Card>

                    <div className="pt-4 border-t border-gray-200">
                      <Button
                        onClick={handleSave}
                        disabled={saving}
                        size="lg"
                        leftIcon={<Save className="w-4 h-4" />}
                      >
                        {saving ? 'Saving...' : 'Save Banking Information'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </>
        )}
      </PageContainer>

      <MobileBottomNav userRole={role} />
    </div>
  );
}
