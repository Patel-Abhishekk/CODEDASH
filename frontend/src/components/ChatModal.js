import React, { useState, useEffect, useRef, useContext } from 'react';
import { ChatContext } from '../context/ChatContext';
import { AuthContext } from '../context/AuthContext';
import { sanitizeInput } from '../utils/validation';
import '../styles/ChatModal.css';

export default function ChatModal() {
  const {
    isModalOpen,
    activeTaskInfo,
    partnerUser,
    messages,
    isPartnerTyping,
    loadingHistory,
    closeChat,
    sendMessage,
    handleTyping,
  } = useContext(ChatContext);

  const { user } = useContext(AuthContext);
  const [text, setText] = useState('');
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    if (isModalOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isPartnerTyping, isModalOpen]);

  if (!isModalOpen) return null;

  const handleTextChange = (e) => {
    const value = e.target.value;
    if (value.length <= 500) {
      setText(value);
      handleTyping(value.length);
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!text || text.trim().length === 0) {
      // setError('Message cannot be empty'); // We don't have error state here, just return
      return;
    }
    
    if (text.length > 500) {
      return;
    }
    
    // Sanitize
    const sanitizedMessage = sanitizeInput(text);
    
    sendMessage(sanitizedMessage);
    setText('');
    handleTyping(0);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  const partnerName = partnerUser?.username || 'User';
  const partnerAvatar = partnerName.charAt(0).toUpperCase();

  const formatTimestamp = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="chat-modal-overlay" onClick={closeChat}>
      <div className="chat-container" onClick={(e) => e.stopPropagation()}>
        {/* Chat Header */}
        <div className="chat-header">
          <div className="chat-header-user">
            <div className="chat-avatar">
              {partnerAvatar}
              <span className="online-dot" title="Online"></span>
            </div>
            <div className="chat-title-group">
              <span className="chat-partner-name">
                {partnerName}
              </span>
              <span className="chat-task-title" title={activeTaskInfo?.title}>
                Task: {activeTaskInfo?.title || 'Chat'}
              </span>
            </div>
          </div>

          <button className="btn-close-chat" onClick={closeChat} title="Close Chat">
            ✕
          </button>
        </div>

        {/* Message Area */}
        <div className="chat-messages">
          {loadingHistory ? (
            <div className="chat-loading">Loading chat history...</div>
          ) : messages.length === 0 ? (
            <div className="chat-empty">
              No messages yet. Start the conversation!
            </div>
          ) : (
            messages.map((msg) => {
              const isOwn = msg.senderId === user?.id;
              return (
                <div
                  key={msg.id || msg.timestamp}
                  className={`message-wrapper ${isOwn ? 'own' : 'other'}`}
                >
                  <div className="message-bubble">{msg.message}</div>
                  <span className="message-timestamp">
                    {formatTimestamp(msg.timestamp)}
                  </span>
                </div>
              );
            })
          )}

          {/* Partner Typing Indicator */}
          {isPartnerTyping && (
            <div className="typing-indicator">
              <span>{partnerName} is typing</span>
              <div className="typing-dots">
                <span className="dot"></span>
                <span className="dot"></span>
                <span className="dot"></span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="chat-input-container">
          <form className="chat-input-form" onSubmit={handleSend}>
            <div className="input-row">
              <input
                type="text"
                className="chat-input"
                placeholder={`Message ${partnerName}...`}
                value={text}
                onChange={handleTextChange}
                onKeyDown={handleKeyDown}
                maxLength={500}
              />
              <button
                type="submit"
                className="btn-send"
                disabled={!text.trim() || text.length > 500}
              >
                Send
              </button>
            </div>
            <div className={`char-counter ${text.length > 450 ? (text.length === 500 ? 'exceeded' : 'warning') : ''}`}>
              {text.length}/500
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
