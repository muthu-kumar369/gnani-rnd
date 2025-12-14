import React, { useState, useEffect, useRef, useCallback } from "react";
import { eventManager } from "../../utils/eventManager";
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
import { useDeviceAwareness } from "../../hooks/useDeviceAwareness";
import { useAudioStream } from "../../hooks/useAudioStream";

import HUDBackground from "./HUDBackground";
import MicButton from "./MicButton";
import IntelligencePanel from "./IntelligencePanel";
import SpokenTextDisplay from "./SpokenTextDisplay";
// Modals moved to ChatLayout
import AnimationWrapper from "./animations/AnimationWrapper";
import StatusDisplay from "./StatusDisplay";
import TerminalPanel from "../terminal/TerminalPanel";
import SystemIndicators from "../device/SystemIndicators";
import DeviceStatsHUD from "../device/DeviceStatsHUD";
import ConversationSidebar from "../conversation/ConversationSidebar";
import ToolStatusIndicator from "./ToolStatusIndicator";
import TimeoutIndicator from "../common/TimeoutIndicator";

import { AudioManager } from "./AudioManager";
import { StateManager } from "./StateManager";

// Zustand Stores
import { useGnaniStore } from "../../store/useGnaniStore";
import { useConversationStore } from "../../store/useConversationStore";
import { useUserStore } from "../../store/useUserStore";
import { useModalStore } from "../../store/useModalStore";

import { X } from "lucide-react";

interface GnaniCoreProps {
  isOverlayMode?: boolean;
  onOverlayClose?: () => void;
}

