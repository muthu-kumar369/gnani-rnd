// /react/src/components/gnani/AIAvatar.tsx
import React from "react";
import { motion, useAnimation } from "framer-motion";
import { GnaniAppStatus } from '../../hooks/useGnaniUIState'; // Import the new status type

interface AIAvatarProps {
  status: GnaniAppStatus; // Use the comprehensive status type
}

const AIAvatar: React.FC<AIAvatarProps> = ({ status }) => {
  const controls = useAnimation();
  const ringControls = useAnimation();

  React.useEffect(() => {
    // Base animation for the entire avatar (scale and filter glow)
    let mainAnimation: any = {};
    let ringAnimation: any = {};

    switch (status) {
      case "wake-word-listening":
        mainAnimation = {
          scale: [1, 1.08, 1],
          filter: "drop-shadow(0 0 20px rgba(0, 255, 255, 1))",
          transition: { duration: 0.8, repeat: Infinity, ease: "easeOut" },
        };
        ringAnimation = {
          opacity: [0.7, 1, 0.7],
          scale: [1, 1.05, 1],
          transition: { duration: 0.5, repeat: Infinity, ease: "easeInOut" },
        };
        break;
      case "mic-recording":
      case "streaming":
      case "receiving-stt":
        mainAnimation = {
          scale: [1, 1.12, 1],
          filter: "drop-shadow(0 0 25px rgba(0, 255, 255, 1.2))",
          transition: { duration: 0.6, repeat: Infinity, ease: "easeInOut" },
        };
        ringAnimation = {
          opacity: [0.8, 1, 0.8],
          scale: [1, 1.07, 1],
          transition: { duration: 0.4, repeat: Infinity, ease: "easeInOut" },
        };
        break;
      case "thinking":
        mainAnimation = {
          rotate: [0, 360],
          scale: [1, 1.05, 1],
          filter: "drop-shadow(0 0 15px rgba(100, 200, 255, 0.8))",
          transition: { duration: 3, repeat: Infinity, ease: "linear" },
        };
        ringAnimation = {
          opacity: [0.5, 0.9, 0.5],
          filter: "drop-shadow(0 0 5px rgba(100, 200, 255, 0.5))",
          transition: { duration: 1, repeat: Infinity, ease: "easeInOut" },
        };
        break;
      case "responding":
        mainAnimation = {
          scale: [1, 1.2, 1, 1.25, 1],
          filter: "drop-shadow(0 0 30px rgba(0, 255, 255, 1.5))",
          transition: { duration: 0.3, repeat: Infinity, ease: "easeOut" },
        };
        ringAnimation = {
          opacity: [1, 0.5, 1],
          scale: [1, 1.1, 1],
          filter: "drop-shadow(0 0 10px rgba(0, 255, 255, 1))",
          transition: { duration: 0.2, repeat: Infinity, ease: "easeOut" },
        };
        break;
      case "error":
        mainAnimation = {
          filter: "drop-shadow(0 0 20px rgba(255, 50, 50, 1))",
          scale: [1, 0.9, 1.1, 1],
          transition: { duration: 0.4, repeat: Infinity, ease: "easeInOut" },
        };
        ringAnimation = {
          opacity: [0.8, 0.2, 0.8],
          filter: "drop-shadow(0 0 5px rgba(255, 50, 50, 0.7))",
          transition: { duration: 0.3, repeat: Infinity, ease: "easeInOut" },
        };
        break;
      case "idle":
      case "initializing":
      default:
        mainAnimation = {
          scale: [1, 1.03, 1],
          filter: "drop-shadow(0 0 10px rgba(0, 255, 255, 0.6))",
          transition: { duration: 4, repeat: Infinity, ease: "easeInOut" },
        };
        ringAnimation = {
          opacity: [0.6, 0.8, 0.6],
          transition: { duration: 3, repeat: Infinity, ease: "easeInOut" },
        };
        break;
    }
    controls.start(mainAnimation);
    ringControls.start(ringAnimation);
  }, [status, controls, ringControls]);

  const renderRing = (
    radius: number,
    thickness: number,
    duration: number,
    delay = 0
  ) => (
    <motion.circle
      cx="100"
      cy="100"
      r={radius}
      stroke="rgba(0, 255, 255, 0.4)"
      strokeWidth={thickness}
      fill="transparent"
      animate={ringControls}
    >
      <animate
        attributeName="stroke-dasharray"
        values={`1, ${2 * Math.PI * radius - 1}; ${
          2 * Math.PI * radius
        }, 0; 1, ${2 * Math.PI * radius - 1}`}
        dur={`${duration}s`}
        repeatCount="indefinite"
        begin={`${delay}s`}
      />
    </motion.circle>
  );

  return (
    <motion.div
      className="relative w-48 h-48"
      animate={controls}
      // style={{ filter: "drop-shadow(0 0 10px rgba(0, 255, 255, 0.7))" }} // Managed by controls
    >
      <svg className="w-full h-full" viewBox="0 0 200 200">
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Core Pulse */}
        <motion.circle
          cx="100"
          cy="100"
          r="40"
          fill="rgba(0, 255, 255, 0.8)"
          filter="url(#glow)"
          animate={
            status === "responding"
              ? {
                  scale: [1, 1.25, 1],
                  filter: "drop-shadow(0 0 15px rgba(0, 255, 255, 1.5))",
                }
              : status === "thinking"
              ? {
                  scale: [1, 1.08, 1],
                  opacity: [0.7, 1, 0.7],
                  filter: "drop-shadow(0 0 10px rgba(100, 200, 255, 0.8))",
                }
              : status === "error"
              ? {
                  scale: [1, 0.9, 1],
                  filter: "drop-shadow(0 0 15px rgba(255, 50, 50, 1.2))",
                }
              : {
                  scale: [1, 1.05, 1],
                  filter: "drop-shadow(0 0 10px rgba(0, 255, 255, 0.7))",
                }
          }
          transition={{
            duration: status === "responding" ? 0.3 : status === "error" ? 0.4 : 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Rotating Segments */}
        {renderRing(60, 2, 10)}
        {renderRing(75, 1, 15, 1)}
        {renderRing(90, 0.5, 20, 2)}

        {/* Light Streaks */}
        <motion.g
          animate={{ rotate: 360 }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        >
          <path
            d="M 100 0 L 100 20"
            stroke="rgba(0, 255, 255, 0.8)"
            strokeWidth="2"
          />
          <path
            d="M 100 180 L 100 200"
            stroke="rgba(0, 255, 255, 0.8)"
            strokeWidth="2"
          />
        </motion.g>
        <motion.g
          animate={{ rotate: -360 }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
        >
          <path
            d="M 0 100 L 20 100"
            stroke="rgba(0, 255, 255, 0.6)"
            strokeWidth="1.5"
          />
          <path
            d="M 180 100 L 200 100"
            stroke="rgba(0, 255, 255, 0.6)"
            strokeWidth="1.5"
          />
        </motion.g>
      </svg>
    </motion.div>
  );
};

export default AIAvatar;
