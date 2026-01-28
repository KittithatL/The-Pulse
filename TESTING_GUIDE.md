# 🧪 The Pulse - Testing Guide

## 📝 สำหรับการทดสอบระบบ

### 🔑 ข้อมูล Users สำหรับทดสอบ

ระบบมี default user อยู่แล้วคือ:
- **Username:** `admin`
- **Email:** `admin@thepulse.com`
- **User ID:** 1

แต่เพื่อทดสอบฟีเจอร์ Members ต้องสร้าง test users เพิ่ม:

### 📦 สร้าง Test Users

```sql
-- เข้า PostgreSQL
psql -U postgres -d the_pulse_db

-- สร้าง Test Users
INSERT INTO users (username, email, password_hash, full_name) 
VALUES 
  ('john', 'john@test.com', '$2a$10$dummy', 'John Doe'),
  ('jane', 'jane@test.com', '$2a$10$dummy', 'Jane Smith'),
  ('bob', 'bob@test.com', '$2a$10$dummy', 'Bob Wilson'),
  ('alice', 'alice@test.com', '$2a$10$dummy', 'Alice Brown');

-- ตรวจสอบว่าสร้างสำเร็จ
SELECT user_id, username, email, full_name FROM users;

-- ออกจาก psql
\q
```

### ✅ ผลลัพธ์ที่ควรเห็น:

```
 user_id | username |      email       |  full_name  
---------+----------+------------------+-------------
       1 | admin    | admin@thepulse.com | Default Admin
       2 | john     | john@test.com    | John Doe
       3 | jane     | jane@test.com    | Jane Smith
       4 | bob      | bob@test.com     | Bob Wilson
       5 | alice    | alice@test.com   | Alice Brown
```

---

## 🧪 Test Cases

### 1. ✅ ทดสอบสร้าง Project

**Steps:**
1. เปิด http://localhost:5173
2. คลิก "Create Project"
3. กรอก:
   - Project Name: "Test Project 1"
   - Description: "This is a test project"
   - End Date: เลือกวันที่ในอนาคต
4. คลิก "Create Project"

**Expected Result:**
- ✅ เห็น toast "Project created successfully"
- ✅ Project card ใหม่ปรากฏในหน้า Projects
- ✅ มี member 1 คน (admin)

---

### 2. ✅ ทดสอบเพิ่ม Members

**Steps:**
1. คลิกไอคอน Users (👥) ที่ project card
2. พิมพ์ `john@test.com` ใน input
3. คลิก "ADD"
4. รอสักครู่
5. พิมพ์ `jane@test.com`
6. คลิก "ADD"

**Expected Result:**
- ✅ เห็น toast "Member added successfully"
- ✅ เห็นชื่อ JOHN และ JANE ในรายการ
- ✅ Member count เพิ่มเป็น 3 คน

**ใช้ Emails เหล่านี้ในการทดสอบ:**
- ✅ `john@test.com` → John Doe
- ✅ `jane@test.com` → Jane Smith
- ✅ `bob@test.com` → Bob Wilson
- ✅ `alice@test.com` → Alice Brown

**หรือใช้ Username:**
- ✅ `john` → John Doe
- ✅ `jane` → Jane Smith
- ✅ `bob` → Bob Wilson
- ✅ `alice` → Alice Brown

---

### 3. 🗑️ ทดสอบลบ Members

**Steps:**
1. เปิด Members modal (คลิก 👥)
2. **Hover** เมาส์ไปที่ชื่อ JOHN
3. จะเห็นปุ่ม 🗑️ ปรากฏ
4. คลิกปุ่ม 🗑️
5. ยืนยันการลบ

**Expected Result:**
- ✅ เห็น confirmation dialog
- ✅ คลิก OK แล้ว JOHN หายไป
- ✅ เห็น toast "Member removed successfully"
- ✅ Member count ลดลง

**หมายเหตุ:** 
- ❌ ไม่สามารถลบ ADMIN ได้ (เป็น owner)
- ✅ ลบได้เฉพาะ members ที่ไม่ใช่ owner

---

### 4. 🗑️ ทดสอบลบ Project

**Steps:**
1. **Hover** เมาส์ที่ project card
2. จะเห็นปุ่ม 🗑️ สีแดง ปรากฏด้านขวาบน
3. คลิกปุ่ม 🗑️
4. ยืนยันการลบ

**Expected Result:**
- ✅ เห็น confirmation dialog พร้อมชื่อ project
- ✅ คลิก OK แล้ว project หายไป
- ✅ เห็น toast "Project deleted successfully"
- ✅ Database ลบ project และ members ออกอัตโนมัติ

---

### 5. 🔍 ทดสอบ Search

**Steps:**
1. สร้าง projects หลายๆ อัน:
   - "Mobile App"
   - "Website Redesign"
   - "API Development"
2. พิมพ์ "mobile" ใน search bar บน navbar
3. พิมพ์ "API" ใน search bar

