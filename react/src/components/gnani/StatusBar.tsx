// /react/src/components/gnani/StatusBar.tsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GnaniAppStatus } from '../../hooks/useGnaniUIState'; // Import the new status type

/**
 * @interface StatusBarProps
 * @property {GnaniAppStatus} status - The current application status to display.
 * @property {boolean} isMicActive - Indicates if the microphone is currently active.
 */
interface StatusBarProps {
  status: GnaniAppStatus; // Use the comprehensive GnaniAppStatus type
}

/**
 * @component StatusBar
 * @description Displays the current application status, microphone activity, and system health indicators.
 * @param {StatusBarProps} props - The props for the StatusBar component.
 */
const StatusBar: React.FC<StatusBarProps> = ({ status }) => {
    const getMicIndicatorColor = (currentStatus: GnaniAppStatus) => {
        switch (currentStatus) {
            case 'mic-recording':
            case 'streaming':
            case 'receiving-stt': return '#00ff00'; // Green for active mic
            case 'wake-word-listening': return '#FFA500'; // Orange for wake word
            case 'error': return '#ff0000'; // Red for error
            default: return '#555555'; // Grey for idle/inactive
        }
    };

    const micIndicatorColor = getMicIndicatorColor(status);

    const getHealthBarWidth = (currentStatus: GnaniAppStatus) => {
        switch (currentStatus) {
            case 'error': return '20%';
            case 'thinking': return '40%';
            case 'responding': return '100%';
            default: return '80%';
        }
    };

    const healthBarWidth = getHealthBarWidth(status);

  return (
    <div className="w-full h-12 flex items-center justify-center p-2 bg-black/30 backdrop-blur-md border-t border-b border-cyan-300/30">
      <div className="w-full max-w-4xl flex items-center justify-between">
        
        {/* Left-side HUD elements */}
        <div className="flex items-center gap-4">
            <motion.div
              className="w-3 h-3 rounded-full"
              style={{
                backgroundColor: micIndicatorColor,
                boxShadow: `0 0 8px ${micIndicatorColor}`
              }}
              animate={{
                scale: (status === 'mic-recording' || status === 'wake-word-listening' || status === 'streaming' || status === 'receiving-stt') ? [1, 1.1, 1] : 1,
                opacity: (status === 'error') ? [1, 0.5, 1] : 1,
              }}
              transition={{
                duration: (status === 'error') ? 0.5 : 1.5,
                repeat: Infinity,
                ease: "easeInOut",
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
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    transition={{ duration: 0.2 }}
                >
                    {status.replace(/-/g, ' ')} {/* Replace hyphens for better display */}
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
                    animate={{ width: healthBarWidth }}
                    transition={{
                        duration: (status === 'thinking' || status === 'responding') ? 0.5 : 2,
                        repeat: Infinity,
                        repeatType: 'mirror',
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