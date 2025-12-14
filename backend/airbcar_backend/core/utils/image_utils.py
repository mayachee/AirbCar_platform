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
# Reduced for faster processing on Render free tier
MAX_IMAGE_WIDTH = 1280
MAX_IMAGE_HEIGHT = 720


def validate_image_file(file: UploadedFile) -> Tuple[bool, Optional[str]]:
    """
    Validate an image file (lightweight validation without full image processing).
    
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
    
    # Lightweight validation - just check file header, don't fully process image
    # Full validation will happen during processing
    try:
        # Reset file pointer
        file.seek(0)
        # Just check if we can identify the format (fast check)
        img = Image.open(file)
        img.verify()  # Quick verify
        file.seek(0)  # Reset again for actual use
    except Exception as e:
        return False, f"Invalid image file: {str(e)}"
    
    return True, None


def process_and_save_image(file: UploadedFile, upload_dir: str = 'listings') -> Dict[str, Any]:
    """
    Process and save an uploaded image file (optimized for speed).
    
    Args:
        file: The uploaded file
        upload_dir: Directory to save the image (relative to MEDIA_ROOT)
        
    Returns:
        Dictionary with 'url' and 'name' keys, or None if failed
    """
    # Lightweight validation (skip full validation to save time)
    if file.size > MAX_FILE_SIZE:
        raise ValueError(f"Image file is too large. Maximum size is {MAX_FILE_SIZE / (1024 * 1024):.1f}MB")
    
    try:
        # Generate unique filename
        file_ext = os.path.splitext(file.name)[1]
        unique_filename = f"{uuid.uuid4()}{file_ext}"
        file_path = os.path.join(upload_dir, unique_filename)
        
        # Ensure upload directory exists
        full_path = os.path.join(settings.MEDIA_ROOT, file_path)
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        
        # Optimized image processing - only resize if significantly large
        # Read file content once to avoid file pointer issues
        file.seek(0)
        file_content = b''.join(file.chunks())
        file.seek(0)  # Reset for potential reuse
        
        try:
            from io import BytesIO
            img_file = BytesIO(file_content)
            img = Image.open(img_file)
            
            # Only resize if image is significantly larger than max (saves processing time)
            needs_resize = img.width > MAX_IMAGE_WIDTH * 1.2 or img.height > MAX_IMAGE_HEIGHT * 1.2
            
            if needs_resize:
                # Use faster resampling method (NEAREST is fastest, but BILINEAR is better quality/speed balance)
                img.thumbnail((MAX_IMAGE_WIDTH, MAX_IMAGE_HEIGHT), Image.Resampling.BILINEAR)
                
                # Save resized image with optimized settings
                img_format = img.format or 'JPEG'
                if img_format == 'JPEG' or img_format is None:
                    img = img.convert('RGB')
                    img_format = 'JPEG'
                
                # Use lower quality for faster processing (75 instead of 85)
                # optimize=True helps with file size but adds processing time - skip it
                img.save(full_path, format=img_format, quality=75, optimize=False)
                img.close()  # Close the image to free resources
            else:
                # Save original image directly (fastest path)
                img.close()  # Close the image first
                with open(full_path, 'wb') as destination:
                    destination.write(file_content)
        except Exception as e:
            # If processing fails, try to save original (fallback)
            if settings.DEBUG:
                print(f"Warning: Could not process image, saving original: {str(e)}")
            with open(full_path, 'wb') as destination:
                destination.write(file_content)
        
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

