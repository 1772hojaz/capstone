import Layout from '../components/Layout';
import { Search, Plus, Edit, Trash2, Package, Users } from 'lucide-react';
import { useState } from 'react';

const ProductCatalog = () => {
  const [products, setProducts] = useState([
    {
      id: 1,
      name: 'Wireless Bluetooth Headphones',
      category: 'Electronics',
      price: 89.99,
      stock: 150,
      status: 'Available',
      image: 'https://media.istockphoto.com/id/814423752/photo/eye-of-model-with-colorful-art-make-up-close-up.jpg?s=612x612&w=0&k=20&c=l15OdMWjgCKycMMShP8UK94ELVlEGvt7GmB_esHWPYE=',
      bulk_price: 62.99,
      moq: 10,
      savings_factor: 0.30,
      hasGroup: true,
    },
    {
      id: 2,
      name: 'Smart Fitness Watch',
      category: 'Wearables',
      price: 199.99,
      stock: 75,
      status: 'Available',
      image: 'https://media.istockphoto.com/id/814423752/photo/eye-of-model-with-colorful-art-make-up-close-up.jpg?s=612x612&w=0&k=20&c=l15OdMWjgCKycMMShP8UK94ELVlEGvt7GmB_esHWPYE=',
      bulk_price: 149.99,
      moq: 15,
      savings_factor: 0.25,
      hasGroup: true,
    },
    {
      id: 3,
      name: 'Portable Phone Charger',
      category: 'Accessories',
      price: 29.99,
      stock: 0,
      status: 'Out of Stock',
      image: 'https://media.istockphoto.com/id/814423752/photo/eye-of-model-with-colorful-art-make-up-close-up.jpg?s=612x612&w=0&k=20&c=l15OdMWjgCKycMMShP8UK94ELVlEGvt7GmB_esHWPYE=',
      bulk_price: 20.99,
      moq: 20,
      savings_factor: 0.30,
      hasGroup: false,
    },
    {
      id: 4,
      name: 'USB-C Docking Station',
      category: 'Electronics',
      price: 129.99,
      stock: 45,
      status: 'Available',
      image: 'https://media.istockphoto.com/id/814423752/photo/eye-of-model-with-colorful-art-make-up-close-up.jpg?s=612x612&w=0&k=20&c=l15OdMWjgCKycMMShP8UK94ELVlEGvt7GmB_esHWPYE=',
      bulk_price: 97.49,
      moq: 8,
      savings_factor: 0.25,
      hasGroup: true,
    },
    {
      id: 5,
      name: 'Mechanical Gaming Keyboard',
      category: 'Gaming',
      price: 149.99,
      stock: 88,
      status: 'Available',
      image: 'https://media.istockphoto.com/id/814423752/photo/eye-of-model-with-colorful-art-make-up-close-up.jpg?s=612x612&w=0&k=20&c=l15OdMWjgCKycMMShP8UK94ELVlEGvt7GmB_esHWPYE=',
      bulk_price: 104.99,
      moq: 12,
      savings_factor: 0.30,
      hasGroup: true,
    },
    {
      id: 6,
      name: 'Ergonomic Office Chair',
      category: 'Furniture',
      price: 299.99,
      stock: 25,
      status: 'Available',
      image: 'https://media.istockphoto.com/id/814423752/photo/eye-of-model-with-colorful-art-make-up-close-up.jpg?s=612x612&w=0&k=20&c=l15OdMWjgCKycMMShP8UK94ELVlEGvt7GmB_esHWPYE=',
      bulk_price: 224.99,
      moq: 5,
      savings_factor: 0.25,
      hasGroup: true,
    },
  ]);

  const [groups, setGroups] = useState([
    {
      id: 1,
      productId: 1,
      name: 'Wireless Bluetooth Headphones Group Buy',
      status: 'Active',
      progress: '8/10',
      dueDate: '2024-01-15',
      members: 8,
      targetMembers: 10,
    },
    {
      id: 2,
      productId: 2,
      name: 'Smart Fitness Watch Group Buy',
      status: 'Active',
      progress: '5/15',
      dueDate: '2024-01-20',
      members: 5,
      targetMembers: 15,
    },
    {
      id: 3,
      productId: 4,
      name: 'USB-C Docking Station Group Buy',
      status: 'Active',
      progress: '6/8',
      dueDate: '2024-01-18',
      members: 6,
      targetMembers: 8,
    },
    {
      id: 4,
      productId: 5,
      name: 'Mechanical Gaming Keyboard Group Buy',
      status: 'Active',
      progress: '9/12',
      dueDate: '2024-01-22',
      members: 9,
      targetMembers: 12,
    },
    {
      id: 5,
      productId: 6,
      name: 'Ergonomic Office Chair Group Buy',
      status: 'Active',
      progress: '3/5',
      dueDate: '2024-01-25',
      members: 3,
      targetMembers: 5,
    },
  ]);

  const addProductWithGroup = () => {
    const newProductId = products.length + 1;
    const newProduct = {
      id: newProductId,
      name: 'New Product',
      category: 'Electronics',
      price: 99.99,
      stock: 100,
      status: 'Available',
      image: 'https://media.istockphoto.com/id/814423752/photo/eye-of-model-with-colorful-art-make-up-close-up.jpg?s=612x612&w=0&k=20&c=l15OdMWjgCKycMMShP8UK94ELVlEGvt7GmB_esHWPYE=',
      bulk_price: 79.99,
      moq: 10,
      savings_factor: 0.20,
      hasGroup: true,
    };

    // Add product
    setProducts([...products, newProduct]);

    // Automatically create group for the product
    const newGroup = {
      id: groups.length + 1,
      productId: newProductId,
      name: `${newProduct.name} Group Buy`,
      status: 'Active',
      progress: `0/${newProduct.moq}`,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
      members: 0,
      targetMembers: newProduct.moq,
    };

    setGroups([...groups, newGroup]);
  };

  const categories = ['All', 'Electronics', 'Wearables', 'Accessories', 'Gaming', 'Furniture'];

  return (
    <Layout title="Product Catalog">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Package className="w-6 h-6 text-blue-600" />
          <p className="text-gray-600">Manage products and automatically create group buy opportunities for traders.</p>
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
        <button onClick={addProductWithGroup} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
          <Plus className="w-4 h-4" />
          Add Product & Create Group
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
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">Total Products</p>
          <p className="text-2xl font-bold text-gray-900">{products.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">Active Groups</p>
          <p className="text-2xl font-bold text-blue-600">
            {groups.filter(g => g.status === 'Active').length}
          </p>
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
                {product.image.startsWith('http') ? (
                  <img src={product.image} alt={product.name} className="h-32 object-contain" />
                ) : (
                  <span className="text-5xl">{product.image}</span>
                )}
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
                    <span className="text-gray-600">Bulk Price</span>
                    <span className="font-semibold text-green-600">${product.bulk_price}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">MOQ</span>
                    <span className="font-semibold text-blue-600">{product.moq} units</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Group Status</span>
                    <span className={`font-semibold ${product.hasGroup ? 'text-green-600' : 'text-orange-600'}`}>
                      {product.hasGroup ? 'Active Group' : 'No Group'}
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
