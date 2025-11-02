import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, User, X, Eye } from 'lucide-react';
import apiService from '../services/api';

export default function GroupList() {
  const navigate = useNavigate();
  const [showQRCode, setShowQRCode] = useState(false);
  const [selectedQRGroup, setSelectedQRGroup] = useState<any>(null);
  const [showGroupDetails, setShowGroupDetails] = useState(false);
  const [selectedGroupDetails, setSelectedGroupDetails] = useState<any>(null);
  const [updatingQuantity, setUpdatingQuantity] = useState(false);
  const [newQuantity, setNewQuantity] = useState<number>(1);
  const [activeGroups, setActiveGroups] = useState<any[]>([]);
  const [pastGroupsSummary, setPastGroupsSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [readyForCollectionSearch, setReadyForCollectionSearch] = useState('');
  const [activeGroupsSearch, setActiveGroupsSearch] = useState('');
  const [userLocation, setUserLocation] = useState<string>('Harare');

  // Fetch user's groups and past groups summary on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch user data to get location
        const userData = await apiService.getCurrentUser();
        setUserLocation(userData.location_zone || 'Harare');

        // Fetch user's groups and past groups summary in parallel
        const [groupsResponse, summaryResponse] = await Promise.all([
          apiService.getMyGroups(),
          apiService.getPastGroupsSummary()
        ]);

        setActiveGroups(groupsResponse);
        setPastGroupsSummary(summaryResponse);
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleShowQRCode = async (group: any) => {
    try {
      // Fetch QR code data from API
      const qrData = await apiService.getGroupQRCode(group.id);
      setSelectedQRGroup({
        ...group,
        qrCode: qrData.qr_code, // Base64 encoded QR code image
        qrData: qrData // Additional QR data if needed
      });
      setShowQRCode(true);
    } catch (err) {
      console.error('Failed to fetch QR code:', err);
      // For now, still show the modal with placeholder
      setSelectedQRGroup(group);
      setShowQRCode(true);
    }
  };

  const handleViewGroupDetails = (group: any) => {
    setSelectedGroupDetails(group);
    setNewQuantity(group.quantity || 1); // Initialize with current quantity
    setShowGroupDetails(true);
  };

  const closeQRCodeModal = () => {
    setShowQRCode(false);
    setSelectedQRGroup(null);
  };

  const closeGroupDetailsModal = () => {
    setShowGroupDetails(false);
    setSelectedGroupDetails(null);
  };

  const handleUpdateQuantity = async () => {
    if (!selectedGroupDetails || newQuantity <= 0) return;

    try {
      setUpdatingQuantity(true);
      await apiService.updateContribution(selectedGroupDetails.id, newQuantity);
      
      // Refresh the groups data
      const [groupsResponse] = await Promise.all([
        apiService.getMyGroups()
      ]);
      setActiveGroups(groupsResponse);
      
      // Update the selected group details with new quantity
      setSelectedGroupDetails({
        ...selectedGroupDetails,
        // The quantity will be reflected in the refreshed data
      });
      
      alert('Quantity updated successfully!');
    } catch (err) {
      console.error('Failed to update quantity:', err);
      alert('Failed to update quantity. Please try again.');
    } finally {
      setUpdatingQuantity(false);
    }
  };

  // Filter functions for search
  const filteredReadyForCollection = activeGroups.filter(group => {
    if (group.status !== 'ready_for_pickup') return false;
    if (!readyForCollectionSearch) return true;
    
    const searchTerm = readyForCollectionSearch.toLowerCase();
    return (
      group.name?.toLowerCase().includes(searchTerm) ||
      group.description?.toLowerCase().includes(searchTerm) ||
      group.pickupLocation?.toLowerCase().includes(searchTerm)
    );
  });

  const filteredActiveGroups = activeGroups.filter(group => {
    if (group.status === 'ready_for_pickup') return false;
    if (!activeGroupsSearch) return true;
    
    const searchTerm = activeGroupsSearch.toLowerCase();
    return (
      group.name?.toLowerCase().includes(searchTerm) ||
      group.description?.toLowerCase().includes(searchTerm) ||
      group.pickupLocation?.toLowerCase().includes(searchTerm)
    );
  });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="px-3 sm:px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-8">
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

          {/* Top Navigation */}
          <nav className="hidden md:flex items-center gap-6 flex-1">
            <button 
              onClick={() => navigate('/profile')}
              className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900"
            >
              <User className="w-4 h-4" />
              Profile
            </button>
            <button 
              onClick={() => navigate('/trader')}
              className="text-sm text-gray-700 hover:text-gray-900"
            >
              Recommended
            </button>
            <button 
              onClick={() => navigate('/groups')}
              className="text-sm font-medium text-blue-600"
            >
              My Groups
            </button>
            <button 
              onClick={() => navigate('/all-groups')}
              className="text-sm text-gray-700 hover:text-gray-900"
            >
              All Groups
            </button>
          </nav>

          {/* Right Side */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 flex-shrink-0">
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search groups..."
                className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent w-40 lg:w-48"
              />
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-700">
              <MapPin className="w-4 h-4" />
              <span>{userLocation}</span>
            </div>
            <button 
              onClick={() => navigate('/login')}
              className="px-3 sm:px-4 py-2 bg-red-500 text-white text-xs sm:text-sm rounded-lg hover:bg-red-600 transition whitespace-nowrap"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Tabs - Responsive */}
      <div className="bg-white border-b border-gray-200 sticky top-[73px] z-40">
        <div className="px-3 sm:px-6">
          <nav className="flex gap-4 sm:gap-8">
            <button
              onClick={() => navigate('/trader')}
              className="py-3 sm:py-4 text-sm font-medium border-b-2 border-transparent text-gray-600 hover:text-gray-900 transition whitespace-nowrap"
            >
              Recommended
            </button>
            <button
              onClick={() => navigate('/groups')}
              className="py-3 sm:py-4 text-sm font-medium border-b-2 border-blue-600 text-blue-600 transition whitespace-nowrap"
            >
              My Groups
            </button>
            <button
              onClick={() => navigate('/all-groups')}
              className="py-3 sm:py-4 text-sm font-medium border-b-2 border-transparent text-gray-600 hover:text-gray-900 transition whitespace-nowrap"
            >
              All Groups
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content - Responsive */}
      <main className="flex-1 px-3 sm:px-6 py-4 sm:py-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Two Column Layout for Ready for Collection and My Active Groups */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Ready for Collection Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4 sm:p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Ready for Collection</h2>
                    <p className="text-sm text-gray-600 mt-1">Groups that are ready for pickup at your selected location</p>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search groups..."
                      value={readyForCollectionSearch}
                      onChange={(e) => setReadyForCollectionSearch(e.target.value)}
                      className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent w-48"
                    />
                  </div>
                </div>
              </div>
              
              {/* Ready for Collection - Scrollable Content */}
              <div className="max-h-[400px] overflow-y-auto overflow-x-hidden">
                {loading ? (
                  <div className="p-4 sm:p-6">
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                      <h3 className="text-lg font-medium text-gray-900 mt-4">Loading ready for collection...</h3>
                      <p className="text-gray-600">Checking for groups ready for pickup</p>
                    </div>
                  </div>
                ) : error ? (
                  <div className="p-4 sm:p-6">
                    <div className="text-center py-8">
                      <div className="text-red-500 mb-4">
                        <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load groups</h3>
                      <p className="text-gray-600">{error}</p>
                    </div>
                  </div>
                ) : filteredReadyForCollection.length === 0 ? (
                  <div className="p-4 sm:p-6">
                    <div className="text-center py-8">
                      <div className="text-gray-400 mb-4">
                        <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {readyForCollectionSearch ? 'No groups match your search' : 'No groups ready for collection'}
                      </h3>
                      <p className="text-gray-600">
                        {readyForCollectionSearch ? 'Try adjusting your search terms' : 'Groups will appear here when they\'re ready for pickup'}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 sm:p-6">
                    <div className="grid grid-cols-1 gap-4">
                      {filteredReadyForCollection.map((group) => (
                        <div key={group.id} className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4 hover:shadow-md transition">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900 mb-1">{group.name}</h3>
                              <p className="text-sm text-gray-600 mb-2 line-clamp-2">{group.description}</p>
                              <div className="flex items-center gap-4 text-sm text-gray-600">
                                <span className="flex items-center gap-1">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                  </svg>
                                  {group.pickupLocation}
                                </span>
                              </div>
                            </div>
                            <div className="flex-shrink-0 ml-4">
                              <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                                Ready for Pickup
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-600">
                              <span className="font-medium text-gray-900">{group.price}</span> per person
                            </div>
                            <button
                              onClick={() => handleShowQRCode(group)}
                              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition font-medium flex items-center gap-2"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M12 12l3-3m-3 3l-3-3m-3 6h2.01M12 12l-3 3m3-3l3 3M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              Show QR Code
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* My Active Groups Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4 sm:p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900">My Active Groups</h2>
                    <p className="text-sm text-gray-600 mt-1">Groups you've joined that are currently active</p>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search groups..."
                      value={activeGroupsSearch}
                      onChange={(e) => setActiveGroupsSearch(e.target.value)}
                      className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent w-48"
                    />
                  </div>
                </div>
              </div>
              
              {/* My Active Groups - Responsive Table */}
              <div className="max-h-[600px] overflow-y-auto overflow-x-hidden">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <h3 className="text-lg font-medium text-gray-900 mt-4">Loading your active groups...</h3>
                    <p className="text-gray-600">Fetching your group participation data</p>
                  </div>
                ) : error ? (
                  <div className="text-center py-8">
                    <div className="text-red-500 mb-4">
                      <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load groups</h3>
                    <p className="text-gray-600">{error}</p>
                  </div>
                ) : filteredActiveGroups.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-gray-400 mb-4">
                      <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      {activeGroupsSearch ? 'No groups match your search' : 'No active groups'}
                    </h3>
                    <p className="text-gray-600">
                      {activeGroupsSearch ? 'Try adjusting your search terms' : 'You haven\'t joined any active groups yet'}
                    </p>
                  </div>
                ) : (
                  <div className="p-4 sm:p-6">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                        <tr>
                          <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50">Group Name</th>
                          <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50">Status</th>
                          <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50">Progress</th>
                          <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50">Due Date</th>
                          <th className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {filteredActiveGroups.map((group) => (
                          <tr key={group.id} className="hover:bg-gray-50">
                            <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm text-gray-900">{group.name}</td>
                            <td className="px-3 sm:px-6 py-3 sm:py-4">
                              <span className={`inline-flex px-2 sm:px-2.5 py-0.5 sm:py-1 text-xs font-medium rounded-full ${
                                group.status === 'forming' ? 'bg-blue-100 text-blue-700' :
                                group.status === 'active' ? 'bg-green-100 text-green-700' :
                                group.status === 'payment_pending' ? 'bg-yellow-100 text-yellow-700' :
                                group.status === 'processing' ? 'bg-purple-100 text-purple-700' :
                                group.status === 'ready_for_pickup' ? 'bg-orange-100 text-orange-700' :
                                group.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {group.status === 'forming' ? 'Forming Group' :
                                 group.status === 'active' ? 'Active' :
                                 group.status === 'payment_pending' ? 'Payment Due' :
                                 group.status === 'processing' ? 'Processing' :
                                 group.status === 'ready_for_pickup' ? 'Ready for Pickup' :
                                 group.status === 'completed' ? 'Completed' :
                                 'Cancelled'}
                              </span>
                            </td>
                            <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm text-gray-700">{group.progress}</td>
                            <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm text-gray-700">{group.dueDate}</td>
                            <td className="px-3 sm:px-6 py-3 sm:py-4">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleViewGroupDetails(group)}
                                  className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition"
                                >
                                  <Eye className="w-3 h-3" />
                                  View Group
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Past Groups - Full Width Below */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-4 sm:p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Past Groups</h3>
              <p className="text-sm text-gray-600 mt-1">Summary of your completed admin-created group buys.</p>
            </div>
            <div className="p-4 sm:p-6 space-y-3">
              {loading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-sm text-gray-600 mt-2">Loading past groups summary...</p>
                </div>
              ) : error ? (
                <div className="text-center py-4">
                  <p className="text-sm text-red-600">Failed to load past groups summary</p>
                </div>
              ) : pastGroupsSummary ? (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Completed Groups:</span>
                    <span className="font-semibold text-gray-900">{pastGroupsSummary.completed_groups || 0}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Savings:</span>
                    <span className="font-semibold text-gray-900">${pastGroupsSummary.all_time_savings?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Success Rate:</span>
                    <span className="font-semibold text-gray-900">{pastGroupsSummary.success_rate ? `${(pastGroupsSummary.success_rate * 100).toFixed(1)}%` : '0%'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Avg Savings per Group:</span>
                    <span className="font-semibold text-gray-900">${pastGroupsSummary.avg_savings_per_group?.toFixed(2) || '0.00'}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Completed Groups:</span>
                    <span className="font-semibold text-gray-900">0</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Total Savings:</span>
                    <span className="font-semibold text-gray-900">$0.00</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Success Rate:</span>
                    <span className="font-semibold text-gray-900">0%</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="px-3 sm:px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0 text-sm text-gray-600">
          <div className="flex gap-4 sm:gap-6">
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

      {/* QR Code Modal */}
      {showQRCode && selectedQRGroup && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={closeQRCodeModal}
        >
          <div 
            className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header - Fixed at top */}
            <div className="bg-gradient-to-r from-green-600 to-green-700 p-6 text-white relative flex-shrink-0">
              <button
                onClick={closeQRCodeModal}
                className="absolute top-4 right-4 text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-1 transition"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="text-center">
                <h2 className="text-xl font-bold">Pickup QR Code</h2>
                <p className="text-green-100 mt-1">Show this at {selectedQRGroup.pickupLocation}</p>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-8 flex items-center justify-center">
                <div className="text-center">
                  {selectedQRGroup?.qrCode ? (
                    // Display actual QR code from API
                    <img
                      src={`data:image/png;base64,${selectedQRGroup.qrCode}`}
                      alt="QR Code for pickup"
                      className="w-48 h-48 mx-auto mb-4 border-2 border-gray-200 rounded-lg"
                    />
                  ) : (
                    // Fallback placeholder
                    <div className="w-48 h-48 bg-white border-2 border-gray-200 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <div className="text-center text-gray-400">
                        <div className="text-6xl mb-2"></div>
                        <div className="text-sm">Loading QR Code...</div>
                        <div className="text-xs mt-1">Order #{selectedQRGroup?.id?.toString().padStart(6, '0')}</div>
                      </div>
                    </div>
                  )}
                  <p className="text-sm text-gray-600">Scan this QR code at the pickup location</p>
                </div>
              </div>

              {/* Order Details */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">Order Details</h3>
                <div className="space-y-1 text-sm text-blue-800">
                  <div className="flex justify-between">
                    <span>Order #:</span>
                    <span className="font-mono">{selectedQRGroup.id.toString().padStart(6, '0')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Product:</span>
                    <span>{selectedQRGroup.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pickup Location:</span>
                    <span>{selectedQRGroup.pickupLocation}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className="text-green-600 font-medium">Ready for Pickup</span>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-900 mb-2">Pickup Instructions</h4>
                <ul className="text-sm text-yellow-800 space-y-1">
                  <li>• Bring this QR code to {selectedQRGroup.pickupLocation}</li>
                  <li>• Show valid ID if requested</li>
                  <li>• Collect your order and verify contents</li>
                  <li>• Sign receipt upon pickup</li>
                </ul>
              </div>
            </div>

            {/* Action Buttons - Fixed at bottom */}
            <div className="flex-shrink-0 border-t border-gray-200 p-6">
              <button
                onClick={closeQRCodeModal}
                className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition font-medium"
              >
                Got it - Ready to Pickup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Group Details Modal */}
      {showGroupDetails && selectedGroupDetails && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={closeGroupDetailsModal}
        >
          <div 
            className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header - Fixed at top */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white relative flex-shrink-0">
              <button
                onClick={closeGroupDetailsModal}
                className="absolute top-4 right-4 text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-1 transition"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="text-center">
                <h2 className="text-xl font-bold">Group Details</h2>
                <p className="text-blue-100 mt-1">Group #{selectedGroupDetails.id.toString().padStart(6, '0')}</p>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Group Name and Status */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{selectedGroupDetails.name}</h3>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    selectedGroupDetails.status === 'forming' ? 'bg-blue-100 text-blue-700' :
                    selectedGroupDetails.status === 'active' ? 'bg-green-100 text-green-700' :
                    selectedGroupDetails.status === 'payment_pending' ? 'bg-yellow-100 text-yellow-700' :
                    selectedGroupDetails.status === 'processing' ? 'bg-purple-100 text-purple-700' :
                    selectedGroupDetails.status === 'ready_for_pickup' ? 'bg-orange-100 text-orange-700' :
                    selectedGroupDetails.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {selectedGroupDetails.status === 'forming' ? 'Forming Group' :
                     selectedGroupDetails.status === 'active' ? 'Active' :
                     selectedGroupDetails.status === 'payment_pending' ? 'Payment Due' :
                     selectedGroupDetails.status === 'processing' ? 'Processing' :
                     selectedGroupDetails.status === 'ready_for_pickup' ? 'Ready for Pickup' :
                     selectedGroupDetails.status === 'completed' ? 'Completed' :
                     'Cancelled'}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                <p className="text-sm text-gray-700">{selectedGroupDetails.description}</p>
              </div>

              {/* Group Information */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-1">Progress</h4>
                  <p className="text-sm text-blue-800">{selectedGroupDetails.progress}</p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-green-900 mb-1">Price</h4>
                  <p className="text-sm text-green-800">{selectedGroupDetails.price}</p>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h4 className="font-semibold text-purple-900 mb-1">Due Date</h4>
                  <p className="text-sm text-purple-800">{selectedGroupDetails.dueDate}</p>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h4 className="font-semibold text-orange-900 mb-1">Savings</h4>
                  <p className="text-sm text-orange-800">{selectedGroupDetails.savings}</p>
                </div>
              </div>

              {/* Pickup Location */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-900 mb-2">Pickup Location</h4>
                <div className="flex items-center gap-2 text-sm text-yellow-800">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {selectedGroupDetails.pickupLocation}
                </div>
              </div>

              {/* Order Status */}
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <h4 className="font-semibold text-indigo-900 mb-2">Order Status</h4>
                <p className="text-sm text-indigo-800">{selectedGroupDetails.orderStatus}</p>
              </div>

              {/* Add More Products - Only for active groups */}
              {selectedGroupDetails.status === 'active' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-green-900 mb-2">Add More Products</h4>
                  <p className="text-sm text-green-800 mb-3">Increase your quantity commitment to this group</p>
                  
                  <div className="flex items-center gap-3">
                    <label className="text-sm font-medium text-green-900">New Quantity:</label>
                    <input
                      type="number"
                      min="1"
                      value={newQuantity}
                      onChange={(e) => setNewQuantity(parseInt(e.target.value) || 1)}
                      className="flex-1 px-3 py-2 border border-green-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                      placeholder="Enter quantity"
                    />
                    <button
                      onClick={handleUpdateQuantity}
                      disabled={updatingQuantity || newQuantity <= 0}
                      className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition font-medium"
                    >
                      {updatingQuantity ? 'Updating...' : 'Update'}
                    </button>
                  </div>
                  
                  <p className="text-xs text-green-700 mt-2">
                    Current quantity: {selectedGroupDetails.quantity || 'N/A'} | 
                    Unit price: {selectedGroupDetails.originalPrice} | 
                    Bulk price: {selectedGroupDetails.price}
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons - Fixed at bottom */}
            <div className="flex-shrink-0 border-t border-gray-200 p-6">
              <div className="flex gap-3">
                <button
                  onClick={closeGroupDetailsModal}
                  className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  Close
                </button>
                {selectedGroupDetails.status === 'ready_for_pickup' && (
                  <button
                    onClick={() => {
                      closeGroupDetailsModal();
                      handleShowQRCode(selectedGroupDetails);
                    }}
                    className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition font-medium"
                  >
                    Show QR Code
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
