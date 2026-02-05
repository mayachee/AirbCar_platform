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

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.environ.get('DEBUG', 'False').lower() == 'true'

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.environ.get('SECRET_KEY')
if not SECRET_KEY:
    # Use a fallback key for development/build environments if not set
    # WARN: This is not secure for production
    if DEBUG or os.environ.get('CI') or os.environ.get('BUILD_ENV'):
        if DEBUG:
            print("WARNING: SECRET_KEY not set, using insecure fallback key (development only).")
        SECRET_KEY = 'django-insecure-fallback-key-for-dev-and-build-only'
    else:
        raise ValueError('SECRET_KEY environment variable must be set')

# ALLOWED_HOSTS - Allow Render domain and any custom domain
ALLOWED_HOSTS_ENV = os.environ.get('ALLOWED_HOSTS', '')
if ALLOWED_HOSTS_ENV:
    # Split by comma and strip whitespace, remove protocol if present
    hosts = []
    for host in ALLOWED_HOSTS_ENV.split(','):
        host = host.strip()
        if host:
            # Remove http:// or https:// if present
            host = host.replace('http://', '').replace('https://', '')
            # Remove trailing slash
            host = host.rstrip('/')
            hosts.append(host)
    ALLOWED_HOSTS = hosts
else:
    # Default: allow common Render patterns and localhost for development
    # Note: Django doesn't accept '*' when DEBUG=False, so we need explicit hosts
    ALLOWED_HOSTS = [
        'airbcar-backend.onrender.com',
        '.onrender.com',  # Allow any Render subdomain (wildcard subdomain)
        'localhost',
        '127.0.0.1',
        'testserver',  # Django test client
    ]

# Always add the explicit Render domain as a fallback
if 'airbcar-backend.onrender.com' not in ALLOWED_HOSTS:
    ALLOWED_HOSTS.append('airbcar-backend.onrender.com')
if '.onrender.com' not in ALLOWED_HOSTS:
    ALLOWED_HOSTS.append('.onrender.com')

# ===== SECURITY SETTINGS FOR PRODUCTION =====
# These are applied based on DEBUG setting and environment
IS_PRODUCTION = not DEBUG and os.environ.get('ENVIRONMENT', 'development') == 'production'

if IS_PRODUCTION:
    # HTTPS/SSL Settings
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_HSTS_SECONDS = 31536000  # 1 year
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    
    # Additional security headers
    SECURE_CONTENT_TYPE_NOSNIFF = True
    SECURE_BROWSER_XSS_FILTER = True
    X_FRAME_OPTIONS = 'DENY'
    SECURE_REFERRER_POLICY = 'strict-origin-when-cross-origin'
else:
    # Development settings - allow non-HTTPS
    SECURE_SSL_REDIRECT = False
    SESSION_COOKIE_SECURE = False
    CSRF_COOKIE_SECURE = False

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
    # 'rest_framework_simplejwt.token_blacklist',  # Disabled to fix login 500 error (missing table)
    'corsheaders',
    'core',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',  # Serve static files
    'django.middleware.gzip.GZipMiddleware',  # Compress responses for faster transfer
    # REMOVED: SessionMiddleware - Not needed for JWT auth (saves memory + processing)
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    # REMOVED: MessageMiddleware - Not needed for API (no message framework)
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'core.middleware.EnsureCorsHeadersMiddleware',  # Ensure CORS headers even on errors
]

ROOT_URLCONF = 'airbcar_backend.urls'

# --- Security hardening (production-safe defaults) ---
# Render/Reverse proxy support: trust X-Forwarded-Proto for HTTPS detection.
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
USE_X_FORWARDED_HOST = True

# Redirect HTTP->HTTPS in production (can be disabled if handled upstream).
SECURE_SSL_REDIRECT = (not DEBUG) and (os.environ.get('SECURE_SSL_REDIRECT', 'True').lower() == 'true')

# Cookies
SESSION_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SECURE = not DEBUG
SESSION_COOKIE_HTTPONLY = True
CSRF_COOKIE_HTTPONLY = False
SESSION_COOKIE_SAMESITE = os.environ.get('SESSION_COOKIE_SAMESITE', 'Lax')
CSRF_COOKIE_SAMESITE = os.environ.get('CSRF_COOKIE_SAMESITE', 'Lax')

# Browser security headers
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'
SECURE_REFERRER_POLICY = 'strict-origin-when-cross-origin'
SECURE_CROSS_ORIGIN_OPENER_POLICY = 'same-origin'

