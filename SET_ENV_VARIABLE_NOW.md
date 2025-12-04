# ⚠️ URGENT: Set Environment Variable to Fix Frontend

## 🔴 The Problem

Your frontend is trying to connect to `localhost:8000` instead of your Render backend because the environment variable is **NOT SET**.

## ✅ Quick Fix (5 minutes)

### If Frontend is on Vercel:

1. **Go to Vercel Dashboard**: https://vercel.com/dashboard
2. **Click your project** (AirbCar or similar)
3. **Go to Settings** → **Environment Variables**
4. **Click "Add New"**
5. **Enter:**
   - **Key:** `NEXT_PUBLIC_DJANGO_API_URL`
   - **Value:** `https://airbcar-backend.onrender.com`
   - **Environment:** Select **ALL** (Production, Preview, Development)
6. **Click "Save"**
7. **Redeploy:**
   - Go to **Deployments** tab
   - Click **3 dots** on latest deployment
   - Click **Redeploy**
   - Wait 2-3 minutes

### If Frontend is on Render:

1. **Go to Render Dashboard**: https://dashboard.render.com
2. **Find your frontend service**
3. **Click on it**
4. **Go to "Environment" tab**
5. **Click "Add Environment Variable"**
6. **Enter:**
   - **Key:** `NEXT_PUBLIC_DJANGO_API_URL`
   - **Value:** `https://airbcar-backend.onrender.com`
7. **Click "Save Changes"**
8. **Service will auto-redeploy**

## 🧪 Verify It's Working

After redeploy:

1. **Open your frontend website**
2. **Open browser DevTools** (F12)
3. **Go to Network tab**
4. **Try to search for a car or login**
5. **Check the requests** - they should go to:
   - ✅ `https://airbcar-backend.onrender.com/api/...`
   - ❌ NOT `http://localhost:8000/...`

## 📋 Important Notes

- **Variable name MUST start with `NEXT_PUBLIC_`** (Next.js requirement)
- **You MUST redeploy** after setting the variable
- **Replace `airbcar-backend.onrender.com`** with your actual Render backend URL if different
- **The `ERR_BLOCKED_BY_CLIENT`** is from ad blockers - ignore it, the real issue is the wrong URL

## 🎯 What This Fixes

- ✅ Login will work
- ✅ Search will work  
- ✅ All API calls will go to Render backend
- ✅ No more localhost errors

**This is the ONLY thing you need to do to fix your website!**


