# FILE UPLOAD TROUBLESHOOTING GUIDE

## Problem: Files are not uploading (pictures stay empty when creating listings)

### Quick Diagnosis
Run the configuration checker to verify your setup:
```bash
cd backend
python CHECK_SUPABASE_CONFIG.py
```

---

## Root Causes & Solutions

### ❌ Issue 1: Missing Supabase Credentials

**Symptoms:**
- Listings are created but pictures field is empty
- Backend logs show: "Supabase client not initialized"

**Solution:**
1. Copy `env.sample` to `.env` (in project root):
   ```bash
   cp env.sample .env
   ```

2. Get your credentials from Supabase Dashboard:
   - Go to https://app.supabase.com
   - Select your project
   - Click "Settings" → "API"
   - Copy the values:
     - **Project URL** → `SUPABASE_URL`
     - **anon public** → `SUPABASE_ANON_KEY`
     - **service_role secret** → `SUPABASE_SERVICE_ROLE_KEY` (optional but recommended)

3. Add them to `.env`:
   ```
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

4. Restart the backend:
   ```bash
   # Kill the current process (Ctrl+C)
   python manage.py runserver
   ```

---

### ❌ Issue 2: Incorrect Bucket Names

**Symptoms:**
- Backend logs show: "Bucket not found" or "Access denied"
- Upload fails silently

**Current Setup:**
- You have two buckets: `pics` and `listings`
- Code now references these correctly (lowercased)

**Solution:**
1. Verify buckets exist in Supabase:
   - Go to Storage → Buckets
   - Should see: `pics` and `listings`
   - If missing, create them

2. If buckets have different names, set them in `.env`:
   ```
   SUPABASE_STORAGE_BUCKET_PICS=your-pics-bucket-name
   SUPABASE_STORAGE_BUCKET_LISTINGS=your-listings-bucket-name
   ```

---

### ❌ Issue 3: Bucket Permissions/Policies Not Set

**Symptoms:**
- Backend logs show: "Access Denied" or "Permission Denied"
- Files upload but URLs don't work

**Solution:**
1. Go to your Supabase Dashboard:
   - Storage → Select `pics` bucket → Policies tab

2. Click "Create a policy" or "New policy":
   - Policy name: `Allow authenticated users to upload`
   - Target roles: `authenticated`
   - Allowed operations: Check `INSERT`, `SELECT`, `UPDATE`, `DELETE`
   - Click "Save"

3. Add another policy for public read access:
   - Policy name: `Allow public read`
   - Target roles: `anon`
   - Allowed operations: Check `SELECT`
   - Click "Save"

4. Repeat for `listings` bucket

**Template Policy (if manual):**
```sql
-- For authenticated uploads
create policy "Allow authenticated users to upload"
on storage.objects
for all
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

-- For public read
create policy "Allow public read"
on storage.objects
for select
using (true);
```

---

### ❌ Issue 4: Hardcoded Credentials (FIXED)

**Status:** ✅ Already Fixed

The backend was using hardcoded Supabase URL and key, which could have expired or been invalid.

**What Was Fixed:**
- ✅ Removed hardcoded credentials from `common/utils.py`
- ✅ Now uses environment variables
- ✅ Added proper error handling and logging
- ✅ Fixed bucket name from "Pics" (mixed case) to "pics" (lowercase)
- ✅ Added support for `SUPABASE_SERVICE_ROLE_KEY` (more secure for server-side uploads)

---

## Testing Your Setup

### Step 1: Verify Configuration
```bash
cd backend
python CHECK_SUPABASE_CONFIG.py
```

Expected output:
```
✓ SUPABASE_URL: https://xxxx.supabase.co
✓ SUPABASE_ANON_KEY: eyJh...
✓ SUPABASE_SERVICE_ROLE_KEY: eyJh...
✓ Found 2 bucket(s):
   └─ pics
   └─ listings
```

### Step 2: Test Upload Directly
Create a test script `backend/TEST_UPLOAD.py`:
```python
import os
import sys
from pathlib import Path
from io import BytesIO
from dotenv import load_dotenv

# Load .env
env_file = Path(__file__).parent / '.env'
load_dotenv(env_file)

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent))

# Import after setting up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'airbcar_backend.settings')
import django
django.setup()

from common.utils import upload_file_to_supabase

# Create a test image
test_image = BytesIO(b'\x89PNG\r\n\x1a\n' + b'\x00' * 100)  # Minimal PNG header
test_image.name = 'test.png'
test_image.content_type = 'image/png'

try:
    print("Testing file upload...")
    url = upload_file_to_supabase(test_image, folder="test")
    print(f"✅ Upload successful! URL: {url}")
except Exception as e:
    print(f"❌ Upload failed: {str(e)}")
```

Run it:
```bash
cd backend
python TEST_UPLOAD.py
```

### Step 3: Test Through UI
1. Log in to partner dashboard
2. Click "Add Vehicle"
3. Fill in all fields
4. Upload some car pictures
5. Click "Save"

**Check logs for upload messages:**
```bash
# Watch backend logs (in another terminal)
tail -f backend.log
```

Look for messages like:
```
✓ Successfully uploaded file to bucket 'listings': listings/123/uuid.jpg
✓ Public URL: https://xxxx.supabase.co/storage/v1/object/public/listings/...
```

---

## Common Error Messages & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| `Supabase client not initialized` | Missing credentials | Add `SUPABASE_URL` and `SUPABASE_ANON_KEY` to `.env` |
| `Bucket 'pics' does not exist` | Wrong bucket name or bucket not created | Create buckets in Supabase or check bucket names |
| `Access Denied` | Missing bucket policies | Add policies to buckets in Supabase |
| `Invalid credentials` | Wrong API key | Copy correct key from Supabase → Settings → API |
| `403 Forbidden` | Insufficient permissions | Update bucket policies to allow uploads |
| `Connection refused` | Supabase service down | Check https://status.supabase.com |
| `File has no content` | Empty file uploaded | Check file is properly selected on frontend |

---

## Backend Logging

The backend now logs all file upload attempts. Check logs for detailed information:

```bash
# View recent logs
python manage.py tail_logs

# Or use tail
tail -f backend.log

# Or use runserver with increased verbosity
python manage.py runserver --verbosity 3
```

**Look for:**
- ✅ `✓ Successfully uploaded` - upload worked
- ⚠️ `⚠ Some pictures failed` - partial upload failure
- ❌ `❌ Error uploading file` - complete failure

---

## Files Modified

✅ **Fixed in this update:**
1. `backend/common/utils.py` - Now uses environment variables
2. `backend/airbcar_backend/settings.py` - Added Supabase configuration
3. `backend/listings/views.py` - Added error handling for uploads
4. `backend/partners/views.py` - Added error handling for uploads
5. `env.sample` - Added Supabase variables template

---

## Next Steps

1. **Update your `.env` file** with Supabase credentials
2. **Restart the backend server**
3. **Run the configuration checker**: `python CHECK_SUPABASE_CONFIG.py`
4. **Test file upload** through the UI
5. **Check backend logs** for any errors

If issues persist, please share:
- Output from `CHECK_SUPABASE_CONFIG.py`
- Backend logs showing the upload attempt
- Error message from browser console (F12 → Console)
