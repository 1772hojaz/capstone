import React, { useState, useEffect } from 'react';
import apiService from '../services/api';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  currency?: string;
  txRef: string;
  email: string;
  description?: string;
  paymentUrl?: string;  // Payment URL from backend (if already initialized)
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  amount,
  currency = 'USD',
  txRef,
  email,
  description = 'Payment for group purchase',
  paymentUrl: initialPaymentUrl,  // Renamed to avoid conflict with state
  onSuccess,
  onError,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(initialPaymentUrl || null);
  const [fee, setFee] = useState<number | null>(null);
  const [totalAmount, setTotalAmount] = useState(amount);

  useEffect(() => {
    if (isOpen && amount) {
      calculateFee();
    }
  }, [isOpen, amount, currency]);

  const calculateFee = async () => {
    try {
      const feeResponse = await apiService.getTransactionFee(amount, currency);
      setFee(feeResponse.fee);
      setTotalAmount(amount + feeResponse.fee);
    } catch (error) {
      console.warn('Could not calculate fee:', error);
      setFee(0);
      setTotalAmount(amount);
    }
  };

  const handlePayment = async () => {
    setIsLoading(true);
    try {
      // If payment URL is already provided (from join_group), use it directly
      if (initialPaymentUrl) {
        setPaymentUrl(initialPaymentUrl);
        // Open payment link in new window/tab
        window.open(initialPaymentUrl, '_blank');
        onSuccess?.({ data: { link: initialPaymentUrl } });
        setIsLoading(false);
        return;
      }

      // Otherwise, initialize payment (fallback for other flows)
      const paymentData = {
        amount: totalAmount,
        currency,
        tx_ref: txRef,
        email,
      };

      const response = await apiService.initializePayment(paymentData);

      if (response.data?.link) {
        setPaymentUrl(response.data.link);
        // Open payment link in new window/tab
        window.open(response.data.link, '_blank');
        onSuccess?.(response);
      } else {
        throw new Error('No payment link received');
      }
    } catch (error: any) {
      console.error('Payment initialization failed:', error);
      onError?.(error.message || 'Payment initialization failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setPaymentUrl(null);
    setFee(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Complete Payment</h2>
          <button
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-700 mb-2">Payment Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Amount:</span>
                <span>{currency} {amount.toFixed(2)}</span>
              </div>
              {fee !== null && (
                <div className="flex justify-between">
                  <span>Transaction Fee:</span>
                  <span>{currency} {fee.toFixed(2)}</span>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between font-semibold">
                <span>Total:</span>
                <span>{currency} {totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="text-sm text-gray-600">
            <p className="mb-2"><strong>Description:</strong> {description}</p>
            <p><strong>Email:</strong> {email}</p>
            <p><strong>Reference:</strong> {txRef}</p>
          </div>

          {paymentUrl && (
            <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
              <p className="text-green-800 text-sm">
                Payment link opened in new tab. Complete your payment there.
              </p>
            </div>
          )}

          <div className="flex space-x-3">
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handlePayment}
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </div>
              ) : (
                `Pay ${currency} ${totalAmount.toFixed(2)}`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;