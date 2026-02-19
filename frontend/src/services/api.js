import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // withCredentials: true, // เปิดถ้าจะใช้ Cookie ในอนาคต
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
      // เคลียร์ข้อมูลและ Redirect ไปหน้า Login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // window.location.href = '/login'; // แนะนำให้ handle ใน React Context ดีกว่าการ Hard reload
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
  addMember: (id, data) => api.post(`/projects/${id}/members`, data), // data = { emailOrUsername, role }
  removeMember: (projectId, userId) => api.delete(`/projects/${projectId}/members/${userId}`),
};

// ✅ 2. Task API
export const taskAPI = {
  // Project Tasks
  getTasks: (projectId, params) => api.get(`/projects/${projectId}/tasks`, { params }), // params = { status }
  createTask: (projectId, data) => api.post(`/projects/${projectId}/tasks`, data),
  
  // Single Task Operations
  updateTask: (id, data) => api.put(`/tasks/${id}`, data), // ใช้สำหรับแก้ Status ได้ด้วย
  deleteTask: (id) => api.delete(`/tasks/${id}`),
  
  // Quick Update Status (ใช้ Endpoint เดียวกับ updateTask แต่ส่งแค่ status)
  updateTaskStatus: (id, status) => api.put(`/tasks/${id}`, { status }),
  
  // My Tasks (ถ้ามี route นี้ใน backend)
  getMyTasks: () => api.get('/myTasks'),

  // Chat / Messages
  getMessages: (taskId) => api.get(`/tasks/${taskId}/messages`),
  sendMessage: (taskId, message) => api.post(`/tasks/${taskId}/messages`, { message }),
  deleteMessage: (messageId) => api.delete(`/messages/${messageId}`),
};

// ✅ 3. Dashboard API (ต้องตรงกับ routes/dashboardRoutes.js)
export const dashboardAPI = {
  getOverview: (projectId) => api.get(`/dashboard/${projectId}/overview`),
  getInfrastructure: (projectId) => api.get(`/dashboard/${projectId}/infrastructure`),
  getRisks: (projectId) => api.get(`/dashboard/${projectId}/risks`),
  submitMood: (projectId, score) => api.post(`/dashboard/${projectId}/mood`, { sentiment_score: score }),
  
  // ⚠️ เพิ่ม: Resolve Risk (เรามี route นี้ใน backend)
  resolveRisk: (alertId) => api.patch(`/dashboard/risks/${alertId}/resolve`),

  // 🚀 เพิ่มใหม่: Risk Sentinel (สำหรับหน้า Risk)
  getRiskSentinel: (projectId) => api.get(`/dashboard/${projectId}/risk-sentinel`),

  // ⚠️ หมายเหตุ: API ด้านล่างนี้ยังไม่ได้ทำใน Backend (ต้องไปเพิ่ม Controller ก่อนถึงจะใช้ได้)
  // getMoodHistory: (projectId, days) => api.get(`/dashboard/${projectId}/mood/history`, { params: { days } }),
  // getCycle: (projectId) => api.get(`/dashboard/${projectId}/cycle`),
};

// ✅ 4. Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data), // data = { username, email, password }
  login: (data) => api.post('/auth/login', data),       // data = { email, password }
  getCurrentUser: () => api.get('/auth/me'),
};

export default api;