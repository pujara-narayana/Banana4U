import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimationState, PersonalityType } from '../../../shared/types';
import bananaImage from '../../../images/coolbanana.png';
import studyBananaImage from '../../../images/studybanana.png';
import hypeBananaImage from '../../../images/hypebanana.png';
import chillBananaImage from '../../../images/chillbanana.png';
import memeBananaImage from '../../../images/memebanana-removebg-preview.png';

interface BananaProps {
  state: AnimationState;
  personality?: PersonalityType;
}

const Banana: React.FC<BananaProps> = ({ state, personality = 'default' }) => {
  // Select image based on personality
  const getBananaImage = () => {
    switch (personality) {
      case 'study':
        return studyBananaImage;
      case 'hype':
        return hypeBananaImage;
      case 'chill':
        return chillBananaImage;
      case 'meme':
        return memeBananaImage;
      default:
        return bananaImage;
    }
  };

  const currentImage = getBananaImage();

  // Motion variants for container
  const containerVariants = {
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
      rotate: [-5, 5, -5, 5, -5, 5, 0],
      y: [-2, 2, -2, 2, 0],
      transition: {
        duration: 2,
        repeat: Infinity,
      },
    },
    speaking: {
      y: [0, -3, 0, -3, 0],
      scale: [1, 1.02, 1, 1.02, 1],
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
    excited: {
      y: [0, -30, 0, -20, 0, -10, 0],
      rotate: [0, -20, 20, -20, 20, 0],
      transition: {
        duration: 1.2,
        repeat: Infinity,
      },
    },
    confused: {
      rotate: [-15, 15, -15, 15, -15, 15, 0],
      transition: {
        duration: 2,
        repeat: Infinity,
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
      variants={containerVariants}
      animate={state}
      initial="idle"
    >
      {/* Banana Character - changes based on personality */}
      <motion.img
        src={currentImage}
        alt={
          personality === 'study' 
            ? 'Study Banana Character' 
            : personality === 'hype'
            ? 'Hype Banana Character'
            : personality === 'chill'
            ? 'Chill Banana Character'
            : personality === 'meme'
            ? 'Meme Banana Character'
            : 'Cool Banana Character'
        }
        className="w-48 h-48 object-contain"
        style={{
          filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.15))',
        }}
        key={personality} // Force re-render when personality changes
      />

      {/* Sleeping Z's */}
      <AnimatePresence>
        {state === 'sleeping' && (
          <motion.div
            className="absolute -top-8 right-0 text-2xl"
            initial={{ opacity: 0, y: 0 }}
            animate={{ opacity: [0, 1, 0], y: [-10, -30] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            💤
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confused question mark */}
      <AnimatePresence>
        {state === 'confused' && (
          <motion.div
            className="absolute -top-6 left-1/2 -translate-x-1/2 text-2xl"
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.2, 1], rotate: [-10, 10, 0] }}
            exit={{ scale: 0 }}
            transition={{ duration: 0.5 }}
          >
            ❓
          </motion.div>
        )}
      </AnimatePresence>

      {/* Excited sparkles */}
      <AnimatePresence>
        {state === 'excited' && (
          <>
            <motion.div
              className="absolute -top-4 -left-4 text-xl"
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.5, 0], rotate: [0, 180, 360] }}
              exit={{ scale: 0 }}
              transition={{ duration: 0.8, repeat: Infinity }}
            >
              ✨
            </motion.div>
            <motion.div
              className="absolute -top-4 -right-4 text-xl"
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.5, 0], rotate: [0, -180, -360] }}
              exit={{ scale: 0 }}
              transition={{ duration: 0.8, repeat: Infinity, delay: 0.4 }}
            >
              ✨
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Banana;
