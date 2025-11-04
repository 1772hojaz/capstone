import React, { useState } from 'react';
import apiService from '../services/api';

const PaymentButton = ({ amount, currency = 'USD', txRef, email, onSuccess, onError, className = '' }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState(null);

  const handlePayment = async () => {
    if (!amount || !txRef || !email) {
      onError?.('Missing required payment information');
      return;
    }

    setIsLoading(true);
    try {
      const paymentData = {
        amount: parseFloat(amount),
        currency,
        tx_ref: txRef,
        email,
      };

      const response = await apiService.initializePayment(paymentData);

      if (response.data?.link) {
        setPaymentUrl(response.data.link);
        // Open payment link in new window/tab
        window.open(response.data.link, '_blank');

        // You might want to poll for payment status here
        onSuccess?.(response);
      } else {
        throw new Error('No payment link received');
      }
    } catch (error) {
      console.error('Payment initialization failed:', error);
      onError?.(error.message || 'Payment initialization failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handlePayment}
      disabled={isLoading}
      className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {isLoading ? (
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          Processing...
        </div>
      ) : (
        `Pay ${currency} ${amount}`
      )}
    </button>
  );
};

export default PaymentButton;