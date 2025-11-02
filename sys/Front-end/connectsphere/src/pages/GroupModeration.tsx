import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import apiService from '../services/api';
import { 
  Search, 
  Shield, 
  XCircle,
  DollarSign,
  CheckCircle2,
  Loader2,
  Users,
  Calendar,
  Clock,
  Plus,
  Package,
  AlertTriangle,
  ShoppingBag,
  X,
  Trash2,
  Edit2,
  Save
} from 'lucide-react';

const GroupModeration = () => {
  const [showPaymentModal, setShowPaymentModal] = React.useState(false);
  const [selectedPaymentGroup, setSelectedPaymentGroup] = React.useState<any>(null);
  type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed';
  const [paymentStatus, setPaymentStatus] = React.useState<PaymentStatus>('pending');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedGroup, setEditedGroup] = useState<any>(null);
  interface NewGroup {
    name: string;
    description: string;
    category: string;
    targetMembers: string;
    price: string;
    dueDate: string;
    location: string;
    productName: string;
    productDescription: string;
    productImage: File | null;
    imagePreview: string | null;
    regularPrice: string;
    bulkPrice: string;
    totalStock: string;
    specifications: string;
    manufacturer: string;
    warranty: string;
  }

  const [newGroup, setNewGroup] = useState<NewGroup>({
    name: '',
    description: '',
    category: '',
    targetMembers: '',
    price: '',
    dueDate: '',
    location: '',
    productName: '',
    productDescription: '',
    productImage: null,
    imagePreview: null,
    regularPrice: '',
    bulkPrice: '',
    totalStock: '',
    specifications: '',
    manufacturer: '',
    warranty: ''
  });

  // State for dynamic data
  const [activeGroups, setActiveGroups] = useState<any[]>([]);
  const [readyForPaymentGroupsData, setReadyForPaymentGroupsData] = useState<any[]>([]);
  const [moderationStats, setModerationStats] = useState({
    active_groups: 0,
    total_members: 0,
    ready_for_payment: 0,
    required_action: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeGroupsSearch, setActiveGroupsSearch] = useState('');
  const [readyForPaymentSearch, setReadyForPaymentSearch] = useState('');

  // Fetch data on component mount
  useEffect(() => {
    const fetchModerationData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch stats
        const stats = await apiService.getGroupModerationStats();
        setModerationStats(stats);

        // Fetch active groups
        const activeData = await apiService.getActiveGroups();
        setActiveGroups(activeData);

        // Fetch ready for payment groups
        const readyData = await apiService.getReadyForPaymentGroups();
        setReadyForPaymentGroupsData(readyData);

      } catch (err) {
        console.error('Error fetching moderation data:', err);
        setError('Failed to load group moderation data');
      } finally {
        setLoading(false);
      }
    };

    fetchModerationData();
  }, []);

  const handlePaymentProcess = async (group: any) => {
    setSelectedPaymentGroup(group);
    setShowPaymentModal(true);
    setPaymentStatus('pending');
  };

  const processGroupPayment = async () => {
    try {
      setPaymentStatus('processing');
      // API call to process payment
      await apiService.processGroupPayment(selectedPaymentGroup.id);

      setPaymentStatus('completed');
      // Close modal after success feedback
      setTimeout(() => {
        setShowPaymentModal(false);
        setSelectedPaymentGroup(null);
        setPaymentStatus('pending');
        // Refresh data after payment processing
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Error processing payment:', error);
      setPaymentStatus('failed');
    }
  };


  const handleDeleteGroup = async (groupId: number) => {
    if (!window.confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
      return;
    }

    try {
      await apiService.deleteAdminGroup(groupId);
      // Refresh data after deletion
      const stats = await apiService.getGroupModerationStats();
      setModerationStats(stats);
      const activeData = await apiService.getActiveGroups();
      setActiveGroups(activeData);
      const readyData = await apiService.getReadyForPaymentGroups();
      setReadyForPaymentGroupsData(readyData);
      alert('Group deleted successfully!');
    } catch (error: any) {
      console.error('Failed to delete group:', error);
      alert(error.message || 'Failed to delete group. Please try again.');
    }
  };

  const handleViewDetails = async (group: any) => {
    try {
      // Fetch fresh group details from backend
      const response = await fetch(`http://localhost:8000/api/admin/groups/${group.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch group details');
      }

      const groupDetails = await response.json();
      setSelectedGroup(groupDetails);
      setEditedGroup({ ...groupDetails });
      setIsEditMode(false);
      setShowDetailsModal(true);
    } catch (error) {
      console.error('Error fetching group details:', error);
      // Fallback to using the group data we already have
      setSelectedGroup(group);
      setEditedGroup({ ...group });
      setIsEditMode(false);
      setShowDetailsModal(true);
    }
  };

  const handleEditGroup = () => {
    setIsEditMode(true);
  };

  const handleCancelEdit = () => {
    setEditedGroup({ ...selectedGroup });
    setIsEditMode(false);
  };

  const handleSaveEdit = async () => {
    try {
      // Prepare update data
      const updateData: any = {
        name: editedGroup.name,
        description: editedGroup.description,
        long_description: editedGroup.long_description || editedGroup.description,
        category: editedGroup.category,
        price: parseFloat(editedGroup.price),
        original_price: parseFloat(editedGroup.original_price),
        max_participants: parseInt(editedGroup.max_participants || editedGroup.targetMembers),
        shipping_info: editedGroup.shipping_info,
        estimated_delivery: editedGroup.estimated_delivery
      };

      // Add end_date if it exists
      if (editedGroup.end_date) {
        updateData.end_date = typeof editedGroup.end_date === 'string' 
          ? editedGroup.end_date 
          : new Date(editedGroup.end_date).toISOString();
      }

      // Update the group via API
      const response = await fetch(`http://localhost:8000/api/admin/groups/${editedGroup.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to update group');
      }

      // Refresh data
      const stats = await apiService.getGroupModerationStats();
      setModerationStats(stats);
      const activeData = await apiService.getActiveGroups();
      setActiveGroups(activeData);
      const readyData = await apiService.getReadyForPaymentGroups();
      setReadyForPaymentGroupsData(readyData);

      // Update the selected group with new data
      const updatedResponse = await fetch(`http://localhost:8000/api/admin/groups/${editedGroup.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const updatedGroup = await updatedResponse.json();
      setSelectedGroup(updatedGroup);
      setEditedGroup(updatedGroup);

      setIsEditMode(false);
      alert('Group updated successfully!');
    } catch (error: any) {
      console.error('Failed to update group:', error);
      alert(error.message || 'Failed to update group. Please try again.');
    }
  };

  return (
    <Layout title="Group Moderation">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Group Management</h2>
              <p className="text-gray-600 mt-1 text-sm">Create and manage group buying opportunities for traders.</p>
            </div>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-medium"
          >
            <Plus className="w-5 h-5" />
            Create New Group
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading group moderation data...</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      {/* Stats */}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
          <div className="bg-gradient-to-br from-blue-50 via-blue-50 to-indigo-100 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border border-blue-100 transform hover:-translate-y-1">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 bg-blue-500 rounded-xl shadow-lg">
                <ShoppingBag className="w-5 h-5 text-white" />
              </div>
              <div className="px-3 py-1 bg-blue-100 rounded-full">
                <p className="text-xs font-semibold text-blue-700">Active</p>
              </div>
            </div>
            <p className="text-sm font-medium text-gray-600 mb-1">Active Groups</p>
            <p className="text-3xl font-bold text-blue-600">{moderationStats.active_groups}</p>
          </div>
          <div className="bg-gradient-to-br from-green-50 via-green-50 to-emerald-100 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border border-green-100 transform hover:-translate-y-1">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 bg-green-500 rounded-xl shadow-lg">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div className="px-3 py-1 bg-green-100 rounded-full">
                <p className="text-xs font-semibold text-green-700">Members</p>
              </div>
            </div>
            <p className="text-sm font-medium text-gray-600 mb-1">Total Members</p>
            <p className="text-3xl font-bold text-green-600">{moderationStats.total_members}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 via-purple-50 to-violet-100 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border border-purple-100 transform hover:-translate-y-1">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 bg-purple-500 rounded-xl shadow-lg">
                <Package className="w-5 h-5 text-white" />
              </div>
              <div className="px-3 py-1 bg-purple-100 rounded-full">
                <p className="text-xs font-semibold text-purple-700">Ready</p>
              </div>
            </div>
            <p className="text-sm font-medium text-gray-600 mb-1">Ready for Payment</p>
            <p className="text-3xl font-bold text-purple-600">{moderationStats.ready_for_payment}</p>
          </div>
          <div className="bg-gradient-to-br from-red-50 via-red-50 to-rose-100 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border border-red-100 transform hover:-translate-y-1">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 bg-red-500 rounded-xl shadow-lg">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <div className="px-3 py-1 bg-red-100 rounded-full">
                <p className="text-xs font-semibold text-red-700">Action</p>
              </div>
            </div>
            <p className="text-sm font-medium text-gray-600 mb-1">Required Action</p>
            <p className="text-3xl font-bold text-red-600">{moderationStats.required_action}</p>
          </div>
        </div>
      )}

      {/* Groups List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Active Groups */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-md">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Active Groups</h3>
                  <p className="text-sm text-gray-500 mt-0.5">Currently active group buying opportunities</p>
                </div>
              </div>
            </div>
            {/* Search Bar */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search active groups by name, category, or product..."
                value={activeGroupsSearch}
                onChange={(e) => setActiveGroupsSearch(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white shadow-sm transition-all duration-200"
              />
            </div>
          </div>
          <div className="p-6 max-h-[500px] overflow-y-auto space-y-4 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
            {activeGroups
              .filter((group) => {
                if (!activeGroupsSearch.trim()) return true;
                
                const searchTerm = activeGroupsSearch.toLowerCase();
                return (
                  group.name?.toLowerCase().includes(searchTerm) ||
                  group.description?.toLowerCase().includes(searchTerm) ||
                  group.category?.toLowerCase().includes(searchTerm) ||
                  group.product?.name?.toLowerCase().includes(searchTerm) ||
                  group.product?.description?.toLowerCase().includes(searchTerm) ||
                  group.product?.manufacturer?.toLowerCase().includes(searchTerm)
                );
              })
              .map((group) => (
              <div key={group.id} className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg transition-all duration-300 hover:border-blue-300 transform hover:-translate-y-1">
                <div className="flex items-start gap-4 mb-4">
                  {/* Thumbnail */}
                  <div className="flex-shrink-0">
                    <img
                      src={group.product?.image || group.image || '/api/placeholder/150/100'}
                      alt={group.product?.name || group.name}
                      className="w-32 h-24 object-cover rounded-xl border-2 border-gray-200 shadow-md"
                    />
                  </div>

                  <div className="flex-1">
                    {/* Group Details */}
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="text-lg font-bold text-gray-900">{group.name}</h4>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-blue-100 text-blue-700 rounded-full shadow-sm">
                        <Users className="w-3 h-3" /> {group.members}/{group.targetMembers}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{group.description}</p>
                    <div className="flex flex-wrap gap-3 text-xs text-gray-600 mb-4">
                      <span className="px-2 py-1 bg-gray-100 rounded-full">Category: <span className="font-semibold text-gray-800">{group.category}</span></span>
                      <span className="px-2 py-1 bg-gray-100 rounded-full">Due: <span className="font-semibold text-gray-800">{group.dueDate}</span></span>
                      <span className="px-2 py-1 bg-blue-100 rounded-full">Amount: <span className="font-semibold text-blue-700">{group.totalAmount}</span></span>
                    </div>

                    {/* Product Details */}
                    <div className="bg-gradient-to-br from-gray-50 to-blue-50 p-4 rounded-xl mb-3 border border-gray-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Package className="w-4 h-4 text-blue-600" />
                        <h5 className="font-semibold text-gray-900">{group.product.name}</h5>
                      </div>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-1">{group.product.description}</p>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="bg-white p-2 rounded-lg">
                          <span className="text-gray-500 text-xs">Regular Price</span>
                          <p className="font-semibold text-gray-900">{group.product.regularPrice}</p>
                        </div>
                        <div className="bg-green-50 p-2 rounded-lg">
                          <span className="text-green-600 text-xs">Bulk Price</span>
                          <p className="font-semibold text-green-700">{group.product.bulkPrice}</p>
                        </div>
                        <div className="bg-white p-2 rounded-lg">
                          <span className="text-gray-500 text-xs">Stock</span>
                          <p className="font-semibold text-gray-900">{group.product.totalStock} units</p>
                        </div>
                        <div className="bg-white p-2 rounded-lg">
                          <span className="text-gray-500 text-xs">Manufacturer</span>
                          <p className="font-semibold text-gray-900 truncate">{group.product.manufacturer}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePaymentProcess(group)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    <DollarSign className="w-4 h-4" />
                    Process Payment
                  </button>
                  <button 
                    onClick={() => handleViewDetails(group)}
                    className="px-4 py-2.5 border-2 border-gray-300 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => handleDeleteGroup(group.id)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white text-sm font-medium rounded-xl hover:bg-red-700 transition-all duration-200 shadow-md hover:shadow-lg"
                    title="Delete Group"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ready for Payment */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 via-emerald-50 to-green-50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-md">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Ready for Payment</h3>
                  <p className="text-sm text-gray-500 mt-0.5">Groups that have reached their target and are ready for payment</p>
                </div>
              </div>
              <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-bold bg-green-100 text-green-700 shadow-sm">
                {readyForPaymentGroupsData.length} Groups
              </span>
            </div>
            {/* Search Bar */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search ready for payment groups by name, category..."
                value={readyForPaymentSearch}
                onChange={(e) => setReadyForPaymentSearch(e.target.value)}
                className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm bg-white shadow-sm transition-all duration-200"
              />
            </div>
          </div>
          <div className="p-6 max-h-[500px] overflow-y-auto space-y-4 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
            {readyForPaymentGroupsData
              .filter((group: any) => {
                if (!readyForPaymentSearch.trim()) return true;
                
                const searchTerm = readyForPaymentSearch.toLowerCase();
                return (
                  group.name?.toLowerCase().includes(searchTerm) ||
                  group.description?.toLowerCase().includes(searchTerm) ||
                  group.category?.toLowerCase().includes(searchTerm) ||
                  group.product?.name?.toLowerCase().includes(searchTerm) ||
                  group.product?.description?.toLowerCase().includes(searchTerm) ||
                  group.product?.manufacturer?.toLowerCase().includes(searchTerm)
                );
              })
              .map((group: any) => (
              <div key={group.id} className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-5 hover:shadow-lg transition-all duration-300 hover:border-green-300 transform hover:-translate-y-1">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <h4 className="text-lg font-bold text-gray-900">{group.name}</h4>
                      <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold bg-green-500 text-white rounded-full shadow-md">
                        <CheckCircle2 className="w-3 h-3" /> Ready
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <div className="bg-white p-3 rounded-xl shadow-sm">
                        <p className="text-xs text-gray-500 mb-1 font-medium">Members</p>
                        <p className="text-lg font-bold text-gray-900">{group.members}/{group.targetMembers}</p>
                      </div>
                      <div className="bg-white p-3 rounded-xl shadow-sm">
                        <p className="text-xs text-gray-500 mb-1 font-medium">Total Amount</p>
                        <p className="text-lg font-bold text-green-600">{group.totalAmount}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePaymentProcess(group)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-sm font-medium rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-md hover:shadow-lg"
                  >
                    <DollarSign className="w-4 h-4" />
                    Process Payment
                  </button>
                  <button
                    onClick={() => handleViewDetails(group)}
                    className="px-4 py-2.5 border-2 border-gray-300 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
                  >
                    View
                  </button>
                  <button
                    onClick={() => handleDeleteGroup(group.id)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-red-600 text-white text-sm font-medium rounded-xl hover:bg-red-700 transition-all duration-200 shadow-md hover:shadow-lg"
                    title="Delete Group"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>



      {/* Create Group Modal */}
      {showCreateModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setShowCreateModal(false)}
        >
          <div 
            className="bg-white rounded-xl shadow-xl max-w-2xl w-full m-4 flex flex-col max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Create New Group</h2>
                  <p className="text-sm text-gray-600 mt-1">Create a new group buying opportunity for traders</p>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Product Details Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                      <input
                        type="text"
                        value={newGroup.productName}
                        onChange={(e) => setNewGroup({...newGroup, productName: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter product name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Product Description</label>
                      <textarea
                        value={newGroup.productDescription}
                        onChange={(e) => setNewGroup({...newGroup, productDescription: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-32"
                        placeholder="Enter product description"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Regular Price</label>
                      <input
                        type="text"
                        value={newGroup.regularPrice}
                        onChange={(e) => setNewGroup({...newGroup, regularPrice: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Regular retail price"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bulk Price</label>
                      <input
                        type="text"
                        value={newGroup.bulkPrice}
                        onChange={(e) => setNewGroup({...newGroup, bulkPrice: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Group buy price per unit"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Product Image</label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              // Create image preview
                              const reader = new FileReader();
                              reader.onload = (e) => {
                                setNewGroup(prev => ({
                                  ...prev,
                                  productImage: file,
                                  imagePreview: e.target?.result as string
                                }));
                              };
                              reader.readAsDataURL(file);
                            } else {
                              // Clear preview if no file selected
                              setNewGroup(prev => ({
                                ...prev,
                                productImage: null,
                                imagePreview: null
                              }));
                            }
                          }}
                          className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                        {newGroup.productImage && (
                          <span className="text-sm text-green-600">✓ Image selected</span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-gray-500">Upload a product image (PNG, JPG up to 5MB)</p>
                      
                      {/* Image Preview */}
                      {newGroup.imagePreview && (
                        <div className="mt-4">
                          <p className="text-sm font-medium text-gray-700 mb-2">Image Preview:</p>
                          <div className="relative inline-block">
                            <img
                              src={newGroup.imagePreview}
                              alt="Product preview"
                              className="w-32 h-32 object-cover rounded-lg border-2 border-gray-300 shadow-md"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setNewGroup(prev => ({
                                  ...prev,
                                  productImage: null,
                                  imagePreview: null
                                }));
                                // Clear the file input
                                const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
                                if (fileInput) fileInput.value = '';
                              }}
                              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                              title="Remove image"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Total Stock Available</label>
                      <input
                        type="number"
                        value={newGroup.totalStock}
                        onChange={(e) => setNewGroup({...newGroup, totalStock: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Available stock"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Specifications</label>
                      <textarea
                        value={newGroup.specifications}
                        onChange={(e) => setNewGroup({...newGroup, specifications: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-20"
                        placeholder="Product specifications"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Manufacturer/Brand</label>
                      <input
                        type="text"
                        value={newGroup.manufacturer}
                        onChange={(e) => setNewGroup({...newGroup, manufacturer: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter manufacturer or brand"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Group Buy Details Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Group Buy Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Group Name</label>
                      <input
                        type="text"
                        value={newGroup.name}
                        onChange={(e) => setNewGroup({...newGroup, name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter group name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                      <select
                        value={newGroup.category}
                        onChange={(e) => setNewGroup({...newGroup, category: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select category</option>
                        <option value="electronics">Electronics</option>
                        <option value="fashion">Fashion & Clothing</option>
                        <option value="home">Home & Living</option>
                        <option value="beauty">Beauty & Health</option>
                        <option value="sports">Sports & Outdoor</option>
                        <option value="food">Food & Groceries</option>
                        <option value="vegetables">Vegetables</option>
                        <option value="fruits">Fruits</option>
                        <option value="books">Books & Stationery</option>
                        <option value="automotive">Automotive & Parts</option>
                        <option value="tools">Tools & Hardware</option>
                        <option value="furniture">Furniture & Decor</option>
                        <option value="appliances">Appliances</option>
                        <option value="toys">Toys & Games</option>
                        <option value="jewelry">Jewelry & Accessories</option>
                        <option value="pet">Pet Supplies</option>
                        <option value="garden">Garden & Outdoor</option>
                        <option value="music">Music & Instruments</option>
                        <option value="art">Art & Crafts</option>
                        <option value="office">Office Supplies</option>
                        <option value="medical">Medical & Pharmacy</option>
                        <option value="baby">Baby & Kids</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Target Members</label>
                      <input
                        type="number"
                        value={newGroup.targetMembers}
                        onChange={(e) => setNewGroup({...newGroup, targetMembers: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter target number of members"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea
                        value={newGroup.description}
                        onChange={(e) => setNewGroup({...newGroup, description: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-32"
                        placeholder="Enter group description"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                      <input
                        type="date"
                        value={newGroup.dueDate}
                        onChange={(e) => setNewGroup({...newGroup, dueDate: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Location</label>
                      <input
                        type="text"
                        value={newGroup.location}
                        onChange={(e) => setNewGroup({...newGroup, location: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Enter pickup location"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50 mt-auto">
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-6 py-2.5 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    try {
                      // First, upload the image if provided
                      let imageUrl = '';
                      if (newGroup.productImage) {
                        const uploadResult = await apiService.uploadImage(newGroup.productImage);
                        imageUrl = uploadResult.image_url;
                      }

                      // Then create the group
                      const groupData = {
                        name: newGroup.name,
                        description: newGroup.description,
                        long_description: newGroup.productDescription,
                        category: newGroup.category,
                        price: parseFloat(newGroup.bulkPrice),
                        original_price: parseFloat(newGroup.regularPrice),
                        image: imageUrl,
                        max_participants: parseInt(newGroup.targetMembers),
                        end_date: new Date(newGroup.dueDate).toISOString(),
                        admin_name: "Admin",
                        shipping_info: "Free shipping when group goal is reached",
                        estimated_delivery: "2-3 weeks after group completion",
                        features: [],
                        requirements: [],
                        // Additional product fields
                        product_name: newGroup.productName,
                        product_description: newGroup.productDescription,
                        total_stock: parseInt(newGroup.totalStock) || null,
                        specifications: newGroup.specifications,
                        manufacturer: newGroup.manufacturer,
                        pickup_location: newGroup.location
                      };

                      await apiService.createAdminGroup(groupData);

                      // Reset form and close modal on success
                      setNewGroup({
                        name: '',
                        description: '',
                        category: '',
                        targetMembers: '',
                        price: '',
                        dueDate: '',
                        location: '',
                        productName: '',
                        productDescription: '',
                        productImage: null,
                        imagePreview: null,
                        regularPrice: '',
                        bulkPrice: '',
                        totalStock: '',
                        specifications: '',
                        manufacturer: '',
                        warranty: ''
                      });
                      setShowCreateModal(false);

                      // Refresh the data
                      const fetchModerationData = async () => {
                        try {
                          setLoading(true);
                          setError(null);

                          const stats = await apiService.getGroupModerationStats();
                          setModerationStats(stats);

                          const activeData = await apiService.getActiveGroups();
                          setActiveGroups(activeData);

                          const readyData = await apiService.getReadyForPaymentGroups();
                          setReadyForPaymentGroupsData(readyData);

                        } catch (err) {
                          console.error('Error fetching moderation data:', err);
                          setError('Failed to load group moderation data');
                        } finally {
                          setLoading(false);
                        }
                      };

                      fetchModerationData();

                    } catch (error) {
                      console.error('Error:', error);
                      alert('Failed to create group. Please try again.');
                    }
                  }}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create Group
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Group Details/Edit Modal */}
      {showDetailsModal && selectedGroup && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => {
            setShowDetailsModal(false);
            setIsEditMode(false);
          }}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full m-4 flex flex-col max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-md">
                    <Package className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {isEditMode ? 'Edit Group Details' : 'Group Details'}
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      {isEditMode ? 'Update group buying information' : 'View complete group information'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!isEditMode ? (
                    <button
                      onClick={handleEditGroup}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all duration-200 shadow-md"
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={handleCancelEdit}
                        className="px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveEdit}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all duration-200 shadow-md"
                      >
                        <Save className="w-4 h-4" />
                        Save Changes
                      </button>
                    </div>
                  )}
                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                      setIsEditMode(false);
                    }}
                    className="text-gray-400 hover:text-gray-600 p-2"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50">
              {/* Group Image */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Group Image</h3>
                <img
                  src={editedGroup.image || '/api/placeholder/400/300'}
                  alt={editedGroup.name}
                  className="w-full h-64 object-cover rounded-xl shadow-md"
                />
              </div>

              {/* Basic Information */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Group Name</label>
                    {isEditMode ? (
                      <input
                        type="text"
                        value={editedGroup.name || ''}
                        onChange={(e) => setEditedGroup({ ...editedGroup, name: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    ) : (
                      <p className="text-base text-gray-900 font-medium">{selectedGroup.name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    {isEditMode ? (
                      <input
                        type="text"
                        value={editedGroup.category || ''}
                        onChange={(e) => setEditedGroup({ ...editedGroup, category: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    ) : (
                      <p className="text-base text-gray-900 font-medium">{selectedGroup.category}</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    {isEditMode ? (
                      <textarea
                        value={editedGroup.description || ''}
                        onChange={(e) => setEditedGroup({ ...editedGroup, description: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-24"
                      />
                    ) : (
                      <p className="text-base text-gray-700">{selectedGroup.description}</p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Long Description</label>
                    {isEditMode ? (
                      <textarea
                        value={editedGroup.long_description || editedGroup.description || ''}
                        onChange={(e) => setEditedGroup({ ...editedGroup, long_description: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-32"
                      />
                    ) : (
                      <p className="text-base text-gray-700">{selectedGroup.long_description || selectedGroup.description}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Pricing Information */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Pricing Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bulk Price</label>
                    {isEditMode ? (
                      <input
                        type="number"
                        step="0.01"
                        value={editedGroup.price || ''}
                        onChange={(e) => setEditedGroup({ ...editedGroup, price: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    ) : (
                      <p className="text-xl text-green-600 font-bold">${selectedGroup.price}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Original Price</label>
                    {isEditMode ? (
                      <input
                        type="number"
                        step="0.01"
                        value={editedGroup.original_price || ''}
                        onChange={(e) => setEditedGroup({ ...editedGroup, original_price: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    ) : (
                      <p className="text-xl text-gray-500 font-bold line-through">${selectedGroup.original_price}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Savings</label>
                    <p className="text-xl text-blue-600 font-bold">
                      ${((selectedGroup.original_price || 0) - (selectedGroup.price || 0)).toFixed(2)}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Discount</label>
                    <p className="text-xl text-purple-600 font-bold">
                      {(((selectedGroup.original_price - selectedGroup.price) / selectedGroup.original_price) * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Participants Information */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Participants Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Current Participants</label>
                    <p className="text-2xl text-blue-600 font-bold">{selectedGroup.participants || selectedGroup.members || 0}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Target Participants</label>
                    {isEditMode ? (
                      <input
                        type="number"
                        value={editedGroup.max_participants || editedGroup.targetMembers || ''}
                        onChange={(e) => setEditedGroup({ ...editedGroup, max_participants: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    ) : (
                      <p className="text-2xl text-gray-900 font-bold">{selectedGroup.max_participants || selectedGroup.targetMembers}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Progress</label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-3">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${Math.min(
                              ((selectedGroup.participants || selectedGroup.members || 0) / 
                              (selectedGroup.max_participants || selectedGroup.targetMembers || 1)) * 100, 
                              100
                            )}%` 
                          }}
                        ></div>
                      </div>
                      <span className="text-sm font-semibold text-gray-700">
                        {Math.round(
                          ((selectedGroup.participants || selectedGroup.members || 0) / 
                          (selectedGroup.max_participants || selectedGroup.targetMembers || 1)) * 100
                        )}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Delivery Information */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Delivery Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Shipping Info</label>
                    {isEditMode ? (
                      <textarea
                        value={editedGroup.shipping_info || ''}
                        onChange={(e) => setEditedGroup({ ...editedGroup, shipping_info: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-20"
                      />
                    ) : (
                      <p className="text-base text-gray-700">{selectedGroup.shipping_info || 'No shipping info available'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Estimated Delivery</label>
                    {isEditMode ? (
                      <input
                        type="text"
                        value={editedGroup.estimated_delivery || ''}
                        onChange={(e) => setEditedGroup({ ...editedGroup, estimated_delivery: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    ) : (
                      <p className="text-base text-gray-700">{selectedGroup.estimated_delivery || 'To be determined'}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                    {isEditMode ? (
                      <input
                        type="datetime-local"
                        value={editedGroup.end_date ? new Date(editedGroup.end_date).toISOString().slice(0, 16) : ''}
                        onChange={(e) => setEditedGroup({ ...editedGroup, end_date: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    ) : (
                      <p className="text-base text-gray-700">
                        {selectedGroup.end_date ? new Date(selectedGroup.end_date).toLocaleString() : 'No end date set'}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-semibold ${
                      selectedGroup.is_active 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {selectedGroup.is_active ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          Active
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4" />
                          Inactive
                        </>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Product Details */}
              {selectedGroup.product && (
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Product Name</label>
                      <p className="text-base text-gray-900 font-medium">{selectedGroup.product.name}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Manufacturer</label>
                      <p className="text-base text-gray-900">{selectedGroup.product.manufacturer || 'N/A'}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Total Stock</label>
                      <p className="text-base text-gray-900">{selectedGroup.product.totalStock || 'N/A'} units</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Regular Price</label>
                      <p className="text-base text-gray-500">{selectedGroup.product.regularPrice}</p>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Product Description</label>
                      <p className="text-base text-gray-700">{selectedGroup.product.description}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Payment Processing Modal */}
      {showPaymentModal && selectedPaymentGroup && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setShowPaymentModal(false)}
        >
          <div 
            className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Process Group Payment</h3>
              {paymentStatus === 'pending' && (
                <>
                  <div className="mb-6 p-4 bg-blue-50 rounded-lg text-left">
                    {/* Group Details */}
                    <div className="mb-4">
                      <h4 className="font-semibold text-blue-900">Group Details</h4>
                      <p className="text-sm text-blue-800 mt-1">{selectedPaymentGroup.name}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                      <div>
                        <p className="text-blue-600">Members</p>
                        <p className="font-medium text-blue-900">{selectedPaymentGroup.members}/{selectedPaymentGroup.targetMembers}</p>
                      </div>
                      <div>
                        <p className="text-blue-600">Category</p>
                        <p className="font-medium text-blue-900">{selectedPaymentGroup.category}</p>
                      </div>
                      <div>
                        <p className="text-blue-600">Due Date</p>
                        <p className="font-medium text-blue-900">{selectedPaymentGroup.dueDate}</p>
                      </div>
                      <div>
                        <p className="text-blue-600">Total Amount</p>
                        <p className="font-medium text-blue-900">{selectedPaymentGroup.totalAmount}</p>
                      </div>
                    </div>
                    
                    {/* Product Details */}
                    <div className="border-t border-blue-200 pt-4">
                      <h4 className="font-semibold text-blue-900 mb-2">Product Information</h4>
                      <div className="space-y-3">
                        <div>
                          <p className="text-blue-600">Product</p>
                          <p className="font-medium text-blue-900">{selectedPaymentGroup.product.name}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-blue-600">Regular Price</p>
                            <p className="font-medium text-blue-900">{selectedPaymentGroup.product.regularPrice}</p>
                          </div>
                          <div>
                            <p className="text-blue-600">Bulk Price</p>
                            <p className="font-medium text-green-600">{selectedPaymentGroup.product.bulkPrice}</p>
                          </div>
                          <div>
                            <p className="text-blue-600">Total Stock</p>
                            <p className="font-medium text-blue-900">{selectedPaymentGroup.product.totalStock} units</p>
                          </div>
                          <div>
                            <p className="text-blue-600">Manufacturer</p>
                            <p className="font-medium text-blue-900">{selectedPaymentGroup.product.manufacturer}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowPaymentModal(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={processGroupPayment}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                    >
                      Confirm & Process
                    </button>
                  </div>
                </>
              )}
              {paymentStatus === 'processing' && (
                <div className="py-8">
                  <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-gray-600">Processing group payment...</p>
                  <p className="text-sm text-gray-500 mt-2">This may take a few moments</p>
                </div>
              )}
              {paymentStatus === 'completed' && (
                <div className="py-8">
                  <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="text-lg font-semibold text-green-600 mb-2">Payment Processed Successfully!</h4>
                  <p className="text-sm text-gray-600">The group payment has been processed and confirmed.</p>
                  <button
                    onClick={() => setShowPaymentModal(false)}
                    className="mt-6 px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
                  >
                    Close
                  </button>
                </div>
              )}
              {paymentStatus === 'failed' && (
                <div className="py-8">
                  <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <XCircle className="w-6 h-6" />
                  </div>
                  <h4 className="text-lg font-semibold text-red-600 mb-2">Payment Processing Failed</h4>
                  <p className="text-sm text-gray-600 mb-4">There was an error processing the payment. Please try again.</p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowPaymentModal(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => setPaymentStatus('pending')}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default GroupModeration;
