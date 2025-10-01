#!/bin/bash
# SPACS AFRICA - Start Backend on Linux

echo "========================================"
echo "  SPACS AFRICA - Backend Startup"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Navigate to backend directory
cd "$(dirname "$0")/backend"

# Set environment variables
export DATABASE_URL="postgresql://spacs_user:spacs_secure_password_2025@localhost:5432/spacs_africa"
export REDIS_URL="redis://localhost:6379/0"
export CELERY_BROKER_URL="redis://localhost:6379/1"
export CELERY_RESULT_BACKEND="redis://localhost:6379/2"
export SECRET_KEY="spacs-africa-super-secret-key-change-in-production-min-32-chars"
export ALGORITHM="HS256"
export ACCESS_TOKEN_EXPIRE_MINUTES="30"
export ENVIRONMENT="development"

echo -e "${GREEN}✓ Environment variables set${NC}"

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo -e "${YELLOW}Creating virtual environment...${NC}"
    python3.11 -m venv venv
    source venv/bin/activate
    echo -e "${YELLOW}Installing dependencies...${NC}"
    pip install -r requirements.txt
else
    source venv/bin/activate
fi

echo -e "${GREEN}✓ Virtual environment activated${NC}"
echo ""
echo "========================================"
echo -e "${GREEN}  Starting FastAPI Server...${NC}"
echo "========================================"
echo ""
echo -e "${CYAN}API will be available at:${NC}"
echo "  • API: http://localhost:8000"
echo "  • Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start uvicorn
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
