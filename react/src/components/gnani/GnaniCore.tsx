import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useGnaniUIState } from "../../hooks/useGnaniUIState";
import useMicrophone from "../../hooks/useMicrophone";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { useIPC } from "../../hooks/useIPC";
import useGnaniState from "../../hooks/useGnaniState";
import useBargeIn from "../../hooks/useBargeIn";
import useSpokenText from "../../hooks/useSpokenText";
import StreamingTTS from "../../utils/streamingTTS";
import errorLogger from "../../utils/errorLogger";

import HUDBackground from "./HUDBackground";
import AIAvatar from "./AIAvatar";
import MicButton from "./MicButton";
import Waveform from "./Waveform";
import StatusBar from "./StatusBar";
import ResponseConsole from "./ResponseConsole";
import IntelligencePanel from "./IntelligencePanel";
import SpokenTextDisplay from "./SpokenTextDisplay";
import SettingsModal from "../settings/SettingsModal";

const GnaniCore: React.FC = () => {
  const uiState = useGnaniUIState();
  const { audioLevel, isMicActive, startMic, stopMic } = useMicrophone();
  const { logout, user } = useAuth();
  const { addToast } = useToast();
  const { latestFinalSTT, latestLLMChunk, isTtsStarted } = useIPC();

  // State machine - single source of truth
  const { state, transition, isIdle, isListening, isThinking, isSpeaking } = useGnaniState();

  // Spoken text display
  const spokenText = useSpokenText();

  // Streaming TTS
  const streamingTTSRef = useRef<StreamingTTS | null>(null);

  const [showIntelligencePanel, setShowIntelligencePanel] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Initialize StreamingTTS
  useEffect(() => {
    streamingTTSRef.current = new StreamingTTS();
    return () => {
      streamingTTSRef.current?.cleanup();
    };
  }, []);

  // Initialize Gnani
  useEffect(() => {
    if (!user) return;

    const init = async () => {
      // Small delay to ensure audio context is ready and prevent startup crashes
      setTimeout(() => {
        startMic();
        if (window.gnani?.wake?.startWakeWord) {
          window.gnani.wake.startWakeWord();
        }
      }, 500);
    };

    init();
  }, [user, startMic]);

  // Barge-in handler
  const handleBargeIn = () => {
    errorLogger.info('Barge-in triggered', { context: 'GnaniCore', currentState: state });

    // Stop TTS immediately
    if (streamingTTSRef.current) {
      streamingTTSRef.current.stop();
    }

    // Clear spoken text
    spokenText.clearText();
    spokenText.stopPlayback();

    // Transition to listening state
    transition('barge-in');

    // Start microphone if not already active
    if (!isMicActive) {
      startMic();
    }
  };

  // Barge-in hook
  const bargeIn = useBargeIn(state, handleBargeIn);

  // Dynamically adjust barge-in sensitivity
  // When speaking, increase threshold to prevent self-interruption (echo)
  useEffect(() => {
    if (isSpeaking) {
      bargeIn.updateConfig({ vadThreshold: 20 }); // Very low sensitivity (approx 600ms)
      console.log('[GnaniCore] Increased barge-in threshold to 20 (Speaking)');
      errorLogger.debug('Increased barge-in threshold to 20 (Speaking)', { context: 'GnaniCore' });
    } else {
      bargeIn.updateConfig({ vadThreshold: 3 }); // Default sensitivity (approx 90ms)
      console.log('[GnaniCore] Reset barge-in threshold to 3 (Not Speaking)');
      errorLogger.debug('Reset barge-in threshold to 3 (Not Speaking)', { context: 'GnaniCore' });
    }
  }, [isSpeaking, bargeIn]);

  // Handle auth logout
  useEffect(() => {
    if (window.gnani?.auth?.onForceLogout) {
      const handleForceLogout = () => {
        errorLogger.info(
          "Received auth:force-logout from main process. Logging out.",
          { context: "GnaniCore" }
        );
        addToast("Your session has expired. Please log in again.", "error");
        logout();
      };
      const unsubscribe = window.gnani.auth.onForceLogout(handleForceLogout);
      return () => {
        unsubscribe();
      };
    }
  }, [logout, addToast]);

  // Handle wake-word detection
  useEffect(() => {
    if (uiState.isWakeWordTriggered && isIdle) {
      errorLogger.info('Wake-word detected, transitioning to listening', { context: 'GnaniCore' });
      transition('wake-word-detected');
      startMic();
    }
  }, [uiState.isWakeWordTriggered, isIdle, transition, startMic]);

  // Handle VAD end of speech
  useEffect(() => {
    if (uiState.isAudioEnded && isListening) {
      errorLogger.info('VAD detected end of speech, transitioning to thinking', { context: 'GnaniCore' });
      transition('vad-end');
      stopMic();
    }
  }, [uiState.isAudioEnded, isListening, transition, stopMic]);

  // Handle final STT
  useEffect(() => {
    if (latestFinalSTT) {
      errorLogger.info(`Final STT received: "${latestFinalSTT}"`, { context: 'GnaniCore' });
      // User's text is already in conversation history
    }
  }, [latestFinalSTT]);

  // Handle LLM streaming chunks
  useEffect(() => {
    if (latestLLMChunk) {
      console.log('[GnaniCore] latestLLMChunk updated:', latestLLMChunk); // DEBUG LOG
      if (streamingTTSRef.current) {
        errorLogger.debug(`LLM chunk received: "${latestLLMChunk}"`, { context: 'GnaniCore' });

        // Add to TTS
        streamingTTSRef.current.addTextChunk(latestLLMChunk);

        // Add to spoken text display
        spokenText.addTextChunk(latestLLMChunk);
      } else {
        console.error('[GnaniCore] streamingTTSRef.current is NULL!'); // DEBUG LOG
      }
    }
  }, [latestLLMChunk, spokenText]);

  // Handle stream disconnection to flush TTS
  useEffect(() => {
    if (!uiState.isStreamConnected && streamingTTSRef.current) {
      console.log("[GnaniCore] Stream disconnected, flushing TTS");
      streamingTTSRef.current.flush();
    } else if (uiState.isStreamConnected && streamingTTSRef.current) {
      console.log("[GnaniCore] Stream connected, setting active state");
      streamingTTSRef.current.setStreamActive(true);
      streamingTTSRef.current.resume();
    }
  }, [uiState.isStreamConnected]);

  // Handle TTS start
  useEffect(() => {
    if (isTtsStarted && isThinking) {
      errorLogger.info('TTS started, transitioning to speaking', { context: 'GnaniCore' });
      transition('tts-start');
      spokenText.startPlayback();
    }
  }, [isTtsStarted, isThinking, transition, spokenText]);

  // Manual start recording
  const handleStartRecording = () => {
    if (isIdle) {
      errorLogger.info('Manual start, transitioning to listening', { context: 'GnaniCore' });
      transition('manual-start');
      startMic();
    } else if (isSpeaking || isThinking) {
      // Manual barge-in
      bargeIn.handleManualBargeIn();
    }
  };

  // Manual stop recording
  const handleStopRecording = () => {
    if (isListening) {
      errorLogger.info('Manual stop, transitioning to thinking', { context: 'GnaniCore' });
      transition('manual-stop');
      stopMic();
    }
  };

  // Map canonical state to UI status for existing components
  const getUIStatus = () => {
    switch (state) {
      case 'idle':
        return 'idle';
      case 'listening':
        return isMicActive ? 'mic-recording' : 'wake-word-listening';
      case 'thinking':
        return 'thinking';
      case 'speaking':
        return 'responding';
      default:
        return 'idle';
    }
  };

  const currentUIStatus = getUIStatus();
  const currentStatus = uiState.streamErrorMessage
    ? `ERROR: ${uiState.streamErrorMessage}`
    : uiState.isStreamConnected
      ? "STREAMING"
      : "IDLE";

  return (
    <div className="relative w-screen h-screen overflow-hidden font-sans text-white">
      <HUDBackground status={currentUIStatus} />

      <motion.div
        className="relative z-10 flex flex-col h-full p-4 md:p-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <header className="flex justify-between items-start">
          <div className="text-left">
            <h1
              className="text-2xl font-bold uppercase text-cyan-200"
              style={{ textShadow: "0 0 8px rgba(0, 255, 255, 0.7)" }}
            >
              GNANI
            </h1>
            <p className="text-sm text-cyan-400">v2.0 HUD Interface</p>
            <p className="text-xs text-cyan-300/70 mt-1">
              State: {state.toUpperCase()}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-cyan-400">
              WAKE: {uiState.isWakeWordReady ? "READY" : "OFFLINE"}
            </p>
            <p className="text-sm text-cyan-400">
              VAD: {uiState.isVADReady ? "READY" : "OFFLINE"}
            </p>
            <p className="text-sm text-cyan-400">STREAM: {currentStatus}</p>
            <button
              onClick={() => setShowIntelligencePanel(!showIntelligencePanel)}
              className="mt-2 px-3 py-1 text-xs bg-cyan-800 hover:bg-cyan-700 rounded-full transition-colors"
            >
              {showIntelligencePanel ? "Hide Debug" : "Show Debug"}
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="mt-2 ml-2 px-3 py-1 text-xs bg-cyan-800 hover:bg-cyan-700 rounded-full transition-colors"
            >
              Settings
            </button>
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center gap-8 py-4">
          <AIAvatar status={currentUIStatus} />

          {/* Spoken Text Display - shows what Gnani is currently saying */}
          <SpokenTextDisplay
            words={spokenText.words}
            isVisible={isSpeaking && spokenText.words.length > 0}
          />

          <div className="w-full max-w-2xl">
            <Waveform
              audioLevel={audioLevel}
              isMicActive={isMicActive}
              status={currentUIStatus}
            />
          </div>
          <div className="w-full max-w-4xl">
            <ResponseConsole messages={uiState.conversationMessages} />
          </div>
        </main>

        <footer className="w-full absolute bottom-0 left-0 p-4 md:p-8">
          <StatusBar status={currentUIStatus} />
        </footer>
      </motion.div>

      <div className="absolute bottom-16 md:bottom-24 left-1/2 -translate-x-1/2 z-20">
        <MicButton
          isMicActive={isMicActive}
          onStart={handleStartRecording}
          onStop={handleStopRecording}
          status={currentUIStatus}
        />
      </div>

      <IntelligencePanel isVisible={showIntelligencePanel} />

      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  );
};

export default GnaniCore;
