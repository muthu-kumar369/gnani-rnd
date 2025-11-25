import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { GnaniAppStatus } from '../../hooks/useGnaniUIState';
import { RespondingBars, ThinkingBars, ErrorBars, MicVisualizerBars } from './WaveformBars';

interface WaveformProps {
  audioLevel: number; // Normalized 0-1
  isMicActive: boolean;
  status: GnaniAppStatus;
}

const BAR_COUNT = 64;

const Waveform: React.FC<WaveformProps> = ({ audioLevel, isMicActive, status }) => {
  const audioHistory = useRef<number[]>(new Array(BAR_COUNT).fill(0)).current;

  useEffect(() => {
    if (isMicActive && status !== 'responding' && status !== 'thinking') {
      audioHistory.pop();
      audioHistory.unshift(audioLevel);
    } else {
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
        return <RespondingBars />;
      case 'thinking':
        return <ThinkingBars />;
      case 'error':
        return <ErrorBars />;
      default:
        return <MicVisualizerBars audioHistory={audioHistory} />;
    }
  };

  return (
    <div className="relative w-full h-32 flex justify-center items-center gap-1">
      {renderBars()}
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
                duration: 0.8 + Math.random() * 1.5,
                repeat: Infinity,
                ease: "linear",
            }}
            />
        ))}
        {status === 'responding' && Array.from({ length: 30 }).map((_, i) => (
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
                 y: [0, -80, 0],
                 x: [Math.random() * 400 - 200, Math.random() * 400 - 200],
                 opacity: [0, 1, 0],
                 scale: [1, 2, 1],
             }}
             transition={{
                 duration: 0.5 + Math.random() * 1,
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