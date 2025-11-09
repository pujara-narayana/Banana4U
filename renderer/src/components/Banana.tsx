import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimationState, PersonalityType } from '../../../shared/types';
import bananaImage from '../../../images/coolbanana.png';
import studyBananaImage from '../../../images/studybanana.png';
import hypeBananaImage from '../../../images/hypebanana.png';
import chillBananaImage from '../../../images/chillbanana.png';
import memeBananaImage from '../../../images/memebanana-removebg-preview.png';
import talkingBananaSprite from '../../../images/defaultbanana_talking.png';

interface BananaProps {
  state: AnimationState;
  personality?: PersonalityType;
}

const Banana: React.FC<BananaProps> = ({ state, personality = 'default' }) => {
  const [currentFrame, setCurrentFrame] = useState(0);
  const animationFrameRef = useRef<number>();
  const lastFrameTimeRef = useRef<number>(0);
  
  // Sprite animation configuration
  const TOTAL_FRAMES = 36;
  const FRAME_DURATION = 1000 / 24; // 24 FPS
  const FRAMES_PER_ROW = 6; // Assuming 6x6 grid
  const SPRITE_SIZE = 200; // Size of each frame in the sprite sheet

  // Animate sprite frames when speaking
  useEffect(() => {
    if (state === 'speaking') {
      const animate = (timestamp: number) => {
        if (!lastFrameTimeRef.current) {
          lastFrameTimeRef.current = timestamp;
        }

        const elapsed = timestamp - lastFrameTimeRef.current;

        if (elapsed >= FRAME_DURATION) {
          setCurrentFrame((prev) => (prev + 1) % TOTAL_FRAMES);
          lastFrameTimeRef.current = timestamp;
        }

        animationFrameRef.current = requestAnimationFrame(animate);
      };

      animationFrameRef.current = requestAnimationFrame(animate);

      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        lastFrameTimeRef.current = 0;
      };
    } else {
      // Reset to first frame when not speaking
      setCurrentFrame(0);
      lastFrameTimeRef.current = 0;
    }
  }, [state]);

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

  // Calculate sprite position for current frame
  const getSpritePosition = () => {
    const row = Math.floor(currentFrame / FRAMES_PER_ROW);
    const col = currentFrame % FRAMES_PER_ROW;
    return {
      backgroundPositionX: `-${col * SPRITE_SIZE}px`,
      backgroundPositionY: `-${row * SPRITE_SIZE}px`,
    };
  };

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
      {/* Banana Character - changes based on personality or shows sprite when speaking */}
      {state === 'speaking' ? (
        <div
          className="w-48 h-48"
          style={{
            backgroundImage: `url(${talkingBananaSprite})`,
            backgroundSize: `${SPRITE_SIZE * FRAMES_PER_ROW}px ${SPRITE_SIZE * FRAMES_PER_ROW}px`,
            ...getSpritePosition(),
            filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.15))',
            imageRendering: 'crisp-edges',
          }}
        />
      ) : (
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
      )}

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