**Expected Result:**
- ✅ ค้นหาได้แบบ real-time (ไม่ต้อง enter)
- ✅ แสดงเฉพาะ projects ที่ตรงกับคำค้น
- ✅ แสดงจำนวนผลลัพธ์
- ✅ คลิก X เพื่อเคลียร์ search

---

### 6. 📌 ทดสอบ Sidebar Toggle

**Steps:**
1. คลิกปุ่ม `<` ที่ด้านล่างของ sidebar
2. Sidebar จะย่อเหลือแค่ icon
3. คลิกปุ่ม `>` อีกครั้ง
4. Sidebar จะกลับมาเต็ม

**Expected Result:**
- ✅ Animation ลื่นไหล
- ✅ Navigation ยังใช้งานได้ตอนย่อ
- ✅ Tooltip แสดงชื่อเมนูตอนย่อ
- ✅ Scrollbar ไม่เห็น (ซ่อนไว้)

---

### 7. ✏️ ทดสอบแก้ไข Project

**Steps:**
1. คลิกปุ่ม ✏️ (Edit) ที่ project card
2. แก้ไข:
   - Project Name: "Updated Project Name"
   - Description: "New description"
3. คลิก "Update Project"

**Expected Result:**
- ✅ เห็น toast "Project updated successfully"
- ✅ ชื่อและคำอธิบายเปลี่ยนทันที
- ✅ Modal ปิดอัตโนมัติ

---

## 🎯 Quick Test Checklist

สำหรับ test รวดเร็ว ลองทำตามนี้:

```bash
# 1. Start Backend
cd server && npm run dev

# 2. Start Frontend (terminal ใหม่)
cd client && npm run dev

# 3. สร้าง Test Users
psql -U postgres -d the_pulse_db -c "
INSERT INTO users (username, email, password_hash, full_name) 
VALUES 
  ('john', 'john@test.com', '\$2a\$10\$dummy', 'John Doe'),
  ('jane', 'jane@test.com', '\$2a\$10\$dummy', 'Jane Smith');
"

# 4. เปิด Browser
http://localhost:5173
```

### ✅ Test Flow:
1. ✅ สร้าง project ชื่อ "Test 1"
2. ✅ เพิ่ม john@test.com
3. ✅ เพิ่ม jane@test.com
4. ✅ Hover และลบ john
5. ✅ Search หา "Test"
6. ✅ Toggle sidebar
7. ✅ Hover project card และลบ project

---

## 🐛 Troubleshooting

### ปัญหา: "User not found" ตอน add member
**แก้:** ตรวจสอบว่ามี user ในฐานข้อมูล:
```sql
SELECT * FROM users;
```

### ปัญหา: ลบ member ไม่ได้
**แก้:** ตรวจสอบว่าไม่ใช่ owner:
```sql
SELECT * FROM project_members WHERE project_id = 1;
```

### ปัญหา: Search ไม่ทำงาน
**แก้:** Clear browser cache และ reload (Ctrl+Shift+R)

---

## 📊 Database Queries สำหรับตรวจสอบ

### ดูทุก Projects:
```sql
SELECT p.*, u.username as creator 
FROM projects p 
JOIN users u ON p.created_by = u.user_id;
```

### ดู Members ของ Project:
```sql
SELECT pm.*, u.username, u.email 
FROM project_members pm 
JOIN users u ON pm.user_id = u.user_id 
WHERE pm.project_id = 1;
```

### นับจำนวน Members:
```sql
SELECT project_id, COUNT(*) as member_count 
FROM project_members 
GROUP BY project_id;
```

### ลบ Test Data ทั้งหมด:
```sql
DELETE FROM projects;
DELETE FROM users WHERE user_id > 1;
```

---

## 🎉 Summary

### ชื่อ Users สำหรับทดสอบ:

| Email | Username | Full Name | Use For |
|-------|----------|-----------|---------|
| `admin@thepulse.com` | `admin` | Default Admin | Owner (default) |
| `john@test.com` | `john` | John Doe | Add/Remove test |
| `jane@test.com` | `jane` | Jane Smith | Add/Remove test |
| `bob@test.com` | `bob` | Bob Wilson | Add/Remove test |
| `alice@test.com` | `alice` | Alice Brown | Add/Remove test |

### Features ที่ต้องทดสอบ:
- ✅ Create Project
- ✅ Edit Project
- ✅ **Delete Project** (NEW!)
- ✅ Add Members (ใช้ email/username ด้านบน)
- ✅ **Remove Members** (hover แล้วคลิกถังขยะ)
- ✅ **Search Projects** (พิมพ์ใน navbar)
- ✅ **Toggle Sidebar** (คลิก < >)
- ✅ **Hidden Scrollbar** (sidebar เลื่อนได้แต่ไม่เห็น scrollbar)

---

**Happy Testing! 🚀**
