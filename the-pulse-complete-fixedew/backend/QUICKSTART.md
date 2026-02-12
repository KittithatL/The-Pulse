# 🚀 Quick Start Guide - The Pulse Backend

Get up and running in 5 minutes!

## Prerequisites Check

```bash
node --version   # Should be v18 or higher
npm --version    # Should be v9 or higher
psql --version   # Should be v14 or higher
```

## Step 1: Database Setup (2 minutes)

```bash
# Start PostgreSQL (if not running)
sudo systemctl start postgresql

# Create database and user
sudo -u postgres psql << EOF
CREATE DATABASE the_pulse_db;
CREATE USER pulse_admin WITH PASSWORD 'SecurePassword123!';
GRANT ALL PRIVILEGES ON DATABASE the_pulse_db TO pulse_admin;
\q
EOF

# Import schema
cd backend
psql -U pulse_admin -d the_pulse_db -f database/schema.sql
```

## Step 2: Environment Configuration (1 minute)

```bash
# Copy environment template
cp .env.example .env

# Edit the .env file (use your preferred editor)
nano .env
```

**Minimum required variables:**
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=the_pulse_db
DB_USER=pulse_admin
DB_PASSWORD=SecurePassword123!
JWT_SECRET=your_random_secret_key_here_change_this
PORT=5000
CLIENT_URL=http://localhost:5173
```

**Generate secure JWT_SECRET:**
```bash
# On Linux/Mac
openssl rand -base64 32

# Or use Node
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## Step 3: Install Dependencies (1 minute)

```bash
npm install
```

## Step 4: Start Server (1 second!)

```bash
# Development mode (with auto-reload)
npm run dev

# Or production mode
npm start
```

You should see:
```
╔═══════════════════════════════════════╗
║                                       ║
║   🚀 THE PULSE SERVER IS RUNNING 🚀   ║
║                                       ║
║   Port: 5000                          ║
║   Environment: development            ║
║   Time: ...                           ║
║                                       ║
╚═══════════════════════════════════════╝

🕐 Starting cron jobs...
   ✓ Scheduled: risk-detection (every 3600s)
   ✓ Scheduled: health-cleanup (every 86400s)
   ✓ Scheduled: mood-summary (daily at 09:00)
   ✓ Scheduled: auto-resolve-risks (every 21600s)
✅ All cron jobs started successfully
```

## Step 5: Test the API

```bash
# Test health endpoint
curl http://localhost:5000/health

# Expected response:
# {"success":true,"message":"Server is running","timestamp":"..."}
```

## Quick Test Flow

### 1. Register a User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "email": "admin@thepulse.com",
    "password": "Admin123!",
    "full_name": "Admin User"
  }'
```

### 2. Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@thepulse.com",
    "password": "Admin123!"
  }'
```

**Save the token from response!**

### 3. Create a Project
```bash
export TOKEN="your_jwt_token_here"

curl -X POST http://localhost:5000/api/projects \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Phoenix Project",
    "description": "Modernizing core microservices",
    "due_date": "2024-12-31"
  }'
```

### 4. Get Dashboard
```bash
curl -X GET http://localhost:5000/api/dashboard/1/overview \
  -H "Authorization: Bearer $TOKEN"
```

## 🎉 That's It!

Your backend is now running with:
- ✅ REST API on http://localhost:5000
- ✅ Database connection
- ✅ JWT authentication
- ✅ Automated risk detection
- ✅ Analytics services

## Next Steps

1. **Connect Frontend:**
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```

2. **Read Full Documentation:**
   - [API Documentation](./API_DOCUMENTATION.md)
   - [README](./README.md)

3. **Explore Features:**
   - Team mood tracking
   - Risk alerts
   - Infrastructure monitoring
   - Project analytics

## Common Issues

### "Database connection failed"
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Check credentials in .env
psql -U pulse_admin -d the_pulse_db -c "SELECT 1"
```

### "Port 5000 already in use"
```bash
# Find what's using the port
lsof -i :5000

# Kill the process or change PORT in .env
PORT=5001
```

### "JWT verification failed"
- Make sure JWT_SECRET is set in .env
- Check token format: `Bearer <token>`
- Token expires after 7 days by default

## Development Tips

**Auto-reload on changes:**
```bash
npm run dev  # Uses nodemon
```

**View logs:**
```bash
# The server logs to console by default
# For production, consider using PM2:
pm2 start index.js --name pulse-api
pm2 logs pulse-api
```

**Test with Postman:**
1. Import the API collection (if available)
2. Set base_url: `http://localhost:5000`
3. Set token variable after login

## Production Deployment

See [README.md](./README.md#deployment) for:
- PM2 setup
- Docker deployment
- Security checklist
- Environment variables for production

---

**Need Help?**
- 📧 Email: support@thepulse.app
- 📖 Docs: [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
- 🐛 Issues: GitHub Issues

**Happy coding! 🎊**
