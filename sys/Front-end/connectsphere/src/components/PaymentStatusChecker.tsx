import React, { useState, useEffect } from 'react';
import apiService from '../services/api';

interface PaymentStatusCheckerProps {
  transactionId: string;
  onStatusUpdate?: (status: string, data?: any) => void;
  autoCheck?: boolean;
  checkInterval?: number; // in milliseconds
}

const PaymentStatusChecker: React.FC<PaymentStatusCheckerProps> = ({
  transactionId,
  onStatusUpdate,
  autoCheck = false,
  checkInterval = 5000, // 5 seconds
}) => {
  const [status, setStatus] = useState<string>('unknown');
  const [isChecking, setIsChecking] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkPaymentStatus = async () => {
    if (!transactionId) return;

    setIsChecking(true);
    try {
      const response = await apiService.verifyPayment(transactionId);
      const paymentStatus = response.data?.status || 'unknown';

      setStatus(paymentStatus);
      setLastChecked(new Date());

      onStatusUpdate?.(paymentStatus, response.data);

      // Stop auto-checking if payment is completed or failed
      if (paymentStatus === 'successful' || paymentStatus === 'failed') {
        return false; // Stop interval
      }

      return true; // Continue checking
    } catch (error: any) {
      console.error('Payment status check failed:', error);
      setStatus('error');
      onStatusUpdate?.('error', { error: error.message });
      return false; // Stop on error
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    if (autoCheck && transactionId) {
      // Initial check
      checkPaymentStatus();

      // Set up interval for periodic checks
      const interval = setInterval(async () => {
        const shouldContinue = await checkPaymentStatus();
        if (!shouldContinue) {
          clearInterval(interval);
        }
      }, checkInterval);

      return () => clearInterval(interval);
    }
  }, [transactionId, autoCheck, checkInterval]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'successful':
        return 'text-green-600 bg-green-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'error':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'successful':
        return 'Success';
      case 'failed':
        return 'Failed';
      case 'pending':
        return 'Pending';
      case 'error':
        return 'Error';
      default:
        return '?';
    }
  };

  return (
    <div className="inline-flex items-center space-x-2">
      <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(status)}`}>
        <span className="mr-1">{getStatusIcon(status)}</span>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </div>

      {isChecking && (
        <div className="flex items-center text-sm text-gray-500">
          <div className="animate-spin rounded-full h-3 w-3 border-b border-gray-400 mr-1"></div>
          Checking...
        </div>
      )}

      {!autoCheck && (
        <button
          onClick={() => checkPaymentStatus()}
          disabled={isChecking}
          className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
        >
          {isChecking ? 'Checking...' : 'Check Status'}
        </button>
      )}

      {lastChecked && (
        <span className="text-xs text-gray-400">
          Last checked: {lastChecked.toLocaleTimeString()}
        </span>
      )}
    </div>
  );
};

export default PaymentStatusChecker;