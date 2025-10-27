"""
File storage and handling utilities
"""
import os
import shutil
import uuid
from pathlib import Path
from typing import IO, Any, Dict, List, Optional, Tuple, Union

import os
import sys
from fastapi import UploadFile, HTTPException, status
from fastapi.datastructures import UploadFile as FastAPIUploadFile

# Add project root to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from core.config import settings
from core.logging import logger


class FileStorage:
    """Handles file storage operations"""
    
    def __init__(self, base_path: Optional[str] = None):
        """Initialize file storage with base path"""
        self.base_path = Path(base_path or settings.UPLOAD_FOLDER)
        self.base_path.mkdir(parents=True, exist_ok=True)
    
    async def save_upload_file(
        self,
        upload_file: UploadFile,
        subfolder: str = "",
        allowed_extensions: Optional[List[str]] = None,
        max_size_mb: int = 10
    ) -> str:
        """
        Save an uploaded file to the storage
        
        Args:
            upload_file: The uploaded file
            subfolder: Subfolder to save the file in
            allowed_extensions: List of allowed file extensions (e.g., ['.jpg', '.png'])
            max_size_mb: Maximum file size in MB
            
        Returns:
            str: Path to the saved file relative to the base path
            
        Raises:
            HTTPException: If file validation fails
        """
        # Validate file size
        max_size = max_size_mb * 1024 * 1024  # Convert MB to bytes
        content = await upload_file.read()
        if len(content) > max_size:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File too large. Maximum size is {max_size_mb}MB"
            )
        
        # Reset file pointer after reading
        await upload_file.seek(0)
        
        # Get file extension
        file_ext = Path(upload_file.filename or "").suffix.lower()
        
        # Validate file extension
        if allowed_extensions and file_ext not in allowed_extensions:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File type not allowed. Allowed types: {', '.join(allowed_extensions)}"
            )
        
        # Generate a unique filename
        filename = f"{uuid.uuid4().hex}{file_ext}"
        save_path = self.base_path / subfolder
        save_path.mkdir(parents=True, exist_ok=True)
        
        # Save the file
        file_path = save_path / filename
        
        try:
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(upload_file.file, buffer)
        except Exception as e:
            logger.error(f"Failed to save file: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to save file"
            )
        
        # Return the relative path
        return str(Path(subfolder) / filename)
    
    def get_file_path(self, file_path: str) -> Path:
        """Get the full path to a stored file"""
        full_path = (self.base_path / file_path).resolve()
        
        # Security check: ensure the path is within the base directory
        if not full_path.is_relative_to(self.base_path):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid file path"
            )
        
        if not full_path.exists():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="File not found"
            )
        
        return full_path
    
    def delete_file(self, file_path: str) -> bool:
        """Delete a stored file"""
        try:
            full_path = self.get_file_path(file_path)
            full_path.unlink()
            return True
        except Exception as e:
            logger.error(f"Failed to delete file {file_path}: {str(e)}")
            return False
    
    def get_file_url(self, file_path: str) -> str:
        """Get the URL to access a stored file"""
        if not file_path:
            return ""
        
        # If the file is already a URL, return as is
        if file_path.startswith(('http://', 'https://')):
            return file_path
        
        # Otherwise, construct the URL
        return f"{settings.API_BASE_URL}/media/{file_path}"


# Default storage instance
storage = FileStorage()


# Common file type validators
def is_image_file(filename: str) -> bool:
    """Check if the file is an image"""
    allowed_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.webp'}
    return Path(filename).suffix.lower() in allowed_extensions

def is_document_file(filename: str) -> bool:
    """Check if the file is a document"""
    allowed_extensions = {'.pdf', '.doc', '.docx', '.txt', '.rtf'}
    return Path(filename).suffix.lower() in allowed_extensions

def is_media_file(filename: str) -> bool:
    """Check if the file is a media file (audio/video)"""
    allowed_extensions = {'.mp3', '.wav', '.ogg', '.mp4', '.webm', '.mov'}
    return Path(filename).suffix.lower() in allowed_extensions
