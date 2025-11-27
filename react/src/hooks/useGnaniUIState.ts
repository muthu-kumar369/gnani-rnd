// react/src/hooks/useGnaniUIState.ts
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useIPC } from './useIPC';
import useMicrophone from './useMicrophone';
import errorLogger from '../utils/errorLogger';

// Define the comprehensive UI State interface
export type GnaniAppStatus = 'idle' | 'wake-word-listening' | 'mic-recording' | 'streaming' | 'receiving-stt' | 'thinking' | 'responding' | 'error' | 'initializing';

// Define the Message interface (moved here for shared access)
export interface Message {
  id: string;
  sender: "user" | "gnani";
  text: string;
  isFinal: boolean;
  type?: "partial_text" | "llm_chunk" | "final_text" | "error_message";
  segmentId?: string; // To link STT to responses
}

export interface GnaniUIState {
  appStatus: GnaniAppStatus;
  isMicActive: boolean;
  isWakeWordReady: boolean;
  isVADReady: boolean;
  isStreamConnected: boolean;
  streamErrorMessage: string | null;
  isWakeWordTriggered: boolean;
  isAudioListening: boolean;
  isAudioEnded: boolean;
  isTtsStarted: boolean;
  isTtsEnded: boolean;
  latestPartialSTT: string | null;
  latestFinalSTT: string | null;
  latestLLMChunk: string | null;
  latestSTTSegmentId: string | null;
  conversationMessages: Message[]; // New state for managing conversation history
}

// Define actions for the UI state reducer (optional, but good for complex states)
type UIAction =
  | { type: 'SET_APP_STATUS'; payload: GnaniAppStatus }
  | { type: 'SET_MIC_ACTIVE'; payload: boolean }
  | { type: 'SET_WAKE_WORD_READY'; payload: boolean }
  | { type: 'SET_VAD_READY'; payload: boolean }
  | { type: 'SET_STREAM_CONNECTED'; payload: boolean }
  | { type: 'SET_STREAM_ERROR'; payload: string | null }
  | { type: 'SET_WAKE_WORD_TRIGGERED'; payload: boolean }
  | { type: 'SET_AUDIO_LISTENING'; payload: boolean }
  | { type: 'SET_AUDIO_ENDED'; payload: boolean }
  | { type: 'SET_TTS_STARTED'; payload: boolean }
  | { type: 'SET_TTS_ENDED'; payload: boolean }
  | { type: 'SET_LATEST_PARTIAL_STT'; payload: string | null }
  | { type: 'SET_LATEST_FINAL_STT'; payload: string | null }
  | { type: 'SET_LATEST_LLM_CHUNK'; payload: string | null }
  | { type: 'SET_LATEST_STT_SEGMENT_ID'; payload: string | null }
  | { type: 'ADD_MESSAGE'; payload: Message } // New action to add/update messages
  | { type: 'RESET_STREAM_STATE' };


