// /react/src/components/gnani/Waveform.tsx
import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

interface WaveformProps {
  audioLevel: number; // Normalized 0-1
  isMicActive: boolean;
}

const BAR_COUNT = 64;

const Waveform: React.FC<WaveformProps> = ({ audioLevel, isMicActive }) => {
  const bars = Array.from({ length: BAR_COUNT });
  const audioHistory = useRef<number[]>(new Array(BAR_COUNT).fill(0)).current;

  useEffect(() => {
    if (isMicActive) {
      // Shift history and add new value
      audioHistory.pop();
      audioHistory.unshift(audioLevel);
    } else {
      // Decay effect when mic is off
      const interval = setInterval(() => {
        const newHistory = audioHistory.map(val => Math.max(0, val * 0.8));
        audioHistory.splice(0, BAR_COUNT, ...newHistory);
        if (newHistory.every(val => val < 0.01)) {
          clearInterval(interval);
          audioHistory.fill(0);
        }
      }, 50);
      return () => clearInterval(interval);
    }
  }, [audioLevel, isMicActive, audioHistory]);

  return (
    <div className="relative w-full h-32 flex justify-center items-center gap-1">
      {bars.map((_, index) => {
        const historyIndex = Math.floor((index / BAR_COUNT) * audioHistory.length);
        const height = Math.max(2, audioHistory[historyIndex] * 120);

        return (
          <motion.div
            key={index}
            className="w-2 rounded-full"
            style={{
              background: `linear-gradient(to top, rgba(0,255,255,0.5), rgba(0,255,255,1))`,
              boxShadow: `0 0 2px rgba(0,255,255,0.8), 0 0 5px rgba(0,255,255,0.5)`
            }}
            animate={{ height: `${height}px` }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          />
        );
      })}
       {/* Particle Energy Dots */}
       <div className="absolute inset-0 pointer-events-none">
        {isMicActive && Array.from({ length: 20 }).map((_, i) => (
            <motion.div
            key={i}
            className="absolute w-1 h-1 bg-cyan-200 rounded-full"
            style={{
                filter: 'blur(1px)'
            }}
            initial={{ 
                x: Math.random() * 400 - 200, 
                y: Math.random() * 60,
            }}
            animate={{
                y: [0, -audioLevel * 50 - 10, 0],
                x: [Math.random() * 400 - 200, Math.random() * 400 - 200],
                opacity: [0, 1, 0],
                scale: [1, 1.5, 1],
            }}
            transition={{
                duration: 1 + Math.random() * 2,
                repeat: Infinity,
                ease: "linear",
            }}
            />
        ))}
      </div>
    </div>
  );
};

export default Waveform;