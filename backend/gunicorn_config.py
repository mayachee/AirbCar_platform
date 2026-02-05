# Gunicorn configuration file for production
import multiprocessing
import os

# Use PORT from environment (set by Render/Railway/Heroku) or default to 8000
# Bind to 0.0.0.0 to accept external connections (required for Render)
bind = f"0.0.0.0:{os.environ.get('PORT', '8000')}"

# Worker configuration - gevent for async handling
worker_class = "gevent"  # Changed from 'sync' to 'gevent' for 3x more concurrent users
workers = int(os.environ.get('GUNICORN_WORKERS', 2))  # 2 gevent workers on free tier (was CPU*2+1)
worker_connections = 1000  # Each gevent worker can handle 1000 concurrent connections!
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

