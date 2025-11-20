# Docker Backend Setup Guide

## ✅ Current Status

Your backend is **already running** in Docker! 🎉

```
Service: airbcar-web-1
Status: Up and running
Port: http://localhost:8000
```

## 🚀 Quick Commands

### Start Backend
```bash
docker-compose up web
```

### Start Backend (Detached Mode - Background)
```bash
docker-compose up -d web
```

### Stop Backend
```bash
docker-compose stop web
```

### Restart Backend
```bash
docker-compose restart web
```

### View Backend Logs
```bash
docker-compose logs -f web
```

### View Last 100 Lines of Logs
```bash
docker-compose logs --tail=100 web
```

### Rebuild Backend (After Code Changes)
```bash
docker-compose build web
docker-compose up -d web
```

### Access Backend Container Shell
```bash
docker-compose exec web bash
```

## 🗄️ Database Migrations

### Run Migrations
```bash
docker-compose exec web python /app/airbcar_backend/manage.py makemigrations
docker-compose exec web python /app/airbcar_backend/manage.py migrate
```

### Create Superuser
```bash
docker-compose exec web python /app/airbcar_backend/manage.py createsuperuser
```

### Django Shell
```bash
docker-compose exec web python /app/airbcar_backend/manage.py shell
```

## 📋 Common Tasks

### Check Backend Status
```bash
docker-compose ps web
```

### Check Backend Health
```bash
curl http://localhost:8000/api/verify-token/
```

### View Container Resource Usage
```bash
docker stats airbcar-web-1
```

### Stop and Remove Container
```bash
docker-compose down web
```

### Stop and Remove All (including volumes)
```bash
docker-compose down -v
```

## 🔧 Configuration

### Environment Variables

The backend is configured via `docker-compose.yml`. Key settings:

- **Database**: Supabase PostgreSQL
- **Port**: 8000
- **Memory Limit**: 1GB
- **Workers**: 1 (configurable via `GUNICORN_WORKERS`)

### Update Environment Variables

Edit `docker-compose.yml` and restart:
```bash
docker-compose restart web
```

Or set in `.env` file (if using env_file directive).

## 🐛 Troubleshooting

### Backend Won't Start
```bash
# Check logs
docker-compose logs web

# Rebuild from scratch
docker-compose build --no-cache web
docker-compose up -d web
```

### Database Connection Issues
```bash
# Test database connection
docker-compose exec web python /app/airbcar_backend/manage.py dbshell
```

### Port Already in Use
```bash
# Find what's using port 8000
netstat -ano | findstr :8000

# Or change port in docker-compose.yml
ports:
  - "8001:8000"  # Use 8001 instead
```

### Memory Issues
```bash
# Check memory usage
docker stats airbcar-web-1

# Increase memory limit in docker-compose.yml
deploy:
  resources:
    limits:
      memory: 2G  # Increase from 1G
```

## 📊 Monitoring

### Real-time Logs
```bash
docker-compose logs -f web
```

### Container Stats
```bash
docker stats airbcar-web-1
```

### Check API Health
```bash
# In browser or curl
http://localhost:8000/api/verify-token/
```

## 🎯 Development Workflow

### 1. Start Backend
```bash
docker-compose up -d web
```

### 2. Check Logs
```bash
docker-compose logs -f web
```

### 3. Make Code Changes
- Edit files in `backend/airbcar_backend/`
- Changes are automatically reflected (volume mount)

### 4. Run Migrations (if needed)
```bash
docker-compose exec web python /app/airbcar_backend/manage.py makemigrations
docker-compose exec web python /app/airbcar_backend/manage.py migrate
```

### 5. Restart if Needed
```bash
docker-compose restart web
```

## 🔄 Full Restart (Clean)

```bash
# Stop and remove
docker-compose down web

# Rebuild
docker-compose build web

# Start
docker-compose up -d web

# Check logs
docker-compose logs -f web
```

## 📝 Notes

- Backend runs on **http://localhost:8000**
- Code changes are **automatically reflected** (volume mount)
- Database migrations run **automatically** on startup (via entrypoint.sh)
- Superuser is created **automatically** if env vars are set
- Logs are available via `docker-compose logs`

## 🎉 Quick Start

```bash
# Start backend
docker-compose up -d web

# View logs
docker-compose logs -f web

# Test API
curl http://localhost:8000/api/verify-token/
```

Your backend should now be accessible at **http://localhost:8000**! 🚀



   docker-compose exec web python /app/airbcar_backend/manage.py makemigrations core
   docker-compose exec web python /app/airbcar_backend/manage.py migrate

      docker-compose logs -f web
