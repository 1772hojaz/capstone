import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { XCircle, RefreshCw, MessageCircle, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

const PaymentFailure = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  const txRef = searchParams.get('tx_ref');
  const transactionId = searchParams.get('transaction_id');
  const status = searchParams.get('status');

  const paymentData = location.state as {
    error?: string;
    action?: string;
    groupName?: string;
    amount?: number;
  } | null;

  const isQuantityIncrease = paymentData?.action === 'quantity_increase';

  const handleRetry = () => {
    navigate('/all-groups');
  };

  const handleContactSupport = () => {
    navigate('/contact');
  };

  const handleBackToHome = () => {
    navigate('/trader');
  };

  // Determine error message based on status or custom error
  const getErrorMessage = () => {
    if (paymentData?.error) {
      return paymentData.error;
    }

    switch (status) {
      case 'cancelled':
        return 'You cancelled the payment process. No charges were made to your account.';
      case 'failed':
        return 'The payment could not be processed. Please check your payment details and try again.';
      case 'declined':
        return 'Your payment was declined by your bank. Please try a different payment method.';
      default:
        return `Your ${isQuantityIncrease ? 'quantity increase' : 'group join'} payment could not be processed.`;
    }
  };

  const getRecommendedAction = () => {
    if (status === 'cancelled') {
      return 'You can try again when you\'re ready to complete the payment.';
    }
    if (status === 'declined') {
      return 'Please contact your bank or try a different payment method.';
    }
    return 'Please try again or contact our support team if the issue persists.';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center px-4 py-12">
      <Card className="max-w-lg w-full p-8">
        {/* Error Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
            <XCircle className="w-12 h-12 text-red-600" />
          </div>
        </div>

        {/* Error Message */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Payment {status === 'cancelled' ? 'Cancelled' : 'Failed'}</h2>
          <p className="text-gray-600 mb-2">
            {getErrorMessage()}
          </p>
          <p className="text-sm text-gray-500">
            {getRecommendedAction()}
          </p>
        </div>

        {/* Payment Details (if available) */}
        {paymentData && (paymentData.groupName || paymentData.amount) && (
          <Card variant="filled" className="p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-3 text-center">Order Details</h3>
            <div className="space-y-2 text-sm">
              {paymentData.groupName && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Group:</span>
                  <span className="font-medium text-gray-900">{paymentData.groupName}</span>
                </div>
              )}
              {paymentData.amount && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-medium text-gray-900">${paymentData.amount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Type:</span>
                <span className="font-medium text-gray-900">
                  {isQuantityIncrease ? 'Quantity Increase' : 'Group Join'}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                <span className="text-gray-600">Payment Status:</span>
                <Badge variant="destructive" size="sm">
                  {status === 'cancelled' ? 'Cancelled' : 'Failed'}
                </Badge>
              </div>
            </div>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {status !== 'cancelled' && (
            <Button onClick={handleRetry} className="w-full" size="lg">
              <RefreshCw className="mr-2 h-5 w-5" />
              Try Again
            </Button>
          )}
          
          <Button onClick={handleContactSupport} variant="outline" className="w-full">
            <MessageCircle className="mr-2 h-5 w-5" />
            Contact Support
          </Button>

          <Button onClick={handleBackToHome} variant="ghost" className="w-full">
            <ArrowLeft className="mr-2 h-5 w-5" />
            Back to Dashboard
          </Button>
        </div>

        {/* Transaction Details */}
        {(txRef || transactionId || status) && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Transaction Details</h3>
            <div className="space-y-2 text-xs text-gray-600">
              {txRef && (
                <div className="flex justify-between">
                  <span>Reference:</span>
                  <span className="font-mono text-right break-all">{txRef.substring(0, 30)}...</span>
                </div>
              )}
              {transactionId && (
                <div className="flex justify-between">
                  <span>Transaction ID:</span>
                  <span className="font-mono text-right break-all">{transactionId.substring(0, 20)}...</span>
                </div>
              )}
              {status && (
                <div className="flex justify-between items-center">
                  <span>Status:</span>
                  <Badge variant="destructive" size="sm">{status}</Badge>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Help Text */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Need help?</strong> Our support team is available 24/7 to assist you with any payment issues.
          </p>
        </div>
      </Card>
    </div>
  );
};

export default PaymentFailure;
