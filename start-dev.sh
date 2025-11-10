#!/bin/bash

# Start development servers for unified POS & Loyalty app

echo "🚀 Starting Unified POS & Loyalty App..."

# Kill any existing processes
pkill -f "node server.js" 2>/dev/null || true
pkill -f "next dev" 2>/dev/null || true

# Start Next.js loyalty app first
echo "📱 Starting Loyalty App (Next.js) on port 3001..."
cd loyalty-app
npm run dev &
LOYALTY_PID=$!

# Wait for Next.js to start
echo "⏳ Waiting for Loyalty App to start..."
sleep 8

# Check if Next.js is running
if curl -s http://localhost:3001 > /dev/null; then
    echo "✅ Loyalty App started successfully"
else
    echo "❌ Loyalty App failed to start"
    kill $LOYALTY_PID 2>/dev/null || true
    exit 1
fi

# Start Express server
echo "🖥️  Starting POS App (Express) on port 3000..."
cd ..
node server.js &
EXPRESS_PID=$!

# Wait for Express to start
sleep 3

# Check if Express is running
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ POS App started successfully"
else
    echo "❌ POS App failed to start"
    kill $EXPRESS_PID 2>/dev/null || true
    kill $LOYALTY_PID 2>/dev/null || true
    exit 1
fi

echo ""
echo "🎉 Both apps are running!"
echo "📍 POS App: http://localhost:3000/pos"
echo "📍 Loyalty App: http://localhost:3000/loyalty"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for user to stop
wait




