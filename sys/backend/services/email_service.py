"""
Email Service - Resend Integration
Handles sending email notifications to users via Resend API
"""

import os
import requests
from typing import List, Dict, Optional
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class EmailService:
    """Service for sending email notifications via Resend"""
    
    def __init__(self):
        """Initialize email service with Resend API key"""
        self.api_key = os.getenv('RESEND_API_KEY', '')
        self.from_email = os.getenv('FROM_EMAIL', 'noreply@connectafrica.store')
        self.from_name = os.getenv('FROM_NAME', 'ConnectAfrica')
        self.api_url = "https://api.resend.com/emails"
        
        # Test mode - if no API key, run in simulation mode
        self.simulation_mode = not self.api_key
        
        if self.simulation_mode:
            logger.warning("Email service running in SIMULATION MODE (no RESEND_API_KEY)")
        else:
            logger.info(f"Email service initialized with Resend (from: {self.from_email})")
    
    def send_email(
        self, 
        to_email: str, 
        subject: str, 
        body_html: str, 
        body_text: Optional[str] = None
    ) -> Dict:
        """
        Send a single email via Resend API
        
        Args:
            to_email: Recipient email address
            subject: Email subject line
            body_html: HTML email body
            body_text: Plain text email body (fallback)
            
        Returns:
            Dict with status and message
        """
        if self.simulation_mode:
            logger.info(f"[SIMULATION] Email to {to_email}: {subject}")
            logger.info(f"[SIMULATION] Body preview: {body_html[:100]}...")
            return {
                "status": "simulated",
                "message": "Email sent in simulation mode",
                "to": to_email,
                "subject": subject
            }
        
        try:
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "from": f"{self.from_name} <{self.from_email}>",
                "to": [to_email],
                "subject": subject,
                "html": body_html
            }
            
            # Add plain text if provided
            if body_text:
                payload["text"] = body_text
            
            response = requests.post(self.api_url, headers=headers, json=payload)
            
            if response.status_code == 200:
                result = response.json()
                logger.info(f"Email sent successfully to {to_email}, ID: {result.get('id')}")
                return {
                    "status": "sent",
                    "message": "Email sent successfully",
                    "to": to_email,
                    "subject": subject,
                    "id": result.get('id')
                }
            else:
                error_msg = response.json().get('message', response.text)
                logger.error(f"Failed to send email to {to_email}: {error_msg}")
                return {
                    "status": "failed",
                    "message": error_msg,
                    "to": to_email,
                    "subject": subject
                }
            
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {e}")
            return {
                "status": "failed",
                "message": str(e),
                "to": to_email,
                "subject": subject
            }
    
    def send_group_deletion_notification(
        self, 
        user_email: str, 
        user_name: str,
        group_name: str,
        group_id: int,
        refund_amount: float,
        refund_status: str
    ) -> Dict:
        """
        Send notification when a group is deleted by admin
        """
        subject = f"Group Buy Cancelled - {group_name}"
        
        body_html = f"""
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: #f44336; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
                .content {{ padding: 20px; background-color: #f9f9f9; }}
                .info-box {{ background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #2196F3; border-radius: 4px; }}
                .footer {{ padding: 20px; text-align: center; font-size: 12px; color: #666; }}
                .button {{ background-color: #2196F3; color: white; padding: 10px 20px; text-decoration: none; display: inline-block; margin: 10px 0; border-radius: 4px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Group Buy Cancelled</h1>
                </div>
                <div class="content">
                    <p>Dear {user_name},</p>
                    
                    <p>We regret to inform you that the following group buy has been cancelled:</p>
                    
                    <div class="info-box">
                        <strong>Group:</strong> {group_name}<br>
                        <strong>Group ID:</strong> #{group_id}<br>
                        <strong>Refund Amount:</strong> ${refund_amount:.2f}<br>
                        <strong>Refund Status:</strong> {refund_status.upper()}
                    </div>
                    
                    <p>Your refund has been processed automatically. Please allow 3-5 business days for the funds to appear in your account.</p>
                    
                    <p>If you have any questions, please contact our support team.</p>
                    
                    <a href="http://connectafrica.store/contact" class="button">Contact Support</a>
                </div>
                <div class="footer">
                    <p>This is an automated message from ConnectAfrica.</p>
                    <p>&copy; 2024 ConnectAfrica. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        body_text = f"""
