import React, { createContext, useState, useEffect, useContext } from 'react';
import io from 'socket.io-client';
import { AuthContext } from './AuthContext';
import { chatAPI } from '../utils/api';

export const ChatContext = createContext();

const SOCKET_SERVER_URL = 'http://localhost:5000';

export function ChatProvider({ children }) {
  const { user } = useContext(AuthContext);

  const [socket, setSocket] = useState(null);
  const [activeTaskId, setActiveTaskId] = useState(null);
  const [activeTaskInfo, setActiveTaskInfo] = useState(null);
  const [partnerUser, setPartnerUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userChats, setUserChats] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Initialize socket connection on mount / login
  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const newSocket = io(SOCKET_SERVER_URL, {
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      console.log('Connected to Socket.io server with ID:', newSocket.id);
    });

    // Listen for incoming messages
    newSocket.on('receive-message', (incomingMsg) => {
      setMessages((prev) => {
        // Prevent duplicate messages
        if (prev.some((m) => m.id === incomingMsg.id)) {
          return prev;
        }
        return [...prev, incomingMsg];
      });
      // Refresh chats list & unread count
      if (user?.id) fetchUserChats();
    });

    // Listen for partner typing indicator
    newSocket.on('user-is-typing', ({ userId, username }) => {
      if (user && userId !== user.id) {
        setIsPartnerTyping(true);
      }
    });

    newSocket.on('user-stopped-typing', ({ userId }) => {
      if (user && userId !== user.id) {
        setIsPartnerTyping(false);
      }
    });

    newSocket.on('chat-error', ({ message }) => {
      console.error('Socket chat error:', message);
    });

    setSocket(newSocket);

    // Initial fetch of active chats
    fetchUserChats();

    return () => {
      newSocket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Fetch list of active chats for user
  const fetchUserChats = async () => {
    if (!user?.id) return;
    try {
      const response = await chatAPI.getUserChats(user.id);
      const chats = response.data?.chats || [];
      setUserChats(chats);

      // Sum unread count
      const totalUnread = chats.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
      setUnreadCount(totalUnread);
    } catch (err) {
      console.error('Failed to fetch user chats:', err);
    }
  };

  // Open chat modal for a specific task
  const openChat = async (taskId) => {
    if (!user?.id) return;

    setLoadingHistory(true);
    setIsModalOpen(true);
    setActiveTaskId(taskId);
    setMessages([]);
    setIsPartnerTyping(false);

    try {
      // Fetch chat history from REST API
      const res = await chatAPI.getChatHistory(taskId, user.id);
      const { task, otherUser, chats } = res.data;

      setActiveTaskInfo(task);
      setPartnerUser(otherUser);
      setMessages(chats || []);

      // Mark messages as read
      await chatAPI.markAsRead(taskId, user.id);
      fetchUserChats();

      // Join socket room
      if (socket) {
        socket.emit('join-task', { taskId, userId: user.id }, (response) => {
          if (response?.error) {
            console.error('Failed to join socket room:', response.error);
          }
        });
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to access chat for this task');
      setIsModalOpen(false);
      setActiveTaskId(null);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Close chat modal
  const closeChat = () => {
    if (socket && activeTaskId) {
      socket.emit('leave-task', { taskId: activeTaskId });
    }
    setIsModalOpen(false);
    setActiveTaskId(null);
    setActiveTaskInfo(null);
    setPartnerUser(null);
    setMessages([]);
    setIsPartnerTyping(false);
    if (user?.id) fetchUserChats();
  };

  // Send a message
  const sendMessage = (messageText) => {
    if (!socket || !activeTaskId || !user?.id || !messageText.trim()) return;

    socket.emit('send-message', {
      taskId: activeTaskId,
      userId: user.id,
      message: messageText.trim(),
    }, (res) => {
      if (res?.error) {
        alert(res.error);
      }
    });

    // Emit stop typing
    socket.emit('stop-typing', { taskId: activeTaskId, userId: user.id });
  };

  // Emit typing status
  const handleTyping = (textLength) => {
    if (!socket || !activeTaskId || !user?.id) return;

    if (textLength > 0) {
      socket.emit('user-typing', {
        taskId: activeTaskId,
        userId: user.id,
        username: user.username,
      });
    } else {
      socket.emit('stop-typing', {
        taskId: activeTaskId,
        userId: user.id,
      });
    }
  };

  return (
    <ChatContext.Provider
      value={{
        socket,
        isModalOpen,
        activeTaskId,
        activeTaskInfo,
        partnerUser,
        messages,
        isPartnerTyping,
        unreadCount,
        userChats,
        loadingHistory,
        openChat,
        closeChat,
        sendMessage,
        handleTyping,
        fetchUserChats,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}
