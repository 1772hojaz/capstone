import os
import requests
from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)

class FlutterwaveService:
    def __init__(self):
        # Load credentials from environment or file
        self.secret_key = os.getenv('FLUTTERWAVE_SECRET_KEY', 'FLWSECK_TEST-d55e0d7ae8a0e08b6d6078ba1f5094c2-X')
        self.encryption_key = os.getenv('FLUTTERWAVE_ENCRYPTION_KEY', 'FLWSECK_TEST4ff4b95e2452')
        self.public_key = os.getenv('FLUTTERWAVE_PUBLIC_KEY', 'FLWPUBK_TEST-9451b8a5c95b08dae2ae0366bd89a079-X')

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
                return result
        except requests.exceptions.RequestException as e:
            logger.error(f"Payment initialization failed: {str(e)}")
            raise

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

# Global instance
flutterwave_service = FlutterwaveService()