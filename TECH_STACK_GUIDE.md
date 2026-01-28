# 🛠️ The Pulse - Complete Tech Stack Guide

## 📦 Technology Stack Overview

### Frontend Stack
```
React 18.2.0         → UI Library
Vite 5.0.8           → Build Tool & Dev Server
Tailwind CSS 3.4.0   → Utility-first CSS Framework
React Router 6.21.0  → Client-side Routing
Axios 1.6.2          → HTTP Client
Lucide React         → Icon Library
React Hot Toast      → Notifications
```

### Backend Stack
```
Node.js 18+          → Runtime Environment
Express 4.18.2       → Web Framework
PostgreSQL 14+       → Database
JWT                  → Authentication
bcryptjs             → Password Hashing
```

## 🎯 Why This Stack?

### React + Vite
✅ **Ultra-fast** development experience  
✅ **Hot Module Replacement** (HMR)  
✅ **Optimized builds** with code splitting  
✅ **Modern JavaScript** support (ES6+)  
✅ **Easy configuration**

### Tailwind CSS
✅ **Utility-first** approach  
✅ **Responsive design** made easy  
✅ **Small bundle size** (purges unused CSS)  
✅ **Customizable** design system  
✅ **Fast development**

### Node + Express
✅ **JavaScript everywhere** (frontend & backend)  
✅ **Large ecosystem** (npm packages)  
✅ **RESTful API** easy to build  
✅ **Middleware support**  
✅ **Scalable architecture**

---

## 📋 Complete Installation Steps

### Prerequisites Installation

#### 1. Install Node.js (if not installed)
```bash
# Check if Node.js is installed
node --version  # Should be 18+

# If not installed:
# Visit: https://nodejs.org/
# Download LTS version and install
```

#### 2. Install PostgreSQL (if not installed)
```bash
# Check if PostgreSQL is installed
psql --version  # Should be 14+

# If not installed:
# Visit: https://postgresql.org/download/
# Follow installation guide for your OS
```

---

## 🚀 Project Setup

### Step 1: Extract Project
```bash
# Extract the ZIP file
unzip the-pulse-project.zip
cd the-pulse-project
```

### Step 2: Database Setup
```bash
# Start PostgreSQL service
# Linux/Mac:
sudo service postgresql start

# Windows:
# PostgreSQL should start automatically

# Create database
psql -U postgres
CREATE DATABASE the_pulse_db;
\q

# Run schema (see INSTALLATION.md for SQL)
```

### Step 3: Backend Setup (Node + Express)
```bash
# Navigate to server directory
cd server

# Install all dependencies
npm install

# This installs:
# - express (web framework)
# - pg (PostgreSQL client)
# - bcryptjs (password hashing)
# - jsonwebtoken (JWT auth)
# - cors (CORS middleware)
# - helmet (security headers)
# - morgan (logging)
# - compression (response compression)
# - dotenv (environment variables)

# Copy environment file
cp .env.example .env

# Edit .env file with your settings
nano .env
# or
code .env
```

**Configure .env:**
```env
PORT=5000
NODE_ENV=development

# Your PostgreSQL credentials
DB_HOST=localhost
DB_PORT=5432
DB_NAME=the_pulse_db
DB_USER=postgres
DB_PASSWORD=your_password

# Generate random string (32+ chars)
JWT_SECRET=your_super_secret_key_at_least_32_characters_long
JWT_EXPIRES_IN=7d

CLIENT_URL=http://localhost:5173
```

```bash
# Start development server
npm run dev

# You should see:
# ╔═══════════════════════════════════════╗
# ║   🚀 THE PULSE SERVER IS RUNNING 🚀   ║
# ║   Port: 5000                          ║
# ╚═══════════════════════════════════════╝
# ✅ Database connected successfully
```

### Step 4: Frontend Setup (React + Vite + Tailwind)
```bash
# Open NEW terminal
# Navigate to client directory
cd client

# Install all dependencies
npm install

# This installs:
# - react & react-dom (UI library)
# - vite (build tool)
# - tailwindcss (CSS framework)
# - postcss & autoprefixer (CSS processing)
# - react-router-dom (routing)
# - axios (HTTP client)
# - lucide-react (icons)
# - react-hot-toast (notifications)
# - date-fns (date formatting)

# Copy environment file
cp .env.example .env

# Usually no changes needed
cat .env
# VITE_API_URL=http://localhost:5000/api

# Start development server
npm run dev

# You should see:
# VITE v5.0.8  ready in 314 ms
# ➜  Local:   http://localhost:5173/
# ➜  press h + enter to show help
```

