import os
import requests
from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)

class FlutterwaveService:
    def __init__(self):
        # Load credentials from environment or use production defaults
        # PUBLIC KEY = Client ID
        self.public_key = os.getenv('FLUTTERWAVE_PUBLIC_KEY', '12a8c4c6-9bc6-4f80-9ea9-5a26842f2d53')
        # SECRET KEY = Client Secret
        self.secret_key = os.getenv('FLUTTERWAVE_SECRET_KEY', '6nCZym5JnoZBhmYBFhMve34qcNiIkpou')
        # ENCRYPTION KEY
        self.encryption_key = os.getenv('FLUTTERWAVE_ENCRYPTION_KEY', 'd5A347B9ixcJpAd6j7KCVSNKnGNNwdP1rKZLPJqp08o=')

        self.base_url = "https://api.flutterwave.com/v3"
        self.headers = {
            "Authorization": f"Bearer {self.secret_key}",
            "Content-Type": "application/json"
        }

    def initialize_payment(self, amount: float, email: str, tx_ref: str, currency: str = "USD", redirect_url: str = None) -> Dict[str, Any]:
        """Initialize a payment transaction"""
        try:
            payload = {
                "tx_ref": tx_ref,
                "amount": str(amount),
                "currency": currency,
                "redirect_url": redirect_url or "http://localhost:8000/api/payment/callback",
                "payment_options": "card,mobilemoney,ussd",
                "customer": {
                    "email": email,
                },
                "customizations": {
                    "title": "Mbare Payment",
                    "description": "Payment for products",
                }
            }

            response = requests.post(
                f"{self.base_url}/payments",
                json=payload,
                headers=self.headers
            )

            # Try to parse response body, log useful details and return payload to caller
            try:
                result = response.json()
            except ValueError:
                result = {"message": response.text}

            if response.ok:
                logger.info(f"Payment initialized: {result}")
                return result
            else:
                # Log full response for easier debugging (includes errors like DCC Rate messages)
                logger.error(f"Payment initialization returned error: status={response.status_code}, body={result}")
                
                # Return a properly formatted error response
                return {
                    "status": "error",
                    "message": result.get("message", "Payment initialization failed"),
                    "data": None,
                    "error_details": result
                }
        except requests.exceptions.RequestException as e:
            logger.error(f"Payment initialization failed: {str(e)}")
            return {
                "status": "error",
                "message": f"Network error: {str(e)}",
                "data": None
            }

    def verify_payment(self, transaction_id: str) -> Dict[str, Any]:
        """Verify a payment transaction"""
        try:
            response = requests.get(
                f"{self.base_url}/transactions/{transaction_id}/verify",
                headers=self.headers
            )
            response.raise_for_status()
            result = response.json()
            logger.info(f"Payment verified: {result}")
            return result
        except requests.exceptions.RequestException as e:
            logger.error(f"Payment verification failed: {str(e)}")
            raise

    def get_transaction_fee(self, amount: float, currency: str = "USD") -> Dict[str, Any]:
        """Get transaction fee for a payment"""
        try:
            # Note: Flutterwave doesn't have a direct fee endpoint, this is approximate
            # In production, you'd calculate based on their fee structure
            fee = amount * 0.015  # 1.5% fee approximation
            return {
                "fee": fee,
                "currency": currency,
                "note": "Approximate fee calculation"
            }
        except Exception as e:
            logger.error(f"Fee calculation failed: {str(e)}")
            raise
    
    def initiate_transfer(
        self, 
        account_bank: str,
        account_number: str,
        amount: float,
        narration: str,
        currency: str = "USD",
        beneficiary_name: str = None
    ) -> Dict[str, Any]:
        """
        Initiate a bank transfer (payout) to supplier
        
        Args:
            account_bank: Bank code (e.g., "044" for Access Bank in Nigeria)
            account_number: Supplier's bank account number
            amount: Amount to transfer
            narration: Description of the transfer
            currency: Currency code (default: USD)
            beneficiary_name: Optional beneficiary name
            
        Returns:
            Transfer response from Flutterwave
        """
        # Check if running in simulation mode
        if self.secret_key.startswith('FLWSECK_TEST'):
            logger.warning("Running in TEST mode - simulating transfer")
            return {
                "status": "success",
                "message": "Transfer initiated (simulation)",
                "data": {
                    "id": f"simulated_transfer_{account_number}",
                    "account_number": account_number,
                    "bank_code": account_bank,
                    "amount": amount,
                    "currency": currency,
                    "status": "successful",
                    "reference": f"TRF-{account_number}-SIM"
                }
            }
        
        try:
            payload = {
                "account_bank": account_bank,
                "account_number": account_number,
                "amount": amount,
                "narration": narration,
                "currency": currency,
                "callback_url": "http://localhost:8000/api/payment/transfer-callback"
            }
            
            if beneficiary_name:
                payload["beneficiary_name"] = beneficiary_name
            
            response = requests.post(
                f"{self.base_url}/transfers",
                json=payload,
                headers=self.headers,
                timeout=30
            )
            
            result = response.json()
            
            if response.ok:
                logger.info(f"Transfer initiated: {result}")
                return result
            else:
                logger.error(f"Transfer failed: status={response.status_code}, body={result}")
                return result
                
        except requests.exceptions.RequestException as e:
            logger.error(f"Transfer request failed: {str(e)}")
            return {
                "status": "error",
                "message": str(e)
            }
    
    def verify_transfer(self, transfer_id: str) -> Dict[str, Any]:
        """
        Verify a transfer transaction
        
        Args:
            transfer_id: Transfer ID returned from initiate_transfer
            
        Returns:
            Transfer status from Flutterwave
        """
        if self.secret_key.startswith('FLWSECK_TEST'):
            logger.warning("Running in TEST mode - simulating transfer verification")
            return {
                "status": "success",
                "message": "Transfer verified (simulation)",
                "data": {
                    "id": transfer_id,
                    "status": "successful"
                }
            }
        
        try:
            response = requests.get(
                f"{self.base_url}/transfers/{transfer_id}",
                headers=self.headers,
                timeout=30
            )
            
            result = response.json()
            
            if response.ok:
                logger.info(f"Transfer verified: {result}")
                return result
            else:
                logger.error(f"Transfer verification failed: {result}")
                return result
                
        except requests.exceptions.RequestException as e:
            logger.error(f"Transfer verification failed: {str(e)}")
            return {
                "status": "error",
                "message": str(e)
            }

# Global instance
flutterwave_service = FlutterwaveService()