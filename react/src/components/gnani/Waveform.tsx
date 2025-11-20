// /react/src/components/gnani/Waveform.tsx
import React from 'react';
import { motion } from 'framer-motion';

type AppState = "idle" | "wake" | "listening" | "thinking" | "speaking";

interface WaveformProps {
  audioLevel: number;
  appState: AppState;
}

const Waveform: React.FC<WaveformProps> = ({ audioLevel, appState }) => {
  const normalizedLevel = Math.max(0, Math.min(1, audioLevel)); // Ensure between 0 and 1
  const baseHeight = 10;
  const maxHeight = 80;
  const minOpacity = 0.3;
  const maxOpacity = 1;

  const amplitude = normalizedLevel * (maxHeight - baseHeight);
  const isListening = appState === 'listening' || appState === 'thinking';
  const animationDuration = isListening ? 0.4 : 1.2;
  const repeatDelay = isListening ? 0.1 : 0.2;

  return (
    <div className="flex justify-center items-center space-x-2 h-24">
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="w-2 rounded-full bg-jarvis-blue shadow-jarvis-glow"
          animate={{
            height: [baseHeight, baseHeight + amplitude, baseHeight],
            opacity: [minOpacity, maxOpacity, minOpacity],
            scaleY: [1, 1 + normalizedLevel * 0.5, 1],
          }}
          transition={{
            duration: animationDuration,
            repeat: Infinity,
            repeatType: 'reverse',
            delay: i * repeatDelay,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
};

export default Waveform;
