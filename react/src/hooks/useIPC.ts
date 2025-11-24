// /react/src/hooks/useIPC.ts
import { useEffect, useState, useRef } from 'react';
import errorLogger from '../utils/errorLogger'; // Import errorLogger

declare global {
  interface Window {
    gnani?: {
      send: (channel: string, data?: any) => void;
      on: (channel: string, callback: (...args: any[]) => void) => () => void;
      stream?: {
        on: (event: string, callback: (...args: any[]) => void) => () => void;
      };
    };
  }
}

// These types are now defined locally as useIPC is no longer managing messages directly
export type IPCAppStatus = 'idle' | 'listening' | 'thinking' | 'speaking';

export const useIPC = () => {
  const [isWakeWordReady, setIsWakeWordReady] = useState(false);
  const [isVADReady, setIsVADReady] = useState(false);
  const [isWakeWordTriggered, setIsWakeWordTriggered] = useState(false);
  const [isAudioListening, setIsAudioListening] = useState(false);
  const [isAudioEnded, setIsAudioEnded] = useState(false);
  const [isStreamConnected, setIsStreamConnected] = useState(false);
  const [streamErrorMessage, setStreamErrorMessage] = useState<string | null>(null);
  const [isTtsStarted, setIsTtsStarted] = useState(false);
  const [isTtsEnded, setIsTtsEnded] = useState(false);

  // New states for gRPC stream data
  const [latestPartialSTT, setLatestPartialSTT] = useState<string | null>(null);
  const [latestFinalSTT, setLatestFinalSTT] = useState<string | null>(null);
  const [latestLLMChunk, setLatestLLMChunk] = useState<string | null>(null);
  const [latestSTTSegmentId, setLatestSTTSegmentId] = useState<string | null>(null); // To help combine partials

  useEffect(() => {
    if (!window.gnani) return;

    const unsubs: (() => void)[] = [];

    // System Status Listeners
    unsubs.push(window.gnani.on('wake:status', ({ state }) => {
      errorLogger.debug(`IPC: Wake word status: ${state}`, { context: 'useIPC' });
      setIsWakeWordReady(state === 'ready');
    }));
    unsubs.push(window.gnani.on('vad:status', ({ state }) => {
      errorLogger.debug(`IPC: VAD status: ${state}`, { context: 'useIPC' });
      setIsVADReady(state === 'ready');
    }));

    // Raw Event Listeners for UI State Machine
    unsubs.push(window.gnani.on('wake:triggered', () => {
      errorLogger.debug('IPC: Wake triggered', { context: 'useIPC' });
      setIsWakeWordTriggered(true);
      // Reset after a short delay to allow state machine to process
      setTimeout(() => setIsWakeWordTriggered(false), 100); 
    }));
    
    unsubs.push(window.gnani.on('audio:listening', (isListening) => {
      errorLogger.debug(`IPC: Audio listening: ${isListening}`, { context: 'useIPC' });
      setIsAudioListening(isListening);
    }));
    
    unsubs.push(window.gnani.on('audio:ended', () => {
      errorLogger.debug('IPC: Audio ended', { context: 'useIPC' });
      setIsAudioEnded(true);
      setTimeout(() => setIsAudioEnded(false), 100);
    }));

    if (window.gnani.stream) {
      unsubs.push(window.gnani.stream.on('stream:connected', () => {
        errorLogger.debug('IPC: Stream connected', { context: 'useIPC' });
        setIsStreamConnected(true);
        setStreamErrorMessage(null);
      }));
      unsubs.push(window.gnani.stream.on('stream:disconnected', () => {
        errorLogger.debug('IPC: Stream disconnected', { context: 'useIPC' });
        setIsStreamConnected(false);
      }));
      unsubs.push(window.gnani.stream.on('stream:error', (error) => {
        errorLogger.error('IPC: Stream error', error, { context: 'useIPC' });
        setStreamErrorMessage(error.message);
        setIsStreamConnected(false); // Assume error means disconnected
      }));
      unsubs.push(window.gnani.stream.on('tts:started', () => {
        errorLogger.debug('IPC: TTS started', { context: 'useIPC' });
        setIsTtsStarted(true);
      }));
      unsubs.push(window.gnani.stream.on('tts:ended', () => {
        errorLogger.debug('IPC: TTS ended', { context: 'useIPC' });
        setIsTtsEnded(true);
        setTimeout(() => setIsTtsEnded(false), 100);
      }));

      // Listeners for gRPC stream data
      unsubs.push(window.gnani.stream.on('stream:partial', ({ text, segment_id }) => {
        errorLogger.debug(`IPC: Partial STT: ${text}`, { context: 'useIPC' });
        setLatestPartialSTT(text);
        setLatestSTTSegmentId(segment_id);
      }));
      unsubs.push(window.gnani.stream.on('stream:final', ({ text, segment_id }) => {
        errorLogger.debug(`IPC: Final STT: ${text}`, { context: 'useIPC' });
        setLatestFinalSTT(text);
        setLatestSTTSegmentId(segment_id);
        setLatestPartialSTT(null); // Clear partial when final arrives
      }));
      unsubs.push(window.gnani.stream.on('stream:tts_chunk', ({ chunk }) => {
        errorLogger.debug(`IPC: LLM Chunk: ${chunk}`, { context: 'useIPC' });
        setLatestLLMChunk(chunk);
      }));
    }

    // Cleanup on unmount
    return () => {
      unsubs.forEach(unsub => unsub());
    };
  }, []);

  // Expose raw states and events for the UI state machine
  return {
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
  };
};
