from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from typing import Optional
from payment.flutterwave_service import flutterwave_service
from authentication.auth import get_current_user
from models.models import User
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

class PaymentRequest(BaseModel):
    amount: float
    currency: str = "USD"
    email: str
    tx_ref: str
    redirect_url: Optional[str] = None

class PaymentVerification(BaseModel):
    transaction_id: str

@router.post("/initialize", response_model=dict)
async def initialize_payment(
    payment: PaymentRequest,
    current_user: User = Depends(get_current_user)
):
    """Initialize a payment transaction with Flutterwave"""
    try:
        response = flutterwave_service.initialize_payment(
            amount=payment.amount,
            email=payment.email,
            tx_ref=payment.tx_ref,
            currency=payment.currency,
            redirect_url=payment.redirect_url
        )
        return response
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Payment initialization failed: {str(e)}"
        )

@router.post("/verify", response_model=dict)
async def verify_payment(
    verification: PaymentVerification,
    current_user: User = Depends(get_current_user)
):
    """Verify a payment transaction"""
    try:
        response = flutterwave_service.verify_payment(verification.transaction_id)
        return response
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Payment verification failed: {str(e)}"
        )

@router.post("/callback", response_model=dict)
async def payment_callback(
    transaction_id: str,
    tx_ref: str,
    status: str
):
    """Handle Flutterwave payment callback"""
    try:
        # Verify the payment
        verification = flutterwave_service.verify_payment(transaction_id)
        
        # Here you would update your database with payment status
        # For example, mark an order as paid, update user balance, etc.
        
        return {
            "status": "success",
            "message": "Payment callback processed",
            "transaction_id": transaction_id,
            "tx_ref": tx_ref,
            "payment_status": verification.get("data", {}).get("status")
        }
    except Exception as e:
        logger.error(f"Callback processing failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Callback processing failed: {str(e)}"
        )

@router.get("/fee", response_model=dict)
async def get_transaction_fee(
    amount: float,
    currency: str = "USD",
    current_user: User = Depends(get_current_user)
):
    """Get transaction fee for a payment amount"""
    try:
        response = flutterwave_service.get_transaction_fee(amount, currency)
        return response
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Fee calculation failed: {str(e)}"
        )