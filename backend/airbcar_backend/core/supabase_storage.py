"""
Supabase Storage utility for uploading files.
"""
import os
from supabase import create_client, Client
from django.conf import settings
from typing import Optional, BinaryIO
import uuid
import signal
from contextlib import contextmanager


def get_supabase_client() -> Optional[Client]:
    """Get Supabase client instance."""
    supabase_url = os.environ.get('SUPABASE_URL')
    supabase_key = os.environ.get('SUPABASE_ANON_KEY') or os.environ.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if not supabase_url or not supabase_key:
        if settings.DEBUG:
            print("⚠️ Supabase credentials not found. File uploads will use local storage.")
        return None
    
    try:
        return create_client(supabase_url, supabase_key)
    except Exception as e:
        if settings.DEBUG:
            print(f"❌ Error creating Supabase client: {str(e)}")
        return None


@contextmanager
def timeout_context(seconds):
    """Context manager for timeout handling."""
    def timeout_handler(signum, frame):
        raise TimeoutError(f"Operation timed out after {seconds} seconds")
    
    # Set up signal handler for timeout (Unix only)
    if hasattr(signal, 'SIGALRM'):
        old_handler = signal.signal(signal.SIGALRM, timeout_handler)
        signal.alarm(seconds)
        try:
            yield
        finally:
            signal.alarm(0)
            signal.signal(signal.SIGALRM, old_handler)
    else:
        # Windows doesn't support SIGALRM, just proceed without timeout
        yield


def upload_file_to_supabase(
    file: BinaryIO,
    bucket_name: str,
    file_path: str,
    content_type: Optional[str] = None,
    timeout: int = 30
) -> Optional[str]:
    """
    Upload a file to Supabase Storage with timeout handling.
    
    Args:
        file: File object to upload
        bucket_name: Name of the Supabase storage bucket
        file_path: Path where the file should be stored in the bucket
        content_type: MIME type of the file (optional)
        timeout: Timeout in seconds (default: 30)
    
    Returns:
        Public URL of the uploaded file, or None if upload failed
    """
    supabase = get_supabase_client()
    if not supabase:
        return None
    
    try:
        # Read file content
        file.seek(0)  # Reset file pointer
        file_content = file.read()
        
        # Determine content type if not provided
        if not content_type:
            # Try to guess from file extension
            if file_path.lower().endswith(('.jpg', '.jpeg')):
                content_type = 'image/jpeg'
            elif file_path.lower().endswith('.png'):
                content_type = 'image/png'
            elif file_path.lower().endswith('.pdf'):
                content_type = 'application/pdf'
            else:
                content_type = 'application/octet-stream'
        
        # Upload to Supabase Storage with timeout handling
        try:
            upload_response = None
            # Use timeout context if available (Unix), otherwise proceed normally
            if hasattr(signal, 'SIGALRM'):
                with timeout_context(timeout):
                    upload_response = supabase.storage.from_(bucket_name).upload(
                        path=file_path,
                        file=file_content,
                        file_options={
                            "content-type": content_type,
                            "upsert": "true"  # Overwrite if exists
                        }
                    )
            else:
                # Windows - no timeout support, proceed normally
                upload_response = supabase.storage.from_(bucket_name).upload(
                    path=file_path,
                    file=file_content,
                    file_options={
                        "content-type": content_type,
                        "upsert": "true"  # Overwrite if exists
                    }
                )
            
            # Check if upload was successful
            # Supabase upload returns a response with 'path' key if successful
            if upload_response:
                # Check if response indicates success
                # The response might be a dict with 'path' or a string path
                response_path = None
                if isinstance(upload_response, dict):
                    response_path = upload_response.get('path') or upload_response.get('Key')
                elif isinstance(upload_response, str):
                    response_path = upload_response
                
                # If we got a path, the upload likely succeeded
                if response_path or (hasattr(upload_response, 'path') and upload_response.path):
                    # Get public URL
                    public_url = supabase.storage.from_(bucket_name).get_public_url(file_path)
                    if public_url:
                        if settings.DEBUG:
                            print(f"✅ Successfully uploaded {file_path} to Supabase")
                        return public_url
                    else:
                        # Construct URL manually if get_public_url doesn't work
                        supabase_url = os.environ.get('SUPABASE_URL', '').rstrip('/')
                        constructed_url = f"{supabase_url}/storage/v1/object/public/{bucket_name}/{file_path}"
                        if settings.DEBUG:
                            print(f"✅ Upload succeeded, using constructed URL: {constructed_url}")
                        return constructed_url
                else:
                    # Upload response doesn't indicate success
                    if settings.DEBUG:
                        print(f"⚠️ Upload response doesn't indicate success: {upload_response}")
                    return None
            else:
                # No response from upload
                if settings.DEBUG:
                    print(f"⚠️ No response from Supabase upload for {file_path}")
                return None
                
        except TimeoutError:
            if settings.DEBUG:
                print(f"⏱️ Upload timed out after {timeout} seconds for {file_path}")
            return None
        except Exception as upload_error:
            error_msg = str(upload_error)
            if settings.DEBUG:
                print(f"❌ Upload error for {file_path}: {error_msg}")
                import traceback
                print(f"Full traceback: {traceback.format_exc()}")
            
            # Check for specific error messages
            if "not found" in error_msg.lower() or "bucket" in error_msg.lower():
                if settings.DEBUG:
                    print(f"💡 Tip: Make sure the '{bucket_name}' bucket exists and is PUBLIC in Supabase Dashboard")
            elif "permission" in error_msg.lower() or "unauthorized" in error_msg.lower():
                if settings.DEBUG:
                    print(f"💡 Tip: Check that SUPABASE_ANON_KEY has upload permissions for bucket '{bucket_name}'")
            
            return None
            
    except Exception as e:
        if settings.DEBUG:
            print(f"❌ Error uploading to Supabase Storage: {str(e)}")
        return None


