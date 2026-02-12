import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// 🚀 สร้าง Instance ของ Axios
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ✅ Interceptor: แนบ Token เข้า Header ให้อัตโนมัติทุกครั้งที่ยิง API
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

// 🛡️ Interceptor: ตรวจจับ Error (เช่น 401 Unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // ถ้า Token หมดอายุ ให้ล้างข้อมูลทิ้ง
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // มึงสามารถสั่ง Redirect ไปหน้า Login ได้ที่นี่
      // window.location.href = '/login'; 
    }
    return Promise.reject(error);
  }
);

// 📁 Project Management
export const projectAPI = {
  getProjects: () => api.get('/projects'),
  getProject: (id) => api.get(`/projects/${id}`),
  createProject: (data) => api.post('/projects', data),
  updateProject: (id, data) => api.put(`/projects/${id}`, data),
  deleteProject: (id) => api.delete(`/projects/${id}`),
  getMembers: (id) => api.get(`/projects/${id}/members`),
  addMember: (id, data) => api.post(`/projects/${id}/members`, data),
  removeMember: (projectId, userId) => api.delete(`/projects/${projectId}/members/${userId}`),
};

// 📁 Task & Kanban
export const taskAPI = {
  getTasks: (projectId, params) => api.get(`/projects/${projectId}/tasks`, { params }),
  getTask: (id) => api.get(`/tasks/${id}`),
  getMyTasks: () => api.get('/myTasks'),
  createTask: (projectId, data) => api.post(`/projects/${projectId}/tasks`, data),
  updateTaskStatus: (taskId, status) => api.patch(`/myTasks/${taskId}/status`, { status }),
  updateTask: (id, data) => api.put(`/tasks/${id}`, data),
  deleteTask: (id) => api.delete(`/tasks/${id}`),
  getMessages: (taskId) => api.get(`/tasks/${taskId}/messages`),
  sendMessage: (taskId, data) => api.post(`/tasks/${taskId}/messages`, data),
  deleteMessage: (messageId) => api.delete(`/messages/${messageId}`),
};

// 📁 Dashboard & Command Center (ตัวที่มึงขาดไป!)
export const dashboardAPI = {
  getOverview: (projectId) => api.get(`/dashboard/${projectId}/overview`),
  submitMood: (projectId, data) => api.post(`/dashboard/${projectId}/mood`, data),
  getMoodHistory: (projectId, days) => api.get(`/dashboard/${projectId}/mood/history`, { params: { days } }),
  getInfrastructure: (projectId) => api.get(`/dashboard/${projectId}/infrastructure`),
  getRisks: (projectId) => api.get(`/dashboard/${projectId}/risks`),
  getCycle: (projectId) => api.get(`/dashboard/${projectId}/cycle`),
};

// 📁 Authentication
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getCurrentUser: () => api.get('/auth/me'),
};

export default api;