# Docker Memory Problem - Fix Guide

## Problem
Next.js is running out of memory (ENOMEM) when scanning directories in Docker.

## Solution Options (Choose One)

### Option 1: Increase Docker Desktop Memory (RECOMMENDED)

1. Open Docker Desktop
2. Go to Settings (gear icon) → Resources → Advanced
3. Set Memory to **6-8GB** (or at least 4GB minimum)
4. Click "Apply & Restart"
5. Restart containers:
   ```bash
   docker-compose down
   docker-compose up --build
   ```

### Option 2: Use Production Build Instead of Dev Mode

Production builds use less memory. Edit `docker-compose.yml`:

```yaml
environment:
  - NODE_ENV=production  # Change from development
```

Then rebuild:
```bash
docker-compose down
docker-compose up --build
```

### Option 3: Run Frontend Outside Docker (If memory is very limited)

1. Stop the frontend container:
   ```bash
   docker-compose stop app
   ```

2. Run frontend locally:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. Keep backend in Docker:
   ```bash
   docker-compose up web
   ```

### Option 4: Reduce Memory Usage Further

If you must use Docker, try these optimizations:

1. Reduce Node.js heap size in `docker-compose.yml`:
   ```yaml
   - NODE_OPTIONS=--max-old-space-size=1536 --openssl-legacy-provider
   ```

2. Remove the `.next-local` volume mount:
   ```yaml
   volumes:
     - ./frontend:/app
     - /app/node_modules
     # Remove: - /app/.next-local
   ```

3. Rebuild and restart:
   ```bash
   docker-compose down
   docker-compose up --build
   ```

## Quick Fix Command

Try this first:
```bash
# Stop everything
docker-compose down

# Rebuild without cache
docker-compose build --no-cache app

# Start with new settings
docker-compose up
```

## Check Current Memory Usage

```bash
docker stats
```

This shows memory usage of running containers.

