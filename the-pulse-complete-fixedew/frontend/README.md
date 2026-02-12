# 🎨 The Pulse - Frontend Dashboard

Modern, responsive React dashboard for The Pulse project management platform.

![React](https://img.shields.io/badge/React-18.x-blue)
![Vite](https://img.shields.io/badge/Vite-5.x-purple)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.x-cyan)

## 🌟 Features

### Dashboard
- ✅ **AI-Powered Briefing** - Real-time project status summary
- ✅ **Team Mood Tracker** - Interactive 5-star sentiment system
- ✅ **Efficiency Metrics** - Visual performance indicators
- ✅ **Pipeline Velocity** - Task completion rate tracking
- ✅ **Infrastructure Health** - System status monitoring
- ✅ **Learning Capacity** - Project progress indicator
- ✅ **Cycle Progress** - Sprint/cycle tracking

### Design Features
- 🎨 Modern gradient cards
- 📱 Fully responsive layout
- ⚡ Smooth animations & transitions
- 🌙 Dark/Light mode support (coming soon)
- 🎯 Intuitive UI/UX matching design specs

## 📦 Installation

### Prerequisites
- Node.js v18+
- npm v9+
- Backend API running on port 5000

### Quick Start

```bash
# 1. Navigate to frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Setup environment
cp .env.example .env

# 4. Start development server
npm run dev
```

Server will start on `http://localhost:5173`

## ⚙️ Configuration

### Environment Variables (.env)

```env
VITE_API_URL=http://localhost:5000/api
```

For production:
```env
VITE_API_URL=https://your-api-domain.com/api
```

## 🎯 Usage

### Login Flow
1. Navigate to `/login`
2. Enter credentials
3. Get JWT token (stored in localStorage)
4. Access dashboard at `/dashboard`

### Dashboard Features

#### 1. AI Briefing
- Auto-generated project status
- Risk level indicator
- Completion percentage

#### 2. Team Mood
- Click emoji (1-5 stars) to submit mood
- View team sentiment score
- Based on last 7 days of responses

#### 3. Efficiency Card
- Shows completion rate
- Pipeline velocity bar
- Tasks per week metric

#### 4. Infrastructure Health
- System status indicator
- Latency monitoring
- Quick access to cloud console

## 📂 Project Structure

```
frontend/
├── src/
│   ├── assets/           # Images, icons
│   ├── components/       # Reusable components
│   │   ├── Layout.jsx
│   │   ├── Navbar.jsx
│   │   └── Sidebar.jsx
│   ├── context/          # React context
│   │   └── AuthContext.jsx
│   ├── pages/            # Page components
│   │   ├── Dashboard.jsx     ⭐ NEW - Main dashboard
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── Projects.jsx
│   │   └── ProjectTask.jsx
│   ├── services/         # API services
│   │   └── api.js
│   ├── App.jsx          # Main app component
│   ├── main.jsx         # Entry point
│   └── index.css        # Global styles
├── public/              # Static assets
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
└── README.md
```

## 🎨 Design System

### Colors
- **Primary Red**: `#EF4444` - Main brand color
- **Dark Gray**: `#1E293B` - Backgrounds
- **Purple Accent**: `#7C3AED` - Gradients
- **Green Success**: `#10B981` - Infrastructure healthy
- **Yellow Warning**: `#F59E0B` - Medium alerts
- **Orange High**: `#F97316` - High risks

### Typography
- **Headings**: Bold, Italic, Uppercase
- **Body**: Inter, Sans-serif
- **Tracking**: Wide for labels

### Components
- **Cards**: Rounded-3xl (24px)
- **Buttons**: Rounded-xl (12px)
- **Shadows**: Soft drop shadows
- **Transitions**: 200-500ms smooth

## 🔌 API Integration

### Dashboard Endpoint
```javascript
GET /api/dashboard/:projectId/overview

Response:
{
  "success": true,
  "data": {
    "project": { "id": 1, "name": "Phoenix Project" },
    "ai_briefing": "...",
    "risk_level": "high",
    "completion": { "percentage": 78 },
    "team_mood": { "score": 2.8 },
    "efficiency": { "percentage": 94.2 },
    "pipeline_velocity": { "tasks_per_week": 12.5 }
  }
}
```

### Team Mood Submission
```javascript
POST /api/dashboard/:projectId/mood
{
  "sentiment_score": 4,
  "comment": "Great progress!"
}
```

## 🧪 Development

### Run Development Server
```bash
npm run dev
```

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

### Lint Code
```bash
npm run lint
```

## 📱 Responsive Breakpoints

```css
/* Mobile */
@media (min-width: 640px) { /* sm */ }

/* Tablet */
@media (min-width: 768px) { /* md */ }

/* Desktop */
@media (min-width: 1024px) { /* lg */ }

/* Large Desktop */
@media (min-width: 1280px) { /* xl */ }
```

## 🎭 Component Examples

### Using Dashboard Component
```jsx
import Dashboard from './pages/Dashboard';

// In your router
<Route path="/dashboard" element={<Dashboard />} />
<Route path="/projects/:projectId/dashboard" element={<Dashboard />} />
```

### Mood Submission
```jsx
const submitMood = async (score) => {
  await axios.post(
    `${API_URL}/dashboard/1/mood`,
    { sentiment_score: score },
    { headers: { Authorization: `Bearer ${token}` } }
  );
};
```

## 🚀 Deployment

### Build Process
```bash
# Install dependencies
npm install

# Build for production
npm run build

# Output in dist/ folder
```

### Deploy to Vercel
```bash
npm install -g vercel
vercel
```

### Deploy to Netlify
```bash
npm run build
# Upload dist/ folder to Netlify
```

### Environment Variables for Production
```
VITE_API_URL=https://api.yourdomain.com/api
```

## 🔧 Troubleshooting

### API Connection Issues
```bash
# Check if backend is running
curl http://localhost:5000/health

# Check VITE_API_URL in .env
cat .env
```

### Build Errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules
npm install

# Clear Vite cache
rm -rf node_modules/.vite
npm run dev
```

### CORS Errors
- Ensure backend has correct CORS settings
- Check CLIENT_URL in backend .env
- Verify API_URL in frontend .env

## 📊 Performance

### Optimization Tips
- Use React.memo for expensive components
- Implement lazy loading for routes
- Optimize images (WebP format)
- Enable code splitting
- Use production build for deployment

### Lighthouse Scores (Target)
- Performance: 90+
- Accessibility: 95+
- Best Practices: 90+
- SEO: 85+

## 🎨 Customization

### Changing Colors
Edit `tailwind.config.js`:
```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '#EF4444',
        secondary: '#7C3AED',
        // Add your colors
      }
    }
  }
}
```

### Adding New Pages
1. Create page in `src/pages/`
2. Add route in `App.jsx`
3. Add navigation in `Sidebar.jsx`

## 🔐 Security

### Best Practices
- ✅ JWT tokens in localStorage (not cookies)
- ✅ Token expiration handling
- ✅ Protected routes
- ✅ Input sanitization
- ✅ HTTPS in production

### Token Management
```javascript
// Store token
localStorage.setItem('token', token);

