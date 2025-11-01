# Development Setup Guide

## Problem
The Next.js frontend was experiencing severe performance issues when running in Docker (800+ second response times). This is due to memory constraints and Next.js development server not being optimized for Docker.

## Solution
Run the **frontend locally** and the **backend in Docker**. This provides:
- ✅ Much faster development experience
- ✅ Better debugging capabilities
- ✅ No memory constraints
- ✅ Faster test runs

## Quick Start

### 1. Start Backend (Docker)
```bash
docker-compose up web
```

This will start only the backend API at `http://localhost:8000`

### 2. Start Frontend (Local)
Open a new terminal and run:
```bash
cd frontend
npm install  # Only needed the first time
npm run dev
```

This will start the frontend at `http://localhost:3000`

### 3. Run E2E Tests
```bash
cd frontend
npm run test:e2e
```

The tests will:
1. Use the locally running frontend (which must be started separately)
2. Connect to the Docker backend at `http://localhost:8000`

## Stopping Services

To stop backend:
```bash
docker-compose down
```

To stop frontend:
Press `Ctrl+C` in the terminal running `npm run dev`

## Troubleshooting

### Frontend can't connect to backend
- Make sure `docker-compose up web` is running
- Check that backend is accessible at `http://localhost:8000`
- Verify CORS settings in `backend/airbcar_backend/airbcar_backend/settings.py`

### Port 3000 already in use
```bash
# Find and kill the process using port 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Tests timing out
- Make sure both frontend (`npm run dev`) and backend (`docker-compose up web`) are running
- Check that frontend is responding at `http://localhost:3000`
- Check that backend is responding at `http://localhost:8000`

## Production Deployment

For production, you'll need to build and run the frontend in Docker. The frontend service in `docker-compose.yml` has been commented out but preserved. To use it:

1. Increase Docker memory limits (minimum 4GB)
2. Use production mode
3. Uncomment the `app` service in `docker-compose.yml`
4. Adjust memory settings in `docker-compose.yml`

