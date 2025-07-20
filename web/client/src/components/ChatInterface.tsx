import React, { useState, useRef, useEffect } from 'react';
import { Send, Trash2, Loader2, Image as ImageIcon, Download } from 'lucide-react';
import { Message } from '../types';

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (content: string) => void;
  isLoading: boolean;
  onClearMessages: () => void;
  isConnected: boolean;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  onSendMessage,
  isLoading,
  onClearMessages,
  isConnected
}) => {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading && isConnected) {
      onSendMessage(inputValue);
      setInputValue('');
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getMessageIcon = (type: Message['type']) => {
    switch (type) {
      case 'user':
        return '👤';
      case 'assistant':
        return '🤖';
      case 'system':
        return '⚙️';
      case 'error':
        return '❌';
      case 'image':
        return '📸';
      default:
        return '💬';
    }
  };

  const getMessageStyle = (type: Message['type']) => {
    switch (type) {
      case 'user':
        return 'bg-primary-600 text-white ml-auto';
      case 'assistant':
        return 'bg-gray-100 text-gray-900';
      case 'system':
        return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'error':
        return 'bg-red-100 text-red-800 border border-red-200';
      case 'image':
        return 'bg-gray-100 text-gray-900';
      default:
        return 'bg-gray-100 text-gray-900';
    }
  };

  const renderMessageContent = (message: Message) => {
    if (message.type === 'image' && message.imageData) {
      const downloadImage = () => {
        const link = document.createElement('a');
        link.href = `data:image/jpeg;base64,${message.imageData}`;
        link.download = `screenshot-${Date.now()}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      };

      return (
        <div className="space-y-2">
          <div className="whitespace-pre-wrap break-words">{message.content}</div>
          <div className="relative">
            <img
              src={`data:image/jpeg;base64,${message.imageData}`}
              alt={message.imageAlt || 'Screenshot'}
              className="max-w-full h-auto rounded-lg border border-gray-200 shadow-sm"
              style={{ maxHeight: '400px' }}
            />
            <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
              <ImageIcon size={12} className="inline mr-1" />
              {message.savedFilename ? 'Saved' : 'Screenshot'}
            </div>
            <button
              onClick={downloadImage}
              className="absolute bottom-2 right-2 bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1 rounded flex items-center gap-1 transition-colors"
              title={message.savedFilename ? `Saved as: ${message.savedFilename}` : 'Download screenshot'}
            >
              <Download size={12} />
              {message.savedFilename ? 'Saved' : 'Download'}
            </button>
          </div>
        </div>
      );
    }
    
    return <div className="whitespace-pre-wrap break-words">{message.content}</div>;
  };

  return (
    <div className="card h-[600px] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">Chat Interface</h2>
        <button
          onClick={onClearMessages}
          className="btn-secondary flex items-center gap-2"
          disabled={messages.length === 0}
        >
          <Trash2 size={16} />
          Clear
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>No messages yet. Connect to an MCP server and start chatting!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className="flex items-start gap-3">
              <div className="text-2xl">{getMessageIcon(message.type)}</div>
              <div className="flex-1">
                <div className={`rounded-lg p-3 max-w-[80%] ${getMessageStyle(message.type)}`}>
                  {renderMessageContent(message)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {formatTimestamp(message.timestamp)}
                </div>
              </div>
            </div>
          ))
        )}
        
        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="text-2xl">🤖</div>
            <div className="flex-1">
              <div className="bg-gray-100 rounded-lg p-3 max-w-[80%]">
                <div className="flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  <span>Processing...</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={isConnected ? "Type your message..." : "Connect to MCP server first..."}
          disabled={!isConnected || isLoading}
          className="input-field flex-1"
        />
        <button
          type="submit"
          disabled={!inputValue.trim() || isLoading || !isConnected}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send size={16} />
        </button>
      </form>

      {/* Connection Status */}
      {!isConnected && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800 text-sm">
            ⚠️ Please connect to an MCP server to start chatting
          </p>
        </div>
      )}
    </div>
  );
};

export default ChatInterface; 