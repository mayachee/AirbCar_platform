# Gunicorn configuration file for production
import multiprocessing
import os

# Use PORT from environment (set by Render/Railway/Heroku) or default to 8000
# Bind to 0.0.0.0 to accept external connections (required for Render)
bind = f"0.0.0.0:{os.environ.get('PORT', '8000')}"

# Worker configuration - prioritize stability in production
# gevent can be unstable in some constrained/free-tier runtime combinations.
worker_class = "sync"
workers = int(os.environ.get('GUNICORN_WORKERS', 1))
timeout = 120
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

