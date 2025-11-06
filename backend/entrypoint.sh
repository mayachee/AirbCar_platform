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

# Try to run migrations normally, capture output
MIGRATE_OUTPUT=$(python manage.py migrate --noinput 2>&1)
MIGRATE_STATUS=$?

if [ $MIGRATE_STATUS -ne 0 ]; then
    echo "$MIGRATE_OUTPUT"
    # If migration fails due to inconsistent history (0021 applied before 0020), fix it
    if echo "$MIGRATE_OUTPUT" | grep -q "0021_create_review_table is applied before.*0020_create_review_table"; then
        echo "Fixing inconsistent migration history: inserting 0020 migration record directly..."
        # Use Python to directly insert the migration record into the database
        python <<PYTHON_SCRIPT
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'airbcar_backend.settings')
django.setup()
from django.db import connection
from django.utils import timezone

with connection.cursor() as cursor:
    # Get the timestamp from the 0019 migration
    cursor.execute("""
        SELECT applied FROM django_migrations 
        WHERE app = 'core' AND name = '0019_create_favorite_table'
        LIMIT 1
    """)
    row = cursor.fetchone()
    if row:
        applied_time = row[0]
        # Insert 0020 migration record
        # Check if migration already exists
        cursor.execute("""
            SELECT COUNT(*) FROM django_migrations 
            WHERE app = 'core' AND name = '0020_create_review_table'
        """)
        exists = cursor.fetchone()[0] > 0
        if not exists:
            cursor.execute("""
                INSERT INTO django_migrations (app, name, applied) 
                VALUES ('core', '0020_create_review_table', %s)
            """, [applied_time])
        connection.commit()
        print("Successfully inserted migration 0020 record")
    else:
        print("Could not find migration 0019, using current time")
        # Check if migration already exists
        cursor.execute("""
            SELECT COUNT(*) FROM django_migrations 
            WHERE app = 'core' AND name = '0020_create_review_table'
        """)
        exists = cursor.fetchone()[0] > 0
        if not exists:
            cursor.execute("""
                INSERT INTO django_migrations (app, name, applied) 
                VALUES ('core', '0020_create_review_table', %s)
            """, [timezone.now()])
        connection.commit()
PYTHON_SCRIPT
        echo "Retrying migrations..."
        python manage.py migrate --noinput || echo "Migrations completed or skipped"
    else
        echo "Migration error occurred, but continuing..."
    fi
else
    echo "$MIGRATE_OUTPUT"
fi

# Create superuser if environment variables are set
if [ -n "$DJANGO_SUPERUSER_EMAIL" ] && [ -n "$DJANGO_SUPERUSER_PASSWORD" ]; then
    echo "Creating superuser if needed..."
    python manage.py createsuperuser --noinput --email "$DJANGO_SUPERUSER_EMAIL" --username "$DJANGO_SUPERUSER_USERNAME" 2>/dev/null || echo "Superuser already exists or creation skipped"
fi

echo "Starting application..."
# Use PORT from environment or default to 8000
export PORT=${PORT:-8000}
echo "Using PORT: ${PORT}"

# Build bind address
BIND_ADDRESS="0.0.0.0:${PORT}"
echo "Binding to: ${BIND_ADDRESS}"

exec gunicorn airbcar_backend.wsgi:application --bind "${BIND_ADDRESS}" --workers 3
