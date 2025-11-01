# Gunicorn configuration file for production
import multiprocessing
import os

# Use PORT from environment (set by Render/Railway/Heroku) or default to 8000
bind = f"0.0.0.0:{os.environ.get('PORT', '8000')}"
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = "sync"
worker_connections = 1000
timeout = 30
keepalive = 2
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

