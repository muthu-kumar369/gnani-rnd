// /react/src/components/gnani/AIAvatar.tsx
import React from "react";
import { motion, useAnimation } from "framer-motion";

interface AIAvatarProps {
  status: "idle" | "listening" | "thinking" | "speaking";
}

const AIAvatar: React.FC<AIAvatarProps> = ({ status }) => {
  const controls = useAnimation();

  React.useEffect(() => {
    switch (status) {
      case "thinking":
        controls.start({
          rotate: [0, 360, 0],
          scale: [1, 1.05, 1],
          transition: { duration: 4, repeat: Infinity, ease: "linear" },
        });
        break;
      case "speaking":
        controls.start({
          scale: [1, 1.1, 1, 1.15, 1],
          transition: { duration: 0.5, repeat: Infinity, ease: "easeInOut" },
        });
        break;
      case "idle":
      default:
        controls.start({
          scale: [1, 1.02, 1],
          transition: { duration: 5, repeat: Infinity, ease: "easeInOut" },
        });
        break;
    }
  }, [status, controls]);

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
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{ duration: 1.5, ease: "easeInOut" }}
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
      style={{ filter: "drop-shadow(0 0 10px rgba(0, 255, 255, 0.7))" }}
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
          animate={{
            scale: status === "speaking" ? [1, 1.2, 1] : [1, 1.05, 1],
            opacity: status === "thinking" ? [0.7, 1, 0.7] : 1,
          }}
          transition={{
            duration: status === "speaking" ? 0.4 : 2,
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
