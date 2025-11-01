#!/bin/sh

# Set Django Backend URL if not provided
if [ -z "${DJANGO_API_URL:-}" ]; then
  export DJANGO_API_URL="http://web:8000"
  echo "[start.sh] No DJANGO_API_URL provided. Using default: $DJANGO_API_URL"
else
  echo "[start.sh] Using provided DJANGO_API_URL: $DJANGO_API_URL"
fi

# Clear .next cache if it exists to prevent ENOMEM errors
if [ -d ".next" ]; then
  echo "[start.sh] Clearing .next cache to free memory..."
  rm -rf .next
fi

echo "Starting Next.js application..."
if [ "$NODE_ENV" = "production" ]; then
  pnpm run build
  pnpm start
else
  echo "[start.sh] Starting in development mode with optimized settings..."
  # Use NODE_OPTIONS from environment for memory management
  # Disable turbo mode and linting for better memory usage
  exec pnpm run dev
fi
