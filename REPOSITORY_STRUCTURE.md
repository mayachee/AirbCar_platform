# Repository Structure

## Overview
Clean, production-ready car rental application with Django backend and Next.js frontend.

## Directory Structure

```
carrental/
├── backend/                          # Django REST API
│   ├── airbcar_backend/             # Main Django project
│   │   ├── core/                    # Core app (listings, bookings, users, etc)
│   │   ├── bookings/                # Bookings app
│   │   ├── partners/                # Partners app
│   │   ├── favorites/               # Favorites app
│   │   ├── reviews/                 # Reviews app
│   │   ├── users/                   # Users app
│   │   └── common/                  # Utilities & shared code
│   ├── requirements.txt             # Python dependencies
│   ├── Dockerfile                   # Container build
│   ├── entrypoint.sh               # Container startup
│   ├── gunicorn_config.py          # Production server config
│   └── setup_local_dev.sh          # Development setup
│
├── frontend/                         # Next.js web app
│   ├── src/
│   │   ├── app/                     # Next.js app router
│   │   ├── components/              # Reusable components
│   │   ├── features/                # Feature modules
│   │   ├── hooks/                   # Custom React hooks
│   │   └── styles/                  # CSS/styling
│   ├── public/                      # Static assets
│   ├── package.json                 # Node dependencies
│   ├── Dockerfile                   # Container build
│   ├── next.config.js              # Next.js config
│   └── start.sh                    # Development startup
│
├── docker-compose.yml              # Container orchestration (web + app)
├── render.yaml                     # Render deployment config
├── Makefile                        # Common commands
├── package.json                    # Root dependencies
│
├── README.md                       # Project overview
├── QUICK_REFERENCE.md             # Command reference & troubleshooting
└── BACKEND_HEALTH_CHECK_REPORT.md # Latest audit report

```

## Key Files

| File | Purpose |
|------|---------|
| `docker-compose.yml` | Orchestrates web (Django) and app (Next.js) containers |
| `backend/airbcar_backend/settings.py` | Django configuration, security settings, database |
| `backend/airbcar_backend/urls.py` | API route definitions |
| `backend/airbcar_backend/core/models.py` | Database models (User, Partner, Listing, etc) |
| `frontend/src/app/page.js` | Homepage |
| `frontend/src/app/search/page.js` | Search page with filters |
| `.env` | Environment variables (secrets, credentials) |

## Running the Application

### Start Services
```bash
docker compose up -d
# Backend runs on http://localhost:8000
# Frontend runs on http://localhost:3001
```

### Development
```bash
# Backend shell
docker compose exec -T web python manage.py shell

# Database shell
docker compose exec -T web python manage.py dbshell

# View logs
docker compose logs -f web    # Backend
docker compose logs -f app    # Frontend
```

### Deployment
See `QUICK_REFERENCE.md` for production deployment steps.

## Technology Stack

**Backend:**
- Django 4.2.21
- Django REST Framework
- PostgreSQL (Supabase)
- Gunicorn 22.0.0

**Frontend:**
- Next.js 15.5.7
- React 19
- Tailwind CSS

**Infrastructure:**
- Docker & Docker Compose
- Supabase (Database & Storage)
- Render (Hosting)

## Database Schema

Core tables:
- `core_user` - User accounts (41 records)
- `core_partner` - Partner profiles (5 records)
- `core_listing` - Vehicle listings (11 records)
- `core_booking` - Reservations (0 active)
- `core_review` - Reviews & ratings (0 initial)
- `core_favorite` - Favorite listings (1 record)

## API Endpoints

Public (no auth):
- `GET /listings/` - List all listings
- `GET /partners/` - List all partners
- `GET /reviews/` - List reviews

Protected (requires JWT):
- `POST /bookings/` - Create booking
- `POST /reviews/` - Add review
- `GET /users/me/` - Current user profile

See `QUICK_REFERENCE.md` for full API reference.

## Important Notes

- All environment secrets in `.env` (never committed)
- Static files served via WhiteNoise
- Database pooling optimized (CONN_MAX_AGE=600)
- N+1 queries fixed with select_related()
- Pagination limited to MAX_PAGE_SIZE=100
- CORS configured for development

## Current Status

✅ All systems operational and production-ready
✅ Database integrity verified
✅ All API endpoints functional
✅ No pending migrations
✅ Clean repository structure

---
Last Updated: 2026-01-31
