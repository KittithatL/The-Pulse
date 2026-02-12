# 🚀 The Pulse - Backend API

Modern project management platform backend built with Node.js, Express, and PostgreSQL.

![Node.js](https://img.shields.io/badge/Node.js-v18+-green)
![Express](https://img.shields.io/badge/Express-5.x-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## 📋 Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Database Setup](#database-setup)
- [Environment Variables](#environment-variables)
- [Running the Server](#running-the-server)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Available Endpoints](#available-endpoints)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)

## ✨ Features

### Core Features
- 🔐 **JWT Authentication** - Secure user authentication and authorization
- 👥 **User Management** - Complete user registration and profile management
- 📊 **Project Management** - Create, update, and manage projects
- ✅ **Task Tracking** - Task creation, assignment, and status updates
- 💬 **Project Chat** - Real-time team communication
- 📈 **Dashboard Analytics** - Comprehensive project metrics and KPIs

### Advanced Features
- 🤖 **AI Briefing** - Automated project status summaries
- 😊 **Team Mood Tracking** - Monitor team sentiment and morale
- ⚠️ **Risk Sentinel** - Automated risk detection and alerts
- 🏗️ **Infrastructure Health** - System component monitoring
- 💰 **Financial Hub** - Budget and payroll tracking
- 🎯 **Decision Hub** - Project decision tracking and voting
- 🔄 **Sprint/Cycle Management** - Agile sprint tracking

## 🔧 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** v18 or higher
- **npm** v9 or higher
- **PostgreSQL** v14 or higher
- **Git**

## 📥 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/the-pulse.git
cd the-pulse/backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and fill in your values
nano .env  # or use your preferred editor
```

## 🗄️ Database Setup

### 1. Create PostgreSQL Database

```bash
# Login to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE the_pulse_db;

# Create user (optional)
CREATE USER pulse_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE the_pulse_db TO pulse_user;

# Exit PostgreSQL
\q
```

### 2. Run Database Migrations

```bash
# Connect to your database
psql -U postgres -d the_pulse_db

# Run the schema file
\i database/schema.sql

# Exit
\q
```

### 3. Verify Tables

```bash
psql -U postgres -d the_pulse_db -c "\dt"
```

You should see the following tables:
- users
- projects
- project_members
- tasks
- team_mood
- infrastructure_health
- risk_alerts
- project_cycles
- project_decisions
- payroll_records
- chat_messages
- notifications

## 🔑 Environment Variables

Required environment variables (see `.env.example` for full list):

```env
# Server
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=the_pulse_db
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_super_secret_key
JWT_EXPIRES_IN=7d
```

## 🚀 Running the Server

### Development Mode

```bash
npm run dev
```

Server will start on `http://localhost:5000`

### Production Mode

```bash
npm start
```

### Health Check

```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-12-15T10:00:00.000Z"
}
```

## 📚 API Documentation

Full API documentation is available in [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

### Quick Start Examples

#### Authentication

```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "email": "john@example.com",
    "password": "SecurePass123!",
    "full_name": "John Doe"
  }'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'
```

#### Dashboard

```bash
# Get dashboard overview (requires authentication)
curl -X GET http://localhost:5000/api/dashboard/1/overview \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Submit team mood
curl -X POST http://localhost:5000/api/dashboard/1/mood \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"sentiment_score": 4, "comment": "Great day!"}'
```

## 📁 Project Structure

```
backend/
├── config/
│   └── database.js          # Database configuration
├── controllers/
│   ├── authController.js    # Authentication logic
│   ├── projectController.js # Project management
│   ├── taskController.js    # Task management
│   ├── dashboardController.js # Dashboard & analytics
│   └── messageController.js # Chat messages
├── middleware/
│   ├── authenticate.js      # JWT authentication
│   ├── projectAuth.js       # Project access control
│   └── taskAuth.js          # Task access control
├── routes/
│   ├── authRoutes.js        # Auth endpoints
│   ├── projectRoutes.js     # Project endpoints
│   ├── taskRoutes.js        # Task endpoints
│   └── dashboardRoutes.js   # Dashboard endpoints
├── utils/
│   └── jwt.js              # JWT utilities
├── database/
│   └── schema.sql          # Database schema
├── index.js                # Server entry point
├── package.json
├── .env.example
└── README.md
```

## 🛣️ Available Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile

### Projects
- `GET /api/projects` - List all projects
- `POST /api/projects` - Create project
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Tasks
- `GET /api/projects/:projectId/tasks` - List tasks
- `POST /api/projects/:projectId/tasks` - Create task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Dashboard
- `GET /api/dashboard/:projectId/overview` - Dashboard data
- `POST /api/dashboard/:projectId/mood` - Submit mood
- `GET /api/dashboard/:projectId/infrastructure` - Infrastructure health
- `GET /api/dashboard/:projectId/risks` - Risk alerts
- `GET /api/dashboard/:projectId/cycle` - Current cycle info

### Health Check
- `GET /health` - Server health status

## 🧪 Testing

### Manual Testing with cURL

```bash
# Test health endpoint
curl http://localhost:5000/health

# Test authentication
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@test.com","password":"Test123!","full_name":"Test User"}'
```

### Testing with Postman

1. Import the Postman collection (if available)
2. Set environment variables:
   - `base_url`: `http://localhost:5000`
   - `token`: Your JWT token after login

## 🚢 Deployment

### Using PM2 (Production)

```bash
# Install PM2
npm install -g pm2

# Start server
pm2 start index.js --name "pulse-api"

# Monitor
pm2 monit

# View logs
pm2 logs pulse-api

# Restart
pm2 restart pulse-api
```

### Using Docker

```bash
# Build image
docker build -t pulse-backend .

# Run container
docker run -p 5000:5000 \
  -e DB_HOST=your_db_host \
  -e DB_PASSWORD=your_password \
  pulse-backend
```

### Environment Checklist for Production

- [ ] Set `NODE_ENV=production`
- [ ] Use strong `JWT_SECRET`
- [ ] Enable HTTPS
- [ ] Set up database backups
- [ ] Configure proper CORS origins
- [ ] Set up monitoring (Sentry, etc.)
- [ ] Configure rate limiting
- [ ] Use environment variables for all secrets
- [ ] Set up logging
- [ ] Configure firewall rules

## 🔒 Security

### Best Practices Implemented

- ✅ Password hashing with bcrypt
- ✅ JWT token authentication
- ✅ SQL injection prevention (parameterized queries)
- ✅ CORS configuration
- ✅ Helmet.js security headers
- ✅ Rate limiting ready
- ✅ Input validation
- ✅ Secure HTTP headers

### Security Recommendations

1. **Never commit `.env` file**
2. **Use strong passwords**
3. **Rotate JWT secrets regularly**
4. **Enable HTTPS in production**
5. **Regular security updates**
6. **Monitor error logs**
7. **Implement rate limiting**
8. **Use prepared statements**

## 📊 Database Schema

Key tables and relationships:

```
users (1) ──── (N) project_members (N) ──── (1) projects
                                                  │
                    ┌─────────────────────────────┼──────────────────┐
                    │                             │                  │
                (1) tasks                    team_mood        risk_alerts
                    │
                    └──── task_comments
```

## 🐛 Troubleshooting

### Common Issues

**Issue: Database connection fails**
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Check connection
psql -U postgres -d the_pulse_db -c "SELECT 1"
```

**Issue: Port already in use**
```bash
# Find process using port 5000
lsof -i :5000

# Kill process
kill -9 <PID>
```

**Issue: JWT token errors**
- Verify `JWT_SECRET` is set in `.env`
- Check token hasn't expired
- Ensure token format: `Bearer <token>`

## 📝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👥 Team

- **Project Manager** - Jira Phoenix
- **Backend Lead** - Your Name
- **Contributors** - See contributors list

## 📞 Support

- **Email:** support@thepulse.app
- **Documentation:** https://docs.thepulse.app
- **Issues:** https://github.com/yourusername/the-pulse/issues

## 🙏 Acknowledgments

- Express.js team
- PostgreSQL community
- All contributors

---

**Happy Coding! 🚀**

Made with ❤️ by The Pulse Team
