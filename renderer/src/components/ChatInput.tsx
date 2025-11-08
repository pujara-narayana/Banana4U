import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  onVoiceInput: () => void;
  isListening: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  onVoiceInput,
  isListening,
}) => {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="no-drag fixed bottom-2 left-1/2 -translate-x-1/2 w-full max-w-[260px] px-3 flex items-center gap-1.5 z-50"
    >
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder="Type your message..."
        className="flex-1 bg-white text-gray-800 px-2.5 py-1.5 rounded-lg border-none outline-none shadow-lg text-xs"
      />
      <motion.button
        type="button"
        onClick={onVoiceInput}
        className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
          isListening
            ? 'bg-red-500 hover:bg-red-600 animate-pulse'
            : 'bg-blue-500 hover:bg-blue-600'
        }`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        title={isListening ? 'Stop listening (click again)' : 'Start voice input'}
      >
        {isListening ? (
          <MicOff size={14} color="white" />
        ) : (
          <Mic size={14} color="white" />
        )}
      </motion.button>
    </form>
  );
};

export default ChatInput;

