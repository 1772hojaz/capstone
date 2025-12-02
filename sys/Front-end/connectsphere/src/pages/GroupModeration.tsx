import { useState, useEffect } from 'react';
import { 
  Search, Shield, Plus, Users, Package, DollarSign, 
  CheckCircle2, Clock, Eye, Edit2, Trash2, AlertCircle,
  TrendingUp, ShoppingBag, Calendar, XCircle, Loader2, Upload, Send
} from 'lucide-react';
import apiService from '../services/api';
import TopNavigation from '../components/navigation/TopNavigation';
import MobileBottomNav from '../components/navigation/MobileBottomNav';
import { PageContainer, PageHeader } from '../components/layout/index';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input, Textarea } from '../components/ui/Input';
import { SkeletonCard } from '../components/feedback/Skeleton';
import { ErrorAlert } from '../components/feedback/ErrorAlert';
import { EmptyState } from '../components/feedback/EmptyState';

type TabType = 'active' | 'ready' | 'completed';

interface ModerationStats {
  active_groups: number;
  total_members: number;
  ready_for_payment: number;
  required_action: number;
  completed_groups: number;
}

const GroupModeration = () => {
  const [activeTab, setActiveTab] = useState<TabType>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Data states
  const [stats, setStats] = useState<ModerationStats>({
    active_groups: 0,
    total_members: 0,
    ready_for_payment: 0,
    required_action: 0,
    completed_groups: 0
  });
  const [activeGroups, setActiveGroups] = useState<any[]>([]);
  const [readyGroups, setReadyGroups] = useState<any[]>([]);
  const [completedGroups, setCompletedGroups] = useState<any[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    long_description: '',
    category: '',
    price: '',
    original_price: '',
    image: '',
    max_participants: '',
    end_date: '',
    shipping_info: '',
    estimated_delivery: '',
    manufacturer: '',
    total_stock: '',
    features: '',
    requirements: ''
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploadingImage, setUploadingImage] = useState(false);

  // Fetch moderation data
  useEffect(() => {
    fetchModerationData();
  }, []);

  // Debug: Log state changes
  useEffect(() => {
    console.log('State updated:', {
      activeGroups: activeGroups.length,
      readyGroups: readyGroups.length,
      completedGroups: completedGroups.length
    });
  }, [activeGroups, readyGroups, completedGroups]);

    const fetchModerationData = async () => {
      try {
        setLoading(true);
        setError(null);

      // Fetch data from API
      const [statsData, activeData, readyData, completedData] = await Promise.all([
        apiService.getGroupModerationStats(),
        apiService.getActiveGroups(),
        apiService.getReadyForPaymentGroups(),
        apiService.getCompletedGroups()
      ]);

      console.log('API Response:', { statsData, activeData, readyData, completedData });
      console.log('Active Groups Count:', activeData?.length || 0);
      console.log('Ready Groups Count:', readyData?.length || 0);
      console.log('Completed Groups Count:', completedData?.length || 0);
      
      if (readyData && readyData.length > 0) {
        console.log('Ready for Payment Groups:', readyData);
      } else {
        console.warn('No ready for payment groups received from API');
      }
      
      if (completedData && completedData.length > 0) {
        console.log('Completed Groups:', completedData);
      } else {
        console.warn('No completed groups received from API');
      }

      setStats(statsData || {
        active_groups: activeData?.length || 0,
        total_members: 0,
        ready_for_payment: readyData?.length || 0,
        required_action: readyData?.length || 0,
        completed_groups: completedData?.length || 0
      });
      
      setActiveGroups(activeData || []);
      setReadyGroups(readyData || []);
      setCompletedGroups(completedData || []);
    } catch (err: any) {
      console.error('Failed to load moderation data:', err);
      setError('Failed to load moderation data. Please try again.');
      } finally {
        setLoading(false);
      console.log('Loading complete. Stats:', stats);
    }
  };

  // Filter groups based on search
  const filterGroups = (groups: any[]) => {
    if (!searchQuery.trim()) return groups;
    
    const query = searchQuery.toLowerCase();
    return groups.filter(group => 
      group.name?.toLowerCase().includes(query) ||
      group.description?.toLowerCase().includes(query) ||
      group.category?.toLowerCase().includes(query) ||
      group.product?.name?.toLowerCase().includes(query)
    );
  };

  // Get current groups based on active tab
  const getCurrentGroups = () => {
    let groups;
    switch (activeTab) {
      case 'active':
        groups = filterGroups(activeGroups);
        console.log(`[${activeTab}] Showing ${groups.length} groups from ${activeGroups.length} total`);
        return groups;
      case 'ready':
        groups = filterGroups(readyGroups);
        console.log(`[${activeTab}] Showing ${groups.length} groups from ${readyGroups.length} total`);
        return groups;
      case 'completed':
        groups = filterGroups(completedGroups);
        console.log(`[${activeTab}] Showing ${groups.length} groups from ${completedGroups.length} total`);
        return groups;
      default:
        return [];
    }
  };

  const handleViewGroup = (group: any) => {
    setSelectedGroup(group);
    setShowViewModal(true);
  };

  const handleEditGroup = (group: any) => {
    setSelectedGroup(group);
    setFormData({
      name: group.name || '',
      description: group.description || '',
      long_description: group.product?.description || group.description || '',
      category: group.category || '',
      price: group.product?.bulkPrice?.replace('$', '') || '',
      original_price: group.product?.regularPrice?.replace('$', '') || '',
      image: group.product?.image || '',
      max_participants: group.targetMembers?.toString() || '',
      end_date: group.dueDate || '',
      shipping_info: '',
      estimated_delivery: '',
      manufacturer: group.product?.manufacturer || '',
      total_stock: group.product?.totalStock || '',
      features: '',
      requirements: ''
    });
    setImagePreview(group.product?.image || '');
    setShowEditModal(true);
  };

  const handleDeleteGroup = async (groupId: number) => {
    if (!confirm('Are you sure you want to delete this group?')) return;

    try {
      await apiService.deleteAdminGroup(groupId);
      await fetchModerationData();
      alert('Group deleted successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to delete group');
    }
  };

  const handleProcessPayment = async (group: any) => {
    try {
      await apiService.processGroupPayment(group.id);
      await fetchModerationData();
      alert('Payment processed successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to process payment');
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);

    try {
      let imageUrl = formData.image;

      // Upload image if a new file is selected
      if (imageFile) {
        setUploadingImage(true);
        try {
          const uploadResult = await apiService.uploadImage(imageFile);
          imageUrl = uploadResult.image_url;
        } catch (err: any) {
          alert('Failed to upload image: ' + err.message);
          return;
        } finally {
          setUploadingImage(false);
        }
      }

      if (!imageUrl || imageUrl.trim() === '') {
        alert('Please upload an image or provide an image URL');
        return;
      }

      const updateData = {
        name: formData.name,
        description: formData.description,
        long_description: formData.long_description || formData.description,
        category: formData.category,
        price: parseFloat(formData.price),
        original_price: parseFloat(formData.original_price),
        image: imageUrl,
        max_participants: formData.max_participants ? parseInt(formData.max_participants) : null,
        end_date: new Date(formData.end_date).toISOString(),
        admin_name: 'Admin',
        shipping_info: formData.shipping_info,
        estimated_delivery: formData.estimated_delivery,
        manufacturer: formData.manufacturer,
        total_stock: parseInt(formData.total_stock) || 100,
        features: formData.features ? formData.features.split(',').map(f => f.trim()) : [],
        requirements: formData.requirements ? formData.requirements.split(',').map(r => r.trim()) : []
      };

      await apiService.updateAdminGroup(selectedGroup.id, updateData);
      
      setImageFile(null);
      setImagePreview('');
      setShowEditModal(false);
      setSelectedGroup(null);
      
      await fetchModerationData();
      alert('Group updated successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to update group');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      let imageUrl = formData.image;

      // Upload image if file is selected
      if (imageFile) {
        setUploadingImage(true);
        try {
          const uploadResult = await apiService.uploadImage(imageFile);
          imageUrl = uploadResult.image_url;
        } catch (err: any) {
          alert('Failed to upload image: ' + err.message);
          return;
        } finally {
          setUploadingImage(false);
        }
      }

      if (!imageUrl) {
        alert('Please upload an image');
        return;
      }

      const createData = {
        name: formData.name,
        description: formData.description,
        long_description: formData.long_description || formData.description,
        category: formData.category,
        price: parseFloat(formData.price),
        original_price: parseFloat(formData.original_price),
        image: imageUrl,
        max_participants: parseInt(formData.max_participants),
        end_date: new Date(formData.end_date).toISOString(),
        admin_name: 'Admin',
        shipping_info: formData.shipping_info,
        estimated_delivery: formData.estimated_delivery,
        manufacturer: formData.manufacturer,
        total_stock: parseInt(formData.total_stock) || 100,
        features: formData.features ? formData.features.split(',').map(f => f.trim()) : [],
        requirements: formData.requirements ? formData.requirements.split(',').map(r => r.trim()) : []
      };

      await apiService.createAdminGroup(createData);
      
      // Reset form and close modal
      setFormData({
        name: '',
        description: '',
        long_description: '',
        category: '',
        price: '',
        original_price: '',
        image: '',
        max_participants: '',
        end_date: '',
        shipping_info: '',
        estimated_delivery: '',
        manufacturer: '',
        total_stock: '',
        features: '',
        requirements: ''
      });
      setImageFile(null);
      setImagePreview('');
      setShowCreateModal(false);
      
      // Refresh data
      await fetchModerationData();
      alert('Group created successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to create group');
    } finally {
      setIsCreating(false);
    }
  };

  const tabs = [
    { id: 'active', label: 'Active Groups', count: stats.active_groups, icon: ShoppingBag },
    { id: 'ready', label: 'Ready for Payment', count: stats.ready_for_payment, icon: DollarSign },
    { id: 'completed', label: 'Completed', count: stats.completed_groups, icon: CheckCircle2 },
  ];

  const statCards = [
    {
      label: 'Active Groups',
      value: stats.active_groups,
      icon: ShoppingBag,
      color: 'primary',
      bgColor: 'bg-primary-50',
      iconBg: 'bg-primary-500',
      textColor: 'text-primary-600'
    },
    {
      label: 'Total Members',
      value: stats.total_members,
      icon: Users,
      color: 'success',
      bgColor: 'bg-success-50',
      iconBg: 'bg-success-500',
      textColor: 'text-success-600'
    },
    {
      label: 'Ready for Payment',
      value: stats.ready_for_payment,
      icon: DollarSign,
      color: 'warning',
      bgColor: 'bg-warning-50',
      iconBg: 'bg-warning-500',
      textColor: 'text-warning-600'
    },
    {
      label: 'Completed',
      value: stats.completed_groups,
      icon: CheckCircle2,
      color: 'info',
      bgColor: 'bg-info-50',
      iconBg: 'bg-info-500',
      textColor: 'text-info-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-16 md:pb-0">
      <TopNavigation userRole="admin" />
      
      <PageContainer>
      {/* Header */}
        <PageHeader
          title="Group Moderation"
          description="Create and manage group buying opportunities"
          icon={<Shield className="h-8 w-8 text-primary-600" />}
          breadcrumbs={[
            { label: 'Admin' },
            { label: 'Moderation' }
          ]}
          actions={
            <Button
              variant="primary"
              leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setShowCreateModal(true)}
            >
              Create Group
            </Button>
          }
        />

      {/* Loading State */}
      {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
        </div>
      )}

      {/* Error State */}
      {error && (
          <ErrorAlert
            title="Failed to load data"
            message={error}
            onRetry={fetchModerationData}
            variant="card"
          />
        )}

        {/* Content */}
      {!loading && !error && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {statCards.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <Card key={index} variant="elevated" padding="lg">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-3 rounded-xl ${stat.iconBg}`}>
                        <Icon className="h-6 w-6 text-white" />
              </div>
                      <Badge variant={stat.color as any} size="sm">
                        {stat.label.split(' ')[0]}
                      </Badge>
              </div>
                    <p className="text-sm font-medium text-gray-600 mb-1">{stat.label}</p>
                    <p className={`text-3xl font-bold ${stat.textColor}`}>{stat.value}</p>
                  </Card>
                );
              })}
                  </div>

            {/* Tabs and Search */}
            <Card padding="none">
              <div className="p-6 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  {/* Tabs */}
                  <div className="flex flex-wrap gap-2">
                    {tabs.map(tab => {
                      const Icon = tab.icon;
                      return (
                  <button
                          key={tab.id}
                          onClick={() => {
                            console.log(`Switching to tab: ${tab.id}`);
                            setActiveTab(tab.id as TabType);
                            // Clear search when switching tabs
                            setSearchQuery('');
                          }}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                            activeTab === tab.id
                              ? 'bg-primary-500 text-white shadow-md'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          <span>{tab.label}</span>
                          <Badge 
                            variant={activeTab === tab.id ? 'primary' : 'secondary'}
                            size="sm"
                          >
                            {tab.count}
                          </Badge>
                  </button>
                      );
                    })}
        </div>

                  {/* Search */}
            <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                      placeholder="Search groups..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-full sm:w-64"
              />
            </div>
          </div>
              </div>

              {/* Groups List */}
              <div className="p-6">
                {(() => {
                  const currentGroups = getCurrentGroups();
                  console.log(`Rendering groups for tab "${activeTab}":`, {
                    count: currentGroups.length,
                    groups: currentGroups
                  });
                  
                  if (currentGroups.length === 0) {
                    console.log(`No groups to display for tab "${activeTab}"`);
                return (
                      <EmptyState
                        icon="package"
                        title={searchQuery ? 'No groups found' : `No ${activeTab} groups`}
                        description={searchQuery ? 'Try adjusting your search query' : `There are currently no ${activeTab} groups`}
                      />
                    );
                  }
                  
                  console.log(`Rendering ${currentGroups.length} group cards`);
                  return (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {currentGroups.map(group => {
                        console.log(`  Rendering card for: ${group.name || 'Unknown'}`);
                        return (
                          <GroupCard
                            key={group.id}
                            group={group}
                            onView={handleViewGroup}
                            onEdit={handleEditGroup}
                            onDelete={handleDeleteGroup}
                            onProcessPayment={handleProcessPayment}
                            showPaymentButton={activeTab === 'ready'}
                          />
                        );
                      })}
            </div>
                  );
                })()}
                    </div>
            </Card>
                      </div>
        )}
      </PageContainer>

      <MobileBottomNav userRole="admin" />

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Create New Group</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 transition"
                >
                <XCircle className="h-6 w-6" />
                </button>
            </div>

            <form onSubmit={handleCreateGroup} className="p-6 space-y-6">
              {/* Basic Info */}
                  <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900">Basic Information</h4>
                
                <Input
                  label="Group Name"
                  placeholder="e.g., Bulk Rice Purchase"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />

                    <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Select category</option>
                    <option value="Grocery">Grocery</option>
                    <option value="Vegetables">Vegetables</option>
                    <option value="Fruits">Fruits</option>
                    <option value="Grains & Cereals">Grains & Cereals</option>
                    <option value="Cooking Essentials">Cooking Essentials</option>
                    <option value="Meat & Poultry">Meat & Poultry</option>
                    <option value="Fish & Kapenta">Fish & Kapenta</option>
                    <option value="Dairy Products">Dairy Products</option>
                    <option value="Beverages">Beverages</option>
                    <option value="Tobacco & Cash Crops">Tobacco & Cash Crops</option>
                    <option value="Livestock">Livestock</option>
                    <option value="Seeds & Fertilizers">Seeds & Fertilizers</option>
                    <option value="Traditional Medicines">Traditional Medicines</option>
                    <option value="Arts & Crafts">Arts & Crafts</option>
                    <option value="Building Materials">Building Materials</option>
                    <option value="Hardware & Tools">Hardware & Tools</option>
                    <option value="Household Items">Household Items</option>
                    <option value="Clothing & Textiles">Clothing & Textiles</option>
                    <option value="Stationery & Books">Stationery & Books</option>
                    <option value="Electronics & Appliances">Electronics & Appliances</option>
                    <option value="Fuel & Energy">Fuel & Energy</option>
                    <option value="Others">Others</option>
                  </select>
                    </div>

                <Textarea
                  label="Description"
                  placeholder="Describe the group buy opportunity..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  required
                />

                <Textarea
                  label="Long Description (Optional)"
                  placeholder="Detailed information about the product and group buy..."
                  value={formData.long_description}
                  onChange={(e) => setFormData({ ...formData, long_description: e.target.value })}
                  rows={4}
                />
                  </div>

              {/* Pricing */}
                  <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900">Pricing</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Regular Price ($)"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.original_price}
                    onChange={(e) => setFormData({ ...formData, original_price: e.target.value })}
                    required
                  />

                  <Input
                    label="Bulk Price ($)"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                          </div>

                {/* Price Savings Preview */}
                {formData.original_price && formData.price && (
                  <Card variant="filled" className="p-3 bg-green-50 border-green-200">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-green-700">Savings per unit:</span>
                      <span className="font-bold text-green-700">
                        ${(parseFloat(formData.original_price) - parseFloat(formData.price)).toFixed(2)}
                        {' '}
                        ({((1 - parseFloat(formData.price) / parseFloat(formData.original_price)) * 100).toFixed(0)}% off)
                      </span>
                        </div>
                  </Card>
                      )}
                    </div>

              {/* Group Details */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900">Group Details</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Max Participants"
                        type="number"
                    placeholder="10"
                    value={formData.max_participants}
                    onChange={(e) => setFormData({ ...formData, max_participants: e.target.value })}
                    helperText="Maximum number of participants"
                    required
                  />

                  <Input
                    label="End Date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    required
                      />
                    </div>

                <Input
                  label="Total Stock"
                  type="number"
                  placeholder="100"
                  value={formData.total_stock}
                  onChange={(e) => setFormData({ ...formData, total_stock: e.target.value })}
                  helperText="Total units available"
                />

                <Input
                  label="Manufacturer"
                  placeholder="Manufacturer name"
                  value={formData.manufacturer}
                  onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                      />
                    </div>

              {/* Delivery Information */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900">Delivery Information</h4>
                
                <Input
                  label="Shipping Info"
                  placeholder="Delivery method and details"
                  value={formData.shipping_info}
                  onChange={(e) => setFormData({ ...formData, shipping_info: e.target.value })}
                />

                <Input
                  label="Estimated Delivery"
                  placeholder="e.g., 3-5 business days"
                  value={formData.estimated_delivery}
                  onChange={(e) => setFormData({ ...formData, estimated_delivery: e.target.value })}
                      />
                    </div>

              {/* Image Upload */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900">Product Image</h4>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-2 text-gray-500" />
                        <p className="text-sm text-gray-500">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageChange}
                      />
                    </label>
                    </div>

                  {imagePreview && (
                    <div className="flex items-center justify-center">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-48 h-48 object-cover rounded-lg border-2 border-primary-200"
                      />
                    </div>
                  )}

                  {uploadingImage && (
                    <div className="flex items-center justify-center gap-2 text-sm text-primary-600">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Uploading image to Cloudinary...</span>
                  </div>
                  )}
                </div>
              </div>

              {/* Additional Fields */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900">Additional Information</h4>
                
                <Input
                  label="Features (comma-separated)"
                  placeholder="e.g., Organic, Locally sourced, Fresh"
                  value={formData.features}
                  onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                  helperText="Separate features with commas"
                />

                <Input
                  label="Requirements (comma-separated)"
                  placeholder="e.g., Min. order 5 units, Advance payment required"
                  value={formData.requirements}
                  onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                  helperText="Separate requirements with commas"
                />
            </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1"
                  disabled={isCreating || uploadingImage}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="flex-1"
                  disabled={isCreating || uploadingImage}
                >
                  {isCreating || uploadingImage ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      {uploadingImage ? 'Uploading...' : 'Creating...'}
                    </>
                  ) : (
                    'Create Group'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Group Modal */}
      {showViewModal && selectedGroup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Group Details</h3>
                  <button
                    onClick={() => {
                  setShowViewModal(false);
                  setSelectedGroup(null);
                    }}
                className="text-gray-400 hover:text-gray-600 transition"
                  >
                <XCircle className="h-6 w-6" />
                  </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Image */}
              {selectedGroup.product?.image && (
                <div className="flex justify-center">
                  <img
                    src={selectedGroup.product.image}
                    alt={selectedGroup.name}
                    className="w-full max-w-md h-64 object-cover rounded-lg"
                />
              </div>
              )}

              {/* Basic Info */}
                  <div>
                <h4 className="text-2xl font-bold text-gray-900 mb-2">{selectedGroup.name}</h4>
                <Badge variant="primary" size="lg">{selectedGroup.category}</Badge>
                  </div>

              <div className="space-y-4">
                  <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                  <p className="text-gray-600">{selectedGroup.description}</p>
                  </div>

                {/* Pricing */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Regular Price</label>
                    <p className="text-2xl font-bold text-gray-500 line-through">{selectedGroup.product?.regularPrice}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <label className="block text-sm font-semibold text-green-700 mb-1">Bulk Price</label>
                    <p className="text-2xl font-bold text-green-700">{selectedGroup.product?.bulkPrice}</p>
                  </div>
                  </div>

                {/* Participants */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-semibold text-blue-700">Progress</label>
                    <span className="text-sm text-blue-700">
                      {selectedGroup.members || 0}/{selectedGroup.targetMembers || 0} participants
                    </span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-3">
                    <div
                      className="bg-blue-600 h-3 rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, ((selectedGroup.members || 0) / (selectedGroup.targetMembers || 1)) * 100)}%`
                      }}
                    ></div>
                </div>
              </div>

                {/* Additional Details */}
                <div className="grid grid-cols-2 gap-4">
                  {selectedGroup.dueDate && (
                  <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Due Date</label>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(selectedGroup.dueDate).toLocaleDateString()}</span>
                  </div>
                  </div>
                  )}
                  {selectedGroup.totalAmount && (
                  <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Total Amount</label>
                      <div className="flex items-center gap-2 text-green-600 font-bold">
                        <DollarSign className="h-4 w-4" />
                        <span>{selectedGroup.totalAmount}</span>
                  </div>
                  </div>
                  )}
              </div>

                {selectedGroup.product?.manufacturer && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Manufacturer</label>
                    <p className="text-gray-600">{selectedGroup.product.manufacturer}</p>
                  </div>
                )}

                {selectedGroup.product?.totalStock && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Total Stock</label>
                    <p className="text-gray-600">{selectedGroup.product.totalStock} units</p>
                  </div>
                )}

                  <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Created By</label>
                    <div className="flex items-center gap-2">
                    <Badge variant="secondary">{selectedGroup.creator_type || 'Supplier'}</Badge>
                    <span className="text-gray-600">{selectedGroup.creator}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowViewModal(false);
                    handleEditGroup(selectedGroup);
                  }}
                  className="flex-1"
                  leftIcon={<Edit2 className="h-4 w-4" />}
                >
                  Edit Group
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowViewModal(false);
                    setSelectedGroup(null);
                  }}
                  className="flex-1"
                >
                  Close
                </Button>
                      </div>
                    </div>
                  </div>
                </div>
      )}

      {/* Edit Group Modal */}
      {showEditModal && selectedGroup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Edit Group</h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedGroup(null);
                  setImageFile(null);
                  setImagePreview('');
                }}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <XCircle className="h-6 w-6" />
              </button>
              </div>

            <form onSubmit={handleUpdateGroup} className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900">Basic Information</h4>
                
                <Input
                  label="Group Name"
                  placeholder="e.g., Bulk Rice Purchase"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />

                  <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Select category</option>
                    <option value="Grocery">Grocery</option>
                    <option value="Vegetables">Vegetables</option>
                    <option value="Fruits">Fruits</option>
                    <option value="Grains & Cereals">Grains & Cereals</option>
                    <option value="Cooking Essentials">Cooking Essentials</option>
                    <option value="Meat & Poultry">Meat & Poultry</option>
                    <option value="Fish & Kapenta">Fish & Kapenta</option>
                    <option value="Dairy Products">Dairy Products</option>
                    <option value="Beverages">Beverages</option>
                    <option value="Tobacco & Cash Crops">Tobacco & Cash Crops</option>
                    <option value="Livestock">Livestock</option>
                    <option value="Seeds & Fertilizers">Seeds & Fertilizers</option>
                    <option value="Traditional Medicines">Traditional Medicines</option>
                    <option value="Arts & Crafts">Arts & Crafts</option>
                    <option value="Building Materials">Building Materials</option>
                    <option value="Hardware & Tools">Hardware & Tools</option>
                    <option value="Household Items">Household Items</option>
                    <option value="Clothing & Textiles">Clothing & Textiles</option>
                    <option value="Stationery & Books">Stationery & Books</option>
                    <option value="Electronics & Appliances">Electronics & Appliances</option>
                    <option value="Fuel & Energy">Fuel & Energy</option>
                    <option value="Others">Others</option>
                  </select>
                  </div>

                <Textarea
                  label="Description"
                  placeholder="Describe the group buy opportunity..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  required
                />
                  </div>

              {/* Pricing */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900">Pricing</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Regular Price ($)"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.original_price}
                    onChange={(e) => setFormData({ ...formData, original_price: e.target.value })}
                    required
                  />

                  <Input
                    label="Bulk Price ($)"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Group Details */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900">Group Details</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Max Participants (Optional)"
                    type="number"
                    placeholder="20"
                    value={formData.max_participants}
                    onChange={(e) => setFormData({ ...formData, max_participants: e.target.value })}
                    helperText="Leave empty for unlimited"
                  />

                  <Input
                    label="End Date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    required
                  />
                    </div>

                <Input
                  label="Manufacturer"
                  placeholder="Manufacturer name"
                  value={formData.manufacturer}
                  onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                />
                    </div>

              {/* Image Upload */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900">Product Image</h4>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-2 text-gray-500" />
                        <p className="text-sm text-gray-500">
                          <span className="font-semibold">Click to upload</span> new image
                        </p>
                    </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageChange}
                      />
                    </label>
                  </div>

                  {imagePreview && (
                    <div className="flex items-center justify-center">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-48 h-48 object-cover rounded-lg border-2 border-primary-200"
                      />
                </div>
              )}

                  {uploadingImage && (
                    <div className="flex items-center justify-center gap-2 text-sm text-primary-600">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Uploading image to Cloudinary...</span>
            </div>
                  )}
          </div>
        </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedGroup(null);
                    setImageFile(null);
                    setImagePreview('');
                  }}
                  className="flex-1"
                  disabled={isUpdating || uploadingImage}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="flex-1"
                  disabled={isUpdating || uploadingImage}
                >
                  {isUpdating || uploadingImage ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      {uploadingImage ? 'Uploading...' : 'Updating...'}
                    </>
                  ) : (
                    'Update Group'
                  )}
                </Button>
                    </div>
            </form>
                      </div>
                      </div>
      )}
                      </div>
  );
};

