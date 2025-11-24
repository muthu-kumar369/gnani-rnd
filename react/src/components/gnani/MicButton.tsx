// /react/src/components/gnani/MicButton.tsx
import React from "react";
import { AnimatePresence, motion, useAnimation } from "framer-motion";
import { GnaniAppStatus } from '../../hooks/useGnaniUIState';

interface MicButtonProps {
  isMicActive: boolean;
  status: GnaniAppStatus; // Add status prop
  onStart: () => void;
  onStop: () => void;
}

const MicButton: React.FC<MicButtonProps> = ({
  isMicActive,
  status,
  onStart,
  onStop,
}) => {
  const controls = useAnimation();

  const getButtonVariants = (currentStatus: GnaniAppStatus) => {
    switch (currentStatus) {
      case 'idle':
        return {
          initial: { scale: 1 },
          animate: { scale: [1, 1.02, 1], transition: { duration: 4, repeat: Infinity, ease: "easeInOut" } },
          hover: { scale: 1.05 }
        };
      case 'wake-word-listening':
        return {
          initial: { scale: 1 },
          animate: { scale: [1, 1.15, 1, 1.3, 1], transition: { duration: 1, repeat: Infinity, ease: "easeOut" } },
          hover: { scale: 1.15 }
        };
      case 'mic-recording':
      case 'streaming':
      case 'receiving-stt':
        return {
          initial: { scale: 1 },
          animate: { scale: [1, 1.05, 1], transition: { duration: 0.6, repeat: Infinity, ease: "easeInOut" } },
          hover: { scale: 1.08 }
        };
      case 'thinking':
        return {
          initial: { scale: 1 },
          animate: { scale: [1, 1.1, 1], transition: { duration: 0.8, repeat: Infinity, ease: "easeInOut" } },
          hover: { scale: 1.1 }
        };
      case 'responding':
        return {
          initial: { scale: 1 },
          animate: { scale: [1, 1.07, 1], transition: { duration: 0.4, repeat: Infinity, ease: "easeOut" } },
          hover: { scale: 1.08 }
        };
      case 'error':
        return {
          initial: { scale: 1 },
          animate: { scale: [1, 0.98, 1.02, 1], backgroundColor: ["#ff0000", "#cc0000"], transition: { duration: 0.2, repeat: Infinity, ease: "easeOut" } },
          hover: { scale: 1.02 }
        };
      default:
        return {
          initial: { scale: 1 },
          animate: { scale: 1 },
          hover: { scale: 1.05 }
        };
    }
  };

  const currentVariants = getButtonVariants(status);

  React.useEffect(() => {
    controls.start(currentVariants.animate);
  }, [status, controls, currentVariants.animate]);

  const handleToggle = () => {
    if (isMicActive) {
      onStop();
    } else {
      onStart();
    }
  };

  const getCoreOrbColors = (currentStatus: GnaniAppStatus) => {
    switch (currentStatus) {
      case 'error': return "from-red-500/80 to-red-700/70";
      case 'wake-word-listening': return "from-orange-400/80 to-orange-600/70";
      case 'thinking': return "from-purple-400/80 to-purple-600/70";
      case 'responding': return "from-green-400/80 to-green-600/70";
      case 'mic-recording':
      case 'streaming':
      case 'receiving-stt': return "from-cyan-400/80 to-blue-600/70";
      default: return "from-gray-500/80 to-gray-700/70"; // Default idle color
    }
  }

  const coreOrbColors = getCoreOrbColors(status);

  return (
    <motion.div
      className="relative w-40 h-40 md:w-48 md:h-48 cursor-pointer"
      onClick={handleToggle}
      whileTap={{ scale: 0.95 }}
      onHoverStart={() => controls.start(currentVariants.hover)}
      onHoverEnd={() => controls.start(currentVariants.animate)}
    >
      {/* Outer pulsing rings for active state and wake-word */}
      <AnimatePresence>
        {(isMicActive || status === 'wake-word-listening') && (
          <>
            <motion.div
              className={`absolute inset-0 rounded-full border-2 ${status === 'wake-word-listening' ? 'border-orange-300' : 'border-cyan-300'}`}
              initial={{ scale: 1, opacity: 0.7 }}
              animate={{ scale: [1, 1.7], opacity: [0.7, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut" }}
            />
            <motion.div
              className={`absolute inset-0 rounded-full border ${status === 'wake-word-listening' ? 'border-orange-200' : 'border-cyan-200'}`}
              initial={{ scale: 1, opacity: 0.9 }}
              animate={{ scale: [1, 1.5], opacity: [0.9, 0] }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                ease: "easeOut",
                delay: 0.3,
              }}
            />
          </>
        )}
      </AnimatePresence>

      {/* Core Orb with state-driven effects */}
      <motion.div
        className={`w-full h-full rounded-full bg-gradient-radial ${coreOrbColors} flex items-center justify-center`}
        initial="initial"
        animate={controls}
      >
        <div className="w-[85%] h-[85%] rounded-full bg-black/50 backdrop-blur-md" />
      </motion.div>

      {/* Mic Icon */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <svg
          className={`w-16 h-16 ${status === 'error' ? 'text-red-300' : 'text-white'}`}
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
