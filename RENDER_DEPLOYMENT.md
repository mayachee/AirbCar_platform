# 🚀 Deploy AirbCar Backend to Render

**Complete step-by-step guide to deploy your Django backend to Render**

---

## 📋 Prerequisites

- ✅ GitHub account
- ✅ Your code pushed to GitHub repository
- ✅ Render account (free at https://render.com)

---

## 🎯 Step-by-Step Deployment

### Step 1: Prepare Your Code

Make sure your latest code is pushed to GitHub:

```bash
git add .
git commit -m "Prepare for deployment"
git push origin main
```

### Step 2: Create Render Account

1. Go to https://render.com
2. Click "Get Started for Free"
3. Sign up with your GitHub account
4. Authorize Render to access your repositories

### Step 3: Create New Web Service

1. Click **"New +"** button in the top right
2. Select **"Web Service"**
3. Connect your GitHub repository
4. Select the repository: `AirbCar`
5. Click **"Connect"**

### Step 4: Configure Build Settings

Fill in the following information:

**Basic Settings:**
- **Name**: `airbcar-backend` (or your preferred name)
- **Region**: Choose closest to your users (Europe if in Morocco)
- **Branch**: `main` or `master`

**Environment:**
- Select **"Docker"** (since you have a Dockerfile)

**Docker Settings:**
- **Dockerfile Path**: `backend/Dockerfile`
- **Docker Context**: `backend`

**OR if you prefer Buildpacks (Easier):**

Leave "Docker" unchecked, use:
- **Root Directory**: `backend`
- **Build Command**: 
  ```bash
  pip install -r requirements.txt && pip install gunicorn
  ```
- **Start Command**: 
  ```bash
  cd airbcar_backend && gunicorn airbcar_backend.wsgi:application --bind 0.0.0.0:$PORT
  ```

### Step 5: Add Environment Variables

Click **"Advanced"** → **"Add Environment Variable"**

Add these variables:

| Key | Value |
|-----|-------|
| `DATABASE_HOST` | `aws-1-eu-north-1.pooler.supabase.com` |
| `DATABASE_PORT` | `5432` |
| `DATABASE_NAME` | `postgres` |
| `DATABASE_USER` | `postgres.wtbmqtmmdobfvvecinif` |
| `DATABASE_PASSWORD` | `Mayache+123455` |
| `SECRET_KEY` | Generate a new one (see below) |
| `DEBUG` | `False` |
| `ALLOWED_HOSTS` | Will be auto-filled (leave for now) |
| `CORS_ALLOW_ALL_ORIGINS` | `True` (or set specific origins later) |

**Generate SECRET_KEY:**
Run this Python command locally:
```bash
python -c "import secrets; print(secrets.token_urlsafe(50))"
```
Copy the output and use it as your SECRET_KEY.

### Step 6: Deploy!

1. Scroll down
2. Click **"Create Web Service"**
3. Render will automatically:
   - Clone your repo
   - Build the Docker image
   - Deploy your app

**Deployment takes 5-10 minutes**

---

## 🔍 Monitor Deployment

Watch the logs in real-time:

1. Click on your service name
2. Go to **"Logs"** tab
3. You should see:
   - ✅ "Waiting for PostgreSQL..."
   - ✅ "PostgreSQL is up!"
   - ✅ "Starting Gunicorn..."

---

## ✅ Verify Deployment

### Check Health

Once deployed, you'll see:
- **URL**: `https://airbcar-backend-xxxx.onrender.com`

Test these endpoints:
1. **Health Check**: `https://your-app.onrender.com/` → Should show Django welcome
2. **API Endpoint**: `https://your-app.onrender.com/api/login/` → Should not show 404
3. **Listings**: `https://your-app.onrender.com/listings/` → Should return JSON

### Update Frontend

1. Update `frontend/.env.local` or environment variables
2. Set: `NEXT_PUBLIC_DJANGO_API_URL=https://your-app.onrender.com`
3. Redeploy your frontend

---

## 🔧 Common Issues & Solutions

### Issue 1: Build Failed

**Error**: "Build command failed"

**Solution**:
1. Check Dockerfile path is correct
2. Check if requirements.txt exists in backend/
3. Look at logs for specific error

### Issue 2: Can't Connect to Database

**Error**: "Connection refused" or "timeout"

**Solution**:
1. Verify Supabase connection string
2. Check if Supabase allows external connections
3. Verify DATABASE_HOST and DATABASE_PORT are correct

### Issue 3: 502 Bad Gateway

**Error**: Site shows 502 error

**Solution**:
1. Check application logs
2. Verify gunicorn is running
3. Check if PORT environment variable is set (Render sets this automatically)
4. Make sure ALLOWED_HOSTS includes Render domain

### Issue 4: CORS Errors

**Error**: CORS policy blocked

**Solution**:
1. Set `CORS_ALLOW_ALL_ORIGINS=True` for now
2. Later, use `CORS_ALLOWED_ORIGINS` with specific URLs

---

## 🎨 Recommended Production Settings

### After Deployment, Update CORS:

1. Go to your Render dashboard
2. Click on your service
3. Go to **Environment** tab
4. Add new environment variable:

```
CORS_ALLOWED_ORIGINS=https://your-frontend-domain.com,http://localhost:3000
```

Then update your code to use this instead of `CORS_ALLOW_ALL_ORIGINS`.

### Update ALLOWED_HOSTS

Add this environment variable:
```
ALLOWED_HOSTS=your-app.onrender.com,www.your-app.onrender.com
```

---

## 🆓 Free Tier Limitations

Render's free tier:
- ✅ 750 hours/month (plenty for small projects)
- ⚠️ Services sleep after 15 minutes of inactivity (first request may be slow)
- ✅ Free SSL certificates
- ✅ Custom domains supported

**Upgrade** to prevent sleeping ($7/month)

---

## 📊 Next Steps

1. **Set up Custom Domain** (optional)
   - Go to Settings → Custom Domain
   - Add your domain
   - Render provides SSL automatically

2. **Set up Monitoring**
   - Render includes basic monitoring
   - Consider adding Sentry for error tracking

3. **Set up CI/CD**
   - Render auto-deploys on git push
   - Add GitHub Actions for tests

4. **Environment-Specific Settings**
   - Create `.env.production`
   - Different settings for dev/staging/prod

---

## 🔐 Security Checklist

Before going live:

- [ ] Set `DEBUG=False`
- [ ] Generate new `SECRET_KEY`
- [ ] Set strong database passwords
- [ ] Configure CORS properly
- [ ] Set up SSL certificate (Render does this)
- [ ] Review ALLOWED_HOSTS
- [ ] Set up error tracking (Sentry)
- [ ] Enable rate limiting
- [ ] Set up database backups

---

## 📞 Getting Help

**Render Docs**: https://render.com/docs

**Render Support**: Click "Support" in your dashboard

**Community**: https://community.render.com

---

## 🎉 Success!

Once deployed, you'll have:
- ✅ Backend running at `https://your-app.onrender.com`
- ✅ Auto-deploys on git push
- ✅ Free SSL certificate
- ✅ Automatic backups
- ✅ Easy scaling

**Next**: Deploy your frontend and connect it to this backend!

---

## 🔄 Update Your Deployment

Whenever you push to GitHub:

1. Render automatically detects changes
2. Builds new Docker image
3. Deploys updates
4. Zero-downtime deployment!

Check deployment status in **"Events"** tab.

