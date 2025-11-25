import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import PaymentModal from '../components/PaymentModal';
import apiService from '../services/api';
import analyticsService from '../services/analytics';

export default function PaymentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  // Get payment details from navigation state
  const paymentData = location.state as {
    groupId: number;
    groupName: string;
    currentQuantity: number;
    newQuantity: number;
    price: string;
    originalPrice: string;
    action: string;
  };

  // Get user email from API
  useEffect(() => {
    const fetchUserEmail = async () => {
      try {
        const userData = await apiService.getCurrentUser();
        setUserEmail(userData.email || '');
      } catch (error) {
        console.error('Failed to fetch user data:', error);
        // Redirect to login if not authenticated
        navigate('/login');
      }
    };

    if (apiService.isAuthenticated()) {
      fetchUserEmail();
    } else {
      navigate('/login');
    }
  }, [navigate]);

  // Redirect if no payment data
  useEffect(() => {
    if (!paymentData) {
      navigate('/groups');
      return;
    }

    // Analytics: track opening of payment page
    const totalAmount = (() => {
      const increase = (paymentData?.newQuantity ?? 0) - (paymentData?.currentQuantity ?? 0);
      const unit = parseFloat((paymentData?.price || '0').replace('$', '')) || 0;
      return Math.max(0, increase * unit);
    })();
    analyticsService.trackPageView('payment_page', {
      action: paymentData?.action,
      amount: totalAmount,
      group_id: paymentData?.groupId
    });
  }, [paymentData, navigate]);

  if (!paymentData) {
    return null;
  }

  const quantityIncrease = paymentData.newQuantity - paymentData.currentQuantity;
  const additionalAmount = parseFloat(paymentData.price.replace('$', '')) * quantityIncrease;

  const handlePaymentSuccess = (data: any) => {
    console.log('Payment successful:', data);
    setShowPaymentModal(false);

    // Navigate to success page with payment details
    navigate('/payment-success', {
      state: {
        groupId: paymentData.groupId,
        groupName: paymentData.groupName,
        amount: additionalAmount,
        quantityIncrease: quantityIncrease,
        action: 'quantity_increase'
      }
    });
  };

  const handlePaymentError = (error: string) => {
    console.error('Payment failed:', error);
    setShowPaymentModal(false);

    // Navigate to failure page
    navigate('/payment-failure', {
      state: {
        error: error || 'Payment processing failed. Please try again.'
      }
    });
  };

  const handleProceedToPayment = () => {
    // Store payment data in sessionStorage for the success page
    const paymentSuccessData = {
      groupId: paymentData.groupId,
      groupName: paymentData.groupName,
      amount: additionalAmount,
      quantityIncrease: quantityIncrease,
      action: 'quantity_increase'
    };
    sessionStorage.setItem('paymentSuccessData', JSON.stringify(paymentSuccessData));

    // Analytics: track payment initiation
    analyticsService.trackPaymentInitiated({
      tx_ref: `quantity_increase_${paymentData.groupId}_${Date.now()}`,
      amount: additionalAmount,
      currency: 'USD',
      group_id: paymentData.groupId,
      action: 'quantity_increase',
      quantity: quantityIncrease
    });

    setShowPaymentModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="px-3 sm:px-6 py-4 flex items-center gap-4">
          <button
            onClick={() => navigate('/groups')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Groups
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-gray-900">Complete Payment</h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-3 sm:px-6 py-8">
        <div className="max-w-2xl mx-auto space-y-8">
          {/* Order Summary */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Order Summary</h2>

            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600">Group:</span>
                <span className="font-medium text-gray-900">{paymentData.groupName}</span>
              </div>

              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600">Current Quantity:</span>
                <span className="font-medium text-gray-900">{paymentData.currentQuantity}</span>
              </div>

              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600">New Quantity:</span>
                <span className="font-medium text-gray-900">{paymentData.newQuantity}</span>
              </div>

              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600">Quantity Increase:</span>
                <span className="font-medium text-green-600">+{quantityIncrease}</span>
              </div>

              <div className="flex justify-between items-center py-3 border-b border-gray-100">
                <span className="text-gray-600">Unit Price:</span>
                <span className="font-medium text-gray-900">{paymentData.price}</span>
              </div>

              <div className="flex justify-between items-center py-4 bg-gray-50 rounded-lg px-4">
                <span className="text-lg font-semibold text-gray-900">Total Amount:</span>
                <span className="text-2xl font-bold text-blue-600">${additionalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Payment Information</h2>

            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-blue-900 mb-1">Secure Payment</h3>
                    <p className="text-blue-800 text-sm">
                      Your payment will be processed securely through Flutterwave. You'll be redirected to complete your payment.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-semibold text-green-900 mb-1">Instant Update</h3>
                    <p className="text-green-800 text-sm">
                      Once payment is completed, your quantity commitment will be updated immediately.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Proceed to Payment Button */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <button
              onClick={handleProceedToPayment}
              className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg hover:bg-blue-700 transition-all font-semibold text-lg flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              Proceed to Payment
            </button>

            <p className="text-center text-sm text-gray-600 mt-4">
              You will be redirected to Flutterwave to complete your secure payment
            </p>
          </div>

          {/* Terms and Conditions */}
          <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
            <p className="mb-2">
              <strong>Payment Terms:</strong> By completing this payment, you agree to increase your quantity commitment
              for this group buy. The additional amount will be added to your total contribution.
            </p>
            <p>
              <strong>Refund Policy:</strong> Payments are non-refundable once the group buy process has begun.
              Contact support if you have any questions.
            </p>
          </div>
        </div>
      </main>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        amount={additionalAmount}
        currency="USD"
        txRef={`quantity_increase_${paymentData.groupId}_${Date.now()}`}
        email={userEmail}
        description={`Quantity increase: +${quantityIncrease} for ${paymentData.groupName}`}
        onSuccess={handlePaymentSuccess}
        onError={handlePaymentError}
      />
    </div>
  );
}