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
        className={`max-w-xs px-4 py-2 rounded-2xl ${
          isUser
            ? 'bg-gray-300 text-gray-800 rounded-bl-sm'
            : 'bg-gray-700 text-white rounded-br-sm'
        }`}
        style={{
          borderRadius: '16px',
          ...(isUser
            ? { borderBottomLeftRadius: '4px' }
            : { borderBottomRightRadius: '4px' }),
        }}
      >
        <p className="text-sm leading-relaxed break-words">{message.content}</p>
      </div>
    </motion.div>
  );
};

export default ChatBubble;
