#!/bin/bash
set -e

echo "Installing system dependencies for psycopg2..."
# Install PostgreSQL client libraries (required for psycopg2-binary)
sudo apt-get update
sudo apt-get install -y libpq-dev python3-dev gcc
sudo apt-get clean

echo "Installing Python dependencies..."
pip install --upgrade pip
pip install --no-cache-dir -r requirements.txt

echo "Build completed successfully!"