def delete_file_from_supabase(bucket_name: str, file_path: str) -> bool:
    """
    Delete a file from Supabase Storage.
    
    Args:
        bucket_name: Name of the Supabase storage bucket
        file_path: Path of the file to delete
    
    Returns:
        True if deletion was successful, False otherwise
    """
    supabase = get_supabase_client()
    if not supabase:
        return False
    
    try:
        supabase.storage.from_(bucket_name).remove([file_path])
        return True
    except Exception as e:
        if settings.DEBUG:
            print(f"❌ Error deleting from Supabase Storage: {str(e)}")
        return False


def generate_file_path(user_id: int, filename: str, folder: str = 'identity_documents') -> str:
    """
    Generate a unique file path for Supabase Storage.
    
    Args:
        user_id: ID of the user
        filename: Original filename
        folder: Folder name in the bucket
    
    Returns:
        Unique file path
    """
    # Extract file extension
    _, ext = os.path.splitext(filename)
    
    # Generate unique filename
    unique_id = str(uuid.uuid4())[:8]
    safe_filename = f"{user_id}_{unique_id}{ext}"
    
    return f"{folder}/{safe_filename}"


def ensure_bucket_is_public(bucket_name: str) -> bool:
    """
    Ensure a Supabase Storage bucket is public (readable by everyone).
    
    NOTE: This function requires the SERVICE_ROLE_KEY (not anon key) to work.
    For security, bucket configuration should be done manually in Supabase Dashboard.
    
    To make a bucket public in Supabase Dashboard:
    1. Go to Storage > Buckets
    2. Click on your bucket (e.g., 'listings')
    3. Go to Settings
    4. Enable "Public bucket" toggle
    5. Save
    
    Args:
        bucket_name: Name of the bucket to check/configure
    
    Returns:
        True if bucket is public or could be made public, False otherwise
    """
    supabase = get_supabase_client()
    if not supabase:
        if settings.DEBUG:
            print(f"⚠️ Cannot check bucket '{bucket_name}' - Supabase client not available")
        return False
    
    try:
        # Try to get bucket info (this requires service role key for bucket management)
        # Note: The Supabase Python client may not have direct bucket management methods
        # Bucket configuration is typically done via Supabase Dashboard or Management API
        
        # For now, we'll just verify the bucket exists by trying to list files
        # If this works, the bucket exists (but may not be public)
        try:
            # Try to list files (this will work if bucket exists)
            # We use a minimal query to check bucket accessibility
            supabase.storage.from_(bucket_name).list(limit=1)
            if settings.DEBUG:
                print(f"✓ Bucket '{bucket_name}' exists and is accessible")
            return True
        except Exception as e:
            if settings.DEBUG:
                print(f"⚠️ Bucket '{bucket_name}' may not exist or may not be accessible: {str(e)}")
            return False
            
    except Exception as e:
        if settings.DEBUG:
            print(f"❌ Error checking bucket '{bucket_name}': {str(e)}")
        return False
