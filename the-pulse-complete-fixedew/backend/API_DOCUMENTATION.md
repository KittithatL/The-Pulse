# The Pulse - Dashboard API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
All dashboard endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## 📊 Dashboard Endpoints

### 1. Get Dashboard Overview
Get complete dashboard data including AI briefing, metrics, and project status.

**Endpoint:** `GET /dashboard/:projectId/overview`

**Response:**
```json
{
  "success": true,
  "data": {
    "project": {
      "id": 1,
      "name": "Phoenix Project"
    },
    "ai_briefing": "The Phoenix Project is 78% complete in modernizing our core microservices infrastructure under my direction as PM. However, the low team mood of 2.9/5.0 presents significant risks to project velocity and successful delivery that require immediate attention.",
    "risk_level": "high",
    "completion": {
      "percentage": 78.0,
      "completed_tasks": 156,
      "total_tasks": 200
    },
    "team_mood": {
      "score": 2.9,
      "max_score": 5.0,
      "total_responses": 25
    },
    "efficiency": {
      "percentage": 94.2
    },
    "pipeline_velocity": {
      "tasks_per_week": 12.5
    },
    "learning_capacity": {
      "percentage": 18,
      "due_date": "2024-12-31"
    }
  }
}
```

---

## 😊 Team Mood Endpoints

### 2. Submit Team Mood
Allow team members to submit their mood/sentiment.

**Endpoint:** `POST /dashboard/:projectId/mood`

**Request Body:**
```json
{
  "sentiment_score": 4,
  "comment": "Great progress this week!"
}
```

**Validation:**
- `sentiment_score`: Required, must be 1-5
- `comment`: Optional

**Response:**
```json
{
  "success": true,
  "message": "Mood submitted successfully",
  "data": {
    "id": 123,
    "sentiment_score": 4,
    "comment": "Great progress this week!",
    "created_at": "2024-12-15T10:30:00Z"
  }
}
```

### 3. Get Team Mood History
Get mood trends over time.

**Endpoint:** `GET /dashboard/:projectId/mood/history?days=30`

**Query Parameters:**
- `days` (optional, default: 30): Number of days of history

**Response:**
```json
{
  "success": true,
  "data": {
    "history": [
      {
        "date": "2024-12-15",
        "avg_score": 3.8,
        "responses": 12
      },
      {
        "date": "2024-12-14",
        "avg_score": 3.5,
        "responses": 10
      }
    ]
  }
}
```

---

## 🏗️ Infrastructure Health Endpoints

### 4. Get Infrastructure Health
Get status of all system components.

**Endpoint:** `GET /dashboard/:projectId/infrastructure`

**Response:**
```json
{
  "success": true,
  "data": {
    "components": [
      {
        "component_name": "API Gateway",
        "status": "operational",
        "last_check": "2024-12-15T10:25:00Z",
        "uptime_percentage": 99.9,
        "response_time_ms": 45
      },
      {
        "component_name": "Database Cluster",
        "status": "operational",
        "last_check": "2024-12-15T10:25:00Z",
        "uptime_percentage": 99.99,
        "response_time_ms": 12
      }
    ],
    "overall_status": "operational"
  }
}
```

**Status Values:**
- `operational`: All systems normal
- `degraded`: Some issues detected
- `down`: Critical failure

### 5. Update Infrastructure Status
Admin endpoint to update component health status.

**Endpoint:** `PUT /dashboard/:projectId/infrastructure`

**Required Role:** Admin

**Request Body:**
```json
{
  "component_name": "API Gateway",
  "status": "operational",
  "response_time_ms": 45
}
```

**Response:**
```json
{
  "success": true,
  "message": "Infrastructure status updated",
  "data": {
    "id": 1,
    "component_name": "API Gateway",
    "status": "operational",
    "uptime_percentage": 99.9,
    "response_time_ms": 45,
    "last_check": "2024-12-15T10:30:00Z"
  }
}
```

---

## ⚠️ Risk Sentinel Endpoints

### 6. Get Risk Alerts
Get all active risk alerts for the project.

**Endpoint:** `GET /dashboard/:projectId/risks`

**Response:**
```json
{
  "success": true,
  "data": {
    "alerts": [
      {
        "id": 1,
        "risk_type": "mood",
        "severity": "high",
        "title": "Low Team Morale Detected",
        "description": "Team sentiment has dropped to 2.5/5.0. Immediate attention recommended.",
        "detected_at": "2024-12-15T09:00:00Z",
        "resolved_at": null
      },
      {
        "id": 2,
        "risk_type": "velocity",
        "severity": "medium",
        "title": "Decreased Sprint Velocity",
        "description": "Velocity has dropped 25% compared to previous sprint.",
        "detected_at": "2024-12-14T15:30:00Z",
        "resolved_at": null
      }
    ],
    "critical_count": 0,
    "high_count": 1
  }
}
```

**Risk Types:**
- `velocity`: Project speed issues
- `mood`: Team morale issues
- `quality`: Code quality concerns
- `deadline`: Timeline risks
- `resource`: Resource allocation issues

**Severity Levels:**
- `critical`: Immediate action required
- `high`: Requires attention soon
- `medium`: Monitor closely
- `low`: Informational

### 7. Create Risk Alert
Create a new risk alert (Admin or system).

