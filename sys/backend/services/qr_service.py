"""
QR Code Generation and Verification Service
Handles QR code generation for trader pickup and verification at collection point
"""

import qrcode
import secrets
import hashlib
import base64
from io import BytesIO
from datetime import datetime
from typing import Dict, Optional
from sqlalchemy.orm import Session

from models.models import GroupBuy, Contribution, User


class QRCodeService:
    """Service for generating and verifying QR codes for product pickup"""
    
    @staticmethod
    def generate_verification_token(user_id: int, group_buy_id: int, contribution_id: int) -> str:
        """
        Generate a secure verification token for QR code
        
        Args:
            user_id: User ID
            group_buy_id: Group Buy ID
            contribution_id: Contribution ID
            
        Returns:
            Secure verification token
        """
        # Create a unique secret for this QR code
        secret = secrets.token_urlsafe(32)
        
        # Create a hash of the IDs + secret for verification
        data = f"{user_id}:{group_buy_id}:{contribution_id}:{secret}"
        token_hash = hashlib.sha256(data.encode()).hexdigest()
        
        # Store the secret in a format that can be verified later
        # Format: base64(user_id:group_buy_id:contribution_id:token_hash)
        verification_data = f"{user_id}:{group_buy_id}:{contribution_id}:{token_hash}"
        token = base64.urlsafe_b64encode(verification_data.encode()).decode()
        
        return token
    
    @staticmethod
    def generate_qr_code_for_contribution(
        db: Session,
        contribution: Contribution,
        include_image: bool = True
    ) -> Dict[str, str]:
        """
        Generate QR code for a contribution
        
        Args:
            db: Database session
            contribution: Contribution object
            include_image: Whether to include base64 image in response
            
        Returns:
            Dictionary with QR code data and optionally image
        """
        # Generate verification token
        token = QRCodeService.generate_verification_token(
            contribution.user_id,
            contribution.group_buy_id,
            contribution.id
        )
        
        # Store token in contribution
        contribution.qr_code_token = token
        db.commit()
        
        # Create QR code data payload
        qr_data = {
            "type": "pickup",
            "token": token,
            "contribution_id": contribution.id,
            "group_buy_id": contribution.group_buy_id,
            "user_id": contribution.user_id,
            "quantity": contribution.quantity
        }
        
        result = {
            "token": token,
            "contribution_id": contribution.id,
            "group_buy_id": contribution.group_buy_id,
            "user_id": contribution.user_id
        }
        
        # Generate QR code image if requested
        if include_image:
            qr = qrcode.QRCode(
                version=1,
                error_correction=qrcode.constants.ERROR_CORRECT_H,
                box_size=10,
                border=4,
            )
            
            # Add token as QR data (simplified - in production, use full JSON)
            qr.add_data(token)
            qr.make(fit=True)
            
            # Create image
            img = qr.make_image(fill_color="black", back_color="white")
            
            # Convert to base64
            buffered = BytesIO()
            img.save(buffered, format="PNG")
            img_base64 = base64.b64encode(buffered.getvalue()).decode()
            
            result["qr_image"] = f"data:image/png;base64,{img_base64}"
        
        return result
    
    @staticmethod
    def generate_qr_codes_for_group(
        db: Session,
        group_buy_id: int,
        include_images: bool = False
    ) -> list:
        """
        Generate QR codes for all contributions in a group
        
        Args:
            db: Database session
            group_buy_id: Group Buy ID
            include_images: Whether to include base64 images
            
        Returns:
            List of QR code data for each contribution
        """
        # Get all contributions for the group
        contributions = db.query(Contribution).filter(
            Contribution.group_buy_id == group_buy_id,
            Contribution.is_fully_paid == True
        ).all()
        
        qr_codes = []
        for contribution in contributions:
            qr_data = QRCodeService.generate_qr_code_for_contribution(
                db, contribution, include_image=include_images
            )
            qr_codes.append(qr_data)
        
        return qr_codes
    
    @staticmethod
    def verify_qr_token(
        db: Session,
        token: str
    ) -> Optional[Dict]:
        """
        Verify a QR code token and return contribution details
        
        Args:
            db: Database session
            token: QR code token to verify
            
        Returns:
            Dictionary with contribution details if valid, None otherwise
        """
        try:
            # Decode token
            decoded = base64.urlsafe_b64decode(token.encode()).decode()
            parts = decoded.split(':')
            
            if len(parts) != 4:
                return None
            
            user_id, group_buy_id, contribution_id, token_hash = parts
            
            # Find contribution
            contribution = db.query(Contribution).filter(
                Contribution.id == int(contribution_id),
                Contribution.user_id == int(user_id),
                Contribution.group_buy_id == int(group_buy_id)
            ).first()
            
            if not contribution:
                return None
            
            # Verify token matches
            if contribution.qr_code_token != token:
                return None
            
            # Check if already collected
            if contribution.is_collected:
                return {
                    "valid": False,
                    "reason": "already_collected",
                    "collected_at": contribution.collected_at.isoformat() if contribution.collected_at else None
                }
            
            # Get user and group details
            user = db.query(User).filter(User.id == contribution.user_id).first()
            group_buy = db.query(GroupBuy).filter(GroupBuy.id == contribution.group_buy_id).first()
            
            return {
                "valid": True,
                "contribution_id": contribution.id,
                "user": {
                    "id": user.id,
                    "name": user.full_name or user.email,
                    "email": user.email
                },
                "group_buy": {
                    "id": group_buy.id,
                    "product_name": group_buy.product.name if group_buy.product else "Unknown"
                },
                "quantity": contribution.quantity,
                "contribution_amount": contribution.contribution_amount
            }
            
        except Exception as e:
            print(f"Error verifying QR token: {e}")
            return None
    
    @staticmethod
    def mark_as_collected(
        db: Session,
        token: str
    ) -> Dict:
        """
        Mark a contribution as collected after QR verification
        
        Args:
            db: Database session
            token: QR code token
            
        Returns:
            Success/failure dictionary
        """
        verification = QRCodeService.verify_qr_token(db, token)
        
        if not verification or not verification.get("valid"):
            return {
                "success": False,
                "message": "Invalid or already collected QR code"
            }
        
        # Mark as collected
        contribution = db.query(Contribution).filter(
            Contribution.id == verification["contribution_id"]
        ).first()
        
        contribution.is_collected = True
        contribution.collected_at = datetime.utcnow()
        db.commit()
        
        return {
            "success": True,
            "message": "Product marked as collected",
            "contribution_id": contribution.id,
            "collected_at": contribution.collected_at.isoformat()
        }

