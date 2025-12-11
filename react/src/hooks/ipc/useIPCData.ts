import { useState, useEffect } from 'react';
import errorLogger from '../../utils/errorLogger';
import { eventManager } from '../../utils/eventManager';

export const useIPCData = () => {
    const [latestPartialSTT, setLatestPartialSTT] = useState<string | null>(null);
    const [latestFinalSTT, setLatestFinalSTT] = useState<string | null>(null);
    const [latestLLMChunk, setLatestLLMChunk] = useState<any>(null);
    const [latestSTTSegmentId, setLatestSTTSegmentId] = useState<string | null>(null);

    useEffect(() => {
        if (!window.gnani || !window.gnani.stream) return;

        const unsubs: (() => void)[] = [];

        // Partial STT
        unsubs.push(window.gnani.stream.on('stream:partial', ({ text, segment_id }: { text: string, segment_id: string }) => {
            errorLogger.debug(`[IPC] Received partial STT for segment ${segment_id}: "${text}"`, { context: 'useIPCData' });
            errorLogger.debug(`IPC: Partial STT: ${text}`, { context: 'useIPC' });
            setLatestPartialSTT(text);
            setLatestSTTSegmentId(segment_id);
        }));

        // Final STT
        unsubs.push(window.gnani.stream.on('stream:final', ({ text, segment_id }: { text: string, segment_id: string }) => {
            errorLogger.debug(`[IPC] Received final STT for segment ${segment_id}: "${text}"`, { context: 'useIPCData' });
            errorLogger.debug(`IPC: Final STT: ${text}`, { context: 'useIPC' });
            setLatestFinalSTT(text);
            setLatestSTTSegmentId(segment_id || `text-${Date.now()}`);
            setLatestPartialSTT(null);
        }));

        // TTS Chunk (LLM Chunk via gRPC)
        unsubs.push(window.gnani.stream.on('stream:tts_chunk', ({ chunk }: { chunk: any }) => {
            errorLogger.debug('[IPC] RAW stream:tts_chunk received', { context: 'useIPCData', extra: { chunk } });
            errorLogger.debug(`IPC: LLM Chunk: ${chunk}`, { context: 'useIPC' });
            setLatestLLMChunk(chunk);
        }));

        // LLM Chunk (Queue Processing)
        const llmChunkQueue: any[] = [];
        let isProcessingQueue = false;

        const processQueue = () => {
            if (llmChunkQueue.length === 0) {
                isProcessingQueue = false;
                return;
            }

            isProcessingQueue = true;
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
            llmChunkQueue.push(data);
            if (!isProcessingQueue) {
                processQueue();
            }
        }));

        // Clear data on TTS End
        const handleTtsEnded = () => {
            setTimeout(() => {
                setLatestFinalSTT(null);
                setLatestLLMChunk(null);
            }, 150);
        };
        const cleanup = eventManager.addEventListener('tts:ended', handleTtsEnded as EventListener, undefined, 'useIPCData');
        unsubs.push(cleanup);

        return () => {
            unsubs.forEach(u => u && typeof u === 'function' && u());

            // Verify cleanup in development
            // Verify cleanup in development - REMOVED due to StrictMode false positives
            /* if (import.meta.env.MODE === 'development') { ... } */
        };
    }, []);

    return {
        latestPartialSTT,
        latestFinalSTT,
        latestLLMChunk,
        latestSTTSegmentId
    };
};
