import os
import sys
import django
from pathlib import Path
from dotenv import load_dotenv

# Load .env
load_dotenv()

# Set Django settings - must be done before setup
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'airbcar_backend.settings')

# Add to path
sys.path.insert(0, str(Path(__file__).parent))

# Setup Django
django.setup()

from io import BytesIO
from common.utils import upload_file_to_supabase

# Create a test image
png_header = b'\x89PNG\r\n\x1a\n'
test_content = png_header + b'\x00' * 100

test_file = BytesIO(test_content)
test_file.name = 'backend_test.png'
test_file.content_type = 'image/png'

try:
    url = upload_file_to_supabase(test_file, folder="test")
    print("✅ Backend upload test PASSED!")
    print(f"URL: {url}")
except Exception as e:
    print(f"❌ Backend upload test FAILED: {e}")
    import traceback
    traceback.print_exc()
