import React from 'react';
import { motion } from 'framer-motion';
import { Settings } from 'lucide-react';

interface SettingsButtonProps {
  onClick: () => void;
}

const SettingsButton: React.FC<SettingsButtonProps> = ({ onClick }) => {
  return (
    <motion.button
      className="no-drag fixed top-4 left-4 w-11 h-11 flex items-center justify-center bg-yellow-50/20 hover:bg-yellow-50/30 rounded-full transition-colors z-50 backdrop-blur-xl border border-yellow-200/30 shadow-xl"
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

