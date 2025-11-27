// /react/src/hooks/useIPC.ts
import { useEffect, useState } from 'react';
import errorLogger from '../utils/errorLogger'; // Import errorLogger

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
  const [latestLLMChunk, setLatestLLMChunk] = useState<any>(null);
  const [latestSTTSegmentId, setLatestSTTSegmentId] = useState<string | null>(null); // To help combine partials

  useEffect(() => {
    if (!window.gnani) return;

    const unsubs: (() => void)[] = [];

    // System Status Listeners
    unsubs.push(window.gnani.on('wake:status', ({ state }: { state: string }) => {
      errorLogger.debug(`IPC: Wake word status: ${state}`, { context: 'useIPC' });
      setIsWakeWordReady(state === 'ready');
    }));
    unsubs.push(window.gnani.on('vad:status', ({ state }: { state: string }) => {
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
    
    unsubs.push(window.gnani.on('audio:listening', (isListening: boolean) => {
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
      unsubs.push(window.gnani.stream.on('stream:error', (error: Error) => {
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
      unsubs.push(window.gnani.stream.on('stream:partial', ({ text, segment_id }: { text: string, segment_id: string }) => {
        console.log(`[IPC] Received partial STT for segment ${segment_id}: "${text}"`);
        errorLogger.debug(`IPC: Partial STT: ${text}`, { context: 'useIPC' });
        setLatestPartialSTT(text);
        setLatestSTTSegmentId(segment_id);
      }));
      unsubs.push(window.gnani.stream.on('stream:final', ({ text, segment_id }: { text: string, segment_id: string }) => {
        console.log(`[IPC] Received final STT for segment ${segment_id}: "${text}"`);
        errorLogger.debug(`IPC: Final STT: ${text}`, { context: 'useIPC' });
        setLatestFinalSTT(text);
        setLatestSTTSegmentId(segment_id);
        setLatestPartialSTT(null); // Clear partial when final arrives
      }));
      unsubs.push(window.gnani.stream.on('stream:tts_chunk', ({ chunk }: { chunk: any }) => {
        console.log('[IPC] RAW stream:tts_chunk received:', chunk); // DEBUG LOG
        errorLogger.debug(`IPC: LLM Chunk: ${chunk}`, { context: 'useIPC' });
        setLatestLLMChunk(chunk);
      }));
      
      // Also listen for 'stream:llm_chunk' explicitly if the backend uses that name
      unsubs.push(window.gnani.stream.on('stream:llm_chunk', (data: any) => {
          console.log('[IPC] RAW stream:llm_chunk received:', data); // DEBUG LOG
          // Pass the full data object (which might be { type: 'partial', text: '...' })
          setLatestLLMChunk(data);
      }));
    }

    // Cleanup on unmount
    return () => {
      unsubs.forEach(unsub => {
        if (typeof unsub === 'function') {
            unsub();
        }
      });
    };
  }, []);
  
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