# HSTS (enable only in production)
SECURE_HSTS_SECONDS = int(os.environ.get('SECURE_HSTS_SECONDS', '31536000' if not DEBUG else '0'))
SECURE_HSTS_INCLUDE_SUBDOMAINS = not DEBUG
SECURE_HSTS_PRELOAD = not DEBUG

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
    # Connection timeout - increased for slow connections
    'connect_timeout': 20,
    # Keepalive settings - more aggressive to detect dead connections faster
    'keepalives': 1,
    'keepalives_idle': 30,  # Start sending keepalives after 30 seconds of idle
    'keepalives_interval': 10,  # Send keepalive probe every 10 seconds
    'keepalives_count': 3,  # Allow 3 failed probes before considering connection dead
    # Connection pool settings for better performance
    'options': '-c statement_timeout=60000',  # 60 second statement timeout
}

# Add SSL configuration only for remote databases (Supabase, etc.)
if not IS_LOCAL_DB:
    db_options['sslmode'] = 'require'  # Supabase and remote databases require SSL
else:
    db_options['sslmode'] = 'disable'  # Local databases typically don't have SSL enabled

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        # Note: Works with both psycopg2 and psycopg3
        'NAME': os.environ.get('DATABASE_NAME', 'postgres'),
        'USER': os.environ.get('DATABASE_USER', 'postgres'),
        'PASSWORD': os.environ.get('DATABASE_PASSWORD', ''),
        'HOST': DATABASE_HOST,
        'PORT': DATABASE_PORT,
        'OPTIONS': db_options,
        # Connection pooling - Optimized for gevent workers
        'CONN_MAX_AGE': 300,  # Reduced to 5 minutes (from 10) for better connection turnover with gevent
        'CONN_HEALTH_CHECKS': True,  # Django 4.1+ - Validate connections before use (prevents stale connection errors)
        'ATOMIC_REQUESTS': False,  # Disable to avoid long-running transactions with pooler
    }
}

# Custom User Model
AUTH_USER_MODEL = 'core.User'

# Caching Configuration - Use memory cache for better performance
# In production, consider Redis for distributed caching
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'unique-snowflake',
        'TIMEOUT': 300,  # 5 minutes default timeout
        'OPTIONS': {
            'MAX_ENTRIES': 1000  # Limit cache size to prevent memory issues
        }
    }
}

# Cache settings for better performance
CACHE_MIDDLEWARE_ALIAS = 'default'
CACHE_MIDDLEWARE_SECONDS = 300  # Cache pages for 5 minutes
CACHE_MIDDLEWARE_KEY_PREFIX = 'airbcar'

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

# WhiteNoise configuration for serving static files
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# Media files
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# REST Framework configuration
ENABLE_THROTTLING = os.environ.get('ENABLE_THROTTLING', 'False' if DEBUG else 'True').lower() == 'true'
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 15,  # Reduced from 20 to 15 for faster response times
    'MAX_PAGE_SIZE': 100,  # Security: Prevent DoS attacks from huge page requests
    'EXCEPTION_HANDLER': 'core.exceptions.custom_exception_handler',
    # Performance optimizations
    'DEFAULT_RENDERER_CLASSES': (
        'rest_framework.renderers.JSONRenderer',  # Removed BrowsableAPIRenderer for production speed
    ),
    'COMPACT_JSON': not DEBUG,  # Remove whitespace from JSON in production
}

if ENABLE_THROTTLING:
    REST_FRAMEWORK['DEFAULT_THROTTLE_CLASSES'] = (
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    )
    REST_FRAMEWORK['DEFAULT_THROTTLE_RATES'] = {
        'anon': os.environ.get('THROTTLE_ANON', '100/hour'),
        'user': os.environ.get('THROTTLE_USER', '1000/hour'),
    }

# CORS settings
# Always allow all origins in development (including Docker)
# This ensures CORS works even if DEBUG is not properly set
CORS_ALLOW_ALL_ORIGINS = DEBUG  # Never allow-all in production
CORS_ALLOW_CREDENTIALS = True

# Also explicitly allow common development origins and production URLs
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "http://127.0.0.1:8000",
    "http://localhost:8000",
    # Production domains
    "https://www.airbcar.com",
    "https://airbcar.com",
    # Docker network IPs (common Docker bridge network IPs)
    "http://172.18.240.1:3001",
    "http://172.18.240.1:3000",
]