**Endpoint:** `POST /dashboard/:projectId/risks`

**Request Body:**
```json
{
  "risk_type": "deadline",
  "severity": "high",
  "title": "Milestone at Risk",
  "description": "Q4 deadline may not be met based on current velocity"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Risk alert created",
  "data": {
    "id": 3,
    "risk_type": "deadline",
    "severity": "high",
    "title": "Milestone at Risk",
    "description": "Q4 deadline may not be met based on current velocity",
    "detected_at": "2024-12-15T10:35:00Z"
  }
}
```

### 8. Resolve Risk Alert
Mark a risk alert as resolved.

**Endpoint:** `PUT /dashboard/:projectId/risks/:alertId/resolve`

**Request Body:**
```json
{
  "resolution_notes": "Team meeting held, action items assigned. Monitoring improvements."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Risk alert resolved",
  "data": {
    "id": 1,
    "resolved_at": "2024-12-15T11:00:00Z",
    "resolved_by": 5,
    "resolution_notes": "Team meeting held, action items assigned. Monitoring improvements."
  }
}
```

---

## 🔄 Project Cycle Endpoints

### 9. Get Current Project Cycle
Get information about the current sprint/cycle.

**Endpoint:** `GET /dashboard/:projectId/cycle`

**Response:**
```json
{
  "success": true,
  "data": {
    "cycle_number": 45,
    "start_date": "2024-12-01",
    "end_date": "2024-12-31",
    "completion_percentage": 78,
    "days_remaining": 16
  }
}
```

---

## 🚨 Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Sentiment score must be between 1 and 5"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Access denied to this project"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Risk alert not found or already resolved"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Failed to fetch dashboard data",
  "error": "Database connection error"
}
```

---

## 📝 Usage Examples

### JavaScript/Fetch
```javascript
// Get dashboard overview
const response = await fetch('http://localhost:5000/api/dashboard/1/overview', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
const data = await response.json();

// Submit team mood
const moodResponse = await fetch('http://localhost:5000/api/dashboard/1/mood', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    sentiment_score: 4,
    comment: 'Great progress today!'
  })
});
```

### cURL Examples
```bash
# Get dashboard overview
curl -X GET http://localhost:5000/api/dashboard/1/overview \
  -H "Authorization: Bearer YOUR_TOKEN"

# Submit mood
curl -X POST http://localhost:5000/api/dashboard/1/mood \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"sentiment_score": 4, "comment": "Productive day!"}'

# Get infrastructure health
curl -X GET http://localhost:5000/api/dashboard/1/infrastructure \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create risk alert
curl -X POST http://localhost:5000/api/dashboard/1/risks \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "risk_type": "velocity",
    "severity": "medium",
    "title": "Sprint velocity decreased",
    "description": "Need to identify blockers"
  }'
```

---

## 🔐 Authentication Flow

1. **Register:** `POST /api/auth/register`
2. **Login:** `POST /api/auth/login` → Get JWT token
3. **Use Token:** Include in all dashboard requests
4. **Token Expiry:** Tokens expire after 7 days (default)

---

## 📊 Data Flow

```
User Request → JWT Validation → Project Access Check → Database Query → Response
```

### Access Control
- **All Users:** Can view dashboard, submit mood, view risks
- **Admins Only:** Update infrastructure, create/resolve risk alerts
- **System Automated:** Auto-generate AI briefings, detect risks

---

## 🎯 Best Practices

1. **Polling Intervals:**
   - Dashboard overview: Every 30-60 seconds
   - Infrastructure health: Every 15-30 seconds
   - Risk alerts: Every 60 seconds
   - Team mood: On demand only

2. **Error Handling:**
   - Always check `success` field in response
   - Handle 403 errors by checking user permissions
   - Implement retry logic for 500 errors

3. **Performance:**
   - Cache dashboard data on client side
   - Use WebSockets for real-time updates (future enhancement)
   - Batch multiple mood submissions if needed

4. **Security:**
   - Never expose JWT tokens in URLs
   - Validate all user input on client side
   - Use HTTPS in production

---

## 📈 Analytics & Metrics

### Key Performance Indicators (KPIs)

1. **Project Completion:** % of tasks completed
2. **Team Mood:** Average sentiment score (1-5)
3. **Efficiency:** % of tasks completed on time
4. **Pipeline Velocity:** Tasks completed per week
5. **Infrastructure Health:** % uptime of components

### Risk Scoring Algorithm

```javascript
function calculateRiskLevel(completion, mood, efficiency) {
  if (completion >= 70 && mood >= 3.5 && efficiency >= 90) return 'low';
  if (completion >= 50 && mood >= 3.0 && efficiency >= 80) return 'medium';
  if (mood < 2.5 || efficiency < 70) return 'critical';
  return 'high';
}
```

---

## 🚀 Future Enhancements

- [ ] WebSocket support for real-time updates
- [ ] Advanced AI-powered risk prediction
- [ ] Team performance analytics
- [ ] Budget tracking integration
- [ ] Automated report generation
- [ ] Custom dashboard widgets
- [ ] Export data to CSV/PDF

---

## 📞 Support

For API issues or questions:
- Email: support@thepulse.app
- Documentation: https://docs.thepulse.app
- GitHub: https://github.com/thepulse/api

---

**Version:** 1.0.0  
**Last Updated:** December 2024
