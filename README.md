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

## Deployment

The project includes GitHub Actions workflows for automatic deployment:

- **Backend Tests**: Django unit tests
- **API Tests**: Newman/Postman collection tests
- **Build**: Docker image building
- **Deploy**: Automated deployment pipeline

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions:
- Create an issue in this repository
- Contact the development team

## Architecture




*************