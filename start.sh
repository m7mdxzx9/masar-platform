#!/bin/bash
# Masar Platform Startup Script for Unix/Linux/macOS

set -e

echo "============================================================"
echo "  MASAR Platform - AI Learning OS"
echo "============================================================"
echo ""

# Check dependencies
command -v node >/dev/null 2>&1 || { echo "Node.js is required but not installed."; exit 1; }
command -v python3 >/dev/null 2>&1 || { echo "Python 3 is required but not installed."; exit 1; }

# Install backend dependencies
echo "[1/4] Installing backend dependencies..."
cd backend
pip3 install -r requirements.txt
cd ..

# Install frontend dependencies
echo "[2/4] Installing frontend dependencies..."
cd frontend
npm install
cd ..

# Environment check
echo "[3/4] Environment Check"
if [ ! -f backend/.env ]; then
    cp backend/.env.example backend/.env 2>/dev/null || true
    echo "[INFO] Created backend/.env - please add your NVIDIA_API_KEY"
fi

# Start backend
echo "[4/4] Starting services..."
echo ""

echo "Starting backend server on http://localhost:8000..."
cd backend
python3 -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
cd ..

sleep 3

echo "Starting frontend dev server on http://localhost:5173..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "============================================================"
echo "  Services Started Successfully!"
echo "============================================================"
echo ""
echo "  Frontend:  http://localhost:5173"
echo "  Backend:   http://localhost:8000"
echo "  API Docs:  http://localhost:8000/docs"
echo ""
echo "  Press Ctrl+C to stop all services"
echo "============================================================"

# Cleanup on exit
cleanup() {
    echo ""
    echo "Shutting down services..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    echo "All services stopped."
}

trap cleanup SIGINT SIGTERM

# Keep script running
wait