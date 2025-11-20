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
import { Input } from '../components/ui/input';
import { Dropdown } from '../components/ui/Dropdown';
import { SkeletonCard } from '../components/feedback/Skeleton';
import { ErrorAlert } from '../components/feedback/ErrorAlert';
import { EmptyState } from '../components/feedback/EmptyState';
import type { Group } from '../types/api';

// Mock group data for all suppliers
const MOCK_GROUPS: Group[] = [
  // Fresh Produce Ltd
  { id: 1, name: "Organic Tomatoes", category: "Vegetables", description: "Fresh organic tomatoes from local farms", price: 3.50, original_price: 5.00, participants: 18, max_participants: 50, moq: 20, created: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 2, name: "Fresh Lettuce Bundle", category: "Vegetables", description: "Crisp green lettuce, perfect for salads", price: 2.80, original_price: 4.00, participants: 22, max_participants: 50, moq: 15, created: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 3, name: "Sweet Potatoes", category: "Vegetables", description: "Nutritious orange sweet potatoes", price: 2.50, original_price: 3.50, participants: 35, max_participants: 50, moq: 30, created: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 4, name: "Fresh Spinach", category: "Vegetables", description: "Organic baby spinach leaves", price: 4.20, original_price: 6.00, participants: 15, max_participants: 50, moq: 12, created: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 5, name: "Mixed Bell Peppers", category: "Vegetables", description: "Colorful bell peppers - red, yellow, green", price: 5.60, original_price: 8.00, participants: 12, max_participants: 50, moq: 14, created: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
  
  // Ethiopian Coffee Co.
  { id: 6, name: "Premium Ethiopian Coffee Beans", category: "Beverages", description: "Authentic Ethiopian Arabica coffee beans", price: 18.00, original_price: 25.00, participants: 28, max_participants: 50, moq: 10, created: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 7, name: "Ethiopian Coffee Gift Set", category: "Beverages", description: "Complete coffee experience package", price: 32.00, original_price: 45.00, participants: 8, max_participants: 50, moq: 5, created: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString() },
  
  // Organic Foods Zimbabwe
  { id: 8, name: "Organic Brown Rice", category: "Grains & Cereals", description: "Certified organic brown rice", price: 5.60, original_price: 8.00, participants: 42, max_participants: 50, moq: 25, created: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 9, name: "Organic Honey", category: "Cooking Essentials", description: "Pure organic honey from local beekeepers", price: 10.50, original_price: 15.00, participants: 25, max_participants: 50, moq: 15, created: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
  
  // Mediterranean Imports
  { id: 10, name: "Extra Virgin Olive Oil", category: "Cooking Essentials", description: "Premium imported olive oil from Greece", price: 14.00, original_price: 20.00, participants: 20, max_participants: 50, moq: 10, created: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 11, name: "Mediterranean Spice Collection", category: "Cooking Essentials", description: "Authentic Mediterranean herbs and spices", price: 12.60, original_price: 18.00, participants: 16, max_participants: 50, moq: 8, created: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() },
  
  // Local Poultry Farm
  { id: 12, name: "Free-Range Chicken", category: "Meat & Poultry", description: "Farm-fresh free-range chickens", price: 8.40, original_price: 12.00, participants: 30, max_participants: 50, moq: 20, created: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 13, name: "Fresh Eggs (30 pack)", category: "Dairy Products", description: "Free-range farm eggs", price: 7.00, original_price: 10.00, participants: 35, max_participants: 50, moq: 20, created: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
  
  // Green Valley Farms
  { id: 14, name: "Organic Bananas", category: "Fruits", description: "Sweet organic bananas", price: 2.80, original_price: 4.00, participants: 40, max_participants: 50, moq: 30, created: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 15, name: "Mixed Tropical Fruits", category: "Fruits", description: "Assorted tropical fruit basket", price: 10.50, original_price: 15.00, participants: 22, max_participants: 50, moq: 15, created: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
  
  // Artisan Bakery Co.
  { id: 16, name: "Sourdough Bread Loaves", category: "Grocery", description: "Traditional sourdough bread", price: 4.20, original_price: 6.00, participants: 28, max_participants: 50, moq: 20, created: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 17, name: "Artisan Pastry Selection", category: "Grocery", description: "Assorted fresh pastries", price: 8.40, original_price: 12.00, participants: 18, max_participants: 50, moq: 10, created: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() },
  
  // Ocean Fresh Imports
  { id: 18, name: "Frozen Prawns", category: "Fish & Kapenta", description: "Premium frozen prawns", price: 15.40, original_price: 22.00, participants: 12, max_participants: 50, moq: 10, created: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 19, name: "Smoked Salmon", category: "Fish & Kapenta", description: "Premium smoked salmon fillets", price: 19.60, original_price: 28.00, participants: 10, max_participants: 50, moq: 8, created: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString() },
  
  // TechHub Electronics
  { id: 20, name: "Wireless Bluetooth Earbuds", category: "Electronics & Appliances", description: "Premium wireless earbuds with charging case", price: 31.50, original_price: 45.00, participants: 38, max_participants: 50, moq: 20, created: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 21, name: "USB-C Fast Charger", category: "Electronics & Appliances", description: "65W USB-C fast charging adapter", price: 17.50, original_price: 25.00, participants: 45, max_participants: 50, moq: 25, created: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() },
  
  // Premium Roasters Ltd
  { id: 22, name: "Specialty Coffee Blend", category: "Beverages", description: "Premium roasted coffee blend", price: 15.40, original_price: 22.00, participants: 25, max_participants: 50, moq: 15, created: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 23, name: "Coffee Brewing Equipment Set", category: "Household Items", description: "Complete coffee brewing kit", price: 45.50, original_price: 65.00, participants: 8, max_participants: 50, moq: 5, created: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() }
];

export default function AllGroups() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState<'participants' | 'price-low' | 'price-high' | 'newest'>('participants');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [groups, setGroups] = useState<Group[]>(MOCK_GROUPS);
  const [loading, setLoading] = useState(false); // Set to false to show mock data immediately
  const [error, setError] = useState<string | null>(null);

  // Dynamic categories
  const categories = useMemo(() => {
    const uniqueCategories = new Set(groups.map(group => group.category).filter(Boolean));
    return ['All', ...Array.from(uniqueCategories).sort()];
  }, [groups]);

  // Use mock data instead of API call
  useEffect(() => {
    // Simulate loading for better UX
    setLoading(true);
    setTimeout(() => {
      setGroups(MOCK_GROUPS);
      setLoading(false);
    }, 300);
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
    analyticsService.trackGroupView(group.id, { ...group, source: 'browse' });
    navigate(`/group/${group.id}`, { state: { group, mode: 'view', source: 'all-groups' } });
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
                    
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold text-gray-900">${group.price}</span>
                      {group.original_price && (
                        <span className="text-sm text-gray-500 line-through">
                          ${group.original_price}
                        </span>
                      )}
                    </div>

                    {/* Progress */}
                    <div className="space-y-1">
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
                      <p className="text-xs text-gray-500 text-center">
                        {group.participants} people joined
                      </p>
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
                          <div className="flex items-baseline gap-2 justify-end">
                            <span className="text-2xl font-bold text-gray-900">${group.price}</span>
                            {group.original_price && (
                              <span className="text-sm text-gray-500 line-through">
                                ${group.original_price}
                              </span>
                            )}
                          </div>
                          {group.category && (
                            <Badge variant="secondary" size="sm" className="mt-2">{group.category}</Badge>
                          )}
                        </div>
                      </div>

                      {/* Progress */}
                      <div className="mb-3">
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
                        <p className="text-xs text-gray-500 text-center mt-1">
                          {group.participants} people joined
                        </p>
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
