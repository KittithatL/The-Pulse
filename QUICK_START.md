# ⚡ The Pulse - Quick Start Commands

## 🚀 Fast Setup (Copy-Paste Ready)

### 1. Database Setup (PostgreSQL)
```bash
# Create database
psql -U postgres -c "CREATE DATABASE the_pulse_db;"

# Or if you want to use GUI, connect to PostgreSQL and run:
# CREATE DATABASE the_pulse_db;
```

### 2. Backend Setup
```bash
# Navigate to server
cd server

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# IMPORTANT: Edit .env with your database credentials
# Then start the server
npm run dev
```

### 3. Frontend Setup (New Terminal)
```bash
# Navigate to client
cd client

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run dev
```

## 🎯 One-Line Commands

### Backend
```bash
cd server && npm install && cp .env.example .env && echo "⚠️  Edit .env file now, then run: npm run dev"
```

### Frontend  
```bash
cd client && npm install && cp .env.example .env && npm run dev
```

## 📝 Environment Variables Quick Reference

### Backend (.env)
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=the_pulse_db
DB_USER=postgres
DB_PASSWORD=your_password_here
JWT_SECRET=your_super_secret_key_at_least_32_characters_long
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
```

## 🔍 Verify Installation

### Check Backend
```bash
curl http://localhost:5000/health
```
Expected: `{"success":true,"message":"Server is running"}`

### Check Frontend
Open browser: `http://localhost:5173`

## 📦 Package Installation Times (Approximate)

- Backend: ~30 seconds
- Frontend: ~45 seconds
- Total: ~1-2 minutes

## 🎨 Default Ports

- Backend API: `http://localhost:5000`
- Frontend UI: `http://localhost:5173`
- PostgreSQL: `5432` (default)

## ⚡ Quick Commands Reference

### Development
```bash
# Start backend (from server/)
npm run dev

# Start frontend (from client/)
npm run dev
```

### Build for Production
```bash
# Build frontend
cd client && npm run build

# Start backend in production
cd server && NODE_ENV=production npm start
```

### Reset Database (if needed)
```bash
psql -U postgres -d the_pulse_db -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
# Then re-run your SQL schema
```

## 🐛 Quick Troubleshooting

### Database Connection Error
```bash
# Check if PostgreSQL is running
sudo service postgresql status
# or
pg_isready
```

### Port Already in Use
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Kill process on port 5173
lsof -ti:5173 | xargs kill -9
```

### Clean Install
```bash
# Backend
cd server && rm -rf node_modules package-lock.json && npm install

# Frontend
cd client && rm -rf node_modules package-lock.json && npm install
```

## 🎉 Test Your Installation

1. **Register**: `http://localhost:5173/register`
2. **Login**: Use your credentials
3. **Create Project**: Click "Create Project" button
4. **Add Member**: Click Users icon on project card
5. **Success!** 🎊

## 📱 Access from Other Devices (Same Network)

1. Find your IP:
```bash
# Linux/Mac
ifconfig | grep inet

# Windows
ipconfig
```

2. Update client/.env:
```env
VITE_API_URL=http://YOUR_IP:5000/api
```

3. Access from other device:
```
http://YOUR_IP:5173
```

## 🔐 First User Creation

```bash
# Method 1: Use the UI (Recommended)
# Go to http://localhost:5173/register

# Method 2: Direct SQL Insert (Advanced)
psql -U postgres -d the_pulse_db -c "
INSERT INTO users (username, email, password_hash, full_name) 
VALUES (
  'admin', 
  'admin@thepulse.com', 
  '\$2a\$10\$rN1qXQ6xZZ3dXYZ3dXYZ3e...',  -- hash of 'password123'
  'Admin User'
);"
```

---

**Ready to go! 🚀**
