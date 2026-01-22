#!/usr/bin/env python
"""
Supabase Configuration Checker
This script verifies that your Supabase configuration is correct and tests file uploads.
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file
env_file = Path(__file__).parent / '.env'
if env_file.exists():
    load_dotenv(env_file)
else:
    print("⚠️  .env file not found. Using environment variables from system.")

def check_config():
    """Check if Supabase is properly configured"""
    print("\n" + "="*70)
    print("🔍 SUPABASE CONFIGURATION CHECK")
    print("="*70)
    
    # Check for required environment variables
    required_vars = {
        'SUPABASE_URL': 'Supabase project URL (https://xxxx.supabase.co)',
        'SUPABASE_ANON_KEY': 'Supabase anonymous key (public)',
    }
    
    optional_vars = {
        'SUPABASE_SERVICE_ROLE_KEY': 'Supabase service role key (for server-side uploads)',
        'SUPABASE_STORAGE_BUCKET_PICS': 'Bucket name for pictures (default: pics)',
        'SUPABASE_STORAGE_BUCKET_LISTINGS': 'Bucket name for listings (default: listings)',
    }
    
    all_good = True
    
    print("\n📋 REQUIRED CONFIGURATION:")
    print("-" * 70)
    for var, description in required_vars.items():
        value = os.environ.get(var, '')
        if not value:
            print(f"❌ {var}")
            print(f"   └─ {description}")
            all_good = False
        else:
            # Mask sensitive values
            masked_value = value[:20] + '...' if len(value) > 20 else value
            print(f"✓ {var}: {masked_value}")
    
    print("\n📋 OPTIONAL CONFIGURATION:")
    print("-" * 70)
    for var, description in optional_vars.items():
        value = os.environ.get(var, '')
        if value:
            masked_value = value[:20] + '...' if len(value) > 20 else value
            print(f"✓ {var}: {masked_value}")
        else:
            default_value = os.environ.get(var, 'default')
            print(f"⚠️  {var}: (not set, using default)")
    
    print("\n📊 DATABASE CONFIGURATION:")
    print("-" * 70)
    db_vars = {
        'DATABASE_HOST': 'Supabase PostgreSQL host',
        'DATABASE_PORT': 'Database port',
        'DATABASE_NAME': 'Database name',
        'DATABASE_USER': 'Database user',
    }
    for var, description in db_vars.items():
        value = os.environ.get(var, '')
        if value:
            print(f"✓ {var}: {value}")
        else:
            print(f"❌ {var}: NOT SET")
            all_good = False
    
    if all_good:
        print("\n✅ All required environment variables are set!")
    else:
        print("\n❌ Some required environment variables are missing!")
        print("\n💡 To fix this:")
        print("   1. Copy env.sample to .env")
        print("   2. Edit .env and add your Supabase credentials")
        print("   3. Get credentials from: https://app.supabase.com/project/YOUR_PROJECT/settings/api")
    
    return all_good

def test_supabase_connection():
    """Test connection to Supabase"""
    print("\n" + "="*70)
    print("🧪 TESTING SUPABASE CONNECTION")
    print("="*70)
    
    supabase_url = os.environ.get('SUPABASE_URL', '')
    supabase_key = os.environ.get('SUPABASE_ANON_KEY', '')
    
    if not supabase_url or not supabase_key:
        print("\n❌ Cannot test connection: Missing SUPABASE_URL or SUPABASE_ANON_KEY")
        return False
    
    try:
        from supabase import create_client
        print("\n📡 Attempting to connect to Supabase...")
        
        # Try with anon key first
        client = create_client(supabase_url, supabase_key)
        print("✓ Successfully connected to Supabase with anon key")
        
        # Check storage buckets
        print("\n📦 Checking storage buckets...")
        try:
            buckets = client.storage.list_buckets()
            if buckets:
                print(f"✓ Found {len(buckets)} bucket(s):")
                for bucket in buckets:
                    bucket_name = bucket.name
                    print(f"   └─ {bucket_name}")
            else:
                print("⚠️  No buckets found in Supabase storage")
        except Exception as e:
            print(f"⚠️  Could not list buckets: {str(e)}")
        
        return True
        
    except ImportError:
        print("❌ supabase-py library not installed")
        print("   Run: pip install supabase")
        return False
    except Exception as e:
        print(f"❌ Failed to connect to Supabase: {str(e)}")
        return False

def show_setup_instructions():
    """Show setup instructions"""
    print("\n" + "="*70)
    print("📖 SETUP INSTRUCTIONS")
    print("="*70)
    
    print("""
1. GET YOUR SUPABASE CREDENTIALS:
   • Go to https://app.supabase.com/project/YOUR_PROJECT_ID/settings/api
   • Copy "Project URL" → paste as SUPABASE_URL
   • Copy "anon public" key → paste as SUPABASE_ANON_KEY
   • Copy "service_role secret" key → paste as SUPABASE_SERVICE_ROLE_KEY

2. CONFIGURE YOUR BUCKETS:
   • Go to https://app.supabase.com/project/YOUR_PROJECT_ID/storage/buckets
   • You should have two buckets: 'pics' and 'listings'
   • If they don't exist, create them:
     - Create bucket named 'pics' (for partner logos and misc files)
     - Create bucket named 'listings' (for car pictures)

3. SET BUCKET PERMISSIONS:
   • Select each bucket
   • Go to "Policies" tab
   • Add a policy to allow authenticated users to upload:
     - Allow SELECT, INSERT, UPDATE for authenticated users
     - Allow SELECT for anon (public read access)

4. UPDATE YOUR .ENV FILE:
   • Copy env.sample to .env if not already done
   • Add the credentials you copied:
     SUPABASE_URL=https://your-project-id.supabase.co
     SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiI...
     SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiI...

5. RESTART YOUR BACKEND:
   • Kill the running backend process
   • Run: python manage.py runserver (or your production command)

6. TEST FILE UPLOAD:
   • Go to your partner dashboard
   • Try creating a new vehicle with pictures
   • Check the browser console for any errors
   • Check the backend logs for upload details
""")

def main():
    print("\n")
    print("╔══════════════════════════════════════════════════════════════════╗")
    print("║                  SUPABASE CONFIGURATION CHECKER                  ║")
    print("╚══════════════════════════════════════════════════════════════════╝")
    
    # Check configuration
    config_ok = check_config()
    
    # Test connection
    if config_ok:
        conn_ok = test_supabase_connection()
    else:
        print("\n⚠️  Skipping connection test due to missing configuration")
        conn_ok = False
    
    # Show setup instructions
    show_setup_instructions()
    
    # Summary
    print("\n" + "="*70)
    print("📝 SUMMARY")
    print("="*70)
    if config_ok and conn_ok:
        print("✅ Your Supabase configuration looks good!")
        print("   File uploads should work. If you're still having issues:")
        print("   1. Check that your buckets exist in Supabase")
        print("   2. Check bucket permissions/policies")
        print("   3. Review backend logs for specific errors")
    else:
        print("❌ Configuration issues detected. Please follow the setup instructions above.")
    
    print("\n")

if __name__ == '__main__':
    main()
