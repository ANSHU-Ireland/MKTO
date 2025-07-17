#!/bin/bash

# Start MKTO on new ports
# Backend: http://localhost:8001
# Frontend: http://localhost:3001

echo "🚀 Starting MKTO Portfolio Optimization Platform on new ports..."
echo "📊 Backend API: http://localhost:8001"
echo "🌐 Frontend UI: http://localhost:3001"
echo ""

# Start backend
echo "Starting backend server on port 8001..."
python -m app.main &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start frontend
echo "Starting frontend server on port 3001..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Both services are starting up!"
echo "📊 Backend API: http://localhost:8001"
echo "🌐 Frontend UI: http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop both services"

# Wait for either process to exit
wait $BACKEND_PID $FRONTEND_PID
