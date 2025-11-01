# 🚀 Quick Backend Deployment Guide

## Deploy to Render.com (Recommended - 5 minutes)

### Step 1: Prepare Your Code
Make sure your code is pushed to GitHub.

### Step 2: Create Render Account
1. Go to https://render.com
2. Sign up with your GitHub account
3. Authorize Render to access your repositories

### Step 3: Deploy Your Backend
1. Click **"New"** → **"Web Service"**
2. Connect your GitHub repository
3. Select the branch (usually `main` or `master`)

### Step 4: Configure Deployment

**Basic Settings:**
- **Name**: `airbcar-backend`
- **Region**: Choose closest to your users (e.g., Frankfurt for EU)
- **Branch**: `main`
- **Root Directory**: `backend` ⚠️ Important!
- **Environment**: `Docker`
- **Dockerfile Path**: `Dockerfile`

**Build Settings:**
Leave default (Render will detect Docker automatically)

### Step 5: Set Environment Variables

Click **"Advanced"** → **"Add Environment Variable"**

Add these one by one:

```bash
# Database Configuration
DATABASE_HOST=aws-1-eu-north-1.pooler.supabase.com
DATABASE_PORT=5432
DATABASE_NAME=postgres
DATABASE_USER=postgres.wtbmqtmmdobfvvecinif
DATABASE_PASSWORD=Mayache+123455

# Django Settings
SECRET_KEY=<generate-strong-random-key-here>
DEBUG=False

# Host Settings
ALLOWED_HOSTS=airbcar-backend.onrender.com,your-custom-domain.com

# CORS (Update with your frontend URL)
CORS_ALLOWED_ORIGINS=https://your-frontend-domain.com,http://localhost:3000

# Django Admin
DJANGO_SUPERUSER_USERNAME=admin
DJANGO_SUPERUSER_EMAIL=admin@airbcar.com
DJANGO_SUPERUSER_PASSWORD=your-secure-password
```

**Generate SECRET_KEY:**
Run this in Python:
```python
import secrets
print(secrets.token_urlsafe(50))
```

Or use this online tool: https://djecrety.ir/

### Step 6: Deploy!
Click **"Create Web Service"**

Render will:
- Build your Docker image
- Run database migrations automatically
- Start your backend server

Wait 5-10 minutes for deployment.

### Step 7: Test Your Deployment

Once deployed, you'll get a URL like: `https://airbcar-backend.onrender.com`

Test these endpoints:
- `https://airbcar-backend.onrender.com/api/` - Should return API info
- `https://airbcar-backend.onrender.com/admin/` - Django admin

---

## 🐳 Deploy to Railway (Alternative)

### Quick Steps:

1. **Install Railway CLI:**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login:**
   ```bash
   railway login
   ```

3. **Initialize:**
   ```bash
   railway init
   ```

4. **Deploy:**
   ```bash
   cd backend
   railway up
   ```

5. **Set Environment Variables:**
   Go to Railway dashboard → Variables tab → Add all env vars from Step 5 above

---

## 🔒 Security Checklist

Before going live:

- [ ] Generate new SECRET_KEY (never use default)
- [ ] Set DEBUG=False
- [ ] Set ALLOWED_HOSTS to your actual domain
- [ ] Configure CORS_ALLOWED_ORIGINS
- [ ] Use secure passwords for admin
- [ ] Enable HTTPS (Render does this automatically)
- [ ] Test all API endpoints
- [ ] Verify database connection
- [ ] Check logs for errors

---

## 📝 Update Frontend

After deploying backend, update frontend `.env` file:

```env
NEXT_PUBLIC_DJANGO_API_URL=https://your-backend.onrender.com
```

Then redeploy your frontend.

---

## 🐛 Troubleshooting

### Backend won't start
- Check logs in Render dashboard
- Verify all environment variables are set
- Check `ALLOWED_HOSTS` includes your domain

### Database connection failed
- Verify Supabase credentials
- Check DATABASE_HOST includes `pooler.supabase.com`
- Ensure IP whitelisting in Supabase (for VPS deployments)

### 500 Internal Server Error
- Set DEBUG=False in production
- Check logs for specific error messages
- Verify SECRET_KEY is set
- Run `python manage.py migrate` manually

### CORS errors
- Add frontend URL to CORS_ALLOWED_ORIGINS
- Use exact URL including `https://` or `http://`
- Check CORS middleware is enabled

---

## ✅ Post-Deployment Checklist

- [ ] Test API endpoints with Postman
- [ ] Test authentication (login/register)
- [ ] Test file uploads (if applicable)
- [ ] Verify database migrations ran
- [ ] Check admin panel works
- [ ] Test CORS with frontend
- [ ] Monitor logs for errors
- [ ] Set up monitoring/alerting (optional)

---

## 🔗 Useful Links

- Render Dashboard: https://dashboard.render.com
- Railway Dashboard: https://railway.app
- Supabase Dashboard: https://app.supabase.com

---

## 📞 Need Help?

Check the detailed guide in `DEPLOYMENT.md` for more options and troubleshooting.

