// react/src/hooks/useGnaniUIState.ts
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useIPC } from './useIPC';
import useMicrophone from './useMicrophone';
import errorLogger from '../utils/errorLogger';
import { v4 as uuidv4 } from 'uuid'; // For generating unique message IDs

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
  const { isAuthenticated, logout } = useAuth();
  const { isMicActive, startMic, stopMic } = useMicrophone();
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
  useEffect(() => {
    dispatch({ type: 'SET_WAKE_WORD_READY', payload: ipcStates.isWakeWordReady });
    dispatch({ type: 'SET_VAD_READY', payload: ipcStates.isVADReady });
    dispatch({ type: 'SET_WAKE_WORD_TRIGGERED', payload: ipcStates.isWakeWordTriggered });
    dispatch({ type: 'SET_AUDIO_LISTENING', payload: ipcStates.isAudioListening });
    dispatch({ type: 'SET_AUDIO_ENDED', payload: ipcStates.isAudioEnded });
    dispatch({ type: 'SET_STREAM_CONNECTED', payload: ipcStates.isStreamConnected });
    dispatch({ type: 'SET_STREAM_ERROR', payload: ipcStates.streamErrorMessage });
    dispatch({ type: 'SET_TTS_STARTED', payload: ipcStates.isTtsStarted });
    dispatch({ type: 'SET_TTS_ENDED', payload: ipcStates.isTtsEnded });
    dispatch({ type: 'SET_LATEST_PARTIAL_STT', payload: ipcStates.latestPartialSTT });
    dispatch({ type: 'SET_LATEST_FINAL_STT', payload: ipcStates.latestFinalSTT });
    dispatch({ type: 'SET_LATEST_LLM_CHUNK', payload: ipcStates.latestLLMChunk });
    dispatch({ type: 'SET_LATEST_STT_SEGMENT_ID', payload: ipcStates.latestSTTSegmentId });
  }, [ipcStates, dispatch]);

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

    // Prioritize error state
    if (uiState.streamErrorMessage) {
      dispatch({ type: 'SET_APP_STATUS', payload: 'error' });
    }
    // Prioritize responding state (TTS is active)
    else if (uiState.isTtsStarted && !uiState.isTtsEnded) {
      dispatch({ type: 'SET_APP_STATUS', payload: 'responding' });
    }
    // Prioritize thinking state (STT is final, but no TTS started and no LLM chunk yet)
    else if (uiState.latestFinalSTT && !uiState.isTtsStarted && !uiState.latestLLMChunk) {
      dispatch({ type: 'SET_APP_STATUS', payload: 'thinking' });
    }
    // Prioritize receiving STT (either partial or final STT is coming in)
    else if (uiState.latestPartialSTT || uiState.latestFinalSTT) {
      dispatch({ type: 'SET_APP_STATUS', payload: 'receiving-stt' });
    }
    // Prioritize streaming (mic active and stream connected, not TTS)
    else if (uiState.isMicActive && uiState.isStreamConnected && !uiState.isTtsStarted) {
      dispatch({ type: 'SET_APP_STATUS', payload: 'streaming' });
    }
    // Prioritize mic recording (mic active but stream not connected, e.g., during wake word detection)
    else if (uiState.isMicActive && !uiState.isStreamConnected) {
      dispatch({ type: 'SET_APP_STATUS', payload: 'mic-recording' });
    }
    // Prioritize wake-word listening (if wake word is ready and triggered, or just ready)
    else if (uiState.isWakeWordReady && (uiState.isWakeWordTriggered || uiState.isAudioListening)) {
        dispatch({ type: 'SET_APP_STATUS', payload: 'wake-word-listening' });
    }
    // Default to idle if no other specific state is active
    else if (!uiState.isMicActive && !uiState.isStreamConnected && !uiState.isTtsStarted) {
      dispatch({ type: 'SET_APP_STATUS', payload: 'idle' });
    }
  }, [
    isAuthenticated,
    uiState.isMicActive,
    uiState.isStreamConnected,
    uiState.isWakeWordReady,
    uiState.isVADReady,
    uiState.isWakeWordTriggered,
    uiState.isAudioListening,
    uiState.isAudioEnded,
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
    // Handle new STT segments (user input)
    if (ipcStates.latestSTTSegmentId && ipcStates.latestSTTSegmentId !== uiState.latestSTTSegmentId) {
        dispatch({ type: 'ADD_MESSAGE', payload: {
            id: ipcStates.latestSTTSegmentId,
            sender: 'user',
            text: ipcStates.latestPartialSTT || '',
            isFinal: false,
            type: 'partial_text',
            segmentId: ipcStates.latestSTTSegmentId,
        }});
    } else if (ipcStates.latestSTTSegmentId && ipcStates.latestPartialSTT) {
        // Update existing partial STT
        dispatch({ type: 'ADD_MESSAGE', payload: {
            id: ipcStates.latestSTTSegmentId,
            sender: 'user',
            text: ipcStates.latestPartialSTT,
            isFinal: false,
            type: 'partial_text',
            segmentId: ipcStates.latestSTTSegmentId,
        }});
    }

    // Finalize STT (user input)
    if (ipcStates.latestFinalSTT && ipcStates.latestSTTSegmentId) {
        dispatch({ type: 'ADD_MESSAGE', payload: {
            id: ipcStates.latestSTTSegmentId,
            sender: 'user',
            text: ipcStates.latestFinalSTT,
            isFinal: true,
            type: 'final_text',
            segmentId: ipcStates.latestSTTSegmentId,
        }});
        // Clear partial STT once final is received and processed
        dispatch({ type: 'SET_LATEST_PARTIAL_STT', payload: null });
    }

    // Handle LLM chunks (Gnani response)
    if (ipcStates.latestLLMChunk && ipcStates.latestSTTSegmentId) {
        const gnaniMessageId = `gnani-${ipcStates.latestSTTSegmentId}`;
        const existingGnaniMessage = uiState.conversationMessages.find(
            (msg) => msg.id === gnaniMessageId && msg.sender === 'gnani'
        );

        let newText = existingGnaniMessage ? existingGnaniMessage.text + ipcStates.latestLLMChunk : ipcStates.latestLLMChunk;
        
        dispatch({ type: 'ADD_MESSAGE', payload: {
            id: gnaniMessageId,
            sender: 'gnani',
            text: newText,
            isFinal: false, // LLM chunks are usually not final until TTS ends
            type: 'llm_chunk',
            segmentId: ipcStates.latestSTTSegmentId,
        }});
        // Clear LLM chunk after processing to prevent re-adding
        dispatch({ type: 'SET_LATEST_LLM_CHUNK', payload: null });
    }

    // Finalize Gnani response when TTS ends
    if (ipcStates.isTtsEnded && ipcStates.latestSTTSegmentId) {
        const gnaniMessageId = `gnani-${ipcStates.latestSTTSegmentId}`;
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
    ipcStates.latestPartialSTT,
    ipcStates.latestFinalSTT,
    ipcStates.latestLLMChunk,
    ipcStates.latestSTTSegmentId,
    ipcStates.isTtsEnded,
    uiState.latestSTTSegmentId, // Need uiState's own segment ID to detect changes
    uiState.conversationMessages, // Needed to find existing messages
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
