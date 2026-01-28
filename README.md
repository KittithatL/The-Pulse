# 🚀 The Pulse - Project Management System

A modern, full-stack project management system built with React, Node.js, Express, and PostgreSQL.

## 📋 Features

### Authentication
- ✅ User Registration with validation
- ✅ Login with JWT authentication
- ✅ Password hashing with bcrypt
- ✅ Protected routes

### Project Management
- ✅ Create/Edit/Delete Projects
- ✅ Project cards with detailed information
- ✅ Add/Remove project members
- ✅ Role-based access control (Owner/Admin/Member)
- ✅ Project search functionality

### Task Management
- ✅ Create/Edit/Delete Tasks
- ✅ Task assignment
- ✅ Task status tracking (Todo, In Progress, Review, Done)
- ✅ Priority levels (Low, Medium, High, Urgent)
- ✅ Definition of Ready (DoR) and Done (DoD)
- ✅ Task filtering by status and assignee

### Communication
- ✅ Task-level chat/messaging
- ✅ Real-time message support (ready for WebSocket)
- ✅ Message history

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **Validation**: express-validator
- **Security**: helmet, cors
- **Logging**: morgan

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM v6
- **HTTP Client**: Axios
- **Icons**: Lucide React
- **Notifications**: React Hot Toast
- **Date Handling**: date-fns

## 📦 Installation

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn

### 1. Clone the Repository
```bash
git clone <repository-url>
cd the-pulse-project
```

### 2. Database Setup
Create a PostgreSQL database and run the schema:
```sql
-- Your database schema here
-- (Refer to database documentation)
```

### 3. Backend Setup
```bash
cd server
npm install

# Create .env file
cp .env.example .env

# Edit .env with your database credentials
nano .env

# Start the server
npm run dev
```

### 4. Frontend Setup
```bash
cd client
npm install

# Create .env file
cp .env.example .env

# Start the development server
npm run dev
```

## 🚀 Running the Application

### Development Mode
1. Start the backend server:
```bash
cd server
npm run dev
```

2. Start the frontend:
```bash
cd client
npm run dev
```

3. Open your browser at `http://localhost:5173`

### Production Build
```bash
# Build frontend
cd client
npm run build

# Start backend in production
cd server
NODE_ENV=production npm start
```

## 📁 Project Structure

```
the-pulse-project/
├── server/
│   ├── config/
│   │   └── database.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── projectController.js
│   │   ├── taskController.js
│   │   └── messageController.js
│   ├── middleware/
│   │   ├── authenticate.js
│   │   └── projectAuth.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── projectRoutes.js
│   │   └── taskRoutes.js
│   ├── utils/
│   │   └── jwt.js
│   ├── index.js
│   ├── package.json
│   └── .env.example
│
└── client/
    ├── src/
    │   ├── components/
    │   │   ├── Layout.jsx
    │   │   ├── Sidebar.jsx
    │   │   ├── Navbar.jsx
    │   │   └── ProtectedRoute.jsx
    │   ├── context/
    │   │   └── AuthContext.jsx
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── Register.jsx
    │   │   └── Projects.jsx
    │   ├── services/
    │   │   └── api.js
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── index.html
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── postcss.config.js
    └── .env.example
```

## 🔐 Environment Variables

### Backend (.env)
```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=the_pulse_db
DB_USER=your_db_user
DB_PASSWORD=your_db_password

JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d

CLIENT_URL=http://localhost:5173
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
```

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)

### Projects
- `GET /api/projects` - Get all user's projects (protected)
- `POST /api/projects` - Create new project (protected)
- `GET /api/projects/:id` - Get project details (protected)
- `PUT /api/projects/:id` - Update project (protected, owner/admin)
- `DELETE /api/projects/:id` - Delete project (protected, owner/admin)

### Project Members
- `GET /api/projects/:id/members` - Get project members (protected)
- `POST /api/projects/:id/members` - Add member (protected, owner/admin)
- `DELETE /api/projects/:id/members/:userId` - Remove member (protected, owner/admin)

### Tasks
- `GET /api/projects/:projectId/tasks` - Get project tasks (protected)
- `POST /api/projects/:projectId/tasks` - Create task (protected)
- `GET /api/tasks/:id` - Get task details (protected)
- `PUT /api/tasks/:id` - Update task (protected)
- `DELETE /api/tasks/:id` - Delete task (protected)

### Task Messages
- `GET /api/tasks/:taskId/messages` - Get task messages (protected)
- `POST /api/tasks/:taskId/messages` - Send message (protected)
- `DELETE /api/messages/:messageId` - Delete message (protected)

## 🎨 Design Features

- Modern, clean UI with Tailwind CSS
- Dark sidebar with gradient accent colors
- Responsive design (mobile-friendly)
- Loading states and error handling
- Toast notifications for user feedback
- Smooth transitions and hover effects

## 🔒 Security Features

- Password hashing with bcrypt (10 rounds)
- JWT authentication
- Protected API routes
- Role-based access control
- Input validation
- CORS configuration
- Helmet security headers

## 🚧 Future Enhancements

- Real-time updates with WebSocket
- Task drag-and-drop (Kanban board)
- File attachments
- Email notifications
- Activity timeline
- Advanced search and filters
- Project templates
- Gantt charts
- Time tracking
- Reports and analytics

## 📄 License

MIT License

## 👥 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

For support, email support@thepulse.com or open an issue in the repository.

---

**Made with ❤️ by The Pulse Team**
