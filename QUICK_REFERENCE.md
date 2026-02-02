# Quick Reference Guide

## System Status
- Backend: `http://localhost:8000` ✅
- Frontend: `http://localhost:3001` ✅
- Database: Supabase PostgreSQL ✅

## Common Commands

### View Logs
```bash
docker compose logs -f web      # Backend logs
docker compose logs -f app      # Frontend logs
docker compose logs --tail=50   # Last 50 lines
```

### Run Django Commands
```bash
docker compose exec -T web python manage.py shell
docker compose exec -T web python manage.py makemigrations
docker compose exec -T web python manage.py migrate
docker compose exec -T web python manage.py dbshell
```

### Database Access
```bash
docker compose exec -T web python manage.py dbshell
# Then run SQL commands
```

### Restart Services
```bash
docker compose down
docker compose up -d
docker compose restart web
docker compose restart app
```

### Build & Deploy
```bash
docker compose build           # Rebuild containers
docker compose up -d --build   # Build and start
```

## API Endpoints

### Public (No Auth Required)
```
GET  /listings/              # List all listings
GET  /listings/{id}/         # Get listing details
GET  /partners/              # List partners
GET  /reviews/               # List reviews
GET  /bookings/{id}/         # View specific booking
```

### Protected (Auth Required)
```
POST   /users/login/         # JWT login
POST   /users/logout/        # Logout
GET    /users/me/            # Current user profile
POST   /bookings/            # Create booking
PATCH  /bookings/{id}/       # Update booking
POST   /reviews/             # Create review
```

## Environment Variables

**Critical (Must Be Set in Production):**
- `SECRET_KEY` - 50+ character random string (REQUIRED)
- `DEBUG` - Set to `False` for production
- `ENVIRONMENT` - Set to `production` for production deployment
- `DATABASE_HOST`, `DATABASE_NAME`, `DATABASE_USER`, `DATABASE_PASSWORD`

**Optional:**
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `EMAIL_HOST`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`
- `FRONTEND_URL`, `BACKEND_URL`

## Troubleshooting

### "Invalid HTTP_HOST header"
Add host to ALLOWED_HOSTS in settings.py

### "column already exists" error
Migration conflict - check `BACKEND_HEALTH_CHECK_REPORT.md` for solution

### Database connection issues
Check: `docker compose exec -T web python manage.py dbshell`

### Containers not starting
Check logs: `docker compose logs`

### Port already in use
```bash
lsof -i :8000  # Find process using port 8000
lsof -i :3001  # Find process using port 3001
```

## Key Files

| File | Purpose |
|------|---------|
| `backend/airbcar_backend/settings.py` | Django configuration |
| `backend/airbcar_backend/urls.py` | API routes |
| `backend/core/models.py` | Database models |
| `frontend/src/app/page.js` | Frontend home page |
| `docker-compose.yml` | Container orchestration |
| `.env` | Environment variables (NEVER commit) |

## Security Checklist

Before deployment:
- [ ] SECRET_KEY is 50+ random characters
- [ ] DEBUG set to False
- [ ] ALLOWED_HOSTS configured for your domain
- [ ] SSL/HTTPS enabled at load balancer
- [ ] Database credentials not in source code
- [ ] API rate limiting enabled
- [ ] CORS restricted to your frontend domain

## Performance Tuning

Already implemented:
- ✅ Connection pooling (CONN_MAX_AGE=600)
- ✅ Query optimization (select_related)
- ✅ Pagination limits (MAX_PAGE_SIZE=100)
- ✅ Static file compression (WhiteNoise)
- ✅ Gzip response compression

## Health Checks

Run these to verify everything works:
```bash
# System checks
docker compose exec -T web python manage.py check

# Database connectivity
docker compose exec -T web python manage.py dbshell <<< "SELECT 1;"

# Test API
curl http://localhost:8000/listings/?location=Tetouan

# Check containers
docker compose ps
```

---
Last Updated: 2026-01-31
