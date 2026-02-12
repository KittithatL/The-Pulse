# 🚀 Quick Start - The Pulse Frontend

Get the dashboard running in 3 minutes!

## Prerequisites ✅

```bash
node --version   # v18 or higher
npm --version    # v9 or higher
```

## Step 1: Install (30 seconds)

```bash
cd frontend
npm install
```

## Step 2: Configure (30 seconds)

```bash
# Create .env file
cp .env.example .env

# Default values:
# VITE_API_URL=http://localhost:5000/api
```

**Make sure backend is running on port 5000!**

## Step 3: Run (10 seconds)

```bash
npm run dev
```

Open browser: **http://localhost:5173**

---

## 🎯 Test the Dashboard

### 1. Login
- Navigate to `/login`
- Use credentials from backend registration
- Get redirected to projects

### 2. View Dashboard
- Click "DASHBOARD" in sidebar
- Or visit: `http://localhost:5173/dashboard`

### 3. Submit Team Mood
- Click on emoji (1-5 stars)
- See updated sentiment score
- Watch the animation!

---

## 📸 What You Should See

```
┌─────────────────────────────────────────┐
│  PHOENIX PROJECT          CAPACITY: 18% │
├─────────────────────────────────────────┤
│                                         │
│  [AI BRIEFING]                          │
│  Project is 78% complete...             │
│                                         │
│  [EFFICIENCY: 94.2%]    [TEAM MOOD]     │
│  Pipeline Velocity      😞😕😐😊😄      │
│                         Score: 2.8/5.0  │
│                                         │
│  [INFRASTRUCTURE]                       │
│  ✅ Systems Operational                 │
│                                         │
└─────────────────────────────────────────┘
```

---

## 🔌 Backend Integration

### API Endpoints Used
```
GET  /api/dashboard/1/overview    - Get dashboard data
POST /api/dashboard/1/mood        - Submit team mood
```

### Authentication
- JWT token stored in `localStorage`
- Auto-included in axios headers
- Token expires after 7 days

---

## 🎨 Features Checklist

After running, you should see:

✅ **Top Bar**
- Project name: "PHOENIX PROJECT"
- Learning capacity: 18%
- Due date: 2024-12-31

✅ **AI Briefing Card**
- Dark gradient background
- Project status summary
- Risk level indicator

✅ **Team Mood Widget**
- 5 emoji buttons (1-5 stars)
- Current sentiment score
- Interactive click animations

✅ **Efficiency Card**
- Percentage display
- Pipeline velocity bar
- Tasks per week metric

✅ **Infrastructure Health**
- Green status indicator
- System operational message
- Latency display
- Console button

✅ **Bottom Stats**
- Completion percentage
- Risk level
- Efficiency
- Velocity

✅ **Cycle Progress**
- Cycle 45
- Progress bar
- Percentage display

---

## 🛠️ Troubleshooting

### "Cannot GET /api/dashboard/1/overview"
**Solution**: Backend not running
```bash
cd ../backend
npm run dev
```

### "Network Error"
**Solution**: Check VITE_API_URL in .env
```bash
# Should be:
VITE_API_URL=http://localhost:5000/api
```

### "401 Unauthorized"
**Solution**: Token expired or not logged in
1. Go to `/login`
2. Login again
3. Try dashboard

### Port 5173 already in use
**Solution**: Kill process or use different port
```bash
# Kill process
lsof -i :5173
kill -9 <PID>

# Or use different port
npm run dev -- --port 3000
```

### Blank screen / White screen
**Solution**: Check console for errors
1. Open DevTools (F12)
2. Check Console tab
3. Look for error messages
4. Usually missing dependencies:
```bash
npm install
```

---

## 📱 Mobile Testing

### View on mobile
1. Find your local IP:
```bash
# Mac/Linux
ifconfig | grep "inet "

# Windows
ipconfig
```

2. Update vite.config.js (already done):
```javascript
server: {
  host: '0.0.0.0',
  port: 5173
}
```

3. Access from phone:
```
http://YOUR_IP:5173
```

---

## 🎯 Next Steps

### 1. Customize Colors
Edit `tailwind.config.js`:
```javascript
theme: {
  extend: {
    colors: {
      primary: '#YOUR_COLOR'
    }
  }
}
```

### 2. Add More Features
- Real-time updates
- Additional widgets
- Dark mode
- Notifications

### 3. Deploy
```bash
npm run build
# Upload dist/ to your hosting
```

---

## 📊 Performance Tips

### Development
- Use React DevTools
- Check Network tab
- Monitor API calls

### Production
```bash
# Build optimized version
npm run build

# Analyze bundle size
npm run build -- --analyze
```

---

## 🎨 Design Notes

### Matching Original Design
The dashboard closely matches your design with:
- ✅ Gradient purple/dark cards
- ✅ Red accent color (#EF4444)
- ✅ Rounded corners (3xl = 24px)
- ✅ Emoji mood selector
- ✅ Bold italic headings
- ✅ Smooth animations
- ✅ Responsive layout

### Responsive Breakpoints
- **Mobile**: < 768px (stacked cards)
- **Tablet**: 768px - 1024px (2 columns)
- **Desktop**: > 1024px (3 columns)

---

## 🚀 Production Deployment

### Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

### Netlify
```bash
npm run build
# Drag dist/ folder to Netlify
```

### Environment Variables
Don't forget to set:
```
VITE_API_URL=https://your-api-domain.com/api
```

---

## 📞 Need Help?

### Quick Checks
1. ✅ Backend running? → `curl http://localhost:5000/health`
2. ✅ Logged in? → Check localStorage.token
3. ✅ .env correct? → `cat .env`
4. ✅ Dependencies installed? → `ls node_modules`

### Common Issues
- **CORS**: Backend CORS settings
- **Token**: Re-login if expired
- **API URL**: Check .env file
- **Port**: Change if 5173 in use

---

## 🎉 You're Ready!

Dashboard should be running at:
**http://localhost:5173/dashboard**

Enjoy! 🚀

---

**Quick Commands Reference:**

```bash
npm install          # Install dependencies
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
```

**For full documentation, see README.md**
