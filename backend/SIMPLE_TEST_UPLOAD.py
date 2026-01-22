#!/usr/bin/env python
"""
Simple Supabase upload test - no Django required
"""

import os
from pathlib import Path
from io import BytesIO
from dotenv import load_dotenv

# Load .env file
env_file = Path(__file__).parent / '.env'
if not env_file.exists():
    print("❌ ERROR: .env file not found!")
    print(f"   Expected at: {env_file}")
    sys.exit(1)

load_dotenv(env_file)

def test_upload():
    """Test file upload to Supabase"""
    print("\n" + "="*70)
    print("🧪 SUPABASE UPLOAD TEST (Simple)")
    print("="*70)
    
    # Check environment
    supabase_url = os.environ.get('SUPABASE_URL', '')
    supabase_key = os.environ.get('SUPABASE_ANON_KEY', '')
    supabase_service_key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY', '')
    
    print("\n📋 Configuration:")
    print(f"  SUPABASE_URL: {'✓' if supabase_url else '❌'} {supabase_url[:30]}...")
    print(f"  SUPABASE_ANON_KEY: {'✓' if supabase_key else '❌'}")
    print(f"  SUPABASE_SERVICE_ROLE_KEY: {'✓' if supabase_service_key else '❌'}")
    
    if not supabase_url or not supabase_key:
        print("\n❌ Missing Supabase credentials in .env")
        return False
    
    try:
        from supabase import create_client
        
        # Create client with service role key (better for uploads)
        if supabase_service_key:
            client = create_client(supabase_url, supabase_service_key)
            print("\n✓ Using service role key for uploads")
        else:
            client = create_client(supabase_url, supabase_key)
            print("\n✓ Using anon key for uploads")
        
        # List buckets
        print("\n📦 Available buckets:")
        try:
            buckets = client.storage.list_buckets()
            if buckets:
                for bucket in buckets:
                    print(f"   ✓ {bucket.name}")
            else:
                print("   ⚠️  No buckets found!")
                print("\n   ⚠️  YOU NEED TO CREATE BUCKETS FIRST!")
                print("   Go to: https://app.supabase.com/project/YOUR_PROJECT_ID/storage/buckets")
                print("   Create these buckets:")
                print("   1. 'pics' (for logos and images)")
                print("   2. 'listings' (for car pictures)")
                return False
        except Exception as e:
            print(f"   ⚠️  Could not list buckets: {str(e)}")
            print(f"   Error details: {type(e).__name__}")
            return False
        
        # Try uploading a test file
        print("\n📝 Creating test image...")
        png_header = b'\x89PNG\r\n\x1a\n'
        test_content = png_header + b'\x00' * 100
        
        test_file = BytesIO(test_content)
        test_file.name = 'test_upload.png'
        
        print(f"   Size: {len(test_content)} bytes")
        print(f"   Name: test_upload.png")
        
        # Get bucket name from environment
        bucket_name = os.environ.get('SUPABASE_STORAGE_BUCKET_PICS', 'Pics')
        
        # Try upload to correct bucket
        print(f"\n📤 Uploading test file to '{bucket_name}' bucket...")
        try:
            response = client.storage.from_(bucket_name).upload(
                'test_uploads/test_file.png',
                test_content,
                {"content-type": "image/png"}
            )
            print("✅ File uploaded successfully!")
            
            # Generate public URL
            public_url = f"{supabase_url}/storage/v1/object/public/{bucket_name}/test_uploads/test_file.png"
            print(f"\n✓ Public URL: {public_url}")
            
            print("\n" + "="*70)
            print("✅ SUCCESS - File uploads are working!")
            print("="*70)
            return True
            
        except Exception as upload_error:
            print(f"❌ Upload failed: {str(upload_error)}")
            print(f"\nError type: {type(upload_error).__name__}")
            
            # Check if it's a bucket not found error
            if "not found" in str(upload_error).lower():
                print("\n⚠️  Bucket 'pics' not found!")
                print("   Please create the 'pics' bucket first")
            elif "permission" in str(upload_error).lower() or "unauthorized" in str(upload_error).lower():
                print("\n⚠️  Permission error - check bucket policies")
            
            return False
    
    except ImportError:
        print("❌ supabase-py library not installed")
        print("   Run: pip install supabase")
        return False
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    import sys
    try:
        success = test_upload()
        if success:
            sys.exit(0)
        else:
            sys.exit(1)
    except KeyboardInterrupt:
        print("\n\n⚠️  Test interrupted by user")
        sys.exit(1)
