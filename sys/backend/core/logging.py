import logging
import sys
import json
import time
import logging.handlers
import os
import sys
from pathlib import Path
from typing import Any, Dict, Optional, Union

# Add project root to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from core.config import settings

class JSONFormatter(logging.Formatter):
    """Custom formatter that outputs JSON for structured logging"""
    
    def format(self, record: logging.LogRecord) -> str:
        log_record = {
            'timestamp': self.formatTime(record, self.datefmt),
            'level': record.levelname,
            'name': record.name,
            'message': record.getMessage(),
            'module': record.module,
            'function': record.funcName,
            'line': record.lineno,
        }
        
        # Add exception info if present
        if record.exc_info:
            log_record['exc_info'] = self.formatException(record.exc_info)
        
        # Add any extra attributes
        for key, value in record.__dict__.items():
            if key not in ('args', 'asctime', 'created', 'exc_info', 'exc_text', 
                          'filename', 'funcName', 'id', 'levelname', 'levelno', 
                          'lineno', 'module', 'msecs', 'message', 'msg', 'name', 
                          'pathname', 'process', 'processName', 'relativeCreated',
                          'stack_info', 'thread', 'threadName'):
                if value is not None:
                    log_record[key] = value
        
        return json.dumps(log_record, ensure_ascii=False)

class RequestIdFilter(logging.Filter):
    """Add request ID to log records"""
    
    def __init__(self, name: str = '', request_id: str = '') -> None:
        super().__init__(name)
        self.request_id = request_id
    
    def filter(self, record: logging.LogRecord) -> bool:
        record.request_id = getattr(record, 'request_id', self.request_id)
        return True

def setup_logging() -> None:
    """Configure logging for the application"""
    # Create logs directory if it doesn't exist
    log_dir = Path('logs')
    log_dir.mkdir(exist_ok=True)
    
    # Root logger configuration
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.DEBUG if settings.DEBUG else logging.INFO)
    
    # Clear existing handlers
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)
    
    # Console handler (stderr)
    console_handler = logging.StreamHandler(sys.stderr)
    console_handler.setLevel(logging.DEBUG if settings.DEBUG else logging.INFO)
    
    if settings.ENVIRONMENT == 'development':
        # Pretty console output for development
        console_formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
    else:
        # JSON output for production
        console_formatter = JSONFormatter()
    
    console_handler.setFormatter(console_formatter)
    root_logger.addHandler(console_handler)
    
    # File handler (rotating)
    if settings.ENVIRONMENT != 'test':
        file_handler = logging.handlers.RotatingFileHandler(
            log_dir / 'app.log',
            maxBytes=10 * 1024 * 1024,  # 10MB
            backupCount=5,
            encoding='utf-8'
        )
        file_handler.setLevel(logging.INFO)
        file_formatter = JSONFormatter()
        file_handler.setFormatter(file_formatter)
        root_logger.addHandler(file_handler)
    
    # Configure third-party loggers
    logging.getLogger('sqlalchemy.engine').setLevel(
        logging.INFO if settings.DEBUG else logging.WARNING
    )
    logging.getLogger('urllib3').setLevel(logging.WARNING)
    logging.getLogger('botocore').setLevel(logging.WARNING)
    logging.getLogger('boto3').setLevel(logging.WARNING)
    logging.getLogger('s3transfer').setLevel(logging.WARNING)
    logging.getLogger('celery').setLevel(logging.WARNING)

def get_logger(name: str) -> logging.Logger:
    """Get a configured logger instance"""
    logger = logging.getLogger(name)
    return logger

# Initialize logging when module is imported
setup_logging()
logger = get_logger(__name__)

class RequestLogger:
    """Context manager for request logging"""
    
    def __init__(self, name: str, **kwargs: Any) -> None:
        self.logger = get_logger(name)
        self.start_time = time.time()
        self.extra = kwargs
    
    def __enter__(self):
        self.logger.info("Request started", extra=self.extra)
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        duration = (time.time() - self.start_time) * 1000  # in milliseconds
        extra = {
            **self.extra,
            'duration_ms': round(duration, 2),
            'status': 'error' if exc_type else 'success'
        }
        
        if exc_type:
            self.logger.error(
                f"Request failed after {duration:.2f}ms: {str(exc_val)}",
                extra=extra,
                exc_info=(exc_type, exc_val, exc_tb)
            )
        else:
            self.logger.info(
                f"Request completed in {duration:.2f}ms",
                extra=extra
            )
