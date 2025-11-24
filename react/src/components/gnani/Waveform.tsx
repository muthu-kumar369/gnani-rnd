import React, { useRef, useEffect } from 'react';
import { motion, useTime, useTransform } from 'framer-motion';
import { GnaniAppStatus } from '../../hooks/useGnaniUIState';


interface WaveformProps {
  audioLevel: number; // Normalized 0-1
  isMicActive: boolean;
  status: GnaniAppStatus;
}

const BAR_COUNT = 64;

const Waveform: React.FC<WaveformProps> = ({ audioLevel, isMicActive, status }) => {
  const bars = Array.from({ length: BAR_COUNT });
  const audioHistory = useRef<number[]>(new Array(BAR_COUNT).fill(0)).current;
  const time = useTime();

  useEffect(() => {
    if (isMicActive && status !== 'responding' && status !== 'thinking') {
      // Shift history and add new value
      audioHistory.pop();
      audioHistory.unshift(audioLevel);
    } else {
      // Decay effect when mic is off or in other states
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
  }, [audioLevel, isMicActive, status, audioHistory]);

  const renderBars = () => {
    switch (status) {
      case 'responding':
        // Speech energy mode (sine wave)
        return bars.map((_, index) => {
          const sine = useTransform(time, t => {
            const angle = (t / 150) + (index * 0.2); // Faster oscillation
            return Math.sin(angle) * 40 + 70; // Oscillates between 30 and 110
          });
          return (
            <motion.div
              key={index}
              className="w-2 rounded-full"
              style={{
                background: `linear-gradient(to top, rgba(0,255,255,0.8), rgba(100,255,255,1))`,
                boxShadow: `0 0 5px rgba(0,255,255,1), 0 0 10px rgba(100,255,255,0.8)`
              }}
              animate={{ height: sine }}
              transition={{ type: 'spring', stiffness: 250, damping: 20 }} // Adjusted stiffness/damping
            />
          );
        });

      case 'thinking':
        // Subtle pulsing animation
         return bars.map((_, index) => {
            const pulse = useTransform(time, t => {
              const angle = (t / 300) + (index * 0.15); // Slightly faster pulse
              const pulseValue = Math.pow(Math.sin(angle), 10); // More defined pulse
              return 15 + pulseValue * 50; // Pulses between 15 and 65
            });
            return (
              <motion.div
                key={index}
                className="w-2 rounded-full"
                style={{
                    background: `linear-gradient(to top, rgba(120, 200, 255, 0.7), rgba(170, 230, 255, 1))`,
                    boxShadow: `0 0 3px rgba(120,200,255,0.8), 0 0 6px rgba(120,200,255,0.5)`
                }}
                animate={{ height: pulse }}
                transition={{ type: 'spring', stiffness: 220, damping: 25 }} // Adjusted stiffness/damping
              />
            );
          });


      case 'error':
        // Red, static waveform
        return bars.map((_, index) => (
          <motion.div
            key={index}
            className="w-2 rounded-full"
            style={{
              height: '8px', // Slightly more prominent
              background: 'rgba(255, 70, 70, 0.9)',
              boxShadow: `0 0 5px rgba(255,70,70,0.8)`
            }}
            initial={{ opacity: 0.5 }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
          />
        ));

      default:
        // Default mic audio visualization
        return bars.map((_, index) => {
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
              transition={{ type: 'spring', stiffness: 300, damping: 25 }} // Adjusted stiffness/damping
            />
          );
        });
    }
  };

  return (
    <div className="relative w-full h-32 flex justify-center items-center gap-1">
      {renderBars()}
       {/* Particle Energy Dots */}
       <div className="absolute inset-0 pointer-events-none">
        {isMicActive && (status === 'mic-recording' || status === 'streaming' || status === 'receiving-stt') && Array.from({ length: 20 }).map((_, i) => (
            <motion.div
            key={i}
            className="absolute w-1 h-1 bg-cyan-200 rounded-full"
            style={{
                filter: 'blur(1px)'
            }}
            initial={{ 
                x: Math.random() * 400 - 200, 
                y: Math.random() * 60,
                opacity: 0,
            }}
            animate={{
                y: [0, -audioLevel * 50 - 10, 0],
                x: [Math.random() * 400 - 200, Math.random() * 400 - 200],
                opacity: [0, 1, 0],
                scale: [1, 1.5, 1],
            }}
            transition={{
                duration: 0.8 + Math.random() * 1.5, // Faster, more varied duration
                repeat: Infinity,
                ease: "linear",
            }}
            />
        ))}
        {status === 'responding' && Array.from({ length: 30 }).map((_, i) => ( // More particles for responding
             <motion.div
             key={`resp-${i}`}
             className="absolute w-1.5 h-1.5 bg-cyan-100 rounded-full"
             style={{
                 filter: 'blur(1px)'
             }}
             initial={{ 
                 x: Math.random() * 400 - 200, 
                 y: Math.random() * 60,
                 opacity: 0,
             }}
             animate={{
                 y: [0, -80, 0], // Larger vertical movement
                 x: [Math.random() * 400 - 200, Math.random() * 400 - 200],
                 opacity: [0, 1, 0],
                 scale: [1, 2, 1], // Larger scale
             }}
             transition={{
                 duration: 0.5 + Math.random() * 1, // Fast and energetic
                 repeat: Infinity,
                 ease: "easeOut",
             }}
             />
        ))}
      </div>
    </div>
  );
};

export default Waveform;