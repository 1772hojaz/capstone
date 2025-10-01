#!/bin/bash
# SPACS AFRICA - Stop Native Services and Docker DBs

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${YELLOW}Stopping SPACS AFRICA services...${NC}"
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Create logs directory if it doesn't exist
mkdir -p logs

# Stop native processes
echo -e "${CYAN}Stopping native processes...${NC}"

# Stop backend
if [ -f "logs/backend.pid" ]; then
    BACKEND_PID=$(cat logs/backend.pid)
    if kill -0 $BACKEND_PID 2>/dev/null; then
        kill $BACKEND_PID
        echo -e "${GREEN}✓ Backend stopped${NC}"
    fi
    rm -f logs/backend.pid
fi

# Stop Celery
if [ -f "logs/celery.pid" ]; then
    CELERY_PID=$(cat logs/celery.pid)
    if kill -0 $CELERY_PID 2>/dev/null; then
        kill $CELERY_PID
        echo -e "${GREEN}✓ Celery stopped${NC}"
    fi
    rm -f logs/celery.pid
fi

# Stop frontend
if [ -f "logs/frontend.pid" ]; then
    FRONTEND_PID=$(cat logs/frontend.pid)
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        kill $FRONTEND_PID
        echo -e "${GREEN}✓ Frontend stopped${NC}"
    fi
    rm -f logs/frontend.pid
fi

# Kill any remaining processes
pkill -f "uvicorn main:app" 2>/dev/null
pkill -f "celery.*celery_worker" 2>/dev/null
pkill -f "react-scripts start" 2>/dev/null

echo ""
echo -e "${CYAN}Stopping Docker containers...${NC}"

# Stop Docker containers
docker-compose -f docker-compose-db-only.yml down

echo ""
echo -e "${GREEN}All services stopped${NC}"
echo ""
echo -e "${YELLOW}Note: To remove database data, run:${NC}"
echo -e "  docker-compose -f docker-compose-db-only.yml down -v"
echo ""

