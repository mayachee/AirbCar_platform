# 🚀 Backend Deployment Guide

This guide covers multiple options for hosting your Django backend.

## 📋 Prerequisites

- Django backend code
- PostgreSQL database (Supabase)
- Environment variables configured
- Static files handling (if needed)

---

## 🎯 Option 1: Render (Recommended for Beginners)

### Steps:

1. **Create Render Account**
   - Go to https://render.com
   - Sign up with GitHub

2. **Create New Web Service**
   - Click "New" → "Web Service"
   - Connect your GitHub repository
   - Select the branch (usually `main` or `master`)

3. **Configure Build Settings**
   ```
   Build Command: cd backend && pip install -r requirements.txt
   Start Command: cd backend/airbcar_backend && gunicorn airbcar_backend.wsgi:application --bind 0.0.0.0:$PORT
   ```

4. **Set Environment Variables**
   ```
   DATABASE_HOST=aws-1-eu-north-1.pooler.supabase.com
   DATABASE_PORT=5432
   DATABASE_NAME=postgres
   DATABASE_USER=postgres.wtbmqtmmdobfvvecinif
   DATABASE_PASSWORD=Mayache+123455
   SECRET_KEY=your-secret-key-here
   DEBUG=False
   ALLOWED_HOSTS=your-app-name.onrender.com
   CORS_ALLOWED_ORIGINS=https://your-frontend-domain.com
   ```

5. **Build & Deploy**
   - Click "Create Web Service"
   - Render will build and deploy automatically

### Render Dockerfile Alternative:
If you prefer Docker, create `render.yaml`:

```yaml
services:
  - type: web
    name: airbcar-backend
    env: docker
    dockerfilePath: ./backend/Dockerfile
    dockerContext: ./backend
    envVars:
      - key: DATABASE_HOST
        value: aws-1-eu-north-1.pooler.supabase.com
      - key: DATABASE_PORT
        value: 5432
      # ... add other env vars
```

---

## 🐳 Option 2: Railway

1. **Install Railway CLI**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login**
   ```bash
   railway login
   ```

3. **Initialize Project**
   ```bash
   railway init
   ```

4. **Deploy**
   ```bash
   cd backend
   railway up
   ```

5. **Set Environment Variables**
   - Go to Railway dashboard
   - Add all your environment variables

---

## ☁️ Option 3: AWS (Elastic Beanstalk)

### Prerequisites:
- AWS account
- EB CLI installed

### Steps:

1. **Install EB CLI**
   ```bash
   pip install awsebcli
   ```

2. **Initialize EB**
   ```bash
   cd backend
   eb init -p python-3.8 airbcar-backend --region us-east-1
   ```

3. **Create Environment**
   ```bash
   eb create airbcar-backend-env
   ```

4. **Configure Environment Variables**
   ```bash
   eb setenv DATABASE_HOST=your-host DATABASE_PORT=5432 ...
   ```

5. **Deploy**
   ```bash
   eb deploy
   ```

---

## 🐙 Option 4: DigitalOcean App Platform

1. **Create App**
   - Go to DigitalOcean App Platform
   - Click "Create App"
   - Connect GitHub repository

2. **Configure Component**
   - Add Backend component
   - Set root directory to `backend`
   - Build command: `pip install -r requirements.txt`
   - Run command: `cd airbcar_backend && gunicorn airbcar_backend.wsgi:application --bind 0.0.0.0:$PORT`

3. **Add Database**
   - Add PostgreSQL database (or use existing Supabase)

---

## 🐳 Option 5: Docker on VPS (DigitalOcean, Linode, etc.)

### Prerequisites:
- VPS with Docker installed
- Domain name (optional)

### Steps:

1. **SSH into your VPS**
   ```bash
   ssh user@your-server-ip
   ```

