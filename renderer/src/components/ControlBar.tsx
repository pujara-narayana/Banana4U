import React from "react";

const ControlBar: React.FC = () => {
  const handleMinimize = () => {
    window.electron.minimizeWindow();
  };

  const handleExit = () => {
    window.electron.closeWindow();
  };

  return (
    <div className="no-drag absolute right-2 top-2 z-30 flex gap-2">
      {/* Minimize Button */}
      <button
        onClick={handleMinimize}
        className="h-6 w-6 rounded-full bg-black/20 text-white/80 transition-colors hover:bg-white/20"
        title="Minimize"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
          stroke="currentColor"
          className="m-auto h-3 w-3"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
        </svg>
      </button>

      {/* Exit Button */}
      <button
        onClick={handleExit}
        className="h-6 w-6 rounded-full bg-black/20 text-white/80 transition-colors hover:bg-red-500/80"
        title="Exit"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
          stroke="currentColor"
          className="m-auto h-3 w-3"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
};

export default ControlBar;
