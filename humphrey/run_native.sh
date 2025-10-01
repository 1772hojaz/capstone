#!/bin/bash
# SPACS AFRICA - Run with Docker for DB only, native backend/frontend

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${CYAN}========================================"
echo -e "  SPACS AFRICA - Hybrid Startup"
echo -e "  Docker: PostgreSQL + Redis"
echo -e "  Native: Backend + Frontend"
echo -e "========================================${NC}"
echo ""

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Create logs directory
mkdir -p logs

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}✗ Docker is not running${NC}"
    echo -e "${YELLOW}  Please start Docker first${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Docker is running${NC}"

# Start PostgreSQL and Redis with Docker
echo -e "${CYAN}Starting PostgreSQL and Redis containers...${NC}"
docker-compose -f docker-compose-db-only.yml up -d

# Wait for databases to be ready
echo -e "${YELLOW}Waiting for databases to be ready...${NC}"
sleep 5

# Check if PostgreSQL is ready
until docker exec spacs_postgres pg_isready -U spacs_user > /dev/null 2>&1; do
    echo -e "${YELLOW}  Waiting for PostgreSQL...${NC}"
    sleep 2
done
echo -e "${GREEN}✓ PostgreSQL is ready${NC}"

# Check if Redis is ready
until docker exec spacs_redis redis-cli ping > /dev/null 2>&1; do
    echo -e "${YELLOW}  Waiting for Redis...${NC}"
    sleep 2
done
echo -e "${GREEN}✓ Redis is ready${NC}"

echo ""

# Set environment variables
export DATABASE_URL="postgresql://spacs_user:spacs_secure_password_2025@localhost:5432/spacs_africa"
export REDIS_URL="redis://localhost:6379/0"
export CELERY_BROKER_URL="redis://localhost:6379/1"
export CELERY_RESULT_BACKEND="redis://localhost:6379/2"
export SECRET_KEY="spacs-africa-secret-key-32-chars-minimum"
export ALGORITHM="HS256"
export ACCESS_TOKEN_EXPIRE_MINUTES="30"
export ENVIRONMENT="development"

echo -e "${GREEN}✓ Environment variables set${NC}"
echo ""

# Check if ports 8000 and 3000 are available
if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${RED}✗ Port 8000 is already in use${NC}"
    echo -e "${YELLOW}  Kill it with: sudo lsof -ti:8000 | xargs kill -9${NC}"
    exit 1
fi

if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${RED}✗ Port 3000 is already in use${NC}"
    echo -e "${YELLOW}  Kill it with: sudo lsof -ti:3000 | xargs kill -9${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Ports 8000 and 3000 are available${NC}"
echo ""

# Start backend
echo -e "${CYAN}Starting Backend API (native)...${NC}"
cd "$SCRIPT_DIR/backend"

if [ ! -d "venv" ]; then
    echo -e "${YELLOW}Creating virtual environment...${NC}"
    python3.11 -m venv venv
    source venv/bin/activate
    pip install --upgrade pip
    pip install -r requirements.txt
else
    source venv/bin/activate
fi

# Start backend in background
nohup python -m uvicorn main:app --host 127.0.0.1 --port 8000 > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > ../logs/backend.pid
echo -e "${GREEN}✓ Backend started (PID: $BACKEND_PID)${NC}"

# Start Celery worker in background
echo -e "${CYAN}Starting Celery worker (native)...${NC}"
nohup celery -A celery_worker.celery worker --loglevel=info > ../logs/celery.log 2>&1 &
CELERY_PID=$!
echo $CELERY_PID > ../logs/celery.pid
echo -e "${GREEN}✓ Celery started (PID: $CELERY_PID)${NC}"

# Deactivate venv for frontend
deactivate 2>/dev/null || true

# Start frontend
echo -e "${CYAN}Starting Frontend (native)...${NC}"
cd "$SCRIPT_DIR/frontend"

if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing npm dependencies...${NC}"
    npm install
fi

nohup npm start > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > ../logs/frontend.pid
echo -e "${GREEN}✓ Frontend started (PID: $FRONTEND_PID)${NC}"

echo ""
echo -e "${GREEN}========================================="
echo -e "  SPACS AFRICA Started Successfully!"
echo -e "=========================================${NC}"
echo ""
echo -e "${CYAN}Services:${NC}"
echo -e "  ${YELLOW}Docker Containers:${NC}"
echo -e "    • PostgreSQL (port 5432)"
echo -e "    • Redis (port 6379)"
echo ""
echo -e "  ${YELLOW}Native Processes:${NC}"
echo -e "    • Backend API:  ${YELLOW}http://localhost:8000${NC}"
echo -e "    • API Docs:     ${YELLOW}http://localhost:8000/docs${NC}"
echo -e "    • Frontend:     ${YELLOW}http://localhost:3000${NC}"
echo ""
echo -e "${CYAN}Credentials:${NC}"
echo -e "  • Email:    ${YELLOW}admin@spacsafrica.com${NC}"
echo -e "  • Password: ${YELLOW}admin123${NC}"
echo ""
echo -e "${CYAN}Logs:${NC}"
echo -e "  • Backend:  tail -f logs/backend.log"
echo -e "  • Celery:   tail -f logs/celery.log"
echo -e "  • Frontend: tail -f logs/frontend.log"
echo ""
echo -e "${CYAN}Stop all services:${NC}"
echo -e "  ./stop_native.sh"
echo ""
echo -e "${YELLOW}Wait ~30 seconds for all services to start completely${NC}"
echo ""

