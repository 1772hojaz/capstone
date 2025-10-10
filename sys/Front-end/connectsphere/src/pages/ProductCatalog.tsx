import Layout from '../components/Layout';
import { Search, Plus, Edit, Trash2, Package } from 'lucide-react';

const ProductCatalog = () => {
  const products = [
    {
      id: 1,
      name: 'Wireless Bluetooth Headphones',
      category: 'Electronics',
      price: 89.99,
      stock: 150,
      status: 'Available',
      image: '🎧',
    },
    {
      id: 2,
      name: 'Smart Fitness Watch',
      category: 'Wearables',
      price: 199.99,
      stock: 75,
      status: 'Available',
      image: '⌚',
    },
    {
      id: 3,
      name: 'Portable Phone Charger',
      category: 'Accessories',
      price: 29.99,
      stock: 0,
      status: 'Out of Stock',
      image: '🔋',
    },
    {
      id: 4,
      name: 'USB-C Docking Station',
      category: 'Electronics',
      price: 129.99,
      stock: 45,
      status: 'Available',
      image: '🔌',
    },
    {
      id: 5,
      name: 'Mechanical Gaming Keyboard',
      category: 'Gaming',
      price: 149.99,
      stock: 88,
      status: 'Available',
      image: '⌨️',
    },
    {
      id: 6,
      name: 'Ergonomic Office Chair',
      category: 'Furniture',
      price: 299.99,
      stock: 25,
      status: 'Available',
      image: '🪑',
    },
  ];

  const categories = ['All', 'Electronics', 'Wearables', 'Accessories', 'Gaming', 'Furniture'];

  return (
    <Layout title="Product Catalog" user="Admin User">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Package className="w-6 h-6 text-blue-600" />
          <p className="text-gray-600">Update and manage the inventory of products available for group buying.</p>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search products..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
          <Plus className="w-4 h-4" />
          Add Product
        </button>
      </div>

      {/* Category Filter */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
        {categories.map((category) => (
          <button
            key={category}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              category === 'All'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">Total Products</p>
          <p className="text-2xl font-bold text-gray-900">{products.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">In Stock</p>
          <p className="text-2xl font-bold text-green-600">
            {products.filter(p => p.status === 'Available').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">Out of Stock</p>
          <p className="text-2xl font-bold text-red-600">
            {products.filter(p => p.status === 'Out of Stock').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">Total Value</p>
          <p className="text-2xl font-bold text-blue-600">
            ${products.reduce((acc, p) => acc + p.price * p.stock, 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <div key={product.id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition">
            <div className="p-6">
              {/* Product Image/Icon */}
              <div className="w-full h-32 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg flex items-center justify-center mb-4">
                <span className="text-5xl">{product.image}</span>
              </div>

              {/* Product Info */}
              <div className="mb-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-base font-semibold text-gray-900">{product.name}</h3>
                  <span className={`px-2 py-1 text-xs font-semibold rounded ${
                    product.status === 'Available' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {product.status}
                  </span>
                </div>
                <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded mb-3">
                  {product.category}
                </span>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Price</span>
                    <span className="font-semibold text-gray-900">${product.price}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Stock</span>
                    <span className={`font-semibold ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {product.stock} units
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
                <button className="p-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Layout>
  );
};

export default ProductCatalog;
