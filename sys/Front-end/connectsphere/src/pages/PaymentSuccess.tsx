import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { CheckCircle2, ArrowRight, RefreshCw, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Spinner } from '../components/feedback/Spinner';
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

  const paymentData = location.state as {
    groupId?: number;
    groupName?: string;
    amount?: number;
    quantityIncrease?: number;
    action?: string;
  } | null;

  let finalPaymentData = paymentData;
  if (!finalPaymentData) {
    const storedData = sessionStorage.getItem('paymentSuccessData');
    if (storedData) {
      try {
        finalPaymentData = JSON.parse(storedData);
      } catch (e) {
        console.error('Failed to parse stored payment data:', e);
        sessionStorage.removeItem('paymentSuccessData');
      }
    }
  }

  const isQuantityIncreaseFromTxRef = txRef?.startsWith('quantity_increase_');
  const isQuantityIncreaseFromState = finalPaymentData?.action === 'quantity_increase';
  const isQuantityIncrease = isQuantityIncreaseFromTxRef || isQuantityIncreaseFromState;

  useEffect(() => {
    const pendingPayment = sessionStorage.getItem('pendingPaymentSuccess');
    if (pendingPayment) {
      try {
        const paymentData = JSON.parse(pendingPayment);
        sessionStorage.removeItem('pendingPaymentSuccess');
        window.history.replaceState(null, '', `/payment/success?tx_ref=${paymentData.txRef}&transaction_id=${paymentData.transactionId}&status=${paymentData.status}`);
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

      if (!apiService.isAuthenticated()) {
        sessionStorage.setItem('pendingPaymentSuccess', JSON.stringify({
          txRef, transactionId, status
        }));
        navigate('/login?returnUrl=' + encodeURIComponent(window.location.pathname + window.location.search));
        return;
      }

      try {
        const currentUser = await apiService.getCurrentUser();
        console.log('Current authenticated user:', currentUser.email);
      } catch (userError) {
        console.error('Failed to get current user:', userError);
        navigate('/login?returnUrl=' + encodeURIComponent(window.location.pathname + window.location.search));
        return;
      }

      try {
        if (isQuantityIncrease) {
          console.log('Processing quantity increase payment:', finalPaymentData);

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

          const groupIdMatch = txRef.match(/^quantity_increase_(\d+)_/);
          
          if (!groupIdMatch) {
            throw new Error('Invalid transaction reference format for quantity increase');
          }

          const groupId = parseInt(groupIdMatch[1]);
          const quantityIncrease = finalPaymentData?.quantityIncrease || 1;
          
          await apiService.updateGroupQuantity(groupId, {
            quantity_increase: quantityIncrease,
            payment_transaction_id: transactionId,
            payment_reference: txRef
          });

          setJoinStatus('success');
          sessionStorage.removeItem('paymentSuccessData');

        } else {
          // Parse group ID from tx_ref (format: admin_group_{id}_user_{id}_{uuid} or group_buy_{id}_user_{id}_{uuid})
          const groupIdMatch = txRef.match(/^(?:admin_group|group_buy)_(\d+)_/);
          if (!groupIdMatch) {
            throw new Error('Invalid transaction reference format');
          }

          const groupId = parseInt(groupIdMatch[1]);

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

          let stored: any = {};
          try {
            const storedData = localStorage.getItem('pendingGroupJoin');
            stored = storedData ? JSON.parse(storedData) : {};
          } catch (parseError) {
            console.error('Failed to parse localStorage data:', parseError);
          }

          const joinData = {
            quantity: stored.quantity || 1,
            delivery_method: stored.delivery_method || stored.deliveryMethod || 'pickup',
            payment_method: stored.payment_method || stored.paymentMethod || 'card',
            special_instructions: stored.special_instructions || stored.specialInstructions || null,
          };

          // NOTE: With the new 2-phase payment flow, the backend callback
          // already created the join record after payment confirmation.
          // We don't need to call joinGroup again here!
          
          // Just verify the payment was successful and mark as complete
          console.log('Payment successful - join already completed by callback');
          
          localStorage.removeItem('pendingGroupJoin');
          sessionStorage.removeItem('paymentSuccessData');

          setJoinStatus('success');
        }

      } catch (error: any) {
        console.error('Failed to complete payment:', error);

        const errorMessage = error.response?.data?.detail || error.message || '';

        if (errorMessage.includes('already joined') || errorMessage.includes('You have already joined')) {
          localStorage.removeItem('pendingGroupJoin');
          sessionStorage.removeItem('paymentSuccessData');
          setJoinStatus('success');
          return;
        }

        if (isQuantityIncrease) {
          if (errorMessage.includes('not found') || errorMessage.includes('No group found') ||
              errorMessage.includes('already updated') || errorMessage.includes('duplicate') ||
              error.response?.status === 404 || error.response?.status === 409) {
            setJoinStatus('success');
            sessionStorage.removeItem('paymentSuccessData');
            return;
          }
          
          setJoinStatus('success');
          sessionStorage.removeItem('paymentSuccessData');
          return;
        }

        if (errorMessage.includes('Unauthorized') || errorMessage.includes('401')) {
          sessionStorage.setItem('pendingPaymentSuccess', JSON.stringify({
            txRef, transactionId, status
          }));
          navigate('/login?returnUrl=' + encodeURIComponent(window.location.pathname + window.location.search));
          return;
        }

        if (errorMessage.includes('Group is full') || errorMessage.includes('no longer active')) {
          sessionStorage.removeItem('paymentSuccessData');
          setJoinStatus('success');
          return;
        }

        setJoinStatus('error');
      } finally {
        setIsProcessing(false);
      }
    };

    completePayment();
  }, [txRef, transactionId, status, isQuantityIncrease, finalPaymentData]);

  const handleContinue = () => {
    if (joinStatus === 'success') {
      navigate('/groups', { state: { refreshGroups: true } });
    } else {
      navigate('/all-groups');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center px-4 py-12">
      <Card className="max-w-lg w-full p-8 text-center">
        {isProcessing ? (
          <div className="space-y-4">
            <Spinner size="lg" className="mx-auto" />
            <h2 className="text-2xl font-bold text-gray-900">Processing Payment</h2>
            <p className="text-gray-600">
              Please wait while we complete your {isQuantityIncrease ? 'quantity update' : 'group join'}...
            </p>
            <Badge variant="info" className="mt-4">
              This may take a few moments
            </Badge>
          </div>
        ) : joinStatus === 'success' ? (
          <div className="space-y-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-12 h-12 text-green-600" />
            </div>
            
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Payment Successful!</h2>
              <p className="text-gray-600">
                {isQuantityIncrease
                  ? 'Your payment has been processed and your quantity commitment has been updated successfully.'
                  : "Your payment has been processed and you've successfully joined the group buy."
                }
              </p>
            </div>

            {finalPaymentData && (
              <Card variant="filled" className="p-4 text-left">
                <h3 className="font-semibold text-gray-900 mb-3">Order Summary</h3>
                <div className="space-y-2 text-sm">
                  {finalPaymentData.groupName && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Group:</span>
                      <span className="font-medium text-gray-900">{finalPaymentData.groupName}</span>
                    </div>
                  )}
                  {finalPaymentData.amount && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Amount Paid:</span>
                      <span className="font-bold text-green-600">${finalPaymentData.amount.toFixed(2)}</span>
                    </div>
                  )}
                  {isQuantityIncrease && finalPaymentData.quantityIncrease && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Quantity Increase:</span>
                      <span className="font-medium text-gray-900">+{finalPaymentData.quantityIncrease}</span>
                    </div>
                  )}
                </div>
              </Card>
            )}

            <Button onClick={handleContinue} className="w-full" size="lg">
              View My Groups
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-12 h-12 text-yellow-600" />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                {isQuantityIncrease ? 'Quantity Update Issue' : 'Join Processing Issue'}
              </h2>
              <p className="text-gray-600 mb-2">
                Your payment was successful, but we encountered an issue {isQuantityIncrease ? 'updating your quantity' : 'completing your group join'}.
              </p>
              <p className="text-sm text-gray-500">
                This sometimes happens due to temporary connectivity issues. Your payment has been processed and recorded.
              </p>
            </div>

            <div className="space-y-3">
              <Button onClick={() => window.location.reload()} className="w-full">
                <RefreshCw className="mr-2 h-5 w-5" />
                Try Again
              </Button>
              <Button onClick={handleContinue} variant="outline" className="w-full">
                Browse Groups
              </Button>
            </div>
          </div>
        )}

        {/* Transaction Details */}
        {(txRef || transactionId) && (
          <div className="mt-8 pt-6 border-t border-gray-200 text-left">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Transaction Details</h3>
            <div className="space-y-2 text-xs text-gray-600">
              {txRef && (
                <div className="flex justify-between">
                  <span>Reference:</span>
                  <span className="font-mono">{txRef.substring(0, 30)}...</span>
                </div>
              )}
              {transactionId && (
                <div className="flex justify-between">
                  <span>Transaction ID:</span>
                  <span className="font-mono">{transactionId.substring(0, 20)}...</span>
                </div>
              )}
              {status && (
                <div className="flex justify-between">
                  <span>Status:</span>
                  <Badge variant="success" size="sm">{status}</Badge>
                </div>
              )}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default PaymentSuccess;
