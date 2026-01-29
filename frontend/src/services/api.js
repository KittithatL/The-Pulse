import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ✅ ใส่ token ให้อัตโนมัติทุก request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token'); // ต้องเก็บชื่อ key นี้ตอน login
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Attach token to every request
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


export const projectAPI = {
  getProjects: () => api.get('/projects'),
  getProject: (id) => api.get(`/projects/${id}`),
  createProject: (data) => api.post('/projects', data),
  updateProject: (id, data) => api.put(`/projects/${id}`, data),
  deleteProject: (id) => api.delete(`/projects/${id}`),
  getMembers: (id) => api.get(`/projects/${id}/members`),
  addMember: (id, data) => api.post(`/projects/${id}/members`, data),
  removeMember: (projectId, userId) =>
    api.delete(`/projects/${projectId}/members/${userId}`),
};

export const taskAPI = {
  getTasks: (projectId, params) => api.get(`/projects/${projectId}/tasks`, { params }),
  getTask: (id) => api.get(`/tasks/${id}`),
  createTask: (projectId, data) => api.post(`/projects/${projectId}/tasks`, data),
  updateTask: (id, data) => api.put(`/tasks/${id}`, data),
  deleteTask: (id) => api.delete(`/tasks/${id}`),
  getMessages: (taskId) => api.get(`/tasks/${taskId}/messages`),
  sendMessage: (taskId, data) => api.post(`/tasks/${taskId}/messages`, data),
  deleteMessage: (messageId) => api.delete(`/messages/${messageId}`),
};


export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getCurrentUser: () => api.get('/auth/me'),
};

export default api;
