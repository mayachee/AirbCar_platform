# Running AirbCar Backend with Docker

## Quick Start

### 1. Start the Backend Only

```bash
# Navigate to project root
cd /path/to/AirbCar

# Start only the backend service
docker-compose up web

# Or run in detached mode (background)
docker-compose up -d web
```

### 2. Start Backend and Frontend

```bash
# Start both services
docker-compose up

# Or in detached mode
docker-compose up -d
```

### 3. View Logs

```bash
# View backend logs
docker-compose logs -f web

# View all logs
docker-compose logs -f
```

### 4. Stop Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

## Environment Variables

The `docker-compose.yml` file includes environment variables. For production, you should:

1. Create a `.env` file in the project root (optional, as variables are in docker-compose.yml)
2. Or modify the environment variables in `docker-compose.yml`

### Important Environment Variables:

- `DEBUG`: Set to "True" for development, "False" for production
- `DATABASE_HOST`: Your Supabase database host
- `DATABASE_PASSWORD`: Your database password
- `SECRET_KEY`: Django secret key (should be set in production)
- `EMAIL_HOST_PASSWORD`: Gmail app password for sending emails

## Database Setup

The backend connects to Supabase PostgreSQL. Make sure:
- Database credentials are correct in `docker-compose.yml`
- Database is accessible from your network
- SSL is enabled (handled automatically for remote databases)

## Running Migrations

Migrations run automatically on container startup via `entrypoint.sh`. To run manually:

```bash
# Run migrations
docker-compose exec web python manage.py migrate

# Create superuser
docker-compose exec web python manage.py createsuperuser
```

## Accessing the Backend

- **API Root**: http://localhost:8000/
- **Health Check**: http://localhost:8000/api/health/
- **Admin Panel**: http://localhost:8000/admin/
- **API Docs**: Check the root endpoint for available endpoints

## Troubleshooting

### Port Already in Use

If port 8000 is already in use, change it in `docker-compose.yml`:

```yaml
ports:
  - "8001:8000"  # Change 8001 to any available port
```

### Database Connection Issues

1. Check database credentials in `docker-compose.yml`
2. Verify database is accessible
3. Check logs: `docker-compose logs web`

### Rebuild After Code Changes

```bash
# Rebuild the container
docker-compose build web

# Rebuild and restart
docker-compose up --build web
```

### View Container Shell

```bash
# Access container shell
docker-compose exec web bash

# Run Django commands
docker-compose exec web python manage.py shell
docker-compose exec web python manage.py createsuperuser
```

## Development Tips

1. **Hot Reload**: Code changes in `backend/airbcar_backend` are mounted as volumes, so changes are reflected immediately (may need container restart for some changes)

2. **Static Files**: Collected automatically on startup. If issues occur:
   ```bash
   docker-compose exec web python manage.py collectstatic --noinput
   ```

3. **Database Reset**: To reset the database:
   ```bash
   docker-compose exec web python manage.py flush
   docker-compose exec web python manage.py migrate
   ```

## Production Considerations

For production deployment:
1. Set `DEBUG=False` in environment variables
2. Set a strong `SECRET_KEY`
3. Use proper database credentials
4. Configure proper CORS settings
5. Set up proper logging
6. Use environment variables file (`.env`) instead of hardcoding in docker-compose.yml

