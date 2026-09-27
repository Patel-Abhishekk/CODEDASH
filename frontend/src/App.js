import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { NotificationProvider, useNotifications } from './context/NotificationContext';
import { ChatProvider } from './context/ChatContext';
import ChatModal from './components/ChatModal';
import { ToastContainer } from './components/Toast';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import PostTask from './pages/PostTask';
import TaskDetail from './pages/TaskDetail';
import SubmitProof from './pages/SubmitProof';
import ApproveTask from './pages/ApproveTask';
import UserProfile from './pages/UserProfile';
import TaskHistory from './pages/TaskHistory';
import Messages from './pages/Messages';
import './App.css';
import ErrorBoundary from './components/ErrorBoundary';

function GlobalToasts() {
  const { toasts, dismissToast } = useNotifications();
  return <ToastContainer toasts={toasts} onDismiss={dismissToast} />;
}

function AppRoutes() {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div style={{ width: '50px', height: '50px', border: '5px solid #f3f3f3', borderTop: '5px solid #2563EB', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <Router>
      <ChatModal />
      <GlobalToasts />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <Landing />} />
        <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/dashboard" replace /> : <Register />} />

        {/* Protected routes */}
        <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/login" replace />} />
        <Route path="/post-task" element={user ? <PostTask /> : <Navigate to="/login" replace />} />
        <Route path="/task/:taskId" element={user ? <TaskDetail /> : <Navigate to="/login" replace />} />
        <Route path="/submit-proof/:taskId" element={user ? <SubmitProof /> : <Navigate to="/login" replace />} />
        <Route path="/approve-task/:taskId" element={user ? <ApproveTask /> : <Navigate to="/login" replace />} />
        <Route path="/profile/:userId" element={user ? <UserProfile /> : <Navigate to="/login" replace />} />
        <Route path="/task-history" element={user ? <TaskHistory /> : <Navigate to="/login" replace />} />
        <Route path="/messages" element={user ? <Messages /> : <Navigate to="/login" replace />} />

        {/* Catch all */}
        <Route path="*" element={<Navigate to={user ? "/dashboard" : "/"} replace />} />
      </Routes>
    </Router>
  );
}


function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <NotificationProvider>
          <ChatProvider>
            <AppRoutes />
          </ChatProvider>
        </NotificationProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;