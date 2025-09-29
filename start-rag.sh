#!/bin/bash

# Argo Float RAG Chatbot Startup Script

echo "🚀 Starting Argo Float RAG Chatbot..."

# Check if .env file exists
if [ ! -f "server/.env" ]; then
    echo "⚠️  Creating .env file template..."
    cat > server/.env << EOF
# Database Configuration
DB_USER=ayush
DB_HOST=localhost
DB_NAME=postgres
DB_PASS=secret123
DB_PORT=5432

# OpenRouter API Configuration
OPENROUTER_API_KEY=your-openrouter-api-key-here
EOF
    echo "📝 Please edit server/.env and add your OpenRouter API key"
    echo "   Get your free API key at: https://openrouter.ai/"
    echo ""
fi

# Check if node_modules exists for server
if [ ! -d "server/node_modules" ]; then
    echo "📦 Installing server dependencies..."
    cd server
    npm install express cors pg node-fetch
    cd ..
fi

# Check if node_modules exists for client
if [ ! -d "client/node_modules" ]; then
    echo "📦 Installing client dependencies..."
    cd client
    npm install
    cd ..
fi

echo "🔧 Starting services..."

# Start RAG service in background
echo "🤖 Starting RAG service on port 5002..."
cd server
node rag-service.js &
RAG_PID=$!
cd ..

# Wait a moment for RAG service to start
sleep 3

# Start React app
echo "⚛️  Starting React app on port 3000..."
cd client
npm start &
CLIENT_PID=$!
cd ..

echo ""
echo "✅ Services started successfully!"
echo ""
echo "🌐 Access your applications:"
echo "   • Frontend: http://localhost:3000"
echo "   • Chatbot: http://localhost:3000/chat"
echo "   • RAG API: http://localhost:5002"
echo ""
echo "📊 Available endpoints:"
echo "   • Health check: http://localhost:5002/api/health"
echo "   • Sample queries: http://localhost:5002/api/sample-queries"
echo "   • Database schema: http://localhost:5002/api/schema"
echo ""
echo "🛑 To stop services, press Ctrl+C"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping services..."
    kill $RAG_PID 2>/dev/null
    kill $CLIENT_PID 2>/dev/null
    echo "✅ Services stopped"
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Wait for user to stop
wait


