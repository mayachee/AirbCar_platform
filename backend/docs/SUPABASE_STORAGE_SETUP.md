# Supabase Storage Setup Guide

## Overview
All images and documents are now stored in Supabase Storage instead of local filesystem. This ensures files persist across server restarts and redeployments on Render.

## Required Supabase Buckets

You need to create the following bucket in Supabase Dashboard:

### 1. `listings` Bucket (Main Bucket)
This bucket stores all files organized in folders:

- **`listings/`** - Vehicle listing images
- **`partner_logos/`** - Partner company logos
- **`user_documents/identity/`** - User identity documents (ID front/back)
- **`user_documents/license/`** - User driver license documents (front/back)
- **`user_documents/profiles/`** - User profile pictures
- **`booking_documents/identity/`** - Booking identity documents

## Setup Instructions

### Step 1: Create the Bucket
1. Go to your Supabase Dashboard
2. Navigate to **Storage** → **Buckets**
3. Click **New Bucket**
4. Name: `listings`
5. **IMPORTANT**: Enable **"Public bucket"** toggle
6. Click **Create bucket**

### Step 2: Configure Environment Variables
Add these to your Render environment variables:

**Option A: Via Render Dashboard (Recommended)**
1. Go to your Render Dashboard
2. Select your `airbcar-backend` service
3. Go to **Environment** tab
4. Click **Add Environment Variable**
5. Add these two variables:
   - **Key**: `SUPABASE_URL`
     **Value**: `https://your-project-id.supabase.co` (get from Supabase Dashboard → Settings → API → Project URL)
   - **Key**: `SUPABASE_ANON_KEY`
     **Value**: `your-anon-key-here` (get from Supabase Dashboard → Settings → API → anon/public key)

**Option B: Via render.yaml**
The `render.yaml` file has been updated with placeholders. Set the values manually in Render Dashboard (they're marked as `sync: false` for security).

**Where to find your Supabase credentials:**
1. Go to Supabase Dashboard
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → Use as `SUPABASE_URL`
   - **anon public** key → Use as `SUPABASE_ANON_KEY`

### Step 3: Verify Bucket is Public
1. Go to Storage → Buckets → `listings`
2. Click **Settings**
3. Ensure **"Public bucket"** is enabled
4. Save if needed

## File Organization

All files are organized in the `listings` bucket with the following structure:

```
listings/
├── listings/
│   └── [uuid].jpg/png  (Vehicle images)
├── partner_logos/
│   └── [user_id]_[uuid].jpg/png  (Partner logos)
├── user_documents/
│   ├── identity/
│   │   └── [user_id]_[uuid].jpg/png  (ID documents)
│   ├── license/
│   │   └── [user_id]_[uuid].jpg/png  (License documents)
│   └── profiles/
│       └── [user_id]_[uuid].jpg/png  (Profile pictures)
└── booking_documents/
    └── identity/
        └── [user_id]_[uuid].jpg/png  (Booking ID documents)
```

## What's Stored in Supabase

✅ **Vehicle Images** - All listing images  
✅ **Partner Logos** - Company logos  
✅ **User Identity Documents** - ID front/back  
✅ **User License Documents** - License front/back  
✅ **User Profile Pictures** - Profile photos  
✅ **Booking Documents** - ID documents uploaded during booking  

## Important Notes

1. **All uploads require Supabase** - Local file storage is disabled
2. **Bucket must be PUBLIC** - Otherwise images won't be accessible
3. **Files are organized by type** - Makes management easier
4. **Unique filenames** - UUIDs prevent conflicts
5. **User ID prefix** - Helps identify file ownership

## Troubleshooting

### Images return 404
- Check that bucket is set to **PUBLIC**
- Verify `SUPABASE_URL` and `SUPABASE_ANON_KEY` are set
- Check Supabase Dashboard → Storage → Files to see if files are uploaded

### Upload fails
- Verify Supabase credentials in environment variables
- Check bucket exists and is accessible
- Ensure bucket is PUBLIC
- Check server logs for detailed error messages

### Old local URLs still showing
- Old images with local URLs (`/media/...`) are automatically filtered out
- Users need to re-upload images to get Supabase URLs
- New uploads will automatically use Supabase

