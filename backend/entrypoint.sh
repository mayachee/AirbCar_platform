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
# Try normal migrate
python manage.py migrate --noinput || echo "Migrations completed or skipped"

# Run manual fix script to ensure columns exist if migration failed
if [ -f "fix_db_manually.py" ]; then
    echo "Running manual DB fix script to repair schema..."
    python fix_db_manually.py || echo "Manual fix script failed"
fi

# Create superuser if environment variables are set
if [ -n "$DJANGO_SUPERUSER_EMAIL" ] && [ -n "$DJANGO_SUPERUSER_PASSWORD" ]; then
    echo "Creating superuser if needed..."
    python manage.py shell << EOF
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username="$DJANGO_SUPERUSER_USERNAME").exists():
    User.objects.create_superuser(
        username="$DJANGO_SUPERUSER_USERNAME",
        email="$DJANGO_SUPERUSER_EMAIL",
        password="$DJANGO_SUPERUSER_PASSWORD"
    )
    print("Superuser created successfully!")
else:
    print("Superuser already exists.")
EOF
fi

echo "Collecting static files..."
python manage.py collectstatic --noinput || echo "Collectstatic skipped or failed"

echo "Starting application..."
exec "$@"