const { Pool } = require('pg');
require('dotenv').config();

// ตรวจสอบว่ามี DATABASE_URL หรือไม่ ถ้าไม่มีให้ใช้โครงสร้างเดิม (สำหรับ Local)
const isProduction = process.env.NODE_ENV === 'production' || process.env.DATABASE_URL;

const pool = new Pool({
  // ✅ ใช้ connectionString จะจัดการเรื่อง SSL และรหัสผ่านพิเศษได้ดีกว่า
  connectionString: process.env.DATABASE_URL || `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
  
  // ✅ ตั้งค่า SSL สำหรับ Neon (สำคัญมาก)
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,

  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000, // เพิ่มเป็น 5 วินาทีเพื่อให้เวลา Cloud ในการ Connect
});

pool.on('connect', () => {
  console.log('✅ Database connected successfully to', process.env.DATABASE_URL ? 'Neon Cloud' : 'Local DB');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected database error:', err);
  // ไม่แนะนำให้ process.exit(-1) ในแอปจริง เพราะจะทำให้ Server ดับเมื่อ DB กระตุกชั่วคราว
});

module.exports = pool;