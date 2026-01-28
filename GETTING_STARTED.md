# 🚀 The Pulse - Getting Started Guide

## ⚡ Quick Start (3 Minutes)

### Step 1: Extract & Navigate
```bash
unzip the-pulse-project.zip
cd the-pulse-project
```

### Step 2: Run Setup Script (Linux/Mac)
```bash
chmod +x setup.sh
./setup.sh
```

### Step 3: Create Database
```bash
# เข้า PostgreSQL
psql -U postgres

# สร้าง database
CREATE DATABASE the_pulse_db;

# ออกจาก psql
\q

# รัน schema
psql -U postgres -d the_pulse_db -f database-schema.sql
```

### Step 4: Configure Environment
```bash
# แก้ไข server/.env
nano server/.env

# ใส่ค่าเหล่านี้:
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_secret_key_min_32_chars
```

### Step 5: Start Servers
```bash
# Terminal 1: Backend
cd server
npm run dev

# Terminal 2: Frontend
cd client  
npm run dev
```

### Step 6: Open Browser
```
http://localhost:5173
```

---

## 📝 Detailed Installation Guide

### Prerequisites Check

#### 1. Install Node.js
```bash
# Check if installed
node --version

# If not installed, download from:
# https://nodejs.org (LTS version)
```

#### 2. Install PostgreSQL
```bash
# Check if installed
psql --version

# If not installed:
# Mac: brew install postgresql
# Ubuntu: sudo apt install postgresql
# Windows: https://postgresql.org/download/
```

#### 3. Start PostgreSQL
```bash
# Linux
sudo service postgresql start

# Mac
brew services start postgresql

# Windows
# Services app → PostgreSQL → Start
```

---

## 🗄️ Database Setup (Important!)

### Method 1: Using SQL File (Recommended)
```bash
# 1. Create database
psql -U postgres -c "CREATE DATABASE the_pulse_db;"

# 2. Run schema file
psql -U postgres -d the_pulse_db -f database-schema.sql

# You should see:
# CREATE TABLE (5 times)
# CREATE INDEX (13 times)
# Tables created successfully!
```

### Method 2: Manual SQL
```bash
psql -U postgres
CREATE DATABASE the_pulse_db;
\c the_pulse_db

# Then paste the SQL from database-schema.sql
```

### Verify Database Setup
```bash
psql -U postgres -d the_pulse_db

# Check tables
\dt

# Should show:
# - users
# - projects
# - project_members
# - tasks
# - task_messages

# Check structure
\d users

# Exit
\q
```

---

## ⚙️ Environment Configuration

### Backend Configuration (server/.env)

**Copy example file:**
```bash
cd server
cp .env.example .env
```

**Edit .env:**
```env
# Server Port
PORT=5000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=the_pulse_db
DB_USER=postgres              # ← Your PostgreSQL username
DB_PASSWORD=your_password     # ← Your PostgreSQL password

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_at_least_32_characters_long_please
JWT_EXPIRES_IN=7d

# Frontend URL
CLIENT_URL=http://localhost:5173
```

**Generate JWT Secret:**
```bash
# Linux/Mac
openssl rand -base64 32

# Or use any random string (32+ characters)
```

### Frontend Configuration (client/.env)

**Copy example file:**
```bash
cd client
cp .env.example .env
```

**Edit .env:**
```env
VITE_API_URL=http://localhost:5000/api
```

---

## 📦 Install Dependencies

### Backend
```bash
cd server
npm install

# This installs:
# - express (web framework)
# - pg (PostgreSQL)
# - bcryptjs (password hashing)
# - jsonwebtoken (JWT)
# - cors, helmet, morgan (middleware)
# - And more...
```

### Frontend
```bash
cd client
npm install

# This installs:
# - react, react-dom
# - vite (build tool)
# - tailwindcss (CSS framework)
# - axios (HTTP client)
# - react-router-dom (routing)
# - And more...
```

---

## 🚀 Running the Application

### Start Backend
```bash
cd server
npm run dev

# Expected output:
╔═══════════════════════════════════════╗
║   🚀 THE PULSE SERVER IS RUNNING 🚀   ║
║   Port: 5000                          ║
║   Environment: development            ║
╚═══════════════════════════════════════╝
✅ Database connected successfully
```

**If you see errors:**
- Check TROUBLESHOOTING.md
- Verify database is running
- Check .env configuration

### Start Frontend
```bash
# Open a NEW terminal
cd client
npm run dev

# Expected output:
VITE v5.0.8  ready in 314 ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
➜  press h + enter to show help
```

---

## 👤 Create Your First Account

### 1. Open Browser
```
http://localhost:5173
```

### 2. Click "Register here"

