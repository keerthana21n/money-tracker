#!/bin/bash

echo "🚀 Starting Money Tracker Application..."
echo ""

# Start backend server
echo "📦 Starting Backend Server on port 5000..."
cd server
npm run dev &
BACKEND_PID=$!

# Wait a bit for backend to start
sleep 3

# Start frontend
echo "🎨 Starting Frontend on port 3000..."
cd ../client
npm start &
FRONTEND_PID=$!

echo ""
echo "✅ Application Started!"
echo "   Backend:  http://localhost:5000"
echo "   Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for Ctrl+C
trap "echo ''; echo '🛑 Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT

# Keep script running
wait
