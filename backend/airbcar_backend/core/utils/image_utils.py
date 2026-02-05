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


def upload_file_to_supabase_storage(
    file: UploadedFile,
    bucket_name: str,
    folder: str = 'listings',
    user_id: Optional[int] = None,
    listing_id: Optional[int] = None
) -> str:
    """
    Upload a file directly to Supabase Storage without saving locally first.
    This is optimized for files that should go directly to Supabase.
    
    Args:
        file: The uploaded file to process
        bucket_name: Supabase bucket name (e.g., 'Pics', 'partner_logos', 'user_documents')
        folder: Folder within the bucket (e.g., 'listings', 'logos', 'identity_documents')
        user_id: Optional user ID for generating unique file paths (deprecated, use listing_id)
        listing_id: Optional listing ID for organizing files as Pics/listings/{listing_id}/
        
    Returns:
        Supabase public URL of the uploaded file
        
    Raises:
        ValueError: If Supabase is not configured or upload fails
    """
    # Import with fallback for different import contexts
    try:
        from core.supabase_storage import get_supabase_client, upload_file_to_supabase
    except ImportError:
        from ..supabase_storage import get_supabase_client, upload_file_to_supabase
    
    # Early check: Verify Supabase is configured
    supabase_client = get_supabase_client()
    if not supabase_client:
        error_msg = (
            "Supabase Storage is not configured. "
            "Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables. "
            "Local file storage is not available on Render's ephemeral filesystem."
        )
        if settings.DEBUG:
            print(f"❌ {error_msg}")
        raise ValueError(error_msg)
    
    # Generate unique file path
    file_name = file.name if hasattr(file, 'name') else 'unknown'
    file_ext = os.path.splitext(file_name)[1] if file_name else '.jpg'
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    
    # If listing_id is provided, use it for organization
    if listing_id:
        file_path = f"{folder}/{listing_id}/{unique_filename}"
    elif user_id:
        file_path = f"{folder}/{user_id}_{unique_filename}"
    else:
        file_path = f"{folder}/{unique_filename}"
    
    # Determine content type
    content_type = 'image/jpeg'  # default
    if file_ext.lower() in ['.jpg', '.jpeg']:
        content_type = 'image/jpeg'
    elif file_ext.lower() == '.png':
        content_type = 'image/png'
    elif file_ext.lower() == '.gif':
        content_type = 'image/gif'
    elif file_ext.lower() == '.webp':
        content_type = 'image/webp'
    elif file_ext.lower() == '.pdf':
        content_type = 'application/pdf'
    
    # Read file content
    try:
        file.seek(0)
    except (AttributeError, OSError):
        pass
    
    file_content = bytearray()
    try:
        for chunk in file.chunks():
            file_content.extend(chunk)
    except (AttributeError, TypeError):
        try:
            file.seek(0)
            file_content = bytearray(file.read())
        except Exception as read_error:
            raise ValueError(f"Cannot read file content: {str(read_error)}")
    
    file_content = bytes(file_content)
    
    # Upload to Supabase
    try:
        from io import BytesIO
        # Import supabase_storage function (lazy import to avoid import errors)
        try:
            from core.supabase_storage import upload_file_to_supabase
        except ImportError:
            from ..supabase_storage import upload_file_to_supabase
        
        file_obj = BytesIO(file_content)
        # upload_file_to_supabase will raise ValueError if upload fails
        supabase_url = upload_file_to_supabase(
            file=file_obj,
            bucket_name=bucket_name,
            file_path=file_path,
            content_type=content_type
        )
        
        # Safety check (should never be reached since upload_file_to_supabase raises on failure)
        if not supabase_url:
            raise ValueError(
                f"Supabase upload returned no URL unexpectedly. "
                f"Please check that SUPABASE_URL and SUPABASE_ANON_KEY are set, "
                f"and that the '{bucket_name}' bucket exists and is PUBLIC."
            )
        
        return supabase_url
    except Exception as e:
        error_msg = str(e)
        if settings.DEBUG:
            print(f"❌ Could not upload to Supabase Storage: {error_msg}")
        raise ValueError(
            f"Failed to upload file to Supabase Storage: {error_msg}. "
            f"Please ensure Supabase is configured correctly."
        )


