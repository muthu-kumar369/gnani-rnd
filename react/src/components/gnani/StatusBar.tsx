// /react/src/components/gnani/StatusBar.tsx
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

type AppState = "idle" | "wake" | "listening" | "thinking" | "speaking";

interface StatusBarProps {
  status: AppState;
}

const StatusBar: React.FC<StatusBarProps> = ({ status }) => {
  const statusText = useMemo(() => {
    switch (status) {
      case 'idle': return 'Idle';
      case 'wake': return 'Wake Word Detected';
      case 'listening': return 'Listening…';
      case 'thinking': return 'Thinking…';
      case 'speaking': return 'Speaking…';
      default: return 'Initializing…';
    }
  }, [status]);

  const indicatorColor = useMemo(() => {
    switch (status) {
      case 'listening': return '#34D399'; // Green
      case 'wake': return '#FB34D3'; // Pink for wake
      case 'thinking': return '#FBBF24'; // Orange
      case 'speaking': return '#00F0FF'; // Blue
      case 'idle': return '#60A5FA'; // Lighter blue for idle
      default: return '#9CA3AF'; // Gray
    }
  }, [status]);

  return (
    <motion.div
      className="flex items-center space-x-4 text-sm font-semibold text-jarvis-blue"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="w-3 h-3 rounded-full shadow-jarvis-glow"
        animate={{ backgroundColor: indicatorColor }}
        transition={{ duration: 0.3 }}
      />
      <motion.span
        key={statusText} // Key to trigger animation on text change
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 5 }}
        transition={{ duration: 0.2 }}
        className="uppercase"
      >
        {statusText}
      </motion.span>
    </motion.div>
  );
};

export default StatusBar;
