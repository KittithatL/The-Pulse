# 🔧 The Pulse - Troubleshooting Guide

## ❌ ปัญหา: เข้าหน้า Projects ไม่ได้หลัง Register/Login

### สาเหตุที่เป็นไปได้:

#### 1. Backend Server ไม่ทำงาน ⚠️
**ตรวจสอบ:**
```bash
# เช็คว่า backend รันอยู่หรือไม่
curl http://localhost:5000/health

# ควรได้ผลลัพธ์:
# {"success":true,"message":"Server is running"}
```

**แก้ไข:**
```bash
cd server
npm run dev

# ดู terminal ว่ามี error หรือไม่
```

#### 2. Database ไม่เชื่อมต่อ 🗄️
**อาการ:**
- Server start ได้ แต่ไม่มีข้อความ "✅ Database connected"
- Error: "Connection refused" หรือ "ECONNREFUSED"

**แก้ไข:**
```bash
# 1. เช็คว่า PostgreSQL ทำงานอยู่หรือไม่
# Linux/Mac:
sudo service postgresql status
# หรือ
pg_isready

# Windows: เช็คใน Services

# 2. เช็คว่า database มีอยู่จริง
psql -U postgres -l | grep the_pulse_db

# 3. ถ้าไม่มี ให้สร้าง
psql -U postgres
CREATE DATABASE the_pulse_db;
\q

# 4. เช็ค .env ใน server/
# ให้ตรงกับ username, password ของ PostgreSQL
```

#### 3. Environment Variables ไม่ถูกต้อง 🔑
**ตรวจสอบ:**
```bash
# Backend - server/.env
cat server/.env
```

**ต้องมี:**
```env
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=the_pulse_db
DB_USER=postgres           # username ของคุณ
DB_PASSWORD=your_password  # password ของคุณ
JWT_SECRET=your_secret_key_at_least_32_characters
CLIENT_URL=http://localhost:5173
```

**Frontend - client/.env**
```env
VITE_API_URL=http://localhost:5000/api
```

#### 4. ตาราง Database ยังไม่ได้สร้าง 📋
**อาการ:**
- Register ได้ แต่ error: "relation users does not exist"

**แก้ไข:**
```bash
# รัน SQL schema
psql -U postgres -d the_pulse_db

# Copy และ paste SQL จากไฟล์ INSTALLATION.md
# หรือสร้างทีละตาราง:

CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    avatar_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE projects (
    project_id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    created_by INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_at TIMESTAMP,
    status VARCHAR(50) DEFAULT 'active',
    progress INTEGER DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE project_members (
    member_id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL DEFAULT 'member',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id, user_id)
);

CREATE TABLE tasks (
    task_id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    created_by INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    assigned_to INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'todo',
    priority VARCHAR(20) DEFAULT 'medium',
    start_at TIMESTAMP,
    deadline TIMESTAMP,
    dor TEXT,
    dod TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

CREATE TABLE task_messages (
    message_id SERIAL PRIMARY KEY,
    task_id INTEGER NOT NULL REFERENCES tasks(task_id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

# เช็คว่าสร้างสำเร็จ
\dt
```

#### 5. CORS Error 🚫
**อาการ:**
- Console แสดง error: "CORS policy"
- Network tab แสดง status (CORS error)

**แก้ไข:**
ตรวจสอบ `server/index.js`:
```javascript
app.use(cors({
  origin: 'http://localhost:5173', // ต้องตรงกับ frontend URL
  credentials: true,
}));
```

#### 6. Port Conflict ⚡
**อาการ:**
- Error: "Port 5000 already in use"

**แก้ไข:**
```bash
# หา process ที่ใช้ port 5000
# Linux/Mac:
lsof -ti:5000
# Kill process
lsof -ti:5000 | xargs kill -9

# Windows:
netstat -ano | findstr :5000
taskkill /PID [PID_NUMBER] /F

# หรือเปลี่ยน port ใน server/.env
PORT=5001
# แล้ว update client/.env
VITE_API_URL=http://localhost:5001/api
```

---

## 🐛 วิธีตรวจสอบปัญหา (Step by Step)

### Step 1: ตรวจสอบ Backend
```bash
cd server
npm run dev
```

**ดู terminal ว่ามี:**
- ✅ "THE PULSE SERVER IS RUNNING"
- ✅ "Database connected successfully"

**ถ้าไม่มี** → มีปัญหาที่ backend

### Step 2: ตรวจสอบ Frontend
```bash
cd client
npm run dev
```

**ควรเห็น:**
- ✅ "VITE v5.0.8 ready"
- ✅ "Local: http://localhost:5173"

### Step 3: ทดสอบ API
```bash
# ทดสอบ health check
curl http://localhost:5000/health

# ทดสอบ register (ใช้ terminal)
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@test.com",
    "password": "password123"
  }'

# ควรได้ response:
# {"success":true,"message":"Registration successful","data":{...}}
```

