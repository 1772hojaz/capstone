from fastapi import APIRouter, HTTPException, Depends, status, Response
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from payment.flutterwave_service import flutterwave_service
from authentication.auth import get_current_user
from models.models import User
from db.database import get_db
import logging
import os
from fastapi import Request
from db.redis_client import get_redis

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

async def confirm_pending_join(tx_ref: str, transaction_id: str, db: Session):
    """
    Confirm a pending join after successful payment.
    Creates the actual AdminGroupJoin or Contribution record.
    """
    from models.models import PendingJoin, AdminGroupJoin, AdminGroup, Contribution, GroupBuy, Transaction
    from sqlalchemy import func
    from datetime import datetime
    
    try:
        # Find pending join by tx_ref
        pending_join = db.query(PendingJoin).filter(
            PendingJoin.tx_ref == tx_ref,
            PendingJoin.payment_status == "pending"
        ).first()
        
        if not pending_join:
            logger.warning(f"No pending join found for tx_ref: {tx_ref}")
            return
        
        logger.info(f"Confirming pending join: user={pending_join.user_id}, group={pending_join.group_id}, type={pending_join.group_type}")
        
        if pending_join.group_type == "admin_group":
            # Handle AdminGroup join
            admin_group = db.query(AdminGroup).filter(AdminGroup.id == pending_join.group_id).first()
            
            if not admin_group:
                logger.error(f"AdminGroup {pending_join.group_id} not found")
                pending_join.payment_status = "failed"
                db.commit()
                return
            
            # Create the actual join record
            join_record = AdminGroupJoin(
                user_id=pending_join.user_id,
                admin_group_id=pending_join.group_id,
                quantity=pending_join.quantity,
                delivery_method=pending_join.delivery_method,
                payment_method=pending_join.payment_method,
                special_instructions=pending_join.special_instructions,
                payment_transaction_id=transaction_id,
                payment_reference=tx_ref,
                paid_amount=pending_join.payment_amount
            )
            db.add(join_record)
            
            # Update group participant count
            admin_group.participants += 1
            
            # Check if group should be completed
            total_quantity_sold = db.query(func.sum(AdminGroupJoin.quantity)).filter(
                AdminGroupJoin.admin_group_id == pending_join.group_id
            ).scalar() or 0
            
            if admin_group.max_participants and total_quantity_sold >= admin_group.max_participants:
                logger.info(f"AdminGroup {pending_join.group_id} reached target, marking as completed")
                admin_group.is_active = False
                admin_group.end_date = datetime.utcnow()
            
            # Create transaction record
            if admin_group.product_id:
                transaction = Transaction(
                    user_id=pending_join.user_id,
                    group_buy_id=None,
                    product_id=admin_group.product_id,
                    quantity=pending_join.quantity,
                    amount=pending_join.payment_amount,
                    transaction_type="payment",
                    location_zone="Unknown"
                )
                db.add(transaction)
        
        elif pending_join.group_type == "group_buy":
            # Handle GroupBuy join
            group_buy = db.query(GroupBuy).filter(GroupBuy.id == pending_join.group_id).first()
            
            if not group_buy:
                logger.error(f"GroupBuy {pending_join.group_id} not found")
                pending_join.payment_status = "failed"
                db.commit()
                return
            
            # Create the actual contribution record
            contribution = Contribution(
                user_id=pending_join.user_id,
                group_buy_id=pending_join.group_id,
                quantity=pending_join.quantity,
                contribution_amount=pending_join.payment_amount,
                paid_amount=pending_join.payment_amount,
                is_fully_paid=True,
                payment_transaction_id=transaction_id,
                payment_reference=tx_ref
            )
            db.add(contribution)
            
            # Update group totals
            group_buy.total_quantity += pending_join.quantity
            group_buy.total_contributions += pending_join.payment_amount
            group_buy.total_paid += pending_join.payment_amount
            group_buy.current_amount += pending_join.payment_amount
            
            if group_buy.target_amount > 0:
                group_buy.amount_progress = (group_buy.current_amount / group_buy.target_amount) * 100
            
            # Check if group should be completed
            if group_buy.amount_progress >= 100 and group_buy.status == "active":
                group_buy.status = "completed"
                group_buy.completed_at = datetime.utcnow()
            
            # Create transaction record
            transaction = Transaction(
                user_id=pending_join.user_id,
                group_buy_id=pending_join.group_id,
                product_id=group_buy.product_id,
                quantity=pending_join.quantity,
                amount=pending_join.payment_amount,
                transaction_type="payment",
                location_zone="Unknown"
            )
            db.add(transaction)
        
        # Mark pending join as completed
        pending_join.payment_status = "completed"
        pending_join.completed_at = datetime.utcnow()
        
        db.commit()
        logger.info(f"Successfully confirmed join for tx_ref: {tx_ref}")
        
    except Exception as e:
        logger.error(f"Failed to confirm pending join for tx_ref {tx_ref}: {e}")
        db.rollback()
        raise