// Get token
const token = localStorage.getItem('token');

// Remove token (logout)
localStorage.removeItem('token');
```

## 📚 Dependencies

### Main Dependencies
```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "react-router-dom": "^6.x",
  "axios": "^1.x",
  "react-hot-toast": "^2.x"
}
```

### Dev Dependencies
```json
{
  "vite": "^5.x",
  "tailwindcss": "^3.x",
  "@vitejs/plugin-react": "^4.x"
}
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📝 TODO

- [ ] Add dark mode toggle
- [ ] Implement real-time updates (WebSocket)
- [ ] Add more dashboard widgets
- [ ] Create mobile app (React Native)
- [ ] Add data export features
- [ ] Implement offline mode
- [ ] Add keyboard shortcuts
- [ ] Create onboarding tutorial

## 🐛 Known Issues

1. **Mood submission delay**: Adding artificial delay for better UX
2. **Large datasets**: Consider pagination for 1000+ items
3. **Safari compatibility**: Some CSS features need prefixes

## 📞 Support

- **Email**: support@thepulse.app
- **Documentation**: See API_DOCUMENTATION.md in backend
- **Issues**: GitHub Issues

## 📄 License

MIT License - see LICENSE file

## 🙏 Acknowledgments

- Design inspiration from modern PM tools
- TailwindCSS for utility classes
- React team for amazing framework
- Vite for blazing fast builds

---

**Built with ❤️ by The Pulse Team**

Last Updated: February 2025
Version: 1.0.0
