import React from 'react';
import { motion } from 'framer-motion';

interface ChatBubbleProps {
  message: string;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ message }) => {
  return (
    <motion.div
      className="chat-bubble shadow-lg"
      initial={{ opacity: 0, y: 10, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.9 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <p className="leading-relaxed">{message}</p>

      {/* Speech bubble tail */}
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
        <div
          className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent"
          style={{
            borderTopColor: 'rgba(255, 255, 255, 0.1)',
            filter: 'blur(10px)',
          }}
        />
      </div>
    </motion.div>
  );
};

export default ChatBubble;
