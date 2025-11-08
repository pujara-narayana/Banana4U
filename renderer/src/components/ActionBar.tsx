import React from 'react';
import { motion } from 'framer-motion';

interface ActionBarProps {
  onVoiceInput: () => void;
  onTextInput: () => void;
  onScreenCapture: () => void;
  onQuickActions: () => void;
  isListening: boolean;
}

const ActionBar: React.FC<ActionBarProps> = ({
  onVoiceInput,
  onTextInput,
  onScreenCapture,
  onQuickActions,
  isListening,
}) => {
  return (
    <div className="flex gap-2 items-center justify-center no-drag">
      {/* Voice Input Button */}
      <motion.button
        className={`control-button ${
          isListening ? 'bg-red-500 animate-pulse-glow' : 'bg-banana-500 hover:bg-banana-600'
        }`}
        onClick={onVoiceInput}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        title="Voice Input (Ctrl+Space)"
      >
        {isListening ? '🔴' : '🎤'}
      </motion.button>

      {/* Text Input Button */}
      <motion.button
        className="control-button bg-blue-500 hover:bg-blue-600"
        onClick={onTextInput}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        title="Text Input"
      >
        ⌨️
      </motion.button>

      {/* Screen Capture Button */}
      <motion.button
        className="control-button bg-green-500 hover:bg-green-600"
        onClick={onScreenCapture}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        title="Capture Screen (Ctrl+Shift+C)"
      >
        📷
      </motion.button>

      {/* Quick Actions Button */}
      <motion.button
        className="control-button bg-purple-500 hover:bg-purple-600"
        onClick={onQuickActions}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        title="Quick Actions"
      >
        ✨
      </motion.button>
    </div>
  );
};

export default ActionBar;
