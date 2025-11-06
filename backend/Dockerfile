FROM python:3.8-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    netcat-openbsd \
    postgresql-client \
    gcc \
    libpq-dev \
    openssl \
    ca-certificates \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Copy entrypoint
COPY entrypoint.sh /entrypoint.sh
# Fix line endings (convert CRLF to LF) and make executable
RUN tr -d '\r' < /entrypoint.sh > /entrypoint.sh.tmp && mv /entrypoint.sh.tmp /entrypoint.sh && chmod +x /entrypoint.sh

WORKDIR /app/airbcar_backend

EXPOSE 8000

# Set entrypoint to run migrations and setup before starting app
ENTRYPOINT ["/bin/bash", "/entrypoint.sh"]