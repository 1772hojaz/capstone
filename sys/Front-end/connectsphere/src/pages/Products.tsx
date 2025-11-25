import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Grid3x3, List, SlidersHorizontal, X } from 'lucide-react';
import TopNavigation from '../components/navigation/TopNavigation';
import MobileBottomNav from '../components/navigation/MobileBottomNav';
import { PageContainer, PageHeader } from '../components/layout/index';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/badge';
import { SkeletonCard } from '../components/feedback/Skeleton';
import { ErrorAlert } from '../components/feedback/ErrorAlert';
import { EmptyState } from '../components/feedback/EmptyState';
import apiService from '../services/api';

type ViewMode = 'grid' | 'list';

interface Product {
  id: number;
  name: string;
  description: string;
  category: string;
  base_price: number;
  unit: string;
  image_url?: string;
  supplier_name?: string;
}

interface FilterState {
  category: string;
  minPrice: string;
  maxPrice: string;
  sortBy: string;
}

const CATEGORIES = [
  'All Categories',
  'Vegetables',
  'Fruits',
  'Grains & Cereals',
  'Dairy Products',
  'Meat & Poultry',
  'Seafood',
  'Bakery',
  'Beverages',
  'Spices & Herbs',
  'Others'
];

const SORT_OPTIONS = [
  { value: 'name_asc', label: 'Name (A-Z)' },
  { value: 'name_desc', label: 'Name (Z-A)' },
  { value: 'price_asc', label: 'Price (Low to High)' },
  { value: 'price_desc', label: 'Price (High to Low)' },
  { value: 'recent', label: 'Recently Added' },
];

