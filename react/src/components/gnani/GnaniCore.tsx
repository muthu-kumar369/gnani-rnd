import { useGnaniUIState, Message } from '../../hooks/useGnaniUIState'; // Import useGnaniUIState and Message
import useMicrophone from '../../hooks/useMicrophone';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import errorLogger from '../../utils/errorLogger';

import HUDBackground from './HUDBackground';
import AIAvatar from './AIAvatar';
import MicButton from './MicButton';
import Waveform from './Waveform';
import StatusBar from './StatusBar';
import ResponseConsole from './ResponseConsole';
import IntelligencePanel from './IntelligencePanel'; // Import the new component


const GnaniCore: React.FC = () => {
  const { uiState } = useGnaniUIState(); // Use the unified UI state
  const { audioLevel, isMicActive, startMic, stopMic } = useMicrophone();
  const { logout } = useAuth();
  const { addToast } = useToast();
  
  const [showIntelligencePanel, setShowIntelligencePanel] = useState(false); // State for panel visibility

  // Effect to listen for force logout events from main process
  useEffect(() => {
    if (window.gnani?.auth?.onForceLogout) {
      const handleForceLogout = () => {
        errorLogger.info('Received auth:force-logout from main process. Logging out.', { context: 'GnaniCore' });
        addToast('Your session has expired. Please log in again.', 'error'); // Show error toast
        logout();
      };
      const unsubscribe = window.gnani.auth.onForceLogout(handleForceLogout);
      return () => {
        unsubscribe();
      };
    }
  }, [logout, addToast]);

  const handleStartRecording = () => {
    startMic();
    window.gnani?.stream?.startStream(); // Start gRPC stream
  };

  const handleStopRecording = () => {
    stopMic();
    window.gnani?.stream?.stopStream(); // Stop gRPC stream
  };

  const currentStatus = uiState.streamErrorMessage ? `ERROR: ${uiState.streamErrorMessage}` : (uiState.isStreamConnected ? 'STREAMING' : 'IDLE');


  return (
    <div className="relative w-screen h-screen overflow-hidden font-sans text-white">
      <HUDBackground status={uiState.appStatus} />

      <motion.div
        className="relative z-10 flex flex-col h-full p-4 md:p-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        {/* Header Section */}
        <header className="flex justify-between items-start">
          <div className="text-left">
            <h1 className="text-2xl font-bold uppercase text-cyan-200" style={{ textShadow: '0 0 8px rgba(0, 255, 255, 0.7)' }}>GNANI</h1>
            <p className="text-sm text-cyan-400">v2.0 HUD Interface</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-cyan-400">WAKE: {uiState.isWakeWordReady ? 'READY' : 'OFFLINE'}</p>
            <p className="text-sm text-cyan-400">VAD: {uiState.isVADReady ? 'READY' : 'OFFLINE'}</p>
            <p className="text-sm text-cyan-400">STREAM: {currentStatus}</p>
            <button
              onClick={() => setShowIntelligencePanel(!showIntelligencePanel)}
              className="mt-2 px-3 py-1 text-xs bg-cyan-800 hover:bg-cyan-700 rounded-full transition-colors"
            >
              {showIntelligencePanel ? 'Hide Debug' : 'Show Debug'}
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col items-center justify-center gap-8 py-4">
          <AIAvatar status={uiState.appStatus} />
          <div className="w-full max-w-2xl">
            <Waveform audioLevel={audioLevel} isMicActive={isMicActive} status={uiState.appStatus} />
          </div>
          <div className="w-full max-w-4xl">
            <ResponseConsole messages={uiState.conversationMessages} />
          </div>
        </main>

        {/* Footer Section - Mic Button is in a separate layer */}
        <footer className="w-full absolute bottom-0 left-0 p-4 md:p-8">
            <StatusBar status={uiState.appStatus} />
        </footer>
      </motion.div>
      
      {/* Floating Mic Button Layer */}
      <div className="absolute bottom-16 md:bottom-24 left-1/2 -translate-x-1/2 z-20">
         <MicButton isMicActive={isMicActive} onStart={handleStartRecording} onStop={handleStopRecording} status={uiState.appStatus} />
      </div>

      {/* Intelligence Panel */}
      <IntelligencePanel isVisible={showIntelligencePanel} />
    </div>
  );
};

export default GnaniCore;

