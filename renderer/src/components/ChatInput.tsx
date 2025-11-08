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
      className="no-drag fixed bottom-4 left-1/2 -translate-x-1/2 w-full max-w-md px-4 flex items-center gap-2 z-50"
    >
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder="Type your message..."
        className="flex-1 bg-white text-gray-800 px-4 py-3 rounded-xl border-none outline-none shadow-lg text-sm"
      />
      <motion.button
        type="button"
        onClick={onVoiceInput}
        className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
          isListening
            ? 'bg-red-500 hover:bg-red-600'
            : 'bg-blue-500 hover:bg-blue-600'
        }`}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        title={isListening ? 'Stop listening' : 'Voice input'}
      >
        {isListening ? (
          <MicOff size={20} color="white" />
        ) : (
          <Mic size={20} color="white" />
        )}
      </motion.button>
    </form>
  );
};

export default ChatInput;

