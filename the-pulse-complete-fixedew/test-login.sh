#!/bin/bash

# Login Test Script for The Pulse
# This will test the entire login flow

echo "╔═══════════════════════════════════════╗"
echo "║   🔐 LOGIN SYSTEM TEST 🔐             ║"
echo "╚═══════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ERRORS=0

# Test 1: Backend Health
echo "1️⃣  Testing Backend Connection..."
HEALTH=$(curl -s http://localhost:5000/health 2>&1)

if echo "$HEALTH" | grep -q "success"; then
    echo -e "${GREEN}✓${NC} Backend is running"
else
    echo -e "${RED}✗${NC} Backend is NOT running"
    echo "   Start with: cd backend && npm run dev"
    ((ERRORS++))
fi
echo ""

# Test 2: Database Connection
echo "2️⃣  Testing Database..."
if psql -U postgres -d the_pulse_db -c "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} Database is accessible"
    
    # Check if users table exists
    if psql -U postgres -d the_pulse_db -c "\dt users" 2>&1 | grep -q "users"; then
        echo -e "${GREEN}✓${NC} Users table exists"
    else
        echo -e "${RED}✗${NC} Users table NOT found"
        echo "   Import schema: psql -U postgres -d the_pulse_db -f backend/database/schema.sql"
        ((ERRORS++))
    fi
else
    echo -e "${RED}✗${NC} Database is NOT accessible"
    echo "   Check PostgreSQL is running"
    ((ERRORS++))
fi
echo ""

# Test 3: Register a test user
echo "3️⃣  Testing Registration..."
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "logintest",
    "email": "logintest@test.com",
    "password": "Test123!",
    "full_name": "Login Test"
  }' 2>&1)

if echo "$REGISTER_RESPONSE" | grep -q "token"; then
    echo -e "${GREEN}✓${NC} Registration successful"
    TOKEN=$(echo "$REGISTER_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
elif echo "$REGISTER_RESPONSE" | grep -q "already exists"; then
    echo -e "${YELLOW}⚠${NC} User already exists (that's OK)"
else
    echo -e "${RED}✗${NC} Registration failed"
    echo "   Response: $REGISTER_RESPONSE"
    ((ERRORS++))
fi
echo ""

# Test 4: Login with email
echo "4️⃣  Testing Login (with email)..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "emailOrUsername": "logintest@test.com",
    "password": "Test123!"
  }' 2>&1)

if echo "$LOGIN_RESPONSE" | grep -q "token"; then
    echo -e "${GREEN}✓${NC} Login with email works!"
    TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    echo "   Token: ${TOKEN:0:20}..."
else
    echo -e "${RED}✗${NC} Login failed"
    echo "   Response: $LOGIN_RESPONSE"
    ((ERRORS++))
fi
echo ""

# Test 5: Login with username
echo "5️⃣  Testing Login (with username)..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "emailOrUsername": "logintest",
    "password": "Test123!"
  }' 2>&1)

if echo "$LOGIN_RESPONSE" | grep -q "token"; then
    echo -e "${GREEN}✓${NC} Login with username works!"
else
    echo -e "${RED}✗${NC} Login with username failed"
    ((ERRORS++))
fi
echo ""

# Test 6: Test with wrong password
echo "6️⃣  Testing Wrong Password..."
WRONG_PASS=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "emailOrUsername": "logintest@test.com",
    "password": "WrongPassword123!"
  }' 2>&1)

if echo "$WRONG_PASS" | grep -q "Invalid credentials"; then
    echo -e "${GREEN}✓${NC} Wrong password correctly rejected"
else
    echo -e "${YELLOW}⚠${NC} Wrong password handling may be incorrect"
fi
echo ""

# Test 7: Frontend environment
echo "7️⃣  Testing Frontend Environment..."
if [ -f "frontend/.env" ]; then
    echo -e "${GREEN}✓${NC} Frontend .env exists"
    
    API_URL=$(grep "VITE_API_URL" frontend/.env | cut -d'=' -f2)
    if [ "$API_URL" = "http://localhost:5000/api" ]; then
        echo -e "${GREEN}✓${NC} API URL is correct: $API_URL"
    else
        echo -e "${YELLOW}⚠${NC} API URL may be wrong: $API_URL"
        echo "   Should be: http://localhost:5000/api"
    fi
else
    echo -e "${RED}✗${NC} Frontend .env not found"
    echo "   Create: cp frontend/.env.example frontend/.env"
    ((ERRORS++))
fi
echo ""

# Summary
echo "╔═══════════════════════════════════════╗"
echo "║           TEST SUMMARY                ║"
echo "╚═══════════════════════════════════════╝"
echo ""

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed! Login should work.${NC}"
    echo ""
    echo "✅ You can now login with:"
    echo "   Email: logintest@test.com"
    echo "   Password: Test123!"
    echo ""
    echo "Or try in browser:"
    echo "   http://localhost:5173/login"
else
    echo -e "${RED}❌ $ERRORS error(s) found.${NC}"
    echo ""
    echo "Fix the errors above, then run this test again."
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

exit $ERRORS
