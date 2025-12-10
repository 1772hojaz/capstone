import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, Users, Clock, MapPin as MapPinIcon, 
  Package, Calendar, TrendingUp, CheckCircle, Share2,
  Heart, ExternalLink, Copy, MessageCircle, Mail,
  Sparkles, Shield, Zap, Store, Eye, EyeOff
} from 'lucide-react';
import apiService from '../services/apiWithMock';
import analyticsService from '../services/analytics';
import TopNavigation from '../components/navigation/TopNavigation';
import MobileBottomNav from '../components/navigation/MobileBottomNav';
import { PageContainer, PageHeader } from '../components/layout/index';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/Input';
import { Spinner } from '../components/feedback/Spinner';
import { ErrorAlert } from '../components/feedback/ErrorAlert';
import PaymentModal from '../components/PaymentModal';
import { useAppStore } from '../store/useAppStore';

interface GroupData {
  id?: number;
  group_buy_id?: number;
  product_name?: string;
  name?: string;
  description?: string;
  product_image_url?: string;
  image_url?: string;
  bulk_price?: number;
  price?: number;
  unit_price?: number;
  original_price?: number;
  originalPrice?: number;
  savings_factor?: number;
  discountPercentage?: number;
  savings?: number;
  participants_count?: number;
  participants?: number;
  moq?: number;
  delivery_location?: string;
  created_at?: string;
  end_date?: string;
  supplier_name?: string;
  supplier_email?: string;
  supplier_phone?: string;
  category?: string;
  [key: string]: any;
}

