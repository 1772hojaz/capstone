#!/bin/bash
# SPACS AFRICA - Start Everything on Linux

echo "========================================"
echo "  SPACS AFRICA - Full System Startup"
echo "========================================"
echo ""

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check dependencies
echo "Checking dependencies..."

if ! command_exists python3.11; then
    echo "✗ Python 3.11 not found. Please install it first."
    exit 1
fi

if ! command_exists node; then
    echo "✗ Node.js not found. Please install it first."
    exit 1
fi

if ! command_exists psql; then
    echo "✗ PostgreSQL not found. Please install it first."
    exit 1
fi

if ! command_exists redis-cli; then
    echo "✗ Redis not found. Please install it first."
    exit 1
fi

echo "✓ All dependencies found"
echo ""

# Check if PostgreSQL is running
if ! systemctl is-active --quiet postgresql; then
    echo "Starting PostgreSQL..."
    sudo systemctl start postgresql
fi

# Check if Redis is running
if ! systemctl is-active --quiet redis; then
    echo "Starting Redis..."
    sudo systemctl start redis
fi

echo "✓ Database services running"
echo ""

# Make scripts executable
chmod +x "$SCRIPT_DIR/start_backend_linux.sh"
chmod +x "$SCRIPT_DIR/start_celery_linux.sh"
chmod +x "$SCRIPT_DIR/start_frontend_linux.sh"

echo "========================================"
echo "Starting services in separate terminals..."
echo "========================================"
echo ""

# Check if we're in a graphical environment
if [ -n "$DISPLAY" ]; then
    # Use gnome-terminal if available
    if command_exists gnome-terminal; then
        gnome-terminal -- bash -c "$SCRIPT_DIR/start_backend_linux.sh; exec bash"
        sleep 2
        gnome-terminal -- bash -c "$SCRIPT_DIR/start_celery_linux.sh; exec bash"
        sleep 2
        gnome-terminal -- bash -c "$SCRIPT_DIR/start_frontend_linux.sh; exec bash"
    # Use xterm as fallback
    elif command_exists xterm; then
        xterm -e "$SCRIPT_DIR/start_backend_linux.sh" &
        sleep 2
        xterm -e "$SCRIPT_DIR/start_celery_linux.sh" &
        sleep 2
        xterm -e "$SCRIPT_DIR/start_frontend_linux.sh" &
    else
        echo "No terminal emulator found. Please run these manually:"
        echo "  Terminal 1: ./start_backend_linux.sh"
        echo "  Terminal 2: ./start_celery_linux.sh"
        echo "  Terminal 3: ./start_frontend_linux.sh"
    fi
else
    echo "Not in graphical environment. Please run these manually:"
    echo "  Terminal 1: ./start_backend_linux.sh"
    echo "  Terminal 2: ./start_celery_linux.sh"
    echo "  Terminal 3: ./start_frontend_linux.sh"
fi

echo ""
echo "========================================"
echo "  SPACS AFRICA is starting up!"
echo "========================================"
echo ""
echo "Wait ~30 seconds, then access:"
echo "  • Frontend: http://localhost:3000"
echo "  • Backend API: http://localhost:8000/docs"
echo ""
echo "Login credentials:"
echo "  Email: admin@spacsafrica.com"
echo "  Password: admin123"
echo ""
