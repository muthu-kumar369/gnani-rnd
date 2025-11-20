// /react/src/components/gnani/StatusBar.tsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface StatusBarProps {
  status: string; // e.g., 'IDLE', 'LISTENING', 'THINKING', 'SPEAKING'
  isMicActive: boolean;
}

const StatusBar: React.FC<StatusBarProps> = ({ status, isMicActive }) => {
  return (
    <div className="w-full h-12 flex items-center justify-center p-2 bg-black/30 backdrop-blur-md border-t border-b border-cyan-300/30">
      <div className="w-full max-w-4xl flex items-center justify-between">
        
        {/* Left-side HUD elements */}
        <div className="flex items-center gap-4">
            <motion.div
              className="w-3 h-3 rounded-full"
              style={{
                backgroundColor: isMicActive ? '#00ff00' : '#ff0000',
                boxShadow: `0 0 8px ${isMicActive ? '#00ff00' : '#ff0000'}`
              }}
              animate={{
                scale: isMicActive ? [1, 1.2, 1] : 1
              }}
              transition={{
                duration: 1,
                repeat: isMicActive ? Infinity : 0,
              }}
            />
            <span className="text-xs font-mono uppercase text-cyan-300">REC</span>
        </div>

        {/* Center Status Text */}
        <div className="flex-1 text-center">
            <AnimatePresence mode="wait">
                <motion.span
                    key={status}
                    className="text-lg font-bold uppercase tracking-widest text-cyan-200"
                    style={{
                        textShadow: '0 0 5px rgba(0, 255, 255, 0.7)'
                    }}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.3 }}
                >
                    {status}
                </motion.span>
            </AnimatePresence>
        </div>

        {/* Right-side HUD elements */}
        <div className="flex items-center gap-4 text-cyan-300">
            <span className="text-xs font-mono">SYS_OK</span>
            <div className="w-12 h-4 border border-cyan-300/50 flex items-center p-0.5">
                <motion.div 
                    className="h-full bg-cyan-300"
                    initial={{ width: '80%' }}
                    animate={{ width: ['80%', '60%', '90%', '70%', '80%'] }}
                    transition={{
                        duration: 10,
                        repeat: Infinity,
                        ease: 'easeInOut'
                    }}
                />
            </div>
        </div>
      </div>
    </div>
  );
};

export default StatusBar;