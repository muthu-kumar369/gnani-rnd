import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GnaniAppStatus } from '../../hooks/useGnaniUIState';
import { useGnaniUIState } from '../../hooks/useGnaniUIState';
import useMicrophone from '../../hooks/useMicrophone';

interface IntelligencePanelProps {
  isVisible: boolean;
}

const IntelligencePanel: React.FC<IntelligencePanelProps> = ({ isVisible }) => {
  const uiState = useGnaniUIState();
  const { audioLevel } = useMicrophone();

  const panelVariants = {
    hidden: { opacity: 0, x: '100%', transition: { duration: 0.3 } },
    visible: { opacity: 1, x: '0%', transition: { duration: 0.3 } },
  };

  const getStatusColor = (status: GnaniAppStatus) => {
    switch (status) {
      case 'idle': return 'text-gray-400';
      case 'initializing': return 'text-yellow-400';
      case 'wake-word-listening': return 'text-orange-400';
      case 'mic-recording': return 'text-cyan-400';
      case 'streaming': return 'text-blue-400';
      case 'receiving-stt': return 'text-indigo-400';
      case 'thinking': return 'text-purple-400';
      case 'responding': return 'text-green-400';
      case 'error': return 'text-red-500';
      default: return 'text-gray-400';
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="absolute top-4 right-4 z-50 w-80 bg-black bg-opacity-70 backdrop-blur-sm border border-cyan-700 rounded-lg p-4 font-mono text-sm shadow-lg"
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={panelVariants}
        >
          <h3 className="text-lg font-bold text-cyan-300 mb-3 border-b border-cyan-700 pb-2">
            GNANI Intelligence
          </h3>
          <div className="space-y-2">
            <p>
              Status:{' '}
              <span className={`font-semibold ${getStatusColor(uiState.appStatus)}`}>
                {uiState.appStatus.toUpperCase()}
              </span>
            </p>
            <p>
              Wake Word:{' '}
              <span className={uiState.isWakeWordReady ? 'text-green-400' : 'text-red-400'}>
                {uiState.isWakeWordReady ? 'READY' : 'OFFLINE'}
              </span>
            </p>
            <p>
              Mic Active:{' '}
              <span className={uiState.isMicActive ? 'text-green-400' : 'text-red-400'}>
                {uiState.isMicActive ? 'YES' : 'NO'}
              </span>
            </p>
            <p>
              Audio Level: <span className="text-cyan-300">{(audioLevel * 100).toFixed(1)}%</span>
            </p>
            <p>
              Stream Connected:{' '}
              <span className={uiState.isStreamConnected ? 'text-green-400' : 'text-red-400'}>
                {uiState.isStreamConnected ? 'YES' : 'NO'}
              </span>
            </p>
            {uiState.streamErrorMessage && (
              <p>
                Stream Error:{' '}
                <span className="text-red-500">{uiState.streamErrorMessage}</span>
              </p>
            )}
            {/* Add more metrics here as they become available */}
            {/* Example for future metrics: */}
            {/* <p>STT Latency: <span className="text-cyan-300">N/A</span></p> */}
            {/* <p>Model Latency: <span className="text-cyan-300">N/A</span></p> */}
            {/* <p>Packets Sent: <span className="text-cyan-300">N/A</span></p> */}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default IntelligencePanel;
