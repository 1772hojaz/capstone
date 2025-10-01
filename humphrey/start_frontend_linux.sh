#!/bin/bash
# SPACS AFRICA - Start Frontend on Linux

echo "========================================"
echo "  SPACS AFRICA - Frontend Startup"
echo "========================================"
echo ""

# Navigate to frontend directory
cd "$(dirname "$0")/frontend"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

echo ""
echo "Starting React development server..."
echo ""
echo "Frontend will be available at: http://localhost:3000"
echo ""

# Start React
npm start
