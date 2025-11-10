import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';

const PaymentFailure = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  const txRef = searchParams.get('tx_ref');
  const transactionId = searchParams.get('transaction_id');
  const status = searchParams.get('status');

  // Check if this is a quantity increase payment
  const paymentData = location.state as {
    error?: string;
    action?: string;
  } | null;

  const isQuantityIncrease = paymentData?.action === 'quantity_increase';

  const handleRetry = () => {
    // Redirect back to the group detail page or all groups
    navigate('/all-groups');
  };

  const handleContactSupport = () => {
    // For now, just show an alert. In a real app, this would open a support chat or email
    alert('Please contact support at support@connectsphere.com for assistance.');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>

        <h2 className="text-xl font-semibold text-gray-800 mb-2">Payment Failed</h2>
        <p className="text-gray-600 mb-6">
          {paymentData?.error ||
            `Your ${isQuantityIncrease ? 'quantity increase' : 'group join'} payment could not be processed. Please try again or contact support if the issue persists.`
          }
        </p>

        <div className="space-y-3">
          <button
            onClick={handleRetry}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Try Again
          </button>

          <button
            onClick={handleContactSupport}
            className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
          >
            Contact Support
          </button>
        </div>

        {/* Transaction Details */}
        {(txRef || transactionId || status) && (
          <div className="mt-6 pt-4 border-t border-gray-200 text-left">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Transaction Details</h3>
            <div className="text-xs text-gray-500 space-y-1">
              {txRef && <p>Reference: {txRef}</p>}
              {transactionId && <p>Transaction ID: {transactionId}</p>}
              {status && <p>Status: {status}</p>}
              {isQuantityIncrease && <p>Type: Quantity Increase</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentFailure;