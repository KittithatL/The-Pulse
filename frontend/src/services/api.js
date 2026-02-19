import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ✅ Interceptor: แนบ Token อัตโนมัติ
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Interceptor: ดักจับ Error 401 (Token หมดอายุ)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

// ✅ 1. Project API
export const projectAPI = {
  getProjects: () => api.get('/projects'),
  getProject: (id) => api.get(`/projects/${id}`),
  createProject: (data) => api.post('/projects', data),
  updateProject: (id, data) => api.put(`/projects/${id}`, data),
  deleteProject: (id) => api.delete(`/projects/${id}`),
  
  // Member Management
  getMembers: (id) => api.get(`/projects/${id}/members`),
  addMember: (id, data) => api.post(`/projects/${id}/members`, data),
  removeMember: (projectId, userId) => api.delete(`/projects/${projectId}/members/${userId}`),
};

// ✅ 2. Task API
export const taskAPI = {
  getTasks: (projectId, params) => api.get(`/projects/${projectId}/tasks`, { params }),
  createTask: (projectId, data) => api.post(`/projects/${projectId}/tasks`, data),
  updateTask: (id, data) => api.put(`/tasks/${id}`, data),
  deleteTask: (id) => api.delete(`/tasks/${id}`),
  updateTaskStatus: (id, status) => api.put(`/tasks/${id}`, { status }),
  getMyTasks: () => api.get('/myTasks'),

  // Messages
  getMessages: (taskId) => api.get(`/tasks/${taskId}/messages`),
  sendMessage: (taskId, message) => api.post(`/tasks/${taskId}/messages`, { message }),
  deleteMessage: (messageId) => api.delete(`/messages/${messageId}`),
};

// ✅ 3. Dashboard API (Sync กับ Backend ล่าสุด)
export const dashboardAPI = {
  // ดึงสถิติรายโปรเจกต์
  getOverview: (projectId) => api.get(`/dashboard/${projectId}/overview`),
  getInfrastructure: (projectId) => api.get(`/dashboard/${projectId}/infrastructure`),
  
  // ✅ แยก Path แจ้งเตือนรวมออกจากแจ้งเตือนรายโปรเจกต์
  getRisks: (projectId) => {
    if (projectId === 'all') {
      return api.get('/dashboard/notifications/all'); 
    }
    return api.get(`/dashboard/${projectId}/risks`); 
  },
  
  submitMood: (projectId, score) => api.post(`/dashboard/${projectId}/mood`, { sentiment_score: score }),
  
  // Resolve Risk (จัดการผ่าน Alert ID โดยตรง)
  resolveRisk: (alertId) => api.patch(`/dashboard/alerts/${alertId}/resolve`),

  // ✅ เพิ่มฟังก์ชัน Clear All Notifications
  clearAllNotifications: () => api.delete('/dashboard/notifications/clear-all'),

  // 🚀 Risk Sentinel (Strategic Analysis)
  getRiskSentinel: (projectId) => api.get(`/dashboard/${projectId}/risk-sentinel`),
};

// ✅ 4. Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getCurrentUser: () => api.get('/auth/me'),
};

export default api;