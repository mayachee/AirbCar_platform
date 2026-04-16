"""
Test settings — uses SQLite so tests run without a Postgres server.
"""
from airbcar_backend.settings import *  # noqa: F401, F403

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',
    }
}

# Disable heavy middleware not needed in tests
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
    }
}

# Speed up password hashing in tests
PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.MD5PasswordHasher',
]

# Suppress logging noise
LOGGING = {}

# Skip Supabase / email backends
DEFAULT_FILE_STORAGE = 'django.core.files.storage.FileSystemStorage'
EMAIL_BACKEND = 'django.core.mail.backends.locmem.EmailBackend'

REST_FRAMEWORK["EXCEPTION_HANDLER"] = "rest_framework.views.exception_handler"