def process_and_save_image(file: UploadedFile, upload_dir: str = 'listings') -> Dict[str, Any]:
    """
    Process and save an uploaded image file (optimized for speed).
    
    IMPORTANT: This function REQUIRES Supabase Storage to be configured.
    Local file storage is not available on Render's ephemeral filesystem.
    
    Args:
        file: The uploaded file
        upload_dir: Directory to save the image (relative to MEDIA_ROOT)
        
    Returns:
        Dictionary with 'url' (Supabase URL), 'name', and 'size' keys
        
    Raises:
        ValueError: If Supabase is not configured or upload fails
    """
    # Early check: Verify Supabase is configured before processing
    # Import with fallback for different import contexts
    try:
        from core.supabase_storage import get_supabase_client
    except ImportError:
        from ..supabase_storage import get_supabase_client
    supabase_client = get_supabase_client()
    if not supabase_client:
        error_msg = (
            "Supabase Storage is not configured. "
            "Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables. "
            "Local file storage is not available on Render's ephemeral filesystem."
        )
        if settings.DEBUG:
            print(f"❌ {error_msg}")
        raise ValueError(error_msg)
    
    # Lightweight validation (skip full validation to save time)
    if file.size > MAX_FILE_SIZE:
        raise ValueError(f"Image file is too large. Maximum size is {MAX_FILE_SIZE / (1024 * 1024):.1f}MB")
    
    try:
        # Save file metadata before reading (file.size might not be available after chunks())
        file_name = file.name if hasattr(file, 'name') else 'unknown'
        file_size = file.size if hasattr(file, 'size') else 0
        
        # Generate unique filename
        file_ext = os.path.splitext(file_name)[1] if file_name else '.jpg'
        unique_filename = f"{uuid.uuid4()}{file_ext}"
        file_path = os.path.join(upload_dir, unique_filename)
        
        # Ensure upload directory exists
        full_path = os.path.join(settings.MEDIA_ROOT, file_path)
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        
        # Optimized image processing - only resize if significantly large
        # Read file content once to avoid file pointer issues
        # IMPORTANT: Read file content immediately and don't keep reference to file object
        try:
            file.seek(0)
        except (AttributeError, OSError):
            pass  # Some file objects don't support seek
        
        # Read file content using chunks() method
        # IMPORTANT: Create a fresh bytes object to avoid any reference to the file object
        file_content = bytearray()
        try:
            for chunk in file.chunks():
                file_content.extend(chunk)
        except (AttributeError, TypeError) as e:
            # Fallback: try reading directly if chunks() doesn't work
            if settings.DEBUG:
                print(f"Warning: file.chunks() failed, trying direct read: {str(e)}")
            try:
                file.seek(0)
                file_content = bytearray(file.read())
            except Exception as read_error:
                raise ValueError(f"Cannot read file content: {str(read_error)}")
        
        # Convert to immutable bytes to ensure no references to file object
        file_content = bytes(file_content)
        
        if not file_content:
            raise ValueError("File content is empty")
        
        # Update file_size if we couldn't get it before
        if file_size == 0:
            file_size = len(file_content)
        
        # At this point, we have all the data we need from the file:
        # - file_content (bytes)
        # - file_name (string)
        # - file_size (int)
        # We no longer need the file object itself, so we won't reference it again
        
        try:
            from io import BytesIO
            # Create BytesIO from file content (in-memory copy, no reference to original file)
            img_file = BytesIO(file_content)
            
            try:
                img = Image.open(img_file)
                
                # Get image dimensions and format
                img_width = img.width
                img_height = img.height
                img_format = img.format or 'JPEG'
                
                # Only resize if image is significantly larger than max (saves processing time)
                needs_resize = img_width > MAX_IMAGE_WIDTH * 1.2 or img_height > MAX_IMAGE_HEIGHT * 1.2
                
                if needs_resize:
                    # Use faster resampling method (NEAREST is fastest, but BILINEAR is better quality/speed balance)
                    img.thumbnail((MAX_IMAGE_WIDTH, MAX_IMAGE_HEIGHT), Image.Resampling.BILINEAR)
                    
                    # Save resized image with optimized settings
                    if img_format == 'JPEG' or img_format is None:
                        img = img.convert('RGB')
                        img_format = 'JPEG'
                    
                    # Use lower quality for faster processing (75 instead of 85)
                    # optimize=True helps with file size but adds processing time - skip it
                    img.save(full_path, format=img_format, quality=75, optimize=False)
                    # Close image after saving
                    img.close()
                    img = None
                else:
                    # Save original image directly (fastest path)
                    # Close image first to free resources
                    img.close()
                    img = None
                    # Write file content directly (no resize needed)
                    with open(full_path, 'wb') as destination:
                        destination.write(file_content)
            finally:
                # Always close BytesIO properly
                try:
                    img_file.close()
                except:
                    pass
                # Clear reference
                img_file = None
        except Exception as e:
            # If processing fails, try to save original (fallback)
            if settings.DEBUG:
                print(f"Warning: Could not process image, saving original: {str(e)}")
                import traceback
                traceback.print_exc()
            with open(full_path, 'wb') as destination:
                destination.write(file_content)
        
        # Upload to Supabase Storage (REQUIRED - no fallback to local paths on Render)
        supabase_url = None
        bucket_name = 'listings'  # Use 'listings' bucket for all images (MUST BE PUBLIC)
        
        # Determine content type from file extension
        content_type = 'image/jpeg'  # default
        if file_ext.lower() in ['.jpg', '.jpeg']:
            content_type = 'image/jpeg'
        elif file_ext.lower() == '.png':
            content_type = 'image/png'
        elif file_ext.lower() == '.gif':
            content_type = 'image/gif'
        elif file_ext.lower() == '.webp':
            content_type = 'image/webp'
        
        # Try to upload to Supabase Storage (REQUIRED)
        try:
            # For Supabase, use just the filename (bucket name already indicates folder)
            # IMPORTANT: For 'listings' bucket, NEVER include 'listings/' in the path
            # file_path is "listings/{uuid}.png" but bucket is "listings", so we use just "{uuid}.png"
            supabase_file_path = unique_filename  # Just the filename, not the full path with folder
            
            # Safety check: Remove any 'listings/' prefix if it exists (shouldn't happen, but just in case)
            if supabase_file_path.startswith('listings/'):
                supabase_file_path = supabase_file_path.replace('listings/', '', 1)
                if settings.DEBUG:
                    print(f"⚠️ Removed 'listings/' prefix from file path: {supabase_file_path}")
            
            if settings.DEBUG:
                print(f"📤 Uploading image to Supabase:")
                print(f"   Bucket: {bucket_name}")
                print(f"   File path (Supabase): {supabase_file_path}")
                print(f"   Local file path: {file_path}")
                print(f"   Content type: {content_type}")
                print(f"   File size: {file_size} bytes")
            
            # Read the saved file to upload to Supabase
            # Import supabase_storage function (lazy import to avoid import errors)
            try:
                from core.supabase_storage import upload_file_to_supabase
            except ImportError:
                from ..supabase_storage import upload_file_to_supabase
            
            # upload_file_to_supabase will raise ValueError if upload fails
            with open(full_path, 'rb') as saved_file:
                supabase_url = upload_file_to_supabase(
                    file=saved_file,
                    bucket_name=bucket_name,
                    file_path=supabase_file_path,
                    content_type=content_type
                )
            
            # If we get here, upload succeeded (no exception was raised)
            if settings.DEBUG:
                print(f"✅ Image uploaded successfully: {supabase_url}")
                
        except Exception as e:
            error_msg = str(e)
            if settings.DEBUG:
                print(f"❌ Could not upload to Supabase Storage: {error_msg}")
                import traceback
                print(f"Full traceback: {traceback.format_exc()}")
                print(f"   Make sure:")
                print(f"   1. SUPABASE_URL and SUPABASE_ANON_KEY are set in environment variables")
                print(f"   2. The '{bucket_name}' bucket exists in Supabase Dashboard")
                print(f"   3. The '{bucket_name}' bucket is set to PUBLIC in Supabase Dashboard")
                print(f"   4. The bucket has proper permissions")
            # Don't fallback to local - raise error instead
            raise ValueError(
                f"Failed to upload image to Supabase Storage: {error_msg}. "
                f"Please ensure Supabase is configured correctly. "
                f"Local file storage is not available on Render's ephemeral filesystem."
            )
        
        # Verify we got a Supabase URL
        if not supabase_url:
            error_msg = (
                f"Supabase upload returned no URL. "
                f"Please check that SUPABASE_URL and SUPABASE_ANON_KEY are set, "
                f"and that the '{bucket_name}' bucket exists and is PUBLIC."
            )
            if settings.DEBUG:
                print(f"❌ {error_msg}")
            raise ValueError(error_msg)
        
        # Return image info with Supabase URL
        return {
            'url': supabase_url,
            'name': file_name,
            'size': file_size
        }
    except Exception as e:
        if settings.DEBUG:
            file_name_for_error = file_name if 'file_name' in locals() else 'unknown'
            print(f"Error processing image {file_name_for_error}: {str(e)}")
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


