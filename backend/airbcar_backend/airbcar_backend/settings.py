"""
Django settings for airbcar_backend project.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-dev-key-change-in-production')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.environ.get('DEBUG', 'True') == 'True'

ALLOWED_HOSTS = ['*']  # Configure properly for production

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'core',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'core.middleware.EnsureCorsHeadersMiddleware',  # Ensure CORS headers even on errors
]

ROOT_URLCONF = 'airbcar_backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'airbcar_backend.wsgi.application'

# Database
# Optimized configuration for Supabase pooler connections
# The pooler requires SSL and can close connections unexpectedly, so we optimize for reconnection
DATABASE_HOST = os.environ.get('DATABASE_HOST', 'localhost')
DATABASE_PORT = os.environ.get('DATABASE_PORT', '5432')

# Determine if we're connecting to a local database (no SSL) or remote (SSL required)
# Local databases: localhost, 127.0.0.1, or any host without a dot (assuming local network)
IS_LOCAL_DB = (
    DATABASE_HOST in ['localhost', '127.0.0.1', '::1'] or
    '.' not in DATABASE_HOST or
    DATABASE_HOST.startswith('172.') or  # Docker internal networks
    DATABASE_HOST.startswith('192.168.')  # Private networks
)

# Base database options
db_options = {
    # Connection timeout - shorter for faster failure and reconnection
    'connect_timeout': 10,
    # Keepalive settings - more aggressive to detect dead connections faster
    'keepalives': 1,
    'keepalives_idle': 30,  # Start sending keepalives after 30 seconds of idle
    'keepalives_interval': 10,  # Send keepalive probe every 10 seconds
    'keepalives_count': 3,  # Allow 3 failed probes before considering connection dead
}

# Add SSL configuration only for remote databases (Supabase, etc.)
if not IS_LOCAL_DB:
    db_options['sslmode'] = 'require'  # Supabase and remote databases require SSL
else:
    db_options['sslmode'] = 'disable'  # Local databases typically don't have SSL enabled

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('DATABASE_NAME', 'postgres'),
        'USER': os.environ.get('DATABASE_USER', 'postgres'),
        'PASSWORD': os.environ.get('DATABASE_PASSWORD', ''),
        'HOST': DATABASE_HOST,
        'PORT': DATABASE_PORT,
        'OPTIONS': db_options,
        # Connection pooling - disable persistent connections to avoid stale pooler connections
        'CONN_MAX_AGE': 0,  # Always create fresh connections to avoid SSL connection closed errors
        'ATOMIC_REQUESTS': False,  # Disable to avoid long-running transactions with pooler
    }
}

# Custom User Model
AUTH_USER_MODEL = 'core.User'

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

# Media files
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# REST Framework configuration
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
}

# CORS settings
# Always allow all origins in development (including Docker)
# This ensures CORS works even if DEBUG is not properly set
CORS_ALLOW_ALL_ORIGINS = True  # Allow all origins for development
CORS_ALLOW_CREDENTIALS = True

# Also explicitly allow common development origins
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "http://127.0.0.1:8000",
    "http://localhost:8000",
    # Docker network IPs (common Docker bridge network IPs)
    "http://172.18.240.1:3001",
    "http://172.18.240.1:3000",
]

# Allow all HTTP methods including DELETE
CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]

# Allow all headers
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

# JWT Settings
from datetime import timedelta
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
}

# Email Configuration
EMAIL_BACKEND = os.environ.get('EMAIL_BACKEND', 'django.core.mail.backends.smtp.EmailBackend')
EMAIL_HOST = os.environ.get('EMAIL_HOST', 'smtp.gmail.com')
EMAIL_PORT = int(os.environ.get('EMAIL_PORT', 587))
EMAIL_USE_TLS = os.environ.get('EMAIL_USE_TLS', 'True') == 'True'
EMAIL_USE_SSL = os.environ.get('EMAIL_USE_SSL', 'False') == 'True'
EMAIL_HOST_USER = os.environ.get('EMAIL_HOST_USER', '')
EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD', '')
DEFAULT_FROM_EMAIL = os.environ.get('DEFAULT_FROM_EMAIL', EMAIL_HOST_USER or 'noreply@airbcar.com')

# Frontend URL for email verification links
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:3001')

# Backend URL for media files and API
BACKEND_URL = os.environ.get('BACKEND_URL', 'http://localhost:8000')

