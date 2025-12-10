import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Grid3x3, List, Eye, ShoppingCart } from 'lucide-react';
import apiService from '../services/apiWithMock';
import analyticsService from '../services/analytics';
import TopNavigation from '../components/navigation/TopNavigation';
import MobileBottomNav from '../components/navigation/MobileBottomNav';
import { PageContainer, PageHeader } from '../components/layout/index';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/Input';
import { Dropdown } from '../components/ui/Dropdown';
import { SkeletonCard } from '../components/feedback/Skeleton';
import { ErrorAlert } from '../components/feedback/ErrorAlert';
import { EmptyState } from '../components/feedback/EmptyState';
import type { Group } from '../types/api';


export default function AllGroups() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState<'participants' | 'price-low' | 'price-high' | 'newest'>('participants');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is admin or supplier and redirect them
  useEffect(() => {
    const checkRole = async () => {
      try {
        const user = await apiService.getCurrentUser();
        if (user?.is_admin) {
          navigate('/admin', { replace: true });
        } else if (user?.is_supplier) {
          navigate('/supplier/dashboard', { replace: true });
        }
      } catch (err) {
        console.error('Failed to check user role:', err);
      }
    };
    
    checkRole();
  }, [navigate]);

  // Dynamic categories
  const categories = useMemo(() => {
    const uniqueCategories = new Set(groups.map(group => group.category).filter(Boolean));
    return ['All', ...Array.from(uniqueCategories).sort()];
  }, [groups]);

  // Fetch groups from API
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await apiService.getGroups();
        setGroups(data || []);
        
        // Track page view
        analyticsService.track('all_groups_viewed', {
          count: data?.length || 0
        });
      } catch (err: any) {
        console.error('Error fetching groups:', err);
        setError(err.response?.data?.detail || 'Failed to load groups');
        setGroups([]);
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, []);

  // Filtered and sorted groups
  const filteredAndSortedGroups = useMemo(() => {
    let filtered = groups.filter(group => {
      const matchesSearch = group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           group.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || group.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });

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

  // Analytics
  useEffect(() => {
    analyticsService.trackPageView('all_groups', {
      filter_category: selectedCategory,
      sort_by: sortBy,
      view_mode: viewMode
    });
  }, [selectedCategory, sortBy, viewMode]);

  useEffect(() => {
    if (searchQuery.trim().length === 0) return;
    analyticsService.trackSearch(searchQuery, {
      category: selectedCategory,
      sort_by: sortBy
    }, filteredAndSortedGroups.length);
  }, [searchQuery, selectedCategory, sortBy, filteredAndSortedGroups.length]);

  const handleViewGroup = (group: any) => {
    const groupId = group.id || group.group_buy_id;
    
    // Track group view in analytics
    analyticsService.trackGroupView(groupId, { ...group, source: 'browse' });
    
    // Track recommendation click in the database (for groups from recommendations)
    if (groupId) {
      apiService.trackRecommendationClick(groupId).catch(err => {
        console.warn('Failed to track recommendation click:', err);
      });
    }
    
    navigate(`/group/${groupId}`, { state: { group, mode: 'view', source: 'all-groups' } });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-16 md:pb-0">
      <TopNavigation userRole="trader" />
      
      <PageContainer>
        <PageHeader
          title="All Groups"
          description="Browse all available group buying deals"
          breadcrumbs={[
            { label: 'Home', path: '/trader' },
            { label: 'All Groups' }
          ]}
        />

        {/* Filters and Search */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <Input
                type="search"
                placeholder="Search groups..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="h-4 w-4" />}
              />
            </div>

            {/* Category Filter */}
            <Dropdown
              options={categories}
              value={selectedCategory}
              onChange={setSelectedCategory}
              placeholder="Category"
              leftIcon={<Filter className="h-4 w-4" />}
            />

            {/* Sort */}
            <Dropdown
              options={[
                { value: 'participants', label: 'Most Popular' },
                { value: 'price-low', label: 'Price: Low to High' },
                { value: 'price-high', label: 'Price: High to Low' },
                { value: 'newest', label: 'Newest First' }
              ]}
              value={sortBy}
              onChange={(value) => setSortBy(value as any)}
              placeholder="Sort by"
            />

            {/* View Mode */}
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('grid')}
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="icon"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Active Filters */}
          {(searchQuery || selectedCategory !== 'All') && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="body-sm text-gray-600">Active filters:</span>
              {searchQuery && (
                <Badge variant="outline" removable onRemove={() => setSearchQuery('')}>
                  Search: {searchQuery}
                </Badge>
              )}
              {selectedCategory !== 'All' && (
                <Badge variant="outline" removable onRemove={() => setSelectedCategory('All')}>
                  Category: {selectedCategory}
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                }}
              >
                Clear all
              </Button>
            </div>
          )}

          {/* Results Count */}
          <p className="body-sm text-gray-600">
            Showing {filteredAndSortedGroups.length} of {groups.length} groups
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' : 'space-y-4'}>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        )}

        {/* Error State */}
        {error && (
          <ErrorAlert
            title="Unable to load groups"
            message={error}
            onRetry={() => window.location.reload()}
            variant="card"
          />
        )}

        {/* Empty State */}
        {!loading && !error && filteredAndSortedGroups.length === 0 && (
          <EmptyState
            icon={searchQuery ? 'search' : 'package'}
            title={searchQuery ? 'No groups found' : 'No groups available'}
            description={
              searchQuery
                ? `No groups match "${searchQuery}". Try different keywords.`
                : 'Check back soon for new group buying opportunities!'
            }
            actionLabel={searchQuery ? 'Clear search' : undefined}
            onAction={searchQuery ? () => setSearchQuery('') : undefined}
          />
        )}

        {/* Groups Grid/List */}
        {!loading && !error && filteredAndSortedGroups.length > 0 && (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' : 'space-y-4'}>
            {filteredAndSortedGroups.map((group) => (
              viewMode === 'grid' ? (
                <Card key={group.id} variant="elevated" hoverable className="overflow-hidden">
                  {/* Image */}
                  <div className="relative h-48 bg-gray-100 flex items-center justify-center">
                    {group.image_url && (
                      <img 
                        src={group.image_url} 
                        alt={group.name} 
                        className="h-full w-full object-cover" 
                      />
                    )}
                    {group.category && (
                      <div className="absolute top-3 left-3">
                        <Badge variant="secondary" size="sm">{group.category}</Badge>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4 space-y-3">
                    <h3 className="heading-5 line-clamp-2">{group.name}</h3>
                    
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-2xl font-bold text-gray-900">${group.price}</span>
                      {(group.originalPrice || group.original_price) && (group.originalPrice || group.original_price) > group.price && (
                        <span className="text-sm text-gray-500 line-through">
                          ${group.originalPrice || group.original_price}
                        </span>
                      )}
                      {/* Discount Badge */}
                      {(group.discountPercentage || ((group.originalPrice || group.original_price) && (group.originalPrice || group.original_price) > group.price)) && (
                        <Badge variant="success" size="sm">
                          {group.discountPercentage 
                            ? `${Math.round(group.discountPercentage)}% OFF`
                            : `${Math.round((1 - group.price / (group.originalPrice || group.original_price)) * 100)}% OFF`}
                        </Badge>
                      )}
                    </div>

                    {/* Progress */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Progress: {((group.current_amount || 0) / (group.target_amount || 1) * 100).toFixed(1)}%</span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>${(group.current_amount || 0).toFixed(0)} raised</span>
                        <span>${(group.target_amount || 0).toFixed(0)} target</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-primary-600 h-2 rounded-full transition-all"
                          style={{ width: `${Math.min((group.current_amount || 0) / (group.target_amount || 1) * 100, 100)}%` }}
                        />
                      </div>
                      {group.participants > 0 && (
                        <p className="text-xs text-gray-500 text-center">
                          {group.participants} {group.participants === 1 ? 'person' : 'people'} joined
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewGroup(group)}
                        leftIcon={<Eye className="h-4 w-4" />}
                        fullWidth
                      >
                        View
                      </Button>
                      {group.joined ? (
                        <Button
                          size="sm"
                          variant="success"
                          disabled
                          fullWidth
                        >
                          Joined
                        </Button>
                      ) : (group.current_amount || 0) >= (group.target_amount || 1) ? (
                        <Button
                          size="sm"
                          disabled
                          fullWidth
                        >
                          Full
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleViewGroup(group)}
                          leftIcon={<ShoppingCart className="h-4 w-4" />}
                          fullWidth
                        >
                          Join
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ) : (
                <Card key={group.id} variant="elevated" hoverable padding="md">
                  <div className="flex gap-4">
                    {/* Image */}
                    <div className="w-32 h-32 flex-shrink-0 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                      {group.image_url && (
                        <img 
                          src={group.image_url} 
                          alt={group.name} 
                          className="h-full w-full object-cover" 
                        />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex-1">
                          <h3 className="heading-5 mb-1">{group.name}</h3>
                          {group.description && (
                            <p className="body-sm text-gray-600 line-clamp-2">{group.description}</p>
                          )}
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <div className="flex items-baseline gap-2 justify-end flex-wrap">
                            <span className="text-2xl font-bold text-gray-900">${group.price}</span>
                            {(group.originalPrice || group.original_price) && (group.originalPrice || group.original_price) > group.price && (
                              <span className="text-sm text-gray-500 line-through">
                                ${group.originalPrice || group.original_price}
                              </span>
                            )}
                          </div>
                          {/* Discount Badge */}
                          {(group.discountPercentage || ((group.originalPrice || group.original_price) && (group.originalPrice || group.original_price) > group.price)) && (
                            <Badge variant="success" size="sm" className="mt-1">
                              {group.discountPercentage 
                                ? `${Math.round(group.discountPercentage)}% OFF`
                                : `${Math.round((1 - group.price / (group.originalPrice || group.original_price)) * 100)}% OFF`}
                            </Badge>
                          )}
                          {group.category && (
                            <Badge variant="secondary" size="sm" className="mt-1 ml-1">{group.category}</Badge>
                          )}
                        </div>
                      </div>

                      {/* Progress */}
                      <div className="mb-3">
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>Progress: {((group.current_amount || 0) / (group.target_amount || 1) * 100).toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>${(group.current_amount || 0).toFixed(0)} raised</span>
                          <span>${(group.target_amount || 0).toFixed(0)} target</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-primary-600 h-2 rounded-full transition-all"
                            style={{ width: `${Math.min((group.current_amount || 0) / (group.target_amount || 1) * 100, 100)}%` }}
                          />
                        </div>
                        {group.participants > 0 && (
                          <p className="text-xs text-gray-500 text-center mt-1">
                            {group.participants} {group.participants === 1 ? 'person' : 'people'} joined
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewGroup(group)}
                          leftIcon={<Eye className="h-4 w-4" />}
                        >
                          View Details
                        </Button>
                        {group.joined ? (
                          <Button
                            size="sm"
                            variant="success"
                            disabled
                          >
                            Joined
                          </Button>
                        ) : (group.current_amount || 0) >= (group.target_amount || 1) ? (
                          <Button
                            size="sm"
                            disabled
                          >
                            Full
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleViewGroup(group)}
                            leftIcon={<ShoppingCart className="h-4 w-4" />}
                          >
                            Join Group
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              )
            ))}
          </div>
        )}
      </PageContainer>

      <MobileBottomNav userRole="trader" />
    </div>
  );
}
