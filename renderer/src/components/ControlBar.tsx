import React, { useState } from 'react';
import { motion } from 'framer-motion';

const ControlBar: React.FC = () => {
  const [alwaysOnTop, setAlwaysOnTop] = useState(true);

  const handleMinimize = () => {
    window.electron.minimizeWindow();
  };

  const handleClose = () => {
    window.electron.closeWindow();
  };

  const handleToggleAlwaysOnTop = async () => {
    const newState = await window.electron.toggleAlwaysOnTop();
    setAlwaysOnTop(newState);
  };

  return (
    <div className="w-full flex justify-between items-center no-drag">
      {/* Left side - Pin button */}
      <motion.button
        className={`control-button ${
          alwaysOnTop ? 'bg-banana-500' : 'bg-gray-500'
        }`}
        onClick={handleToggleAlwaysOnTop}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        title={alwaysOnTop ? 'Unpin window' : 'Pin window on top'}
      >
        📌
      </motion.button>

      {/* Right side - Window controls */}
      <div className="flex gap-2">
        <motion.button
          className="control-button bg-yellow-500 hover:bg-yellow-600"
          onClick={handleMinimize}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          title="Minimize"
        >
          <span className="text-xs">─</span>
        </motion.button>

        <motion.button
          className="control-button bg-red-500 hover:bg-red-600"
          onClick={handleClose}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          title="Close"
        >
          <span className="text-xs">✕</span>
        </motion.button>
      </div>
    </div>
  );
};

export default ControlBar;