export default function GroupDetail() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAppStore();

  // Data from navigation state
  const recommendation = location.state?.recommendation;
  const group = location.state?.group;
  const mode = location.state?.mode || 'view';
  const source = location.state?.source; // Where the user came from
  const activeTab = location.state?.activeTab; // Tab from My Groups
  const groupData: GroupData | null = recommendation || group;

  // Helper to parse price from string or number
  const parsePrice = (value: string | number | undefined | null): number => {
    if (value === undefined || value === null) return 0;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const cleaned = value.replace(/[$,]/g, '');
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  };

  // Product details
  const productName = groupData?.product_name || groupData?.name || 'Product';
  const productPrice = parsePrice(groupData?.bulk_price) || parsePrice(groupData?.price) || 0;
  const originalPrice = parsePrice(groupData?.originalPrice) || parsePrice(groupData?.unit_price) || parsePrice(groupData?.original_price);

  // State
  const [error, setError] = useState<string | null>(null);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [joiningGroup, setJoiningGroup] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentData, setPaymentData] = useState<{
    txRef: string;
    amount: number;
    paymentUrl?: string;
  } | null>(null);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [imageZoomed, setImageZoomed] = useState(false);

  // Form state
  const [quantity, setQuantity] = useState(1);
  const [deliveryMethod, setDeliveryMethod] = useState('pickup');
  const [agreeToTerms, setAgreeToTerms] = useState(false);

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

  // Calculate derived values
  const groupId = groupData?.group_buy_id || groupData?.id;
  const progressPercentage = useMemo(() => {
    if (!groupData?.target_amount || groupData.target_amount === 0) return 0;
    const currentAmount = groupData.current_amount || groupData.amount_progress || 0;
    return (currentAmount / groupData.target_amount) * 100;
  }, [groupData]);

  const isGoalReached = useMemo(() => {
    if (!groupData) return false;
    const currentAmount = groupData.current_amount || 0;
    const targetAmount = groupData.target_amount || 0;
    // Only consider goal reached if target is greater than 0 AND current >= target
    return targetAmount > 0 && currentAmount >= targetAmount;
  }, [groupData]);

  const amountNeeded = useMemo(() => {
    if (!groupData) return 0;
    const currentAmount = groupData.current_amount || 0;
    const targetAmount = groupData.target_amount || 0;
    return Math.max(0, targetAmount - currentAmount);
  }, [groupData]);

  // Dynamic breadcrumbs based on source
  const breadcrumbs = useMemo(() => {
    const baseCrumb = { label: 'Home', path: '/trader' };
    
    switch (source) {
      case 'my-groups':
        return [
          baseCrumb,
          { 
            label: 'My Groups', 
            path: '/my-groups',
            state: { activeTab } // Pass tab back to My Groups
          },
          { label: productName }
        ];
      case 'dashboard':
      case 'recommendations':
        return [
          baseCrumb,
          { label: productName }
        ];
      case 'all-groups':
      default:
        return [
          baseCrumb,
          { label: 'All Groups', path: '/all-groups' },
          { label: productName }
        ];
    }
  }, [source, productName, activeTab]);

  // Countdown timer for group expiry
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  
  // QR Code visibility states
  const [showQRCode, setShowQRCode] = useState<boolean>(false);

  // Reset QR code visibility when group changes
  useEffect(() => {
    setShowQRCode(false);
  }, [groupId, groupData?.status]);

  useEffect(() => {
    if (!groupData?.end_date) return;

    const updateCountdown = () => {
      const now = new Date().getTime();
      const end = new Date(groupData.end_date!).getTime();
      const distance = end - now;

      if (distance < 0) {
        setTimeRemaining('Expired');
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) {
        setTimeRemaining(`${days}d ${hours}h left`);
      } else if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m left`);
      } else {
        setTimeRemaining(`${minutes}m left`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [groupData?.end_date]);

  // Analytics: track group view
  useEffect(() => {
    if (groupData && groupId) {
      analyticsService.trackGroupView(groupId, {
        ...groupData,
        source: location.state?.source || 'direct'
      });
    }
  }, [groupData, groupId, location.state?.source]);

  // Auto-show join form if mode is 'join'
  useEffect(() => {
    if (mode === 'join' && !isGoalReached) {
      setShowJoinForm(true);
    }
  }, [mode, isGoalReached]);

  // Share functionality
  const handleShare = async (method: string) => {
    const url = window.location.href;
    const text = `Check out this group buying deal: ${groupData?.product_name || groupData?.name}`;

    // Track share event
    if (groupId) {
      analyticsService.trackShare(
        groupId,
        method,
        groupData?.product_name || groupData?.name || ''
      );
    }

    switch (method) {
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'email':
        window.location.href = `mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(url)}`;
        break;
      case 'copy':
        try {
          await navigator.clipboard.writeText(url);
          setCopiedLink(true);
          setTimeout(() => setCopiedLink(false), 2000);
        } catch (err) {
          console.error('Failed to copy link:', err);
        }
        break;
    }
    setShowShareMenu(false);
  };

  // Wishlist functionality
  const toggleWishlist = () => {
    if (!groupId) return;

    if (isWishlisted) {
      analyticsService.trackWishlistRemove(groupId);
      setIsWishlisted(false);
      // TODO: Call API to remove from wishlist
    } else {
      analyticsService.trackWishlistAdd(groupId, {
        name: groupData?.product_name || groupData?.name,
        price: groupData?.bulk_price || groupData?.price
      });
      setIsWishlisted(true);
      // TODO: Call API to add to wishlist
    }
  };

  // Handle join group or add more products
  const handleJoinGroup = async () => {
    if (!agreeToTerms) {
      setError('You must agree to the terms and conditions');
      return;
    }

    if (!groupId) {
      setError('Invalid group ID');
      return;
    }

    // Check if user is adding more - either from my-groups OR if they already have quantity in this group
    const hasExistingQuantity = groupData?.quantity && groupData.quantity > 0;
    const isAddingMore = source === 'my-groups' || hasExistingQuantity;
    const actionType = isAddingMore ? 'quantity_increase' : 'join';

    try {
      setJoiningGroup(true);
      setError(null);

      let response;
      
      if (isAddingMore) {
        // User is adding more to an existing group - use quantity update endpoint
        // First, we need to initialize a payment for the additional amount
        const additionalAmount = productPrice * quantity;
        const txRef = `quantity_increase_${groupId}_${Date.now()}`;
        
        // Get user email - either from store or fetch from API
        let userEmail = currentUser?.email;
        if (!userEmail) {
          try {
            const userInfo = await apiService.getCurrentUser();
            userEmail = userInfo?.email;
          } catch (e) {
            console.error('Failed to get user info:', e);
          }
        }
        
        if (!userEmail) {
          setError('Unable to get user information. Please try logging in again.');
          setJoiningGroup(false);
          return;
        }
        
        // Initialize payment for the additional amount
        response = await apiService.initializePayment({
          amount: additionalAmount,
          email: userEmail,
          tx_ref: txRef,
          currency: 'USD'
        });
        
        // Store the quantity increase info for after payment
        if (response.data?.link || response.payment_url) {
          sessionStorage.setItem('paymentSuccessData', JSON.stringify({
            groupId,
            quantityIncrease: quantity,
            amount: additionalAmount,
            isQuantityIncrease: true
          }));
        }
      } else {
        // New join - use the join endpoint
        response = await apiService.joinGroup(groupId, {
          quantity,
          delivery_method: deliveryMethod,
          payment_method: "card"
        });
      }

      // Track analytics
      analyticsService.trackGroupJoinClick(groupId, {
        name: productName,
        quantity,
        price: productPrice,
        total_amount: productPrice * quantity,
        source: location.state?.source || 'direct',
        action: actionType
      });

      // Open payment modal with correct props
      const paymentUrl = response.data?.link || response.payment_url;
      const txRef = response.data?.tx_ref || response.tx_ref || response.transaction_id || `tx_${Date.now()}`;
      
      if (paymentUrl || txRef) {
        setPaymentData({
          txRef: txRef,
          amount: productPrice * quantity,
          paymentUrl: paymentUrl
        });
        setShowPaymentModal(true);

        // Track payment initiated
        analyticsService.trackPaymentInitiated({
          tx_ref: txRef,
          amount: productPrice * quantity,
          group_id: groupId,
          action: actionType,
          quantity
        });
      }

    } catch (err: any) {
      console.error(`Failed to ${isAddingMore ? 'add more products' : 'join group'}:`, err);
      setError(err.response?.data?.detail || err.message || `Failed to ${isAddingMore ? 'add more products' : 'join group'}. Please try again.`);
      analyticsService.trackError(`${actionType}_failed`, err.message, {
        group_id: groupId
      });
    } finally {
      setJoiningGroup(false);
    }
  };

  const handlePaymentSuccess = (data: any) => {
    if (groupId) {
      // Track recommendation join event in the database
      apiService.trackRecommendationJoin(groupId).catch(err => {
        console.warn('Failed to track recommendation join:', err);
      });

      analyticsService.trackPaymentSuccess({
        tx_ref: data.tx_ref,
        transaction_id: data.transaction_id,
        amount: (groupData?.bulk_price || groupData?.price || 0) * quantity,
        group_id: groupId,
        action: 'join'
      });

      analyticsService.trackJoinGroup(groupId, {
        name: groupData?.product_name || groupData?.name,
        quantity,
        total_amount: (groupData?.bulk_price || groupData?.price || 0) * quantity,
        delivery_method: deliveryMethod
      });
    }
    
    // Redirect to success page or show success message
    navigate('/payment/success', { 
      state: { 
        groupData,
        quantity,
        amount: (groupData?.bulk_price || groupData?.price || 0) * quantity
      } 
    });
  };

  const handlePaymentError = (error: string) => {
    if (groupId) {
      analyticsService.trackPaymentFailed(
        {
          tx_ref: paymentData?.txRef,
          amount: paymentData?.amount,
          group_id: groupId
        },
        error
      );
    }
    setError(`Payment failed: ${error}`);
  };

  // Error state - no group data
  if (!groupData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopNavigation userRole="trader" />
        <PageContainer>
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            leftIcon={<ArrowLeft className="h-4 w-4" />}
            className="mb-4"
          >
            Back
          </Button>
          <ErrorAlert
            title="Group not found"
            message="Group details are not available. Please go back to browse groups."
            variant="card"
          />
        </PageContainer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16 md:pb-0">
      <TopNavigation userRole="trader" />
      
      <PageContainer>
        {/* Back Button & Actions */}
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            leftIcon={<ArrowLeft className="h-4 w-4" />}
          >
            Back
          </Button>

          <div className="flex gap-2">
            {/* Wishlist Button */}
            <Button
              variant="outline"
              size="icon"
              onClick={toggleWishlist}
              className="relative"
            >
              <Heart 
                className={`h-5 w-5 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} 
              />
            </Button>

            {/* Share Button */}
            <div className="relative">
              <Button
                variant="outline"
                onClick={() => setShowShareMenu(!showShareMenu)}
                leftIcon={<Share2 className="h-4 w-4" />}
              >
                Share
              </Button>

              {/* Share Menu */}
              {showShareMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden">
                  <div className="py-1">
                    <button
                      onClick={() => handleShare('whatsapp')}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3"
                    >
                      <MessageCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">WhatsApp</span>
                    </button>
                    <button
                      onClick={() => handleShare('facebook')}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3"
                    >
                      <ExternalLink className="h-4 w-4 text-blue-600" />
                      <span className="text-sm">Facebook</span>
                    </button>
                    <button
                      onClick={() => handleShare('twitter')}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3"
                    >
                      <ExternalLink className="h-4 w-4 text-sky-500" />
                      <span className="text-sm">Twitter</span>
                    </button>
                    <button
                      onClick={() => handleShare('email')}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3"
                    >
                      <Mail className="h-4 w-4 text-gray-600" />
                      <span className="text-sm">Email</span>
                    </button>
                    <div className="border-t border-gray-100" />
                    <button
                      onClick={() => handleShare('copy')}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3"
                    >
                      <Copy className="h-4 w-4 text-gray-600" />
                      <span className="text-sm">
                        {copiedLink ? 'Link Copied!' : 'Copy Link'}
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <PageHeader
          title={productName}
          description={groupData.description || 'Group buying deal'}
          breadcrumbs={breadcrumbs}
        />

        {/* Under Review Notice - for groups that reached goal but not yet ready */}
        {groupData.status === 'active' && isGoalReached && (
          <Card variant="elevated" padding="lg" className="border-2 border-warning-300 bg-gradient-to-r from-warning-50 to-amber-50 mb-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="h-12 w-12 rounded-full bg-warning-100 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-warning-600" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Group Under Review
                </h3>
                <p className="text-gray-700 mb-3">
                  Great news! This group has reached its funding goal. The supplier is currently preparing your order for pickup. 
                  You'll be notified once it's ready for collection.
                </p>
                <div className="flex items-center gap-2 text-sm text-warning-700">
                  <CheckCircle className="h-4 w-4" />
                  <span className="font-medium">Goal Reached: 100% Funded</span>
                </div>
              </div>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Product Image */}
            <Card variant="elevated" className="overflow-hidden">
              <div 
                className={`relative bg-gray-100 flex items-center justify-center cursor-pointer transition-all ${
                  imageZoomed ? 'h-[600px]' : 'h-96'
                }`}
                onClick={() => setImageZoomed(!imageZoomed)}
              >
                {(groupData.product_image_url || groupData.image_url) && (
                  <img 
                    src={groupData.product_image_url || groupData.image_url} 
                    alt={productName} 
                    className={`h-full w-full transition-all ${
                      imageZoomed ? 'object-contain' : 'object-cover'
                    }`}
                  />
                )}

                {/* Status Badge */}
                <div className="absolute top-4 right-4 space-y-2">
                  {isGoalReached ? (
                    <Badge variant="success" size="lg" leftIcon={<CheckCircle className="h-4 w-4" />}>
                      Goal Reached!
                    </Badge>
                  ) : (
                    <Badge variant="info" size="lg">
                      ${amountNeeded.toFixed(2)} more needed
                    </Badge>
                  )}
                  
                  {timeRemaining && !isGoalReached && (
                    <Badge variant="warning" size="lg" leftIcon={<Clock className="h-4 w-4" />}>
                      {timeRemaining}
                    </Badge>
                  )}
                </div>

                {/* Click to zoom hint */}
                <div className="absolute bottom-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-xs">
                  {imageZoomed ? 'Click to minimize' : 'Click to expand'}
                </div>
              </div>
            </Card>

            {/* Description */}
            {groupData.description && (
              <Card variant="default" padding="lg">
                <h3 className="heading-5 mb-3 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary-600" />
                  About This Deal
                </h3>
                <p className="body text-gray-700 leading-relaxed mb-4">{groupData.description}</p>
                
                {/* Recommendation Explanation - Show only if coming from recommendations */}
                {source === 'dashboard' && groupData.reason && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Why We Recommended This</h4>
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg px-4 py-3 shadow-sm">
                      <p className="text-sm text-blue-900 leading-relaxed">
                        {groupData.reason}
                      </p>
                      {groupData.recommendation_score && (
                        <div className="mt-2 flex items-center gap-2">
                          <div className="flex-1 bg-blue-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all"
                              style={{ width: `${Math.round(groupData.recommendation_score * 100)}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium text-blue-700">
                            {Math.round(groupData.recommendation_score * 100)}% Match
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            )}

            {/* Supplier Information */}
            {(groupData.supplier_name || groupData.category) && (
              <Card variant="default" padding="lg">
                <h3 className="heading-5 mb-4 flex items-center gap-2">
                  <Store className="h-5 w-5 text-primary-600" />
                  Supplier Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {groupData.supplier_name && (
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                        <Store className="h-5 w-5 text-primary-600" />
                      </div>
                      <div>
                        <p className="body-sm text-gray-600">Supplier</p>
                        <p className="heading-6">{groupData.supplier_name}</p>
                      </div>
                    </div>
                  )}

                  {groupData.category && (
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-lg bg-info-100 flex items-center justify-center flex-shrink-0">
                        <Package className="h-5 w-5 text-info-600" />
                      </div>
                      <div>
                        <p className="body-sm text-gray-600">Category</p>
                        <p className="heading-6">{groupData.category}</p>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Group Details */}
            <Card variant="default" padding="lg">
              <h3 className="heading-5 mb-4">Group Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                    <Users className="h-5 w-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="body-sm text-gray-600">Participants</p>
                    <p className="heading-6">{groupData.participants_count || groupData.participants || 0} joined</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-success-100 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="h-5 w-5 text-success-600" />
                  </div>
                  <div>
                    <p className="body-sm text-gray-600">Target Goal</p>
                    <p className="heading-6">{groupData.moq} participants</p>
                  </div>
                </div>

                {groupData.delivery_location && (
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-info-100 flex items-center justify-center flex-shrink-0">
                      <MapPinIcon className="h-5 w-5 text-info-600" />
                    </div>
                    <div>
                      <p className="body-sm text-gray-600">Pickup Location</p>
                      <p className="heading-6">{groupData.delivery_location}</p>
                    </div>
                  </div>
                )}

                {groupData.created_at && (
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-warning-100 flex items-center justify-center flex-shrink-0">
                      <Calendar className="h-5 w-5 text-warning-600" />
                    </div>
                    <div>
                      <p className="body-sm text-gray-600">Created</p>
                      <p className="heading-6">{new Date(groupData.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Sidebar - Right Column */}
          <div className="space-y-6">
            {/* Ready for Pickup Section */}
            {groupData.status === 'ready_for_pickup' && (
              <>
                {!showQRCode ? (
                  <Card variant="elevated" padding="lg" className="border-2 border-success-400 bg-gradient-to-br from-success-50 to-emerald-50">
                    <div className="text-center space-y-4">
                      <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-success-100 mx-auto">
                        <CheckCircle className="h-8 w-8 text-success-600" />
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">Ready for Pickup!</h3>
                        <p className="text-sm text-gray-600">Your order is ready</p>
                      </div>

                      <Button
                        onClick={() => setShowQRCode(true)}
                        variant="success"
                        size="lg"
                        fullWidth
                      >
                        <Eye className="h-5 w-5 mr-2" />
                        View QR Code
                      </Button>
                    </div>
                  </Card>
                ) : (
                  <Card variant="elevated" padding="none" className="border-2 border-success-400 overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-success-500 to-emerald-500 px-4 py-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-5 w-5 text-white" />
                          <span className="font-semibold text-white">Ready for Pickup</span>
                        </div>
                        <Button
                          onClick={() => setShowQRCode(false)}
                          variant="ghost"
                          size="sm"
                          className="text-white hover:bg-white/20"
                        >
                          <EyeOff className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* QR Code */}
                    <div className="p-6 bg-white text-center">
                      <p className="text-xs font-medium text-gray-600 mb-3">Scan at Pickup</p>
                      <div className="bg-white p-4 rounded-xl inline-block border-4 border-success-200">
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(JSON.stringify({
                            orderId: `ORD-${groupId}-${Date.now()}`,
                            groupId: groupId,
                            productName: productName,
                            quantity: groupData.quantity || 1,
                            userId: currentUser?.id || 'guest',
                            status: 'active'
                          }))}`}
                          alt="Pickup QR Code"
                          className="w-48 h-48"
                        />
                      </div>
                    </div>

                    {/* Details */}
                    <div className="px-4 pb-4 space-y-3">
                      <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Location:</span>
                          <span className="font-medium text-gray-900 text-right">{groupData.delivery_location || 'See supplier'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Quantity:</span>
                          <span className="font-medium text-gray-900">{groupData.quantity || 1} unit(s)</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Amount Paid:</span>
                          <span className="font-bold text-success-600">${(groupData.total_paid || 0).toFixed(2)}</span>
                        </div>
                      </div>

                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <p className="text-xs text-amber-800">
                          <Shield className="h-3 w-3 inline mr-1" />
                          Present this QR code at pickup
                        </p>
                      </div>
                    </div>
                  </Card>
                )}
              </>
            )}

            {/* Completed Order Section */}
            {(groupData.status === 'completed' || groupData.status === 'delivered') && (
              <>
                {!showQRCode ? (
                  <Card variant="elevated" padding="lg" className="border-2 border-gray-300 bg-gradient-to-br from-gray-50 to-gray-100">
                    <div className="text-center space-y-4">
                      <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-gray-200 mx-auto">
                        <CheckCircle className="h-8 w-8 text-gray-500" />
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-bold text-gray-700 mb-1">Order Completed</h3>
                        <p className="text-sm text-gray-600">Successfully collected</p>
                      </div>

                      <Button
                        onClick={() => setShowQRCode(true)}
                        variant="outline"
                        size="lg"
                        fullWidth
                      >
                        <Eye className="h-5 w-5 mr-2" />
                        View Details
                      </Button>
                    </div>
                  </Card>
                ) : (
                  <Card variant="elevated" padding="none" className="border-2 border-gray-300 overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-gray-400 to-gray-500 px-4 py-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-5 w-5 text-white" />
                          <span className="font-semibold text-white">Order Completed</span>
                        </div>
                        <Button
                          onClick={() => setShowQRCode(false)}
                          variant="ghost"
                          size="sm"
                          className="text-white hover:bg-white/20"
                        >
                          <EyeOff className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Used QR Code */}
                    <div className="p-6 bg-white text-center">
                      <p className="text-xs font-medium text-gray-500 mb-3">QR Code - Used</p>
                      <div className="relative inline-block">
                        <div className="bg-white/50 p-4 rounded-xl border-4 border-gray-300">
                          <img 
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(JSON.stringify({
                              orderId: `ORD-${groupId}-USED`,
                              groupId: groupId,
                              productName: productName,
                              quantity: groupData.quantity || 1,
                              userId: currentUser?.id || 'guest',
                              status: 'used'
                            }))}`}
                            alt="Used QR Code"
                            className="w-48 h-48 opacity-30 grayscale"
                          />
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="bg-gray-800/90 text-white px-6 py-2 rounded-full transform rotate-12 shadow-xl border-2 border-white">
                            <p className="text-lg font-black tracking-wider">USED</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="px-4 pb-4 space-y-3">
                      <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Location:</span>
                          <span className="font-medium text-gray-700 text-right">{groupData.delivery_location || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Quantity:</span>
                          <span className="font-medium text-gray-700">{groupData.quantity || 1} unit(s)</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Amount Paid:</span>
                          <span className="font-bold text-gray-700">${(groupData.total_paid || 0).toFixed(2)}</span>
                        </div>
                      </div>

                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <p className="text-xs text-green-800">
                          <CheckCircle className="h-3 w-3 inline mr-1" />
                          Order successfully completed
                        </p>
                      </div>
                    </div>
                  </Card>
                )}
              </>
            )}

            {/* Pricing Card - Only show for active groups */}
            {groupData.status !== 'ready_for_pickup' && groupData.status !== 'completed' && groupData.status !== 'delivered' && (
              <Card variant="elevated" padding="lg" className="sticky top-24">
                {/* Show current participation if from my-groups */}
                {source === 'my-groups' && groupData.quantity && groupData.total_paid && (
                  <div className="mb-6 p-4 bg-primary-50 border-2 border-primary-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle className="h-5 w-5 text-primary-600" />
                      <h4 className="font-semibold text-primary-900">You're In This Group!</h4>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Current Quantity:</span>
                        <span className="font-semibold text-gray-900">{groupData.quantity} unit(s)</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Amount Paid:</span>
                        <span className="font-semibold text-success-600">${(groupData.total_paid || 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="text-center mb-4">
                  <p className="body-sm text-gray-600 mb-1">Group Price</p>
                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-4xl font-bold text-gray-900">
                      ${productPrice}
                    </span>
                    {originalPrice && originalPrice > productPrice && (
                      <span className="text-lg text-gray-500 line-through">
                        ${originalPrice}
                      </span>
                    )}
                  </div>
                  {/* Show discount percentage */}
                  {(groupData.discountPercentage || (originalPrice && originalPrice > productPrice)) && (
                    <Badge variant="success" className="mt-2">
                      Save {groupData.discountPercentage 
                        ? Math.round(groupData.discountPercentage) 
                        : Math.round((1 - productPrice / originalPrice) * 100)}%
                    </Badge>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="mb-6">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>${(groupData.current_amount || 0).toFixed(2)} raised</span>
                    <span>${(groupData.target_amount || 0).toFixed(2)} target</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div 
                      className={`h-3 rounded-full transition-all ${
                        isGoalReached ? 'bg-success-600' : 'bg-primary-600'
                      }`}
                      style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-600 mt-1 text-center">
                    {Math.round(progressPercentage)}% of target reached
                  </p>
                </div>

                {/* Join Form or Button */}
                {!showJoinForm ? (
                  <Button
                    onClick={() => setShowJoinForm(true)}
                    disabled={isGoalReached}
                    fullWidth
                    size="lg"
                    leftIcon={<Package className="h-5 w-5" />}
                  >
                    {(source === 'my-groups' || (groupData?.quantity && groupData.quantity > 0)) && !isGoalReached 
                      ? 'Add More Products' 
                      : isGoalReached 
                        ? 'Group Full' 
                        : 'Join This Group'}
                  </Button>
                ) : (
                  <div className="space-y-4">
                    {/* Calculate remaining capacity */}
                    {(() => {
                      const targetQty = groupData?.maxParticipants || groupData?.max_participants || groupData?.moq || 30;
                      const currentQty = groupData?.participants || groupData?.participants_count || 0;
                      const remainingCapacity = Math.max(0, targetQty - currentQty);
                      const maxAllowed = Math.min(remainingCapacity, 100);
                      
                      return (
                        <>
                          <Input
                            type="number"
                            label={(source === 'my-groups' || (groupData?.quantity && groupData.quantity > 0)) ? 'Additional Quantity' : 'Quantity'}
                            value={quantity}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 1;
                              setQuantity(Math.min(val, maxAllowed));
                            }}
                            min={1}
                            max={maxAllowed}
                            inputSize="lg"
                          />
                          {remainingCapacity < 100 && (
                            <p className="text-xs text-gray-500 -mt-2">
                              {remainingCapacity > 0 
                                ? `Only ${remainingCapacity} units remaining to reach target`
                                : 'Group target has been reached'}
                            </p>
                          )}
                        </>
                      );
                    })()}

                    <div>
                      <label className="block body-sm font-medium text-gray-700 mb-2">
                        Delivery Method
                      </label>
                      <div className="flex gap-2">
                        <Button
                          variant={deliveryMethod === 'pickup' ? 'default' : 'outline'}
                          onClick={() => setDeliveryMethod('pickup')}
                          fullWidth
                        >
                          Pickup
                        </Button>
                        <Button
                          variant={deliveryMethod === 'delivery' ? 'default' : 'outline'}
                          onClick={() => setDeliveryMethod('delivery')}
                          fullWidth
                        >
                          Delivery
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        id="terms"
                        checked={agreeToTerms}
                        onChange={(e) => setAgreeToTerms(e.target.checked)}
                        className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded cursor-pointer"
                      />
                      <label htmlFor="terms" className="body-sm text-gray-700 cursor-pointer">
                        I agree to the terms and conditions
                      </label>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-lg">
                      {source === 'my-groups' && groupData.total_paid && (
                        <div className="flex justify-between body-sm mb-2 text-gray-600">
                          <span>Previous Amount:</span>
                          <span>${(groupData.total_paid || 0).toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between body-sm mb-2">
                        <span>{source === 'my-groups' ? 'Additional Amount:' : 'Subtotal:'}</span>
                        <span className="font-medium">${(productPrice * quantity).toFixed(2)}</span>
                      </div>
                      {source === 'my-groups' && groupData.total_paid && (
                        <div className="flex justify-between heading-6 border-t pt-2 mt-2">
                          <span>New Total:</span>
                          <span className="text-success-600">${((groupData.total_paid || 0) + (productPrice * quantity)).toFixed(2)}</span>
                        </div>
                      )}
                      {source !== 'my-groups' && (
                        <div className="flex justify-between heading-6">
                          <span>Total:</span>
                          <span>${(productPrice * quantity).toFixed(2)}</span>
                        </div>
                      )}
                    </div>

                    {error && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="body-sm text-red-700">{error}</p>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowJoinForm(false);
                          setError(null);
                        }}
                        fullWidth
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleJoinGroup}
                        disabled={joiningGroup || !agreeToTerms}
                        fullWidth
                        leftIcon={joiningGroup ? <Spinner size="sm" color="white" /> : <Zap className="h-4 w-4" />}
                      >
                        {joiningGroup 
                          ? 'Processing...' 
                          : source === 'my-groups' 
                            ? 'Add to Order' 
                            : 'Proceed to Payment'}
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            )}

            {/* Safety Info */}
            <Card variant="filled" padding="lg">
              <h4 className="heading-6 mb-3 flex items-center gap-2">
                <Shield className="h-5 w-5 text-success-600" />
                Safe Group Buying
              </h4>
              <ul className="space-y-2 body-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-success-600 flex-shrink-0 mt-0.5" />
                  <span>Secure payment processing</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-success-600 flex-shrink-0 mt-0.5" />
                  <span>Full refund if goal not reached</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-success-600 flex-shrink-0 mt-0.5" />
                  <span>Verified suppliers only</span>
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </PageContainer>

      <MobileBottomNav userRole="trader" />

      {/* Payment Modal */}
      {showPaymentModal && paymentData && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          txRef={paymentData.txRef}
          amount={paymentData.amount}
          email={currentUser?.email || 'user@example.com'}
          description={`Group buy: ${productName} (Qty: ${quantity})`}
          paymentUrl={paymentData.paymentUrl}  // Pass the payment URL from backend
          onSuccess={handlePaymentSuccess}
          onError={handlePaymentError}
        />
      )}
    </div>
  );
}
