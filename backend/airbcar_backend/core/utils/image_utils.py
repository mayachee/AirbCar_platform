"""
Utility functions for image processing and validation.
"""
import os
import uuid
import json
from typing import List, Dict, Any, Optional, Tuple
from django.conf import settings
from django.core.files.uploadedfile import UploadedFile
from PIL import Image
import io


# Allowed image MIME types
ALLOWED_IMAGE_TYPES = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/gif': ['.gif'],
    'image/webp': ['.webp'],
}

# Maximum file size (10MB)
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB in bytes

# Maximum image dimensions (optional, for resizing)
MAX_IMAGE_WIDTH = 1920
MAX_IMAGE_HEIGHT = 1080


def validate_image_file(file: UploadedFile) -> Tuple[bool, Optional[str]]:
    """
    Validate an image file.
    
    Args:
        file: The uploaded file to validate
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    # Check file size
    if file.size > MAX_FILE_SIZE:
        return False, f"Image file is too large. Maximum size is {MAX_FILE_SIZE / (1024 * 1024):.1f}MB"
    
    # Check file type
    content_type = file.content_type
    if content_type not in ALLOWED_IMAGE_TYPES:
        return False, f"Invalid image type. Allowed types: {', '.join(ALLOWED_IMAGE_TYPES.keys())}"
    
    # Check file extension
    file_ext = os.path.splitext(file.name)[1].lower()
    if file_ext not in ALLOWED_IMAGE_TYPES.get(content_type, []):
        return False, f"File extension doesn't match content type"
    
    # Try to open and verify it's a valid image
    try:
        # Reset file pointer
        file.seek(0)
        img = Image.open(file)
        img.verify()  # Verify it's a valid image
        file.seek(0)  # Reset again for actual use
    except Exception as e:
        return False, f"Invalid image file: {str(e)}"
    
    return True, None


def process_and_save_image(file: UploadedFile, upload_dir: str = 'listings') -> Dict[str, Any]:
    """
    Process and save an uploaded image file.
    
    Args:
        file: The uploaded file
        upload_dir: Directory to save the image (relative to MEDIA_ROOT)
        
    Returns:
        Dictionary with 'url' and 'name' keys, or None if failed
    """
    # Validate the file first
    is_valid, error_msg = validate_image_file(file)
    if not is_valid:
        raise ValueError(error_msg)
    
    try:
        # Generate unique filename
        file_ext = os.path.splitext(file.name)[1]
        unique_filename = f"{uuid.uuid4()}{file_ext}"
        file_path = os.path.join(upload_dir, unique_filename)
        
        # Ensure upload directory exists
        full_path = os.path.join(settings.MEDIA_ROOT, file_path)
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        
        # Optionally resize image if it's too large
        try:
            file.seek(0)
            img = Image.open(file)
            
            # Resize if image is too large (maintain aspect ratio)
            if img.width > MAX_IMAGE_WIDTH or img.height > MAX_IMAGE_HEIGHT:
                img.thumbnail((MAX_IMAGE_WIDTH, MAX_IMAGE_HEIGHT), Image.Resampling.LANCZOS)
                
                # Save resized image
                img_format = img.format or 'JPEG'
                if img_format == 'JPEG':
                    img = img.convert('RGB')
                
                img.save(full_path, format=img_format, quality=85, optimize=True)
            else:
                # Save original image
                with open(full_path, 'wb+') as destination:
                    for chunk in file.chunks():
                        destination.write(chunk)
        except Exception as e:
            # If resizing fails, try to save original
            if settings.DEBUG:
                print(f"Warning: Could not resize image, saving original: {str(e)}")
            file.seek(0)
            with open(full_path, 'wb+') as destination:
                for chunk in file.chunks():
                    destination.write(chunk)
        
        # Return image info
        media_path = f"/media/{file_path}"
        return {
            'url': media_path,
            'name': file.name,
            'size': file.size
        }
    except Exception as e:
        if settings.DEBUG:
            print(f"Error processing image {file.name}: {str(e)}")
        raise


def parse_images_data(images_data: Any) -> List[Dict[str, Any]]:
    """
    Parse images data from various formats (JSON string, list, etc.).
    
    Args:
        images_data: Images data in various formats
        
    Returns:
        List of image dictionaries or strings
    """
    if images_data is None:
        return []
    
    if isinstance(images_data, str):
        # Try to parse as JSON
        if not images_data.strip():
            return []
        
        try:
            parsed = json.loads(images_data)
            if isinstance(parsed, list):
                return parsed
            elif isinstance(parsed, dict):
                return [parsed]
            else:
                return []
        except json.JSONDecodeError:
            # If it's not valid JSON, check if it's a URL string
            if images_data.startswith(('http://', 'https://', '/media/')):
                return [images_data]
            else:
                return []
    
    elif isinstance(images_data, list):
        return images_data
    
    elif isinstance(images_data, dict):
        return [images_data]
    
    return []


def normalize_image_entry(img: Any) -> Dict[str, Any]:
    """
    Normalize an image entry to a consistent format.
    
    Args:
        img: Image entry (can be string, dict, etc.)
        
    Returns:
        Normalized image dictionary with 'url' key
    """
    if isinstance(img, str):
        return {'url': img}
    elif isinstance(img, dict):
        # Ensure it has a 'url' key
        if 'url' in img:
            return img
        else:
            # If it's a dict without 'url', try to use the first value or create a URL
            return {'url': str(img.get('url', list(img.values())[0] if img else ''))}
    else:
        return {'url': str(img)}


def combine_images(uploaded_images: List[Dict[str, Any]], existing_images: List[Any]) -> List[Dict[str, Any]]:
    """
    Combine uploaded images with existing images, normalizing the format.
    
    Args:
        uploaded_images: List of newly uploaded images (already processed)
        existing_images: List of existing images (various formats)
        
    Returns:
        Combined and normalized list of images
    """
    # Normalize existing images
    normalized_existing = [normalize_image_entry(img) for img in existing_images]
    
    # Combine and return
    return uploaded_images + normalized_existing

