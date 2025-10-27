import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Search, Plus, Package, TrendingUp, AlertTriangle, DollarSign, Edit, Trash2 } from 'lucide-react';
import apiService from '../services/api';

const ProductCatalog = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Categories for filtering
  const categories = [
    { id: 'all', name: 'All', count: 0 },
    { id: 'electronics', name: 'Electronics', count: 0 },
    { id: 'wearables', name: 'Wearables', count: 0 },
    { id: 'household', name: 'Household', count: 0 },
    { id: 'food', name: 'Food & Beverage', count: 0 },
    { id: 'other', name: 'Other', count: 0 }
  ];

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        const productData = await apiService.getProducts();
        setProducts(productData);
      } catch (err) {
        console.error('Failed to fetch products:', err);
        setError('Failed to load products. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Calculate statistics
  const totalProducts = products.length;
  const inStock = products.filter(p => (p.stock || p.total_stock || 0) > 0).length;
  const outOfStock = totalProducts - inStock;
  const totalValue = products.reduce((sum, p) => {
    const price = p.price || p.bulk_price || 0;
    const stock = p.stock || p.total_stock || 0;
    return sum + (price * stock);
  }, 0);

  // Filter products based on search and category
  const filteredProducts = products.filter(product => {
    const matchesSearch = !searchTerm ||
      product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === 'all' ||
      product.category?.toLowerCase() === selectedCategory.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  return (
    <Layout title="Product Catalog">
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading products...</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="w-6 h-6 text-blue-600" />
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Product Catalog</h2>
                  <p className="text-gray-600 mt-1">Manage your product inventory and pricing</p>
                </div>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                <Plus className="w-4 h-4" />
                Add Product
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">Total Products</p>
                <Package className="w-4 h-4 text-gray-400" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{totalProducts}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">In Stock</p>
                <TrendingUp className="w-4 h-4 text-green-400" />
              </div>
              <p className="text-3xl font-bold text-green-600">{inStock}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">Out of Stock</p>
                <AlertTriangle className="w-4 h-4 text-red-400" />
              </div>
              <p className="text-3xl font-bold text-red-600">{outOfStock}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">Total Value</p>
                <DollarSign className="w-4 h-4 text-blue-400" />
              </div>
              <p className="text-3xl font-bold text-blue-600">${totalValue.toLocaleString()}</p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search products by name, description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    selectedCategory === category.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => {
              const stock = product.stock || product.total_stock || 0;
              const price = product.price || product.bulk_price || 0;
              const isOutOfStock = stock === 0;

              return (
                <div key={product.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                  {/* Product Image/Icon */}
                  <div className="h-48 bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package className="w-16 h-16 text-blue-400" />
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">{product.name}</h3>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        isOutOfStock
                          ? 'bg-red-100 text-red-700'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {isOutOfStock ? 'Out of Stock' : 'Available'}
                      </span>
                    </div>

                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Price:</span>
                        <span className="font-semibold text-gray-900">${price}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Stock:</span>
                        <span className={`font-semibold ${isOutOfStock ? 'text-red-600' : 'text-gray-900'}`}>
                          {stock} units
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Category:</span>
                        <span className="text-gray-900 capitalize">{product.category || 'Uncategorized'}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition">
                        <Edit className="w-4 h-4" />
                        Edit
                      </button>
                      <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-red-300 text-red-700 text-sm rounded-lg hover:bg-red-50 transition">
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-600">
                {searchTerm || selectedCategory !== 'all'
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Get started by adding your first product.'
                }
              </p>
            </div>
          )}
        </>
      )}
    </Layout>
  );
};

export default ProductCatalog;