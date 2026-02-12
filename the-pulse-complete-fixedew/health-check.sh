#!/bin/bash

# The Pulse - System Health Check
# Run this to diagnose issues

echo "╔═══════════════════════════════════════╗"
echo "║                                       ║"
echo "║   🔍 THE PULSE HEALTH CHECK 🔍        ║"
echo "║                                       ║"
echo "╚═══════════════════════════════════════╝"
echo ""

ERRORS=0
WARNINGS=0

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper functions
check_pass() {
    echo -e "${GREEN}✓${NC} $1"
}

check_fail() {
    echo -e "${RED}✗${NC} $1"
    ((ERRORS++))
}

check_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
    ((WARNINGS++))
}

# 1. Check Node.js
echo "1️⃣  Checking Node.js..."
if command -v node &> /dev/null; then
    VERSION=$(node --version)
    MAJOR=$(echo $VERSION | cut -d'.' -f1 | sed 's/v//')
    if [ "$MAJOR" -ge 18 ]; then
        check_pass "Node.js $VERSION (v18+ required)"
    else
        check_fail "Node.js $VERSION (Need v18+)"
    fi
else
    check_fail "Node.js not found"
fi
echo ""

# 2. Check npm
echo "2️⃣  Checking npm..."
if command -v npm &> /dev/null; then
    VERSION=$(npm --version)
    check_pass "npm $VERSION"
else
    check_fail "npm not found"
fi
echo ""

# 3. Check PostgreSQL
echo "3️⃣  Checking PostgreSQL..."
if command -v psql &> /dev/null; then
    VERSION=$(psql --version | awk '{print $3}')
    check_pass "PostgreSQL $VERSION"
    
    # Check if database exists
    if psql -U postgres -lqt | cut -d \| -f 1 | grep -qw the_pulse_db; then
        check_pass "Database 'the_pulse_db' exists"
        
        # Check if tables exist
        TABLE_COUNT=$(psql -U postgres -d the_pulse_db -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null)
        if [ "$TABLE_COUNT" -gt 10 ]; then
            check_pass "Database has $TABLE_COUNT tables"
        else
            check_warn "Database has only $TABLE_COUNT tables (expected 12+)"
        fi
    else
        check_fail "Database 'the_pulse_db' not found"
    fi
else
    check_fail "PostgreSQL not found"
fi
echo ""

# 4. Check Backend
echo "4️⃣  Checking Backend..."
if [ -d "backend" ]; then
    check_pass "Backend directory exists"
    
    # Check node_modules
    if [ -d "backend/node_modules" ]; then
        check_pass "Backend dependencies installed"
    else
        check_warn "Backend dependencies not installed (run: cd backend && npm install)"
    fi
    
    # Check .env
    if [ -f "backend/.env" ]; then
        check_pass "Backend .env file exists"
        
        # Check required variables
        if grep -q "DB_HOST" backend/.env && \
           grep -q "DB_PASSWORD" backend/.env && \
           grep -q "JWT_SECRET" backend/.env; then
            check_pass "Backend .env has required variables"
        else
            check_warn "Backend .env may be missing required variables"
        fi
    else
        check_fail "Backend .env file not found (copy from .env.example)"
    fi
    
    # Check if running
    if curl -s http://localhost:5000/health > /dev/null 2>&1; then
        check_pass "Backend is running on port 5000"
    else
        check_warn "Backend is NOT running (run: cd backend && npm run dev)"
    fi
else
    check_fail "Backend directory not found"
fi
echo ""

# 5. Check Frontend
echo "5️⃣  Checking Frontend..."
if [ -d "frontend" ]; then
    check_pass "Frontend directory exists"
    
    # Check node_modules
    if [ -d "frontend/node_modules" ]; then
        check_pass "Frontend dependencies installed"
    else
        check_warn "Frontend dependencies not installed (run: cd frontend && npm install)"
    fi
    
    # Check .env
    if [ -f "frontend/.env" ]; then
        check_pass "Frontend .env file exists"
        
        if grep -q "VITE_API_URL" frontend/.env; then
            API_URL=$(grep "VITE_API_URL" frontend/.env | cut -d'=' -f2)
            check_pass "Frontend API URL: $API_URL"
        else
            check_warn "Frontend .env missing VITE_API_URL"
        fi
    else
        check_fail "Frontend .env file not found (copy from .env.example)"
    fi
    
    # Check if running
    if curl -s http://localhost:5173 > /dev/null 2>&1; then
        check_pass "Frontend is running on port 5173"
    else
        check_warn "Frontend is NOT running (run: cd frontend && npm run dev)"
    fi
else
    check_fail "Frontend directory not found"
fi
echo ""

# 6. Check Ports
echo "6️⃣  Checking Ports..."
if lsof -Pi :5000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    check_pass "Port 5000 is in use (backend)"
else
    check_warn "Port 5000 is free (backend not running?)"
fi

if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null 2>&1; then
    check_pass "Port 5173 is in use (frontend)"
else
    check_warn "Port 5173 is free (frontend not running?)"
fi

if lsof -Pi :5432 -sTCP:LISTEN -t >/dev/null 2>&1; then
    check_pass "Port 5432 is in use (PostgreSQL)"
else
    check_fail "Port 5432 is free (PostgreSQL not running?)"
fi
echo ""

# Summary
echo "╔═══════════════════════════════════════╗"
echo "║           HEALTH CHECK SUMMARY        ║"
echo "╚═══════════════════════════════════════╝"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}🎉 All checks passed! System is healthy.${NC}"
    echo ""
    echo "✅ Backend: http://localhost:5000"
    echo "✅ Frontend: http://localhost:5173"
    echo "✅ Dashboard: http://localhost:5173/dashboard"
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  $WARNINGS warning(s) found.${NC}"
    echo "System should work but check warnings above."
else
    echo -e "${RED}❌ $ERRORS error(s) and $WARNINGS warning(s) found.${NC}"
    echo ""
    echo "📚 Next steps:"
    echo "1. Fix errors listed above"
    echo "2. See TROUBLESHOOTING.md for detailed help"
    echo "3. Run this check again"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

exit $ERRORS
