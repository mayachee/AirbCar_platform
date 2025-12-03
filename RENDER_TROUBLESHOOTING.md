# Render Deployment Troubleshooting Guide

## Common Issues and Fixes

### 1. Missing Environment Variables

**Problem:** Service fails to start or database connection errors

**Solution:** In Render dashboard, go to your service → Environment → Add these variables:

```
DATABASE_PASSWORD=Mayache+123455
SECRET_KEY=AHZHdcJj7GgqAbvqbOZSK-RpA4tAws7NmvGK1hdp7GLXySV7CM2YY3XJ677PQZ_QmkE
EMAIL_HOST_PASSWORD=rmqjpvkmekdiugnz
```

### 2. Database Connection Errors

**Problem:** `ImproperlyConfigured: Error loading psycopg2 or psycopg module`

**Solution:** 
- ✅ Already fixed: Using `psycopg[binary]==3.2.0` which is compatible with Python 3.13
- If still seeing errors, check that all environment variables are set correctly

### 3. Static Files Not Loading

**Problem:** CSS/JS files return 404 errors

**Solution:**
- ✅ Already fixed: Added WhiteNoise middleware
- Run migrations and collectstatic during deployment
- Check that `STATIC_ROOT` is set correctly

### 4. CORS Errors

**Problem:** Frontend can't connect to backend API

**Solution:**
- Update `FRONTEND_URL` in environment variables with your actual frontend URL
- Check that `CORS_ALLOWED_ORIGINS` includes your frontend domain

### 5. Service Won't Start

**Problem:** Deployment fails or service crashes immediately

**Check:**
1. All required environment variables are set
2. Database credentials are correct
3. `SECRET_KEY` is set (not using default)
4. `DEBUG=False` in production
5. `ALLOWED_HOSTS` includes your Render domain

## Quick Checklist

- [ ] DATABASE_PASSWORD is set
- [ ] SECRET_KEY is set (not default)
- [ ] EMAIL_HOST_PASSWORD is set
- [ ] DEBUG=False
- [ ] ALLOWED_HOSTS includes your Render URL
- [ ] FRONTEND_URL is set correctly
- [ ] All database connection variables are set

## Manual Steps in Render Dashboard

1. Go to your service: https://dashboard.render.com/web/srv-d4ob2ta4i8rc73evm77g
2. Click "Environment" tab
3. Add missing environment variables (see list above)
4. Click "Save Changes"
5. Service will automatically redeploy

## Testing Your Deployment

After deployment succeeds:

1. Check service URL: `https://your-service-name.onrender.com`
2. Test API endpoint: `https://your-service-name.onrender.com/api/`
3. Check logs for any errors
4. Verify database connection is working

## Still Having Issues?

Check the deployment logs in Render dashboard for specific error messages and share them for further troubleshooting.

