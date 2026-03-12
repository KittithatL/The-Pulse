import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // ✅ จากอันแรก
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
      const url = error.config?.url || '';
      // ✅ อย่า logout ถ้าเป็น 2FA routes เพราะ 401 หมายถึง "code ผิด" ไม่ใช่ "token หมดอายุ"
      const is2FARoute = url.includes('/2fa/');
      if (!is2FARoute) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
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
    if (projectId === 'all') return api.get('/dashboard/notifications/all');
    return api.get(`/dashboard/${projectId}/risks`);
  },

  getAllNotifications: () => api.get('/dashboard/notifications/all'), // ✅ จากอันแรก

  getMyDayBriefing: () => api.get('/dashboard/my-day/briefing'),
  submitMood: (projectId, score) => api.post(`/dashboard/${projectId}/mood`, { sentiment_score: score }),
  resolveRisk: (alertId) => api.patch(`/dashboard/alerts/${alertId}/resolve`),
  clearAllNotifications: () => api.delete('/dashboard/notifications/clear-all'),
  getRiskSentinel: (projectId) => api.get(`/dashboard/${projectId}/risk-sentinel`),
};

export const authAPI = {
  register:        (data)                => api.post('/auth/register', data),
  login:           (data)                => api.post('/auth/login', data),
  getCurrentUser:  ()                    => api.get('/auth/me'),
  forgotPassword:  (email)               => api.post('/auth/forgot-password', { email }),
  resetPassword:   (token, new_password) => api.post('/auth/reset-password', { token, new_password }),
  setup2FA:        ()                    => api.post('/auth/2fa/setup'),
  verify2FA:       (code)                => api.post('/auth/2fa/verify', { code }),
  disable2FA:      (password)            => api.post('/auth/2fa/disable', { password }),
  getLoginHistory: ()                    => api.get('/auth/login-history'),
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
  approveAllDisbursements: (projectId) => api.post(`/projects/${projectId}/finance/disbursements/approve-all`),

  getAuditLog: (projectId) => api.get(`/projects/${projectId}/finance/audit`),
};

export const decisionAPI = {
  getDecisions:    (projectId, params) => api.get(`/projects/${projectId}/decisions`, { params }),
  getDecision:     (projectId, id) => api.get(`/projects/${projectId}/decisions/${id}`),
  getReport:       (projectId) => api.get(`/projects/${projectId}/decisions/report`),
  createDecision:  (projectId, data) => api.post(`/projects/${projectId}/decisions`, data),
  updateDecision:  (projectId, id, data) => api.put(`/projects/${projectId}/decisions/${id}`, data),
  archiveDecision: (projectId, id) => api.patch(`/projects/${projectId}/decisions/${id}/archive`),
  addComment:      (projectId, id, content) => api.post(`/projects/${projectId}/decisions/${id}/comments`, { content }),
  deleteComment:   (projectId, commentId) => api.delete(`/projects/${projectId}/decisions/comments/${commentId}`),
  toggleReaction:  (projectId, id, emoji) => api.post(`/projects/${projectId}/decisions/${id}/reactions`, { emoji }),
  updateStakeholders: (projectId, id, ids) => api.put(`/projects/${projectId}/decisions/${id}/stakeholders`, { stakeholder_ids: ids }),
};

export const adminAPI = {
  getMetrics: (range) => api.get('/admin/metrics', { params: range ? { range } : {} }),
};

export const pairingAPI = {
  sendRequest:    (data) => api.post('/pairing/request', data),
  acceptRequest:  (id)   => api.patch(`/pairing/${id}/accept`),
  declineRequest: (id)   => api.patch(`/pairing/${id}/decline`),
  getMyPairs:     ()     => api.get('/pairing/my-pairs'), // ✅ จากอันแรก
};

export const systemAPI = {
  getHealth: () => api.get('/health'),
};

export const rolesAPI = {
  getRoles:         (projectId)               => api.get(`/projects/${projectId}/roles`),
  createRole:       (projectId, data)         => api.post(`/projects/${projectId}/roles`, data),
  updateRole:       (projectId, roleId, data) => api.put(`/projects/${projectId}/roles/${roleId}`, data),
  deleteRole:       (projectId, roleId)       => api.delete(`/projects/${projectId}/roles/${roleId}`),
  assignRole:       (projectId, userId, data) => api.put(`/projects/${projectId}/members/${userId}/role`, data),
  getMyPermissions: (projectId)               => api.get(`/projects/${projectId}/my-permissions`),
};

export default api;