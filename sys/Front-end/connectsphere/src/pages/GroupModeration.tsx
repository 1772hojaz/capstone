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
  X
} from 'lucide-react';

const GroupModeration = () => {
  const [showPaymentModal, setShowPaymentModal] = React.useState(false);
  const [selectedPaymentGroup, setSelectedPaymentGroup] = React.useState<any>(null);
  type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed';
  const [paymentStatus, setPaymentStatus] = React.useState<PaymentStatus>('pending');
  const [showCreateModal, setShowCreateModal] = useState(false);
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

  const reportedContent = [
    {
      id: 1,
      group: 'Tech Gadgets Collective',
      reporter: 'User#4521',
      reason: 'Spam content',
      date: '2024-01-15',
      severity: 'Medium',
    },
    {
      id: 2,
      group: 'Fashion Forward',
      reporter: 'User#7832',
      reason: 'Inappropriate listing',
      date: '2024-01-14',
      severity: 'High',
    },
  ];

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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow-sm p-4 border border-blue-200">
            <div className="flex items-center gap-2 mb-1">
              <ShoppingBag className="w-4 h-4 text-blue-600" />
              <p className="text-sm text-gray-600">Active Groups</p>
            </div>
            <p className="text-2xl font-bold text-blue-600">{moderationStats.active_groups}</p>
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Active Groups</h3>
                  <p className="text-sm text-gray-600 mt-1">Currently active group buying opportunities</p>
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
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
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
              <div key={group.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition">
                <div className="flex items-start gap-4 mb-4">
                  {/* Thumbnail */}
                  <div className="flex-shrink-0">
                    <img
                      src={group.product?.image || group.image || '/api/placeholder/150/100'}
                      alt={group.product?.name || group.name}
                      className="w-28 h-20 object-cover rounded-md border border-gray-200"
                    />
                  </div>

                  <div className="flex-1">
                    {/* Group Details */}
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="text-lg font-semibold text-gray-900">{group.name}</h4>
                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                        <Users className="w-3 h-3" /> {group.members}/{group.targetMembers}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{group.description}</p>
                    <div className="flex flex-wrap gap-4 text-xs text-gray-500 mb-4">
                      <span>Category: <span className="font-medium">{group.category}</span></span>
                      <span>Due Date: <span className="font-medium">{group.dueDate}</span></span>
                      <span>Total Amount: <span className="font-medium text-blue-600">{group.totalAmount}</span></span>
                    </div>

                    {/* Product Details */}
                    <div className="bg-gray-50 p-3 rounded-lg mb-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Package className="w-4 h-4 text-blue-600" />
                        <h5 className="font-medium text-gray-900">{group.product.name}</h5>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{group.product.description}</p>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Regular Price:</span>
                          <span className="font-medium text-gray-900 ml-1">{group.product.regularPrice}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Bulk Price:</span>
                          <span className="font-medium text-green-600 ml-1">{group.product.bulkPrice}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Stock:</span>
                          <span className="font-medium text-gray-900 ml-1">{group.product.totalStock} units</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Manufacturer:</span>
                          <span className="font-medium text-gray-900 ml-1">{group.product.manufacturer}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePaymentProcess(group)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition"
                  >
                    <DollarSign className="w-4 h-4" />
                    Process Payment
                  </button>
                  <button className="px-4 py-2 border border-gray-300 text-sm rounded-lg hover:bg-gray-50 transition">
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ready for Payment */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Ready for Payment</h3>
                  <p className="text-sm text-gray-600 mt-1">Groups that have reached their target and are ready for payment</p>
                </div>
              </div>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
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
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
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
              <div key={group.id} className="border border-green-200 bg-green-50 rounded-lg p-4 hover:bg-green-100 transition">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="text-lg font-semibold text-gray-900">{group.name}</h4>
                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-200 text-green-800 rounded">
                        <CheckCircle2 className="w-3 h-3" /> Ready
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div>
                        <p className="text-sm text-gray-600">Members</p>
                        <p className="text-base font-medium text-gray-900">{group.members}/{group.targetMembers}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Total Amount</p>
                        <p className="text-base font-medium text-green-600">{group.totalAmount}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePaymentProcess(group)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition"
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
                        <option value="fashion">Fashion</option>
                        <option value="home">Home & Living</option>
                        <option value="beauty">Beauty & Health</option>
                        <option value="sports">Sports & Outdoor</option>
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
      {/* Admin Helper Message */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <AlertTriangle className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-blue-900">Admin Guidelines</h3>
            <p className="text-sm text-blue-700 mt-1">Important information for managing groups</p>
          </div>
        </div>
        <div className="space-y-3 text-sm text-blue-800">
          <p>• As an admin, you are responsible for creating new group buying opportunities for traders</p>
          <p>• Set realistic target member counts and deadlines to ensure group success</p>
          <p>• Monitor active groups and process payments promptly when targets are reached</p>
          <p>• Ensure accurate product descriptions and pricing information</p>
          <p>• Coordinate with local pickup locations for smooth delivery process</p>
        </div>
      </div>
    </Layout>
  );
};

export default GroupModeration;
