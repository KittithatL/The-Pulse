# 🚨 Quick Fix - "Failed to load dashboard"

เห็นข้อความ "Failed to load dashboard" ใช่ไหม? ทำตามนี้เลย!

---

## ⚡ วิธีแก้ไข (2 นาที)

### 1. ตรวจสอบ Backend กำลังรันอยู่หรือไม่ ✅

```bash
# เปิด terminal ใหม่
cd backend
npm run dev
```

ต้องเห็นข้อความแบบนี้:
```
╔═══════════════════════════════════════╗
║   🚀 THE PULSE SERVER IS RUNNING 🚀   ║
║   Port: 5000                          ║
╚═══════════════════════════════════════╝
```

### 2. ตรวจสอบ Database ✅

```bash
# ลอง connect database
psql -U postgres -d the_pulse_db -c "SELECT 1;"
```

**ถ้า error**: Database ยังไม่มี
```bash
# สร้าง database
psql -U postgres -c "CREATE DATABASE the_pulse_db;"

# Import schema
cd backend
psql -U postgres -d the_pulse_db -f database/schema.sql
```

### 3. ตรวจสอบว่ามี Project หรือยัง ✅

Dashboard ต้องมี project ถึงจะแสดงผลได้!

**วิธีแก้:**
1. ไปที่ http://localhost:5173/projects
2. กด "Create Project"
3. กรอกข้อมูล:
   - Name: Phoenix Project
   - Description: Test project
   - Due Date: วันใดก็ได้
4. กด Save
5. กลับมา Dashboard อีกรอบ

### 4. ลอง Login ใหม่ ✅

Token อาจหมดอายุแล้ว

1. ไปที่ http://localhost:5173/login
2. Login อีกครั้ง
3. ลอง Dashboard อีกรอบ

---

## 🔍 ตรวจสอบระบบอัตโนมัติ

รันสคริปต์นี้เพื่อเช็คทุกอย่าง:

```bash
chmod +x health-check.sh
./health-check.sh
```

จะบอกว่าอะไรผิดพลาด!

---

## 📋 Checklist (เช็คทีละข้อ)

- [ ] Backend รันอยู่ที่ port 5000
- [ ] Database `the_pulse_db` มีอยู่
- [ ] Database มีตารางครบ (12+ ตาราง)
- [ ] Frontend รันอยู่ที่ port 5173
- [ ] ไฟล์ `.env` มีอยู่ใน backend และ frontend
- [ ] Login แล้ว (มี token)
- [ ] มี project อย่างน้อย 1 อันใน database

---

## 💡 วิธีเช็คแต่ละข้อ

### เช็ค Backend
```bash
curl http://localhost:5000/health
```
ได้ response → ✅ OK
Error → ❌ Backend ไม่รัน

### เช็ค Database
```bash
psql -U postgres -d the_pulse_db -c "\dt"
```
เห็นตาราง 12+ ตัว → ✅ OK
Error → ❌ Database ไม่มี

### เช็ค Token
เปิด Browser Console (F12) แล้วพิมพ์:
```javascript
localStorage.getItem('token')
```
เห็น string ยาวๆ → ✅ OK
null → ❌ ต้อง login

### เช็ค Project
```bash
# ใช้ token จาก console
curl -X GET http://localhost:5000/api/projects \
  -H "Authorization: Bearer YOUR_TOKEN"
```
เห็น array ไม่ว่าง → ✅ OK
Empty array → ❌ ต้องสร้าง project

---

## 🔧 แก้ปัญหาเฉพาะ

### "Cannot connect to server"
```bash
# Backend ไม่รัน → start มัน
cd backend
npm run dev
```

### "401 Unauthorized"
```bash
# Token หมดอายุ → login ใหม่
# ไป http://localhost:5173/login
```

### "No projects found"
```bash
# ไม่มี project → สร้างใหม่
# ไป http://localhost:5173/projects
# กด Create Project
```

### "Database connection failed"
```bash
# เช็ค backend/.env
cat backend/.env

# ต้องมี:
DB_HOST=localhost
DB_PORT=5432
DB_NAME=the_pulse_db
DB_USER=postgres
DB_PASSWORD=your_password
```

---

## 🎯 ทดสอบว่าแก้แล้วหรือยัง

### 1. Test Backend API
```bash
curl http://localhost:5000/health
```
ต้องได้: `{"success":true,...}`

### 2. Test Login
ไปที่: http://localhost:5173/login
ใส่ email/password → ต้อง login ได้

### 3. Test Projects
ไปที่: http://localhost:5173/projects
ต้องเห็นรายการ project

### 4. Test Dashboard
ไปที่: http://localhost:5173/dashboard
ต้องเห็น:
- ✅ Project name ด้านบน
- ✅ AI Briefing card
- ✅ Team mood emojis
- ✅ Metrics (%, scores)

---

## 🚀 ถ้ายังไม่ได้ - Reset ทั้งหมด

```bash
# 1. หยุดทุกอย่าง
pkill -f node

# 2. ลบ database และสร้างใหม่
psql -U postgres -c "DROP DATABASE IF EXISTS the_pulse_db;"
psql -U postgres -c "CREATE DATABASE the_pulse_db;"

# 3. Import schema
cd backend
psql -U postgres -d the_pulse_db -f database/schema.sql

# 4. Start backend
npm run dev

# 5. Start frontend (terminal ใหม่)
cd frontend
npm run dev

# 6. Register user ใหม่
# ไป http://localhost:5173/register

# 7. Create project
# ไป http://localhost:5173/projects

# 8. Test dashboard
# ไป http://localhost:5173/dashboard
```

---

## 📞 ยังแก้ไม่ได้?

1. อ่าน `TROUBLESHOOTING.md` (มีรายละเอียดเพิ่ม)
2. รัน `./health-check.sh` ดูว่าอะไรผิด
3. เช็ค Browser Console (F12) มี error อะไร
4. เช็ค Backend Terminal มี error อะไร

---

## ✅ ตัวอย่างภาพหน้าจอที่ถูกต้อง

### Backend Terminal
```
╔═══════════════════════════════════════╗
║   🚀 THE PULSE SERVER IS RUNNING 🚀   ║
║   Port: 5000                          ║
╚═══════════════════════════════════════╝
🕐 Starting cron jobs...
✅ All cron jobs started successfully
```

### Dashboard ที่โหลดสำเร็จ
```
╔═══════════════════════════════════════╗
║ PHOENIX PROJECT    CAPACITY: 18%     ║
╠═══════════════════════════════════════╣
║                                       ║
║ [AI BRIEFING]                         ║
║ Project is 78% complete...            ║
║                                       ║
║ [TEAM MOOD: 😐😊]  [EFFICIENCY: 94%] ║
║                                       ║
╚═══════════════════════════════════════╝
```

---

**หวังว่าจะแก้ไขได้นะครับ! 🎉**

ถ้ายังไม่ได้ ดู `TROUBLESHOOTING.md` สำหรับวิธีแก้ไขโดยละเอียด