export default function Products() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [userRole, setUserRole] = useState<'trader' | 'supplier' | 'admin'>('trader');
  
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  const [filters, setFilters] = useState<FilterState>({
    category: searchParams.get('category') || 'All Categories',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    sortBy: searchParams.get('sortBy') || 'name_asc',
  });

  // Fetch user info
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await apiService.getCurrentUser();
        if (user.is_admin) setUserRole('admin');
        else if (user.is_supplier) setUserRole('supplier');
        else setUserRole('trader');
      } catch (err) {
        console.error('Error fetching user:', err);
      }
    };
    fetchUser();
  }, []);

  // Fetch products
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getProducts();
      setProducts(data);
      setFilteredProducts(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  // Apply filters and search
  useEffect(() => {
    let result = [...products];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query) ||
          p.category?.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (filters.category && filters.category !== 'All Categories') {
      result = result.filter((p) => p.category === filters.category);
    }

    // Price range filter
    if (filters.minPrice) {
      const minPrice = parseFloat(filters.minPrice);
      result = result.filter((p) => p.base_price >= minPrice);
    }
    if (filters.maxPrice) {
      const maxPrice = parseFloat(filters.maxPrice);
      result = result.filter((p) => p.base_price <= maxPrice);
    }

    // Sorting
    switch (filters.sortBy) {
      case 'name_asc':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name_desc':
        result.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'price_asc':
        result.sort((a, b) => a.base_price - b.base_price);
        break;
      case 'price_desc':
        result.sort((a, b) => b.base_price - a.base_price);
        break;
      case 'recent':
        result.sort((a, b) => b.id - a.id);
        break;
    }

    setFilteredProducts(result);
    
    // Update URL
    const params = new URLSearchParams();
    if (filters.category !== 'All Categories') params.set('category', filters.category);
    if (filters.minPrice) params.set('minPrice', filters.minPrice);
    if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);
    if (filters.sortBy !== 'name_asc') params.set('sortBy', filters.sortBy);
    setSearchParams(params);
  }, [products, searchQuery, filters]);

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      category: 'All Categories',
      minPrice: '',
      maxPrice: '',
      sortBy: 'name_asc',
    });
    setSearchQuery('');
  };

  const hasActiveFilters = () => {
    return (
      filters.category !== 'All Categories' ||
      filters.minPrice ||
      filters.maxPrice ||
      searchQuery
    );
  };

  const handleProductClick = (productId: number) => {
    navigate(`/product/${productId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-16 md:pb-0">
      <TopNavigation userRole={userRole} />

      <PageContainer>
        <PageHeader
          title="Browse Products"
          description="Discover fresh produce and quality goods from local suppliers"
          breadcrumbs={[
            { label: 'Home', path: userRole === 'admin' ? '/admin' : userRole === 'supplier' ? '/supplier/dashboard' : '/trader' },
            { label: 'Products' }
          ]}
        />

        {/* Search and View Controls */}
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex-1 max-w-2xl">
            <Input
              placeholder="Search products by name, category, or description..."
              leftIcon={<Search className="h-4 w-4" />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {hasActiveFilters() && (
                <Badge variant="primary" size="sm" className="ml-1">
                  {[
                    filters.category !== 'All Categories' ? 1 : 0,
                    filters.minPrice ? 1 : 0,
                    filters.maxPrice ? 1 : 0,
                    searchQuery ? 1 : 0,
                  ].reduce((a, b) => a + b, 0)}
                </Badge>
              )}
            </Button>

            <div className="flex items-center gap-1 border border-gray-300 rounded-lg p-1">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="p-2"
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="p-2"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <Card className="mb-6 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Filters</h3>
              {hasActiveFilters() && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear All
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Min Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Min Price ($)
                </label>
                <Input
                  type="number"
                  placeholder="0"
                  value={filters.minPrice}
                  onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                  min="0"
                  step="0.01"
                />
              </div>

              {/* Max Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Price ($)
                </label>
                <Input
                  type="number"
                  placeholder="1000"
                  value={filters.maxPrice}
                  onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                  min="0"
                  step="0.01"
                />
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sort By
                </label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </Card>
        )}

        {/* Active Filters Display */}
        {hasActiveFilters() && (
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-600">Active filters:</span>
            {filters.category !== 'All Categories' && (
              <Badge variant="secondary" removable onRemove={() => handleFilterChange('category', 'All Categories')}>
                {filters.category}
              </Badge>
            )}
            {filters.minPrice && (
              <Badge variant="secondary" removable onRemove={() => handleFilterChange('minPrice', '')}>
                Min: ${filters.minPrice}
              </Badge>
            )}
            {filters.maxPrice && (
              <Badge variant="secondary" removable onRemove={() => handleFilterChange('maxPrice', '')}>
                Max: ${filters.maxPrice}
              </Badge>
            )}
            {searchQuery && (
              <Badge variant="secondary" removable onRemove={() => setSearchQuery('')}>
                Search: "{searchQuery}"
              </Badge>
            )}
          </div>
        )}

        {/* Results Count */}
        <div className="mb-4 text-sm text-gray-600">
          Showing {filteredProducts.length} of {products.length} products
        </div>

        {/* Loading State */}
        {loading && (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
            {[...Array(6)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <ErrorAlert
            message={error}
            onRetry={fetchProducts}
            variant="error"
          />
        )}

        {/* Empty State */}
        {!loading && !error && filteredProducts.length === 0 && (
          <EmptyState
            icon="package"
            title={hasActiveFilters() ? "No products match your filters" : "No products available"}
            description={hasActiveFilters() ? "Try adjusting your filters to see more results" : "Check back later for new products"}
            actionLabel={hasActiveFilters() ? "Clear Filters" : undefined}
            onAction={hasActiveFilters() ? clearFilters : undefined}
          />
        )}

        {/* Products Grid */}
        {!loading && !error && filteredProducts.length > 0 && viewMode === 'grid' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <Card
                key={product.id}
                hoverable
                onClick={() => handleProductClick(product.id)}
                className="cursor-pointer overflow-hidden"
              >
                <div className="aspect-video bg-gray-100 relative overflow-hidden">
                  {product.image_url && (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  )}
                  <Badge variant="primary" className="absolute top-2 right-2">
                    {product.category}
                  </Badge>
                </div>
                
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">
                    {product.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {product.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-2xl font-bold text-primary-600">
                        ${product.base_price}
                      </span>
                      <span className="text-sm text-gray-500 ml-1">
                        / {product.unit}
                      </span>
                    </div>
                    <Button size="sm">View Details</Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Products List */}
        {!loading && !error && filteredProducts.length > 0 && viewMode === 'list' && (
          <div className="space-y-4">
            {filteredProducts.map((product) => (
              <Card
                key={product.id}
                hoverable
                onClick={() => handleProductClick(product.id)}
                className="cursor-pointer"
              >
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="w-full md:w-48 h-48 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    {product.image_url && (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    )}
                  </div>
                  
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-lg text-gray-900">
                            {product.name}
                          </h3>
                          <Badge variant="secondary" size="sm" className="mt-1">
                            {product.category}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-primary-600">
                            ${product.base_price}
                          </div>
                          <div className="text-sm text-gray-500">
                            per {product.unit}
                          </div>
                        </div>
                      </div>
                      <p className="text-gray-600 line-clamp-2">
                        {product.description}
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between mt-4">
                      {product.supplier_name && (
                        <span className="text-sm text-gray-500">
                          By {product.supplier_name}
                        </span>
                      )}
                      <Button>View Details</Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </PageContainer>

      <MobileBottomNav userRole={userRole} />
    </div>
  );
}

