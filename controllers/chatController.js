const Chat = require('../models/Chat');
const Task = require('../models/Task');
const User = require('../models/User');

const validateChatAccess = async (taskId, userId) => {
  const task = await Task.findOne({ id: taskId });

  if (!task) {
    return { valid: false, message: 'Task not found' };
  }

  const allowedStatuses = ['claimed', 'under-review', 'approved'];
  if (!allowedStatuses.includes(task.status)) {
    return { 
      valid: false, 
      message: `Chat is not available for tasks with status '${task.status}'. Allowed only when claimed, under-review, or approved.` 
    };
  }

  const isPoster = task.postedBy === userId;
  const isSolver = task.claimedBy === userId;

  if (!isPoster && !isSolver) {
    return { valid: false, message: 'You are not authorized to access chat for this task' };
  }

  const otherUserId = isPoster ? task.claimedBy : task.postedBy;
  const otherUser = await User.findOne({ id: otherUserId });

  return {
    valid: true,
    task,
    isPoster,
    otherUserId,
    otherUsername: otherUser ? otherUser.username : 'User',
  };
};

const getChatHistory = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { userId } = req.query;

    if (!taskId || !userId) {
      return res.status(400).json({ message: 'Missing taskId or userId' });
    }

    const access = await validateChatAccess(taskId, userId);
    if (!access.valid) {
      return res.status(403).json({ message: access.message });
    }

    const chats = await Chat.find({ taskId }).sort({ createdAt: 1 });

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

const saveChatMessage = async (taskId, senderId, messageText) => {
  const access = await validateChatAccess(taskId, senderId);
  if (!access.valid) {
    throw new Error(access.message);
  }

  if (!messageText || typeof messageText !== 'string' || messageText.trim().length === 0) {
    throw new Error('Message cannot be empty');
  }

  if (messageText.length > 500) {
    throw new Error('Message exceeds 500 characters limit');
  }

  const newChat = new Chat({
    taskId,
    senderId,
    receiverId: access.otherUserId,
    message: messageText.trim()
  });

  await newChat.save();

  return newChat;
};

const getUserChats = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const allowedStatuses = ['claimed', 'under-review', 'approved'];

    const userTasks = await Task.find({
      $or: [{ postedBy: userId }, { claimedBy: userId }],
      status: { $in: allowedStatuses }
    });

    const chatsListPromises = userTasks.map(async (task) => {
      const isPoster = task.postedBy === userId;
      const partnerId = isPoster ? task.claimedBy : task.postedBy;
      const partner = await User.findOne({ id: partnerId });

      const lastChat = await Chat.findOne({ taskId: task.id }).sort({ createdAt: -1 });
      const unreadCount = await Chat.countDocuments({ taskId: task.id, receiverId: userId, read: false });

      return {
        taskId: task.id,
        taskTitle: task.title,
        taskStatus: task.status,
        partnerId,
        partnerUsername: partner ? partner.username : 'User',
        lastMessage: lastChat ? lastChat.message : 'No messages yet',
        lastTimestamp: lastChat ? lastChat.timestamp : task.createdAt,
        unreadCount,
      };
    });

    const chatsList = await Promise.all(chatsListPromises);

    chatsList.sort((a, b) => new Date(b.lastTimestamp) - new Date(a.lastTimestamp));

    res.status(200).json({
      message: 'Active chats fetched',
      chats: chatsList,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const markMessagesRead = async (req, res) => {
  try {
    const { taskId, userId } = req.body;
    if (!taskId || !userId) {
      return res.status(400).json({ message: 'Missing taskId or userId' });
    }

    await Chat.updateMany({ taskId, receiverId: userId, read: false }, { read: true });

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
