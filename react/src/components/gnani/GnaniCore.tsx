import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal, History } from "lucide-react";
import { useGnaniUIState } from "../../hooks/useGnaniUIState";
import useMicrophone from "../../hooks/useMicrophone";
import { useIPC } from "../../hooks/useIPC";
import useBargeIn from "../../hooks/useBargeIn";
import useSpokenText from "../../hooks/useSpokenText";
import useConversationSync from "../../hooks/useConversationSync";
import { useGlobalHotkey } from "../../hooks/useGlobalHotkey";
import StreamingTTS from "../../utils/streamingTTS";
import errorLogger from "../../utils/errorLogger";
import { useScreenshot } from "../../hooks/useScreenshot";
import { useClipboard } from "../../hooks/useClipboard";
import { FileDropZone } from "./FileDropZone";

import HUDBackground from "./HUDBackground";
import MicButton from "./MicButton";
import IntelligencePanel from "./IntelligencePanel";
import SpokenTextDisplay from "./SpokenTextDisplay";
import SettingsModal from "../settings/SettingsModal";
import AnimationWrapper from "./animations/AnimationWrapper";
import StatusDisplay from "./StatusDisplay";
import TerminalPanel from "../terminal/TerminalPanel";
import SystemIndicators from "../device/SystemIndicators";
import DeviceStatsHUD from "../device/DeviceStatsHUD";
import ConversationSidebar from "../conversation/ConversationSidebar";
import ToolStatusIndicator from "./ToolStatusIndicator";

// Zustand Stores
import { useGnaniStore } from "../../store/useGnaniStore";
import { useConversationStore } from "../../store/useConversationStore";
import { useUserStore } from "../../store/useUserStore";

