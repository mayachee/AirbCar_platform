# PowerShell script to run AirbCar Backend with Docker

Write-Host "🚀 Starting AirbCar Backend with Docker..." -ForegroundColor Green

# Check if docker-compose is available
try {
    docker-compose --version | Out-Null
} catch {
    Write-Host "❌ docker-compose is not installed. Please install Docker Desktop first." -ForegroundColor Red
    exit 1
}

# Check if Docker is running
try {
    docker info | Out-Null
} catch {
    Write-Host "❌ Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
    exit 1
}

# Build and start the backend
Write-Host "📦 Building and starting backend container..." -ForegroundColor Yellow
docker-compose up --build web