### Step 5: Open Application
```bash
# Open your browser at:
http://localhost:5173

# You should see The Pulse login page! 🎉
```

---

## 🎨 Tailwind CSS Configuration

### Files Created
```
client/
├── tailwind.config.js     ← Tailwind configuration
├── postcss.config.js      ← PostCSS configuration
└── src/
    └── index.css          ← Tailwind directives
```

### Tailwind Config (`tailwind.config.js`)
```javascript
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",  // Scans all React files
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#EF4444',  // Red
          dark: '#DC2626',
          light: '#F87171',
        },
        dark: {
          DEFAULT: '#1E293B',  // Navy
          light: '#334155',
          lighter: '#475569',
        },
      },
    },
  },
  plugins: [],
}
```

### Using Tailwind in Components
```jsx
// Example component with Tailwind classes
<button className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-lg">
  Click Me
</button>
```

---

## ⚡ Vite Configuration

### Vite Config (`vite.config.js`)
```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,        // Dev server port
    host: true,        // Listen on all addresses
  },
});
```

### Vite Features Used
- ✅ Hot Module Replacement (HMR)
- ✅ Fast refresh for React components
- ✅ Optimized builds
- ✅ Environment variables (import.meta.env)
- ✅ CSS pre-processing (PostCSS)

---

## 🔧 Development Workflow

### Starting Development
```bash
# Terminal 1: Backend
cd server
npm run dev

# Terminal 2: Frontend
cd client
npm run dev
```

### Making Changes

#### Frontend Changes (React)
1. Edit any `.jsx` file in `client/src/`
2. Save the file
3. **Vite automatically reloads** the browser! ⚡

#### Backend Changes (Express)
1. Edit any `.js` file in `server/`
2. Save the file
3. **Nodemon automatically restarts** the server! 🔄

#### Styling with Tailwind
1. Add Tailwind classes to your JSX
2. No need to write custom CSS!
3. Example:
```jsx
<div className="flex items-center gap-4 p-6 bg-white rounded-lg shadow-lg">
  <h1 className="text-2xl font-bold text-gray-800">Hello World</h1>
</div>
```

---

## 📦 Package.json Scripts

### Backend (`server/package.json`)
```json
{
  "scripts": {
    "start": "node index.js",        // Production
    "dev": "nodemon index.js"        // Development with auto-reload
  }
}
```

### Frontend (`client/package.json`)
```json
{
  "scripts": {
    "dev": "vite",                    // Start dev server
    "build": "vite build",            // Build for production
    "preview": "vite preview"         // Preview production build
  }
}
```

---

## 🏗️ Project Structure

```
the-pulse-project/
│
├── 📁 server/              ← Node.js + Express Backend
│   ├── config/             ← Database configuration
│   ├── controllers/        ← Business logic
│   ├── middleware/         ← Auth & validation
│   ├── routes/             ← API endpoints
│   ├── utils/              ← Helper functions
│   ├── index.js            ← Express server
│   ├── package.json        ← Backend dependencies
│   └── .env                ← Environment variables
│
└── 📁 client/              ← React + Vite + Tailwind Frontend
    ├── src/
    │   ├── components/     ← React components
    │   ├── pages/          ← Page components
    │   ├── context/        ← React Context
    │   ├── services/       ← API calls (Axios)
    │   ├── App.jsx         ← Main app + routing
    │   ├── main.jsx        ← React entry point
    │   └── index.css       ← Tailwind directives
    ├── index.html          ← HTML template
    ├── vite.config.js      ← Vite configuration
    ├── tailwind.config.js  ← Tailwind configuration
    ├── postcss.config.js   ← PostCSS configuration
    └── package.json        ← Frontend dependencies
```

---

## 🚀 Building for Production

### Frontend Build
```bash
cd client
npm run build

# Output: client/dist/
# - Optimized bundle
# - Minified code
# - Tree-shaken dependencies
# - Purged CSS (only used Tailwind classes)
```

