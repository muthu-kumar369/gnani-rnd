import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Terminal } from "lucide-react";
import { useGnaniUIState } from "../../hooks/useGnaniUIState";
import useMicrophone from "../../hooks/useMicrophone";
import { useAuth } from "../../context/AuthContext";
import { useIPC } from "../../hooks/useIPC";
import { useGnaniStateContext } from "../../context/GnaniStateContext";
import useBargeIn from "../../hooks/useBargeIn";
import useSpokenText from "../../hooks/useSpokenText";
import useConversationSync from "../../hooks/useConversationSync";
import StreamingTTS from "../../utils/streamingTTS";
import errorLogger from "../../utils/errorLogger";

import HUDBackground from "./HUDBackground";
import MicButton from "./MicButton";
import IntelligencePanel from "./IntelligencePanel";
import SpokenTextDisplay from "./SpokenTextDisplay";
import SettingsModal from "../settings/SettingsModal";
import AnimationWrapper from "./animations/AnimationWrapper";
import StatusDisplay from "./StatusDisplay";
import TerminalPanel from "../terminal/TerminalPanel";

const GnaniCore: React.FC = () => {
  const uiState = useGnaniUIState();
  const { audioLevel, isMicActive, startMic, stopMic } = useMicrophone();
  const { isAuthenticated } = useAuth();
  const { latestLLMChunk, latestFinalSTT, isTtsEnded, isTtsStarted, isWakeWordTriggered } = useIPC();

  const { state, transition, isIdle, isListening, isThinking, isSpeaking } = useGnaniStateContext();
  const spokenText = useSpokenText();
  useConversationSync();
  const streamingTTSRef = useRef<StreamingTTS | null>(null);

  const [showIntelligencePanel, setShowIntelligencePanel] = useState(false);
  const [showTerminal, setShowTerminal] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const lastProcessedFinalSTT = useRef<string | null>(null);

  useEffect(() => {
    streamingTTSRef.current = new StreamingTTS();
    return () => {
      streamingTTSRef.current?.cleanup();
    };
  }, []);

  useEffect(() => {
    if (!latestLLMChunk || !streamingTTSRef.current) return;

    try {
      let chunk = latestLLMChunk;
      if (typeof chunk === 'string') {
        try {
          chunk = JSON.parse(chunk);
        } catch (e) {
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
        streamingTTSRef.current.reset();
        streamingTTSRef.current.addTextChunk(text);
        streamingTTSRef.current.flush();
        return;
      }
    } catch (error) {
      errorLogger.error('Error processing LLM chunk', error as Error, { context: 'GnaniCore' });
    }
  }, [latestLLMChunk]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const init = async () => {
      setTimeout(() => {
        startMic();
        if (window.gnani?.wake?.startWakeWord) {
          window.gnani.wake.startWakeWord();
        }
      }, 500);
    };

    init();
  }, [isAuthenticated, startMic]);

  useEffect(() => {
    if (isWakeWordTriggered && isIdle) {
      errorLogger.info('Wake word triggered, transitioning to listening', { context: 'GnaniCore' });
      transition('wake-word-detected');
    }
  }, [isWakeWordTriggered, isIdle, transition]);

  useEffect(() => {
    if (latestFinalSTT && isListening && latestFinalSTT !== lastProcessedFinalSTT.current) {
      errorLogger.info('Final STT received, transitioning to thinking', { context: 'GnaniCore', text: latestFinalSTT });
      lastProcessedFinalSTT.current = latestFinalSTT;
      transition('vad-end');
    }
  }, [latestFinalSTT, isListening, transition]);

  useEffect(() => {
    if (isTtsStarted && isThinking) {
      errorLogger.info('TTS started, transitioning to speaking', { context: 'GnaniCore' });
      transition('tts-start');
    }
  }, [isTtsStarted, isThinking, transition]);

  useEffect(() => {
    if (isTtsEnded && isSpeaking) {
      errorLogger.info('TTS ended, transitioning to idle', { context: 'GnaniCore' });
      transition('tts-complete');
    }
  }, [isTtsEnded, isSpeaking, transition]);

  const handleBargeIn = () => {
    errorLogger.info('Barge-in triggered', { context: 'GnaniCore', currentState: state });

    if (streamingTTSRef.current) {
      streamingTTSRef.current.stop();
    }

    spokenText.clearText();
    spokenText.stopPlayback();

    transition('barge-in');

    if (!isMicActive) {
      startMic();
    }
  };

  const bargeIn = useBargeIn(state, handleBargeIn);

  useEffect(() => {
    if (isSpeaking) {
      bargeIn.updateConfig({ vadThreshold: 20 });
    } else {
      setTimeout(() => {
        if (!isMicActive) {
          startMic();
        }
      }, 200);
    }
  }, [isTtsEnded, isSpeaking, isMicActive, startMic, bargeIn]);

  useEffect(() => {
    if (isIdle && !isMicActive) {
      errorLogger.info('Transitioning to idle, ensuring microphone is ready', { context: 'GnaniCore' });
      setTimeout(() => {
        if (window.gnani?.wake?.startWakeWord) {
          window.gnani.wake.startWakeWord();
        }
        startMic();
      }, 300);
    }
  }, [isIdle, isMicActive, startMic]);

  const handleStartRecording = () => {
    if (isIdle) {
      errorLogger.info('Manual start, transitioning to listening', { context: 'GnaniCore' });
      if (streamingTTSRef.current) {
        streamingTTSRef.current.reset();
      }
      transition('manual-start');
      startMic();
    } else if (isSpeaking || isThinking) {
      bargeIn.handleManualBargeIn();
    }
  };

  const handleStopRecording = () => {
    if (isListening) {
      errorLogger.info('Manual stop, transitioning to thinking', { context: 'GnaniCore' });
      transition('manual-stop');
      stopMic();
    }
  };

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

  const getAnimationState = (): 'IDLE' | 'LISTENING' | 'THINKING' | 'SPEAKING' | 'ERROR' => {
    if (uiState.streamErrorMessage) return 'ERROR';

    switch (state) {
      case 'idle':
        return 'IDLE';
      case 'listening':
        return 'LISTENING';
      case 'thinking':
        return 'THINKING';
      case 'speaking':
        return 'SPEAKING';
      default:
        return 'IDLE';
    }
  };

  const currentUIStatus = getUIStatus();
  const animationState = getAnimationState();

  return (
    <div className="relative w-screen h-screen overflow-hidden font-sans text-white">
      <HUDBackground status={currentUIStatus} />

      <motion.div
        className="relative z-10 flex flex-col h-full p-4 md:p-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <header className="flex justify-between items-start h-20 shrink-0">
          <div className="text-left">
            <h1
              className="text-2xl font-bold uppercase text-cyan-200"
              style={{ textShadow: "0 0 8px rgba(0, 255, 255, 0.7)" }}
            >
              GNANI
            </h1>
            <p className="text-sm text-cyan-400">v2.0 HUD Interface</p>
          </div>
          <div className="text-right flex gap-2">
            <button
              onClick={() => setShowTerminal(!showTerminal)}
              className={`px-3 py-1 text-xs border rounded-full transition-colors flex items-center gap-2 ${showTerminal
                  ? "bg-cyan-800 border-cyan-400 text-cyan-100 shadow-[0_0_10px_rgba(6,182,212,0.3)]"
                  : "bg-cyan-900/50 hover:bg-cyan-800 border-cyan-500/30 text-cyan-300"
                }`}
            >
              <Terminal size={12} />
              Terminal
            </button>
            <button
              onClick={() => setShowIntelligencePanel(!showIntelligencePanel)}
              className="px-3 py-1 text-xs bg-cyan-900/50 hover:bg-cyan-800 border border-cyan-500/30 rounded-full transition-colors text-cyan-300"
            >
              {showIntelligencePanel ? "Hide Debug" : "Debug"}
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="px-3 py-1 text-xs bg-cyan-900/50 hover:bg-cyan-800 border border-cyan-500/30 rounded-full transition-colors text-cyan-300"
            >
              Settings
            </button>
          </div>
        </header>

        <main className="flex-1 flex flex-col items-center justify-end gap-8 pb-8">
          <div className="h-16 flex items-center justify-center">
            <SpokenTextDisplay
              words={spokenText.words}
              isVisible={isSpeaking && spokenText.words.length > 0}
            />
          </div>
        </main>

        <footer className="w-full absolute bottom-0 left-0 p-4 md:p-8 pointer-events-none">
        </footer>
      </motion.div>

      {/* Mic Button Area - Fixed at top-mid (35% from top) */}
      <div className="absolute left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-4" style={{ top: '35%' }}>
        <StatusDisplay status={animationState} subtext={uiState.streamErrorMessage || undefined} />

        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <AnimationWrapper state={animationState} audioLevel={audioLevel} />
          </div>

          <div className="relative z-10">
            <MicButton
              isMicActive={isMicActive}
              onStart={handleStartRecording}
              onStop={handleStopRecording}
              status={currentUIStatus}
              currentState={state}
            />
          </div>
        </div>
      </div>

      <TerminalPanel isVisible={showTerminal} onToggle={() => setShowTerminal(!showTerminal)} />

      <IntelligencePanel isVisible={showIntelligencePanel} />

      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  );
};

export default GnaniCore;
