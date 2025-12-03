# Render Deployment Guide

## ✅ Automatic Configuration with render.yaml

A `render.yaml` file has been created in the root directory. This will automatically configure your service when you connect your repository to Render.

**After connecting your repo:**
1. Render will detect `render.yaml` automatically
2. Most settings will be configured automatically
3. You'll need to manually set these sensitive environment variables in the Render dashboard:
   - `DATABASE_PASSWORD` = `Mayache+123455`
   - `SECRET_KEY` = `AHZHdcJj7GgqAbvqbOZSK-RpA4tAws7NmvGK1hdp7GLXySV7CM2YY3XJ677PQZ_QmkE`
   - `EMAIL_HOST_PASSWORD` = `rmqjpvkmekdiugnz`
4. Update `FRONTEND_URL` in `render.yaml` with your actual frontend URL before deploying

## Manual Configuration (Alternative Method)

If you prefer to configure manually or need to override settings:

## Generated SECRET_KEY
```
AHZHdcJj7GgqAbvqbOZSK-RpA4tAws7NmvGK1hdp7GLXySV7CM2YY3XJ677PQZ_QmkE
```

## Required Environment Variables for Render

Copy and paste these into Render's Environment Variables section:

### Database Configuration
```
DATABASE_HOST=aws-1-eu-north-1.pooler.supabase.com
DATABASE_PORT=5432
DATABASE_NAME=postgres
DATABASE_USER=postgres.wtbmqtmmdobfvvecinif
DATABASE_PASSWORD=Mayache+123455
```

### Django Configuration
```
SECRET_KEY=AHZHdcJj7GgqAbvqbOZSK-RpA4tAws7NmvGK1hdp7GLXySV7CM2YY3XJ677PQZ_QmkE
DEBUG=False
ALLOWED_HOSTS=airbcar-backend.onrender.com
DJANGO_SETTINGS_MODULE=airbcar_backend.settings
```

**Note:** Replace `airbcar-backend` with your actual Render service name!

### URLs (Update these with your actual URLs)
```
FRONTEND_URL=https://your-frontend-url.vercel.app
BACKEND_URL=https://airbcar-backend.onrender.com
```

**Note:** Replace `airbcar-backend` with your actual Render service name!

### Email Configuration
```
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=ayacheyassine2000@gmail.com
EMAIL_HOST_PASSWORD=rmqjpvkmekdiugnz
DEFAULT_FROM_EMAIL=ayacheyassine2000@gmail.com
```

### Optional (Performance)
```
GUNICORN_WORKERS=1
PORT=8000
```

## Render Service Configuration

### Basic Settings
- **Name:** `airbcar-backend` (or your preferred name)
- **Region:** Choose closest to you
- **Branch:** `main`
- **Root Directory:** `backend` ⚠️ **IMPORTANT**

### Build & Deploy
- **Environment:** `Python 3`
- **Build Command:** 
  ```
  pip install -r requirements.txt
  ```
- **Start Command:**
  ```
  cd airbcar_backend && gunicorn airbcar_backend.wsgi:application --bind 0.0.0.0:$PORT --workers 1 --timeout 120 --graceful-timeout 30
  ```

### Instance Type
- Select **Free** tier

## After Deployment

1. Your backend will be available at: `https://your-service-name.onrender.com`
2. Test the API: `https://your-service-name.onrender.com/api/`
3. Check logs in Render dashboard if there are any issues
4. Update your frontend to use the new backend URL

## Troubleshooting

- **Service won't start:** Check logs, verify Root Directory is set to `backend`
- **Database errors:** Verify Supabase credentials are correct
- **CORS errors:** Make sure FRONTEND_URL is set correctly in environment variables

