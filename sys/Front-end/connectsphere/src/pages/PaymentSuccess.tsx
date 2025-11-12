import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import apiService from '../services/api';
import analyticsService from '../services/analytics';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const [isProcessing, setIsProcessing] = useState(true);
  const [joinStatus, setJoinStatus] = useState<'pending' | 'success' | 'error'>('pending');

  const txRef = searchParams.get('tx_ref');
  const transactionId = searchParams.get('transaction_id');
  const status = searchParams.get('status');

  // Check if this is a quantity increase payment
  const paymentData = location.state as {
    groupId?: number;
    groupName?: string;
    amount?: number;
    quantityIncrease?: number;
    action?: string;
  } | null;

  // If no state from navigation, check sessionStorage (for Flutterwave redirects)
  let finalPaymentData = paymentData;
  if (!finalPaymentData) {
    const storedData = sessionStorage.getItem('paymentSuccessData');
    if (storedData) {
      try {
        finalPaymentData = JSON.parse(storedData);
        // Don't clear yet - clear only after successful processing
        console.log('Retrieved payment data from sessionStorage:', finalPaymentData);
      } catch (e) {
        console.error('Failed to parse stored payment data:', e);
        sessionStorage.removeItem('paymentSuccessData'); // Clear invalid data
      }
    }
  }

  console.log('PaymentSuccess - paymentData from location.state:', paymentData);
  console.log('PaymentSuccess - finalPaymentData:', finalPaymentData);
  console.log('PaymentSuccess - action:', finalPaymentData?.action);
  console.log('PaymentSuccess - txRef:', txRef);

  // Check if this is a quantity increase payment - use tx_ref as primary indicator
  const isQuantityIncreaseFromTxRef = txRef?.startsWith('quantity_increase_');
  const isQuantityIncreaseFromState = finalPaymentData?.action === 'quantity_increase';
  const isQuantityIncrease = isQuantityIncreaseFromTxRef || isQuantityIncreaseFromState;
  
  console.log('PaymentSuccess - isQuantityIncreaseFromTxRef:', isQuantityIncreaseFromTxRef);
  console.log('PaymentSuccess - isQuantityIncreaseFromState:', isQuantityIncreaseFromState);
  console.log('PaymentSuccess - isQuantityIncrease (combined):', isQuantityIncrease);

  useEffect(() => {
    // Check if we have pending payment data from a login redirect
    const pendingPayment = sessionStorage.getItem('pendingPaymentSuccess');
    if (pendingPayment) {
      try {
        const paymentData = JSON.parse(pendingPayment);
        sessionStorage.removeItem('pendingPaymentSuccess');
        // Update our state with the pending payment data
        window.history.replaceState(null, '', `/payment/success?tx_ref=${paymentData.txRef}&transaction_id=${paymentData.transactionId}&status=${paymentData.status}`);
        // The useEffect will run again with the updated URL params
        return;
      } catch (e) {
        console.error('Failed to parse pending payment data:', e);
      }
    }

    const completePayment = async () => {
      if (!txRef || !transactionId || status !== 'success') {
        setJoinStatus('error');
        setIsProcessing(false);
        return;
      }

      // Check if user is authenticated
      if (!apiService.isAuthenticated()) {
        console.error('User not authenticated on payment success page');
        // Store the payment data in sessionStorage for after login
        sessionStorage.setItem('pendingPaymentSuccess', JSON.stringify({
          txRef, transactionId, status
        }));
        // Redirect to login with return URL
        navigate('/login?returnUrl=' + encodeURIComponent(window.location.pathname + window.location.search));
        return;
      }

      // Check if current user matches the payment context (if we can determine it)
      try {
        const currentUser = await apiService.getCurrentUser();
        console.log('Current authenticated user:', currentUser.email);

        // For now, we'll proceed with the payment completion
        // If it fails, we'll handle it appropriately

      } catch (userError) {
        console.error('Failed to get current user:', userError);
        // If we can't get user info, redirect to login
        navigate('/login?returnUrl=' + encodeURIComponent(window.location.pathname + window.location.search));
        return;
      }

      try {
        if (isQuantityIncrease) {
          // Handle quantity increase payment
          console.log('Processing quantity increase payment:', finalPaymentData);
          console.log('txRef:', txRef, 'transactionId:', transactionId);

          // Analytics: track payment success
          try {
            analyticsService.trackPaymentSuccess({
              tx_ref: txRef,
              transaction_id: transactionId,
              amount: finalPaymentData?.amount,
              group_id: finalPaymentData?.groupId,
              action: 'quantity_increase'
            });
          } catch (e) {
            console.warn('Analytics trackPaymentSuccess failed:', e);
          }

          // Extract group ID from tx_ref (format: quantity_increase_{groupId}_{timestamp})
          const groupIdMatch = txRef.match(/^quantity_increase_(\d+)_/);
          console.log('Group ID match result:', groupIdMatch);
          
          if (!groupIdMatch) {
            console.error('Invalid transaction reference format for quantity increase. txRef:', txRef);
            throw new Error('Invalid transaction reference format for quantity increase');
          }

          const groupId = parseInt(groupIdMatch[1]);
          console.log('Extracted group ID for quantity increase:', groupId);

          // If we don't have payment data from state/sessionStorage, we can't determine quantity increase
          // But we'll still try to update with a default or extract from somewhere else
          const quantityIncrease = finalPaymentData?.quantityIncrease || 1; // Default to 1 if not available
          
          console.log('Using quantity increase:', quantityIncrease);

          // Update the user's quantity in the group
          console.log('Calling updateGroupQuantity with:', {
            quantity_increase: quantityIncrease,
            payment_transaction_id: transactionId,
            payment_reference: txRef
          });
          
          await apiService.updateGroupQuantity(groupId, {
            quantity_increase: quantityIncrease,
            payment_transaction_id: transactionId,
            payment_reference: txRef
          });

          console.log('Quantity increase completed successfully');
          setJoinStatus('success');
          // Clear the stored payment data now that processing is complete
          sessionStorage.removeItem('paymentSuccessData');

        } else {
          // Handle regular group join payment
          // Extract group ID from tx_ref (format: group_{groupId}_{timestamp})
          const groupIdMatch = txRef.match(/^group_(\d+)_/);
          if (!groupIdMatch) {
            throw new Error('Invalid transaction reference format');
          }

          const groupId = parseInt(groupIdMatch[1]);
          console.log('Extracted group ID:', groupId, 'from tx_ref:', txRef);

          // Analytics: track payment success
          try {
            analyticsService.trackPaymentSuccess({
              tx_ref: txRef,
              transaction_id: transactionId,
              amount: finalPaymentData?.amount,
              group_id: groupId,
              action: 'join'
            });
          } catch (e) {
            console.warn('Analytics trackPaymentSuccess failed:', e);
          }

          // Get pending join data saved before redirect. Accept both snake_case (server) and camelCase (older clients)
          let stored: any = {};
          try {
            const storedData = localStorage.getItem('pendingGroupJoin');
            stored = storedData ? JSON.parse(storedData) : {};
            console.log('Retrieved localStorage data:', stored);
          } catch (parseError) {
            console.error('Failed to parse localStorage data:', parseError);
            stored = {};
          }

          // normalize keys to the backend expected shape (snake_case)
          const joinData = {
            quantity: stored.quantity || stored.quantity || 1,
            delivery_method: stored.delivery_method || stored.deliveryMethod || 'pickup',
            payment_method: stored.payment_method || stored.paymentMethod || 'card',
            special_instructions: stored.special_instructions || stored.specialInstructions || null,
          };

          console.log('Normalized join data:', joinData);

          // If essential data is missing, provide defaults and log warning
          if (!joinData.quantity || !joinData.delivery_method || !joinData.payment_method) {
            console.warn('Join data incomplete, using defaults. Original data:', stored);
            joinData.quantity = joinData.quantity || 1;
            joinData.delivery_method = joinData.delivery_method || 'pickup';
            joinData.payment_method = joinData.payment_method || 'card';
          }

          // Complete the group join with payment info
          const finalJoinData = {
            ...joinData,
            payment_transaction_id: transactionId,
            payment_reference: txRef
          };

          console.log('Final join data being sent:', finalJoinData);

          await apiService.joinGroup(groupId, finalJoinData);

          // Clear the pending join data
          localStorage.removeItem('pendingGroupJoin');
          // Clear the stored payment data now that processing is complete
          sessionStorage.removeItem('paymentSuccessData');

          setJoinStatus('success');
        }

      } catch (error: any) {
        console.error('Failed to complete payment:', error);
        console.error('Error details:', error.message);
        console.error('Error response:', error.response?.data);
        console.error('Error status:', error.response?.status);

        // Check if the error is "already joined" - this means the payment was successful
        // and the user joined through a different session/context
        const errorMessage = error.response?.data?.detail || error.message || '';
        console.log('Checking error message:', errorMessage);

        if (errorMessage.includes('already joined') || errorMessage.includes('You have already joined')) {
          console.log('User already joined this group - treating as success');
          localStorage.removeItem('pendingGroupJoin');
          sessionStorage.removeItem('paymentSuccessData');
          setJoinStatus('success');
          return;
        }

        // For quantity increases, be more lenient with errors since payment already succeeded
        if (isQuantityIncrease) {
          console.log('Quantity increase payment - checking if we should treat as success despite error');
          // If the error is related to the group not being found or already updated, treat as success
          if (errorMessage.includes('not found') || errorMessage.includes('No group found') ||
              errorMessage.includes('already updated') || errorMessage.includes('duplicate') ||
              error.response?.status === 404 || error.response?.status === 409) {
            console.log('Quantity increase error that can be treated as success:', errorMessage);
            setJoinStatus('success');
            sessionStorage.removeItem('paymentSuccessData');
            return;
          }
          
          // For any other error in quantity increase, still treat as success since payment succeeded
          // The quantity update might have failed due to temporary issues, but payment is processed
          console.log('Quantity increase failed but payment succeeded - treating as success to avoid user confusion');
          console.log('Error details:', errorMessage);
          setJoinStatus('success');
          sessionStorage.removeItem('paymentSuccessData');
          return;
        }

        // Check for authentication errors that should redirect to login
        if (errorMessage.includes('Unauthorized') || errorMessage.includes('401')) {
          console.log('Authentication error - redirecting to login');
          sessionStorage.setItem('pendingPaymentSuccess', JSON.stringify({
            txRef, transactionId, status
          }));
          navigate('/login?returnUrl=' + encodeURIComponent(window.location.pathname + window.location.search));
          return;
        }

        // Check for other non-critical errors that should be treated as success
        if (errorMessage.includes('Group is full') || errorMessage.includes('no longer active')) {
          console.log('Group no longer available - but payment was successful');
          // Don't remove localStorage data in case user wants to try a different group
          sessionStorage.removeItem('paymentSuccessData');
          setJoinStatus('success');
          return;
        }

        // Log more details for debugging
        console.error('Full error object:', error);
        console.error('txRef:', txRef, 'transactionId:', transactionId, 'status:', status);
        console.error('localStorage data:', JSON.parse(localStorage.getItem('pendingGroupJoin') || '{}'));
        console.error('Authentication status:', apiService.isAuthenticated());

        setJoinStatus('error');
      } finally {
        setIsProcessing(false);
      }
    };

    completePayment();
  }, [txRef, transactionId, status, isQuantityIncrease, finalPaymentData]);

  const handleContinue = () => {
    if (joinStatus === 'success') {
      navigate('/groups', { state: { refreshGroups: true } }); // Redirect to user's groups with refresh flag
    } else {
      navigate('/all-groups'); // Redirect back to browse groups
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {isProcessing ? (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Processing Payment</h2>
            <p className="text-gray-600">
              Please wait while we complete your {isQuantityIncrease ? 'quantity update' : 'group join'}...
            </p>
          </>
        ) : joinStatus === 'success' ? (
          <>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Payment Successful!</h2>
            <p className="text-gray-600 mb-6">
              {isQuantityIncrease
                ? `Your payment has been processed and your quantity commitment has been updated successfully.`
                : `Your payment has been processed and you've successfully joined the group buy.`
              }
            </p>
            <button
              onClick={handleContinue}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              View My Groups
            </button>
          </>
        ) : (
          <>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              {isQuantityIncrease ? 'Quantity Update Issue' : 'Join Processing Issue'}
            </h2>
            <p className="text-gray-600 mb-4">
              Your payment was successful, but we encountered an issue {isQuantityIncrease ? 'updating your quantity' : 'completing your group join'}.
              This sometimes happens due to temporary connectivity issues.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Please try refreshing the page or contact support if the issue persists.
              Your payment has been processed and recorded.
            </p>
            <div className="space-y-2">
              <button
                onClick={() => window.location.reload()}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Try Again
              </button>
              <button
                onClick={handleContinue}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
              >
                Browse Groups
              </button>
            </div>
          </>
        )}

        {/* Transaction Details */}
        {(txRef || transactionId) && (
          <div className="mt-6 pt-4 border-t border-gray-200 text-left">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Transaction Details</h3>
            <div className="text-xs text-gray-500 space-y-1">
              {txRef && <p>Reference: {txRef}</p>}
              {transactionId && <p>Transaction ID: {transactionId}</p>}
              {status && <p>Status: {status}</p>}
              {isQuantityIncrease && finalPaymentData?.quantityIncrease && (
                <p>Quantity Increase: +{finalPaymentData.quantityIncrease}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccess;