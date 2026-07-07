import React, { useState, useEffect, useRef } from 'react';
import { Send, X } from 'lucide-react';
import toast from 'react-hot-toast';

const ChatSidebar = ({
  onClose,
  currentUser,
  messages,
  onSendMessage,
}) => {
  const [draft, setDraft] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();

    if (!draft.trim() || !currentUser) {
      return;
    }

    try {
      onSendMessage(draft.trim());
      setDraft('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message. Please try again.');
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-medium text-gray-900">Chat</h3>
          <span className="text-sm text-gray-500">({messages.length})</span>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-200 rounded-lg transition-colors duration-200"
          aria-label="Close chat"
        >
          <X size={20} className="text-gray-600" />
        </button>
      </div>

      <div className="p-3 bg-blue-50 border-b border-blue-100">
        <p className="text-sm text-blue-700">
          Messages stay for this call session
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <div className="text-4xl mb-2">💬</div>
            <p>No messages yet</p>
            <p className="text-sm">Start the conversation!</p>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.isCurrentUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] sm:max-w-xs lg:max-w-md px-3 py-2 rounded-lg shadow-sm ${
                    msg.isCurrentUser
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900 border'
                  }`}
                >
                  {!msg.isCurrentUser && (
                    <div className="text-xs font-medium mb-1 text-blue-600">
                      {msg.sender}
                    </div>
                  )}
                  <div className="text-sm break-words">{msg.message}</div>
                  <div
                    className={`text-xs mt-1 ${
                      msg.isCurrentUser ? 'text-blue-100' : 'text-gray-500'
                    }`}
                  >
                    {msg.time}
                    {msg.isCurrentUser && ' (You)'}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <div className="p-4 border-t border-gray-200 bg-gray-50">
        {!currentUser ? (
          <div className="text-center text-gray-500 py-2">
            <p className="text-sm">Loading chat...</p>
          </div>
        ) : (
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={`Message as ${currentUser.name}...`}
              maxLength={500}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            <button
              type="submit"
              disabled={!draft.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center gap-1"
            >
              <Send size={16} />
            </button>
          </form>
        )}

        {draft.length > 400 && (
          <div className="text-xs text-gray-500 mt-1 text-right">
            {500 - draft.length} characters remaining
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatSidebar;
