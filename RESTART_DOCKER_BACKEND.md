# 🐳 Restart Docker Backend - Fix 404 Error

## Quick Fix: Restart the Backend Container

Since you're using Docker, you need to restart the backend container to pick up the new newsletter route.

### Step 1: Restart the Backend Container

From the project root directory, run:

```bash
docker-compose restart web
```

### Step 2: Verify It's Working

Check the logs to make sure it started correctly:

```bash
docker-compose logs -f web
```

You should see gunicorn starting and no import errors.

### Step 3: Test the Endpoint

Open your browser and go to:
```
http://localhost:8000/api/newsletter/subscribe/
```

Or test with curl:
```bash
curl http://localhost:8000/api/newsletter/subscribe/
```

You should see:
```json
{"message": "Newsletter subscription endpoint. Use POST to subscribe."}
```

## If Restart Doesn't Work: Rebuild

If restarting doesn't work, rebuild the container:

```bash
docker-compose up -d --build web
```

This will rebuild the container with the latest code.

## Check Container Status

```bash
# Check if containers are running
docker-compose ps

# View backend logs
docker-compose logs web

# View logs in real-time
docker-compose logs -f web
```

## Why This Is Needed

Your Docker setup:
- ✅ Frontend has volume mount (auto-reloads)
- ❌ Backend doesn't have volume mount (needs restart)
- 🔧 Backend code is copied during build
- 🔧 Gunicorn loads code at startup

So when you add new routes, the container needs to restart to reload the URL configuration.

## Optional: Add Volume Mount for Development

To enable hot-reload for backend code (like the frontend), you can add a volume mount to `docker-compose.yml`:

```yaml
services:
  web:
    build: backend/
    volumes:
      - ./backend/airbcar_backend:/app/airbcar_backend  # Add this line
    ports:
      - "8000:8000"
    # ... rest of config
```

Then rebuild:
```bash
docker-compose up -d --build web
```

**Note**: Even with volume mounts, URL changes might still require a restart of gunicorn workers.

---

## Quick Reference

```bash
# Restart backend only
docker-compose restart web

# Rebuild and restart backend
docker-compose up -d --build web

# Stop everything
docker-compose down

# Start everything
docker-compose up -d

# View logs
docker-compose logs -f web
```

