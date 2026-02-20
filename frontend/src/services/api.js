import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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

export const taskAPI = {
  getTasks: (projectId, params) => api.get(`/projects/${projectId}/tasks`, { params }),
  createTask: (projectId, data) => api.post(`/projects/${projectId}/tasks`, data),
  updateTask: (id, data) => api.put(`/tasks/${id}`, data), 
  deleteTask: (id) => api.delete(`/tasks/${id}`),
  updateTaskStatus: (id, status) => api.put(`/tasks/${id}`, { status }),
  getMyTasks: () => api.get('/tasks/my-tasks', {
    headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' },
    params: { _t: Date.now() }
  }),

  getMessages: (taskId) => api.get(`/tasks/${taskId}/messages`),
  sendMessage: (taskId, message) => api.post(`/tasks/${taskId}/messages`, { message }),
  deleteMessage: (messageId) => api.delete(`/tasks/messages/${messageId}`), 
};

export const dashboardAPI = {
  getOverview: (projectId) => api.get(`/dashboard/${projectId}/overview`),
  getInfrastructure: (projectId) => api.get(`/dashboard/${projectId}/infrastructure`),
  
  getRisks: (projectId) => {
    if (projectId === 'all') {
      return api.get('/dashboard/notifications/all'); 
    }
    return api.get(`/dashboard/${projectId}/risks`); 
  },

  getMyDayBriefing: () => api.get('/dashboard/my-day/briefing'),
  submitMood: (projectId, score) => api.post(`/dashboard/${projectId}/mood`, { sentiment_score: score }),
  resolveRisk: (alertId) => api.patch(`/dashboard/alerts/${alertId}/resolve`),
  clearAllNotifications: () => api.delete('/dashboard/notifications/clear-all'),
  getRiskSentinel: (projectId) => api.get(`/dashboard/${projectId}/risk-sentinel`),
};

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getCurrentUser: () => api.get('/auth/me'),
};

export const financialAPI = {
  getOverview:    (projectId) => api.get(`/projects/${projectId}/finance/overview`),
  adjustBudget:   (projectId, data) => api.put(`/projects/${projectId}/finance/budget`, data),
  getForecast:    (projectId) => api.get(`/projects/${projectId}/finance/forecast`),
  
  getRequests:    (projectId, status) => api.get(`/projects/${projectId}/finance/requests`, { params: status ? { status } : {} }),
  createRequest:  (projectId, data) => api.post(`/projects/${projectId}/finance/requests`, data),
  approveRequest: (projectId, requestId, data) => api.patch(`/projects/${projectId}/finance/requests/${requestId}/approve`, data),
  rejectRequest:  (projectId, requestId, data) => api.patch(`/projects/${projectId}/finance/requests/${requestId}/reject`, data),
  
  getDisbursements:        (projectId) => api.get(`/projects/${projectId}/finance/disbursements`),
  updateDisbursement:      (projectId, id, data) => api.patch(`/projects/${projectId}/finance/disbursements/${id}/status`, data),
  approveAllDisbursements:(projectId) => api.post(`/projects/${projectId}/finance/disbursements/approve-all`),
  
  getAuditLog: (projectId) => api.get(`/projects/${projectId}/finance/audit`),
};

export default api;