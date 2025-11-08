import React from 'react';
import { motion } from 'framer-motion';
import { Message } from '../../../shared/types';

interface ChatBubbleProps {
  message: Message;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <motion.div
      className={`flex ${isUser ? 'justify-start' : 'justify-end'} mb-2`}
      initial={{ opacity: 0, y: 10, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.9 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <div
        className={`max-w-xs px-4 py-3 rounded-2xl glass-bubble shadow-lg ${
          isUser
            ? 'bg-white/30 text-gray-900 rounded-bl-sm border border-white/40'
            : 'bg-gray-900/40 text-white rounded-br-sm border border-white/20'
        }`}
        style={{
          borderRadius: '18px',
          ...(isUser
            ? { borderBottomLeftRadius: '4px' }
            : { borderBottomRightRadius: '4px' }),
        }}
      >
        <p className="text-sm leading-relaxed break-words font-medium">{message.content}</p>
      </div>
    </motion.div>
  );
};

export default ChatBubble;