### Step 4: เปิด Browser Developer Tools
1. กด F12 หรือ Right-click → Inspect
2. ไปที่ tab **Console**
   - ดู error สีแดงมีไหม
3. ไปที่ tab **Network**
   - กด Register หรือ Login
   - ดู request status
   - ถ้า status 401, 500 → มีปัญหาที่ backend
   - ถ้า CORS error → ตั้งค่า CORS ไม่ถูก
   - ถ้า Network error → backend ไม่ทำงาน

---

## 💡 Solutions by Error Message

### Error: "Network Error"
```
❌ Backend ไม่ทำงาน
✅ แก้: เปิด backend server (npm run dev)
```

### Error: "Request failed with status code 401"
```
❌ Token หมดอายุหรือไม่ถูกต้อง
✅ แก้: Logout แล้ว login ใหม่
```

### Error: "Request failed with status code 500"
```
❌ Backend error (ส่วนใหญ่เป็น database)
✅ แก้: ดู terminal ของ backend หา error
✅ แก้: เช็ค database connection
```

### Error: "relation users does not exist"
```
❌ ตาราง database ยังไม่ได้สร้าง
✅ แก้: รัน SQL schema (ดูด้านบน)
```

### Error: "duplicate key value violates unique constraint"
```
❌ Username หรือ Email ซ้ำในระบบ
✅ แก้: ใช้ username/email อื่น
```

### Warning: "Loading..." ค้างไม่หายไป
```
❌ API ไม่ตอบกลับ
✅ แก้: เช็ค backend console หา error
✅ แก้: เช็ค network tab ว่า request ส่งไปหรือยัง
```

---

## 🔍 Advanced Debugging

### 1. ดูค่าที่เก็บใน localStorage
```javascript
// เปิด Browser Console (F12)
console.log('Token:', localStorage.getItem('token'));
console.log('User:', localStorage.getItem('user'));

// ถ้าไม่มี → login/register ไม่สำเร็จ
// ถ้ามี → ปัญหาอยู่ที่การ fetch projects
```

### 2. ทดสอบ Projects API ด้วย curl
```bash
# ใช้ token ที่ได้จาก localStorage
curl http://localhost:5000/api/projects \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# ควรได้ list ของ projects (อาจจะเป็น [] ถ้ายังไม่มี project)
```

### 3. Clear All และเริ่มใหม่
```bash
# Clear browser data
# Chrome: Ctrl+Shift+Del → Clear all

# Clear localStorage
localStorage.clear();

# Restart backend
cd server
npm run dev

# Restart frontend
cd client
npm run dev

# Register ใหม่
```

---

## ✅ Checklist ก่อนใช้งาน

- [ ] PostgreSQL ทำงานอยู่
- [ ] Database `the_pulse_db` ถูกสร้างแล้ว
- [ ] Tables ถูกสร้างครบทั้ง 5 ตาราง
- [ ] `server/.env` ถูกต้อง (DB credentials, JWT_SECRET)
- [ ] `client/.env` ถูกต้อง (VITE_API_URL)
- [ ] Backend server รันอยู่ที่ port 5000
- [ ] Frontend dev server รันอยู่ที่ port 5173
- [ ] เข้า http://localhost:5173 ได้
- [ ] Console ไม่มี error สีแดง

---

## 📞 ยังแก้ไม่ได้?

### Option 1: Reset ทั้งหมด
```bash
# 1. Stop all servers
# Ctrl+C in both terminals

# 2. Drop and recreate database
psql -U postgres
DROP DATABASE the_pulse_db;
CREATE DATABASE the_pulse_db;
\q

# 3. Run schema again (INSTALLATION.md)

# 4. Clear node_modules
cd server && rm -rf node_modules && npm install
cd client && rm -rf node_modules && npm install

# 5. Start fresh
cd server && npm run dev
cd client && npm run dev
```

### Option 2: Check System Requirements
```bash
node --version    # Should be 18+
npm --version     # Should be 9+
psql --version    # Should be 14+
```

### Option 3: Try Different Port
```bash
# ในกรณี port conflict
# server/.env
PORT=5001

# client/.env
VITE_API_URL=http://localhost:5001/api
```

---

## 🎯 Quick Fix Commands

```bash
# แก้ปัญหาส่วนใหญ่
cd server && npm install && npm run dev &
cd client && npm install && npm run dev

# Reset database
psql -U postgres -c "DROP DATABASE IF EXISTS the_pulse_db;"
psql -U postgres -c "CREATE DATABASE the_pulse_db;"

# Clear browser cache
# Chrome: Ctrl+Shift+R (hard refresh)

# Kill port 5000
lsof -ti:5000 | xargs kill -9

# Kill port 5173
lsof -ti:5173 | xargs kill -9
```

---

**หมายเหตุ:** ปัญหาส่วนใหญ่มาจาก:
1. Database ไม่ได้เชื่อมต่อ (60%)
2. Tables ยังไม่ได้สร้าง (25%)
3. Environment variables ผิด (10%)
4. Server ไม่ทำงาน (5%)
