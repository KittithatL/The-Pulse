# 🔧 Troubleshooting Guide - The Pulse Dashboard

## "Failed to load dashboard" Error

If you see this error, follow these steps:

---

## ✅ Step 1: Check Backend is Running

### Verify Backend Status
```bash
# Check if backend is running
curl http://localhost:5000/health

# Expected response:
# {"success":true,"message":"Server is running","timestamp":"..."}
```

### If Backend is NOT Running:
```bash
cd backend
npm run dev
```

You should see:
```
╔═══════════════════════════════════════╗
║   🚀 THE PULSE SERVER IS RUNNING 🚀   ║
║   Port: 5000                          ║
╚═══════════════════════════════════════╝
```

---

## ✅ Step 2: Verify Environment Variables

### Frontend (.env)
```bash
cd frontend
cat .env
```

Should contain:
```env
VITE_API_URL=http://localhost:5000/api
```

If missing, create it:
```bash
cp .env.example .env
```

### Backend (.env)
```bash
cd backend
cat .env
```

Should contain AT MINIMUM:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=the_pulse_db
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_secret_key
PORT=5000
CLIENT_URL=http://localhost:5173
```

---

## ✅ Step 3: Check Database Connection

### Test Database
```bash
psql -U postgres -d the_pulse_db -c "SELECT COUNT(*) FROM projects;"
```

### If Database Doesn't Exist:
```bash
# Create database
psql -U postgres -c "CREATE DATABASE the_pulse_db;"

# Import schema
cd backend
psql -U postgres -d the_pulse_db -f database/schema.sql
```

---

## ✅ Step 4: Verify You Have a Project

### Check if projects exist
```bash
# Login and get token first
TOKEN="your_jwt_token_here"

# Check projects
curl -X GET http://localhost:5000/api/projects \
  -H "Authorization: Bearer $TOKEN"
```

### If No Projects:
1. Go to http://localhost:5173/projects
2. Click "Create Project"
3. Fill in details
4. Then go back to Dashboard

---

## ✅ Step 5: Check Authentication

### Verify Token
```bash
# Open browser console (F12)
# Run this in console:
localStorage.getItem('token')
```

### If Token is Missing or Invalid:
1. Go to http://localhost:5173/login
2. Login again
3. Try dashboard

### Token Expired?
Tokens expire after 7 days. Just login again.

---

## 🐛 Common Error Messages

### "Cannot connect to server"
**Cause**: Backend not running or wrong port

**Fix**:
```bash
# Start backend
cd backend
npm run dev

# Check .env has correct PORT
PORT=5000
```

---

### "401 Unauthorized"
**Cause**: Not logged in or token expired

**Fix**:
1. Go to /login
2. Enter credentials
3. Try again

---

### "403 Access Denied"
**Cause**: User doesn't have access to project

**Fix**:
1. Go to /projects
2. Select a project you own
3. Click dashboard from there

---

### "404 Project not found"
**Cause**: Invalid project ID

**Fix**:
1. Go to /projects
2. View available projects
3. Select valid project

---

### "No projects found"
**Cause**: Database has no projects

**Fix**:
1. Create a project first
2. Then access dashboard

---

## 🔍 Debugging Steps

### 1. Check Browser Console
```
F12 → Console tab
Look for red errors
```

Common errors:
- **CORS**: Backend CORS settings
- **Network**: Backend not running
- **401/403**: Authentication issue

### 2. Check Backend Logs
```bash
cd backend
npm run dev

# Watch the terminal for errors
```

### 3. Check Network Tab
```
F12 → Network tab
Click on failed request
Check:
- Request URL
- Request Headers
- Response
```

### 4. Verify API Endpoint
```bash
# Test dashboard endpoint directly
curl -X GET http://localhost:5000/api/dashboard/1/overview \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

---

## 📊 Full Health Check Script

Create this file: `check-health.sh`

```bash
#!/bin/bash

echo "🔍 The Pulse Health Check"
echo "=========================="
echo ""

# Check Node.js
echo "1. Checking Node.js..."
node --version && echo "✅ Node.js OK" || echo "❌ Node.js NOT FOUND"

# Check PostgreSQL
echo "2. Checking PostgreSQL..."
psql --version && echo "✅ PostgreSQL OK" || echo "❌ PostgreSQL NOT FOUND"

# Check Database
echo "3. Checking Database..."
psql -U postgres -d the_pulse_db -c "SELECT 1;" > /dev/null 2>&1 && \
  echo "✅ Database OK" || echo "❌ Database NOT ACCESSIBLE"

# Check Backend
echo "4. Checking Backend..."
curl -s http://localhost:5000/health > /dev/null 2>&1 && \
  echo "✅ Backend OK (port 5000)" || echo "❌ Backend NOT RUNNING"

# Check Frontend
echo "5. Checking Frontend..."
curl -s http://localhost:5173 > /dev/null 2>&1 && \
  echo "✅ Frontend OK (port 5173)" || echo "❌ Frontend NOT RUNNING"

echo ""
echo "=========================="
echo "Health check complete!"
```