const GnaniCore: React.FC<GnaniCoreProps> = ({ isOverlayMode = false, onOverlayClose }) => {
  const uiState = useGnaniUIState();
  const { audioLevel, isMicActive, startMic, stopMic } = useMicrophone();

  // Zustand Hooks
  const { user, loading, isAuthenticated, accessToken } = useUserStore();
  const { state, transition, isIdle, isListening, isThinking, isSpeaking, _init: initGnaniStore } = useGnaniStore();

  const { addMessage, setConversationId, conversationId, refreshConversation, clearMessages, updateLastMessageContent, updateMessageContent, setIsStreaming } = useConversationStore();

  const { latestLLMChunk, latestFinalSTT, isTtsEnded, isTtsStarted, isWakeWordTriggered, sessionId: grpcSessionId, conversationId: ipcConversationId, toolStatus } = useIPC();
  const { connectivityStatus } = useDeviceAwareness();

  const spokenText = useSpokenText();
  useConversationSync();
  useGlobalHotkey();
  const streamingTTSRef = useRef<StreamingTTS | null>(null);

  // Modal Store Selectors
  const openSettings = useModalStore(s => s.openSettings);

  // Note: Modals are now rendered in ChatLayout.tsx to ensure global availability
  // GnaniCore only triggers the opening via store.

  const [showIntelligencePanel, setShowIntelligencePanel] = useState(false);
  const [showTerminal, setShowTerminal] = useState(false);

  const [showHistory, setShowHistory] = useState(false);
  const lastProcessedFinalSTT = useRef<string | null>(null);
  const [timeoutSeconds, setTimeoutSeconds] = useState(30);
  const timeoutIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Gnani Store (State Machine)
  useEffect(() => {
    errorLogger.info('[GnaniCore] Initializing Gnani Store', { context: 'GnaniCore' });
    initGnaniStore();
  }, [initGnaniStore]);

  // Debug: Log state changes (Reduced to essential)
  useEffect(() => {
    /* console.log('[GnaniCore] State changed:', state, {
      isIdle, isListening, isThinking, isSpeaking
    }); */
  }, [state, isIdle, isListening, isThinking, isSpeaking]);

  // Debug: Log IPC state
  /* useEffect(() => {
    console.log('[GnaniCore] IPC State:', {
      isWakeWordTriggered,
      isTtsStarted,
      isTtsEnded,
      latestFinalSTT: latestFinalSTT?.substring(0, 50),
      grpcSessionId,
      ipcConversationId
    });
  }, [isWakeWordTriggered, isTtsStarted, isTtsEnded, latestFinalSTT]); */

  // Listen for legacy custom events (keyboard shortcuts etc) - Keeping for Voice Mode context
  useEffect(() => {
    const handleOpenSettings = (event: Event) => {
      const customEvent = event as CustomEvent;
      openSettings(customEvent.detail?.tab);
    };

    // We don't listen to open-workspace here anymore, assuming ChatLayout handles it or Sidebar calls store directly.

    const cleanup = eventManager.addEventListener('open-settings', handleOpenSettings as EventListener, undefined, 'GnaniCore');
    // Keyboard listeners duplicated in ChatLayout, but harmless here if consistent
    const cleanupKeyboard = eventManager.addEventListener('keyboard:open-settings', handleOpenSettings as EventListener, undefined, 'GnaniCore');

    return () => {
      cleanup();
      cleanupKeyboard();
    };
  }, [openSettings]);

  // VERIFICATION: Simulation Event Listeners
  useEffect(() => {
    const handleTestWake = () => {
      console.log('[Verification] Simulating Wake Word');
      transition('wake-word-detected');
    };

    const handleTestSTT = (e: CustomEvent) => {
      console.log('[Verification] Simulating STT:', e.detail.text);

      // VERIFICATION: Manually add message to test store integration
      addMessage({
        type: 'user',
        message: e.detail.text || "Simulated Voice Input",
      });

      transition('vad-end'); // Valid trigger to go from Listening -> Thinking
      setTimeout(() => {
        console.log('[Verification] STT Simulation: Message added to store.');
      }, 1000);
    };

    window.addEventListener('test:wake', handleTestWake as EventListener);
    window.addEventListener('test:stt', handleTestSTT as EventListener);

    return () => {
      window.removeEventListener('test:wake', handleTestWake as EventListener);
      window.removeEventListener('test:stt', handleTestSTT as EventListener);
    };
  }, [transition]);

  // Timeout tracking for thinking state
  useEffect(() => {
    if (isThinking) {
      setTimeoutSeconds(30);
      timeoutIntervalRef.current = setInterval(() => {
        setTimeoutSeconds(prev => Math.max(0, prev - 1));
      }, 1000);
    } else {
      if (timeoutIntervalRef.current) {
        clearInterval(timeoutIntervalRef.current);
        timeoutIntervalRef.current = null;
      }
      setTimeoutSeconds(30);
    }

    return () => {
      if (timeoutIntervalRef.current) {
        clearInterval(timeoutIntervalRef.current);
      }
    };
  }, [isThinking]);

  useEffect(() => {
    streamingTTSRef.current = new StreamingTTS();
    // Initialize with current preference
    if (user?.settings?.preferredVoice) {
      streamingTTSRef.current.setPreferredVoice(user.settings.preferredVoice);
    }
    return () => {
      errorLogger.info('[GnaniCore] Unmounting - Cleaning up resources', { context: 'GnaniCore' });
      streamingTTSRef.current?.cleanup();
      stopMic(); // Ensure mic is stopped
      transition('reset'); // Reset state machine to idle
    };
  }, []);

  // Sync preferred voice when it changes
  useEffect(() => {
    if (streamingTTSRef.current && user?.settings?.preferredVoice) {
      streamingTTSRef.current.setPreferredVoice(user.settings.preferredVoice);
    }
  }, [user?.settings?.preferredVoice]);



  // Sync conversation ID from Store to Electron
  useEffect(() => {
    if (conversationId && window.gnani?.stream?.setConversationId) {
      errorLogger.debug('[GnaniCore] Pushing conversationId to Electron:', { context: 'GnaniCore', extra: { conversationId } });
      window.gnani.stream.setConversationId(conversationId);
    }
  }, [conversationId]);

  // Sync conversation ID from IPC to Store
  useEffect(() => {
    if (ipcConversationId && ipcConversationId !== conversationId) {
      errorLogger.debug('[GnaniCore] Syncing conversationId from IPC:', { context: 'GnaniCore', extra: { ipcConversationId } });
      setConversationId(ipcConversationId);
      if (accessToken) {
        refreshConversation(accessToken);
        useConversationStore.getState().fetchConversations(accessToken);
      }
    }
  }, [ipcConversationId, conversationId, setConversationId, refreshConversation, accessToken]);

  const showNotification = useCallback((title: string, body: string) => {
    if (window.gnani?.notifications?.show) {
      window.gnani.notifications.show(title, body);
    }
  }, []);

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
  }, [toolStatus, addMessage, showNotification]);

  useEffect(() => {
    if (!latestLLMChunk || !streamingTTSRef.current) return;

    try {
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
        return;
      }

      if (type === 'complete_response') {
        const messageId = (chunk as any).messageId;
        console.log('[TRACE] [FRONTEND] Received COMPLETE response:', text, 'messageId:', messageId);

        if (messageId) {
          updateMessageContent(messageId, text, false);
        } else {
          updateLastMessageContent(text, false);
        }

        setIsStreaming(false);

        streamingTTSRef.current.reset();
        streamingTTSRef.current.setStreamActive(true);
        streamingTTSRef.current.addTextChunk(text);
        streamingTTSRef.current.flush();
        return;
      }

      if (type === 'partial' || !type) {
        updateLastMessageContent(text, true);
        return;
      }
    } catch (error) {
      errorLogger.error('Error processing LLM chunk', error as Error, { context: 'GnaniCore' });
      setIsStreaming(false);
    }
  }, [latestLLMChunk, updateMessageContent, updateLastMessageContent, setIsStreaming]);

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
    const handleTtsSpeak = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { text } = customEvent.detail;

      if (streamingTTSRef.current) {
        console.log('[GnaniCore] Handling tts:speak event:', text.substring(0, 50));
        streamingTTSRef.current.reset();
        streamingTTSRef.current.addTextChunk(text);
        streamingTTSRef.current.flush();
      }
    };

    const cleanup = eventManager.addEventListener('tts:speak', handleTtsSpeak as EventListener, undefined, 'GnaniCore');
    return cleanup;
  }, []);

  const handleBargeIn = useCallback(() => {
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
  }, [state, spokenText, transition, isMicActive, startMic]);

  const bargeIn = useBargeIn(state, handleBargeIn);

  const handleStartRecording = useCallback(() => {
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
  }, [isIdle, isSpeaking, isThinking, transition, startMic, bargeIn]);

  const handleStopRecording = useCallback(() => {
    if (isListening) {
      errorLogger.info('Manual stop, transitioning to thinking', { context: 'GnaniCore' });
      transition('manual-stop');
      stopMic();
    }
  }, [isListening, transition, stopMic]);

  const getUIStatus = useCallback(() => {
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
  }, [state, isMicActive]);

  const getAnimationState = useCallback((): 'IDLE' | 'LISTENING' | 'THINKING' | 'SPEAKING' | 'ERROR' => {
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
  }, [state, uiState.streamErrorMessage]);

  const { sendText } = useAudioStream();

  const handleScreenshot = useCallback((base64: string) => {
    console.log('Screenshot captured:', base64.substring(0, 50) + '...');
    addMessage({
      type: 'user',
      message: 'Screenshot captured',
      metadata: {
        image: base64,
        mimeType: 'image/png'
      }
    });

    sendText(JSON.stringify({
      type: 'image',
      content: base64,
      mimeType: 'image/png'
    }));
  }, [addMessage, sendText]);

  const handleClipboardPaste = useCallback((content: { type: 'text' | 'image', data: string }) => {
    console.log('Clipboard paste:', content.type);
    if (content.type === 'text') {
      addMessage({ type: 'user', message: content.data });
      sendText(content.data);
    } else if (content.type === 'image') {
      handleScreenshot(content.data);
    }
  }, [addMessage, sendText, handleScreenshot]);

  const handleFileDrop = useCallback(async (files: File[]) => {
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
        sendText(`Content of file ${file.name}:\n${text}`);
      }
    }
  }, [handleScreenshot, addMessage, sendText]);

  useScreenshot(handleScreenshot);
  useClipboard(handleClipboardPaste);

  const currentUIStatus = getUIStatus();
  const animationState = getAnimationState();

  if (loading) {
    return null;
  }

  return (
    <FileDropZone onFileDrop={handleFileDrop}>
      <div className="relative w-screen h-screen overflow-hidden font-sans text-jarvis-text">
        <StateManager
          state={state}
          isIdle={isIdle}
          isListening={isListening}
          isThinking={isThinking}
          isSpeaking={isSpeaking}
          isWakeWordTriggered={isWakeWordTriggered}
          latestFinalSTT={latestFinalSTT}
          lastProcessedFinalSTT={lastProcessedFinalSTT}
          isTtsStarted={isTtsStarted}
          isTtsEnded={isTtsEnded}
          streamingTTS={streamingTTSRef.current}
          transition={transition}
          setIsStreaming={setIsStreaming}
          showNotification={showNotification}
          addMessage={addMessage}
        />
        <AudioManager
          state={state}
          isIdle={isIdle}
          isListening={isListening}
          isThinking={isThinking}
          isSpeaking={isSpeaking}
          isMicActive={isMicActive}
          startMic={startMic}
          stopMic={stopMic}
          isTtsEnded={isTtsEnded}
          bargeIn={bargeIn}
          handleBargeIn={handleBargeIn}
        />

        <HUDBackground status={currentUIStatus} />

        <motion.div
          className="relative z-10 flex flex-col h-full p-4 md:p-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        >
          <header className={`flex justify-between items-center h-20 shrink-0 z-50 ${isOverlayMode ? 'hidden' : ''}`}>
            <div className="text-left relative group cursor-default">
              <div className="absolute -inset-2 bg-jarvis-blue/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <h1
                className="relative text-3xl font-bold uppercase text-jarvis-blue tracking-[0.2em]"
                style={{ textShadow: "0 0 10px rgba(0, 240, 255, 0.8)" }}
              >
                GNANI
              </h1>
              <div className="flex items-center gap-2">
                <div className={`h-[1px] w-8 ${connectivityStatus?.online ? 'bg-jarvis-blue/50' : 'bg-red-500/50'}`} />
                <p className={`text-xs font-mono tracking-widest uppercase ${connectivityStatus?.online ? 'text-jarvis-cyan/70' : 'text-red-400'}`}>
                  {connectivityStatus?.online ? 'SYSTEM ONLINE' : 'SYSTEM OFFLINE'}
                </p>
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
                onClick={() => openSettings('general')}
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

              {/* Timeout Indicator */}
              {isThinking && timeoutSeconds < 30 && (
                <TimeoutIndicator
                  timeLeft={timeoutSeconds}
                  onExtend={(seconds) => setTimeoutSeconds(prev => prev + seconds)}
                />
              )}

              <div className="h-16 flex items-center justify-center">
                <SpokenTextDisplay
                  words={spokenText.words}
                  isVisible={isSpeaking && spokenText.words.length > 0}
                />
              </div>
            </div>
          </main>

          <footer className={`w-full absolute bottom-0 left-0 p-4 md:p-8 pointer-events-none ${isOverlayMode ? 'hidden' : ''}`}>
          </footer>
        </motion.div>

        {isOverlayMode && (
          <button
            onClick={onOverlayClose}
            className="absolute top-6 right-6 z-[60] p-3 bg-red-500/10 hover:bg-red-500/30 text-red-400 rounded-full border border-red-500/30 transition-all backdrop-blur-md"
          >
            <X className="w-6 h-6" />
          </button>
        )}

        <div className="absolute left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-4 bottom-32 md:bottom-auto md:top-[35%]">
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

        {!isOverlayMode && (
          <div className="absolute bottom-6 right-6 z-50">
            <DeviceStatsHUD />
          </div>
        )}

        <TerminalPanel isVisible={showTerminal} onToggle={() => setShowTerminal(!showTerminal)} />

        <ConversationSidebar
          isOpen={showHistory}
          onClose={() => setShowHistory(false)}
          onNewConversation={() => {
            setConversationId(null);
            clearMessages();
            if (window.gnani?.stream?.setConversationId) {
              window.gnani.stream.setConversationId(null);
            }
            console.log("Starting new conversation...");
          }}
          onSelectConversation={(id) => {
            console.log("Switching to conversation:", id);
            setConversationId(id);
            if (accessToken) {
              refreshConversation(accessToken);
            }
          }}
        />

        <IntelligencePanel isVisible={showIntelligencePanel} />

      </div>
    </FileDropZone>
  );
};

export default GnaniCore;