// Group Card Component
interface GroupCardProps {
  group: any;
  onView: (group: any) => void;
  onEdit: (group: any) => void;
  onDelete: (id: number) => void;
  onProcessPayment: (group: any) => void;
  showPaymentButton?: boolean;
}

const GroupCard = ({ group, onView, onEdit, onDelete, onProcessPayment, showPaymentButton }: GroupCardProps) => {
  return (
    <Card variant="elevated" padding="lg" className="hover:shadow-xl transition-shadow">
      <div className="flex gap-4 mb-4">
        {/* Image - Check multiple sources for image */}
        {(group.product?.image || group.image) && (
          <img
            src={group.product?.image || group.image || 'https://via.placeholder.com/96x96?text=Product'}
            alt={group.product?.name || group.name}
            className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
            onError={(e) => {
              e.currentTarget.src = 'https://via.placeholder.com/96x96?text=No+Image';
            }}
          />
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-bold text-lg text-gray-900 truncate">{group.name}</h3>
            <Badge variant="primary" size="sm">
              {group.members || 0}/{group.targetMembers || group.max_participants || 0}
            </Badge>
                      </div>
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{group.description}</p>
          
          {/* Meta info */}
          <div className="flex flex-wrap gap-2 text-xs">
            <Badge variant="secondary" size="sm">
              {group.category}
            </Badge>
            {group.dueDate && (
              <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full">
                <Calendar className="h-3 w-3" />
                <span>{new Date(group.dueDate).toLocaleDateString()}</span>
                      </div>
            )}
            {group.totalAmount && (
              <div className="flex items-center gap-1 px-2 py-1 bg-success-100 rounded-full text-success-700">
                <DollarSign className="h-3 w-3" />
                <span>{group.totalAmount}</span>
                    </div>
            )}
                        </div>
                          </div>
                          </div>

      {/* Product Info */}
      <div className="bg-gray-50 rounded-lg p-3 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Package className="h-4 w-4 text-primary-600" />
          <span className="font-semibold text-sm">{group.product?.name || group.name}</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-gray-500">Regular:</span>
            <span className="font-semibold ml-1">{group.product?.regularPrice || group.product?.unit_price || group.original_price || 'N/A'}</span>
          </div>
          <div>
            <span className="text-success-600">Bulk:</span>
            <span className="font-semibold ml-1 text-success-700">{group.product?.bulkPrice || group.product?.bulk_price || group.price || 'N/A'}</span>
          </div>
        </div>
        {/* Additional details */}
        <div className="mt-2 pt-2 border-t border-gray-200 text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-500">Current Amount:</span>
            <span className="font-semibold text-success-700">{group.currentAmount || group.current_amount || '$0.00'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Target Amount:</span>
            <span className="font-semibold text-gray-700">{group.targetAmount || group.target_amount || '$0.00'}</span>
          </div>
        </div>
      </div>

      {/* Collection Tracking - Only show for completed groups */}
      {group.collection_tracking && (
        <div className="bg-blue-50 rounded-lg p-3 mb-4 border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-4 w-4 text-blue-600" />
            <span className="font-semibold text-sm text-blue-900">
              Collection Progress: {group.collection_tracking.collection_progress}
            </span>
          </div>
          
          {/* Collection Summary */}
          <div className="grid grid-cols-2 gap-2 text-xs mb-3">
            <div className="bg-green-100 rounded px-2 py-1">
              <span className="text-gray-600">Collected:</span>
              <span className="font-semibold ml-1 text-green-700">{group.collection_tracking.collected_count}</span>
            </div>
            <div className="bg-orange-100 rounded px-2 py-1">
              <span className="text-gray-600">Pending:</span>
              <span className="font-semibold ml-1 text-orange-700">{group.collection_tracking.pending_count}</span>
            </div>
          </div>

          {/* Collected Users */}
          {group.collection_tracking.collected_users.length > 0 && (
            <div className="mb-2">
              <p className="text-xs font-semibold text-green-700 mb-1">✓ Collected:</p>
              <div className="space-y-1">
                {group.collection_tracking.collected_users.map((user: any) => (
                  <div key={user.id} className="text-xs bg-white rounded px-2 py-1 flex items-center justify-between">
                    <span className="text-gray-700">{user.name}</span>
                    <span className="text-gray-500">×{user.quantity}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pending Users */}
          {group.collection_tracking.pending_users.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-orange-700 mb-1">⏳ Pending Collection:</p>
              <div className="space-y-1">
                {group.collection_tracking.pending_users.map((user: any) => (
                  <div key={user.id} className="text-xs bg-white rounded px-2 py-1 flex items-center justify-between">
                    <span className="text-gray-700">{user.name}</span>
                    <span className="text-gray-500">×{user.quantity}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          leftIcon={<Eye className="h-4 w-4" />}
          className="flex-1"
          onClick={() => onView(group)}
        >
          View
        </Button>
        <Button
          variant="outline"
          size="sm"
          leftIcon={<Edit2 className="h-4 w-4" />}
          className="flex-1"
          onClick={() => onEdit(group)}
        >
          Edit
        </Button>
        {showPaymentButton && (
          <Button
            variant={group.supplier_confirmed ? "success" : "primary"}
            size="sm"
            leftIcon={group.supplier_confirmed ? <DollarSign className="h-4 w-4" /> : <Send className="h-4 w-4" />}
            className="flex-1"
            onClick={() => onProcessPayment(group)}
          >
            {group.action_needed || (group.supplier_confirmed ? "Pay Now" : "Send")}
          </Button>
        )}
        <Button
          variant="danger"
          size="sm"
          leftIcon={<Trash2 className="h-4 w-4" />}
          onClick={() => onDelete(group.id)}
        >
          Delete
        </Button>
                  </div>
    </Card>
  );
};

export default GroupModeration;
