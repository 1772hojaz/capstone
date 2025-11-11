import React from 'react';
import PaymentButton from './PaymentButton';
import PaymentModal from './PaymentModal';
import PaymentStatusChecker from './PaymentStatusChecker';

const PaymentDemo: React.FC = () => {
  const handlePaymentSuccess = (data: any) => {
    console.log('Payment successful:', data);
    alert('Payment completed successfully!');
  };

  const handlePaymentError = (error: string) => {
    console.error('Payment failed:', error);
    alert(`Payment failed: ${error}`);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
        Flutterwave Payment Integration Demo
      </h1>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Payment Button Demo */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Payment Button</h2>
          <p className="text-gray-600 mb-4">
            Simple payment button that opens Flutterwave checkout in a new tab.
          </p>
          <PaymentButton
            amount={100.00}
            currency="USD"
            txRef={`demo_${Date.now()}`}
            email="demo@example.com"
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
            className="w-full"
          />
        </div>

        {/* Payment Modal Demo */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Payment Modal</h2>
          <p className="text-gray-600 mb-4">
            Full-featured payment modal with fee calculation and status tracking.
          </p>
          <PaymentModal
            isOpen={false} // Set to true to show modal
            onClose={() => {}}
            amount={250.00}
            currency="USD"
            txRef={`modal_demo_${Date.now()}`}
            email="demo@example.com"
            description="Demo payment for group purchase"
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
          />
          <button
            onClick={() => alert('Set isOpen={true} to show modal')}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Show Payment Modal
          </button>
        </div>
      </div>

      {/* Payment Status Checker Demo */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Payment Status Checker</h2>
        <p className="text-gray-600 mb-4">
          Check the status of a payment transaction. Enter a transaction ID below.
        </p>
        <PaymentStatusChecker
          transactionId="123456789" // Replace with actual transaction ID
          onStatusUpdate={(status, data) => {
            console.log('Status update:', status, data);
          }}
          autoCheck={false}
        />
      </div>

      {/* Integration Notes */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-800 mb-3">Integration Notes</h3>
        <ul className="space-y-2 text-blue-700">
          <li>• Uses Flutterwave test environment with sandbox credentials</li>
          <li>• Supports USD currency for international payments</li>
          <li>• Automatically calculates transaction fees</li>
          <li>• Handles payment callbacks and status verification</li>
          <li>• Integrated with group purchase workflow in GroupDetail page</li>
        </ul>
      </div>

      {/* Test Card Details */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-yellow-800 mb-3">Test Payment Details</h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-medium text-yellow-800">Test Card:</p>
            <p className="text-yellow-700">5531 8866 5214 2950</p>
          </div>
          <div>
            <p className="font-medium text-yellow-800">CVV:</p>
            <p className="text-yellow-700">564</p>
          </div>
          <div>
            <p className="font-medium text-yellow-800">Expiry:</p>
            <p className="text-yellow-700">09/32</p>
          </div>
          <div>
            <p className="font-medium text-yellow-800">PIN:</p>
            <p className="text-yellow-700">3310</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentDemo;