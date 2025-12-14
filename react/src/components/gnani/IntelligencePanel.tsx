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
      case 'idle': return 'text-type-muted';
      case 'initializing': return 'text-status-warning';
      case 'wake-word-listening': return 'text-status-warning';
      case 'mic-recording': return 'text-gnani-primary';
      case 'streaming': return 'text-gnani-primary';
      case 'receiving-stt': return 'text-gnani-secondary';
      case 'thinking': return 'text-gnani-primary';
      case 'responding': return 'text-status-success';
      case 'error': return 'text-status-error';
      default: return 'text-type-muted';
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="absolute top-4 right-4 z-50 w-80 bg-canvas-panel bg-opacity-95 backdrop-blur-sm border border-gnani-primary/50 rounded-lg p-4 font-mono text-sm shadow-lg"
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={panelVariants}
        >
          <h3 className="text-lg font-bold text-gnani-primary mb-3 border-b border-gnani-primary/50 pb-2">
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
              Audio Level: <span className="text-gnani-primary">{(audioLevel * 100).toFixed(1)}%</span>
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

            {/* Simulation Controls for Verification */}
            <div className="mt-4 pt-4 border-t border-gnani-primary/30">
              <h4 className="text-xs font-bold text-gnani-secondary mb-2 uppercase">Simulation Controls</h4>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('test:wake'))}
                  className="px-2 py-1 bg-gnani-primary/10 hover:bg-gnani-primary/20 border border-gnani-primary/30 rounded text-xs text-gnani-primary transition-colors"
                >
                  Simulate Wake
                </button>
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('test:stt', { detail: { text: "Hello Gnani" } }))}
                  className="px-2 py-1 bg-gnani-primary/10 hover:bg-gnani-primary/20 border border-gnani-primary/30 rounded text-xs text-gnani-primary transition-colors"
                >
                  Simulate STT
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default IntelligencePanel;
