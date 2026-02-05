# ===== STAGE 1: Builder Stage =====
# Use slim image for building (smaller than default)
FROM python:3.11-slim as builder

# Install only build dependencies (removed after build)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Create virtual environment for isolated dependencies
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Copy and install requirements in builder stage
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip setuptools wheel && \
    pip install --no-cache-dir -r requirements.txt

# ===== STAGE 2: Runtime Stage =====
# Use slim image for runtime (smallest possible)
FROM python:3.11-slim

# Install ONLY runtime dependencies (no build tools!)
# This reduces image size by ~200-300MB
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    netcat-openbsd \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Copy virtual environment from builder
COPY --from=builder /opt/venv /opt/venv

# Set environment to use virtual environment
ENV PATH="/opt/venv/bin:$PATH" \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

# Create non-root user for security
RUN useradd -m -u 1000 django && \
    mkdir -p /app /app/airbcar_backend/logs /app/airbcar_backend/media /app/airbcar_backend/staticfiles && \
    chown -R django:django /app

WORKDIR /app

# Copy application code (as non-root user)
COPY --chown=django:django . .

# Copy entrypoint and make executable
COPY --chown=django:django entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh && sed -i 's/\r$//' /entrypoint.sh

# Pre-create staticfiles directory with correct permissions to avoid collectstatic errors
RUN mkdir -p /app/airbcar_backend/staticfiles && chown -R django:django /app/airbcar_backend/staticfiles

WORKDIR /app/airbcar_backend

# Switch to non-root user
USER django

EXPOSE 8000

# Set entrypoint
ENTRYPOINT ["/entrypoint.sh"]

# Use gunicorn_config.py which already has gevent configured
CMD ["sh", "-c", "gunicorn airbcar_backend.wsgi:application --bind 0.0.0.0:${PORT:-8000} --config ../gunicorn_config.py"]