def is_local_media_url(url: str) -> bool:
    """
    Check if a URL is a local media URL that won't work on Render's ephemeral filesystem.
    
    Args:
        url: URL string to check
        
    Returns:
        True if URL is a local media URL, False otherwise
    """
    if not url or not isinstance(url, str):
        return False
    
    url_lower = url.lower()
    
    # Check for local media patterns
    local_media_patterns = [
        '/media/',
        '/profiles/',
        'localhost/media',
        'localhost/profiles',
        '127.0.0.1/media',
        '127.0.0.1/profiles',
        'airbcar-backend.onrender.com/media',
        'airbcar-backend.onrender.com/profiles',
        '.onrender.com/media',  # Catch any Render subdomain with /media
        '.onrender.com/profiles',  # Catch any Render subdomain with /profiles
    ]
    
    # Check if URL contains any local media pattern
    if any(pattern in url_lower for pattern in local_media_patterns):
        return True
    
    # Check for paths starting with /media/ or /profiles/
    if url_lower.startswith('/media/') or url_lower.startswith('/profiles/'):
        return True
    
    return False


def combine_images(uploaded_images: List[Any], existing_images: List[Any]) -> List[str]:
    """
    Combine uploaded images with existing images, normalizing to URL strings only.
    Filters out local media URLs that won't work on Render's ephemeral filesystem.
    
    Args:
        uploaded_images: List of newly uploaded images (strings or dicts with 'url')
        existing_images: List of existing images (various formats)
        
    Returns:
        Combined and normalized list of image URL strings (only Supabase/external URLs)
    """
    # Normalize uploaded images to URL strings only
    normalized_uploaded = []
    for img in uploaded_images:
        if isinstance(img, str):
            if not is_local_media_url(img):
                normalized_uploaded.append(img)
        elif isinstance(img, dict) and 'url' in img:
            url = img['url']
            if not is_local_media_url(url):
                normalized_uploaded.append(url)
    
    # Normalize existing images to URL strings only
    normalized_existing = []
    for img in existing_images:
        if isinstance(img, str):
            if not is_local_media_url(img):
                normalized_existing.append(img)
        elif isinstance(img, dict) and 'url' in img:
            url = img['url']
            if not is_local_media_url(url):
                normalized_existing.append(url)
    
    # Combine uploaded images with existing images (all as URL strings)
    combined = normalized_uploaded + normalized_existing
    
    # Log if we filtered out any images
    filtered_count = (len(uploaded_images) + len(existing_images)) - len(combined)
    if settings.DEBUG and filtered_count > 0:
        print(f"⚠️ Filtered out {filtered_count} local media URL(s) from images")
    
    return combined