### 3. Fill in the form:
- **Username:** jojo
- **Full Name:** Jirayut
- **Email:** jirayut@example.com
- **Password:** password123
- **Confirm Password:** password123

### 4. Click "Register"

**Success! You should see:**
- ✅ Toast notification: "Registration successful!"
- 🔄 Redirect to Projects page

---

## 🎯 Test the Application

### 1. Projects Page
- You should see "ALL PROJECTS" page
- It will be empty at first

### 2. Create a Project
- Click "+ Create Project" button
- Fill in:
  - Project Name: "My First Project"
  - Description: "Testing The Pulse"
  - End Date: Pick a future date
- Click "Save Task"

### 3. View Your Project
- You should see a project card
- Click edit icon to modify
- Click users icon to add members

### 4. Try Other Features
- Click through the sidebar menu
- Test different pages
- Create more projects

---

## ✅ Verification Checklist

Before reporting issues, verify:

- [ ] PostgreSQL is running
- [ ] Database `the_pulse_db` exists
- [ ] All 5 tables are created
- [ ] `server/.env` has correct DB credentials
- [ ] Backend server is running (port 5000)
- [ ] Frontend dev server is running (port 5173)
- [ ] No errors in backend terminal
- [ ] No errors in frontend terminal
- [ ] No errors in browser console (F12)
- [ ] Can access http://localhost:5173

---

## 🔍 Testing the API

### Test Backend Health
```bash
curl http://localhost:5000/health

# Expected:
{"success":true,"message":"Server is running","timestamp":"..."}
```

### Test Registration
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@test.com",
    "password": "password123"
  }'

# Expected:
{"success":true,"message":"Registration successful","data":{...}}
```

### Test Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "emailOrUsername": "testuser",
    "password": "password123"
  }'

# Expected:
{"success":true,"message":"Login successful","data":{"user":{...},"token":"..."}}
```

---

## 🛠️ Common Issues & Solutions

### Issue: "Database connection failed"
```bash
# Solution: Start PostgreSQL
sudo service postgresql start

# Verify it's running
pg_isready
```

### Issue: "relation users does not exist"
```bash
# Solution: Run database schema
psql -U postgres -d the_pulse_db -f database-schema.sql
```

### Issue: "Port 5000 already in use"
```bash
# Solution: Kill the process
lsof -ti:5000 | xargs kill -9

# Or change port in server/.env
PORT=5001
```

### Issue: "Cannot read properties of undefined"
```bash
# Solution: Check browser console for exact error
# Usually means API is not responding

# Verify backend is running:
curl http://localhost:5000/health
```

### Issue: "CORS error"
```bash
# Solution: Check server/index.js
# Make sure CLIENT_URL in .env matches frontend URL:
CLIENT_URL=http://localhost:5173
```

---

## 📱 Access from Mobile/Other Devices

### 1. Find your IP address
```bash
# Linux/Mac
ifconfig | grep inet

# Windows
ipconfig
```

### 2. Update client/.env
```env
VITE_API_URL=http://YOUR_IP:5000/api
```

### 3. Restart frontend
```bash
cd client
npm run dev
```

### 4. Access from other device
```
http://YOUR_IP:5173
```

---

## 🎓 Learning the Codebase

### Backend Structure
```
server/
├── config/         # Database configuration
├── controllers/    # Business logic
├── middleware/     # Auth & validation
├── routes/         # API endpoints
├── utils/          # Helper functions
└── index.js        # Main server file
```

### Frontend Structure
```
client/src/
├── components/     # Reusable UI components
├── pages/          # Page components
├── context/        # Global state (Auth)
├── services/       # API calls
└── App.jsx         # Main app + routing
```

### Key Files to Understand
- `server/index.js` - Express server setup
- `server/controllers/authController.js` - Auth logic
- `client/src/App.jsx` - React routing
- `client/src/context/AuthContext.jsx` - Auth state
- `client/src/services/api.js` - API configuration

---

## 📚 Documentation Files

- **README.md** - Project overview
- **INSTALLATION.md** - Detailed installation
- **QUICK_START.md** - Quick commands
- **TROUBLESHOOTING.md** - Fix common issues
- **TECH_STACK_GUIDE.md** - Technology details
- **PROJECT_OVERVIEW.md** - Complete features
- **FILE_STRUCTURE.md** - Project structure
- **GETTING_STARTED.md** - This file

---

## 🎉 You're All Set!

Your Pulse project management system is now running!

**Next Steps:**
1. Explore the UI
2. Create projects and tasks
3. Invite team members
4. Customize the code
5. Deploy to production

**Need Help?**
- Check TROUBLESHOOTING.md
- Review the documentation
- Check browser console for errors
- Verify all services are running

**Happy Project Managing! 🚀**
