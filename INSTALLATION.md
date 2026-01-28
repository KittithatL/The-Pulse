# 🚀 The Pulse - Installation Guide

## Quick Start Guide

### Step 1: Prerequisites Check
Before starting, make sure you have:
- ✅ Node.js v18+ installed (`node --version`)
- ✅ PostgreSQL v14+ installed and running
- ✅ npm or yarn package manager
- ✅ A code editor (VS Code recommended)

### Step 2: Database Setup

1. **Create Database**
```sql
-- Open PostgreSQL terminal (psql)
CREATE DATABASE the_pulse_db;
```

2. **Create Tables**
Run these SQL commands in your database:

```sql
-- Users table
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

-- Projects table
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

-- Project members table
CREATE TABLE project_members (
    member_id SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES projects(project_id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL DEFAULT 'member',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(project_id, user_id)
);

-- Tasks table
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

-- Task messages table
CREATE TABLE task_messages (
    message_id SERIAL PRIMARY KEY,
    task_id INTEGER NOT NULL REFERENCES tasks(task_id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_projects_created_by ON projects(created_by);
CREATE INDEX idx_project_members_project ON project_members(project_id);
CREATE INDEX idx_project_members_user ON project_members(user_id);
CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_tasks_created_by ON tasks(created_by);
CREATE INDEX idx_task_messages_task ON task_messages(task_id);
```

### Step 3: Backend Setup

1. **Navigate to server directory**
```bash
cd server
```

2. **Install dependencies**
```bash
npm install
```

3. **Create environment file**
```bash
cp .env.example .env
```

4. **Edit .env file** (use your favorite editor)
```bash
nano .env
# or
code .env
```

Update these values:
```env
PORT=5000
NODE_ENV=development

# YOUR DATABASE CREDENTIALS
DB_HOST=localhost
DB_PORT=5432
DB_NAME=the_pulse_db
DB_USER=your_postgres_username
DB_PASSWORD=your_postgres_password

# GENERATE A STRONG SECRET
JWT_SECRET=change_this_to_a_random_secret_key_min_32_chars
JWT_EXPIRES_IN=7d

CLIENT_URL=http://localhost:5173
```

5. **Start the backend server**
```bash
npm run dev
```

You should see:
```
╔═══════════════════════════════════════╗
║   🚀 THE PULSE SERVER IS RUNNING 🚀   ║
║   Port: 5000                          ║
╚═══════════════════════════════════════╝
✅ Database connected successfully
```

### Step 4: Frontend Setup

1. **Open a new terminal** and navigate to client directory
```bash
cd client
```

2. **Install dependencies**
```bash
npm install
```

3. **Create environment file**
```bash
cp .env.example .env
```

4. **Edit .env file** (usually no changes needed)
```env
VITE_API_URL=http://localhost:5000/api
```

5. **Start the frontend server**
```bash
npm run dev
```

You should see:
```
  VITE v5.0.8  ready in 314 ms

  ➜  Local:   http://localhost:5173/
  ➜  press h + enter to show help
```

### Step 5: Access the Application

1. Open your browser
2. Go to: `http://localhost:5173`
3. You should see the login page!

### Step 6: Create Your First Account

1. Click "Register here"
2. Fill in:
   - Username: `admin`
   - Full Name: `Admin User`
   - Email: `admin@thepulse.com`
   - Password: `password123`
   - Confirm Password: `password123`
3. Click "Register"
4. You'll be automatically logged in!

## 🎉 Congratulations!

You now have The Pulse running on your machine!

## Common Issues & Solutions

### Issue: "Database connection failed"
**Solution**: 
- Make sure PostgreSQL is running
- Check your database credentials in `.env`
- Verify database exists: `psql -l`

### Issue: "Port 5000 already in use"
**Solution**: 
- Change `PORT=5000` to `PORT=5001` in `server/.env`
- Update `VITE_API_URL` in `client/.env` to match

### Issue: "Cannot find module"
**Solution**: 
- Delete `node_modules` folder
- Delete `package-lock.json`
- Run `npm install` again

### Issue: "CORS error"
**Solution**: 
- Make sure `CLIENT_URL` in `server/.env` matches your frontend URL
- Usually `http://localhost:5173`

## Testing the System

### 1. Test Registration & Login
- ✅ Register a new user
- ✅ Log out
- ✅ Log in with the same credentials

### 2. Test Project Management
- ✅ Create a new project
- ✅ Edit the project
- ✅ Add a member (need another user)
- ✅ View project list

### 3. Test Task Management
- ✅ Create a task
- ✅ Edit the task
- ✅ Change task status
- ✅ Delete a task

### 4. Test Chat
- ✅ Send a message in a task
- ✅ View message history

## Next Steps

1. **Explore the UI** - Check out all the menu items
2. **Create projects** - Start organizing your work
3. **Invite team members** - Add other users to your projects
4. **Customize** - Modify colors, add features
5. **Deploy** - Consider deploying to production

## Need Help?

- Check the main README.md for more details
- Review the code documentation
- Check the API endpoints section
- Look at the troubleshooting guide

## Production Deployment

For production deployment:
1. Set `NODE_ENV=production`
2. Use strong JWT secrets (32+ characters)
3. Enable HTTPS
4. Use environment-specific database
5. Build frontend: `npm run build`
6. Use process manager (PM2)
7. Set up proper logging
8. Configure firewall
9. Regular backups

---

**Happy Coding! 🚀**
