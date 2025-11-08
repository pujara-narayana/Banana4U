import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, MessageCircle } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  onVoiceInput: () => void;
  onConversationalMode: () => void;
  isListening: boolean;
  isConversationalMode: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({
                                               onSendMessage,
                                               onVoiceInput,
                                               onConversationalMode,
                                               isListening,
                                               isConversationalMode,
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
      <div className="no-drag fixed bottom-4 left-1/2 -translate-x-1/2 w-full max-w-md px-4 z-50">
        <AnimatePresence>
          {(isListening || isConversationalMode) && (
              <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="mb-2 text-center"
              >
                <div className={`inline-flex items-center gap-2 ${
                  isConversationalMode ? 'bg-purple-500' : 'bg-red-500'
                } text-white px-4 py-2 rounded-full shadow-lg`}>
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  <span className="text-sm font-medium">
                    {isConversationalMode 
                      ? (isListening ? 'Conversational: Listening...' : 'Conversational: Waiting...')
                      : 'Listening...'
                    }
                  </span>
                </div>
                {isConversationalMode && (
                  <div className="mt-1 text-xs text-gray-600">
                    💡 Tip: Use headphones for best results!
                  </div>
                )}
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
              disabled={isListening || isConversationalMode}
          />
          
          {/* Conversational Mode Button */}
          <motion.button
              type="button"
              onClick={onConversationalMode}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors shadow-lg ${
                  isConversationalMode
                      ? 'bg-purple-600 hover:bg-purple-700 animate-pulse'
                      : 'bg-purple-500 hover:bg-purple-600'
              }`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              title={isConversationalMode ? 'Stop conversational mode' : 'Start conversational mode'}
          >
            <MessageCircle size={20} color="white" />
          </motion.button>

          {/* Voice Input Button */}
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
              disabled={isConversationalMode}
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