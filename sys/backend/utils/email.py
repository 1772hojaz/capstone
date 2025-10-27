"""
Email sending utilities
"""
import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
import logging
import os
import secrets
import string
import sys

# Add project root to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from core.config import settings
from core.logging import logger


def generate_verification_token(length: int = 32) -> str:
    """Generate a secure random token for email verification"""
    alphabet = string.ascii_letters + string.digits
    return ''.join(secrets.choice(alphabet) for _ in range(length))


async def send_email(
    to_email: str,
    subject: str,
    html_content: str,
    text_content: Optional[str] = None
) -> bool:
    """
    Send an email using SMTP
    
    Args:
        to_email: Recipient email address
        subject: Email subject
        html_content: HTML content of the email
        text_content: Plain text content (optional, will be generated from HTML if not provided)
        
    Returns:
        bool: True if email was sent successfully, False otherwise
    """
    if not all([settings.SMTP_SERVER, settings.SMTP_PORT, settings.SMTP_USERNAME, settings.SMTP_PASSWORD]):
        logger.warning("Email configuration is incomplete. Email not sent.")
        return False
    
    # Create message container
    msg = MIMEMultipart('alternative')
    msg['Subject'] = subject
    msg['From'] = settings.EMAIL_FROM
    msg['To'] = to_email
    
    # Create the body of the message (a plain-text and an HTML version)
    text = text_content or ""
    html = html_content
    
    # Record the MIME types of both parts - text/plain and text/html
    part1 = MIMEText(text, 'plain')
    part2 = MIMEText(html, 'html')
    
    # Attach parts into message container
    if text:
        msg.attach(part1)
    msg.attach(part2)
    
    try:
        # Create secure connection with server and send email
        context = ssl.create_default_context()
        
        with smtplib.SMTP_SSL(
            host=settings.SMTP_SERVER,
            port=settings.SMTP_PORT,
            context=context
        ) as server:
            server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            server.send_message(msg)
            
        logger.info(f"Email sent to {to_email} with subject: {subject}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {str(e)}", exc_info=True)
        return False


async def send_verification_email(email: str, token: str, username: str) -> bool:
    """Send email verification email"""
    verification_url = f"{settings.FRONTEND_URL}/verify-email?token={token}"
    
    subject = "Verify your email address"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Verify Your Email</title>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .button {{
                display: inline-block;
                padding: 10px 20px;
                background-color: #4CAF50;
                color: white;
                text-decoration: none;
                border-radius: 5px;
                margin: 20px 0;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <h2>Welcome to {settings.APP_NAME}, {username}!</h2>
            <p>Thank you for signing up. Please verify your email address by clicking the button below:</p>
            <p>
                <a href="{verification_url}" class="button">Verify Email</a>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <p><a href="{verification_url}">{verification_url}</a></p>
            <p>If you didn't create an account, you can safely ignore this email.</p>
            <p>Best regards,<br>The {settings.APP_NAME} Team</p>
        </div>
    </body>
    </html>
    """
    
    return await send_email(email, subject, html_content)


async def send_password_reset_email(email: str, token: str, username: str) -> bool:
    """Send password reset email"""
    reset_url = f"{settings.FRONTEND_URL}/reset-password?token={token}"
    
    subject = "Password Reset Request"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Reset Your Password</title>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .button {{
                display: inline-block;
                padding: 10px 20px;
                background-color: #4CAF50;
                color: white;
                text-decoration: none;
                border-radius: 5px;
                margin: 20px 0;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <h2>Hello, {username}!</h2>
            <p>We received a request to reset your password. Click the button below to set a new password:</p>
            <p>
                <a href="{reset_url}" class="button">Reset Password</a>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <p><a href="{reset_url}">{reset_url}</a></p>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request a password reset, you can safely ignore this email.</p>
            <p>Best regards,<br>The {settings.APP_NAME} Team</p>
        </div>
    </body>
    </html>
    """
    
    return await send_email(email, subject, html_content)
