// react/src/components/gnani/WaveformBars.tsx
import React from 'react';
import { motion, useTime, useTransform } from 'framer-motion';

const BAR_COUNT = 64;
const bars = Array.from({ length: BAR_COUNT });

export const RespondingBars: React.FC = () => {
  const time = useTime();
  return (
    <>
      {bars.map((_, index) => {
        const sine = useTransform(time, t => {
          const angle = (t / 150) + (index * 0.2);
          return Math.sin(angle) * 40 + 70;
        });
        return (
          <motion.div
            key={index}
            className="w-2 rounded-full"
            style={{
              background: `linear-gradient(to top, rgba(0,255,255,0.8), rgba(100,255,255,1))`,
              boxShadow: `0 0 5px rgba(0,255,255,1), 0 0 10px rgba(100,255,255,0.8)`,
              height: sine
            }}
            transition={{ type: 'spring', stiffness: 250, damping: 20 }}
          />
        );
      })}
    </>
  );
};

export const ThinkingBars: React.FC = () => {
  const time = useTime();
  return (
    <>
      {bars.map((_, index) => {
        const pulse = useTransform(time, t => {
          const angle = (t / 300) + (index * 0.15);
          const pulseValue = Math.pow(Math.sin(angle), 10);
          return 15 + pulseValue * 50;
        });
        return (
          <motion.div
            key={index}
            className="w-2 rounded-full"
            style={{
              background: `linear-gradient(to top, rgba(120, 200, 255, 0.7), rgba(170, 230, 255, 1))`,
              boxShadow: `0 0 3px rgba(120,200,255,0.8), 0 0 6px rgba(120,200,255,0.5)`,
              height: pulse
            }}
            transition={{ type: 'spring', stiffness: 220, damping: 25 }}
          />
        );
      })}
    </>
  );
};

export const ErrorBars: React.FC = () => {
  return (
    <>
      {bars.map((_, index) => (
        <motion.div
          key={index}
          className="w-2 rounded-full"
          style={{
            height: '8px',
            background: 'rgba(255, 70, 70, 0.9)',
            boxShadow: `0 0 5px rgba(255,70,70,0.8)`
          }}
          initial={{ opacity: 0.5 }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </>
  );
};

interface MicVisualizerBarsProps {
  audioHistory: number[];
}

export const MicVisualizerBars: React.FC<MicVisualizerBarsProps> = ({ audioHistory }) => {
  return (
    <>
      {bars.map((_, index) => {
        const historyIndex = Math.floor((index / BAR_COUNT) * audioHistory.length);
        const height = Math.max(2, (audioHistory[historyIndex] || 0) * 120);

        return (
          <motion.div
            key={index}
            className="w-2 rounded-full"
            style={{
              background: `linear-gradient(to top, rgba(0,255,255,0.6), rgba(0,255,255,1))`,
              boxShadow: `0 0 3px rgba(0,255,255,0.9), 0 0 6px rgba(0,255,255,0.6)`
            }}
            animate={{ height: `${height}px` }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          />
        );
      })}
    </>
  );
};
