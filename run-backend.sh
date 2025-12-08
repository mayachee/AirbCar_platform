#!/bin/bash

# Script to run AirbCar Backend with Docker

echo "🚀 Starting AirbCar Backend with Docker..."

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Build and start the backend
echo "📦 Building and starting backend container..."
docker-compose up --build web

