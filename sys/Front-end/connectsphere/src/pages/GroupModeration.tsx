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
  Plus,
  Package,
  AlertTriangle,
  ShoppingBag,
  X
} from 'lucide-react';

const GroupModeration = () => {
  const [showPaymentModal, setShowPaymentModal] = React.useState(false);
    const [selectedPaymentGroup, setSelectedPaymentGroup] = useState<any>(null);
  const [editedGroup, setEditedGroup] = useState<{
    name: string;
    category: string;
    description: string;
    productName: string;
    regularPrice: string;
  } | null>(null);
  type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed';
  const [paymentStatus, setPaymentStatus] = React.useState<PaymentStatus>('pending');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedGroupForDetails, setSelectedGroupForDetails] = useState<any>(null);
  const [isEditingGroup, setIsEditingGroup] = useState(false);
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

  return (
    <Layout title="Group Moderation">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Group Management</h2>
              <p className="text-gray-600 mt-1">Create and manage group buying opportunities for traders.</p>
            </div>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Plus className="w-4 h-4" />
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
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg shadow-sm p-4 border border-purple-200">
            <div className="flex items-center gap-2 mb-1">
              <ShoppingBag className="w-4 h-4 text-purple-600" />
              <p className="text-sm text-gray-600">Active Groups</p>
            </div>
            <p className="text-2xl font-bold text-purple-600">{moderationStats.active_groups}</p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg shadow-sm p-4 border border-green-200">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-green-600" />
              <p className="text-sm text-gray-600">Total Members</p>
            </div>
            <p className="text-2xl font-bold text-green-600">{moderationStats.total_members}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-lg shadow-sm p-4 border border-purple-200">
            <div className="flex items-center gap-2 mb-1">
              <Package className="w-4 h-4 text-purple-600" />
              <p className="text-sm text-gray-600">Ready for Payment</p>
            </div>
            <p className="text-2xl font-bold text-purple-600">{moderationStats.ready_for_payment}</p>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-lg shadow-sm p-4 border border-red-200">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <p className="text-sm text-gray-600">Required Action</p>
            </div>
            <p className="text-2xl font-bold text-red-600">{moderationStats.required_action}</p>
          </div>
        </div>
      )}

      {/* Groups List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Active Groups */}
        <div className="bg-gradient-to-br from-blue-300 to-indigo-300 rounded-xl shadow-lg border border-blue-400 overflow-hidden">
          <div className="p-6 border-b border-blue-200 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 text-white relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-sm"></div>
            <div className="relative z-10 flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Users className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Active Groups</h3>
                  <p className="text-sm text-blue-100 mt-1">Currently active group buying opportunities</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="px-3 py-1 bg-white/20 rounded-full backdrop-blur-sm">
                  <span className="text-sm font-medium text-white">{activeGroups.length} Groups</span>
                </div>
              </div>
            </div>
            {/* Search Bar */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-blue-200" />
              </div>
              <input
                type="text"
                placeholder="Search active groups by name, category, or product..."
                value={activeGroupsSearch}
                onChange={(e) => setActiveGroupsSearch(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-white/30 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-white bg-white/10 backdrop-blur-sm text-white placeholder-blue-200"
              />
            </div>
          </div>
          <div className="p-6 max-h-96 overflow-y-auto space-y-4">
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
              <div key={group.id} className="border border-gray-200 bg-white rounded-xl p-5 hover:shadow-lg hover:border-gray-300 transition-all duration-300 hover:transform hover:scale-[1.02]">
                <div className="flex items-start gap-4 mb-4">
                  {/* Thumbnail */}
                  <div className="flex-shrink-0 relative">
                    <img
                      src={group.product?.image || group.image || '/api/placeholder/150/100'}
                      alt={group.product?.name || group.name}
                      className="w-32 h-24 object-cover rounded-lg border-2 border-gray-200 shadow-sm"
                    />
                  </div>

                  <div className="flex-1">
                    {/* Group Details */}
                    <div className="flex items-center gap-3 mb-3">
                      <h4 className="text-lg font-bold text-gray-900 hover:text-purple-600 transition-colors">{group.name}</h4>
                      <span className="inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full shadow-sm">
                        <Users className="w-3 h-3" /> {group.members}/{group.targetMembers}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-3 leading-relaxed">{group.description}</p>
                    <div className="flex flex-wrap gap-3 text-xs text-gray-600 mb-4">
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-800 rounded-md">
                        <Package className="w-3 h-3" /> {group.category}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 rounded-md">
                        <Calendar className="w-3 h-3" /> {group.dueDate}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-md font-medium">
                        <DollarSign className="w-3 h-3" /> {group.totalAmount}
                      </span>
                    </div>

                    {/* Product Details */}
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-2 mb-3">
                        <Package className="w-4 h-4 text-blue-600" />
                        <h5 className="font-semibold text-gray-900">{group.product.name}</h5>
                      </div>
                      <p className="text-sm text-gray-700 mb-3">{group.product.description}</p>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">Regular:</span>
                          <span className="font-medium text-gray-900 line-through">{group.product.regularPrice}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">Bulk:</span>
                          <span className="font-bold text-green-600">{group.product.bulkPrice}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">Stock:</span>
                          <span className="font-medium text-blue-600">{group.product.totalStock} units</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">Brand:</span>
                          <span className="font-medium text-purple-600">{group.product.manufacturer}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => handlePaymentProcess(group)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
                  >
                    <DollarSign className="w-4 h-4" />
                    Process Payment
                  </button>
                  <button 
                    onClick={() => {
                      setSelectedGroupForDetails(group);
                      setEditedGroup({
                        name: group.name,
                        category: group.category,
                        description: group.description,
                        productName: group.product?.name || '',
                        regularPrice: group.product?.regularPrice || ''
                      });
                      setIsEditingGroup(false);
                      setShowDetailsModal(true);
                    }}
                    className="px-4 py-2.5 border-2 border-rose-300 text-rose-700 text-sm rounded-lg hover:bg-rose-100 hover:border-rose-400 transition-all duration-300"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ready for Payment */}
        <div className="bg-gradient-to-br from-green-300 to-emerald-300 rounded-xl shadow-lg border border-green-400 overflow-hidden">
          <div className="p-6 border-b border-green-200 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-600 text-white relative">
            <div className="absolute inset-0 bg-gradient-to-r from-green-600/20 to-emerald-600/20 backdrop-blur-sm"></div>
            <div className="relative z-10 flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <DollarSign className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Ready for Payment</h3>
                  <p className="text-sm text-green-100 mt-1">Groups that have reached their target and are ready for payment</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="px-3 py-1 bg-white/20 rounded-full backdrop-blur-sm">
                  <span className="text-sm font-medium text-white">{readyForPaymentGroupsData.length} Groups</span>
                </div>
              </div>
            </div>
            {/* Search Bar */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-green-200" />
              </div>
              <input
                type="text"
                placeholder="Search ready for payment groups by name, category..."
                value={readyForPaymentSearch}
                onChange={(e) => setReadyForPaymentSearch(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-white/30 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-white bg-white/10 backdrop-blur-sm text-white placeholder-green-200"
              />
            </div>
          </div>
          <div className="p-6 max-h-96 overflow-y-auto space-y-4">
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
              <div key={group.id} className="border border-gray-200 bg-white rounded-xl p-5 hover:shadow-lg hover:border-gray-300 transition-all duration-300 hover:transform hover:scale-[1.02]">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h4 className="text-lg font-bold text-gray-900 hover:text-green-600 transition-colors">{group.name}</h4>
                      <span className="inline-flex items-center gap-2 px-3 py-1 text-xs font-semibold bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full shadow-sm">
                        <CheckCircle2 className="w-3 h-3" /> Ready
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <p className="text-sm text-gray-700 font-medium">Members</p>
                        <p className="text-lg font-bold text-gray-900">{group.members}/{group.targetMembers}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <p className="text-sm text-gray-700 font-medium">Total Amount</p>
                        <p className="text-lg font-bold text-gray-900">{group.totalAmount}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => handlePaymentProcess(group)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
                  >
                    <DollarSign className="w-4 h-4" />
                    Process Payment
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
            className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-xl max-w-2xl w-full m-4 flex flex-col max-h-[90vh] overflow-hidden border border-blue-200"
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
                <h3 className="text-lg font-semibold text-blue-900 mb-4">Product Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                      <input
                        type="text"
                        value={newGroup.productName}
                        onChange={(e) => setNewGroup({...newGroup, productName: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 backdrop-blur-sm"
                        placeholder="Enter product name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Product Description</label>
                      <textarea
                        value={newGroup.productDescription}
                        onChange={(e) => setNewGroup({...newGroup, productDescription: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 backdrop-blur-sm h-32"
                        placeholder="Enter product description"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Regular Price</label>
                      <input
                        type="text"
                        value={newGroup.regularPrice}
                        onChange={(e) => setNewGroup({...newGroup, regularPrice: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 backdrop-blur-sm"
                        placeholder="Regular retail price"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bulk Price</label>
                      <input
                        type="text"
                        value={newGroup.bulkPrice}
                        onChange={(e) => setNewGroup({...newGroup, bulkPrice: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 backdrop-blur-sm"
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
                              // Here you would typically:
                              // 1. Create a FormData object
                              // 2. Send it to your backend
                              // 3. Get back the URL and set it in state
                              // For now, we'll just store the file object
                              setNewGroup({...newGroup, productImage: file});
                            }
                          }}
                          className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                        {newGroup.productImage && (
                          <span className="text-sm text-green-600">✓ Image selected</span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-gray-500">Upload a product image (PNG, JPG up to 5MB)</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Total Stock Available</label>
                      <input
                        type="number"
                        value={newGroup.totalStock}
                        onChange={(e) => setNewGroup({...newGroup, totalStock: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 backdrop-blur-sm"
                        placeholder="Available stock"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Specifications</label>
                      <textarea
                        value={newGroup.specifications}
                        onChange={(e) => setNewGroup({...newGroup, specifications: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 backdrop-blur-sm h-20"
                        placeholder="Product specifications"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Manufacturer/Brand</label>
                      <input
                        type="text"
                        value={newGroup.manufacturer}
                        onChange={(e) => setNewGroup({...newGroup, manufacturer: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/80 backdrop-blur-sm"
                        placeholder="Enter manufacturer or brand"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Group Buy Details Section */}
              <div>
                <h3 className="text-lg font-semibold text-green-900 mb-4">Group Buy Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Group Name</label>
                      <input
                        type="text"
                        value={newGroup.name}
                        onChange={(e) => setNewGroup({...newGroup, name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white/80 backdrop-blur-sm"
                        placeholder="Enter group name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                      <select
                        value={newGroup.category}
                        onChange={(e) => setNewGroup({...newGroup, category: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white/80 backdrop-blur-sm"
                      >
                        <option value="">Select category</option>
                        <option value="fresh-produce">Fresh Produce</option>
                        <option value="meat-poultry">Meat & Poultry</option>
                        <option value="fish-seafood">Fish & Seafood</option>
                        <option value="grains-cereals">Grains & Cereals</option>
                        <option value="spices-herbs">Spices & Herbs</option>
                        <option value="dairy-eggs">Dairy & Eggs</option>
                        <option value="bakery">Bakery & Bread</option>
                        <option value="beverages">Beverages</option>
                        <option value="household">Household Goods</option>
                        <option value="clothing-textiles">Clothing & Textiles</option>
                        <option value="electronics">Electronics</option>
                        <option value="hardware-tools">Hardware & Tools</option>
                        <option value="cosmetics">Cosmetics & Toiletries</option>
                        <option value="medicines">Medicines & Health</option>
                        <option value="second-hand">Second-hand Goods</option>
                        <option value="imported">Imported Goods</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Target Members</label>
                      <input
                        type="number"
                        value={newGroup.targetMembers}
                        onChange={(e) => setNewGroup({...newGroup, targetMembers: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white/80 backdrop-blur-sm"
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white/80 backdrop-blur-sm h-32"
                        placeholder="Enter group description"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                      <input
                        type="date"
                        value={newGroup.dueDate}
                        onChange={(e) => setNewGroup({...newGroup, dueDate: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white/80 backdrop-blur-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Location</label>
                      <input
                        type="text"
                        value={newGroup.location}
                        onChange={(e) => setNewGroup({...newGroup, location: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white/80 backdrop-blur-sm"
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
                  className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create Group
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Group Details Modal */}
      {showDetailsModal && selectedGroupForDetails && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setShowDetailsModal(false)}
        >
          <div 
            className="bg-white rounded-xl shadow-xl max-w-4xl w-full m-4 flex flex-col max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Group Details</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {isEditingGroup ? 'Edit group information' : 'View group information'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {!isEditingGroup && (
                    <button
                      onClick={() => setIsEditingGroup(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                    >
                      Edit Details
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                      setIsEditingGroup(false);
                      setEditedGroup(null);
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Group Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Group Name</label>
                      {isEditingGroup ? (
                        <input
                          type="text"
                          value={editedGroup?.name || ''}
                          onChange={(e) => setEditedGroup({...editedGroup!, name: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      ) : (
                        <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{selectedGroupForDetails.name}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                      {isEditingGroup ? (
                        <input
                          type="text"
                          value={editedGroup?.category || ''}
                          onChange={(e) => setEditedGroup({...editedGroup!, category: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      ) : (
                        <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{selectedGroupForDetails.category}</p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      {isEditingGroup ? (
                        <textarea
                          value={editedGroup?.description || ''}
                          onChange={(e) => setEditedGroup({...editedGroup!, description: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-32"
                        />
                      ) : (
                        <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg min-h-[128px]">{selectedGroupForDetails.description}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                      {isEditingGroup ? (
                        <input
                          type="text"
                          value={editedGroup?.productName || ''}
                          onChange={(e) => setEditedGroup({...editedGroup!, productName: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      ) : (
                        <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{selectedGroupForDetails.product?.name || 'N/A'}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Regular Price</label>
                      {isEditingGroup ? (
                        <input
                          type="text"
                          value={editedGroup?.regularPrice || ''}
                          onChange={(e) => setEditedGroup({...editedGroup!, regularPrice: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      ) : (
                        <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{selectedGroupForDetails.product?.regularPrice || 'N/A'}</p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Product Image</label>
                      <div className="flex items-center space-x-4">
                        <img
                          src={selectedGroupForDetails.product?.image || selectedGroupForDetails.image || '/api/placeholder/150/100'}
                          alt={selectedGroupForDetails.product?.name}
                          className="w-20 h-20 object-cover rounded-md border border-gray-200"
                        />
                        {isEditingGroup && (
                          <span className="text-sm text-gray-500">Image editing not available</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t bg-gray-50 mt-auto">
              <div className="flex justify-end gap-3">
                {isEditingGroup ? (
                  <>
                    <button
                      onClick={() => {
                        setIsEditingGroup(false);
                        setEditedGroup({
                          name: selectedGroupForDetails.name,
                          category: selectedGroupForDetails.category,
                          description: selectedGroupForDetails.description,
                          productName: selectedGroupForDetails.product?.name || '',
                          regularPrice: selectedGroupForDetails.product?.regularPrice || ''
                        });
                      }}
                      className="px-6 py-2.5 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          // Update group details via API
                          await apiService.updateGroupDetails(selectedGroupForDetails.id, editedGroup);
                          
                          // Exit edit mode and refresh data
                          setIsEditingGroup(false);
                          setEditedGroup(null);
                          
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
                          console.error('Error updating group:', error);
                          alert('Failed to update group details. Please try again.');
                        }
                      }}
                      className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                    >
                      Save Changes
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                      setIsEditingGroup(false);
                      setEditedGroup(null);
                    }}
                    className="px-6 py-2.5 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
                  >
                    Close
                  </button>
                )}
              </div>
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
