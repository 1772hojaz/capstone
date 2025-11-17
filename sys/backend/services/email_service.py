"""
Email Service
Handles sending email notifications to users
Supports SMTP and various email providers (SendGrid, Mailgun, etc.)
"""

import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List, Dict, Optional
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class EmailService:
    """Service for sending email notifications"""
    
    def __init__(self):
        """Initialize email service with configuration from environment"""
        self.smtp_host = os.getenv('SMTP_HOST', 'smtp.gmail.com')
        self.smtp_port = int(os.getenv('SMTP_PORT', '587'))
        self.smtp_user = os.getenv('SMTP_USER', '')
        self.smtp_password = os.getenv('SMTP_PASSWORD', '')
        self.from_email = os.getenv('FROM_EMAIL', self.smtp_user)
        self.from_name = os.getenv('FROM_NAME', 'ConnectSphere')
        
        # Test mode - if no credentials, run in simulation mode
        self.simulation_mode = not (self.smtp_user and self.smtp_password)
        
        if self.simulation_mode:
            logger.warning("Email service running in SIMULATION MODE (no SMTP credentials)")
    
    def send_email(
        self, 
        to_email: str, 
        subject: str, 
        body_html: str, 
        body_text: Optional[str] = None
    ) -> Dict:
        """
        Send a single email
        
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
            # Create message
            msg = MIMEMultipart('alternative')
            msg['From'] = f"{self.from_name} <{self.from_email}>"
            msg['To'] = to_email
            msg['Subject'] = subject
            
            # Attach plain text version
            if body_text:
                part1 = MIMEText(body_text, 'plain')
                msg.attach(part1)
            
            # Attach HTML version
            part2 = MIMEText(body_html, 'html')
            msg.attach(part2)
            
            # Send email
            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_user, self.smtp_password)
                server.send_message(msg)
            
            logger.info(f"Email sent successfully to {to_email}")
            return {
                "status": "sent",
                "message": "Email sent successfully",
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
        
        Args:
            user_email: User's email address
            user_name: User's full name
            group_name: Name of the deleted group
            group_id: Group ID
            refund_amount: Amount being refunded
            refund_status: Status of refund (pending, completed, failed)
        """
        subject = f"Group Buy Cancelled - {group_name}"
        
        body_html = f"""
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: #f44336; color: white; padding: 20px; text-align: center; }}
                .content {{ padding: 20px; background-color: #f9f9f9; }}
                .info-box {{ background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #2196F3; }}
                .footer {{ padding: 20px; text-align: center; font-size: 12px; color: #666; }}
                .button {{ background-color: #2196F3; color: white; padding: 10px 20px; text-decoration: none; display: inline-block; margin: 10px 0; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Group Buy Cancelled</h1>
                </div>
                <div class="content">
                    <p>Dear {user_name},</p>
                    
                    <p>We regret to inform you that the following group buy has been cancelled by our admin team:</p>
                    
                    <div class="info-box">
                        <strong>Group:</strong> {group_name}<br>
                        <strong>Group ID:</strong> #{group_id}<br>
                        <strong>Refund Amount:</strong> ${refund_amount:.2f}<br>
                        <strong>Refund Status:</strong> {refund_status.upper()}
                    </div>
                    
                    <p>Your refund has been processed automatically. Please allow 3-5 business days for the funds to appear in your account.</p>
                    
                    <p>If you have any questions or concerns, please don't hesitate to contact our support team.</p>
                    
                    <a href="http://localhost:5173/support" class="button">Contact Support</a>
                </div>
                <div class="footer">
                    <p>This is an automated message from ConnectSphere. Please do not reply to this email.</p>
                    <p>&copy; 2024 ConnectSphere. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        body_text = f"""
        Group Buy Cancelled
        
        Dear {user_name},
        
        We regret to inform you that the following group buy has been cancelled by our admin team:
        
        Group: {group_name}
        Group ID: #{group_id}
        Refund Amount: ${refund_amount:.2f}
        Refund Status: {refund_status.upper()}
        
        Your refund has been processed automatically. Please allow 3-5 business days for the funds to appear in your account.
        
        If you have any questions or concerns, please contact our support team.
        
        This is an automated message from ConnectSphere.
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
        
        Args:
            user_email: User's email address
            user_name: User's full name
            refund_amount: Amount refunded
            refund_reference: Refund transaction reference
            reason: Reason for refund
        """
        subject = f"Refund Processed - ${refund_amount:.2f}"
        
        body_html = f"""
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: #4CAF50; color: white; padding: 20px; text-align: center; }}
                .content {{ padding: 20px; background-color: #f9f9f9; }}
                .info-box {{ background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #4CAF50; }}
                .footer {{ padding: 20px; text-align: center; font-size: 12px; color: #666; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Refund Processed</h1>
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
                    <p>This is an automated message from ConnectSphere. Please do not reply to this email.</p>
                    <p>&copy; 2024 ConnectSphere. All rights reserved.</p>
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
        
        This is an automated message from ConnectSphere.
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

