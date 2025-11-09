import React from "react";
import Banana from "./Banana";

interface WelcomeProps {
  onContinue: () => void;
}

const Welcome: React.FC<WelcomeProps> = ({ onContinue }) => {
  return (
    <div className="ios-glass-background h-full w-full p-4 text-center sm:p-8">
      {/* Animated gradient background */}
      <div className="via-banana-500/8 animate-gradient pointer-events-none absolute inset-0 bg-gradient-to-br from-yellow-200/10 to-amber-200/10" />
      <div className="pointer-events-none absolute inset-0 backdrop-blur-2xl" />

      <div className="relative z-10 m-auto flex h-full w-full max-w-md flex-col items-center justify-center overflow-y-auto overscroll-contain py-8">
        <div className="mb-4 h-36 w-36 sm:mb-6 sm:h-48 sm:w-48">
          <Banana state="idle" personality="default" />
        </div>
        <h1 className="mb-2 text-3xl font-bold text-white sm:text-4xl">
          Welcome to Banana4U!
        </h1>
        <p className="mb-6 text-base text-white/80 sm:mb-8 sm:text-lg">
          Your friendly, context-aware AI assistant. Ready to help you with
          anything on your screen.
        </p>
        <button
          onClick={onContinue}
          className="transform rounded-full bg-yellow-400 px-8 py-3 text-base font-bold text-gray-800 shadow-lg transition-transform hover:scale-105 hover:bg-yellow-500 sm:text-lg"
        >
          Let&apos;s Go! 🍌
        </button>
      </div>
    </div>
  );
};

export default Welcome;
