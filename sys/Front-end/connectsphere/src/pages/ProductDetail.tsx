import { Star, ShoppingCart, Truck, RefreshCw, Shield } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';

type ProductDetailProps = {
  product: {
    id: string;
    name: string;
    image_url: string;
    price: number;
    bulk_price: number;
    unit_price: number;
    description: string;
    category: string;
    rating: number;
    stock: number;
    moq: number;
    participants_count: number;
    moq_progress: number;
    specifications: string;
    manufacturer: string;
    warranty: string;
  };
  mode: 'view' | 'join';
};

const ProductDetail = () => {
  const location = useLocation();
  const { product, mode } = location.state as ProductDetailProps;
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'description' | 'specs'>('description');
  const [quantity, setQuantity] = useState(1);

  const handleJoinGroup = () => {
    // API call to join group would go here
    navigate('/confirmation', { state: { product } });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header (same as TraderDashboard) */}
      
      {/* Main Content */}
      <main className="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Product Header */}
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{product.name}</h1>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    className={`w-4 h-4 ${i < Math.floor(product.rating) ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} 
                  />
                ))}
              </div>
              <span className="text-sm text-gray-600">{product.rating} (24 reviews)</span>
            </div>
          </div>

          {/* Product Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6">
            {/* Product Image */}
            <div className="bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center h-96">
              {product.image_url ? (
                <img 
                  src={product.image_url} 
                  alt={product.name} 
                  className="h-full w-full object-contain" 
                />
              ) : (
                <span className="text-7xl text-gray-400">📦</span>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              {/* Price */}
              <div className="space-y-2">
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-bold text-gray-900">${product.bulk_price}</span>
                  <span className="text-lg text-gray-500 line-through">${product.unit_price}</span>
                  <span className="bg-green-100 text-green-800 text-sm font-medium px-2 py-0.5 rounded">
                    Save {Math.round((1 - product.bulk_price/product.unit_price) * 100)}%
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  {product.stock > 0 ? (
                    <span className="text-green-600">{product.stock} in stock</span>
                  ) : (
                    <span className="text-red-600">Out of stock</span>
                  )}
                </p>
              </div>

              {/* Highlights */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <Truck className="w-5 h-5 text-blue-600" />
                  <span>Ordered today, delivered tomorrow</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <RefreshCw className="w-5 h-5 text-blue-600" />
                  <span>14 day free returns</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Shield className="w-5 h-5 text-blue-600" />
                  <span>Day and night customer service</span>
                </div>
              </div>

              {/* Category Tags */}
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                  {product.category}
                </span>
                <span className="px-3 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                  Group Buy
                </span>
              </div>

              {/* Group Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>{product.participants_count} joined</span>
                  <span>{product.moq} needed</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full" 
                    style={{ width: `${product.moq_progress}%` }}
                  />
                </div>
              </div>

              {/* Join Group */}
              {mode === 'join' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-lg"
                    >
                      -
                    </button>
                    <span className="text-lg font-medium">{quantity}</span>
                    <button 
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-lg"
                    >
                      +
                    </button>
                  </div>
                  <button 
                    onClick={handleJoinGroup}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    Join Group - ${(product.bulk_price * quantity).toFixed(2)}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="border-t border-gray-200">
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab('description')}
                className={`px-6 py-4 font-medium text-sm ${activeTab === 'description' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Description
              </button>
              <button
                onClick={() => setActiveTab('specs')}
                className={`px-6 py-4 font-medium text-sm ${activeTab === 'specs' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Specifications
              </button>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {activeTab === 'description' ? (
                <div className="prose max-w-none">
                  <p>{product.description}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900">Manufacturer</h4>
                    <p className="text-gray-600">{product.manufacturer}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Warranty</h4>
                    <p className="text-gray-600">{product.warranty}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">Specifications</h4>
                    <p className="text-gray-600">{product.specifications}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProductDetail;
