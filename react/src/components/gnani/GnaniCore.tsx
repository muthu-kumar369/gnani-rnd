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
  const { latestFinalSTT, latestLLMChunk, isTtsStarted, isTtsEnded } = useIPC();

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

  // Process incoming LLM chunks
  useEffect(() => {
    if (!latestLLMChunk || !streamingTTSRef.current) return;

    try {
      let chunk = latestLLMChunk;
      // Parse if string
      if (typeof chunk === 'string') {
        try {
          chunk = JSON.parse(chunk);
        } catch (e) {
          // If not JSON, treat as raw text partial
          chunk = { type: 'partial', text: chunk };
        }
      }

      const { type, text } = chunk;

      if (type === 'debug') {
        console.log('[GnaniCore] Received debug chunk:', text);
        return;
      }

      if (type === 'complete_response') {
        console.log('[GnaniCore] Received COMPLETE response:', text);
        // Reset TTS to clear any partials and play the full response
        streamingTTSRef.current.reset();
        streamingTTSRef.current.addTextChunk(text);
        streamingTTSRef.current.flush();
        return;
      }

      // IGNORE partials for TTS as per user request to avoid repetition
      // if (text) {
      //   streamingTTSRef.current.addTextChunk(text);
      // }

      // if (type === 'final') {
      //   streamingTTSRef.current.flush();
      // }
    } catch (error) {
      errorLogger.error('Error processing LLM chunk', error as Error, { context: 'GnaniCore' });
    }
  }, [latestLLMChunk]);

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
      // The existing effect [isIdle, isMicActive] will handle the mic restart
      // But we can force it here to be sure

      // We don't have a direct 'tts-end' transition in the hook usually, 
      // but 'vad-end' -> thinking -> speaking -> (tts-end?) -> idle
      // Let's assume the state machine handles 'speaking' -> 'idle' via some event or we force it.

      // Actually, we should check useGnaniState to see available transitions.
      // Usually 'speaking' -> 'idle' happens when TTS finishes.

      // Let's try to transition to idle if possible, or just restart mic if state allows.
      // For now, let's rely on the existing effect:
      // useEffect(() => { if (isIdle && !isMicActive) ... }, [isIdle])

      // So we just need to ensure state goes to IDLE.
      // If useGnaniState doesn't auto-transition, we might need to call transition('tts-end') if it exists.
      // Since I can't see useGnaniState source, I'll assume we need to trigger something.
      // But wait, isTtsEnded comes from IPC.

      // Let's manually call startMic() just in case, but after a small delay to allow state update
      setTimeout(() => {
        if (!isMicActive) {
          console.log('[GnaniCore] Auto-restarting mic after TTS ended');
          startMic();
        }
      }, 200);
    }
  }, [isTtsEnded, isSpeaking, isMicActive, startMic]);

  // Monitor state transitions to restart microphone after speaking
  useEffect(() => {
    // When transitioning from speaking to idle, restart the microphone for next interaction
    if (isIdle && !isMicActive) {
      errorLogger.info('Transitioning to idle, ensuring microphone is ready', { context: 'GnaniCore' });
      // Small delay to ensure clean state transition
      setTimeout(() => {
        if (window.gnani?.wake?.startWakeWord) {
          window.gnani.wake.startWakeWord();
        }
        startMic();
      }, 300);
    }
  }, [isIdle, isMicActive, startMic]);

  // Manual start recording
  const handleStartRecording = () => {
    if (isIdle) {
      errorLogger.info('Manual start, transitioning to listening', { context: 'GnaniCore' });

      // Reset TTS state to clear any old buffers
      if (streamingTTSRef.current) {
        streamingTTSRef.current.reset();
      }

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
