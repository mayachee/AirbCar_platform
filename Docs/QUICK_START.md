# 🚀 QUICK START - FILE UPLOAD FIX

## TL;DR (30 seconds)

Your files weren't uploading because:
1. **Hardcoded expired credentials** in backend code
2. **Wrong bucket name** ("Pics" vs "pics")
3. **No error handling** = silent failures

### Quick Fix:

```bash
# 1. Copy template
cp env.sample .env

# 2. Edit .env - add your Supabase credentials:
# SUPABASE_URL=https://your-project.supabase.co
# SUPABASE_ANON_KEY=eyJhbGci...
# SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# 3. Verify (from backend folder)
python CHECK_SUPABASE_CONFIG.py

# 4. Restart backend
# Ctrl+C, then: python manage.py runserver

# 5. Done! Try uploading pictures now
```

---

## Getting Credentials (1 minute)

1. Go: https://app.supabase.com
2. Select your project
3. Click: Settings → API
4. Copy these values:
   - **Project URL** → SUPABASE_URL
   - **anon public** → SUPABASE_ANON_KEY  
   - **service_role secret** → SUPABASE_SERVICE_ROLE_KEY

---

## Verify Setup (2 minutes)

```bash
cd backend

# Check configuration
python CHECK_SUPABASE_CONFIG.py

# Should see ✅ all green

# Test upload
python TEST_SUPABASE_UPLOAD.py

# Should see ✅ success
```

---

## Test Upload (5 minutes)

1. Open: http://localhost:3001
2. Log in as partner
3. Click "Add Vehicle"
4. Fill details + **Upload Pictures**
5. Click Save
6. ✅ Pictures should now appear!

---

## Quick Troubleshooting

| Error | Fix |
|-------|-----|
| "Missing env variables" | Did you copy env.sample to .env? |
| "Cannot connect" | Check SUPABASE_URL & SUPABASE_ANON_KEY in .env |
| "Bucket not found" | Create 'pics' and 'listings' buckets in Supabase |
| "Access Denied" | Add policies to buckets (ask in Supabase docs) |
| "Pictures still not showing" | Restart backend + hard refresh browser (Ctrl+Shift+R) |

---

## Check Backend Logs

```bash
# While uploading, you should see:
# ✓ Successfully uploaded picture
# ✓ File uploaded successfully
# ✓ Public URL: https://...

# If you see errors, debug is easier now!
```

---

## Files Modified

✅ Fixed:
- `backend/common/utils.py` - Credentials now from env, with error handling
- `backend/listings/views.py` - Better error handling
- `backend/partners/views.py` - Better error handling
- `env.sample` - Added Supabase template

✅ Created:
- `CHECK_SUPABASE_CONFIG.py` - Run this to verify!
- `TEST_SUPABASE_UPLOAD.py` - Test uploads
- `SUPABASE_FILE_UPLOAD_FIX.md` - Full guide
- `BEFORE_AFTER_COMPARISON.md` - What changed
- `IMPLEMENTATION_CHECKLIST.md` - Step-by-step

---

## Need More Help?

📖 Read these (in order):
1. `IMPLEMENTATION_CHECKLIST.md` - Step-by-step guide
2. `SUPABASE_FILE_UPLOAD_FIX.md` - Detailed troubleshooting
3. `BEFORE_AFTER_COMPARISON.md` - Understand the fix

🔍 Run these:
```bash
python CHECK_SUPABASE_CONFIG.py   # Verify setup
python TEST_SUPABASE_UPLOAD.py    # Test upload
tail -f backend.log                # Watch logs
```

---

## That's It!

Credentials → Check → Restart → Test

**30 minutes to working uploads** 🎉