Run it:
```bash
chmod +x check-health.sh
./check-health.sh
```

---

## 🚀 Quick Reset (Nuclear Option)

If nothing works, full reset:

```bash
# 1. Stop everything
pkill -f node

# 2. Reset database
psql -U postgres -c "DROP DATABASE IF EXISTS the_pulse_db;"
psql -U postgres -c "CREATE DATABASE the_pulse_db;"
cd backend
psql -U postgres -d the_pulse_db -f database/schema.sql

# 3. Clean install backend
cd backend
rm -rf node_modules package-lock.json
npm install

# 4. Clean install frontend
cd ../frontend
rm -rf node_modules package-lock.json
npm install

# 5. Check .env files
cd ../backend
cat .env  # Verify contents
cd ../frontend
cat .env  # Verify contents

# 6. Start backend
cd ../backend
npm run dev

# 7. In NEW terminal, start frontend
cd frontend
npm run dev

# 8. Test
curl http://localhost:5000/health
curl http://localhost:5173
```

---

## 📞 Still Not Working?

### Check These:

1. **Firewall**: Port 5000 and 5173 allowed?
2. **Antivirus**: Not blocking Node.js?
3. **Ports in Use**: Something else on 5000 or 5173?
   ```bash
   lsof -i :5000
   lsof -i :5173
   ```
4. **Permissions**: Can write to directories?
5. **Node Version**: v18+ required

### Get Help:

1. **Check Logs**:
   ```bash
   cd backend
   npm run dev > backend.log 2>&1
   # Check backend.log for errors
   ```

2. **Enable Debug Mode**:
   ```bash
   # backend/.env
   DEBUG=true
   LOG_LEVEL=debug
   ```

3. **Test Each Component**:
   - ✅ Database: `psql -U postgres -d the_pulse_db -c "SELECT 1;"`
   - ✅ Backend: `curl http://localhost:5000/health`
   - ✅ Auth: Try login
   - ✅ Projects: Create a project
   - ✅ Dashboard: Access /dashboard

---

## 🎯 Common Setup Mistakes

### Mistake 1: Wrong API URL
```env
# ❌ WRONG
VITE_API_URL=http://localhost:5000

# ✅ CORRECT
VITE_API_URL=http://localhost:5000/api
```

### Mistake 2: No JWT Secret
```env
# ❌ WRONG (using default)
JWT_SECRET=your_super_secret_jwt_key_here

# ✅ CORRECT (generate new)
JWT_SECRET=iZj8F3kx9Pm2wN7qA4sT1bU6vC5hR0eY
```

### Mistake 3: Wrong Database Credentials
```env
# Make sure these match your PostgreSQL setup
DB_USER=postgres
DB_PASSWORD=your_actual_password
DB_NAME=the_pulse_db
```

### Mistake 4: Not Creating Project
Dashboard needs a project to show data!
1. Create project first
2. Then access dashboard

### Mistake 5: Expired Token
Tokens last 7 days. Just login again.

---

## ✅ Success Checklist

Before asking for help, verify:

- [ ] Backend running on port 5000
- [ ] Frontend running on port 5173
- [ ] Database exists and has schema
- [ ] .env files exist and correct
- [ ] Logged in (token exists)
- [ ] At least 1 project created
- [ ] Browser console has no errors
- [ ] Can access http://localhost:5000/health
- [ ] Can access http://localhost:5173

---

## 🎉 Working Correctly When:

You should see:
1. ✅ Dashboard loads with project name
2. ✅ AI Briefing shows text
3. ✅ Team mood widget is interactive
4. ✅ Metrics show numbers (%, scores)
5. ✅ No errors in console
6. ✅ Can click emoji to submit mood
7. ✅ Infrastructure shows status

---

**Need more help?**
- Check `README.md` files
- Review API documentation
- Enable debug logging
- Check all logs carefully

**Last Resort:**
Full clean reinstall (see Quick Reset above)
