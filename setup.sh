#!/bin/bash

# The Pulse - Auto Setup Script
# This script will help you set up the project automatically

echo "╔═══════════════════════════════════════╗"
echo "║   🚀 THE PULSE AUTO SETUP SCRIPT 🚀   ║"
echo "╚═══════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
echo "📋 Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    echo "Please install Node.js from https://nodejs.org"
    exit 1
fi
NODE_VERSION=$(node -v)
echo -e "${GREEN}✅ Node.js $NODE_VERSION${NC}"

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed${NC}"
    exit 1
fi
NPM_VERSION=$(npm -v)
echo -e "${GREEN}✅ npm $NPM_VERSION${NC}"

# Check PostgreSQL
if ! command -v psql &> /dev/null; then
    echo -e "${YELLOW}⚠️  PostgreSQL command line tool not found${NC}"
    echo "Please make sure PostgreSQL is installed and running"
else
    PSQL_VERSION=$(psql --version)
    echo -e "${GREEN}✅ $PSQL_VERSION${NC}"
fi

echo ""
echo "🔧 Starting setup..."
echo ""

# Setup Backend
echo "📦 Setting up Backend..."
cd server

if [ ! -f ".env" ]; then
    echo "Creating .env file..."
    cp .env.example .env
    echo -e "${YELLOW}⚠️  Please edit server/.env with your database credentials${NC}"
    echo "Press Enter when done..."
    read
fi

echo "Installing backend dependencies..."
npm install

cd ..

# Setup Frontend
echo ""
echo "📦 Setting up Frontend..."
cd client

if [ ! -f ".env" ]; then
    echo "Creating .env file..."
    cp .env.example .env
fi

echo "Installing frontend dependencies..."
npm install

cd ..

echo ""
echo "╔═══════════════════════════════════════╗"
echo "║          ✅ SETUP COMPLETE ✅          ║"
echo "╚═══════════════════════════════════════╝"
echo ""
echo "📝 Next steps:"
echo ""
echo "1. Create PostgreSQL database:"
echo "   psql -U postgres"
echo "   CREATE DATABASE the_pulse_db;"
echo "   \\q"
echo ""
echo "2. Run database schema (see INSTALLATION.md)"
echo ""
echo "3. Edit server/.env with your database credentials"
echo ""
echo "4. Start the backend:"
echo "   cd server"
echo "   npm run dev"
echo ""
echo "5. Start the frontend (in a new terminal):"
echo "   cd client"
echo "   npm run dev"
echo ""
echo "6. Open browser at http://localhost:5173"
echo ""
echo "🎉 Happy coding!"
