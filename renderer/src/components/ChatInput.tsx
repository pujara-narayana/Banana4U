import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
    <div className="no-drag fixed bottom-4 left-1/2 -translate-x-1/2 w-full max-w-md px-4 z-50">
      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mb-2 text-center"
          >
            <div className="inline-flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-full shadow-lg">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              <span className="text-sm font-medium">Listening...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2"
      >
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 bg-white text-gray-800 px-4 py-3 rounded-xl border-none outline-none shadow-lg text-sm"
          disabled={isListening}
        />
        <motion.button
          type="button"
          onClick={onVoiceInput}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors shadow-lg ${
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
    </div>
  );
};

export default ChatInput;

