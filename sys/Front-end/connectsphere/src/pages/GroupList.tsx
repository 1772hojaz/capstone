import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, MapPin, User, X, Eye, ChevronDown, ChevronUp, EyeOff, RefreshCw } from 'lucide-react';
import apiService from '../services/api';

export default function GroupList() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showQRCode, setShowQRCode] = useState(false);
  const [selectedQRGroup, setSelectedQRGroup] = useState<any>(null);
  const [showGroupDetails, setShowGroupDetails] = useState(false);
  const [selectedGroupDetails, setSelectedGroupDetails] = useState<any>(null);
  const [updatingQuantity, setUpdatingQuantity] = useState(false);
  const [newQuantity, setNewQuantity] = useState<number>(1);
  const [activeGroups, setActiveGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [readyForCollectionSearch, setReadyForCollectionSearch] = useState('');
  const [activeGroupsSearch, setActiveGroupsSearch] = useState('');
  const [userLocation, setUserLocation] = useState<string>('Harare');
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
  
  // New state for expandable sections with localStorage persistence
  const [isActiveGroupsExpanded, setIsActiveGroupsExpanded] = useState(() => {
    const saved = localStorage.getItem('activeGroupsExpanded');
    return saved ? JSON.parse(saved) : true;
  });
  const [isReadyForCollectionVisible, setIsReadyForCollectionVisible] = useState(() => {
    const saved = localStorage.getItem('readyForCollectionVisible');
    return saved ? JSON.parse(saved) : true;
  });

  const locationOptions = [
    'Harare',
    'Mbare',
    'Glen View',
    'Highfield',
    'Bulawayo',
    'Downtown',
    'Uptown',
    'Suburbs'
  ];

  const handleLocationChange = async (newLocation: string) => {
    try {
      await apiService.updateProfile({ location_zone: newLocation });
      setUserLocation(newLocation);
      setIsLocationDropdownOpen(false);
    } catch (err) {
      console.error('Failed to update location:', err);
    }
  };

  // Fetch user's groups on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch user data to get location
        const userData = await apiService.getCurrentUser();
        setUserLocation(userData.location_zone || 'Harare');

        // Fetch user's groups
        const [groupsResponse] = await Promise.all([
          apiService.getMyGroups()
        ]);

        // Remove duplicates based on group ID
        const uniqueGroups = groupsResponse.filter((group, index, self) => 
          index === self.findIndex(g => g.id === group.id)
        );

        setActiveGroups(uniqueGroups);
      } catch (err) {
        console.error('Failed to fetch data:', err);
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isLocationDropdownOpen && !(event.target as Element).closest('.location-dropdown')) {
        setIsLocationDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isLocationDropdownOpen]);

  // Save preferences to localStorage
  useEffect(() => {
    localStorage.setItem('activeGroupsExpanded', JSON.stringify(isActiveGroupsExpanded));
  }, [isActiveGroupsExpanded]);

  useEffect(() => {
    localStorage.setItem('readyForCollectionVisible', JSON.stringify(isReadyForCollectionVisible));
  }, [isReadyForCollectionVisible]);

  // WebSocket connection for real-time QR updates
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      console.log('🔗 Setting up WebSocket connection for real-time QR updates...');
      console.log('🔑 Token available:', !!token);
      apiService.connectWebSocket(token);
    } else {
      console.log('⚠️ No token available for WebSocket connection');
    }

    return () => {
      // Cleanup WebSocket connection on unmount
      console.log('🧹 Cleaning up WebSocket connection');
      apiService.disconnectWebSocket();
    };
  }, []);

  // Listen for navigation state changes (e.g., returning from payment success)
  useEffect(() => {
    // Check if we have state indicating a successful payment/quantity update
    if (location.state?.refreshGroups) {
      console.log('🔄 Refreshing groups data after payment success');
      const fetchData = async () => {
        try {
          setLoading(true);
          setError(null);

          // Fetch user data to get location
          const userData = await apiService.getCurrentUser();
          setUserLocation(userData.location_zone || 'Harare');

          // Fetch user's groups
          const [groupsResponse] = await Promise.all([
            apiService.getMyGroups()
          ]);

          // Remove duplicates based on group ID
          const uniqueGroups = groupsResponse.filter((group, index, self) => 
            index === self.findIndex(g => g.id === group.id)
          );

          setActiveGroups(uniqueGroups);
        } catch (err) {
          console.error('Failed to refresh data:', err);
          setError(err instanceof Error ? err.message : String(err));
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }
  }, [location.state]);

  // Connect WebSocket for live QR status and set up listener
  useEffect(() => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        apiService.connectWebSocket(token);
      }
      const handler = () => {
        // On any qrStatusUpdate, refresh current selection to get latest status
        refreshQRStatus();
      };
      window.addEventListener('qrStatusUpdate', handler as EventListener);
      return () => {
        window.removeEventListener('qrStatusUpdate', handler as EventListener);
      };
    } catch (e) {
      console.warn('WebSocket setup failed:', e);
    }
  }, [selectedQRGroup]);

  const handleShowQRCode = async (group: any) => {
    try {
      console.log('🔍 Fetching QR code for group:', group.id);
      // Fetch QR code data from API
      const qrData = await apiService.getGroupQRCode(group.id);
      console.log('📥 QR data received from API:', qrData);
      console.log('🔄 is_used value:', qrData.is_used, 'type:', typeof qrData.is_used);
      console.log('📊 status_text value:', qrData.status_text);

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

  const refreshQRStatus = async () => {
    if (!selectedQRGroup) return;
    
    try {
      console.log('🔄 Refreshing QR status for group:', selectedQRGroup.id);
      console.log('📊 Current QR data before refresh:', selectedQRGroup.qrData);
      // IMPORTANT: Only use the group endpoint, never admin endpoints
      const qrData = await apiService.getGroupQRCode(selectedQRGroup.id);
      console.log('📥 Fresh QR data from API:', qrData);
      console.log('🔄 Fresh is_used value:', qrData.is_used, 'type:', typeof qrData.is_used);
      console.log('📊 Fresh status_text value:', qrData.status_text);
      
      // Update the selected QR group with fresh data
      setSelectedQRGroup((prev: any) => {
        console.log('🔄 Updating selectedQRGroup state:');
        console.log('   Previous qrData:', prev.qrData);
        console.log('   New qrData:', qrData);
        const updated = {
          ...prev,
          qrCode: qrData.qr_code,
          qrData: {
            ...qrData,
            // Ensure we have the status data
            is_used: qrData.is_used,
            status_text: qrData.status_text
          }
        };
        console.log('   Updated selectedQRGroup:', updated);
        return updated;
      });
      console.log('✅ QR status updated successfully');
      
    } catch (err) {
      console.error('❌ Failed to refresh QR status:', err);
      // Show user-friendly error
      alert('Failed to refresh QR status. Please try again.');
    }
  };

  const closeGroupDetailsModal = () => {
    setShowGroupDetails(false);
    setSelectedGroupDetails(null);
  };

  const handleUpdateQuantity = async () => {
    if (!selectedGroupDetails || newQuantity <= 0) return;

    // Check if quantity is being increased
    const currentQuantity = selectedGroupDetails.quantity || 1;
    const isIncreasingQuantity = newQuantity > currentQuantity;

    if (isIncreasingQuantity) {
      // Redirect to payment wall for quantity increase
      console.log('🔄 Quantity increase detected, redirecting to payment wall');
      console.log('📊 Current quantity:', currentQuantity, 'New quantity:', newQuantity);
      
      // Close the modal first
      closeGroupDetailsModal();
      
      // Navigate to payment wall with group details
      navigate('/payment', {
        state: {
          groupId: selectedGroupDetails.id,
          groupName: selectedGroupDetails.name,
          currentQuantity: currentQuantity,
          newQuantity: newQuantity,
          price: selectedGroupDetails.price,
          originalPrice: selectedGroupDetails.originalPrice,
          action: 'increase_quantity'
        }
      });
      return;
    }

    // Normal quantity update (decrease or same)
    try {
      setUpdatingQuantity(true);
      await apiService.updateContribution(selectedGroupDetails.id, newQuantity);
      
      // Refresh the groups data
      const [groupsResponse] = await Promise.all([
        apiService.getMyGroups()
      ]);
      
      // Remove duplicates based on group ID
      const uniqueGroups = groupsResponse.filter((group, index, self) => 
        index === self.findIndex(g => g.id === group.id)
      );
      
      setActiveGroups(uniqueGroups);
      
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
              onClick={() => navigate('/all-groups')}
              className="text-sm text-gray-700 hover:text-gray-900"
            >
              All Groups
            </button>
            <button 
              onClick={() => navigate('/groups')}
              className="text-sm font-medium text-blue-600"
            >
              My Groups
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
            <div className="relative location-dropdown">
              <button
                onClick={() => setIsLocationDropdownOpen(!isLocationDropdownOpen)}
                className="flex items-center gap-2 text-xs sm:text-sm text-gray-700 hover:text-gray-900 transition-colors"
              >
                <MapPin className="w-4 h-4" />
                <span>{userLocation}</span>
                <ChevronDown className="w-3 h-3" />
              </button>
              {isLocationDropdownOpen && (
                <div className="absolute top-full mt-1 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[120px]">
                  {locationOptions.map((location) => (
                    <button
                      key={location}
                      onClick={() => handleLocationChange(location)}
                      className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 transition-colors ${
                        location === userLocation ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                      }`}
                    >
                      {location}
                    </button>
                  ))}
                </div>
              )}
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
          <div className={`grid gap-6 ${isReadyForCollectionVisible ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
            {/* Ready for Collection Section */}
            {isReadyForCollectionVisible && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4 sm:p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Ready for Collection</h2>
                      <p className="text-sm text-gray-600 mt-1">Groups that are ready for pickup at your selected location</p>
                    </div>
                    <button
                      onClick={() => setIsReadyForCollectionVisible(false)}
                      className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                      title="Hide Ready for Collection section"
                      aria-label="Hide Ready for Collection section"
                    >
                      <EyeOff className="w-5 h-5" />
                    </button>
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
            )}

            {/* My Active Groups Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="p-4 sm:p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <button
                      onClick={() => setIsActiveGroupsExpanded(!isActiveGroupsExpanded)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setIsActiveGroupsExpanded(!isActiveGroupsExpanded);
                        }
                      }}
                      className="flex items-center gap-3 text-left hover:bg-gray-50 p-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      aria-expanded={isActiveGroupsExpanded}
                      aria-label={`${isActiveGroupsExpanded ? 'Collapse' : 'Expand'} Active Groups section`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">My Active Groups</h2>
                          {!isActiveGroupsExpanded && filteredActiveGroups.filter(g => g.status === 'ready_for_pickup' || g.status === 'payment_pending').length > 0 && (
                            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" title="Action required"></span>
                          )}
                          {isActiveGroupsExpanded ? (
                            <ChevronUp className="w-5 h-5 text-gray-500" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-500" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">Groups you've joined that are currently active</p>
                      </div>
                    </button>
                    {!isReadyForCollectionVisible && (
                      <button
                        onClick={() => setIsReadyForCollectionVisible(true)}
                        className="flex items-center gap-2 px-4 py-2 text-sm bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                        aria-label="Show Ready for Collection section"
                      >
                        <Eye className="w-4 h-4" />
                        Show Ready for Collection
                      </button>
                    )}
                  </div>
                  {isActiveGroupsExpanded && (
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
                  )}
                </div>
              </div>
              
              {/* My Active Groups - Responsive Table */}
              {isActiveGroupsExpanded && (
                <div className="max-h-[600px] overflow-y-auto overflow-x-auto transition-all duration-300 ease-in-out">
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
                  <div className="p-2 sm:p-4">
                    <table className="w-full table-fixed">
                      <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                        <tr>
                          <th className="px-2 sm:px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50 w-2/6">Group Name</th>
                          <th className="px-2 sm:px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50 w-1/6">Created by</th>
                          <th className="px-2 sm:px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50 w-1/6">Status</th>
                          <th className="px-2 sm:px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50 w-1/6">Progress</th>
                          <th className="px-2 sm:px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50 w-1/6">Due Date</th>
                          <th className="px-2 sm:px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase bg-gray-50 w-1/6">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {filteredActiveGroups.map((group) => (
                          <tr key={group.id} className="hover:bg-gray-50">
                            <td className="px-2 sm:px-3 py-2 text-sm text-gray-900 truncate">{group.name}</td>
                            <td className="px-2 sm:px-3 py-2 text-sm text-gray-600 truncate">
                              {group.adminName === "Admin" ? "Admin" : group.adminName}
                            </td>
                            <td className="px-2 sm:px-3 py-2">
                              <span className={`inline-flex px-1.5 py-0.5 text-xs font-medium rounded-full ${
                                group.status === 'forming' ? 'bg-blue-100 text-blue-700' :
                                group.status === 'active' ? 'bg-green-100 text-green-700' :
                                group.status === 'payment_pending' ? 'bg-yellow-100 text-yellow-700' :
                                group.status === 'processing' ? 'bg-purple-100 text-purple-700' :
                                group.status === 'ready_for_pickup' ? 'bg-orange-100 text-orange-700' :
                                group.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                                'bg-red-100 text-red-700'
                              }`}>
                                {group.status === 'forming' ? 'Forming' :
                                 group.status === 'active' ? 'Active' :
                                 group.status === 'payment_pending' ? 'Payment Due' :
                                 group.status === 'processing' ? 'Processing' :
                                 group.status === 'ready_for_pickup' ? 'Ready' :
                                 group.status === 'completed' ? 'Completed' :
                                 'Cancelled'}
                              </span>
                            </td>
                            <td className="px-2 sm:px-3 py-2 text-sm text-gray-700 truncate">{group.progress}</td>
                            <td className="px-2 sm:px-3 py-2 text-sm text-gray-700 truncate">{group.dueDate}</td>
                            <td className="px-2 sm:px-3 py-2">
                              <div className="flex gap-1">
                                <button
                                  onClick={() => handleViewGroupDetails(group)}
                                  className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition"
                                >
                                  <Eye className="w-3 h-3" />
                                  View
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
              )}
              
              {/* Collapsed Summary */}
              {!isActiveGroupsExpanded && (
                <div className="p-4 sm:p-6">
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>
                      {loading ? 'Loading...' : `${filteredActiveGroups.length} active groups`}
                    </span>
                    <div className="flex items-center gap-4">
                      {filteredActiveGroups.filter(g => g.status === 'ready_for_pickup').length > 0 && (
                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
                          {filteredActiveGroups.filter(g => g.status === 'ready_for_pickup').length} ready for pickup
                        </span>
                      )}
                      {filteredActiveGroups.filter(g => g.status === 'payment_pending').length > 0 && (
                        <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-medium">
                          {filteredActiveGroups.filter(g => g.status === 'payment_pending').length} payment due
                        </span>
                      )}
                    </div>
                  </div>
                </div>
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

      {/* QR Code Modal - Enhanced Design */}
      {showQRCode && selectedQRGroup && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={closeQRCodeModal}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header - Enhanced with better styling */}
            <div className="bg-gradient-to-br from-emerald-600 via-green-600 to-green-700 p-8 text-white relative flex-shrink-0">
              <button
                onClick={closeQRCodeModal}
                className="absolute top-4 right-4 text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all duration-200 hover:scale-110"
              >
                <X className="w-6 h-6" />
              </button>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="bg-white bg-opacity-20 rounded-full p-3">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M12 12l3-3m-3 3l-3-3m-3 6h2.01M12 12l-3 3m3-3l3 3M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Pickup QR Code</h2>
                    <p className="text-green-100 text-sm mt-1">Order #{selectedQRGroup.id.toString().padStart(6, '0')}</p>
                  </div>
                </div>
                <div className="bg-white bg-opacity-20 rounded-xl px-4 py-2">
                  <span className="text-sm font-semibold">Ready for Pickup</span>
                </div>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              {/* Location Header */}
              <div className="text-center pb-6 border-b-2 border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-3 block">Show at Pickup Location</h3>
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <p className="text-gray-600 font-medium">{selectedQRGroup.pickupLocation}</p>
                </div>
              </div>

              {/* QR Code Display with Enhanced Design */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-dashed border-green-300 rounded-2xl p-8 shadow-inner">
                <div className="text-center">
                  {selectedQRGroup?.qrCode ? (
                    // Display actual QR code from API
                    <div className="bg-white rounded-2xl p-6 shadow-lg mx-auto inline-block">
                      <img
                        src={`data:image/png;base64,${selectedQRGroup.qrCode}`}
                        alt="Pickup QR Code"
                        className="w-56 h-56 mx-auto rounded-xl border-4 border-green-200"
                      />
                    </div>
                  ) : (
                    // Fallback placeholder with enhanced design
                    <div className="bg-white rounded-2xl p-6 shadow-lg mx-auto inline-block">
                      <div className="w-56 h-56 bg-gradient-to-br from-gray-100 to-gray-200 border-4 border-green-200 rounded-xl flex items-center justify-center mx-auto">
                        <div className="text-center text-gray-500">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                          <div className="text-lg font-semibold mb-2">Loading QR Code...</div>
                          <div className="text-sm font-mono bg-gray-100 px-3 py-1 rounded">
                            #{selectedQRGroup?.id?.toString().padStart(6, '0')}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="mt-8 bg-green-50 rounded-xl p-4 border border-green-200">
                    <div className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5 text-green-700 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      <p className="text-green-800 font-medium">Scan this QR code at the pickup location</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Details Card */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 rounded-xl p-6 shadow-sm mt-8">
                <div className="flex items-start space-x-4">
                  <div className="bg-blue-500 rounded-full p-3 flex-shrink-0">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-blue-900 mb-6 text-lg block">Order Details</h3>
                    <div className="space-y-3">
                      <div className="bg-white rounded-lg p-4 flex justify-between items-center">
                        <span className="text-gray-600 font-medium">Order #:</span>
                        <span className="font-mono text-blue-900 bg-blue-100 px-3 py-1 rounded-lg">{selectedQRGroup.id.toString().padStart(6, '0')}</span>
                      </div>
                      <div className="bg-white rounded-lg p-4 flex justify-between items-center">
                        <span className="text-gray-600 font-medium">Product:</span>
                        <span className="font-semibold text-gray-900 text-right">{selectedQRGroup.name}</span>
                      </div>
                      <div className="bg-white rounded-lg p-4 flex justify-between items-center">
                        <span className="text-gray-600 font-medium">Created by:</span>
                        <span className="font-semibold text-gray-900">{selectedQRGroup.adminName === "Admin" ? "Admin" : selectedQRGroup.adminName}</span>
                      </div>
                      <div className="bg-white rounded-lg p-4 flex justify-between items-center">
                        <span className="text-gray-600 font-medium">Pickup Location:</span>
                        <span className="font-semibold text-gray-900 text-right flex items-center gap-2">
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {selectedQRGroup.pickupLocation}
                        </span>
                      </div>
                      <div className="bg-white rounded-lg p-4 flex justify-between items-center mb-2">
                        <span className="text-gray-600 font-medium">Status:</span>
                        <span className="bg-green-100 text-green-700 px-4 py-2 rounded-full font-semibold text-sm flex items-center gap-2 whitespace-nowrap">
                          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="whitespace-nowrap">Ready for Pickup</span>
                        </span>
                      </div>
                      {/* QR Code Status Row - Isolated */}
                      <div className="bg-white rounded-lg p-4 border border-gray-200 mt-4">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <span className="text-gray-600 font-medium block">QR Code Status:</span>
                            <button
                              onClick={refreshQRStatus}
                              className="text-blue-600 hover:text-blue-800 p-1 rounded-full hover:bg-blue-50 transition-colors flex-shrink-0"
                              title="Refresh QR status"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                            </button>
                          </div>
                          <div className={`px-4 py-2 rounded-full font-semibold text-sm flex items-center gap-2 border ${
                            selectedQRGroup?.qrData?.is_used 
                              ? 'bg-red-100 text-red-700 border-red-200' 
                              : 'bg-green-100 text-green-700 border-green-200'
                          }`}>
                            {/* Debug logging for QR status */}
                            {(() => {
                              console.log('🎨 Rendering QR status display:');
                              console.log('   selectedQRGroup:', selectedQRGroup);
                              console.log('   qrData:', selectedQRGroup?.qrData);
                              console.log('   is_used:', selectedQRGroup?.qrData?.is_used);
                              console.log('   status_text:', selectedQRGroup?.qrData?.status_text);
                              console.log('   Condition result:', selectedQRGroup?.qrData?.is_used ? 'USED (red)' : 'NOT USED (green)');
                              return null;
                            })()}
                            {selectedQRGroup?.qrData?.is_used ? (
                              <>
                                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span className="block">Used: {selectedQRGroup?.qrData?.status_text || "Yes"}</span>
                              </>
                            ) : (
                              <>
                                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="block">Used: {selectedQRGroup?.qrData?.status_text || "No"}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pickup Instructions Card */}
              <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-l-4 border-amber-500 rounded-xl p-6 shadow-sm">
                <div className="flex items-start space-x-4">
                  <div className="bg-amber-500 rounded-full p-3">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-amber-900 mb-4 text-lg">Pickup Instructions</h4>
                    <div className="space-y-3">
                      <div className="bg-white rounded-lg p-4 flex items-center space-x-3">
                        <div className="bg-amber-100 rounded-full p-2 flex-shrink-0">
                          <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <span className="text-amber-800 font-medium">Bring this QR code to {selectedQRGroup.pickupLocation}</span>
                      </div>
                      <div className="bg-white rounded-lg p-4 flex items-center space-x-3">
                        <div className="bg-amber-100 rounded-full p-2 flex-shrink-0">
                          <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                          </svg>
                        </div>
                        <span className="text-amber-800 font-medium">Show valid ID if requested</span>
                      </div>
                      <div className="bg-white rounded-lg p-4 flex items-center space-x-3">
                        <div className="bg-amber-100 rounded-full p-2 flex-shrink-0">
                          <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                          </svg>
                        </div>
                        <span className="text-amber-800 font-medium">Collect your order and verify contents</span>
                      </div>
                      <div className="bg-white rounded-lg p-4 flex items-center space-x-3">
                        <div className="bg-amber-100 rounded-full p-2 flex-shrink-0">
                          <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </div>
                        <span className="text-amber-800 font-medium">Sign receipt upon pickup</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons - Enhanced styling */}
            <div className="flex-shrink-0 bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200 p-6">
              <div className="flex gap-3">
                <button
                  onClick={async () => {
                    try {
                      const qrData = await apiService.getGroupQRCode(selectedQRGroup.id);
                      setSelectedQRGroup({
                        ...selectedQRGroup,
                        qrCode: qrData.qr_code,
                        qrData: qrData
                      });
                    } catch (err) {
                      console.error('Failed to refresh QR code:', err);
                    }
                  }}
                  className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-xl hover:bg-blue-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-3"
                >
                  <RefreshCw className="w-5 h-5" />
                  Refresh Status
                </button>
                <button
                  onClick={closeQRCodeModal}
                  className="flex-1 bg-gradient-to-r from-emerald-600 to-green-600 text-white py-3 px-6 rounded-xl hover:from-emerald-700 hover:to-green-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-3"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Got it
                </button>
              </div>
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
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header - Enhanced with better styling */}
            <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 p-8 text-white relative flex-shrink-0">
              <button
                onClick={closeGroupDetailsModal}
                className="absolute top-4 right-4 text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all duration-200 hover:scale-110"
              >
                <X className="w-6 h-6" />
              </button>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="bg-white bg-opacity-20 rounded-full p-3">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Group Details</h2>
                    <p className="text-blue-100 text-sm mt-1">Group #{selectedGroupDetails.id.toString().padStart(6, '0')}</p>
                  </div>
                </div>
                <span className={`inline-flex px-4 py-2 text-sm font-semibold rounded-full border-2 ${
                  selectedGroupDetails.status === 'forming' ? 'bg-blue-100 text-blue-700 border-blue-300' :
                  selectedGroupDetails.status === 'active' ? 'bg-green-100 text-green-700 border-green-300' :
                  selectedGroupDetails.status === 'payment_pending' ? 'bg-yellow-100 text-yellow-700 border-yellow-300' :
                  selectedGroupDetails.status === 'processing' ? 'bg-purple-100 text-purple-700 border-purple-300' :
                  selectedGroupDetails.status === 'ready_for_pickup' ? 'bg-orange-100 text-orange-700 border-orange-300' :
                  selectedGroupDetails.status === 'completed' ? 'bg-blue-100 text-blue-700 border-blue-300' :
                  'bg-red-100 text-red-700 border-red-300'
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

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6">
              {/* Group Title Section */}
              <div className="text-center pb-4 border-b border-gray-100">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{selectedGroupDetails.name}</h3>
                <p className="text-gray-600">Collaborative bulk purchasing group</p>
              </div>

              {/* Description Card */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 border-l-4 border-blue-500 rounded-xl p-6 shadow-sm">
                <div className="flex items-start space-x-3">
                  <div className="bg-blue-100 rounded-full p-2">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                      Description
                    </h4>
                    <p className="text-gray-700 leading-relaxed">{selectedGroupDetails.description}</p>
                  </div>
                </div>
              </div>

              {/* Group Information Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="bg-blue-500 rounded-full p-2">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <h4 className="font-semibold text-blue-900">Progress</h4>
                  </div>
                  <p className="text-lg font-bold text-blue-800">{selectedGroupDetails.progress}</p>
                </div>
                
                <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="bg-green-500 rounded-full p-2">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                    <h4 className="font-semibold text-green-900">Price</h4>
                  </div>
                  <p className="text-lg font-bold text-green-800">{selectedGroupDetails.price}</p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="bg-purple-500 rounded-full p-2">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0h6a2 2 0 012 2v10a2 2 0 01-2 2H8a2 2 0 01-2-2V9a2 2 0 012-2z" />
                      </svg>
                    </div>
                    <h4 className="font-semibold text-purple-900">Due Date</h4>
                  </div>
                  <p className="text-lg font-bold text-purple-800">{selectedGroupDetails.dueDate}</p>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="bg-orange-500 rounded-full p-2">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                    <h4 className="font-semibold text-orange-900">Savings</h4>
                  </div>
                  <p className="text-lg font-bold text-orange-800">{selectedGroupDetails.savings}</p>
                </div>

                <div className="bg-gradient-to-br from-teal-50 to-teal-100 border border-teal-200 rounded-xl p-5 hover:shadow-md transition-shadow md:col-span-2">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="bg-teal-500 rounded-full p-2">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <h4 className="font-semibold text-teal-900">Created by</h4>
                  </div>
                  <p className="text-lg font-bold text-teal-800">{selectedGroupDetails.adminName === "Admin" ? "Admin" : selectedGroupDetails.adminName}</p>
                </div>
              </div>

              {/* Location and Status Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border-l-4 border-yellow-500 rounded-xl p-6 shadow-sm">
                  <div className="flex items-start space-x-4">
                    <div className="bg-yellow-500 rounded-full p-3">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-yellow-900 mb-2">Pickup Location</h4>
                      <p className="text-yellow-800 font-medium">{selectedGroupDetails.pickupLocation}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border-l-4 border-indigo-500 rounded-xl p-6 shadow-sm">
                  <div className="flex items-start space-x-4">
                    <div className="bg-indigo-500 rounded-full p-3">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-indigo-900 mb-2">Order Status</h4>
                      <p className="text-indigo-800 font-medium">{selectedGroupDetails.orderStatus}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Add More Products - Only for active groups */}
              {selectedGroupDetails.status === 'active' && (
                <div className="bg-gradient-to-r from-emerald-50 to-green-50 border-l-4 border-emerald-500 rounded-xl p-6 shadow-sm">
                  <div className="flex items-start space-x-4 mb-4">
                    <div className="bg-emerald-500 rounded-full p-3">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-emerald-900 mb-2">Add More Products</h4>
                      <p className="text-emerald-800 mb-4">Increase your quantity commitment to this group</p>
                      
                      <div className="bg-white rounded-lg p-4 border border-emerald-200">
                        <div className="flex items-center gap-4 mb-3">
                          <label className="text-sm font-medium text-emerald-900 min-w-fit">New Quantity:</label>
                          <input
                            type="number"
                            min="1"
                            value={newQuantity}
                            onChange={(e) => setNewQuantity(parseInt(e.target.value) || 1)}
                            className="flex-1 px-4 py-2 border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                            placeholder="Enter quantity"
                          />
                          <button
                            onClick={handleUpdateQuantity}
                            disabled={updatingQuantity || newQuantity <= 0}
                            className="px-6 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all font-medium flex items-center gap-2"
                          >
                            {updatingQuantity ? (
                              <>
                                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Updating...
                              </>
                            ) : (
                              'Update'
                            )}
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 text-xs text-emerald-700 bg-emerald-50 rounded-lg p-3">
                          <div>
                            <span className="font-medium">Current:</span> {selectedGroupDetails.quantity || 'N/A'}
                          </div>
                          <div>
                            <span className="font-medium">Unit Price:</span> {selectedGroupDetails.originalPrice}
                          </div>
                          <div>
                            <span className="font-medium">Bulk Price:</span> {selectedGroupDetails.price}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons - Enhanced styling */}
            <div className="flex-shrink-0 bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200 p-6">
              <div className="flex gap-4">
                <button
                  onClick={closeGroupDetailsModal}
                  className="flex-1 bg-gradient-to-r from-gray-600 to-gray-700 text-white py-4 px-6 rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Close
                </button>
                {selectedGroupDetails.status === 'ready_for_pickup' && (
                  <button
                    onClick={() => {
                      closeGroupDetailsModal();
                      handleShowQRCode(selectedGroupDetails);
                    }}
                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 px-6 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M12 12l3-3m-3 3l-3-3m-3 6h2.01M12 12l-3 3m3-3l3 3M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
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
