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
  const [latestSessionId, setLatestSessionId] = useState<string | null>(null);
  const [toolStatus, setToolStatus] = useState<any>(null);

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
      unsubs.push(window.gnani.stream.on('stream:connected', ({ sessionId }: { sessionId?: string }) => {
        errorLogger.debug(`IPC: Stream connected (Session: ${sessionId})`, { context: 'useIPC' });
        setIsStreamConnected(true);
        setStreamErrorMessage(null);
        if (sessionId) setLatestSessionId(sessionId);
      }));
      unsubs.push(window.gnani.stream.on('stream:disconnected', () => {
        errorLogger.debug('IPC: Stream disconnected', { context: 'useIPC' });
        setIsStreamConnected(false);
      }));
      unsubs.push(window.gnani.stream.on('stream:error', (error: Error) => {
        errorLogger.error('IPC: Stream error', error, { context: 'useIPC' });
        setStreamErrorMessage(error.message);
        setIsStreamConnected(false);
      }));

      // Listen for TTS events from StreamingTTS (frontend CustomEvents)
      const handleTtsStarted = () => {
        errorLogger.debug('CustomEvent: TTS started', { context: 'useIPC' });
        setIsTtsStarted(true);
        // Don't reset here - let the state machine handle the transition first
        window.gnani?.send('tts:started');
      };

      const handleTtsEnded = () => {
        errorLogger.debug('CustomEvent: TTS ended', { context: 'useIPC' });
        setIsTtsEnded(true);
        // Reset isTtsStarted AFTER a delay to ensure state transition completes
        setTimeout(() => {
          setIsTtsStarted(false);
          setIsTtsEnded(false);
          setLatestFinalSTT(null);
          setLatestLLMChunk(null);
        }, 150); // Increased from 100ms to 150ms for safety
        window.gnani?.send('tts:ended');
      };

      window.addEventListener('tts:started', handleTtsStarted);
      window.addEventListener('tts:ended', handleTtsEnded);

      unsubs.push(() => {
        window.removeEventListener('tts:started', handleTtsStarted);
        window.removeEventListener('tts:ended', handleTtsEnded);
      });

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
        // Ensure we always have a segment ID, even for text input echoes
        setLatestSTTSegmentId(segment_id || `text-${Date.now()}`);
        setLatestPartialSTT(null); // Clear partial when final arrives
      }));
      unsubs.push(window.gnani.stream.on('stream:tts_chunk', ({ chunk }: { chunk: any }) => {
        console.log('[IPC] RAW stream:tts_chunk received:', chunk); // DEBUG LOG
        errorLogger.debug(`IPC: LLM Chunk: ${chunk}`, { context: 'useIPC' });
        setLatestLLMChunk(chunk);
      }));

      unsubs.push(window.gnani.stream.on('stream:tts_stop', () => {
        console.log('[IPC] stream:tts_stop received. Dispatching tts:interrupted');
        errorLogger.info('IPC: TTS Stop received', { context: 'useIPC' });
        window.dispatchEvent(new CustomEvent('tts:interrupted'));
      }));

      // Queue for LLM chunks to prevent React state update flooding
      const llmChunkQueue: any[] = [];
      let isProcessingQueue = false;

      const processQueue = () => {
        if (llmChunkQueue.length === 0) {
          isProcessingQueue = false;
          return;
        }

        isProcessingQueue = true;

        // Process up to 5 chunks per frame to balance responsiveness and performance
        // or just take the latest one if we only care about the latest?
        // Actually, for TTS we might need all of them, but here we are just setting 'latestLLMChunk'.
        // If the consumer of this hook (GnaniCore) appends them, we must ensure we don't miss any.
        // BUT, 'latestLLMChunk' implies we only expose the *latest* one.
        // If the consumer depends on *every* chunk triggering a useEffect, we might have a problem if we batch them.
        // However, the previous implementation was: setLatestLLMChunk({ payload: data, _t: Date.now() });
        // This suggests the consumer listens to changes.

        // Let's try to process one by one but throttled by RAF?
        // Or better: expose the queue itself? No, that changes the API.

        // If we receive 10 chunks in 16ms, we want to trigger 10 updates? 
        // React might batch them anyway.

        // The goal of backpressure on frontend is to NOT block the main thread.
        // If we just set state 100 times a second, React will try to re-render.

        // Let's shift one chunk from the queue and update state.
        // If there are more, request another frame.

        const chunk = llmChunkQueue.shift();
        if (chunk) {
          setLatestLLMChunk({ payload: chunk, _t: Date.now() });
        }

        if (llmChunkQueue.length > 0) {
          requestAnimationFrame(processQueue);
        } else {
          isProcessingQueue = false;
        }
      };

      unsubs.push(window.gnani.stream.on('stream:llm_chunk', (data: any) => {
        // console.log('[IPC] RAW stream:llm_chunk received:', data); // Verbose log
        llmChunkQueue.push(data);
        if (!isProcessingQueue) {
          processQueue();
        }
      }));

      // Tool Status Listener
      unsubs.push(window.gnani.stream.on('stream:tool_status', ({ status }: { status: any }) => {
        console.log('[IPC] Tool Status received:', status);
        setToolStatus(status);
      }));

      // Title Update Listener
      unsubs.push(window.gnani.stream.on('stream:title_update', ({ session_id, title }: { session_id: string, title: string }) => {
        console.log(`[IPC] Title Update received for session ${session_id}: "${title}"`);
        errorLogger.debug(`IPC: Title Update: ${title}`, { context: 'useIPC', sessionId: session_id });
        // Import and call the conversation history store's updateConversationTitle method
        import('../store/useConversationHistoryStore').then(({ useConversationHistoryStore }) => {
          useConversationHistoryStore.getState().updateConversationTitle(session_id, title);
        });
      }));

      // Typing Status Listener
      unsubs.push(window.gnani.stream.on('stream:typing_status', ({ status, message }: { status: string, message?: string }) => {
        console.log(`[IPC] Typing Status received: ${status}`, message ? `(${message})` : '');
        errorLogger.debug(`IPC: Typing Status: ${status}`, { context: 'useIPC', message });
        // Import and call the gnani store's setTypingStatus method
        import('../store/useGnaniStore').then(({ useGnaniStore }) => {
          useGnaniStore.getState().setTypingStatus(status as any, message);
        });
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
    sessionId: (latestSessionId as string | null),
    toolStatus,
    setSessionId: (sessionId: string) => {
      if (window.gnani && window.gnani.stream) {
        window.gnani.stream.setSessionId(sessionId);
      }
    }
  };
};
