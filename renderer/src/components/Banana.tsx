import React from 'react';
import { motion } from 'framer-motion';
import { AnimationState } from '../../../shared/types';

interface BananaProps {
  state: AnimationState;
}

const Banana: React.FC<BananaProps> = ({ state }) => {
  // Animation variants for different states
  const variants = {
    idle: {
      rotate: [0, -2, 2, -2, 0],
      y: [0, -5, 0],
      transition: {
        rotate: {
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        },
        y: {
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        },
      },
    },
    listening: {
      scale: [1, 1.05, 1, 1.05, 1],
      filter: [
        'drop-shadow(0 0 0px rgba(255, 214, 10, 0))',
        'drop-shadow(0 0 20px rgba(255, 214, 10, 0.8))',
        'drop-shadow(0 0 0px rgba(255, 214, 10, 0))',
      ],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
    thinking: {
      rotate: [-5, 5, -5, 5, 0],
      y: [-2, 2, -2, 2, 0],
      transition: {
        duration: 0.5,
        repeat: 3,
      },
    },
    speaking: {
      y: [0, -3, 0, -3, 0],
      transition: {
        duration: 0.6,
        repeat: Infinity,
      },
    },
    happy: {
      y: [0, -20, 0],
      rotate: [0, -10, 10, -10, 0],
      scale: [1, 1.1, 1],
      transition: {
        duration: 0.8,
        repeat: 2,
      },
    },
    confused: {
      rotate: [-15, 15, -15, 15, 0],
      transition: {
        duration: 0.4,
        repeat: 2,
      },
    },
    excited: {
      y: [0, -30, 0, -20, 0, -10, 0],
      rotate: [0, -20, 20, -20, 20, 0],
      transition: {
        duration: 1.2,
        repeat: 2,
      },
    },
    sleeping: {
      rotate: [0, -10, -10],
      opacity: [1, 0.8, 0.8],
      y: [0, 5, 5],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  };

  return (
    <motion.div
      className="relative flex flex-col items-center justify-center"
      variants={variants}
      animate={state}
      initial="idle"
    >
      {/* Banana Body */}
      <div className="relative w-32 h-32">
        {/* Simple banana SVG placeholder */}
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Banana body */}
          <path
            d="M30 20 Q25 15, 30 10 Q40 5, 50 15 Q65 8, 75 20 Q85 35, 80 55 Q75 75, 60 85 Q45 90, 35 80 Q25 65, 30 45 Q28 30, 30 20Z"
            fill="#FFD60A"
            stroke="#F0C000"
            strokeWidth="2"
          />
          {/* Brown spots */}
          <ellipse cx="45" cy="40" rx="6" ry="8" fill="#8B6914" opacity="0.3" />
          <ellipse cx="60" cy="55" rx="5" ry="7" fill="#8B6914" opacity="0.3" />
          <ellipse cx="50" cy="65" rx="4" ry="6" fill="#8B6914" opacity="0.3" />
        </svg>

        {/* Face overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {/* Sunglasses */}
          <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center justify-center">
            <svg
              viewBox="0 0 60 20"
              className="w-16 h-6"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Left lens */}
              <ellipse cx="15" cy="10" rx="12" ry="8" fill="#1a1a1a" />
              {/* Right lens */}
              <ellipse cx="45" cy="10" rx="12" ry="8" fill="#1a1a1a" />
              {/* Bridge */}
              <rect x="25" y="8" width="4" height="4" fill="#1a1a1a" />
              {/* Frame */}
              <path
                d="M3 10 Q3 3, 15 3 Q27 3, 27 10 Q27 17, 15 17 Q3 17, 3 10 M33 10 Q33 3, 45 3 Q57 3, 57 10 Q57 17, 45 17 Q33 17, 33 10"
                stroke="#1a1a1a"
                strokeWidth="1.5"
                fill="none"
              />
            </svg>
          </div>

          {/* Eyes (behind sunglasses) */}
          <div className="flex gap-4 mb-2 opacity-60">
            <motion.div
              className="w-2.5 h-2.5 bg-black rounded-full"
              animate={
                state === 'sleeping'
                  ? { scaleY: 0.1 }
                  : state === 'listening'
                  ? { scale: [1, 1.2, 1] }
                  : {}
              }
              transition={{ duration: 0.3 }}
            />
            <motion.div
              className="w-2.5 h-2.5 bg-black rounded-full"
              animate={
                state === 'sleeping'
                  ? { scaleY: 0.1 }
                  : state === 'listening'
                  ? { scale: [1, 1.2, 1] }
                  : {}
              }
              transition={{ duration: 0.3 }}
            />
          </div>

          {/* Mouth */}
          <motion.div
            className="w-6 h-3 border-b-2 border-black rounded-full mt-1"
            animate={
              state === 'happy'
                ? { scaleX: 1.5 }
                : state === 'speaking'
                ? { scaleY: [1, 1.5, 1] }
                : state === 'confused'
                ? { rotate: [0, -20, 20, 0] }
                : {}
            }
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Sleeping Z's */}
        {state === 'sleeping' && (
          <motion.div
            className="absolute -top-8 right-0 text-2xl"
            initial={{ opacity: 0, y: 0 }}
            animate={{ opacity: [0, 1, 0], y: [-10, -30] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            💤
          </motion.div>
        )}

        {/* Confused question mark */}
        {state === 'confused' && (
          <motion.div
            className="absolute -top-6 left-1/2 -translate-x-1/2 text-2xl"
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.2, 1], rotate: [-10, 10, 0] }}
            transition={{ duration: 0.5 }}
          >
            ❓
          </motion.div>
        )}

        {/* Excited sparkles */}
        {state === 'excited' && (
          <>
            <motion.div
              className="absolute -top-4 -left-4 text-xl"
              animate={{ scale: [0, 1.5, 0], rotate: [0, 180, 360] }}
              transition={{ duration: 0.8, repeat: Infinity }}
            >
              ✨
            </motion.div>
            <motion.div
              className="absolute -top-4 -right-4 text-xl"
              animate={{ scale: [0, 1.5, 0], rotate: [0, -180, -360] }}
              transition={{ duration: 0.8, repeat: Infinity, delay: 0.4 }}
            >
              ✨
            </motion.div>
          </>
        )}
      </div>
    </motion.div>
  );
};

export default Banana;
