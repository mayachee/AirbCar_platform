#!/bin/bash

echo "Starting AirbCar Backend..."

# Wait for PostgreSQL to be available (useful for local docker-compose)
if [ -n "$DATABASE_HOST" ] && [ -n "$DATABASE_PORT" ]; then
    echo "Waiting for PostgreSQL to be available at $DATABASE_HOST:$DATABASE_PORT..."
    
    # Try to connect, but don't wait forever (30 seconds max)
    timeout=30
    counter=0
    while ! nc -z "$DATABASE_HOST" "$DATABASE_PORT"; do
        sleep 3
        counter=$((counter + 3))
        if [ $counter -ge $timeout ]; then
            echo "Timeout waiting for PostgreSQL, but continuing..."
            break
        fi
    done
    echo "PostgreSQL check complete!"
fi

# Run migrations
echo "Running database migrations..."
cd /app/airbcar_backend
python manage.py migrate --noinput || echo "Migrations completed or skipped"

# Create superuser if environment variables are set
if [ -n "$DJANGO_SUPERUSER_EMAIL" ] && [ -n "$DJANGO_SUPERUSER_PASSWORD" ]; then
    echo "Creating superuser if needed..."
    python manage.py createsuperuser --noinput --email "$DJANGO_SUPERUSER_EMAIL" --username "$DJANGO_SUPERUSER_USERNAME" 2>/dev/null || echo "Superuser already exists or creation skipped"
fi

echo "Collecting static files..."
python manage.py collectstatic --noinput || echo "Collectstatic skipped or failed"

echo "Starting application..."
exec "$@"