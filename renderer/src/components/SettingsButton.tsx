import React from 'react';
import { motion } from 'framer-motion';
import { Settings } from 'lucide-react';

interface SettingsButtonProps {
  onClick: () => void;
}

const SettingsButton: React.FC<SettingsButtonProps> = ({ onClick }) => {
  return (
    <motion.button
      className="no-drag fixed top-2 right-2 w-7 h-7 flex items-center justify-center bg-gray-800 hover:bg-gray-700 rounded-full transition-colors z-50"
      onClick={onClick}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      title="Settings"
    >
      <Settings size={14} color="white" />
    </motion.button>
  );
};

export default SettingsButton;