export const useGnaniUIState = () => {
  const { isAuthenticated } = useAuth();
  const { isMicActive } = useMicrophone();
  const ipcStates = useIPC();

  const [uiState, setUiState] = useState<GnaniUIState>({
    appStatus: 'initializing',
    isMicActive: false,
    isWakeWordReady: false,
    isVADReady: false,
    isStreamConnected: false,
    streamErrorMessage: null,
    isWakeWordTriggered: false,
    isAudioListening: false,
    isAudioEnded: false,
    isTtsStarted: false,
    isTtsEnded: false,
    latestPartialSTT: null,
    latestFinalSTT: null,
    latestLLMChunk: null,
    latestSTTSegmentId: null,
    conversationMessages: [], // Initialize conversation messages
  });

  const dispatch = useCallback((action: UIAction) => {
    setUiState(prev => {
      let newState = { ...prev };

      switch (action.type) {
        case 'SET_APP_STATUS':
          newState.appStatus = action.payload;
          break;
        case 'SET_MIC_ACTIVE':
          newState.isMicActive = action.payload;
          break;
        case 'SET_WAKE_WORD_READY':
          newState.isWakeWordReady = action.payload;
          break;
        case 'SET_VAD_READY':
          newState.isVADReady = action.payload;
          break;
        case 'SET_STREAM_CONNECTED':
          newState.isStreamConnected = action.payload;
          if (!action.payload) newState.streamErrorMessage = null;
          break;
        case 'SET_STREAM_ERROR':
          newState.streamErrorMessage = action.payload;
          newState.isStreamConnected = false;
          newState.appStatus = 'error';
          break;
        case 'SET_WAKE_WORD_TRIGGERED':
          newState.isWakeWordTriggered = action.payload;
          break;
        case 'SET_AUDIO_LISTENING':
          newState.isAudioListening = action.payload;
          break;
        case 'SET_AUDIO_ENDED':
          newState.isAudioEnded = action.payload;
          break;
        case 'SET_TTS_STARTED':
          newState.isTtsStarted = action.payload;
          break;
        case 'SET_TTS_ENDED':
          newState.isTtsEnded = action.payload;
          break;
        case 'SET_LATEST_PARTIAL_STT':
          newState.latestPartialSTT = action.payload;
          break;
        case 'SET_LATEST_FINAL_STT':
          newState.latestFinalSTT = action.payload;
          break;
        case 'SET_LATEST_LLM_CHUNK':
          newState.latestLLMChunk = action.payload;
          break;
        case 'SET_LATEST_STT_SEGMENT_ID':
          newState.latestSTTSegmentId = action.payload;
          break;
        case 'ADD_MESSAGE': // Handle adding/updating messages
          const existingMessageIndex = newState.conversationMessages.findIndex(
            (msg) => msg.id === action.payload.id
          );
          if (existingMessageIndex !== -1) {
            // Update existing message
            newState.conversationMessages[existingMessageIndex] = action.payload;
          } else {
            // Add new message
            newState.conversationMessages = [...newState.conversationMessages, action.payload];
          }
          break;
        case 'RESET_STREAM_STATE':
          newState = {
            ...newState,
            isStreamConnected: false,
            streamErrorMessage: null,
            isMicActive: false,
            isWakeWordTriggered: false,
            isAudioListening: false,
            isAudioEnded: false,
            isTtsStarted: false,
            isTtsEnded: false,
            latestPartialSTT: null,
            latestFinalSTT: null,
            latestLLMChunk: null,
            latestSTTSegmentId: null,
            // Clear conversation messages on stream reset
            conversationMessages: [],
          };
          break;
        default:
          break;
      }
      return newState;
    });
  }, []);

  // Sync raw IPC states into the unified UI state
  const {
    isWakeWordReady,
    isVADReady,
    isWakeWordTriggered,
    isAudioListening,
    isAudioEnded,
    isStreamConnected,
    streamErrorMessage,
    isTtsStarted,
    isTtsEnded,
    latestPartialSTT,
    latestFinalSTT,
    latestLLMChunk,
    latestSTTSegmentId,
  } = ipcStates;

  useEffect(() => {
    dispatch({ type: 'SET_WAKE_WORD_READY', payload: isWakeWordReady });
    dispatch({ type: 'SET_VAD_READY', payload: isVADReady });
    dispatch({ type: 'SET_WAKE_WORD_TRIGGERED', payload: isWakeWordTriggered });
    dispatch({ type: 'SET_AUDIO_LISTENING', payload: isAudioListening });
    dispatch({ type: 'SET_AUDIO_ENDED', payload: isAudioEnded });
    dispatch({ type: 'SET_STREAM_CONNECTED', payload: isStreamConnected });
    dispatch({ type: 'SET_STREAM_ERROR', payload: streamErrorMessage });
    dispatch({ type: 'SET_TTS_STARTED', payload: isTtsStarted });
    dispatch({ type: 'SET_TTS_ENDED', payload: isTtsEnded });
    dispatch({ type: 'SET_LATEST_PARTIAL_STT', payload: latestPartialSTT });
    dispatch({ type: 'SET_LATEST_FINAL_STT', payload: latestFinalSTT });
    dispatch({ type: 'SET_LATEST_LLM_CHUNK', payload: latestLLMChunk });
    dispatch({ type: 'SET_LATEST_STT_SEGMENT_ID', payload: latestSTTSegmentId });
  }, [
    isWakeWordReady,
    isVADReady,
    isWakeWordTriggered,
    isAudioListening,
    isAudioEnded,
    isStreamConnected,
    streamErrorMessage,
    isTtsStarted,
    isTtsEnded,
    latestPartialSTT,
    latestFinalSTT,
    latestLLMChunk,
    latestSTTSegmentId,
    dispatch,
  ]);

  // Sync mic active state
  useEffect(() => {
    dispatch({ type: 'SET_MIC_ACTIVE', payload: isMicActive });
  }, [isMicActive, dispatch]);


  // Main UI State Machine Logic (determines appStatus)
  useEffect(() => {
    if (!isAuthenticated) {
      dispatch({ type: 'SET_APP_STATUS', payload: 'idle' });
      return;
    }

    const {
      isMicActive: micActive,
      isStreamConnected: streamConnected,
      isWakeWordReady: wakeWordReady,
      isWakeWordTriggered: wakeWordTriggered,
      isAudioListening: audioListening,
      isTtsStarted: ttsStarted,
      isTtsEnded: ttsEnded,
      streamErrorMessage: streamError,
      latestFinalSTT: finalSTT,
      latestLLMChunk: llmChunk,
      latestPartialSTT: partialSTT,
    } = uiState;

    if (streamError) {
      dispatch({ type: 'SET_APP_STATUS', payload: 'error' });
    }
    else if (ttsStarted && !ttsEnded) {
      dispatch({ type: 'SET_APP_STATUS', payload: 'responding' });
    }
    // If we have LLM chunks but TTS hasn't started, we are generating response -> THINKING
    else if (llmChunk && !ttsStarted) {
       dispatch({ type: 'SET_APP_STATUS', payload: 'thinking' });
    }
    // If we have final STT and no response yet, we are waiting for response -> THINKING
    else if (finalSTT && !ttsStarted) { 
      dispatch({ type: 'SET_APP_STATUS', payload: 'thinking' });
    }
    // Only partial STT implies user is currently speaking -> RECEIVING-STT (Listening)
    else if (partialSTT) { 
      dispatch({ type: 'SET_APP_STATUS', payload: 'receiving-stt' });
    }
    else if (micActive && streamConnected && !ttsStarted) {
      dispatch({ type: 'SET_APP_STATUS', payload: 'streaming' });
    }
    else if (micActive && !streamConnected) {
      dispatch({ type: 'SET_APP_STATUS', payload: 'mic-recording' });
    }
    else if (wakeWordReady && (wakeWordTriggered || audioListening)) {
        dispatch({ type: 'SET_APP_STATUS', payload: 'wake-word-listening' });
    }
    else if (!micActive && !streamConnected && !ttsStarted) {
      dispatch({ type: 'SET_APP_STATUS', payload: 'idle' });
    }
  }, [
    isAuthenticated,
    uiState.isMicActive,
    uiState.isStreamConnected,
    uiState.isWakeWordReady,
    uiState.isWakeWordTriggered,
    uiState.isAudioListening,
    uiState.isTtsStarted,
    uiState.isTtsEnded,
    uiState.streamErrorMessage,
    uiState.latestPartialSTT,
    uiState.latestFinalSTT,
    uiState.latestLLMChunk,
    dispatch,
  ]);
  
  // --- Conversation Message Management ---
  useEffect(() => {
    if (latestSTTSegmentId && latestSTTSegmentId !== uiState.latestSTTSegmentId) {
        dispatch({ type: 'ADD_MESSAGE', payload: {
            id: latestSTTSegmentId,
            sender: 'user',
            text: latestPartialSTT || '',
            isFinal: false,
            type: 'partial_text',
            segmentId: latestSTTSegmentId,
        }});
    } else if (latestSTTSegmentId && latestPartialSTT) {
        dispatch({ type: 'ADD_MESSAGE', payload: {
            id: latestSTTSegmentId,
            sender: 'user',
            text: latestPartialSTT,
            isFinal: false,
            type: 'partial_text',
            segmentId: latestSTTSegmentId,
        }});
    }

    if (latestFinalSTT && latestSTTSegmentId) {
        dispatch({ type: 'ADD_MESSAGE', payload: {
            id: latestSTTSegmentId,
            sender: 'user',
            text: latestFinalSTT,
            isFinal: true,
            type: 'final_text',
            segmentId: latestSTTSegmentId,
        }});
        dispatch({ type: 'SET_LATEST_PARTIAL_STT', payload: null });
    }

    if (latestLLMChunk && latestSTTSegmentId) {
        const gnaniMessageId = `gnani-${latestSTTSegmentId}`;
        const existingGnaniMessage = uiState.conversationMessages.find(
            (msg) => msg.id === gnaniMessageId && msg.sender === 'gnani'
        );

        let newText = existingGnaniMessage ? existingGnaniMessage.text + latestLLMChunk : latestLLMChunk;
        
        dispatch({ type: 'ADD_MESSAGE', payload: {
            id: gnaniMessageId,
            sender: 'gnani',
            text: newText,
            isFinal: false,
            type: 'llm_chunk',
            segmentId: latestSTTSegmentId,
        }});
    }

    if (isTtsEnded && latestSTTSegmentId) {
        const gnaniMessageId = `gnani-${latestSTTSegmentId}`;
        const existingGnaniMessage = uiState.conversationMessages.find(
            (msg) => msg.id === gnaniMessageId && msg.sender === 'gnani'
        );
        if (existingGnaniMessage && !existingGnaniMessage.isFinal) {
             dispatch({ type: 'ADD_MESSAGE', payload: {
                ...existingGnaniMessage,
                isFinal: true,
                type: 'final_text',
            }});
        }
    }
  }, [
    latestPartialSTT,
    latestFinalSTT,
    latestLLMChunk,
    latestSTTSegmentId,
    isTtsEnded,
    uiState.latestSTTSegmentId,
    uiState.conversationMessages,
    dispatch,
  ]);


  // Handle forced logout from main process
  useEffect(() => {
    if (window.gnani?.auth?.onForceLogout) {
      const unsubscribe = window.gnani.auth.onForceLogout(() => {
        errorLogger.warn('Auth: Force logout received from main process.', { context: 'useGnaniUIState' });
        // The GnaniCore component will listen for this and trigger AuthContext's logout
        dispatch({ type: 'RESET_STREAM_STATE' });
        dispatch({ type: 'SET_APP_STATUS', payload: 'idle' });
        dispatch({ type: 'SET_STREAM_ERROR', payload: 'Session expired. Please log in again.' });
      });
      return () => unsubscribe();
    }
  }, [dispatch]);


  return useMemo(() => uiState, [uiState]);
};
