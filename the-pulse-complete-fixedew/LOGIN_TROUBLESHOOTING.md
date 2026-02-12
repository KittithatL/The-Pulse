# 🔐 แก้ปัญหา Login ไม่ได้

## อาการที่พบ
- กด Login แล้วไม่เกิดอะไร
- หน้าจอไม่เปลี่ยน
- มี error message
- Loading ตลอด

---

## ✅ ขั้นตอนแก้ไข

### 1. ตรวจสอบ Backend กำลังรันหรือไม่

```bash
# Test backend health
curl http://localhost:5000/health

# ต้องได้:
# {"success":true,"message":"Server is running",...}
```

**ถ้า error**: Backend ไม่รัน
```bash
cd backend
npm run dev
```

---

### 2. ตรวจสอบ Database มี User Table หรือไม่

```bash
psql -U postgres -d the_pulse_db -c "\dt"
```

ต้องเห็นตาราง `users` ในรายการ

**ถ้าไม่มี**: Import schema
```bash
cd backend
psql -U postgres -d the_pulse_db -f database/schema.sql
```

---

### 3. สร้าง User ทดสอบ (ถ้ายังไม่มี)

#### วิธีที่ 1: ใช้ Register Page
1. ไปที่ http://localhost:5173/register
2. กรอกข้อมูล:
   - **Username**: testuser
   - **Email**: test@test.com
   - **Password**: Test123!
   - **Full Name**: Test User
3. กด Register

#### วิธีที่ 2: ใช้ cURL
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@test.com",
    "password": "Test123!",
    "full_name": "Test User"
  }'
```

---

### 4. ทดสอบ Login ด้วย cURL

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@test.com",
    "password": "Test123!"
  }'
```

**Response ที่ถูกต้อง:**
```json
{
  "success": true,
  "data": {
    "user": {...},
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6..."
  }
}
```

**ถ้าได้ response นี้ → Backend ใช้งานได้**

---

### 5. ตรวจสอบ Browser Console

1. เปิด DevTools (F12)
2. ไปที่ Tab **Console**
3. พยายาม Login อีกครั้ง
4. ดูว่ามี Error อะไร

#### Error ที่มักพบ:

**"Network Error"**
```
❌ Backend ไม่รัน หรือ port ผิด
✅ แก้: เช็ค VITE_API_URL ใน frontend/.env
```

**"401 Unauthorized"**
```
❌ Email/Password ผิด
✅ แก้: ลองสร้าง user ใหม่
```

**"CORS Error"**
```
❌ Backend CORS settings ผิด
✅ แก้: เช็ค CLIENT_URL ใน backend/.env
```

**"500 Internal Server Error"**
```
❌ Database connection failed
✅ แก้: เช็ค DB credentials ใน backend/.env
```

---

### 6. ตรวจสอบ Environment Variables

#### Frontend (.env)
```bash
cd frontend
cat .env
```

ต้องมี:
```env
VITE_API_URL=http://localhost:5000/api
```

#### Backend (.env)
```bash
cd backend
cat .env
```

ต้องมี:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=the_pulse_db
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_secret_key
CLIENT_URL=http://localhost:5173
```

---

### 7. ตรวจสอบ Network Tab

1. เปิด DevTools (F12)
2. ไปที่ Tab **Network**
3. กด Login
4. ดูที่ request `/auth/login`
5. เช็ค:
   - **Request URL**: ต้องเป็น `http://localhost:5000/api/auth/login`
   - **Status Code**: ต้อง 200 (สำเร็จ)
   - **Response**: ต้องมี token

#### ถ้า Request URL ผิด:
```
❌ http://localhost:5173/api/auth/login  (ผิด!)
✅ http://localhost:5000/api/auth/login  (ถูก!)

แก้: เช็ค VITE_API_URL ใน .env
```

---

## 🔍 การทดสอบแบบละเอียด

### Test 1: Backend Health
```bash
curl http://localhost:5000/health
```
✅ Pass: ได้ JSON response
❌ Fail: Connection refused → Start backend

### Test 2: Register Endpoint
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test2",
    "email": "test2@test.com",
    "password": "Test123!",
    "full_name": "Test User 2"
  }'
```
✅ Pass: ได้ token
❌ Fail: Database error → Check database

### Test 3: Login Endpoint
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test2@test.com",
    "password": "Test123!"
  }'
```
✅ Pass: ได้ token
❌ Fail: 401 → Email/Password ผิด

### Test 4: Frontend API Call
เปิด Browser Console แล้วรัน:
```javascript
fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'test@test.com',
    password: 'Test123!'
  })
})
.then(r => r.json())
.then(d => console.log(d))
```
✅ Pass: เห็น success: true
❌ Fail: CORS error → Check backend CORS

---

## 🐛 Error Messages และวิธีแก้

### "Invalid credentials"
```
สาเหตุ: Email หรือ Password ผิด
แก้ไข:
1. ตรวจสอบ email ให้ถูกต้อง
2. ตรวจสอบ password (case-sensitive)
3. ลองสร้าง user ใหม่
```

