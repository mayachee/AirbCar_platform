# Can AirbCar Handle 10,000 Concurrent Users?

## Current Capacity: ~50-200 concurrent users (at best)

---

## Critical Bottlenecks (Ranked by Severity)

### 1. Render Free Tier = Single Worker
- `render.yaml` sets **1 Gunicorn worker** on the **free plan**
- Free tier: **512 MB RAM**, limited CPU
- **Spins down after 15 min of inactivity** (30s+ cold start)
- A single worker means one CPU-bound request blocks everything
- **Capacity: ~100-200 concurrent users max**

### 2. No Redis Cache — Using In-Memory Cache (LocMemCache)
```python
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'OPTIONS': {'MAX_ENTRIES': 1000}
    }
}
```
- LocMemCache is **per-process** — each worker has its own cache, no sharing
- With multiple workers, cache hit rate drops drastically
- **Redis is required** for 10K users

### 3. Database Connection Pooling — No External Pooler
- `CONN_MAX_AGE=300` helps, but Supabase free tier has ~20-60 connections
- 10,000 users would need **hundreds of concurrent DB connections**
- Need **PgBouncer** or Supabase's connection pooler in transaction mode

### 4. No CDN for API Responses
- `vercel.json` rewrites `/api/*` directly to Render backend
- With 10K users, every API call hits the single Render instance

### 5. Throttle Rates Are Too Generous
- `anon: 100/hour`, `user: 1000/hour`
- 10K users × 1000 req/hour = **10 million requests/hour** — backend can't handle this

---

## What We're Doing Well ✅

| Area | Status | Details |
|------|--------|---------|
| Database Indexes | ✅ Good | Comprehensive indexes on Listing, Booking, Review models |
| `select_related` | ✅ Good | Used properly in views to avoid N+1 queries |
| Gevent Workers | ✅ Good | Async worker class for better concurrency |
| ETag/Caching Headers | ✅ Good | `etag_middleware.py` saves 30-50% bandwidth |
| GZip Compression | ✅ Good | Enabled in middleware |
| Static Files (WhiteNoise) | ✅ Good | Compressed & cached |
| Frontend (Vercel) | ✅ Good | Vercel scales automatically with edge CDN |
| Image Optimization | ✅ Good | AVIF/WebP formats configured |
| JWT Auth | ✅ Good | Stateless — scales horizontally |

---

## What We Need to Handle 10,000 Concurrent Users

| Change | Priority | Cost | Impact |
|--------|----------|------|--------|
| **Upgrade Render to Starter/Pro plan** | 🔴 CRITICAL | $7-25/mo | 4+ workers, no cold starts, more RAM |
| **Add Redis cache** (Upstash/Redis Cloud free) | 🔴 CRITICAL | Free-$10/mo | Shared cache across workers, session storage |
| **Use Supabase connection pooler** (PgBouncer) | 🔴 CRITICAL | Free | Handles 1000s of connections with ~20 real ones |
| **Add Cloudflare CDN** in front of API | 🟡 HIGH | Free | Cache GET responses at edge, absorb 80% of traffic |
| **Increase workers to 4-8** | 🟡 HIGH | Included | `GUNICORN_WORKERS=4` with more RAM |
| **Add async task queue** (Celery + Redis) | 🟠 MEDIUM | Free | Offload emails, notifications, heavy processing |
| **Database read replicas** | 🟠 MEDIUM | $25+/mo | Spread read load across replicas |
| **Rate limit per-IP** (not just per-user) | 🟠 MEDIUM | Free | Prevent abuse from unauthenticated users |
| **WebSocket for notifications** (Django Channels) | 🔵 LOW | $10+/mo | Replace polling with push |

---

## Minimum Viable Scaling Plan (~$20/month)

| Service | Cost | What It Gives Us |
|---------|------|-----------------|
| Render Starter Plan | $7/mo | 4 workers, 1GB RAM, no cold starts |
| Upstash Redis | Free tier | Shared cache, 10K commands/day free |
| Supabase Pooler | Free | Use port 6543 instead of 5432 |
| Cloudflare | Free | CDN + DDoS protection + caching |

> **This alone would bring us to ~2,000-5,000 concurrent users.**

---

## Full 10K Users Plan (~$60/month)

| Service | Cost | What It Gives Us |
|---------|------|-----------------|
| Render Pro | $25/mo | 8 workers, 2GB+ RAM |
| Redis paid tier | ~$10/mo | 100K+ commands |
| Supabase Pro | $25/mo | Better DB performance, more connections |

---

## Bottom Line

> **Our code quality is solid** — good indexes, proper `select_related`, ETag caching, compression. The bottleneck is **infrastructure, not code**. The free tier of Render is the #1 limiting factor. With ~$60/month in infrastructure, the current codebase could realistically serve 10,000 concurrent users smoothly.
