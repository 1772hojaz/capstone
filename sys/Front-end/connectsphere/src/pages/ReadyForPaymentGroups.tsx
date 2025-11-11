import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import apiService from '../services/api';
import {
  DollarSign,
  CheckCircle2,
  Loader2,
  Users,
  Search,
  Package,
  AlertTriangle,
  Eye,
  Trash2,
  X,
  Edit2,
  Save
} from 'lucide-react';

const ReadyForPaymentGroups = () => {
  const [showPaymentModal, setShowPaymentModal] = React.useState(false);
  const [selectedPaymentGroup, setSelectedPaymentGroup] = React.useState<any>(null);
  type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed';
  const [paymentStatus, setPaymentStatus] = React.useState<PaymentStatus>('pending');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedGroup, setEditedGroup] = useState<any>(null);

  // State for dynamic data
  const [readyForPaymentGroupsData, setReadyForPaymentGroupsData] = useState<any[]>([]);
  const [moderationStats, setModerationStats] = useState({
    active_groups: 0,
    total_members: 0,
    ready_for_payment: 0,
    required_action: 0,
    completed_groups: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch stats
        const stats = await apiService.getGroupModerationStats();
        setModerationStats(stats);

        // Fetch ready for payment groups
        const readyData = await apiService.getReadyForPaymentGroups();
        setReadyForPaymentGroupsData(readyData);

      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load ready for payment groups data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
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
    if (!window.confirm(
      'Are you sure you want to delete this group?\n\n' +
      'All participants will be AUTOMATICALLY REFUNDED to their original payment method.\n\n' +
      'This action cannot be undone.'
    )) {
      return;
    }

    try {
      await apiService.deleteAdminGroup(groupId);
      // Refresh data after deletion
      const stats = await apiService.getGroupModerationStats();
      setModerationStats(stats);
      const readyData = await apiService.getReadyForPaymentGroups();
      setReadyForPaymentGroupsData(readyData);
      alert('Group deleted successfully!\n\nAll participants have been automatically refunded.');
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
    <Layout title="Ready for Payment">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
              <DollarSign className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Ready for Payment</h2>
              <p className="text-gray-600 mt-1 text-sm">Groups that have been confirmed by suppliers and are ready for payment processing.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-green-600" />
          <span className="ml-2 text-gray-600">Loading ready for payment groups...</span>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          <div className="bg-gradient-to-br from-green-50 via-green-50 to-emerald-100 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border border-green-100 transform hover:-translate-y-1">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 bg-green-500 rounded-xl shadow-lg">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
              <div className="px-3 py-1 bg-green-100 rounded-full">
                <p className="text-xs font-semibold text-green-700">Ready</p>
              </div>
            </div>
            <p className="text-sm font-medium text-gray-600 mb-1">Groups Ready for Payment</p>
            <p className="text-3xl font-bold text-green-600">{moderationStats.ready_for_payment}</p>
          </div>
          <div className="bg-gradient-to-br from-blue-50 via-blue-50 to-indigo-100 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border border-blue-100 transform hover:-translate-y-1">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 bg-blue-500 rounded-xl shadow-lg">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div className="px-3 py-1 bg-blue-100 rounded-full">
                <p className="text-xs font-semibold text-blue-700">Members</p>
              </div>
            </div>
            <p className="text-sm font-medium text-gray-600 mb-1">Total Members</p>
            <p className="text-3xl font-bold text-blue-600">{moderationStats.total_members}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 via-purple-50 to-violet-100 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border border-purple-100 transform hover:-translate-y-1">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 bg-purple-500 rounded-xl shadow-lg">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
              <div className="px-3 py-1 bg-purple-100 rounded-full">
                <p className="text-xs font-semibold text-purple-700">Revenue</p>
              </div>
            </div>
            <p className="text-sm font-medium text-gray-600 mb-1">Potential Revenue</p>
            <p className="text-3xl font-bold text-purple-600">
              ${readyForPaymentGroupsData.reduce((sum, group) => sum + parseFloat(group.totalAmount || 0), 0).toFixed(2)}
            </p>
          </div>
        </div>
      )}

      {/* Search Bar */}
      {!loading && !error && (
        <div className="mb-6">
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search ready for payment groups by name, category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm bg-white shadow-sm transition-all duration-200"
            />
          </div>
        </div>
      )}

      {/* Groups Grid */}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {readyForPaymentGroupsData
            .filter((group: any) => {
              if (!search.trim()) return true;

              const searchTerm = search.toLowerCase();
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
            <div key={group.id} className="bg-white border-2 border-green-200 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 hover:border-green-300 transform hover:-translate-y-1">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <h4 className="text-lg font-bold text-gray-900">{group.name}</h4>
                    <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold bg-green-500 text-white rounded-full shadow-md">
                      <CheckCircle2 className="w-3 h-3" /> Ready
                    </span>
                  </div>

                  {/* Product Image */}
                  {group.product?.image && (
                    <div className="mb-4">
                      <img
                        src={group.product.image}
                        alt={group.product.name}
                        className="w-full h-32 object-cover rounded-xl border-2 border-gray-200 shadow-md"
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100">
                      <p className="text-xs text-gray-500 mb-1 font-medium">Members</p>
                      <p className="text-lg font-bold text-gray-900">{group.members}/{group.targetMembers}</p>
                    </div>
                    <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100">
                      <p className="text-xs text-gray-500 mb-1 font-medium">Total Amount</p>
                      <p className="text-lg font-bold text-green-600">{group.totalAmount}</p>
                    </div>
                    <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100">
                      <p className="text-xs text-gray-500 mb-1 font-medium">Category</p>
                      <p className="text-sm font-bold text-gray-900">{group.category}</p>
                    </div>
                    <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100">
                      <p className="text-xs text-gray-500 mb-1 font-medium">Created by</p>
                      <p className="text-sm font-bold text-purple-600">{group.creator}</p>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full mt-1 inline-block ${group.creator_type === 'Supplier' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>{group.creator_type}</span>
                    </div>
                  </div>

                  {/* Product Details */}
                  <div className="bg-gradient-to-br from-gray-50 to-blue-50 p-4 rounded-xl mb-4 border border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Package className="w-4 h-4 text-blue-600" />
                      <h5 className="font-semibold text-gray-900">{group.product?.name}</h5>
                    </div>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{group.product?.description}</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="bg-white p-2 rounded-lg">
                        <span className="text-gray-500 text-xs">Regular Price</span>
                        <p className="font-semibold text-gray-900">{group.product?.regularPrice}</p>
                      </div>
                      <div className="bg-green-50 p-2 rounded-lg">
                        <span className="text-green-600 text-xs">Bulk Price</span>
                        <p className="font-semibold text-green-700">{group.product?.bulkPrice}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handlePaymentProcess(group)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-sm font-medium rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  <DollarSign className="w-4 h-4" />
                  Process Payment
                </button>
                <button
                  onClick={() => handleViewDetails(group)}
                  className="px-4 py-3 border-2 border-gray-300 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteGroup(group.id)}
                  className="flex items-center gap-2 px-4 py-3 bg-red-600 text-white text-sm font-medium rounded-xl hover:bg-red-700 transition-all duration-200 shadow-md hover:shadow-lg"
                  title="Delete Group"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && readyForPaymentGroupsData.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Groups Ready for Payment</h3>
          <p className="text-gray-600">There are currently no groups ready for payment processing.</p>
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
            <div className="p-6 border-b bg-gradient-to-r from-green-50 to-emerald-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-md">
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
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all duration-200 shadow-md"
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
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    ) : (
                      <p className="text-base text-gray-900 font-medium">{selectedGroup.category}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Created by</label>
                    <p className="text-base text-purple-600 font-medium">{selectedGroup.creator || selectedGroup.admin_name || 'Admin'}</p>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    {isEditMode ? (
                      <textarea
                        value={editedGroup.description || ''}
                        onChange={(e) => setEditedGroup({ ...editedGroup, description: e.target.value })}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 h-24"
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
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 h-32"
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
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
                          className="bg-gradient-to-r from-green-500 to-emerald-600 h-3 rounded-full transition-all duration-300"
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
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 h-20"
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
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
                          <CheckCircle2 className="w-4 h-4" />
                          Ready for Payment
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
                  <div className="mb-6 p-4 bg-green-50 rounded-lg text-left">
                    {/* Group Details */}
                    <div className="mb-4">
                      <h4 className="font-semibold text-green-900">Group Details</h4>
                      <p className="text-sm text-green-800 mt-1">{selectedPaymentGroup.name}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                      <div>
                        <p className="text-green-600">Members</p>
                        <p className="font-medium text-green-900">{selectedPaymentGroup.members}/{selectedPaymentGroup.targetMembers}</p>
                      </div>
                      <div>
                        <p className="text-green-600">Category</p>
                        <p className="font-medium text-green-900">{selectedPaymentGroup.category}</p>
                      </div>
                      <div>
                        <p className="text-green-600">Due Date</p>
                        <p className="font-medium text-green-900">{selectedPaymentGroup.dueDate}</p>
                      </div>
                      <div>
                        <p className="text-green-600">Total Amount</p>
                        <p className="font-medium text-green-900">{selectedPaymentGroup.totalAmount}</p>
                      </div>
                      <div>
                        <p className="text-green-600">Created by</p>
                        <p className="font-medium text-purple-600">{selectedPaymentGroup.creator} <span className={`text-xs px-1.5 py-0.5 rounded-full ml-1 ${selectedPaymentGroup.creator_type === 'Supplier' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>{selectedPaymentGroup.creator_type}</span></p>
                      </div>
                    </div>

                    {/* Product Details */}
                    <div className="border-t border-green-200 pt-4">
                      <h4 className="font-semibold text-green-900 mb-2">Product Information</h4>
                      <div className="space-y-3">
                        <div>
                          <p className="text-green-600">Product</p>
                          <p className="font-medium text-green-900">{selectedPaymentGroup.product.name}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-green-600">Regular Price</p>
                            <p className="font-medium text-green-900">{selectedPaymentGroup.product.regularPrice}</p>
                          </div>
                          <div>
                            <p className="text-green-600">Bulk Price</p>
                            <p className="font-medium text-green-700">{selectedPaymentGroup.product.bulkPrice}</p>
                          </div>
                          <div>
                            <p className="text-green-600">Total Stock</p>
                            <p className="font-medium text-green-900">{selectedPaymentGroup.product.totalStock} units</p>
                          </div>
                          <div>
                            <p className="text-green-600">Manufacturer</p>
                            <p className="font-medium text-green-900">{selectedPaymentGroup.product.manufacturer}</p>
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
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                    >
                      Confirm & Process
                    </button>
                  </div>
                </>
              )}
              {paymentStatus === 'processing' && (
                <div className="py-8">
                  <div className="animate-spin w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-gray-600">Processing group payment...</p>
                  <p className="text-sm text-gray-500 mt-2">This may take a few moments</p>
                </div>
              )}
              {paymentStatus === 'completed' && (
                <div className="py-8">
                  <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-6 h-7" />
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
                    <X className="w-6 h-6" />
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
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
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

export default ReadyForPaymentGroups;