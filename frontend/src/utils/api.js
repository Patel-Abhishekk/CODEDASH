import axios from 'axios';

// Backend API base URL
const API_BASE_URL = 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if it exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log('Sending token with request');
  }
  return config;
});

// User API calls
export const userAPI = {
  register: (username, email, password) =>
    api.post('/users/register', { username, email, password }),
  login: (email, password) =>
    api.post('/users/login', { email, password }),
  getUserById: (userId) =>
    api.get(`/users/${userId}`),
  getNotifications: (userId) =>
    api.get(`/users/notifications/${userId}`),
  markNotificationsRead: (userId) =>
    api.post('/users/notifications/read', { userId }),
};

// Task API calls
export const taskAPI = {
  postTask: (title, description, bounty, userId, deadlineHours) =>
    api.post('/tasks', { title, description, bounty, userId, deadlineHours }),
  getOpenTasks: () =>
    api.get('/tasks'),
  getTaskById: (taskId) =>
    api.get(`/tasks/${taskId}`),
  claimTask: (taskId, userId) =>
    api.post('/tasks/claim', { taskId, userId }),
  submitProof: (taskId, userId, proofOfWork) =>
    api.post('/tasks/submit-proof', { taskId, userId, proofOfWork }),
  approveTask: (taskId, userId, rating) =>
    api.post('/tasks/approve', { taskId, userId, rating }),
  rejectTask: (taskId, userId, rejectionReason) =>
    api.post('/tasks/reject', { taskId, userId, rejectionReason }),
  autoResolveGhosting: () =>
    api.post('/tasks/auto-resolve-ghosting'),
  deleteTask: (taskId, userId) =>
    api.post('/tasks/delete', { taskId, userId }),
  searchTasks: (params) =>
    api.get('/tasks/search', { params }),
};

// Chat API calls
export const chatAPI = {
  getChatHistory: (taskId, userId) =>
    api.get(`/chat/${taskId}?userId=${userId}`),
  getUserChats: (userId) =>
    api.get(`/chat/user/${userId}`),
  markAsRead: (taskId, userId) =>
    api.post('/chat/mark-read', { taskId, userId }),
};

// Notification API calls
export const notificationAPI = {
  getNotifications: (userId) =>
    api.get(`/notifications?userId=${userId}`),
  getUnreadCount: (userId) =>
    api.get(`/notifications/unread-count?userId=${userId}`),
  markAsRead: (notificationId) =>
    api.post(`/notifications/${notificationId}/read`),
  markAllAsRead: (userId) =>
    api.post('/notifications/mark-all-read', { userId }),
  deleteNotification: (notificationId) =>
    api.delete(`/notifications/${notificationId}`),
  clearAll: (userId) =>
    api.delete('/notifications/clear-all', { data: { userId } }),
};

export default api;