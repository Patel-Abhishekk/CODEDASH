import axios from 'axios';

// ═══════════════════════════════════════════════════════════
// SMART API BASE URL DETECTION
// ═══════════════════════════════════════════════════════════
const getAPIBaseURL = () => {
    const host = window.location.hostname;
    const port = 5000;
    
    // Determine correct URL based on access method
    if (host === 'localhost' || host === '127.0.0.1') {
        // Accessing from localhost - use localhost URL
        return `http://localhost:${port}/api`;
    } else {
        // Accessing from network - use the actual device IP
        return `http://${host}:${port}/api`;
    }
};

const API_BASE_URL = getAPIBaseURL();
console.log('🚀 Using API Base URL:', API_BASE_URL);
console.log('📍 Hostname detected:', window.location.hostname);

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// ═══════════════════════════════════════════════════════════
// REQUEST INTERCEPTOR - Add Token
// ═══════════════════════════════════════════════════════════
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('✅ Sending token with request:', config.url);
    } else {
        console.log('⚠️ No token found for request:', config.url);
    }
    
    return config;
}, (error) => {
    console.error('❌ Request error:', error);
    return Promise.reject(error);
});

// ═══════════════════════════════════════════════════════════
// RESPONSE INTERCEPTOR - Handle Errors
// ═══════════════════════════════════════════════════════════
api.interceptors.response.use(
    response => {
        console.log('✅ API Response:', response.status, response.config.url);
        return response;
    },
    error => {
        console.error('❌ API Error:', {
            status: error.response?.status,
            message: error.response?.data?.message || error.message,
            url: error.config?.url
        });

        // Handle 401 - Unauthorized (token expired or invalid)
        if (error.response?.status === 401) {
            console.log('🔐 Token expired - logging out user');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('user');
            window.location.href = '/login';
        }
        
        const message = error.response?.data?.message || error.message || 'An error occurred';
        return Promise.reject(new Error(message));
    }
);

// ═══════════════════════════════════════════════════════════
// USER API CALLS
// ═══════════════════════════════════════════════════════════
export const userAPI = {
    register: (username, email, password) => {
        console.log('📝 Registering user:', email);
        return api.post('/users/register', { username, email, password });
    },
    login: (email, password) => {
        console.log('🔐 Logging in user:', email);
        return api.post('/users/login', { email, password });
    },
    getUserById: (userId) => {
        console.log('👤 Getting user:', userId);
        return api.get(`/users/${userId}`);
    },
    getNotifications: (userId) => {
        console.log('🔔 Getting notifications for user:', userId);
        return api.get(`/users/notifications/${userId}`);
    },
    markNotificationsRead: (userId) => {
        console.log('✅ Marking notifications as read:', userId);
        return api.post('/users/notifications/read', { userId });
    },
};

// ═══════════════════════════════════════════════════════════
// TASK API CALLS
// ═══════════════════════════════════════════════════════════
export const taskAPI = {
    postTask: (title, description, bounty, userId, deadlineHours) => {
        console.log('📝 Posting task:', title);
        return api.post('/tasks', { title, description, bounty, userId, deadlineHours });
    },
    getOpenTasks: () => {
        console.log('📋 Getting open tasks');
        return api.get('/tasks');
    },
    getTaskById: (taskId) => {
        console.log('📖 Getting task:', taskId);
        return api.get(`/tasks/${taskId}`);
    },
    claimTask: (taskId, userId) => {
        console.log('✋ Claiming task:', taskId);
        return api.post('/tasks/claim', { taskId, userId });
    },
    submitProof: (taskId, userId, proofOfWork) => {
        console.log('📤 Submitting proof for task:', taskId);
        return api.post('/tasks/submit-proof', { taskId, userId, proofOfWork });
    },
    approveTask: (taskId, userId, rating) => {
        console.log('✅ Approving task:', taskId, 'Rating:', rating);
        return api.post('/tasks/approve', { taskId, userId, rating });
    },
    rejectTask: (taskId, userId, rejectionReason) => {
        console.log('❌ Rejecting task:', taskId);
        return api.post('/tasks/reject', { taskId, userId, rejectionReason });
    },
    autoResolveGhosting: () => {
        console.log('⏰ Checking for abandoned tasks');
        return api.post('/tasks/auto-resolve-ghosting');
    },
    deleteTask: (taskId, userId) => {
        console.log('🗑️ Deleting task:', taskId);
        return api.post('/tasks/delete', { taskId, userId });
    },
    searchTasks: (params) => {
        console.log('🔍 Searching tasks:', params);
        return api.get('/tasks/search', { params });
    },
};

// ═══════════════════════════════════════════════════════════
// CHAT API CALLS
// ═══════════════════════════════════════════════════════════
export const chatAPI = {
    getChatHistory: (taskId, userId) => {
        console.log('💬 Getting chat history for task:', taskId);
        return api.get(`/chat/${taskId}?userId=${userId}`);
    },
    getUserChats: (userId) => {
        console.log('💬 Getting all chats for user:', userId);
        return api.get(`/chat/user/${userId}`);
    },
    markAsRead: (taskId, userId) => {
        console.log('✅ Marking chat as read:', taskId);
        return api.post('/chat/mark-read', { taskId, userId });
    },
};

// ═══════════════════════════════════════════════════════════
// NOTIFICATION API CALLS
// ═══════════════════════════════════════════════════════════
export const notificationAPI = {
    getNotifications: (userId) => {
        console.log('🔔 Getting notifications:', userId);
        return api.get(`/notifications?userId=${userId}`);
    },
    getUnreadCount: (userId) => {
        console.log('🔔 Getting unread count:', userId);
        return api.get(`/notifications/unread-count?userId=${userId}`);
    },
    markAsRead: (notificationId) => {
        console.log('✅ Marking notification as read:', notificationId);
        return api.post(`/notifications/${notificationId}/read`);
    },
    markAllAsRead: (userId) => {
        console.log('✅ Marking all notifications as read:', userId);
        return api.post('/notifications/mark-all-read', { userId });
    },
    deleteNotification: (notificationId) => {
        console.log('🗑️ Deleting notification:', notificationId);
        return api.delete(`/notifications/${notificationId}`);
    },
    clearAll: (userId) => {
        console.log('🗑️ Clearing all notifications:', userId);
        return api.delete('/notifications/clear-all', { data: { userId } });
    },
};

export default api;