2. **Install Docker & Docker Compose**
   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh
   ```

3. **Clone Your Repository**
   ```bash
   git clone https://github.com/your-username/airbcar.git
   cd airbcar
   ```

4. **Create Production docker-compose.yml**
   ```yaml
   version: '3.8'
   services:
     backend:
       build: ./backend
       ports:
         - "8000:8000"
       environment:
         DATABASE_HOST: aws-1-eu-north-1.pooler.supabase.com
         DATABASE_PORT: 5432
         DATABASE_NAME: postgres
         DATABASE_USER: postgres.wtbmqtmmdobfvvecinif
         DATABASE_PASSWORD: Mayache+123455
         SECRET_KEY: ${SECRET_KEY}
         DEBUG: "False"
         ALLOWED_HOSTS: your-domain.com
       restart: unless-stopped
       command: >
         sh -c "python manage.py migrate &&
                gunicorn airbcar_backend.wsgi:application --bind 0.0.0.0:8000 --workers 3"
   ```

5. **Deploy**
   ```bash
   docker-compose up -d --build
   ```

6. **Set up Nginx (Reverse Proxy)**
   ```bash
   sudo apt install nginx
   ```

   Create `/etc/nginx/sites-available/airbcar`:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:8000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

   Enable site:
   ```bash
   sudo ln -s /etc/nginx/sites-available/airbcar /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

7. **SSL Certificate (Let's Encrypt)**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

---

## 🔧 Production Settings Checklist

Before deploying, ensure your `settings.py` has:

```python
# Security Settings
DEBUG = False
ALLOWED_HOSTS = ['your-domain.com', 'www.your-domain.com']

# Database (already configured for Supabase)
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('DATABASE_NAME'),
        'USER': os.environ.get('DATABASE_USER'),
        'PASSWORD': os.environ.get('DATABASE_PASSWORD'),
        'HOST': os.environ.get('DATABASE_HOST'),
        'PORT': os.environ.get('DATABASE_PORT', '5432'),
    }
}

# Static Files
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

# CORS
CORS_ALLOWED_ORIGINS = [
    "https://your-frontend-domain.com",
]

# Security Headers
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
```

---

## 🚀 Update Dockerfile for Production

Create `backend/Dockerfile.prod`:

```dockerfile
FROM python:3.8-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    netcat-openbsd \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install gunicorn

# Copy project
COPY . .
WORKDIR /app/airbcar_backend

# Collect static files
RUN python manage.py collectstatic --noinput

# Create entrypoint
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["/entrypoint.sh"]
CMD ["gunicorn", "airbcar_backend.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3"]
```

---

## 📝 Environment Variables Template

Create `.env.production`:

```env
# Database
DATABASE_HOST=aws-1-eu-north-1.pooler.supabase.com
DATABASE_PORT=5432
DATABASE_NAME=postgres
DATABASE_USER=postgres.wtbmqtmmdobfvvecinif
DATABASE_PASSWORD=your-password

# Django
SECRET_KEY=your-secret-key-here
DEBUG=False
ALLOWED_HOSTS=your-domain.com,www.your-domain.com

# CORS
CORS_ALLOWED_ORIGINS=https://your-frontend.com

# Supabase Storage (if using)
SUPABASE_URL=your-supabase-url
SUPABASE_KEY=your-supabase-key
```

---

## 🔍 Quick Comparison

| Platform | Difficulty | Cost | Best For |
|----------|-----------|------|----------|
| Render | ⭐ Easy | Free tier available | Quick deployment |
| Railway | ⭐⭐ Medium | $5/month | Docker apps |
| AWS EB | ⭐⭐⭐ Hard | Pay-as-you-go | Enterprise |
| DigitalOcean | ⭐⭐ Medium | $5/month | Simple deployments |
| VPS + Docker | ⭐⭐⭐ Hard | $5-20/month | Full control |

---

## 🎯 Recommended for Your Project

**Start with Render or Railway** - They're the easiest and handle most of the configuration automatically.

### Quick Start with Render:
1. Push your code to GitHub
2. Connect to Render
3. Add environment variables
4. Deploy!

Your backend will be available at: `https://your-app.onrender.com`

---

## ✅ Post-Deployment Checklist

- [ ] Test all API endpoints
- [ ] Verify database connection
- [ ] Check CORS settings
- [ ] Verify CORS allowed origins include frontend URL
- [ ] Test file uploads (Supabase storage)
- [ ] Set up monitoring/error tracking
- [ ] Configure domain name (optional)
- [ ] Set up SSL certificate (if using domain)

---

## 🆘 Troubleshooting

### Database Connection Issues
- Verify Supabase connection string
- Check firewall rules
- Ensure IP is whitelisted in Supabase

### Static Files Not Serving
- Run `python manage.py collectstatic`
- Configure static files serving in production

### CORS Errors
- Add frontend URL to `CORS_ALLOWED_ORIGINS`
- Check `ALLOWED_HOSTS` includes your domain

### 500 Errors
- Check logs in your hosting platform
- Verify all environment variables are set
- Ensure `DEBUG=False` in production