Group Buy Cancelled

Dear {user_name},

We regret to inform you that the following group buy has been cancelled:

Group: {group_name}
Group ID: #{group_id}
Refund Amount: ${refund_amount:.2f}
Refund Status: {refund_status.upper()}

Your refund has been processed automatically. Please allow 3-5 business days for the funds to appear in your account.

If you have any questions, please contact our support team.

This is an automated message from ConnectAfrica.
        """
        
        return self.send_email(user_email, subject, body_html, body_text)
    
    def send_refund_confirmation(
        self, 
        user_email: str, 
        user_name: str,
        refund_amount: float,
        refund_reference: str,
        reason: str = "Supplier rejected order"
    ) -> Dict:
        """
        Send confirmation when a refund is processed
        """
        subject = f"Refund Processed - ${refund_amount:.2f}"
        
        body_html = f"""
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
                .content {{ padding: 20px; background-color: #f9f9f9; }}
                .info-box {{ background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #4CAF50; border-radius: 4px; }}
                .footer {{ padding: 20px; text-align: center; font-size: 12px; color: #666; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>✓ Refund Processed</h1>
                </div>
                <div class="content">
                    <p>Dear {user_name},</p>
                    
                    <p>Your refund has been successfully processed:</p>
                    
                    <div class="info-box">
                        <strong>Refund Amount:</strong> ${refund_amount:.2f}<br>
                        <strong>Reference:</strong> {refund_reference}<br>
                        <strong>Reason:</strong> {reason}<br>
                        <strong>Date:</strong> {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}
                    </div>
                    
                    <p>The funds should appear in your original payment method within 3-5 business days.</p>
                    
                    <p>Thank you for your patience and understanding.</p>
                </div>
                <div class="footer">
                    <p>This is an automated message from ConnectAfrica.</p>
                    <p>&copy; 2024 ConnectAfrica. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        body_text = f"""
Refund Processed

Dear {user_name},

Your refund has been successfully processed:

Refund Amount: ${refund_amount:.2f}
Reference: {refund_reference}
Reason: {reason}
Date: {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}

The funds should appear in your original payment method within 3-5 business days.

Thank you for your patience and understanding.

This is an automated message from ConnectAfrica.
        """
        
        return self.send_email(user_email, subject, body_html, body_text)
    
    def send_welcome_email(
        self,
        user_email: str,
        user_name: str
    ) -> Dict:
        """Send welcome email to new users"""
        subject = "Welcome to ConnectAfrica! "
        
        body_html = f"""
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: #6366f1; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }}
                .content {{ padding: 20px; background-color: #f9f9f9; }}
                .footer {{ padding: 20px; text-align: center; font-size: 12px; color: #666; }}
                .button {{ background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; display: inline-block; margin: 10px 0; border-radius: 6px; font-weight: bold; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Welcome to ConnectAfrica!</h1>
                </div>
                <div class="content">
                    <p>Hi {user_name},</p>
                    
                    <p>Thank you for joining ConnectAfrica! We're excited to have you on board.</p>
                    
                    <p>With ConnectAfrica, you can:</p>
                    <ul>
                        <li>Join group buys to get better prices</li>
                        <li>Discover products recommended just for you</li>
                        <li>Connect with other traders in your area</li>
                    </ul>
                    
                    <p style="text-align: center;">
                        <a href="http://connectafrica.store" class="button">Start Exploring</a>
                    </p>
                    
                    <p>If you have any questions, feel free to reach out to our support team.</p>
                    
                    <p>Happy trading!<br>The ConnectAfrica Team</p>
                </div>
                <div class="footer">
                    <p>&copy; 2024 ConnectAfrica. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        body_text = f"""
Welcome to ConnectAfrica!

Hi {user_name},

Thank you for joining ConnectAfrica! We're excited to have you on board.

With ConnectAfrica, you can:
- Join group buys to get better prices
- Discover products recommended just for you
- Connect with other traders in your area

Visit http://connectafrica.store to start exploring!

Happy trading!
The ConnectAfrica Team
        """
        
        return self.send_email(user_email, subject, body_html, body_text)
    
    def send_payment_confirmation(
        self,
        user_email: str,
        user_name: str,
        group_name: str,
        amount: float,
        transaction_ref: str
    ) -> Dict:
        """Send payment confirmation email"""
        subject = f"Payment Confirmed - {group_name}"
        
        body_html = f"""
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
                .content {{ padding: 20px; background-color: #f9f9f9; }}
                .info-box {{ background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #10b981; border-radius: 4px; }}
                .footer {{ padding: 20px; text-align: center; font-size: 12px; color: #666; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>✓ Payment Confirmed</h1>
                </div>
                <div class="content">
                    <p>Dear {user_name},</p>
                    
                    <p>Your payment has been successfully processed!</p>
                    
                    <div class="info-box">
                        <strong>Group:</strong> {group_name}<br>
                        <strong>Amount Paid:</strong> ${amount:.2f}<br>
                        <strong>Transaction Ref:</strong> {transaction_ref}<br>
                        <strong>Date:</strong> {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}
                    </div>
                    
                    <p>You will be notified when the group buy reaches its goal and your order is ready for pickup.</p>
                    
                    <p>Thank you for using ConnectAfrica!</p>
                </div>
                <div class="footer">
                    <p>&copy; 2024 ConnectAfrica. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        body_text = f"""
Payment Confirmed

Dear {user_name},

Your payment has been successfully processed!

Group: {group_name}
Amount Paid: ${amount:.2f}
Transaction Ref: {transaction_ref}
Date: {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}

You will be notified when the group buy reaches its goal and your order is ready for pickup.

Thank you for using ConnectAfrica!
        """
        
        return self.send_email(user_email, subject, body_html, body_text)
    
    def send_password_reset_email(
        self,
        user_email: str,
        user_name: str,
        reset_url: str,
        expires_in_minutes: int = 60
    ) -> Dict:
        """Send password reset email with secure link"""
        subject = "Reset Your Password - ConnectAfrica"
        
        body_html = f"""
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: #6366f1; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }}
                .content {{ padding: 30px; background-color: #f9f9f9; }}
                .button {{ background-color: #6366f1; color: white; padding: 14px 28px; text-decoration: none; display: inline-block; margin: 20px 0; border-radius: 6px; font-weight: bold; font-size: 16px; }}
                .warning {{ background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }}
                .footer {{ padding: 20px; text-align: center; font-size: 12px; color: #666; }}
                .link-text {{ word-break: break-all; font-size: 12px; color: #666; margin-top: 10px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1> Password Reset Request</h1>
                </div>
                <div class="content">
                    <p>Hi {user_name},</p>
                    
                    <p>We received a request to reset your password for your ConnectAfrica account.</p>
                    
                    <p style="text-align: center;">
                        <a href="{reset_url}" class="button">Reset My Password</a>
                    </p>
                    
                    <div class="warning">
                        <strong> This link expires in {expires_in_minutes} minutes.</strong><br>
                        For security reasons, this password reset link can only be used once.
                    </div>
                    
                    <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
                    
                    <p>If the button above doesn't work, copy and paste this link into your browser:</p>
                    <p class="link-text">{reset_url}</p>
                    
                    <p>Stay secure,<br>The ConnectAfrica Team</p>
                </div>
                <div class="footer">
                    <p>This is an automated message from ConnectAfrica.</p>
                    <p>If you didn't request this email, please ignore it or contact support if you have concerns.</p>
                    <p>&copy; 2024 ConnectAfrica. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        body_text = f"""
Password Reset Request

Hi {user_name},

We received a request to reset your password for your ConnectAfrica account.

Click the link below to reset your password:
{reset_url}

This link expires in {expires_in_minutes} minutes.

If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.

Stay secure,
The ConnectAfrica Team
        """
        
        return self.send_email(user_email, subject, body_html, body_text)
    
    def send_bulk_emails(self, emails: List[Dict]) -> Dict:
        """
        Send multiple emails in bulk
        
        Args:
            emails: List of dicts with keys: to_email, subject, body_html, body_text
            
        Returns:
            Dict with summary of sent/failed emails
        """
        results = {
            "total": len(emails),
            "sent": 0,
            "failed": 0,
            "details": []
        }
        
        for email_data in emails:
            result = self.send_email(
                to_email=email_data['to_email'],
                subject=email_data['subject'],
                body_html=email_data['body_html'],
                body_text=email_data.get('body_text')
            )
            
            if result['status'] in ['sent', 'simulated']:
                results['sent'] += 1
            else:
                results['failed'] += 1
            
            results['details'].append(result)
        
        return results


# Global instance
email_service = EmailService()