### "User not found"
```
สาเหตุ: Email ยังไม่ได้ register
แก้ไข:
1. ไป /register สร้าง account ก่อน
2. หรือใช้ cURL register (ดูด้านบน)
```

### "Network Error" / "Failed to fetch"
```
สาเหตุ: Backend ไม่รัน หรือ URL ผิด
แก้ไข:
1. Start backend: cd backend && npm run dev
2. Check VITE_API_URL in frontend/.env
3. Check port 5000 ว่าง: lsof -i :5000
```

### "CORS policy blocked"
```
สาเหตุ: Backend ไม่อนุญาต origin
แก้ไข:
1. Check backend/.env:
   CLIENT_URL=http://localhost:5173
2. Restart backend
```

### Loading ตลอด (ไม่มี response)
```
สาเหตุ: Backend hang หรือ request timeout
แก้ไข:
1. Check backend terminal มี error อะไร
2. Check database connection
3. Restart backend
```

---

## 🔧 Quick Fix Script

สร้างไฟล์ `test-login.sh`:

```bash
#!/bin/bash

echo "🔐 Testing Login System..."
echo ""

# 1. Check backend
echo "1. Testing Backend..."
if curl -s http://localhost:5000/health > /dev/null; then
    echo "✅ Backend is running"
else
    echo "❌ Backend is NOT running"
    echo "   Fix: cd backend && npm run dev"
    exit 1
fi

# 2. Check database
echo "2. Testing Database..."
if psql -U postgres -d the_pulse_db -c "SELECT 1;" > /dev/null 2>&1; then
    echo "✅ Database is accessible"
else
    echo "❌ Database is NOT accessible"
    echo "   Fix: Check PostgreSQL is running"
    exit 1
fi

# 3. Test register
echo "3. Testing Register..."
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "autotest",
    "email": "autotest@test.com",
    "password": "Test123!",
    "full_name": "Auto Test"
  }')

if echo "$REGISTER_RESPONSE" | grep -q "success"; then
    echo "✅ Register endpoint works"
else
    echo "⚠️  Register failed (may be user exists)"
fi

# 4. Test login
echo "4. Testing Login..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "autotest@test.com",
    "password": "Test123!"
  }')

if echo "$LOGIN_RESPONSE" | grep -q "token"; then
    echo "✅ Login endpoint works!"
    echo ""
    echo "🎉 Login system is working correctly!"
    echo ""
    echo "You can now login with:"
    echo "  Email: autotest@test.com"
    echo "  Password: Test123!"
else
    echo "❌ Login failed"
    echo "Response: $LOGIN_RESPONSE"
fi

echo ""
```

รัน:
```bash
chmod +x test-login.sh
./test-login.sh
```

---

## 📋 Checklist ก่อน Login

- [ ] Backend รันอยู่ที่ port 5000
- [ ] Database `the_pulse_db` มีอยู่
- [ ] ตาราง `users` มีอยู่ใน database
- [ ] มี user account อย่างน้อย 1 อัน
- [ ] Frontend/.env มี VITE_API_URL ถูกต้อง
- [ ] Backend/.env มี CLIENT_URL ถูกต้อง
- [ ] ไม่มี CORS error ใน console
- [ ] Network tab แสดง request ไป /auth/login

---

## ✅ Login สำเร็จเมื่อ:

1. กด Login button
2. เห็น toast "Login successful!"
3. redirect ไป /projects
4. เห็น username ที่มุมขวาบน
5. localStorage มี token

### ตรวจสอบ Token:
เปิด Browser Console (F12):
```javascript
localStorage.getItem('token')
// ต้องได้ string ยาวๆ
```

---

## 🎯 ขั้นตอนที่แน่นอนที่สุด

1. **Start Backend**
```bash
cd backend
npm run dev
```

2. **สร้าง User**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@test.com",
    "password": "Admin123!",
    "full_name": "Admin User"
  }'
```

3. **Test Login**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "Admin123!"
  }'
```

4. **ถ้า cURL ได้ แต่ Browser ไม่ได้**:
   - เช็ค CORS
   - เช็ค .env files
   - Clear browser cache
   - Hard refresh (Ctrl+Shift+R)

---

## 💡 Tips

1. **ใช้ email (ไม่ใช่ username) ใน login**
   - ✅ `email: "test@test.com"`
   - ❌ `emailOrUsername: "testuser"`

2. **Password ต้อง strong**
   - อย่างน้อย 8 ตัวอักษร
   - มีตัวพิมพ์ใหญ่
   - มีตัวเลข
   - มีอักขระพิเศษ

3. **Backend logs**
   ```bash
   cd backend
   npm run dev
   # ดูที่ terminal ว่ามี error อะไร
   ```

---

**ยังแก้ไม่ได้?**
ให้ข้อมูลเหล่านี้มา:
1. Error message ใน console
2. Response จาก Network tab
3. Backend terminal logs
4. Screenshot หน้า login
