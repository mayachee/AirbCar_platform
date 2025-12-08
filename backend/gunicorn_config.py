# Gunicorn configuration file for production
import multiprocessing
import os

# Use PORT from environment (set by Render/Railway/Heroku) or default to 8000
# Bind to 0.0.0.0 to accept external connections (required for Render)
bind = f"0.0.0.0:{os.environ.get('PORT', '8000')}"
workers = int(os.environ.get('GUNICORN_WORKERS', multiprocessing.cpu_count() * 2 + 1))
worker_class = "sync"
worker_connections = 1000
timeout = 120  # Increased to 120 seconds to handle slow database queries
keepalive = 5  # Increased keepalive
graceful_timeout = 30
max_requests = 1000
max_requests_jitter = 50

# Logging
accesslog = "-"
errorlog = "-"
loglevel = "info"

# Process naming
proc_name = "airbcar_backend"

# Server socket
backlog = 2048

