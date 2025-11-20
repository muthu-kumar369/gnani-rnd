// /react/src/components/gnani/MicButton.tsx
import React from "react";
import { AnimatePresence, motion, useAnimation } from "framer-motion";

interface MicButtonProps {
  isMicActive: boolean;
  onStart: () => void;
  onStop: () => void;
}

const MicButton: React.FC<MicButtonProps> = ({
  isMicActive,
  onStart,
  onStop,
}) => {
  const controls = useAnimation();

  React.useEffect(() => {
    controls.start(isMicActive ? "active" : "inactive");
  }, [isMicActive, controls]);

  const variants = {
    inactive: {
      scale: 1,
      filter: "drop-shadow(0 0 8px rgba(0, 255, 255, 0.5)) brightness(1)",
    },
    active: {
      scale: 1.1,
      filter: "drop-shadow(0 0 25px rgba(0, 255, 255, 1)) brightness(1.2)",
      transition: { type: "spring", stiffness: 200, damping: 10 },
    },
    hover: {
      scale: 1.05,
      filter: "drop-shadow(0 0 15px rgba(0, 255, 255, 0.8)) brightness(1.1)",
    },
  };

  const handleToggle = () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    isMicActive ? onStop() : onStart();
  };

  return (
    <motion.div
      className="relative w-40 h-40 md:w-48 md:h-48 cursor-pointer" // Increased size
      onClick={handleToggle}
      whileTap={{ scale: 0.95 }}
      onHoverStart={() => controls.start("hover")}
      onHoverEnd={() => controls.start(isMicActive ? "active" : "inactive")}
    >
      {/* Outer pulsing rings for active state */}
      <AnimatePresence>
        {isMicActive && (
          <>
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-cyan-300"
              initial={{ scale: 1, opacity: 0.8 }}
              animate={{ scale: [1, 1.6], opacity: [0.8, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
            />
            <motion.div
              className="absolute inset-0 rounded-full border border-cyan-200"
              initial={{ scale: 1, opacity: 1 }}
              animate={{ scale: [1, 1.4], opacity: [1, 0] }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeOut",
                delay: 0.5,
              }}
            />
          </>
        )}
      </AnimatePresence>

      {/* Core Orb with idle breathing effect */}
      <motion.div
        className="w-full h-full rounded-full bg-gradient-radial from-cyan-400/80 to-blue-600/70 flex items-center justify-center"
        variants={variants}
        animate={controls}
        transition={{
          duration: isMicActive ? 0.5 : 3,
          repeat: isMicActive ? 0 : Infinity,
          repeatType: "mirror",
          ease: "easeInOut",
        }}
      >
        <div className="w-[85%] h-[85%] rounded-full bg-black/50 backdrop-blur-md" />
      </motion.div>

      {/* Mic Icon */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <svg
          className="w-16 h-16 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <motion.path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"
            initial={false}
            animate={{ pathLength: 1, opacity: isMicActive ? 1 : 0.7 }}
            transition={{ duration: 0.5 }}
          />
          <motion.path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M19 10v2a7 7 0 0 1-14 0v-2"
            initial={false}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          />
          <motion.line
            x1="12"
            y1="19"
            x2="12"
            y2="23"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            initial={false}
            animate={{ scaleY: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          />
        </svg>
      </div>
    </motion.div>
  );
};

export default MicButton;
