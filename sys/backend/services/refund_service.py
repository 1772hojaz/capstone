"""
Refund Service
Handles refund processing when suppliers reject orders or groups are cancelled
Integrates with Flutterwave for payment refunds
"""

import os
import requests
from datetime import datetime
from typing import Dict, List
from sqlalchemy.orm import Session

from models.models import GroupBuy, Contribution, User


class RefundService:
    """Service for processing refunds to traders"""
    
    FLUTTERWAVE_SECRET_KEY = os.getenv('FLUTTERWAVE_SECRET_KEY')
    FLUTTERWAVE_BASE_URL = "https://api.flutterwave.com/v3"
    
    @staticmethod
    def initiate_refund(transaction_id: str, amount: float) -> Dict:
        """
        Initiate a refund via Flutterwave
        
        Args:
            transaction_id: Original transaction ID from Flutterwave
            amount: Amount to refund
            
        Returns:
            Refund response from Flutterwave
        """
        if not RefundService.FLUTTERWAVE_SECRET_KEY:
            print("Warning: FLUTTERWAVE_SECRET_KEY not set. Refund simulation mode.")
            return {
                "status": "success",
                "message": "Refund initiated (simulation)",
                "data": {
                    "id": f"simulated_refund_{transaction_id}",
                    "status": "completed",
                    "amount": amount
                }
            }
        
        try:
            headers = {
                "Authorization": f"Bearer {RefundService.FLUTTERWAVE_SECRET_KEY}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "amount": amount
            }
            
            response = requests.post(
                f"{RefundService.FLUTTERWAVE_BASE_URL}/transactions/{transaction_id}/refund",
                json=payload,
                headers=headers,
                timeout=30
            )
            
            response.raise_for_status()
            return response.json()
            
        except Exception as e:
            print(f"Error initiating refund: {e}")
            return {
                "status": "error",
                "message": str(e)
            }
    
    @staticmethod
    def process_group_refunds(
        db: Session,
        group_buy_id: int,
        reason: str = "Supplier rejected order"
    ) -> Dict:
        """
        Process refunds for all contributions in a group
        
        Args:
            db: Database session
            group_buy_id: Group Buy ID to refund
            reason: Reason for refund
            
        Returns:
            Summary of refund processing
        """
        # Get all paid contributions for this group
        contributions = db.query(Contribution).filter(
            Contribution.group_buy_id == group_buy_id,
            Contribution.is_fully_paid == True,
            Contribution.refund_status.is_(None)  # Not already refunded
        ).all()
        
        if not contributions:
            return {
                "success": False,
                "message": "No paid contributions found for refund",
                "refunds_processed": 0
            }
        
        successful_refunds = []
        failed_refunds = []
        
        for contribution in contributions:
            try:
                # Mark refund as pending
                contribution.refund_status = "pending"
                db.commit()
                
                # In a real implementation, we would:
                # 1. Look up the original transaction ID from payment records
                # 2. Call Flutterwave refund API with that transaction ID
                # For now, we'll simulate the refund
                
                refund_amount = contribution.paid_amount
                
                # Simulate refund (in production, use actual transaction_id)
                refund_result = RefundService.initiate_refund(
                    transaction_id=f"txn_{contribution.id}",  # Placeholder
                    amount=refund_amount
                )
                
                if refund_result.get("status") == "success":
                    # Mark refund as completed
                    contribution.refund_status = "completed"
                    contribution.refunded_at = datetime.utcnow()
                    db.commit()
                    
                    successful_refunds.append({
                        "contribution_id": contribution.id,
                        "user_id": contribution.user_id,
                        "amount": refund_amount
                    })
                else:
                    # Mark refund as failed
                    contribution.refund_status = "failed"
                    db.commit()
                    
                    failed_refunds.append({
                        "contribution_id": contribution.id,
                        "user_id": contribution.user_id,
                        "amount": refund_amount,
                        "error": refund_result.get("message", "Unknown error")
                    })
                    
            except Exception as e:
                print(f"Error processing refund for contribution {contribution.id}: {e}")
                contribution.refund_status = "failed"
                db.commit()
                
                failed_refunds.append({
                    "contribution_id": contribution.id,
                    "user_id": contribution.user_id,
                    "amount": contribution.paid_amount,
                    "error": str(e)
                })
        
        # Update group buy status to cancelled if all refunds processed
        if len(failed_refunds) == 0:
            group_buy = db.query(GroupBuy).filter(GroupBuy.id == group_buy_id).first()
            if group_buy:
                group_buy.status = "cancelled"
                group_buy.supplier_status = "supplier_rejected"
                db.commit()
        
        return {
            "success": True,
            "message": f"Processed {len(successful_refunds)} refunds successfully",
            "refunds_processed": len(successful_refunds),
            "refunds_failed": len(failed_refunds),
            "successful_refunds": successful_refunds,
            "failed_refunds": failed_refunds,
            "reason": reason
        }
    
    @staticmethod
    def check_refund_status(db: Session, contribution_id: int) -> Dict:
        """
        Check refund status for a contribution
        
        Args:
            db: Database session
            contribution_id: Contribution ID
            
        Returns:
            Refund status information
        """
        contribution = db.query(Contribution).filter(
            Contribution.id == contribution_id
        ).first()
        
        if not contribution:
            return {
                "success": False,
                "message": "Contribution not found"
            }
        
        return {
            "success": True,
            "contribution_id": contribution.id,
            "refund_status": contribution.refund_status,
            "refunded_at": contribution.refunded_at.isoformat() if contribution.refunded_at else None,
            "refund_amount": contribution.paid_amount if contribution.refund_status else 0
        }
    
    @staticmethod
    def get_user_refunds(db: Session, user_id: int) -> List[Dict]:
        """
        Get all refunds for a user
        
        Args:
            db: Database session
            user_id: User ID
            
        Returns:
            List of refund records for the user
        """
        contributions = db.query(Contribution).filter(
            Contribution.user_id == user_id,
            Contribution.refund_status.isnot(None)
        ).all()
        
        refunds = []
        for contribution in contributions:
            group_buy = db.query(GroupBuy).filter(
                GroupBuy.id == contribution.group_buy_id
            ).first()
            
            refunds.append({
                "contribution_id": contribution.id,
                "group_buy_id": contribution.group_buy_id,
                "product_name": group_buy.product.name if group_buy and group_buy.product else "Unknown",
                "refund_amount": contribution.paid_amount,
                "refund_status": contribution.refund_status,
                "refunded_at": contribution.refunded_at.isoformat() if contribution.refunded_at else None
            })
        
        return refunds

