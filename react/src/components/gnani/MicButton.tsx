// /react/src/components/gnani/MicButton.tsx
import React from 'react';
import { motion } from 'framer-motion';

type AppState = "idle" | "wake" | "listening" | "thinking" | "speaking";

interface MicButtonProps {
  isActive: boolean;
  appState: AppState;
  onToggle: () => void;
}

const MicButton: React.FC<MicButtonProps> = ({ isActive, appState, onToggle }) => {
  const isInteracting = appState === 'listening' || appState === 'thinking' || appState === 'speaking' || appState === 'wake';

  return (
    <motion.div
      className="relative w-32 h-32 cursor-pointer"
      onTap={onToggle}
      animate={{ scale: isActive ? 1.1 : 1 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        className="absolute inset-0 rounded-full"
        initial={{ boxShadow: '0 0 20px 5px rgba(0, 240, 255, 0.4)' }}
        animate={{
          boxShadow: isInteracting
            ? '0 0 60px 15px rgba(0, 240, 255, 0.9)'
            : isActive
              ? '0 0 40px 10px rgba(0, 240, 255, 0.7)'
              : '0 0 20px 5px rgba(0, 240, 255, 0.4)',
          transition: {
            duration: isInteracting ? 0.8 : 0.5,
            repeat: Infinity,
            repeatType: 'reverse',
            ease: 'easeInOut'
          }
        }}
      />
      <div className={`absolute inset-2 rounded-full flex items-center justify-center
                      ${isActive ? 'bg-jarvis-blue/20' : 'bg-jarvis-bg'}`}>
        <svg
          className={`w-12 h-12 ${isActive ? 'text-jarvis-blue' : 'text-gray-500'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          {isActive ? (
            <path
              fillRule="evenodd"
              d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8V4a5 5 0 00-10 0v4a7.001 7.001 0 006 6.93V17h-2a1 1 0 100 2h4a1 1 0 100-2h-2v-2.07z"
              clipRule="evenodd"
            />
          ) : (
            <path
              fillRule="evenodd"
              d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zM4.305 11.995a.75.75 0 01.448.815 8.932 8.932 0 008.312 4.148.75.75 0 010 1.5 10.432 10.432 0 01-9.756-4.894.75.75 0 01.812-.469z"
              clipRule="evenodd"
            />
          )}
        </svg>
      </div>
    </motion.div>
  );
};

export default MicButton;
