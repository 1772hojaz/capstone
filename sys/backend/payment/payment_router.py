from fastapi import APIRouter, HTTPException, Depends, status, Response
from fastapi.responses import RedirectResponse
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
    # Validate that the payment email matches the authenticated user's email
    if payment.email != current_user.email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment email must match authenticated user email"
        )
    
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

@router.get("/callback")
async def payment_callback(
    transaction_id: str,
    tx_ref: str,
    status: str
):
    """Handle Flutterwave payment callback (webhook)"""
    try:
        logger.info(f"Payment callback received: tx_ref={tx_ref}, transaction_id={transaction_id}, status={status}")

        # Verify the payment with Flutterwave
        verification = flutterwave_service.verify_payment(transaction_id)
        payment_status = verification.get("data", {}).get("status", "unknown")

        logger.info(f"Payment verification result: {payment_status}")

        # Redirect back to frontend with payment result
        frontend_url = "http://localhost:5173"  # Vite dev server default port

        if payment_status == "successful":
            # Redirect to success page with transaction details
            redirect_url = f"{frontend_url}/payment/success?tx_ref={tx_ref}&transaction_id={transaction_id}&status=success"
        else:
            # Redirect to failure page
            redirect_url = f"{frontend_url}/payment/failure?tx_ref={tx_ref}&transaction_id={transaction_id}&status={payment_status}"

        logger.info(f"Redirecting to: {redirect_url}")
        return RedirectResponse(url=redirect_url, status_code=302)

    except Exception as e:
        logger.error(f"Callback processing failed: {str(e)}")
        # On error, redirect to failure page
        frontend_url = "http://localhost:5173"
        redirect_url = f"{frontend_url}/payment/failure?tx_ref={tx_ref}&transaction_id={transaction_id}&status=error"
        return RedirectResponse(url=redirect_url, status_code=302)

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