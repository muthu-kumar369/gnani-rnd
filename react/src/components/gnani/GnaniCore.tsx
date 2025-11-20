// /react/src/components/gnani/GnaniCore.tsx
import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

import { useIPC } from '../../hooks/useIPC';
import useMicrophone from '../../hooks/useMicrophone';

import HUDBackground from './HUDBackground';
import AIAvatar from './AIAvatar';
import MicButton from './MicButton';
import Waveform from './Waveform';
import StatusBar from './StatusBar';
import ResponseConsole from './ResponseConsole';

const GnaniCore: React.FC = () => {
  const { status, messages, isWakeWordReady, isVADReady } = useIPC();
  const { audioLevel, isMicActive, startMic, stopMic } = useMicrophone();

  // This useEffect ensures the UI's mic state (`isMicActive`) stays in sync with the app's status.
  // It will automatically start the mic when the app enters a listening state,
  // but it will NOT automatically stop it. Stopping is handled by the user via the toggle button.
  useEffect(() => {
    if (status === 'listening' && !isMicActive) {
      startMic();
    }
  }, [status, isMicActive, startMic]);

  const handleToggle = () => {
    // This is now the single point of user-driven control.
    // It tells the VAD to start or stop, which in turn controls the mic.
    if (status === 'listening') {
        window.gnani?.send('vad:stop');
    } else {
        window.gnani?.send('vad:start');
    }
  };


  return (
    <div className="relative w-screen h-screen overflow-hidden font-sans text-white">
      <HUDBackground />

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
            <p className="text-sm text-cyan-400">WAKE: {isWakeWordReady ? 'READY' : 'OFFLINE'}</p>
            <p className="text-sm text-cyan-400">VAD: {isVADReady ? 'READY' : 'OFFLINE'}</p>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col items-center justify-center gap-8 py-4">
          <AIAvatar status={status} />
          <div className="w-full max-w-2xl">
            <Waveform audioLevel={audioLevel} isMicActive={isMicActive} />
          </div>
          <div className="w-full max-w-4xl">
            <ResponseConsole messages={messages} />
          </div>
        </main>

        {/* Footer Section - Mic Button is in a separate layer */}
        <footer className="w-full absolute bottom-0 left-0 p-4 md:p-8">
            <StatusBar status={status.toUpperCase()} isMicActive={isMicActive} />
        </footer>
      </motion.div>
      
      {/* Floating Mic Button Layer */}
      <div className="absolute bottom-16 md:bottom-24 left-1/2 -translate-x-1/2 z-20">
         <MicButton isMicActive={isMicActive} onStart={handleToggle} onStop={handleToggle} />
      </div>
    </div>
  );
};

export default GnaniCore;
