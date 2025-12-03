# Fix 503 Service Unavailable Error

## 🔴 Problem: 503 Service Unavailable

Your backend at `https://airbcar-backend.onrender.com` is returning 503, which means the service is not running.

## ✅ Step-by-Step Fix

### Step 1: Check Service Status in Render Dashboard

1. Go to: https://dashboard.render.com/web/srv-d4ob2ta4i8rc73evm77g
2. Look at the top - what does it say?
   - **"Live" (green)** = Service is running (might be spinning up)
   - **"Stopped" (red)** = Service crashed
   - **"Building"** = Still deploying

### Step 2: Check Logs (Most Important!)

1. Click the **"Logs"** tab in Render dashboard
2. Scroll to the bottom to see the most recent logs
3. Look for:
   - ❌ **Red error messages** - These tell you what's wrong
   - ✅ **"Starting gunicorn"** - Good sign
   - ❌ **"Error loading psycopg"** - Database issue
   - ❌ **"ImproperlyConfigured"** - Missing environment variable

### Step 3: Verify Environment Variables (CRITICAL!)

**This is the #1 cause of 503 errors!**

1. In Render dashboard, click **"Environment"** tab
2. **Verify these 3 variables are set:**

```
DATABASE_PASSWORD = Mayache+123455
SECRET_KEY = AHZHdcJj7GgqAbvqbOZSK-RpA4tAws7NmvGK1hdp7GLXySV7CM2YY3XJ677PQZ_QmkE
EMAIL_HOST_PASSWORD = rmqjpvkmekdiugnz
```

3. If any are missing:
   - Click **"Add Environment Variable"**
   - Enter the key and value
   - Click **"Save Changes"**
   - Service will automatically redeploy

### Step 4: Common Issues and Fixes

#### Issue 1: Missing SECRET_KEY
**Error in logs:** `ImproperlyConfigured: SECRET_KEY`
**Fix:** Add `SECRET_KEY` environment variable

#### Issue 2: Database Connection Failed
**Error in logs:** `Error loading psycopg` or `connection refused`
**Fix:** 
- Verify `DATABASE_PASSWORD` is set
- Check database credentials are correct
- Ensure Supabase allows connections from Render

#### Issue 3: Service Crashed on Startup
**Error in logs:** `ModuleNotFoundError` or `ImportError`
**Fix:** Check that all dependencies are in `requirements.txt`

#### Issue 4: Free Tier Spin-Down
**Status:** Service shows "Live" but returns 503
**Fix:** 
- Wait 30-60 seconds after first request
- Free tier spins down after 15 minutes of inactivity
- First request wakes it up (takes time)

### Step 5: Manual Redeploy

If service is stopped:

1. Click **"Manual Deploy"** button
2. Select **"Deploy latest commit"**
3. Wait for deployment to complete
4. Check logs for errors

### Step 6: Test After Fix

Once you've fixed the issues:

1. Wait 2-3 minutes for deployment
2. Test: `https://airbcar-backend.onrender.com/api/`
3. Should return JSON or your API response (not 503)

## 🎯 Quick Checklist

- [ ] Service status shows "Live" (not "Stopped")
- [ ] `DATABASE_PASSWORD` is set in Environment
- [ ] `SECRET_KEY` is set in Environment  
- [ ] `EMAIL_HOST_PASSWORD` is set in Environment
- [ ] No red errors in Logs tab
- [ ] Build completed successfully
- [ ] Gunicorn started successfully

## 📋 What to Share for Help

If still not working, share:

1. **Service Status** (Live/Stopped/Building)
2. **Last 20-30 lines from Logs tab** (the actual errors)
3. **Which environment variables are set** (screenshot or list)

## ⚠️ Important Notes

- **Free tier spin-down**: First request after 15 min inactivity takes 30-60 seconds
- **Build time**: First deployment takes 5-10 minutes
- **Environment variables**: Must be set BEFORE service starts
- **Logs are key**: Always check logs for actual error messages

The 503 error will be resolved once the service starts successfully!

