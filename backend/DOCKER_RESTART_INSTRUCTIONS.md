# 🐳 Restart Docker Backend for Newsletter Route

## The Problem
You're using Docker to run the backend. When you add new routes, the Docker container needs to be restarted to pick up the changes.

## Solution: Restart Docker Container

### Option 1: Restart the Container (Fastest)
```bash
# From the project root directory
docker-compose restart web
```

This will restart the backend container and reload the code.

### Option 2: Stop and Start (More Reliable)
```bash
# Stop the container
docker-compose stop web

# Start it again
docker-compose up -d web
```

### Option 3: Rebuild if Needed (If restart doesn't work)
```bash
# Rebuild and restart
docker-compose up -d --build web
```

## Verify It's Working

After restarting, test the endpoint:

### Test 1: Check if the server is running
```bash
curl http://localhost:8000/api/newsletter/subscribe/
```

You should see:
```json
{"message": "Newsletter subscription endpoint. Use POST to subscribe."}
```

### Test 2: Check Docker logs
```bash
docker-compose logs web
```

Look for:
- No import errors
- Server starting successfully
- Gunicorn workers starting

## Check Container Status

```bash
# See if container is running
docker-compose ps

# View logs in real-time
docker-compose logs -f web
```

## Why This Happens

The backend Docker container:
1. **Copies code during build** - Code is baked into the image
2. **Uses gunicorn** - Gunicorn loads code at startup
3. **No volume mount** - Changes aren't automatically reflected
4. **Needs restart** - Container must restart to reload code

## Development Tip: Add Volume Mount (Optional)

For development, you can add a volume mount to `docker-compose.yml`:

```yaml
services:
  web:
    build: backend/
    volumes:
      - ./backend/airbcar_backend:/app/airbcar_backend  # Mount code for hot reload
    # ... rest of config
```

Then restart:
```bash
docker-compose up -d --build web
```

**Note**: With volume mounts, you may still need to restart gunicorn workers or the container to pick up URL changes.

## Quick Commands

```bash
# Restart backend
docker-compose restart web

# View logs
docker-compose logs -f web

# Rebuild and restart
docker-compose up -d --build web

# Stop everything
docker-compose down

# Start everything
docker-compose up -d
```

