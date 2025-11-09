import React from 'react';
import { Message } from '../../../shared/types';
import ChatBubble from './ChatBubble';

interface ChatViewProps {
  messages: Message[];
  isLoading: boolean;
  voiceError: string | null;
}

const ChatView: React.FC<ChatViewProps> = ({ messages, isLoading, voiceError }) => {
  return (
    <>
      {voiceError && (
        <div className="text-red-500 text-xs text-center mb-2 px-2">
          {voiceError}
        </div>
      )}
      <div className="max-w-2xl mx-auto space-y-3">
        {messages.map((message) => (
          <ChatBubble key={message.id} message={message} />
        ))}
        {isLoading && (
          <div className="flex justify-end mb-2">
            <div className="glass-bubble px-4 py-2 rounded-2xl rounded-br-sm">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ChatView;