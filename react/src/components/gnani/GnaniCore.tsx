import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Terminal } from "lucide-react";
import { useGnaniUIState } from "../../hooks/useGnaniUIState";
import useMicrophone from "../../hooks/useMicrophone";
import { useAuth } from "../../context/AuthContext";
import { useUser } from "../../context/UserContext";
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
// import AvatarContainer from "./avatar/AvatarContainer";
import StatusDisplay from "./StatusDisplay";
import TerminalPanel from "../terminal/TerminalPanel";
import SystemIndicators from "../device/SystemIndicators";
import DeviceStatsHUD from "../device/DeviceStatsHUD";

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

  const { user, loading } = useUser(); // Access user data from UserContext

  useEffect(() => {
    streamingTTSRef.current = new StreamingTTS();
    return () => {
      streamingTTSRef.current?.cleanup();
    };
  }, []);

  // Sync User Settings to UI State
  useEffect(() => {
    if (user?.settings) {
      if (user.settings.avatarEnabled !== undefined) {
        uiState.setAvatarEnabled(user.settings.avatarEnabled);
      }
      if (user.settings.avatarGender) {
        uiState.setAvatarGender(user.settings.avatarGender);
      }
    }
  }, [user?.settings, uiState.setAvatarEnabled, uiState.setAvatarGender]);

  // Sync Avatar Gender to StreamingTTS
  useEffect(() => {
    if (streamingTTSRef.current && uiState.avatarGender) {
      streamingTTSRef.current.setVoiceGender(uiState.avatarGender);
    }
  }, [uiState.avatarGender]);

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

  useEffect(() => {
    const handleInterruption = () => {
      errorLogger.info('TTS Interrupted event received', { context: 'GnaniCore' });
      handleBargeIn();
    };

    window.addEventListener('tts:interrupted', handleInterruption);
    return () => {
      window.removeEventListener('tts:interrupted', handleInterruption);
    };
  }, [state]);

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
        <header className="flex justify-between items-center h-20 shrink-0 z-50">
          <div className="text-left relative group cursor-default">
            <div className="absolute -inset-2 bg-jarvis-blue/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <h1
              className="relative text-3xl font-bold uppercase text-jarvis-blue tracking-[0.2em]"
              style={{ textShadow: "0 0 10px rgba(0, 240, 255, 0.8)" }}
            >
              GNANI
            </h1>
            <div className="flex items-center gap-2">
              <div className="h-[1px] w-8 bg-jarvis-blue/50" />
              <p className="text-xs text-jarvis-cyan/70 font-mono tracking-widest uppercase">System v2.0 Online</p>
            </div>
          </div>
          <div className="text-right flex gap-4 items-center">
            <SystemIndicators />

            <div className="h-8 w-[1px] bg-jarvis-border mx-2" />

            <button
              onClick={() => setShowTerminal(!showTerminal)}
              className={`px-4 py-2 text-xs font-mono tracking-wider border rounded-sm transition-all duration-300 flex items-center gap-2 relative overflow-hidden group ${showTerminal
                ? "bg-jarvis-blue/20 border-jarvis-blue text-jarvis-blue shadow-jarvis-glow"
                : "bg-jarvis-panel border-jarvis-border text-jarvis-cyan/70 hover:text-jarvis-blue hover:border-jarvis-blue hover:shadow-jarvis-border-glow"
                }`}
            >
              <div className="absolute inset-0 bg-jarvis-blue/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              <Terminal size={14} />
              TERMINAL
            </button>
            {false && <button
              onClick={() => setShowIntelligencePanel(!showIntelligencePanel)}
              className={`px-4 py-2 text-xs font-mono tracking-wider border rounded-sm transition-all duration-300 relative overflow-hidden group ${showIntelligencePanel
                ? "bg-jarvis-blue/20 border-jarvis-blue text-jarvis-blue shadow-jarvis-glow"
                : "bg-jarvis-panel border-jarvis-border text-jarvis-cyan/70 hover:text-jarvis-blue hover:border-jarvis-blue hover:shadow-jarvis-border-glow"
                }`}
            >
              <div className="absolute inset-0 bg-jarvis-blue/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              {showIntelligencePanel ? "HIDE DEBUG" : "DEBUG"}
            </button>}
            <button
              onClick={() => setShowSettings(true)}
              className="px-4 py-2 text-xs font-mono tracking-wider bg-jarvis-panel hover:bg-jarvis-blue/20 border border-jarvis-border hover:border-jarvis-blue rounded-sm transition-all duration-300 text-jarvis-cyan/70 hover:text-jarvis-blue hover:shadow-jarvis-border-glow relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-jarvis-blue/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              SETTINGS
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
            <AnimationWrapper state={currentUIStatus} audioLevel={audioLevel} />
            {!loading && (
              // AvatarContainer hidden by request
              null
              /* <AvatarContainer
               status={currentUIStatus}
               isSpeaking={isSpeaking}
               avatarEnabled={uiState.avatarEnabled}
               avatarGender={uiState.avatarGender}
             /> */
            )}
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

      {/* Device Stats HUD - Fixed at bottom right */}
      <div className="absolute bottom-6 right-6 z-50">
        <DeviceStatsHUD />
      </div>

      <TerminalPanel isVisible={showTerminal} onToggle={() => setShowTerminal(!showTerminal)} />

      <IntelligencePanel isVisible={showIntelligencePanel} />

      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
    </div>
  );
};

export default GnaniCore;
