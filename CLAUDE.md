# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Airbcar is a car rental marketplace platform with:
- **Backend**: Django 4.2 + DRF REST API (`backend/airbcar_backend/`)
- **Frontend**: Next.js 16 + React 19 + TypeScript (`frontend/`)
- **Database**: PostgreSQL (Supabase in production, local Docker in dev)
- **Storage**: Supabase Storage for images/documents
- **Email**: Resend HTTP API (SMTP is blocked on Render)
- **Notifications**: Telegram Bot API
- **Deployment**: Docker + Render.com (backend) + Vercel (frontend)

## Commands

### Local Development
```bash
make local          # Start everything (frontend :3001, backend :8000, postgres) via Docker
make run            # Start with remote/production config
make logs           # Tail container logs
make status         # Container status
make clean          # Stop and remove containers
```

### Backend
```bash
cd backend/airbcar_backend
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev          # Dev server on port 3001
npm run build        # Production build
npm run lint         # ESLint (non-blocking warnings)
```

### Tests (Backend)
```bash
cd backend/airbcar_backend
pytest tests -v                     # All tests (requires Postgres)
pytest tests/unit -v                # Unit tests only
pytest tests/integration -v         # API integration tests
pytest tests/integration/test_auth.py::TestLogin -v  # Single test class

# Run WITHOUT Postgres (uses SQLite in-memory — for local dev):
SECRET_KEY=test-secret-key DEBUG=True python -m pytest tests/integration/test_social_api.py \
  --override-ini="addopts=" --nomigrations --ds=airbcar_backend.test_settings -v
```

CI uses Python 3.11 with a real PostgreSQL service — never mock the database in tests.
Note: migration `0016_ensure_columns.py` uses PostgreSQL-only `DO $$ ... $$` syntax, so always use `--nomigrations` when running against SQLite.

## Social Layer (in progress)

Airbcar is evolving into a hybrid social media + rental platform. The social layer is built on top of the existing rental core:

| Feature | Status | Key models / endpoints |
|---|---|---|
| Listing comments + reactions | Done | `ListingComment`, `ListingReaction` → `/listings/<id>/comments/`, `/listings/<id>/reactions/` |
| Agency follow system | Done | `PartnerFollow` → `/partners/<id>/follow/` |
| Agency posts | Done | `PartnerPost` → `/partners/<id>/posts/` |
| Social feed | Done | `SocialFeedView` → `/feed/?mode=following\|discover` |
| Trip posts (customer UGC) | Done | `TripPost`, `TripPostReaction`, `TripPostComment` → `/trips/` |
| User ↔ user follows | Done | `UserFollow` → `/users/<id>/follow/` |

**Feed logic:** `/feed/` merges `PartnerPost` + `Listing` + `TripPost` items, sorted by `created_at` desc. `mode=following` scopes partner posts/listings to followed agencies; trip posts are always global. Falls back to discover if user follows nobody.

**`PartnerDetailView`** (`GET /partners/<id>/`) returns extra social fields: `follower_count`, `is_following`, `recent_posts`.

**Trip posts:** One post per completed booking (`OneToOneField`). Customer uploads images (Supabase URLs) + caption. Max 10 images. Supports reactions + threaded comments.

## Architecture

### Backend (`backend/airbcar_backend/`)

All business logic lives in a single Django app: `core/`.

**Key files:**
- `core/models.py` — All models
- `core/serializers.py` — All DRF serializers (~47KB)
- `core/urls.py` — API routing
- `core/views/` — Modular view files per domain
- `core/utils/supabase_storage.py` — File upload to Supabase Storage
- `core/utils/email_backend.py` — Resend API email sending
- `airbcar_backend/settings.py` — Django settings (JWT, CORS, Supabase, SSL)
- `gunicorn_config.py` — Gevent async workers for WSGI

**View modules in `core/views/`:**
- `auth_views.py` — Register, login, JWT, email/password reset, Google OAuth
- `booking_views.py` — Booking lifecycle (create → accept/reject → cancel/complete)
- `listing_views.py` — Vehicle search, filtering, detail
- `user_views.py` — Profile, stats, document upload
- `partner_views.py` — Partner profile, earnings, analytics, reviews, activity
- `review_views.py` — Reviews, voting, replies, reactions, reporting
- `favorite_views.py` — User favorites
- `notification_views.py` — User notifications
- `telegram_views.py` — Telegram bot webhook and account linking
- `newsletter_views.py` — Email subscriptions
- `admin_views.py` — Admin stats/analytics/revenue (admin role only)
- `health_views.py` — Health check + OpenAPI schema

**Core data model:**
- `User` (extends AbstractUser) — roles: `customer` / `partner` / `admin` / `ceo`
- `Partner` (OneToOne → User) — business profile, ratings, earnings
- `Listing` (FK → Partner) — vehicle details, pricing, images
- `Booking` (FK → Listing, User, Partner) — status flow: `pending → confirmed → active → completed/cancelled`
- `Review`, `ReviewVote`, `ReviewReport`, `ReviewReply`, `ReviewReaction` — review system
- `Notification`, `PasswordReset`, `EmailVerification` — system events
- `LicenseVerificationRecord` (FK → User, Booking) — OCR verification attempts

**Authentication:** JWT via `djangorestframework-simplejwt`. Access token + refresh token. Google OAuth via `POST /api/auth/google/`.

**Health check endpoint (no auth):** `GET /api/health/`
**OpenAPI schema:** `GET /api/schema/` (drf-spectacular)

### Frontend (`frontend/src/`)

Uses Next.js App Router with locale-based routing.

**Structure:**
- `app/[locale]/` — All pages scoped to locale (i18n via next-intl)
- `app/layout.js` — Root layout with auth providers
- `components/` — Reusable UI components (Radix UI + Tailwind CSS 4)
- `hooks/` — Custom React hooks
- `services/` — API client functions (call Django backend)
- `contexts/` — React contexts (auth state, etc.)
- `lib/` — Utilities and helpers
- `i18n/` — Translation files

**Key libs:** TanStack Query (data fetching), React Hook Form + Zod (forms), Framer Motion (animations), next-intl (i18n), NextAuth (session).

### Deployment

**render.yaml** defines the Render.com services. The backend runs with gevent workers (`gunicorn -k gevent`). `entrypoint.sh` runs migrations, creates superuser, and collects static files on startup.

`SECURE_SSL_REDIRECT` is disabled on Render (Render handles TLS termination at the proxy level).

**Frontend** targets Vercel. `next.config.js` sets CSP, HSTS, and X-Frame-Options headers and configures Supabase as an allowed image domain.

## Environment Variables

**Backend `.env`** (key vars):
- `SECRET_KEY`, `DEBUG`, `ALLOWED_HOSTS`, `FRONTEND_URL`, `BACKEND_URL`
- `DATABASE_HOST/PORT/NAME/USER/PASSWORD`
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET_PICS`
- `RESEND_API_KEY` — transactional email
- `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`, `TELEGRAM_DEFAULT_CHAT_ID`

**Frontend `.env.local`** (key vars):
- `DJANGO_API_URL` — Backend URL
- `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`

## Testing Structure

```
tests/
├── unit/           # Model and serializer tests
├── integration/    # API endpoint tests (auth, booking, listing, user)
├── e2e/            # Full workflow tests
├── performance/    # Load and benchmark tests
├── conftest.py     # Pytest fixtures and setup
└── factories.py    # Factory Boy model factories
```

CI (`.github/workflows/ci.yml`) runs backend pytest + frontend lint/build on push/PR to main.
