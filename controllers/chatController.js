const { readDB, writeDB } = require('../config/db');

// Validate if a user can participate in chat for a specific task
const validateChatAccess = (taskId, userId) => {
  const db = readDB();
  const task = db.tasks.find(t => t.id === taskId);

  if (!task) {
    return { valid: false, message: 'Task not found' };
  }

  // Allowed statuses: claimed, under-review, approved
  const allowedStatuses = ['claimed', 'under-review', 'approved'];
  if (!allowedStatuses.includes(task.status)) {
    return { 
      valid: false, 
      message: `Chat is not available for tasks with status '${task.status}'. Allowed only when claimed, under-review, or approved.` 
    };
  }

  // Check if userId is poster OR solver
  const isPoster = task.postedBy === userId;
  const isSolver = task.claimedBy === userId;

  if (!isPoster && !isSolver) {
    return { valid: false, message: 'You are not authorized to access chat for this task' };
  }

  const otherUserId = isPoster ? task.claimedBy : task.postedBy;
  const otherUser = db.users.find(u => u.id === otherUserId);

  return {
    valid: true,
    task,
    isPoster,
    otherUserId,
    otherUsername: otherUser ? otherUser.username : 'User',
  };
};

// Get chat history for a task
const getChatHistory = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { userId } = req.query;

    if (!taskId || !userId) {
      return res.status(400).json({ message: 'Missing taskId or userId' });
    }

    const access = validateChatAccess(taskId, userId);
    if (!access.valid) {
      return res.status(403).json({ message: access.message });
    }

    const db = readDB();
    const chats = (db.chats || []).filter(c => c.taskId === taskId);

    res.status(200).json({
      message: 'Chat history fetched',
      task: {
        id: access.task.id,
        title: access.task.title,
        status: access.task.status,
      },
      otherUser: {
        id: access.otherUserId,
        username: access.otherUsername,
      },
      chats,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Save a chat message to DB
const saveChatMessage = async (taskId, senderId, messageText) => {
  const access = validateChatAccess(taskId, senderId);
  if (!access.valid) {
    throw new Error(access.message);
  }

  if (!messageText || typeof messageText !== 'string' || messageText.trim().length === 0) {
    throw new Error('Message cannot be empty');
  }

  if (messageText.length > 500) {
    throw new Error('Message exceeds 500 characters limit');
  }

  const db = readDB();
  if (!db.chats) {
    db.chats = [];
  }

  const newChat = {
    id: Date.now().toString(),
    taskId,
    senderId,
    receiverId: access.otherUserId,
    message: messageText.trim(),
    timestamp: new Date().toISOString(),
    read: false,
    createdAt: new Date().toISOString(),
  };

  db.chats.push(newChat);
  writeDB(db);

  return newChat;
};

// Get all active chats for a user
const getUserChats = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const db = readDB();
    const allowedStatuses = ['claimed', 'under-review', 'approved'];

    // Find all tasks where user is poster or solver and status is eligible
    const userTasks = (db.tasks || []).filter(
      t => (t.postedBy === userId || t.claimedBy === userId) && allowedStatuses.includes(t.status)
    );

    const chatsList = userTasks.map(task => {
      const isPoster = task.postedBy === userId;
      const partnerId = isPoster ? task.claimedBy : task.postedBy;
      const partner = (db.users || []).find(u => u.id === partnerId);

      const taskChats = (db.chats || []).filter(c => c.taskId === task.id);
      const lastMessage = taskChats.length > 0 ? taskChats[taskChats.length - 1] : null;
      const unreadCount = taskChats.filter(c => c.receiverId === userId && !c.read).length;

      return {
        taskId: task.id,
        taskTitle: task.title,
        taskStatus: task.status,
        partnerId,
        partnerUsername: partner ? partner.username : 'User',
        lastMessage: lastMessage ? lastMessage.message : 'No messages yet',
        lastTimestamp: lastMessage ? lastMessage.timestamp : task.updatedAt || task.createdAt,
        unreadCount,
      };
    });

    // Sort by latest message/timestamp
    chatsList.sort((a, b) => new Date(b.lastTimestamp) - new Date(a.lastTimestamp));

    res.status(200).json({
      message: 'Active chats fetched',
      chats: chatsList,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mark messages as read
const markMessagesRead = async (req, res) => {
  try {
    const { taskId, userId } = req.body;
    if (!taskId || !userId) {
      return res.status(400).json({ message: 'Missing taskId or userId' });
    }

    const db = readDB();
    let updated = false;

    if (db.chats) {
      db.chats.forEach(chat => {
        if (chat.taskId === taskId && chat.receiverId === userId && !chat.read) {
          chat.read = true;
          updated = true;
        }
      });
    }

    if (updated) {
      writeDB(db);
    }

    res.status(200).json({ message: 'Messages marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  validateChatAccess,
  getChatHistory,
  saveChatMessage,
  getUserChats,
  markMessagesRead,
};