const GnaniCore: React.FC = () => {
  const uiState = useGnaniUIState();
  const { audioLevel, isMicActive, startMic, stopMic } = useMicrophone();

  // Zustand Hooks
  const { user, loading, isAuthenticated, accessToken } = useUserStore();
  const { state, transition, isIdle, isListening, isThinking, isSpeaking, _init: initGnaniStore } = useGnaniStore();
  const { addMessage, setSessionId, refreshConversation, clearMessages } = useConversationStore();

  const { latestLLMChunk, latestFinalSTT, isTtsEnded, isTtsStarted, isWakeWordTriggered, sessionId, toolStatus } = useIPC();

  const spokenText = useSpokenText();
  useConversationSync();
  useGlobalHotkey();
  const streamingTTSRef = useRef<StreamingTTS | null>(null);

  const [showIntelligencePanel, setShowIntelligencePanel] = useState(false);
  const [showTerminal, setShowTerminal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const lastProcessedFinalSTT = useRef<string | null>(null);

  // Initialize Gnani Store (State Machine)
  useEffect(() => {
    console.log('[GnaniCore] Initializing Gnani Store');
    initGnaniStore();
  }, [initGnaniStore]);

  // Debug: Log state changes
  useEffect(() => {
    console.log('[GnaniCore] State changed:', state, {
      isIdle,
      isListening,
      isThinking,
      isSpeaking
    });
  }, [state, isIdle, isListening, isThinking, isSpeaking]);

  // Debug: Log IPC state
  useEffect(() => {
    console.log('[GnaniCore] IPC State:', {
      isWakeWordTriggered,
      isTtsStarted,
      isTtsEnded,
      latestFinalSTT: latestFinalSTT?.substring(0, 50)
    });
  }, [isWakeWordTriggered, isTtsStarted, isTtsEnded, latestFinalSTT]);

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

  // Sync session ID from IPC to Store
  useEffect(() => {
    if (sessionId) {
      console.log('[GnaniCore] Syncing sessionId:', sessionId);
      setSessionId(sessionId);
      if (accessToken) {
        refreshConversation(accessToken);
      }
    }
  }, [sessionId, setSessionId, refreshConversation, accessToken]);

  const showNotification = (title: string, body: string) => {
    if (window.gnani?.notifications?.show) {
      window.gnani.notifications.show(title, body);
    }
  };

  useEffect(() => {
    if (toolStatus && toolStatus.status === 'completed') {
      addMessage({
        type: 'action',
        message: `Executed ${toolStatus.tool_name}: ${toolStatus.message}`,
        metadata: {
          actionType: toolStatus.tool_name
        }
      });
      showNotification('Tool Completed', `Executed ${toolStatus.tool_name}: ${toolStatus.message}`);
    }
  }, [toolStatus, addMessage]);

  useEffect(() => {
    if (!latestLLMChunk || !streamingTTSRef.current) return;

    try {
      // Unwrap the payload from useIPC wrapper
      let chunk = latestLLMChunk.payload;
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
      showNotification('Gnani Listening', 'Wake word detected');
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

  // Timeout guard for thinking state (10 seconds)
  useEffect(() => {
    if (isThinking) {
      console.log('[GnaniCore] Thinking state entered, setting 10s timeout guard');
      const timeout = setTimeout(() => {
        errorLogger.error('Thinking state timeout (10s), recovering to idle', null, { context: 'GnaniCore' });
        showNotification('Error', 'Response timeout - returning to idle');
        transition('error');
      }, 10000);

      return () => {
        console.log('[GnaniCore] Thinking state exited, clearing timeout');
        clearTimeout(timeout);
      };
    }
  }, [isThinking, transition]);

  // Timeout guard for speaking state (30 seconds)
  useEffect(() => {
    if (isSpeaking) {
      console.log('[GnaniCore] Speaking state entered, setting 30s timeout guard');
      const timeout = setTimeout(() => {
        errorLogger.error('Speaking state timeout (30s), recovering to idle', null, { context: 'GnaniCore' });
        showNotification('Error', 'TTS timeout - stopping playback');
        if (streamingTTSRef.current) {
          streamingTTSRef.current.stop();
        }
        transition('error');
      }, 30000);

      return () => {
        console.log('[GnaniCore] Speaking state exited, clearing timeout');
        clearTimeout(timeout);
      };
    }
  }, [isSpeaking, transition]);

  // Timeout guard for listening state (60 seconds)
  useEffect(() => {
    if (isListening) {
      console.log('[GnaniCore] Listening state entered, setting 60s timeout guard');
      const timeout = setTimeout(() => {
        errorLogger.warn('Listening state timeout (60s), transitioning to thinking', { context: 'GnaniCore' });
        showNotification('Info', 'Listening timeout - processing input');
        transition('manual-stop');
      }, 60000);

      return () => {
        console.log('[GnaniCore] Listening state exited, clearing timeout');
        clearTimeout(timeout);
      };
    }
  }, [isListening, transition]);

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

  // Connect VAD to barge-in for automatic interruption
  useEffect(() => {
    const handleVadSpeechFrame = (_event: any, data: { speech: boolean }) => {
      if (isSpeaking || isThinking) {
        console.log('[GnaniCore] VAD speech frame:', data.speech, 'State:', state);
        bargeIn.handleVADSpeech(data.speech);
      }
    };

    if (window.electron?.ipcRenderer) {
      console.log('[GnaniCore] Registering VAD speech frame listener for barge-in');
      window.electron.ipcRenderer.on('vad:speech-frame', handleVadSpeechFrame);
    }

    return () => {
      if (window.electron?.ipcRenderer) {
        console.log('[GnaniCore] Removing VAD speech frame listener');
        window.electron.ipcRenderer.removeAllListeners('vad:speech-frame');
      }
    };
  }, [isSpeaking, isThinking, bargeIn, state]);

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

  const handleScreenshot = (base64: string) => {
    console.log('Screenshot captured:', base64.substring(0, 50) + '...');
    addMessage({
      type: 'user',
      message: 'Screenshot captured',
      metadata: {
        image: base64,
        mimeType: 'image/png'
      }
    });

    if (window.gnani?.stream?.sendText) {
      window.gnani.stream.sendText(JSON.stringify({
        type: 'image',
        content: base64,
        mimeType: 'image/png'
      }));
    }
  };

  const handleClipboardPaste = (content: { type: 'text' | 'image', data: string }) => {
    console.log('Clipboard paste:', content.type);
    if (content.type === 'text') {
      addMessage({ type: 'user', message: content.data });
      if (window.gnani?.stream?.sendText) {
        window.gnani.stream.sendText(content.data);
      }
    } else if (content.type === 'image') {
      handleScreenshot(content.data);
    }
  };

  const handleFileDrop = async (files: File[]) => {
    console.log('Files dropped:', files);
    for (const file of files) {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = (reader.result as string).split(',')[1];
          handleScreenshot(base64);
        };
        reader.readAsDataURL(file);
      } else if (file.type === 'text/plain' || file.name.endsWith('.md') || file.name.endsWith('.ts') || file.name.endsWith('.js')) {
        const text = await file.text();
        addMessage({ type: 'user', message: `File: ${file.name}\n\n${text}` });
        if (window.gnani?.stream?.sendText) {
          window.gnani.stream.sendText(`Content of file ${file.name}:\n${text}`);
        }
      }
    }
  };

  useScreenshot(handleScreenshot);
  useClipboard(handleClipboardPaste);

  const currentUIStatus = getUIStatus();
  const animationState = getAnimationState();

  if (loading) {
    return null; // Or return <LoadingScreen /> if available and desired
  }

  return (
    <FileDropZone onFileDrop={handleFileDrop}>
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
                onClick={() => setShowHistory(!showHistory)}
                className={`px-4 py-2 text-xs font-mono tracking-wider border rounded-sm transition-all duration-300 flex items-center gap-2 relative overflow-hidden group ${showHistory
                  ? "bg-jarvis-blue/20 border-jarvis-blue text-jarvis-blue shadow-jarvis-glow"
                  : "bg-jarvis-panel border-jarvis-border text-jarvis-cyan/70 hover:text-jarvis-blue hover:border-jarvis-blue hover:shadow-jarvis-border-glow"
                  }`}
              >
                <div className="absolute inset-0 bg-jarvis-blue/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                <History size={14} />
                HISTORY
              </button>

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
            <div className="flex flex-col items-center gap-4">
              <AnimatePresence>
                {toolStatus && toolStatus.status && <ToolStatusIndicator status={toolStatus} />}
              </AnimatePresence>
              <div className="h-16 flex items-center justify-center">
                <SpokenTextDisplay
                  words={spokenText.words}
                  isVisible={isSpeaking && spokenText.words.length > 0}
                />
              </div>
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

        <ConversationSidebar
          isOpen={showHistory}
          onClose={() => setShowHistory(false)}
          onNewConversation={() => {
            setSessionId(null);
            clearMessages();
            // The next message sent will trigger a new session creation in the backend
            console.log("Starting new conversation...");
          }}
          onSelectConversation={(sessionId) => {
            console.log("Switching to conversation:", sessionId);
            setSessionId(sessionId);
            if (accessToken) {
              refreshConversation(accessToken);
            }
            // Notify Electron to switch session
            if (window.gnani?.stream?.setSessionId) {
              window.gnani.stream.setSessionId(sessionId);
            }
          }}
        />

        <IntelligencePanel isVisible={showIntelligencePanel} />

        <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
      </div>
    </FileDropZone>
  );
};

export default GnaniCore;
