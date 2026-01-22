import os
import uuid
import logging
from supabase import create_client

logger = logging.getLogger(__name__)

# Get Supabase credentials from environment variables
SUPABASE_URL = os.environ.get('SUPABASE_URL', '')
SUPABASE_ANON_KEY = os.environ.get('SUPABASE_ANON_KEY', '')
SUPABASE_SERVICE_ROLE_KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY', '')

# Supabase bucket names from environment
SUPABASE_STORAGE_BUCKET_PICS = os.environ.get('SUPABASE_STORAGE_BUCKET_PICS', 'pics')
SUPABASE_STORAGE_BUCKET_LISTINGS = os.environ.get('SUPABASE_STORAGE_BUCKET_LISTINGS', 'listings')

# Initialize Supabase client with service role key if available (for server-side operations)
# Fall back to anon key if service role key is not available
if SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    logger.info("✓ Supabase client initialized with service role key")
elif SUPABASE_URL and SUPABASE_ANON_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
    logger.warning("⚠ Supabase client initialized with anon key (consider using service role key for uploads)")
else:
    supabase = None
    logger.error("❌ Supabase credentials not configured! Set SUPABASE_URL and SUPABASE_ANON_KEY (or SUPABASE_SERVICE_ROLE_KEY)")


def upload_file_to_supabase(file, folder="listings", bucket=None):
    """
    Upload a file to Supabase storage and return the public URL.
    
    Args:
        file: File object to upload
        folder: Folder path in the bucket (default: "listings")
        bucket: Bucket name (default: from SUPABASE_STORAGE_BUCKET_PICS env var, can be "listings")
    
    Returns:
        Public URL of the uploaded file or None if upload fails
    
    Raises:
        ValueError: If Supabase is not configured
        Exception: If upload fails
    """
    if not supabase:
        logger.error("❌ Cannot upload file: Supabase client not initialized")
        raise ValueError("Supabase is not configured. Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables.")
    
    # Use environment variable if bucket not specified
    if bucket is None:
        bucket = SUPABASE_STORAGE_BUCKET_PICS
    
    try:
        # Validate file
        if not file:
            raise ValueError("File object is empty")
        
        # Reset file position
        file.seek(0)
        file_content = file.read()
        
        if not file_content:
            raise ValueError("File has no content")
        
        # Get file extension
        filename = getattr(file, 'name', 'upload')
        file_ext = os.path.splitext(filename)[1] or '.jpg'
        
        # Generate unique filename
        unique_filename = f"{folder}/{uuid.uuid4()}{file_ext}"
        
        # Determine content type based on file extension
        content_type = getattr(file, 'content_type', 'image/jpeg')
        if not content_type or content_type == 'application/octet-stream':
            # Try to guess content type from extension
            ext_to_type = {
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.png': 'image/png',
                '.gif': 'image/gif',
                '.webp': 'image/webp',
                '.pdf': 'application/pdf',
            }
            content_type = ext_to_type.get(file_ext.lower(), 'image/jpeg')
        
        logger.info(f"📤 Uploading file to bucket '{bucket}': {unique_filename} ({content_type})")
        
        # Upload to Supabase
        response = supabase.storage.from_(bucket).upload(
            unique_filename,
            file_content,
            {"content-type": content_type}
        )
        
        logger.info(f"✓ File uploaded successfully: {unique_filename}")
        
        # Construct public URL
        public_url = f"{SUPABASE_URL}/storage/v1/object/public/{bucket}/{unique_filename}"
        
        logger.info(f"✓ Public URL: {public_url}")
        
        return public_url
    
    except Exception as e:
        logger.error(f"❌ Error uploading file to Supabase: {str(e)}", exc_info=True)
        # Re-raise the exception so the view can handle it
        raise

