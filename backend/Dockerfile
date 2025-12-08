FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    netcat-openbsd \
    postgresql-client \
    libpq-dev \
    python3-dev \
    gcc \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Upgrade pip first
RUN pip install --upgrade pip setuptools wheel

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Verify whitenoise is installed
RUN pip show whitenoise || echo "WARNING: whitenoise not found"

# Copy application code
COPY . .

# Copy entrypoint and make it executable
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh && sed -i 's/\r$//' /entrypoint.sh

WORKDIR /app/airbcar_backend

EXPOSE 8000

# Set entrypoint
ENTRYPOINT ["/entrypoint.sh"]

# Use environment PORT for Render/Railway compatibility
# Use fewer workers in development to reduce memory usage
CMD ["sh", "-c", "gunicorn airbcar_backend.wsgi:application --bind 0.0.0.0:${PORT:-8000} --workers ${GUNICORN_WORKERS:-1} --timeout 120 --graceful-timeout 30"]