@router.get("/callback")
async def payment_callback(
    transaction_id: str,
    tx_ref: str,
    status: str,
    db: Session = Depends(get_db)
):
    """Handle Flutterwave payment callback (webhook)"""
    try:
        logger.info(f"Payment callback received: tx_ref={tx_ref}, transaction_id={transaction_id}, status={status}")

        # Verify the payment with Flutterwave
        verification = flutterwave_service.verify_payment(transaction_id)
        payment_status = verification.get("data", {}).get("status", "unknown")

        logger.info(f"Payment verification result: {payment_status}")

        # Process the pending join if payment successful
        if payment_status == "successful":
            await confirm_pending_join(tx_ref, transaction_id, db)

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

@router.post("/webhook")
async def flutterwave_webhook(request: Request):
    """
    Flutterwave webhook handler with signature verification.
    Uses 'verif-hash' header that must match FLUTTERWAVE_WEBHOOK_HASH.
    Idempotent: stores tx_ref in Redis to avoid double-processing.
    """
    body = await request.json()
    verif_hash = request.headers.get("verif-hash") or request.headers.get("Verif-Hash")
    expected = os.getenv("FLUTTERWAVE_WEBHOOK_HASH") or os.getenv("FLUTTERWAVE_SECRET_KEY")
    if not expected or verif_hash != expected:
        logger.warning("Invalid webhook signature")
        return {"status": "ignored"}

    data = body.get("data", {})
    tx_ref = data.get("tx_ref") or body.get("txRef")
    transaction_id = str(data.get("id") or body.get("id") or "")
    status = data.get("status") or body.get("status") or "unknown"

    if not tx_ref:
        logger.warning("Webhook missing tx_ref")
        return {"status": "ignored"}

    r = get_redis()
    idem_key = f"payment:finalized:{tx_ref}"
    if r.get(idem_key):
        logger.info(f"Webhook duplicate for {tx_ref}, ignoring")
        return {"status": "ok", "idempotent": True}

    # Verify with Flutterwave for safety
    try:
        verify = flutterwave_service.verify_payment(transaction_id) if transaction_id else None
        if verify and verify.get("data", {}).get("status") == "successful":
            status = "success"
    except Exception as e:
        logger.warning(f"Verify on webhook failed: {e}")

    # Finalize server-side (idempotent)
    await finalize_payment_internal(tx_ref, transaction_id, status)
    r.setex(idem_key, 60 * 60 * 24, "1")  # 24h idempotency window
    return {"status": "ok"}

class FinalizeRequest(BaseModel):
    tx_ref: str
    transaction_id: Optional[str] = None
    status: str

@router.post("/finalize")
async def finalize_payment(payload: FinalizeRequest, current_user: User = Depends(get_current_user)):
    """
    Idempotent finalize endpoint to apply business effects for a paid transaction.
    Accepts tx_ref patterns:
      - group_{groupId}_... → treat as group join payment (if used)
      - quantity_increase_{groupId}_... → treat as quantity increase
    """
    await finalize_payment_internal(payload.tx_ref, payload.transaction_id or "", payload.status)
    return {"status": "ok"}

async def finalize_payment_internal(tx_ref: str, transaction_id: str, status: str):
    """
    Best-effort idempotent finalization:
    - For quantity_increase_{groupId}_*, increases contribution or join quantity.
    - For group_{groupId}_*, this can be extended to mark joins as paid.
    """
    from sqlalchemy.orm import Session
    from db.database import SessionLocal
    from models.models import Contribution, GroupBuy, AdminGroupJoin
    import re

    if status != "success" and status != "successful":
        logger.info(f"Finalize skipped for tx_ref={tx_ref} with status={status}")
        return

    m_inc = re.match(r"^quantity_increase_(\d+)_", tx_ref or "")
    m_join = re.match(r"^group_(\d+)_", tx_ref or "")
    db: Session = SessionLocal()
    try:
        if m_inc:
            group_id = int(m_inc.group(1))
            contrib = db.query(Contribution).filter(Contribution.group_buy_id == group_id).order_by(Contribution.joined_at.desc()).first()
            if contrib:
                # Mark as paid increment via existing API semantics: already handled on FE path,
                # here we just ensure the contribution is marked fully paid if desired.
                contrib.paid_amount = max(contrib.paid_amount or 0.0, contrib.contribution_amount or 0.0)
                contrib.is_fully_paid = True
                db.commit()
                logger.info(f"Quantity increase finalized for group {group_id}")
        elif m_join:
            group_id = int(m_join.group(1))
            # For admin join, mark as paid if a join exists
            join = db.query(AdminGroupJoin).filter(AdminGroupJoin.admin_group_id == group_id).order_by(AdminGroupJoin.joined_at.desc()).first()
            if join:
                # No explicit paid flags on join model; nothing to update persistently here
                logger.info(f"Join payment finalized for admin group {group_id}")
        else:
            logger.info(f"Finalize tx_ref pattern not recognized: {tx_ref}")
    finally:
        db.close()
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