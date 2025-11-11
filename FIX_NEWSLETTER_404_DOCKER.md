# 🐳 Fix Newsletter 404 Error - Docker Backend

## The Problem
The newsletter route was added to the code, but the Docker container needs to be rebuilt to include the new route.

## Solution: Rebuild the Backend Container

### Step 1: Rebuild and Restart the Backend

From the project root directory, run:

```bash
docker-compose up -d --build web
```

This will:
1. Rebuild the backend container with the latest code
2. Include the new newsletter route
3. Start the container

### Step 2: Check the Logs

Verify the container started successfully:

```bash
docker-compose logs -f web
```

Look for:
- ✅ No import errors
- ✅ Gunicorn workers starting
- ✅ Server binding to port 8000

### Step 3: Test the Endpoint

Test the newsletter endpoint:

```bash
# Test GET request
curl http://localhost:8000/api/newsletter/subscribe/
```

You should see:
```json
{"message": "Newsletter subscription endpoint. Use POST to subscribe."}
```

Or open in browser:
```
http://localhost:8000/api/newsletter/subscribe/
```

## Quick Commands

```bash
# Rebuild and restart backend
docker-compose up -d --build web

# View logs
docker-compose logs -f web

# Check container status
docker-compose ps

# Restart only (if already rebuilt)
docker-compose restart web
```

## Why Rebuild is Needed

Your Docker setup:
- ❌ Backend has **no volume mount** (code is copied during build)
- ✅ Frontend has volume mount (auto-reloads)
- 🔧 Backend code is **baked into the image** during build
- 🔧 Changes require **rebuilding the image**

## After Rebuilding

The newsletter subscription form in the footer should work! The endpoint will:
- ✅ Accept POST requests with email addresses
- ✅ Validate email format
- ✅ Return success messages
- ✅ Log subscriptions in the container logs

## Verify It's Working

1. Rebuild: `docker-compose up -d --build web`
2. Check logs: `docker-compose logs -f web`
3. Test endpoint: `curl http://localhost:8000/api/newsletter/subscribe/`
4. Try the newsletter form in the frontend footer

---

**TL;DR: Run `docker-compose up -d --build web` to rebuild the backend with the new route!**

