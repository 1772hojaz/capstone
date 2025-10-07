import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { groupsAPI, productsAPI, mlAPI, chatAPI } from '../api';

const TraderDashboard = () => {
  const [activeTab, setActiveTab] = useState('recommendations');
  const [recommendations, setRecommendations] = useState([]);
  const [allGroups, setAllGroups] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [loading, setLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [userGroups, setUserGroups] = useState([]);
  const [joinQuantity, setJoinQuantity] = useState('');
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [groupToJoin, setGroupToJoin] = useState(null);
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [selectedContribution, setSelectedContribution] = useState(null);
  const [newQuantity, setNewQuantity] = useState('');
  const [currency, setCurrency] = useState('USD'); // 'USD' or 'ZiG'
  const [mlHealth, setMlHealth] = useState(null); // ML system health
  const [showMlInsights, setShowMlInsights] = useState(true); // Toggle ML insights display
  const navigate = useNavigate();

  // Helper function to format price based on selected currency
  const formatPrice = (product, priceType = 'unit') => {
    if (!product) return '0.00';
    
    if (currency === 'ZiG') {
      const price = priceType === 'unit' ? product.unit_price_zig : product.bulk_price_zig;
      return price ? price.toFixed(2) : '0.00';
    } else {
      const price = priceType === 'unit' ? product.unit_price : product.bulk_price;
      return price ? price.toFixed(2) : '0.00';
    }
  };

  const getCurrencySymbol = () => currency === 'ZiG' ? 'ZiG' : '$';
  const getCurrencyPosition = () => currency === 'ZiG' ? 'after' : 'before';

  const displayPrice = (price) => {
    if (getCurrencyPosition() === 'before') {
      return `${getCurrencySymbol()}${price}`;
    } else {
      return `${price} ${getCurrencySymbol()}`;
    }
  };

  const fetchRecommendations = async () => {
    try {
      const response = await mlAPI.getRecommendations();
      setRecommendations(response.data);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      if (error.response?.status === 401) {
        localStorage.clear();
        navigate('/');
      }
    }
  };

  const fetchMlHealth = async () => {
    try {
      const response = await mlAPI.getHealth();
      setMlHealth(response.data);
    } catch (error) {
      console.error('Error fetching ML health:', error);
    }
  };

  const fetchAllGroups = async () => {
    try {
      const response = await groupsAPI.getAll({ status: 'active' });
      setAllGroups(response.data);
    } catch (error) {
      console.error('Error fetching groups:', error);
      if (error.response?.status === 401) {
        localStorage.clear();
        navigate('/');
      }
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await productsAPI.getAll();
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
      if (error.response?.status === 401) {
        localStorage.clear();
        navigate('/');
      }
    }
  };

  const fetchUserGroups = async () => {
    try {
      const response = await groupsAPI.getUserGroups();
      setUserGroups(response.data);
    } catch (error) {
      console.error('Error fetching user groups:', error);
    }
  };

  const fetchChatMessages = async (groupId) => {
    try {
      const response = await chatAPI.getMessages(groupId);
      setChatMessages(response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  useEffect(() => {
    fetchRecommendations();
    fetchAllGroups();
    fetchProducts();
    fetchUserGroups();
    fetchMlHealth(); // Fetch ML system status
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedGroup) {
      const groupId = selectedGroup.id || selectedGroup.group_buy_id;
      fetchChatMessages(groupId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGroup]);

  const openJoinModal = (group) => {
    console.log('Opening join modal with group:', group);
    setGroupToJoin(group);
    setJoinQuantity('1');
    setShowJoinModal(true);
  };

  const handleJoinGroup = async () => {
    console.log('handleJoinGroup called');
    console.log('joinQuantity:', joinQuantity);
    console.log('groupToJoin:', groupToJoin);
    
    if (!joinQuantity || isNaN(joinQuantity) || joinQuantity < 1) {
      alert('Please enter a valid quantity');
      return;
    }

    const groupId = groupToJoin?.id || groupToJoin?.group_buy_id;
    
    if (!groupToJoin || !groupId) {
      console.error('groupToJoin is invalid:', groupToJoin);
      alert('Error: Group information is missing');
      return;
    }

    try {
      setLoading(true);
      console.log('Joining group:', groupId, 'with quantity:', joinQuantity);
      console.log('API call: POST /groups/' + groupId + '/join', { quantity: parseInt(joinQuantity) });
      
      const response = await groupsAPI.join(groupId, { quantity: parseInt(joinQuantity) });
      
      console.log('Join response:', response);
      alert(`Successfully joined! Upfront payment: $${(response.data.upfront_payment || 0).toFixed(2)}`);
      setShowJoinModal(false);
      
      // Refresh data to update UI
      await fetchUserGroups(); // Wait for user groups to update
      fetchRecommendations();
      fetchAllGroups();
    } catch (error) {
      console.error('Join error:', error);
      console.error('Error response:', error.response);
      console.error('Error request:', error.request);
      console.error('Error message:', error.message);
      console.error('Error config:', error.config);
      
      let errorMsg = 'Failed to join group';
      
      if (error.message === 'Network Error') {
        errorMsg = 'Network Error: Cannot connect to server. Please check if the backend is running on port 8000.';
      } else if (error.response?.data) {
        if (typeof error.response.data === 'string') {
          errorMsg = error.response.data;
        } else if (error.response.data.detail) {
          errorMsg = error.response.data.detail;
        } else if (error.response.data.message) {
          errorMsg = error.response.data.message;
        } else {
          errorMsg = JSON.stringify(error.response.data);
        }
      } else if (error.message) {
        errorMsg = error.message;
      }
      
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const openQuantityModal = (contribution) => {
    setSelectedContribution(contribution);
    setNewQuantity(contribution.quantity.toString());
    setShowQuantityModal(true);
  };

  const handleUpdateQuantity = async () => {
    if (!newQuantity || isNaN(newQuantity) || newQuantity < selectedContribution.quantity) {
      alert(`Quantity cannot be less than your initial order (${selectedContribution.quantity})`);
      return;
    }

    try {
      setLoading(true);
      await groupsAPI.updateContribution(selectedContribution.group_id, { 
        quantity: parseInt(newQuantity) 
      });
      alert('Order quantity updated successfully!');
      setShowQuantityModal(false);
      fetchUserGroups();
      fetchAllGroups();
    } catch (error) {
      console.error('Update error:', error);
      const errorMsg = error.response?.data?.detail || error.response?.data?.message || error.message || 'Failed to update quantity';
      alert(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!selectedProduct) {
      alert('Please select a product');
      return;
    }

    const days = prompt('Enter number of days until deadline:', '7');
    if (!days || isNaN(days) || days < 1) {
      alert('Please enter valid number of days');
      return;
    }

    try {
      setLoading(true);
      const deadline = new Date();
      deadline.setDate(deadline.getDate() + parseInt(days));

      await groupsAPI.create({
        product_id: selectedProduct.id,
        deadline: deadline.toISOString()
      });

      alert('Group-buy created successfully!');
      setSelectedProduct(null);
      setActiveTab('recommendations');
      fetchAllGroups();
      fetchRecommendations();
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  const openChatModal = (group) => {
    // Check if user is a member of this group
    const groupId = group.id || group.group_buy_id;
    const isMember = userGroups.some(g => g.id === groupId);
    
    if (!isMember) {
      console.log('Not a member. Group ID:', groupId, 'User groups:', userGroups.map(g => g.id));
      alert('You must join this group to access the chat!');
      return;
    }
    
    // Normalize the group object to always have 'id' property
    const normalizedGroup = { ...group, id: groupId };
    setSelectedGroup(normalizedGroup);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedGroup) return;

    try {
      const groupId = selectedGroup.id || selectedGroup.group_buy_id;
      await chatAPI.sendMessage(groupId, { message: newMessage });
      setNewMessage('');
      fetchChatMessages(groupId);
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const GroupCard = ({ group, showJoinButton = true, userContribution = null }) => {
    const isMember = userGroups.some(g => g.id === (group.id || group.group_buy_id));
    
    return (
      <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
        <div className="flex items-start space-x-4">
          <img
            src={group.product_image_url || 'https://via.placeholder.com/100'}
            alt={group.product_name}
            className="w-20 h-20 object-cover rounded"
          />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-800">{group.product_name}</h3>
            {group.product_description && (
              <div className="flex items-center text-xs text-blue-600 font-medium mt-1 mb-2">
                <span className="mr-1">📦</span>
                <span>{group.product_description}</span>
              </div>
            )}
            
            {/* Product Details */}
                            <p className="text-sm text-gray-600 mb-1">
                  <span className="font-medium">Unit Price:</span> {displayPrice(formatPrice(group, 'unit'))}
                </p>
                <p className="text-sm text-gray-600 mb-3">
                  <span className="font-medium">Bulk Price:</span> <span className="text-green-600">{displayPrice(formatPrice(group, 'bulk'))}</span>
                </p>
            
            <div className="mt-3 space-y-1 text-sm text-gray-600">
              <p className="flex items-center">
                <span className="font-medium mr-2">📍 Location:</span>
                {group.location_zone}
              </p>
              <p className="flex items-center">
                <span className="font-medium mr-2">⏰ Deadline:</span>
                {new Date(group.deadline).toLocaleDateString()}
              </p>
              <p className="flex items-center">
                <span className="font-medium mr-2">👥 Participants:</span>
                {group.participants_count || 0}
              </p>
            </div>
            
            {/* Progress Bar */}
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>MOQ Progress</span>
                <span>{(group.moq_progress || 0).toFixed(0)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(group.moq_progress || 0, 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {group.total_quantity} / {group.moq} units
              </p>
            </div>

            {userContribution && (
              <div className="mt-3 bg-green-50 p-3 rounded-lg">
                <p className="text-sm text-green-800">
                  <span className="font-semibold">Your Order:</span> {userContribution.quantity} units
                  <button
                    onClick={() => openQuantityModal(userContribution)}
                    className="ml-2 text-xs text-blue-600 hover:underline"
                  >
                    ✏️ Update
                  </button>
                </p>
              </div>
            )}

            {group.recommendation_score && showMlInsights && (
              <div className="mt-4 space-y-2">
                {/* AI Recommendation Badge */}
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center bg-gradient-to-r from-purple-100 to-blue-100 text-purple-800 text-xs font-medium px-3 py-1.5 rounded-full">
                    🤖 AI Recommended
                    <span className="ml-2 bg-purple-200 text-purple-900 px-2 py-0.5 rounded-full font-bold">
                      {(group.recommendation_score * 100).toFixed(0)}%
                    </span>
                  </span>
                </div>

                {/* AI Explanation */}
                <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded-r">
                  <p className="text-sm text-blue-900">
                    <span className="font-medium">💡 Why:</span> {group.reason}
                  </p>
                </div>

                {/* ML Component Scores (if available) */}
                {group.ml_scores && (
                  <details className="text-xs">
                    <summary className="cursor-pointer text-gray-600 hover:text-gray-900 font-medium">
                      📊 ML Breakdown
                    </summary>
                    <div className="mt-2 space-y-1.5 pl-2">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700">👥 Collaborative:</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-green-500" 
                              style={{width: `${group.ml_scores.collaborative_filtering * 100}%`}}
                            ></div>
                          </div>
                          <span className="font-mono text-gray-900 w-12 text-right">
                            {(group.ml_scores.collaborative_filtering * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700">📝 Content-Based:</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-500" 
                              style={{width: `${group.ml_scores.content_based * 100}%`}}
                            ></div>
                          </div>
                          <span className="font-mono text-gray-900 w-12 text-right">
                            {(group.ml_scores.content_based * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700">🔥 Popularity:</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-orange-500" 
                              style={{width: `${group.ml_scores.popularity * 100}%`}}
                            ></div>
                          </div>
                          <span className="font-mono text-gray-900 w-12 text-right">
                            {(group.ml_scores.popularity * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                      <div className="pt-1 border-t border-gray-300 flex items-center justify-between">
                        <span className="text-gray-900 font-semibold">🎯 Hybrid Score:</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-purple-500 to-blue-500" 
                              style={{width: `${group.ml_scores.hybrid * 100}%`}}
                            ></div>
                          </div>
                          <span className="font-mono text-purple-900 font-bold w-12 text-right">
                            {(group.ml_scores.hybrid * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </details>
                )}
              </div>
            )}
            
            {/* Simple badge when insights are hidden */}
            {group.recommendation_score && !showMlInsights && (
              <div className="mt-3">
                <span className="inline-block bg-purple-100 text-purple-800 text-xs font-medium px-2 py-1 rounded">
                  ⭐ {(group.recommendation_score * 100).toFixed(0)}% Match
                </span>
              </div>
            )}

            <div className="mt-4 flex space-x-2">
              {showJoinButton && !isMember && (
                <button
                  onClick={() => openJoinModal(group)}
                  disabled={loading}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  Join Group
                </button>
              )}
              <button
                onClick={() => openChatModal(group)}
                className={`flex-1 px-4 py-2 rounded-md ${
                  isMember 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                }`}
                disabled={!isMember}
              >
                💬 Chat {!isMember && '(Join to access)'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const ProductCard = ({ product }) => (
    <div
      onClick={() => setSelectedProduct(product)}
      className={`bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-all ${
        selectedProduct?.id === product.id ? 'ring-2 ring-blue-500' : ''
      }`}
    >
      <img
        src={product.image_url || 'https://via.placeholder.com/200'}
        alt={product.name}
        className="w-full h-40 object-cover rounded mb-4"
      />
      <h3 className="text-lg font-semibold text-gray-800 mb-1">{product.name}</h3>
      <div className="flex items-center text-sm text-blue-600 font-medium mb-3">
        <span className="mr-1">📦</span>
        <span>{product.description}</span>
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Unit Price:</span>
          <span className="font-semibold">{displayPrice(formatPrice(product, 'unit'))}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Bulk Price:</span>
          <span className="font-semibold text-green-600">{displayPrice(formatPrice(product, 'bulk'))}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">MOQ:</span>
          <span className="font-semibold">{product.moq || 0} units</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Savings:</span>
          <span className="font-semibold text-green-600">{((product.savings_factor || 0) * 100).toFixed(0)}%</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Trader Dashboard</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                📍 {localStorage.getItem('locationZone')}
              </span>
              {/* Currency Toggle */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setCurrency('USD')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    currency === 'USD'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  USD ($)
                </button>
                <button
                  onClick={() => setCurrency('ZiG')}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    currency === 'ZiG'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  ZiG
                </button>
              </div>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ML System Status Banner */}
      {mlHealth && activeTab === 'recommendations' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className={`rounded-lg p-4 ${
            mlHealth.status === 'healthy' 
              ? 'bg-gradient-to-r from-green-50 to-blue-50 border border-green-200' 
              : 'bg-yellow-50 border border-yellow-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">
                  {mlHealth.status === 'healthy' ? '🤖' : '⚙️'}
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    {mlHealth.status === 'healthy' ? '✅ AI Recommender Active' : '⚠️ AI Recommender Initializing'}
                  </h3>
                  <p className="text-xs text-gray-600">
                    Mode: <span className="font-medium">{mlHealth.recommendation_mode}</span>
                    {mlHealth.model_details?.feature_store && (
                      <>
                        {' • '}
                        {mlHealth.model_details.feature_store.n_clusters} trader groups
                        {' • '}
                        {mlHealth.model_details.feature_store.n_products} products analyzed
                      </>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right text-xs">
                  <div className="flex items-center space-x-2">
                    <span className={`w-2 h-2 rounded-full ${
                      mlHealth.models_loaded?.nmf_collaborative_filtering ? 'bg-green-500' : 'bg-gray-300'
                    }`}></span>
                    <span className="text-gray-700">Collaborative</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`w-2 h-2 rounded-full ${
                      mlHealth.models_loaded?.tfidf_content_based ? 'bg-blue-500' : 'bg-gray-300'
                    }`}></span>
                    <span className="text-gray-700">Content-Based</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`w-2 h-2 rounded-full ${
                      mlHealth.models_loaded?.clustering ? 'bg-purple-500' : 'bg-gray-300'
                    }`}></span>
                    <span className="text-gray-700">Clustering</span>
                  </div>
                </div>
                <button
                  onClick={() => setShowMlInsights(!showMlInsights)}
                  className="px-3 py-1.5 text-xs font-medium bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  {showMlInsights ? '🔽 Hide' : '▶️ Show'} ML Details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {['recommendations', 'myGroups', 'allGroups', 'createGroup'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize`}
              >
                {tab === 'recommendations' && '⭐ Recommended'}
                {tab === 'myGroups' && '👥 My Groups'}
                {tab === 'allGroups' && '🔍 All Groups'}
                {tab === 'createGroup' && '➕ Create Group'}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'recommendations' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Recommended Group-Buys for You</h2>
            {recommendations.length === 0 ? (
              <p className="text-gray-600">No recommendations available at the moment.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {recommendations.map((group) => {
                  const userGroup = userGroups.find(g => g.id === group.group_buy_id);
                  const userContribution = userGroup ? { 
                    quantity: userGroup.user_quantity || group.total_quantity / (group.participants_count || 1),
                    group_id: group.group_buy_id 
                  } : null;
                  return (
                    <GroupCard 
                      key={group.group_buy_id} 
                      group={group} 
                      userContribution={userContribution}
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'myGroups' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">My Joined Groups</h2>
            {userGroups.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 mb-4">You haven't joined any groups yet.</p>
                <button
                  onClick={() => setActiveTab('recommendations')}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Browse Recommendations →
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {userGroups.map((group) => {
                  const userContribution = { 
                    quantity: group.user_quantity,
                    group_id: group.id 
                  };
                  return (
                    <GroupCard 
                      key={group.id} 
                      group={group} 
                      userContribution={userContribution}
                      showJoinButton={false}
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'allGroups' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">All Active Group-Buys</h2>
            {allGroups.length === 0 ? (
              <p className="text-gray-600">No active group-buys in your location.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {allGroups.map((group) => {
                  const userGroup = userGroups.find(g => g.id === group.id);
                  const userContribution = userGroup ? { 
                    quantity: userGroup.user_quantity || group.total_quantity / (group.participants_count || 1),
                    group_id: group.id 
                  } : null;
                  return (
                    <GroupCard 
                      key={group.id} 
                      group={group} 
                      userContribution={userContribution}
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'createGroup' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Create New Group-Buy</h2>
            <p className="text-gray-600 mb-6">
              Select a product to create a group-buy. You'll set the deadline, and the system will use your location automatically.
            </p>
            
            {selectedProduct && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-blue-900">Selected: {selectedProduct.name}</p>
                    <p className="text-sm text-blue-700">MOQ: {selectedProduct?.moq || 0} units • Savings: {((selectedProduct?.savings_factor || 0) * 100).toFixed(0)}%</p>
                  </div>
                  <button
                    onClick={handleCreateGroup}
                    disabled={loading}
                    className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    Create Group
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Telegram-Style Chat Modal */}
      {selectedGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[90vh] flex flex-col">
            {/* Chat Header - Telegram Style */}
            <div className="bg-blue-600 text-white p-4 rounded-t-lg flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  🛒
                </div>
                <div>
                  <h3 className="font-semibold">{selectedGroup.product_name}</h3>
                  <p className="text-xs text-blue-100">{selectedGroup.participants_count || 0} participants</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedGroup(null)}
                className="text-white hover:bg-blue-700 rounded-full p-2"
              >
                ✕
              </button>
            </div>

            {/* Chat Messages - Telegram Style */}
            <div className="flex-1 overflow-y-auto p-4 bg-blue-50" style={{
              backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 35px, rgba(59, 130, 246, 0.05) 35px, rgba(59, 130, 246, 0.05) 70px)'
            }}>
              {chatMessages.length === 0 ? (
                <div className="text-center text-gray-500 mt-10">
                  <p className="text-4xl mb-2">💬</p>
                  <p>No messages yet. Start the conversation!</p>
                </div>
              ) : (
                chatMessages.map((msg, idx) => {
                  const isOwnMessage = msg.user_id === parseInt(localStorage.getItem('userId'));
                  return (
                    <div
                      key={idx}
                      className={`mb-3 flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                          isOwnMessage
                            ? 'bg-blue-500 text-white rounded-br-sm'
                            : 'bg-white text-gray-800 rounded-bl-sm shadow-sm'
                        }`}
                      >
                        {!isOwnMessage && (
                          <p className="text-xs font-semibold mb-1 text-blue-600">
                            {msg.user_name || 'Trader'}
                          </p>
                        )}
                        <p className="break-words">{msg.message}</p>
                        <p className={`text-xs mt-1 ${isOwnMessage ? 'text-blue-100' : 'text-gray-400'}`}>
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Message Input - Telegram Style */}
            <div className="p-4 border-t bg-white rounded-b-lg">
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="bg-blue-600 text-white px-6 py-3 rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Join Group Modal */}
      {showJoinModal && groupToJoin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-4">Join Group-Buy</h3>
              
              <div className="mb-4 bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-1">{groupToJoin.product_name}</h4>
                {groupToJoin.product_description && (
                  <div className="flex items-center text-sm text-blue-600 font-medium mb-3">
                    <span className="mr-1">📦</span>
                    <span>{groupToJoin.product_description}</span>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                  <div><span className="font-medium">Unit Price:</span> {displayPrice(formatPrice(groupToJoin, 'unit'))}</div>
                  <div><span className="font-medium">Bulk Price:</span> <span className="text-green-600">{displayPrice(formatPrice(groupToJoin, 'bulk'))}</span></div>
                  <div><span className="font-medium">Savings:</span> <span className="text-green-600">{((groupToJoin.savings_factor || 0) * 100).toFixed(0)}%</span></div>
                  <div><span className="font-medium">MOQ:</span> {groupToJoin.moq || 0} units</div>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  How many units do you want to purchase?
                </label>
                <input
                  type="number"
                  min="1"
                  value={joinQuantity}
                  onChange={(e) => setJoinQuantity(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter quantity"
                />
                {joinQuantity && (
                  <p className="mt-2 text-sm text-gray-600">
                    Estimated cost: <span className="font-semibold text-blue-600">
                      ${((joinQuantity * (groupToJoin.bulk_price || 0))).toFixed(2)}
                    </span> (50% upfront: ${((joinQuantity * (groupToJoin.bulk_price || 0)) * 0.5).toFixed(2)})
                  </p>
                )}
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowJoinModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleJoinGroup}
                  disabled={loading || !joinQuantity || joinQuantity < 1}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {loading ? 'Joining...' : 'Confirm & Join'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Update Quantity Modal */}
      {showQuantityModal && selectedContribution && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-4">Update Order Quantity</h3>
              
              <div className="mb-4 bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <span className="font-semibold">Current order:</span> {selectedContribution.quantity} units
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  Note: You can increase your order or decrease it, but not below your initial quantity.
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Quantity (min: {selectedContribution.quantity})
                </label>
                <input
                  type="number"
                  min={selectedContribution.quantity}
                  value={newQuantity}
                  onChange={(e) => setNewQuantity(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowQuantityModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateQuantity}
                  disabled={loading || !newQuantity || newQuantity < selectedContribution.quantity}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Updating...' : 'Update Order'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TraderDashboard;