if DEBUG:
    # Allow http origins for local dev only
    CORS_ALLOWED_ORIGINS += [
        "http://www.airbcar.com",
        "http://airbcar.com",
    ]

# Add production frontend URL from environment if provided
FRONTEND_URL_ENV = os.environ.get('FRONTEND_URL', '')
if FRONTEND_URL_ENV:
    # Remove trailing slash and add both http and https versions
    frontend_url = FRONTEND_URL_ENV.rstrip('/')
    if frontend_url not in CORS_ALLOWED_ORIGINS:
        CORS_ALLOWED_ORIGINS.append(frontend_url)
    # Also add without www and with www
    if frontend_url.startswith('https://'):
        domain = frontend_url.replace('https://', '')
        if f"https://www.{domain}" not in CORS_ALLOWED_ORIGINS:
            CORS_ALLOWED_ORIGINS.append(f"https://www.{domain}")
        if f"http://www.{domain}" not in CORS_ALLOWED_ORIGINS:
            CORS_ALLOWED_ORIGINS.append(f"http://www.{domain}")
        if f"http://{domain}" not in CORS_ALLOWED_ORIGINS:
            CORS_ALLOWED_ORIGINS.append(f"http://{domain}")

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
    'BLACKLIST_AFTER_ROTATION': False,  # Disabled to fix login 500 error
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

# CSRF trusted origins (required for secure cross-site POSTs when using cookies)
def _url_to_origin(url: str) -> str:
    url = (url or '').strip().rstrip('/')
    if not url:
        return ''
    # If scheme is missing, assume https for production safety.
    if '://' not in url:
        url = f"https://{url}"
    # Keep only scheme + host[:port]
    try:
        scheme, rest = url.split('://', 1)
        host = rest.split('/', 1)[0]
        return f"{scheme}://{host}"
    except ValueError:
        return ''

CSRF_TRUSTED_ORIGINS = []
for _candidate in [FRONTEND_URL, BACKEND_URL, os.environ.get('CSRF_TRUSTED_ORIGIN', '')]:
    origin = _url_to_origin(_candidate)
    if origin and origin not in CSRF_TRUSTED_ORIGINS:
        CSRF_TRUSTED_ORIGINS.append(origin)

extra_csrf = os.environ.get('CSRF_TRUSTED_ORIGINS', '')
if extra_csrf:
    for item in extra_csrf.split(','):
        origin = _url_to_origin(item)
        if origin and origin not in CSRF_TRUSTED_ORIGINS:
            CSRF_TRUSTED_ORIGINS.append(origin)

# Supabase Configuration for File Storage
SUPABASE_URL = os.environ.get('SUPABASE_URL', '')
SUPABASE_ANON_KEY = os.environ.get('SUPABASE_ANON_KEY', '')
SUPABASE_SERVICE_ROLE_KEY = os.environ.get('SUPABASE_SERVICE_ROLE_KEY', '')
SUPABASE_STORAGE_BUCKET_PICS = os.environ.get('SUPABASE_STORAGE_BUCKET_PICS', 'pics')
SUPABASE_STORAGE_BUCKET_LISTINGS = os.environ.get('SUPABASE_STORAGE_BUCKET_LISTINGS', 'listings')

# Logging Configuration
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '[{levelname}] {asctime} {name} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'filters': {
        'require_debug_false': {
            '()': 'django.utils.log.RequireDebugFalse',
        },
        'require_debug_true': {
            '()': 'django.utils.log.RequireDebugTrue',
        },
    },
    'handlers': {
        'console': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
        'file': {
            'level': 'WARNING',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': os.path.join(BASE_DIR, 'logs', 'django.log'),
            'maxBytes': 1024 * 1024 * 10,  # 10MB
            'backupCount': 5,
            'formatter': 'verbose',
        },
        'error_file': {
            'level': 'ERROR',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': os.path.join(BASE_DIR, 'logs', 'errors.log'),
            'maxBytes': 1024 * 1024 * 10,  # 10MB
            'backupCount': 5,
            'formatter': 'verbose',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': False,
        },
        'django.request': {
            'handlers': ['console', 'error_file'],
            'level': 'ERROR',
            'propagate': False,
        },
        'django.db.backends': {
            'handlers': ['console'],
            'level': 'WARNING',  # Set to DEBUG to see SQL queries
            'propagate': False,
        },
        'core': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': False,
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
}

