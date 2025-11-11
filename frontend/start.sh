#!/bin/sh

# Set Django Backend URL if not provided
if [ -z "${DJANGO_API_URL:-}" ]; then
  export DJANGO_API_URL="http://web:8000"
  echo "[start.sh] No DJANGO_API_URL provided. Using default: $DJANGO_API_URL"
else
  echo "[start.sh] Using provided DJANGO_API_URL: $DJANGO_API_URL"
fi

# Clear .next and .next-local cache if they exist to prevent ENOMEM errors
# Note: If .next is mounted as a volume, it will be busy and can't be removed
if [ -d ".next" ]; then
  echo "[start.sh] Attempting to clear .next cache to free memory..."
  rm -rf .next 2>/dev/null || echo "[start.sh] Note: .next directory is mounted as volume, skipping removal"
fi

if [ -d ".next-local" ]; then
  echo "[start.sh] Clearing .next-local cache to free memory..."
  rm -rf .next-local 2>/dev/null || echo "[start.sh] Could not remove .next-local"
fi

echo "Starting Next.js application..."

# Use dev mode instead of production build to avoid memory issues
echo "[start.sh] Starting Next.js in development mode on 0.0.0.0:3000"
export NODE_ENV=development
export HOSTNAME=0.0.0.0
export PORT=3000
exec pnpm run dev
