#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Test Supabase upload functionality
Run this after updating your .env file to verify everything works
"""

import os
import sys
from pathlib import Path
from io import BytesIO
from dotenv import load_dotenv

# Add backend to path FIRST
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

# Load .env file BEFORE Django setup
env_file = backend_dir / '.env'
if not env_file.exists():
    print("❌ ERROR: .env file not found!")
    print(f"   Expected at: {env_file}")
    print("\n   Please create .env by running:")
    print("   cp env.sample .env")
    print("\n   Then add your Supabase credentials")
    sys.exit(1)

load_dotenv(env_file, override=True)

# Navigate to the Django project directory
django_dir = backend_dir / 'airbcar_backend'
os.chdir(django_dir)
sys.path.insert(0, str(django_dir))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'airbcar_backend.settings')
import django
django.setup()

# Import from backend (one level up)
sys.path.insert(0, str(backend_dir))
from common.utils import upload_file_to_supabase

def test_upload():
    """Test file upload to Supabase"""
    print("\n" + "="*70)
    print("🧪 SUPABASE UPLOAD TEST")
    print("="*70)
    
    # Check environment
    supabase_url = os.environ.get('SUPABASE_URL', '')
    supabase_key = os.environ.get('SUPABASE_ANON_KEY', '')
    
    print("\n📋 Configuration:")
    print(f"  SUPABASE_URL: {'✓' if supabase_url else '❌'}")
    print(f"  SUPABASE_ANON_KEY: {'✓' if supabase_key else '❌'}")
    
    if not supabase_url or not supabase_key:
        print("\n❌ Missing Supabase credentials in .env")
        return False
    
    # Create test image (minimal valid PNG)
    print("\n📝 Creating test image...")
    png_header = b'\x89PNG\r\n\x1a\n'
    test_content = png_header + b'\x00' * 100
    
    test_file = BytesIO(test_content)
    test_file.name = 'test_upload.png'
    test_file.content_type = 'image/png'
    
    print(f"   Size: {len(test_content)} bytes")
    print(f"   Name: {test_file.name}")
    print(f"   Type: {test_file.content_type}")
    
    # Test upload
    print("\n📤 Uploading to Supabase...")
    try:
        url = upload_file_to_supabase(test_file, folder="test_uploads")
        print(f"\n✅ SUCCESS! File uploaded to:")
        print(f"   {url}")
        
        print("\n💡 What this means:")
        print("   ✓ Supabase credentials are valid")
        print("   ✓ Bucket 'pics' exists and is accessible")
        print("   ✓ Your listings should now accept picture uploads")
        
        return True
        
    except ValueError as e:
        print(f"\n❌ Configuration Error: {str(e)}")
        print("\n💡 Fix:")
        print("   • Make sure SUPABASE_URL and SUPABASE_ANON_KEY are set in .env")
        print("   • Check the values are correct (from Supabase Dashboard)")
        return False
        
    except Exception as e:
        print(f"\n❌ Upload Failed: {str(e)}")
        print("\n💡 Possible causes:")
        print("   • Bucket 'pics' doesn't exist in Supabase")
        print("   • Bucket doesn't have upload permissions")
        print("   • Network connection issue")
        print("   • Supabase service is down")
        print("\n   Check https://status.supabase.com for service status")
        return False

if __name__ == '__main__':
    try:
        success = test_upload()
        
        if success:
            print("\n" + "="*70)
            print("✅ TEST PASSED - Ready for production!")
            print("="*70)
            sys.exit(0)
        else:
            print("\n" + "="*70)
            print("❌ TEST FAILED - See errors above")
            print("="*70)
            sys.exit(1)
            
    except KeyboardInterrupt:
        print("\n\n⚠️  Test interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected error: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
