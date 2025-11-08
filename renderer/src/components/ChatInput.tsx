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
      className="no-drag fixed bottom-4 left-1/2 -translate-x-1/2 w-full max-w-md px-4 flex items-center gap-3 z-50"
    >
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder="Type your message..."
        className="flex-1 glass-input bg-yellow-50/15 text-white placeholder-white/60 px-5 py-3 rounded-2xl border border-yellow-200/30 outline-none shadow-xl text-sm backdrop-blur-xl font-medium"
      />
      <motion.button
        type="button"
        onClick={onVoiceInput}
        className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors shadow-xl border-2 ${
          isListening
            ? 'bg-red-500/80 hover:bg-red-600/80 border-red-300/50 backdrop-blur-xl'
            : 'bg-blue-500/80 hover:bg-blue-600/80 border-blue-300/50 backdrop-blur-xl'
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

