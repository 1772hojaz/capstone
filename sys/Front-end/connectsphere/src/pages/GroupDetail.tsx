import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, Users, Clock, MapPin as MapPinIcon, 
  Package, Calendar, TrendingUp, CheckCircle 
} from 'lucide-react';
import apiService from '../services/api';
import analyticsService from '../services/analytics';
import TopNavigation from '../components/navigation/TopNavigation';
import MobileBottomNav from '../components/navigation/MobileBottomNav';
import { PageContainer, PageHeader } from '../components/layout/index';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Spinner } from '../components/feedback/Spinner';
import { ErrorAlert } from '../components/feedback/ErrorAlert';
import PaymentModal from '../components/PaymentModal';

export default function GroupDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();

  // Data from navigation state
  const recommendation = location.state?.recommendation;
  const group = location.state?.group;
  const mode = location.state?.mode || 'view';
  const groupData = recommendation || group;

  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [joiningGroup, setJoiningGroup] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentTransactionId, setPaymentTransactionId] = useState<string | null>(null);

  // Form state
  const [quantity, setQuantity] = useState(1);
  const [deliveryMethod, setDeliveryMethod] = useState('pickup');
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  // Analytics: track group view
  useEffect(() => {
    if (groupData) {
      analyticsService.trackGroupView(groupData.group_buy_id || groupData.id, {
        ...groupData,
        source: location.state?.source || 'direct'
      });
    }
  }, [groupData, location.state?.source]);

  // Auto-show join form if mode is 'join'
  useEffect(() => {
    if (mode === 'join' && !isGoalReached) {
      setShowJoinForm(true);
    }
  }, [mode]);

  // Handle join group
  const handleJoinGroup = async () => {
    if (!agreeToTerms) {
      setError('You must agree to the terms and conditions');
      return;
    }

    try {
      setJoiningGroup(true);
      setError(null);

      const groupId = groupData.group_buy_id || groupData.id;
      const response = await apiService.joinGroup(groupId, {
        quantity,
        delivery_method: deliveryMethod
      });

      // Open payment modal
      if (response.payment_url) {
        setPaymentTransactionId(response.transaction_id);
        setShowPaymentModal(true);
      }

      // Track analytics
      analyticsService.trackJoinGroup(groupId, {
        quantity,
        price: groupData.bulk_price || groupData.price,
        total: (groupData.bulk_price || groupData.price) * quantity
      });

    } catch (err: any) {
      console.error('Failed to join group:', err);
      setError(err.response?.data?.detail || 'Failed to join group. Please try again.');
    } finally {
      setJoiningGroup(false);
    }
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

  const progressPercentage = groupData.moq && (groupData.participants_count || groupData.participants)
    ? ((groupData.participants_count || groupData.participants) / groupData.moq) * 100
    : 0;
  const isGoalReached = (groupData.participants_count || groupData.participants) >= groupData.moq;
  const participantsNeeded = groupData.moq - (groupData.participants_count || groupData.participants);

  return (
    <div className="min-h-screen bg-gray-50 pb-16 md:pb-0">
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

        <PageHeader
          title={groupData.product_name || groupData.name}
          description={groupData.description || 'Group buying deal'}
          breadcrumbs={[
            { label: 'Home', path: '/trader' },
            { label: 'Groups', path: '/all-groups' },
            { label: groupData.product_name || 'Details' }
          ]}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Product Image */}
            <Card variant="elevated">
              <div className="relative h-96 bg-gray-100 flex items-center justify-center">
                {groupData.product_image_url || groupData.image_url ? (
                  <img 
                    src={groupData.product_image_url || groupData.image_url} 
                    alt={groupData.product_name || groupData.name} 
                    className="h-full w-full object-cover" 
                  />
                ) : (
                  <span className="text-8xl text-gray-400">📦</span>
                )}

                {/* Status Badge */}
                <div className="absolute top-4 right-4">
                  {isGoalReached ? (
                    <Badge variant="success" size="lg" leftIcon={<CheckCircle className="h-4 w-4" />}>
                      Goal Reached!
                    </Badge>
                  ) : (
                    <Badge variant="info" size="lg">
                      {participantsNeeded} more needed
                    </Badge>
                  )}
                </div>
              </div>
            </Card>

            {/* Description */}
            {groupData.description && (
              <Card variant="default" padding="lg">
                <h3 className="heading-5 mb-3">About This Deal</h3>
                <p className="body text-gray-700">{groupData.description}</p>
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
                    <p className="heading-6">{groupData.participants_count || groupData.participants} joined</p>
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
            {/* Pricing Card */}
            <Card variant="elevated" padding="lg" className="sticky top-24">
              <div className="text-center mb-4">
                <p className="body-sm text-gray-600 mb-1">Group Price</p>
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-4xl font-bold text-gray-900">
                    ${groupData.bulk_price || groupData.price}
                  </span>
                  {(groupData.unit_price || groupData.original_price) && (
                    <span className="text-lg text-gray-500 line-through">
                      ${groupData.unit_price || groupData.original_price}
                    </span>
                  )}
                </div>
                {groupData.savings_factor && (
                  <Badge variant="success" className="mt-2">
                    Save {Math.round(groupData.savings_factor * 100)}%
                  </Badge>
                )}
              </div>

              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>{groupData.participants_count || groupData.participants} joined</span>
                  <span>{groupData.moq} needed</span>
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
                  {Math.round(progressPercentage)}% of goal reached
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
                  {isGoalReached ? 'Group Full' : 'Join This Group'}
                </Button>
              ) : (
                <div className="space-y-4">
                  <Input
                    type="number"
                    label="Quantity"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    min={1}
                    max={100}
                    inputSize="lg"
                  />

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
                      className="mt-1"
                    />
                    <label htmlFor="terms" className="body-sm text-gray-700">
                      I agree to the terms and conditions
                    </label>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between body-sm mb-2">
                      <span>Subtotal:</span>
                      <span className="font-medium">${((groupData.bulk_price || groupData.price) * quantity).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between heading-6">
                      <span>Total:</span>
                      <span>${((groupData.bulk_price || groupData.price) * quantity).toFixed(2)}</span>
                    </div>
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="body-sm text-red-700">{error}</p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowJoinForm(false)}
                      fullWidth
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleJoinGroup}
                      disabled={joiningGroup || !agreeToTerms}
                      fullWidth
                      leftIcon={joiningGroup ? <Spinner size="sm" color="white" /> : undefined}
                    >
                      {joiningGroup ? 'Processing...' : 'Proceed to Payment'}
                    </Button>
                  </div>
                </div>
              )}
            </Card>

            {/* Safety Info */}
            <Card variant="filled" padding="lg">
              <h4 className="heading-6 mb-3">Safe Group Buying</h4>
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
      {showPaymentModal && paymentTransactionId && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          transactionId={paymentTransactionId}
          amount={(groupData.bulk_price || groupData.price) * quantity}
        />
      )}
    </div>
  );
}
