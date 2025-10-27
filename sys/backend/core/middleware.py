"""
Custom middleware for the FastAPI application
"""
import time
from typing import Callable, List, Optional, Set, Tuple

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
import os
import sys
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.types import ASGIApp

# Add project root to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from core.config import settings
from core.logging import logger

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Middleware to add security headers to all responses"""
    
    def __init__(self, app: ASGIApp):
        super().__init__(app)
        self.app = app
    
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        """Add security headers to the response"""
        response = await call_next(request)
        
        # Security headers
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        
        # Content Security Policy
        csp_parts = [
            "default-src 'self';",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:;",
            "style-src 'self' 'unsafe-inline' https:;",
            "img-src 'self' data: https:;",
            "font-src 'self' data:;",
            "connect-src 'self' https: wss:;",
            "frame-ancestors 'none';",
        ]
        
        response.headers["Content-Security-Policy"] = " ".join(csp_parts)
        
        # Feature Policy (now Permissions Policy)
        response.headers["Permissions-Policy"] = (
            "camera=(), microphone=(), geolocation=(), payment=()"
        )
        
        # HSTS - only in production with HTTPS
        if settings.ENVIRONMENT == "production":
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        
        return response


class ProcessTimeMiddleware(BaseHTTPMiddleware):
    """Middleware to add X-Process-Time header to responses"""
    
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        """Add X-Process-Time header to the response"""
        start_time = time.time()
        response = await call_next(request)
        process_time = time.time() - start_time
        response.headers["X-Process-Time"] = str(process_time)
        return response


class LoggingMiddleware(BaseHTTPMiddleware):
    """Middleware for request logging"""
    
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        # Skip logging for health checks and static files
        if request.url.path in ["/health", "/favicon.ico"]:
            return await call_next(request)
        
        # Log request
        logger.info(
            "Request started",
            extra={
                "method": request.method,
                "url": str(request.url),
                "ip": request.client.host if request.client else None,
                "user_agent": request.headers.get("user-agent"),
            },
        )
        
        # Process request
        start_time = time.time()
        try:
            response = await call_next(request)
            process_time = time.time() - start_time
            
            # Log response
            logger.info(
                "Request completed",
                extra={
                    "method": request.method,
                    "url": str(request.url),
                    "status_code": response.status_code,
                    "process_time": f"{process_time:.4f}s",
                },
            )
            
            return response
            
        except Exception as e:
            process_time = time.time() - start_time
            logger.error(
                f"Request failed: {str(e)}",
                extra={
                    "method": request.method,
                    "url": str(request.url),
                    "process_time": f"{process_time:.4f}s",
                },
                exc_info=True,
            )
            raise


def setup_middleware(app: FastAPI) -> None:
    """Set up all middleware for the application"""
    # CORS Middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.BACKEND_CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["X-Process-Time"],
    )
    
    # Security Headers Middleware
    app.add_middleware(SecurityHeadersMiddleware)
    
    # Process Time Middleware
    app.add_middleware(ProcessTimeMiddleware)
    
    # Logging Middleware (should be one of the last to run)
    app.add_middleware(LoggingMiddleware)
