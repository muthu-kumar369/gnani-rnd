// react/src/hooks/useGnaniUIState.ts
import { useEffect, useCallback, useMemo } from 'react';
import { useMachine } from '@xstate/react';
import { useUserStore } from '../store/useUserStore';
import { useIPC } from './useIPC';
import useMicrophone from './useMicrophone';
import errorLogger from '../utils/errorLogger';
import { gnaniMachine, type Message } from '../machines/gnaniStateMachine';

// Re-export types for backward compatibility
export type { Message };
export type GnaniAppStatus =
  | 'idle'
  | 'wake-word-listening'
  | 'mic-recording'
  | 'streaming'
  | 'receiving-stt'
  | 'thinking'
  | 'responding'
  | 'error'
  | 'initializing';

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
  conversationMessages: Message[];
  avatarEnabled: boolean;
  avatarGender: 'male' | 'female';
}

// Map XState state values to GnaniAppStatus
const mapStateToStatus = (stateValue: string): GnaniAppStatus => {
  switch (stateValue) {
    case 'initializing':
      return 'initializing';
    case 'idle':
      return 'idle';
    case 'wakeWordListening':
      return 'wake-word-listening';
    case 'micRecording':
      return 'mic-recording';
    case 'streaming':
      return 'streaming';
    case 'receivingSTT':
      return 'receiving-stt';
    case 'thinking':
      return 'thinking';
    case 'responding':
      return 'responding';
    case 'error':
      return 'error';
    default:
      return 'idle';
  }
};

export const useGnaniUIState = () => {
  const { isAuthenticated } = useUserStore();
  const { isMicActive } = useMicrophone();
  const ipcStates = useIPC();

  // Initialize XState machine
  const [state, send] = useMachine(gnaniMachine);

  // Extract IPC states
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

  // Sync IPC states to machine context
  useEffect(() => {
    send({
      type: 'UPDATE_IPC_STATE',
      payload: {
        isMicActive,
        isWakeWordReady,
        isVADReady,
        isWakeWordTriggered,
        isAudioListening,
        isAudioEnded,
        isStreamConnected,
        isTtsStarted,
        isTtsEnded,
      },
    });
  }, [
    isMicActive,
    isWakeWordReady,
    isVADReady,
    isWakeWordTriggered,
    isAudioListening,
    isAudioEnded,
    isStreamConnected,
    isTtsStarted,
    isTtsEnded,
    send,
  ]);

  // Handle initialization
  useEffect(() => {
    if (isAuthenticated && state.matches('initializing')) {
      send({ type: 'INITIALIZED' });
    }
  }, [isAuthenticated, state, send]);

  // Handle stream errors
  useEffect(() => {
    if (streamErrorMessage && !state.matches('error')) {
      send({ type: 'STREAM_ERROR', error: streamErrorMessage });
    }
  }, [streamErrorMessage, state, send]);

  // Handle wake word detection
  useEffect(() => {
    if (isWakeWordTriggered && state.matches('idle')) {
      send({ type: 'WAKE_WORD_DETECTED' });
    }
  }, [isWakeWordTriggered, state, send]);

  // Handle mic start/stop
  useEffect(() => {
    if (isMicActive && (state.matches('idle') || state.matches('wakeWordListening'))) {
      send({ type: 'MIC_START' });
    } else if (!isMicActive && (state.matches('micRecording') || state.matches('streaming'))) {
      send({ type: 'MIC_STOP' });
    }
  }, [isMicActive, state, send]);

  // Handle stream connection
  useEffect(() => {
    if (isStreamConnected && state.matches('micRecording')) {
      send({ type: 'STREAM_CONNECTED' });
    } else if (!isStreamConnected && state.matches('streaming')) {
      send({ type: 'STREAM_DISCONNECTED' });
    }
  }, [isStreamConnected, state, send]);

  // Handle STT events
  useEffect(() => {
    if (latestPartialSTT && latestSTTSegmentId) {
      if (state.matches('streaming') || state.matches('receivingSTT')) {
        send({
          type: 'PARTIAL_STT',
          transcript: latestPartialSTT,
          segmentId: latestSTTSegmentId,
        });
      }
    }
  }, [latestPartialSTT, latestSTTSegmentId, state, send]);

  useEffect(() => {
    if (latestFinalSTT && latestSTTSegmentId && state.matches('receivingSTT')) {
      send({
        type: 'FINAL_STT',
        transcript: latestFinalSTT,
        segmentId: latestSTTSegmentId,
      });
    }
  }, [latestFinalSTT, latestSTTSegmentId, state, send]);

  // Handle LLM chunks
  useEffect(() => {
    if (latestLLMChunk && latestSTTSegmentId) {
      if (state.matches('thinking') || state.matches('responding')) {
        send({
          type: 'LLM_CHUNK',
          chunk: latestLLMChunk,
          segmentId: latestSTTSegmentId,
        });
      }
    }
  }, [latestLLMChunk, latestSTTSegmentId, state, send]);

  // Handle TTS events
  useEffect(() => {
    if (isTtsStarted && state.matches('thinking')) {
      send({ type: 'TTS_STARTED' });
    }
  }, [isTtsStarted, state, send]);

  useEffect(() => {
    if (isTtsEnded && state.matches('responding')) {
      send({ type: 'TTS_ENDED' });
    }
  }, [isTtsEnded, state, send]);

  // Handle forced logout from main process
  useEffect(() => {
    if (window.gnani?.auth?.onForceLogout) {
      const unsubscribe = window.gnani.auth.onForceLogout(() => {
        errorLogger.warn('Auth: Force logout received from main process.', {
          context: 'useGnaniUIState',
        });
        send({ type: 'RESET' });
        send({ type: 'STREAM_ERROR', error: 'Session expired. Please log in again.' });
      });
      return () => unsubscribe();
    }
  }, [send]);

  // Avatar control callbacks
  const setAvatarEnabled = useCallback(
    (enabled: boolean) => {
      send({ type: 'SET_AVATAR_ENABLED', enabled });
    },
    [send]
  );

  const setAvatarGender = useCallback(
    (gender: 'male' | 'female') => {
      send({ type: 'SET_AVATAR_GENDER', gender });
    },
    [send]
  );

  // Build the public UI state object
  const uiState: GnaniUIState = useMemo(
    () => ({
      appStatus: mapStateToStatus(state.value as string),
      isMicActive: state.context.isMicActive,
      isWakeWordReady: state.context.isWakeWordReady,
      isVADReady: state.context.isVADReady,
      isStreamConnected: state.context.isStreamConnected,
      streamErrorMessage: state.context.error,
      isWakeWordTriggered: state.context.isWakeWordTriggered,
      isAudioListening: state.context.isAudioListening,
      isAudioEnded: state.context.isAudioEnded,
      isTtsStarted: state.context.isTtsStarted,
      isTtsEnded: state.context.isTtsEnded,
      latestPartialSTT: state.context.partialTranscript || null,
      latestFinalSTT: state.context.transcript || null,
      latestLLMChunk: latestLLMChunk, // Use IPC value directly for reactivity
      latestSTTSegmentId: state.context.segmentId,
      conversationMessages: state.context.conversationMessages,
      avatarEnabled: state.context.avatarEnabled,
      avatarGender: state.context.avatarGender,
    }),
    [state, latestLLMChunk]
  );

  return useMemo(
    () => ({
      ...uiState,
      setAvatarEnabled,
      setAvatarGender,
    }),
    [uiState, setAvatarEnabled, setAvatarGender]
  );
};
