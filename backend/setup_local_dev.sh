#!/bin/bash
# Quick setup script for local development

echo "🚀 Setting up local development environment..."
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cat > .env << EOF
# Local Development Configuration
# Use SQLite for easiest setup (no PostgreSQL required)
USE_SQLITE=true

# If you want to use PostgreSQL instead, set USE_SQLITE=false and configure below:
# USE_SQLITE=false
# DATABASE_HOST=localhost
# DATABASE_NAME=airbcar_db
# DATABASE_USER=airbcar_user
# DATABASE_PASSWORD=your_password_here
# DATABASE_PORT=5432

# Django Settings
DEBUG=True
SECRET_KEY=django-insecure-dev-key-change-in-production

# Email (optional)
# EMAIL_HOST_USER=your_email@gmail.com
# EMAIL_HOST_PASSWORD=your_app_password
EOF
    echo "✅ Created .env file with SQLite configuration"
else
    echo "⚠️  .env file already exists, skipping..."
fi

echo ""
echo "📦 Installing dependencies..."
pip install -r requirements.txt

echo ""
echo "🔄 Running migrations..."
python3 manage.py migrate --fake-initial

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Create a superuser: python3 manage.py createsuperuser"
echo "  2. Start the server: python3 manage.py runserver"
echo "  3. Access admin: http://localhost:8000/admin/"
echo ""
echo "To switch to PostgreSQL:"
echo "  1. Edit .env and set USE_SQLITE=false"
echo "  2. Configure DATABASE_* variables"
echo "  3. Run: python3 manage.py migrate --fake-initial"

