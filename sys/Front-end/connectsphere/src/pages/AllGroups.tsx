import { Search, MapPin, User, Users, Filter, SortAsc, Grid, List, X, Eye, ChevronDown, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState, useMemo, useEffect } from 'react';
import apiService from '../services/api';
import analyticsService from '../services/analytics';
import type { Group } from '../types/api';
import { useAppStore } from '../store/useAppStore';

export default function AllGroups() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState<'participants' | 'price-low' | 'price-high' | 'newest'>('participants');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [joinSuccess, setJoinSuccess] = useState<string | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<string>('Harare');
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);

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

  // Categories for filtering - dynamically generated from groups data
  const categories = useMemo(() => {
    const uniqueCategories = new Set(groups.map(group => group.category).filter(Boolean));
    return Array.from(uniqueCategories).sort();
  }, [groups]);

    // Fetch groups data on component mount
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch user data to get location
        const userData = await apiService.getCurrentUser();
        setUserLocation(userData.location_zone || 'Harare');
        useAppStore.getState().setCurrentUser(userData);
        if (userData.location_zone) {
          useAppStore.getState().setUserLocation(userData.location_zone);
        }

        const groupsData = await apiService.getAllGroups();
        console.log('AllGroups API response:', groupsData);
        if (groupsData.length > 0) {
          console.log('First group:', groupsData[0]);
          console.log('First group moq:', groupsData[0].moq);
        }
        setGroups(groupsData);
      } catch (err) {
        console.error('Failed to fetch groups:', err);
        setError(err instanceof Error ? err.message : String(err));
        // Fallback to empty array
        setGroups([]);
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, []);

  // Filtered and sorted groups - MUST be defined before useEffect that uses it
  const filteredAndSortedGroups = useMemo(() => {
    let filtered = groups.filter(group => {
      const matchesSearch = group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           group.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || group.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });

    // Sort groups
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'participants':
          return b.participants - a.participants;
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'newest':
          return new Date(b.created).getTime() - new Date(a.created).getTime();
        default:
          return 0;
      }
    });

    return filtered;
  }, [groups, searchQuery, selectedCategory, sortBy]);

  // Analytics: page view + changes to filters/sorting/view mode
  useEffect(() => {
    analyticsService.trackPageView('all_groups', {
      filter_category: selectedCategory,
      sort_by: sortBy,
      view_mode: viewMode
    });
  }, [selectedCategory, sortBy, viewMode]);

  // Analytics: search tracking
  useEffect(() => {
    if (searchQuery.trim().length === 0) return;
    analyticsService.trackSearch(searchQuery, {
      category: selectedCategory,
      sort_by: sortBy
    }, filteredAndSortedGroups.length);
  }, [searchQuery, selectedCategory, sortBy, filteredAndSortedGroups.length]);

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

  // View group handler - pass the full group data with view mode
  const handleViewGroup = (group: any) => {
    analyticsService.trackGroupView(group.id, {
      ...group,
      source: 'browse'
    });
    navigate(`/group/${group.id}`, { state: { group, mode: 'view' } });
  };

  // Join group handler - pass the full group data with join mode
  const handleJoinGroup = async (group: any) => {
    try {
      analyticsService.trackGroupJoinClick(group.id, group);
      // Optimistic UI: attempt server-side join first
      setJoinSuccess(`Joining ${group.name || 'group'}...`);
      await apiService.joinGroup(group.id, {
        quantity: 1,
        delivery_method: 'pickup',
        payment_method: 'cash'
      });
      setJoinSuccess(`Successfully joined ${group.name || 'group'}! Redirecting...`);
      setTimeout(() => {
        navigate(`/group/${group.id}`, { state: { group, mode: 'join' } });
      }, 1000);
    } catch (err) {
      console.error('Failed to join group:', err);
      setJoinSuccess(null);
      alert((err as Error)?.message || 'Failed to join group');
    }
  };

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
              className="text-sm font-medium text-blue-600"
            >
              All Groups
            </button>
            <button 
              onClick={() => navigate('/groups')}
              className="text-sm text-gray-700 hover:text-gray-900"
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

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-[73px] z-40">
        <div className="px-3 sm:px-6">
          <nav className="flex gap-4 sm:gap-8" role="tablist" aria-label="Content sections">
            <button
              onClick={() => navigate('/trader')}
              role="tab"
              aria-selected="false"
              aria-controls="recommended-panel"
              className="py-4 text-sm font-medium border-b-2 border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300 transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Recommended
            </button>
            <button
              onClick={() => navigate('/all-groups')}
              role="tab"
              aria-selected="true"
              className="py-4 text-sm font-semibold border-b-2 border-blue-600 text-blue-600 transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              All Groups
            </button>
            <button
              onClick={() => navigate('/groups')}
              role="tab"
              aria-selected="false"
              className="py-4 text-sm font-medium border-b-2 border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300 transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              My Groups
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 px-3 sm:px-6 py-4 sm:py-8">
        <div className="max-w-7xl mx-auto">
          {/* Success Message */}
          {joinSuccess && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
              <div className="text-green-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-green-800 font-medium">{joinSuccess}</p>
              <button
                onClick={() => setJoinSuccess(null)}
                className="ml-auto text-green-600 hover:text-green-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row items-start gap-2 sm:gap-3 mb-2">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">All Available Groups</h1>
              <div className="flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs sm:text-sm font-medium w-fit">
                <Zap className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                <span>Admin Created</span>
              </div>
            </div>
            <p className="text-sm sm:text-base text-gray-600">Browse all admin-created group buy opportunities</p>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search Bar */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search groups by name or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Category Filter */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="pl-9 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                >
                  <option value="All">All Categories</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              {/* Sort Options */}
              <div className="relative">
                <SortAsc className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'participants' | 'price-low' | 'price-high' | 'newest')}
                  className="pl-9 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                >
                  <option value="participants">Most Popular</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="newest">Newest First</option>
                </select>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg border transition ${
                    viewMode === 'grid'
                      ? 'bg-blue-50 border-blue-200 text-blue-600'
                      : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg border transition ${
                    viewMode === 'list'
                      ? 'bg-blue-50 border-blue-200 text-blue-600'
                      : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Active Filters */}
            {(searchQuery || selectedCategory) && (
              <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-gray-200">
                <span className="text-sm text-gray-600">Active filters:</span>
                {searchQuery && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    Search: "{searchQuery}"
                    <button
                      onClick={() => setSearchQuery('')}
                      className="hover:bg-blue-200 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {selectedCategory && selectedCategory !== 'All' && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                    Category: {selectedCategory}
                    <button
                      onClick={() => setSelectedCategory('All')}
                      className="hover:bg-green-200 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('All');
                  }}
                  className="text-sm text-gray-500 hover:text-gray-700 underline"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>

          {/* Results Count */}
          <div className="mb-4">
            {loading ? (
              <p className="text-sm text-gray-600">Loading groups...</p>
            ) : error ? (
              <p className="text-sm text-red-600">Error loading groups</p>
            ) : (
              <p className="text-sm text-gray-600">
                Showing {filteredAndSortedGroups.length} of {groups.length} groups
              </p>
            )}
          </div>

          {/* Groups Display */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Loading groups...</h3>
              <p className="text-gray-600">Fetching available group buy opportunities</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-500 mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load groups</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                Try Again
              </button>
            </div>
          ) : filteredAndSortedGroups.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Search className="w-12 h-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No groups found</h3>
              <p className="text-gray-600">Try adjusting your search or filter criteria</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
              {filteredAndSortedGroups.map((group) => (
                <div 
                  key={group.id} 
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300"
                  role="article"
                  aria-label={`${group.name} group buy`}
                >
                  {/* Image / Hero */}
                  <div className="relative h-64 bg-gray-100 flex items-center justify-center">
                    {group.image && typeof group.image === 'string' && group.image.startsWith('http') ? (
                      <img src={group.image} alt={group.name} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-5xl text-gray-400">📦</span>
                    )}

                    {/* Category badge */}
                    {group.category && (
                      <div className="absolute top-3 left-3 bg-white px-2 py-1 rounded-full shadow-md flex items-center gap-2">
                        <span className="text-xs text-gray-600 font-semibold">{group.category}</span>
                      </div>
                    )}

                    {/* Price badge */}
                    <div className="absolute top-3 right-3 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-md">
                      ${group.price}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-2">{group.name}</h3>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{group.description}</p>

                    <div className="mb-3">
                      <div className="flex items-baseline gap-2">
                        <span className="text-xl font-bold text-gray-900">${group.price}</span>
                      </div>
                    </div>

                    <div className="mb-4">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-gray-600">{group.participants ?? 0} joined</span>
                        <span className="text-gray-600">{group.moq ? `${group.moq} needed` : ''}</span>
                      </div>
                      {group.moq_progress ? (
                        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div 
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${group.moq_progress}%` }}
                          />
                        </div>
                      ) : null}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewGroup(group)}
                        className="flex-1 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition"
                      >
                        View Details
                      </button>
                      <button 
                        onClick={() => handleJoinGroup(group)}
                        disabled={group.joined}
                        className={`flex-1 py-2 rounded-md font-medium transition ${
                          group.joined 
                            ? 'bg-green-600 text-white cursor-not-allowed opacity-75' 
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {group.joined ? 'Joined' : 'Join Group'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAndSortedGroups.map((group) => (
                <div key={group.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200">
                  <div className="flex">
                    {/* Product Image - Compact */}
                    <div className="w-32 h-32 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center flex-shrink-0">
                      {group.image && group.image.startsWith('http') ? (
                        <img src={group.image} alt={group.name} className="h-20 object-contain" />
                      ) : (
                        <span className="text-4xl">📦</span>
                      )}
                    </div>

                    {/* Product Info - Streamlined */}
                    <div className="flex-1 p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full mb-2 inline-block">
                            {group.category}
                          </span>
                          <h3 className="text-lg font-bold text-gray-900 leading-tight">{group.name}</h3>
                        </div>
                        <div className="text-right">
                          <span className="text-xl font-bold text-blue-600">${group.price}</span>
                          <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                            <Users className="w-4 h-4" />
                            <span>{group.participants}</span>
                          </div>
                        </div>
                      </div>

                      {/* Simplified buttons */}
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => handleViewGroup(group)}
                          className="flex-1 py-2 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </button>
                        <button
                          onClick={() => handleJoinGroup(group)}
                          disabled={group.joined}
                          className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${
                            group.joined 
                              ? 'bg-green-600 text-white cursor-not-allowed opacity-75' 
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          {group.joined ? 'Joined' : 'Join'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
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
    </div>
  );
}