### Backend Production
```bash
cd server
NODE_ENV=production npm start
```

### Deployment
```bash
# Option 1: Deploy to Vercel (Frontend)
# Install Vercel CLI
npm i -g vercel
cd client
vercel

# Option 2: Deploy to Heroku (Full Stack)
# Add to Heroku
heroku create the-pulse-app
git push heroku main

# Option 3: Deploy to DigitalOcean, AWS, etc.
# Use PM2 for process management
npm i -g pm2
pm2 start server/index.js --name "the-pulse"
```

---

## 🎯 Key Features Implementation

### React Components
```jsx
// Functional components with hooks
import { useState, useEffect } from 'react';

function MyComponent() {
  const [data, setData] = useState([]);
  
  useEffect(() => {
    fetchData();
  }, []);
  
  return (
    <div className="p-6">
      {/* Tailwind classes! */}
    </div>
  );
}
```

### React Router
```jsx
// App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';

<BrowserRouter>
  <Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/projects" element={<Projects />} />
  </Routes>
</BrowserRouter>
```

### Axios API Calls
```javascript
// services/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

export const projectAPI = {
  getProjects: () => api.get('/projects'),
  createProject: (data) => api.post('/projects', data),
};
```

### Express Routes
```javascript
// server/routes/projectRoutes.js
const express = require('express');
const router = express.Router();

router.get('/', authenticate, getProjects);
router.post('/', authenticate, createProject);

module.exports = router;
```

---

## 💡 Tips & Best Practices

### Tailwind Tips
1. Use `@apply` for reusable styles
2. Configure custom colors in `tailwind.config.js`
3. Use responsive prefixes: `sm:`, `md:`, `lg:`
4. Dark mode: add `dark:` prefix

### Vite Tips
1. Environment variables start with `VITE_`
2. Import assets: `import logo from './logo.png'`
3. Use `import.meta.env.PROD` for production checks
4. Code splitting: `const Module = lazy(() => import('./Module'))`

### Express Tips
1. Use middleware for common operations
2. Centralize error handling
3. Validate inputs
4. Use async/await for cleaner code

### React Tips
1. Use functional components
2. Manage state with hooks
3. Split large components
4. Use Context for global state

---

## 🔍 Debugging

### Frontend Debugging
```bash
# Check Vite dev server
http://localhost:5173

# Open browser DevTools (F12)
# Console tab: See errors
# Network tab: See API calls
```

### Backend Debugging
```bash
# Check Express server
http://localhost:5000/health

# Check logs in terminal
# Use console.log() for debugging
```

### Common Issues

**Tailwind not working?**
```bash
# Make sure PostCSS is installed
npm install -D tailwindcss postcss autoprefixer
# Restart Vite dev server
```

**Vite build errors?**
```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build
```

**Express CORS errors?**
```javascript
// Make sure CORS is configured
app.use(cors({
  origin: 'http://localhost:5173'
}));
```

---

## 📚 Learning Resources

### React
- Docs: https://react.dev
- Tutorial: https://react.dev/learn

### Vite
- Docs: https://vitejs.dev
- Guide: https://vitejs.dev/guide/

### Tailwind CSS
- Docs: https://tailwindcss.com/docs
- Playground: https://play.tailwindcss.com

### Express
- Docs: https://expressjs.com
- Guide: https://expressjs.com/en/guide/routing.html

---

## ✅ Tech Stack Verification

Run these commands to verify everything:

```bash
# Check Node.js
node --version          # v18+

# Check npm
npm --version           # v9+

# Check PostgreSQL
psql --version          # 14+

# Backend packages
cd server
npm list express        # 4.18.2
npm list pg             # 8.11.3

# Frontend packages
cd client
npm list react          # 18.2.0
npm list vite           # 5.0.8
npm list tailwindcss    # 3.4.0
```

---

**Stack Summary:**
- ✅ React 18 (UI)
- ✅ Vite 5 (Build Tool)
- ✅ Tailwind CSS 3 (Styling)
- ✅ Node.js 18+ (Runtime)
- ✅ Express 4 (Backend)
- ✅ PostgreSQL 14+ (Database)

**Ready to use! 🚀**
