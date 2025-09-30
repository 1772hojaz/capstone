# SPACS AFRICA - Quick Setup Script for Windows PowerShell
# This script sets up the complete development environment

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SPACS AFRICA - Quick Setup Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
Write-Host "Checking Docker..." -ForegroundColor Yellow
$dockerRunning = $false
try {
    docker info | Out-Null
    $dockerRunning = $true
    Write-Host "✓ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker is not running" -ForegroundColor Red
    Write-Host "  Please start Docker Desktop and run this script again" -ForegroundColor Red
    exit 1
}

# Check if docker-compose is available
Write-Host "Checking Docker Compose..." -ForegroundColor Yellow
try {
    docker-compose --version | Out-Null
    Write-Host "✓ Docker Compose is available" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker Compose is not available" -ForegroundColor Red
    Write-Host "  Please install Docker Compose and run this script again" -ForegroundColor Red
    exit 1
}

# Create .env file if it doesn't exist
if (-not (Test-Path ".env")) {
    Write-Host ""
    Write-Host "Creating .env file..." -ForegroundColor Yellow
    
    $envContent = @"
# Database Configuration
POSTGRES_USER=spacs_user
POSTGRES_PASSWORD=spacs_secure_password_2025
POSTGRES_DB=spacs_africa
DATABASE_URL=postgresql://spacs_user:spacs_secure_password_2025@postgres:5432/spacs_africa

# Redis Configuration
REDIS_URL=redis://redis:6379/0

# JWT Authentication
SECRET_KEY=$(([char[]]([char]'A'..[char]'Z') + [char[]]([char]'a'..[char]'z') + 0..9 | Get-Random -Count 32) -join '')
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Celery Configuration
CELERY_BROKER_URL=redis://redis:6379/1
CELERY_RESULT_BACKEND=redis://redis:6379/2

# Application
ENVIRONMENT=development

# Frontend
REACT_APP_API_URL=http://localhost:8000
REACT_APP_WS_URL=ws://localhost:8000
"@
    
    $envContent | Out-File -FilePath ".env" -Encoding utf8
    Write-Host "✓ .env file created" -ForegroundColor Green
} else {
    Write-Host "✓ .env file already exists" -ForegroundColor Green
}

# Start Docker containers
Write-Host ""
Write-Host "Starting Docker containers..." -ForegroundColor Yellow
Write-Host "This may take a few minutes on first run..." -ForegroundColor Gray

docker-compose up -d

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Docker containers started successfully" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to start Docker containers" -ForegroundColor Red
    exit 1
}

# Wait for services to be ready
Write-Host ""
Write-Host "Waiting for services to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Check if API is responding
Write-Host "Checking API health..." -ForegroundColor Yellow
$maxAttempts = 12
$attempt = 0
$apiReady = $false

while ($attempt -lt $maxAttempts -and -not $apiReady) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8000/health" -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            $apiReady = $true
            Write-Host "✓ API is ready" -ForegroundColor Green
        }
    } catch {
        $attempt++
        Write-Host "  Waiting for API... ($attempt/$maxAttempts)" -ForegroundColor Gray
        Start-Sleep -Seconds 5
    }
}

if (-not $apiReady) {
    Write-Host "⚠ API might not be ready yet. Check logs with: docker-compose logs backend" -ForegroundColor Yellow
}

# Display success message and next steps
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  ✓ SPACS AFRICA Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Services running:" -ForegroundColor Cyan
Write-Host "  • PostgreSQL:      localhost:5432" -ForegroundColor White
Write-Host "  • Redis:           localhost:6379" -ForegroundColor White
Write-Host "  • API Backend:     http://localhost:8000" -ForegroundColor White
Write-Host "  • API Docs:        http://localhost:8000/docs" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Open API docs:  " -NoNewline -ForegroundColor White
Write-Host "http://localhost:8000/docs" -ForegroundColor Yellow
Write-Host ""
Write-Host "  2. Login as admin:" -ForegroundColor White
Write-Host "     Email:    " -NoNewline -ForegroundColor Gray
Write-Host "admin@spacsafrica.com" -ForegroundColor Yellow
Write-Host "     Password: " -NoNewline -ForegroundColor Gray
Write-Host "admin123" -ForegroundColor Yellow
Write-Host ""
Write-Host "  3. Generate synthetic data:" -ForegroundColor White
Write-Host "     POST /api/admin/generate-synthetic-data" -ForegroundColor Gray
Write-Host ""
Write-Host "  4. Train ML model:" -ForegroundColor White
Write-Host "     POST /api/admin/retrain-clustering" -ForegroundColor Gray
Write-Host ""
Write-Host "  5. View metrics:" -ForegroundColor White
Write-Host "     GET /api/admin/evaluation" -ForegroundColor Gray
Write-Host ""
Write-Host "Useful commands:" -ForegroundColor Cyan
Write-Host "  • View logs:       " -NoNewline -ForegroundColor White
Write-Host "docker-compose logs -f" -ForegroundColor Yellow
Write-Host "  • Stop services:   " -NoNewline -ForegroundColor White
Write-Host "docker-compose down" -ForegroundColor Yellow
Write-Host "  • Restart:         " -NoNewline -ForegroundColor White
Write-Host "docker-compose restart" -ForegroundColor Yellow
Write-Host ""
Write-Host "Documentation:" -ForegroundColor Cyan
Write-Host "  • README.md        - Full system documentation" -ForegroundColor White
Write-Host "  • QUICKSTART.md    - 5-minute setup guide" -ForegroundColor White
Write-Host "  • SYSTEM_SUMMARY.md - Architecture deep dive" -ForegroundColor White
Write-Host "  • DEPLOYMENT_GUIDE.md - Production deployment" -ForegroundColor White
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
