#!/bin/bash
# SPACS AFRICA - Start Celery Worker on Linux

echo "========================================"
echo "  SPACS AFRICA - Celery Worker"
echo "========================================"
echo ""

# Navigate to backend directory
cd "$(dirname "$0")/backend"

# Set environment variables
export DATABASE_URL="postgresql://spacs_user:spacs_secure_password_2025@localhost:5432/spacs_africa"
export REDIS_URL="redis://localhost:6379/0"
export CELERY_BROKER_URL="redis://localhost:6379/1"
export CELERY_RESULT_BACKEND="redis://localhost:6379/2"

# Activate virtual environment
source venv/bin/activate

echo "Starting Celery worker..."
echo ""

# Start Celery
celery -A celery_worker.celery worker --loglevel=info
