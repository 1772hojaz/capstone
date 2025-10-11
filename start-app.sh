#!/bin/bash

# Quick start script for running both frontend and backend

echo "🚀 Starting ConnectSphere Full Stack Application"
echo "================================================"
echo ""

# Check if backend is running
if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Backend already running on port 8000"
else
    echo "Starting backend on port 8000..."
    cd ~/capstone/sys/backend
    
    # Activate virtual environment if it exists
    if [ -d "venv" ]; then
        source venv/bin/activate
    elif [ -d "../venv" ]; then
        source ../venv/bin/activate
    fi
    
    # Start backend in background
    python main.py > backend.log 2>&1 &
    BACKEND_PID=$!
    echo "✅ Backend started (PID: $BACKEND_PID)"
fi

# Check if frontend is running
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Frontend already running on port 3000"
else
    echo ""
    echo "Starting frontend on port 3000..."
    cd ~/capstone/sys/Front-end
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        echo "📦 Installing frontend dependencies..."
        npm install
    fi
    
    # Start frontend in background
    npm run dev > frontend.log 2>&1 &
    FRONTEND_PID=$!
    echo "✅ Frontend started (PID: $FRONTEND_PID)"
fi

echo ""
echo "================================================"
echo "🎉 Application is starting up!"
echo ""
echo "Backend:  http://localhost:8000"
echo "Frontend: http://localhost:3000"
echo ""
echo "API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop both servers"
echo "================================================"

# Wait for Ctrl+C
wait
