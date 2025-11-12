#!/bin/bash
# Quick setup script for AI Speaking Practice app

set -e

echo "🚀 AI Speaking Practice - Quick Setup"
echo "======================================"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo -e "${BLUE}Checking prerequisites...${NC}"
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 not found. Please install Python 3.8+"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 16+"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm not found. Please install npm"
    exit 1
fi

echo -e "${GREEN}✓ All prerequisites found${NC}"

# Backend setup
echo ""
echo -e "${BLUE}Setting up Backend (Django + FastAPI)...${NC}"

cd backend

# Create venv if it doesn't exist
if [ ! -d ".venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv .venv
fi

# Activate venv
source .venv/bin/activate

# Install dependencies
echo "Installing Python dependencies..."
pip install -q -r requirements.txt

# Setup .env file
if [ ! -f ".env" ]; then
    echo "Creating .env file from .env.example..."
    cp .env.example .env
    echo -e "${YELLOW}⚠️  Edit backend/.env and add your API keys${NC}"
fi

# Run migrations
echo "Running database migrations..."
python manage.py migrate -q

# Create levels
echo "Creating initial 5 levels with full text..."
python manage.py create_levels > /dev/null 2>&1 || echo "⚠️  Levels may already exist"

echo -e "${GREEN}✓ Backend setup complete${NC}"

cd ../

# Frontend setup
echo ""
echo -e "${BLUE}Setting up Frontend (React + Vite)...${NC}"

cd frontend

# Setup .env file
if [ ! -f ".env.local" ]; then
    echo "Creating .env.local file..."
    cat > .env.local << EOF
VITE_API_URL=http://localhost:8000/api
VITE_FASTAPI_URL=http://localhost:8001/api
EOF
    echo -e "${GREEN}✓ Environment file created${NC}"
fi

# Install dependencies
if [ ! -d "node_modules" ]; then
    echo "Installing npm dependencies..."
    npm install -q
else
    echo "npm dependencies already installed"
fi

echo -e "${GREEN}✓ Frontend setup complete${NC}"

cd ../

# Summary
echo ""
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo ""
echo "📝 Next, start the services in separate terminals:"
echo ""
echo -e "${BLUE}Terminal 1 - Django Backend:${NC}"
echo "  cd backend"
echo "  source .venv/bin/activate"
echo "  python manage.py runserver"
echo ""
echo -e "${BLUE}Terminal 2 - FastAPI Service:${NC}"
echo "  cd backend"
echo "  source .venv/bin/activate"
echo "  uvicorn backend.fastapi_service.main:app --reload --port 8001"
echo ""
echo -e "${BLUE}Terminal 3 - React Frontend:${NC}"
echo "  cd frontend"
echo "  npm run dev"
echo ""
echo "Then open: ${BLUE}http://localhost:5173${NC}"
echo ""
echo -e "${YELLOW}Need help? See DEBUGGING.md for troubleshooting${NC}"
