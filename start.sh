#!/bin/bash

echo "🚀 Starting Money Tracker Application..."
echo ""

# Start backend server
echo "📦 Starting Backend Server on port 5001..."
cd server
PORT=5001 npm run dev &
BACKEND_PID=$!

# Wait a bit for backend to start
sleep 3

# Start frontend
echo "🎨 Starting Frontend on port 3002..."
cd ../client
PORT=3002 npm start &
FRONTEND_PID=$!

echo ""
echo "✅ Application Started!"
echo "   Backend:  http://localhost:5001"
echo "   Frontend: http://localhost:3002"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for Ctrl+C
trap "echo ''; echo '🛑 Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT

# Keep script running
wait
