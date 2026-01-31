# Airbcar - Car Rental Platform

A full-stack car rental platform built with Django REST Framework and Next.js.

## Project Structure

```
airbcar_ff/
├── backend/          # Django REST API
├── frontend/         # Next.js React application
├── .github/         # GitHub Actions workflows
└── docker-compose.yml
```

## Quick Start

### Prerequisites

- Python 3.8+
- Node.js 16+
- PostgreSQL
- Docker


### Docker Setup (Alternative)

Run the entire stack with Docker Compose:

```bash
docker-compose up --build
```

## API Documentation

The backend API includes the following endpoints:

### Authentication
- `POST /api/register/` - User registration
- `POST /api/login/` - Login (get JWT tokens)
- `POST /api/token/refresh/` - Refresh access token

### Users
- `GET /api/users/` - List all users
- `GET /users/` - List users (alternative endpoint)
- `GET /api/users/<id>/` - Get user by ID
- `PUT /api/users/<id>/` - Update user
- `DELETE /api/users/<id>/` - Delete user

### Base URL
- Development: `http://localhost:8000`

## Development

### Environment Variables

Create a `.env` file in the backend directory:

Recommended (production) backend variables:

- `SECRET_KEY` (required when `DEBUG=False`)
- `DEBUG` (set to `False` in production)
- `ALLOWED_HOSTS` (comma-separated)
- `FRONTEND_URL` (used for CORS/CSRF + email links)
- `BACKEND_URL` (used for CSRF trusted origin)
- `CSRF_TRUSTED_ORIGINS` (optional, comma-separated extra trusted origins)

Security toggles (backend):

- `SECURE_SSL_REDIRECT` (`True`/`False`, default `True` when `DEBUG=False`)
- `SECURE_HSTS_SECONDS` (default `31536000` when `DEBUG=False`)
- `ENABLE_THROTTLING` (default `True` when `DEBUG=False`)
- `THROTTLE_ANON` (default `100/hour`)
- `THROTTLE_USER` (default `1000/hour`)

Note: JWT refresh-token blacklisting is enabled via `rest_framework_simplejwt.token_blacklist`.
Run `python manage.py migrate` after deploy to create the required tables.

## Deployment

The project includes GitHub Actions workflows for automatic deployment:

- **Backend Tests**: Django unit tests
- **API Tests**: Newman/Postman collection tests
- **Build**: Docker image building
- **Deploy**: Automated deployment pipeline





*************