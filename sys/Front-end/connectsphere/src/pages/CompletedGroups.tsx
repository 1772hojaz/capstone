import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import apiService from '../services/api';
import { Package, CheckCircle2, Loader2, Users, Search, Truck, MapPin, QrCode, Eye, AlertTriangle, X } from 'lucide-react';

const CompletedGroups = () => {
  const [showPickupModal, setShowPickupModal] = useState(false);
  const [selectedPickupGroup, setSelectedPickupGroup] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);

  // State for dynamic data
  const [completedGroupsData, setCompletedGroupsData] = useState<any[]>([]);
  const [moderationStats, setModerationStats] = useState({
    active_groups: 0,
    total_members: 0,
    ready_for_payment: 0,
    payment_completed: 0,
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

        // Fetch completed groups (payment_completed status)
        const completedData = await apiService.getCompletedGroups();
        setCompletedGroupsData(completedData);

      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load completed groups data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handlePickupOrder = async (group: any) => {
    setSelectedPickupGroup(group);
    setShowPickupModal(true);
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
      setShowDetailsModal(true);
    } catch (error) {
      console.error('Error fetching group details:', error);
      // Fallback to using the group data we already have
      setSelectedGroup(group);
      setShowDetailsModal(true);
    }
  };

  return (
    <Layout title="Completed Groups">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
              <Package className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Completed Groups</h2>
              <p className="text-gray-600 mt-1 text-sm">Groups where orders have been paid and are ready for pickup by traders.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading completed groups...</span>
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
          <div className="bg-gradient-to-br from-blue-50 via-blue-50 to-indigo-100 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border border-blue-100 transform hover:-translate-y-1">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2.5 bg-blue-500 rounded-xl shadow-lg">
                <Package className="w-5 h-5 text-white" />
              </div>
              <div className="px-3 py-1 bg-blue-100 rounded-full">
                <p className="text-xs font-semibold text-blue-700">Ready</p>
              </div>
            </div>
            <p className="text-sm font-medium text-gray-600 mb-1">Groups Ready for Pickup</p>
            <p className="text-3xl font-bold text-blue-600">{moderationStats.payment_completed || completedGroupsData.length}</p>
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
                <Truck className="w-5 h-5 text-white" />
              </div>
              <div className="px-3 py-1 bg-purple-100 rounded-full">
                <p className="text-xs font-semibold text-purple-700">Orders</p>
              </div>
            </div>
            <p className="text-sm font-medium text-gray-600 mb-1">Orders Ready</p>
            <p className="text-3xl font-bold text-purple-600">{completedGroupsData.length}</p>
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
              placeholder="Search completed groups by name, category..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white shadow-sm transition-all duration-200"
            />
          </div>
        </div>
      )}

      {/* Groups Grid */}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {completedGroupsData
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
            <div key={group.id} className="bg-white border-2 border-blue-200 rounded-2xl p-6 hover:shadow-xl transition-all duration-300 hover:border-blue-300 transform hover:-translate-y-1">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <h4 className="text-lg font-bold text-gray-900">{group.name}</h4>
                    <span className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold bg-blue-500 text-white rounded-full shadow-md">
                      <CheckCircle2 className="w-3 h-3" /> Ready for Pickup
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
                      <p className="text-xs text-gray-500 mb-1 font-medium">Pickup Location</p>
                      <p className="text-sm font-bold text-purple-600">{group.pickupLocation || 'Downtown Market'}</p>
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
                  onClick={() => handlePickupOrder(group)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  <QrCode className="w-4 h-4" />
                  Generate QR Code
                </button>
                <button
                  onClick={() => handleViewDetails(group)}
                  className="px-4 py-3 border-2 border-gray-300 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && completedGroupsData.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Completed Groups</h3>
          <p className="text-gray-600">There are currently no groups ready for pickup.</p>
        </div>
      )}

      {/* QR Code Generation Modal */}
      {showPickupModal && selectedPickupGroup && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setShowPickupModal(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Generate Pickup QR Code</h3>
              <div className="mb-6 p-4 bg-blue-50 rounded-lg text-left">
                {/* Group Details */}
                <div className="mb-4">
                  <h4 className="font-semibold text-blue-900">Group Details</h4>
                  <p className="text-sm text-blue-800 mt-1">{selectedPickupGroup.name}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  <div>
                    <p className="text-blue-600">Members</p>
                    <p className="font-medium text-blue-900">{selectedPickupGroup.members}/{selectedPickupGroup.targetMembers}</p>
                  </div>
                  <div>
                    <p className="text-blue-600">Pickup Location</p>
                    <p className="font-medium text-blue-900">{selectedPickupGroup.pickupLocation || 'Downtown Market'}</p>
                  </div>
                  <div>
                    <p className="text-blue-600">Total Amount</p>
                    <p className="font-medium text-blue-900">{selectedPickupGroup.totalAmount}</p>
                  </div>
                  <div>
                    <p className="text-blue-600">Status</p>
                    <p className="font-medium text-green-600">Ready for Pickup</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowPickupModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    // TODO: Implement QR code generation for pickup
                    alert('QR Code generation feature coming soon!');
                    setShowPickupModal(false);
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  Generate QR
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Group Details Modal */}
      {showDetailsModal && selectedGroup && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setShowDetailsModal(false)}
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
                      Group Details
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      View complete group information - Ready for pickup
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-2"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50">
              {/* Group Image */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Group Image</h3>
                <img
                  src={selectedGroup.image || '/api/placeholder/400/300'}
                  alt={selectedGroup.name}
                  className="w-full h-64 object-cover rounded-xl shadow-md"
                />
              </div>

              {/* Basic Information */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Group Name</label>
                    <p className="text-base text-gray-900 font-medium">{selectedGroup.name}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <p className="text-base text-gray-900 font-medium">{selectedGroup.category}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-semibold bg-blue-100 text-blue-700">
                      <CheckCircle2 className="w-4 h-4" />
                      Ready for Pickup
                    </span>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <p className="text-base text-gray-700">{selectedGroup.description}</p>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Long Description</label>
                    <p className="text-base text-gray-700">{selectedGroup.long_description || selectedGroup.description}</p>
                  </div>
                </div>
              </div>

              {/* Pricing Information */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Pricing Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bulk Price</label>
                    <p className="text-xl text-green-600 font-bold">${selectedGroup.price}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Original Price</label>
                    <p className="text-xl text-gray-500 font-bold line-through">${selectedGroup.original_price}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Savings</label>
                    <p className="text-xl text-blue-600 font-bold">
                      ${(selectedGroup.original_price || 0) - (selectedGroup.price || 0)}
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
                    <p className="text-2xl text-gray-900 font-bold">{selectedGroup.max_participants || selectedGroup.targetMembers}</p>
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

              {/* Pickup Information */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Pickup Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Pickup Location</label>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-blue-600" />
                      <p className="text-base text-gray-700">{selectedGroup.pickupLocation || 'Downtown Market'}</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Estimated Delivery</label>
                    <p className="text-base text-gray-700">{selectedGroup.estimated_delivery || 'Ready for immediate pickup'}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                    <p className="text-base text-gray-700">
                      {selectedGroup.end_date ? new Date(selectedGroup.end_date).toLocaleString() : 'Completed'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Payment Status</label>
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-semibold bg-green-100 text-green-700">
                      <CheckCircle2 className="w-4 h-4" />
                      Payment Completed
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
    </Layout>
  );
};

export default CompletedGroups;
