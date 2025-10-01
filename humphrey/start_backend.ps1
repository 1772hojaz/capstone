# Start SPACS AFRICA Backend Locally (No Docker)
# Run this from the backend directory

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SPACS AFRICA - Local Backend Startup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Set environment variables
$env:DATABASE_URL="postgresql://spacs_user:spacs_secure_password_2025@localhost:5432/spacs_africa"
$env:REDIS_URL="redis://localhost:6379/0"
$env:CELERY_BROKER_URL="redis://localhost:6379/1"
$env:CELERY_RESULT_BACKEND="redis://localhost:6379/2"
$env:SECRET_KEY="spacs-africa-super-secret-key-change-in-production-min-32-chars"
$env:ALGORITHM="HS256"
$env:ACCESS_TOKEN_EXPIRE_MINUTES="30"
$env:ENVIRONMENT="development"

Write-Host "✓ Environment variables set" -ForegroundColor Green

# Activate virtual environment
if (Test-Path "venv\Scripts\Activate.ps1") {
    Write-Host "✓ Activating virtual environment..." -ForegroundColor Yellow
    & .\venv\Scripts\Activate.ps1
} else {
    Write-Host "✗ Virtual environment not found. Creating it..." -ForegroundColor Yellow
    python -m venv venv
    & .\venv\Scripts\Activate.ps1
    Write-Host "✓ Installing dependencies..." -ForegroundColor Yellow
    pip install -r requirements.txt
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Starting FastAPI Server..." -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "API will be available at:" -ForegroundColor Cyan
Write-Host "  • API: http://localhost:8000" -ForegroundColor White
Write-Host "  • Docs: http://localhost:8000/docs" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Gray
Write-Host ""

# Start uvicorn
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
