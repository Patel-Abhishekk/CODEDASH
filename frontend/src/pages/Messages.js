import React, { useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ChatContext } from '../context/ChatContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import '../styles/Messages.css';

export default function Messages() {
  const { user, logout } = useContext(AuthContext);
  const { userChats, openChat, fetchUserChats } = useContext(ChatContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else {
      fetchUserChats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, navigate]);

  const formatTime = (ts) => {
    if (!ts) return '';
    const date = new Date(ts);
    const now = new Date();
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="messages-page">
      <Navbar user={user} onLogout={logout} />

      <div className="messages-container">
        <Sidebar activeTab="messages" />

        <main className="messages-content">
          <div className="messages-header">
            <h1>📬 Messages</h1>
            <p className="messages-subtitle">
              Active conversations for your claimed, under-review, and approved tasks.
            </p>
          </div>

          {userChats.length === 0 ? (
            <div className="empty-chats">
              <p>No active chats found.</p>
              <span style={{ fontSize: '13px', color: '#9CA3AF' }}>
                You can chat with task posters or solvers once a task is claimed or under review.
              </span>
            </div>
          ) : (
            <div className="chats-list">
              {userChats.map((chat) => (
                <div
                  key={chat.taskId}
                  className="chat-card-item"
                  onClick={() => openChat(chat.taskId)}
                >
                  <div className="chat-card-avatar">
                    {chat.partnerUsername.charAt(0).toUpperCase()}
                  </div>

                  <div className="chat-card-info">
                    <div className="chat-card-top">
                      <span className="chat-partner-name">
                        {chat.partnerUsername}
                      </span>
                      <span className="chat-time">
                        {formatTime(chat.lastTimestamp)}
                      </span>
                    </div>

                    <span className="chat-task-sub">
                      Task: {chat.taskTitle} ({chat.taskStatus})
                    </span>

                    <span className="chat-last-msg">
                      {chat.lastMessage}
                    </span>
                  </div>

                  {chat.unreadCount > 0 && (
                    <span className="unread-badge">
                      {chat.unreadCount}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
