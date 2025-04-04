#!/bin/bash

echo "🔍 Checking for processes on port 5174..."

# Find and kill process using port 5174
PORT_PID=$(lsof -ti:5174)
if [ ! -z "$PORT_PID" ]; then
    echo "🛑 Killing process $PORT_PID on port 5174"
    kill $PORT_PID
    sleep 1
else
    echo "✨ Port 5174 is free"
fi

# Double check if port is really free
PORT_PID=$(lsof -ti:5174)
if [ ! -z "$PORT_PID" ]; then
    echo "⚠️ Force killing process on port 5174"
    kill -9 $PORT_PID
    sleep 1
fi

echo "🚀 Starting development server..."

npm run dev 