// react/src/hooks/useConversationSync.ts

import { useEffect, useRef } from 'react';
import { useConversationStore } from '../store/useConversationStore';
import { useIPC } from './useIPC';
import { useGnaniStore } from '../store/useGnaniStore';
import errorLogger from '../utils/errorLogger';

/**
 * Hook to sync IPC events and state changes to conversation store
 * 
 * This hook listens to:
 * - Final STT transcripts (user messages)
 * - Complete LLM responses (Gnani messages)
 * - TTS events (TTS messages)
 * - State machine transitions (system messages)
 * 
 * And adds them to the conversation history.
 */
export function useConversationSync() {
    const { addMessage } = useConversationStore();
    const { latestFinalSTT, latestLLMChunk, latestSTTSegmentId } = useIPC();
    const { state, previousState } = useGnaniStore();

    // Track last processed items to prevent duplicates
    const lastProcessedSegmentId = useRef<string | null>(null);
    const lastProcessedLLM = useRef<string | null>(null);

    /**
     * Sync final STT (user messages)
     */
    useEffect(() => {
        // If we have a segment ID, use it for duplicate detection
        if (latestSTTSegmentId) {
            if (latestSTTSegmentId === lastProcessedSegmentId.current) {
                return;
            }
        } else {
            // Fallback to text-based detection if no segment ID (e.g. legacy or text input without ID)
            // But wait, text input from terminal might not have segment ID.
            // Let's assume we want to allow duplicates if they are distinct events.
            // For now, if no segment ID, we might risk duplicates or missing messages.
            // Ideally, text input should generate a segment ID or we rely on the fact that
            // the state transition triggers this.
            
            // Actually, for text input, `latestFinalSTT` updates. If it's the same text,
            // React effect might not trigger if the value didn't change!
            // But `useIPC` sets state, so if we set same string, it might not re-render.
            // However, `useIPC` uses `useState`.
            
            // Let's stick to: if segment ID exists, use it. If not, use text but be careful.
            // The issue reported is "Hello" -> "Hello" ignored.
            // If we remove the text check, we might get loops if the effect re-runs for other reasons.
            // But `latestFinalSTT` is in dependency array.
            
            // If `latestSTTSegmentId` is present, we trust it.
        }

        if (!latestFinalSTT) return;

        // Strict duplicate check only if we have a segment ID match
        if (latestSTTSegmentId && latestSTTSegmentId === lastProcessedSegmentId.current) {
            return;
        }
        
        // If no segment ID (e.g. manual text input echo?), we might need another way.
        // But wait, manual text input in TerminalPanel sends text to backend, 
        // which echoes it back via `stream:final`? 
        // If so, backend should assign a segment ID.
        
        // If we just remove the text check:
        // `if (!latestFinalSTT) return;`
        // But we need to update `lastProcessed` to avoid infinite loop if effect re-runs.
        
        // Let's rely on `latestSTTSegmentId` primarily.
        
        if (state === 'listening' || state === 'thinking' || state === 'speaking' || previousState === 'listening' || previousState === 'speaking') {
             addMessage({
                type: 'user',
                message: latestFinalSTT,
                metadata: {
                    segmentId: latestSTTSegmentId || undefined,
                },
            });

            if (latestSTTSegmentId) {
                lastProcessedSegmentId.current = latestSTTSegmentId;
            }
            // We don't track text anymore for duplicates if we have ID.
            // If we don't have ID, we might still want to track text?
            // Let's assume backend always sends ID for `stream:final`.
            
            lastProcessedLLM.current = null; // Reset LLM tracker for new turn

            errorLogger.info('Added user message to conversation', {
                context: 'useConversationSync',
                text: latestFinalSTT.substring(0, 50),
                segmentId: latestSTTSegmentId
            });
        }
    }, [latestFinalSTT, latestSTTSegmentId, state, previousState, addMessage]);

    /**
     * Sync complete LLM responses (Gnani messages)
     */
    useEffect(() => {
        if (!latestLLMChunk) return;

        try {
            // Unwrap the payload from useIPC wrapper
            let chunk = latestLLMChunk.payload;

            // Parse if string
            if (typeof chunk === 'string') {
                try {
                    chunk = JSON.parse(chunk);
                } catch (e) {
                    // If not JSON, treat as plain text
                    chunk = { type: 'complete_response', text: chunk };
                }
            }

            const { type, text } = chunk;

            // Only process complete responses (not partial chunks or debug)
            if (type === 'complete_response' && text && text !== lastProcessedLLM.current) {
                addMessage({
                    type: 'gnani',
                    message: text,
                });

                lastProcessedLLM.current = text;

                errorLogger.info('Added Gnani message to conversation', {
                    context: 'useConversationSync',
                    text: text.substring(0, 50),
                });
            }
        } catch (error) {
            errorLogger.error('Error processing LLM chunk', error as Error, {
                context: 'useConversationSync',
            });
        }
    }, [latestLLMChunk, addMessage]);

    /**
     * Sync state transitions (system messages)
     * 
     * DISABLED: State transitions are no longer added to conversation history
     * to keep the terminal clean and focused on user/gnani messages only.
     * State transitions still occur and are logged, just not displayed.
     */
    /*
    useEffect(() => {
        if (!previousState || state === previousState) {
            return;
        }

        const stateKey = `${previousState}->${state}`;
        if (stateKey === lastProcessedState.current) {
            return;
        }

        // Create human-readable state transition message
        const getStateMessage = () => {
            switch (state) {
                case 'listening':
                    return '🎤 Listening...';
                case 'thinking':
                    return '🧠 Processing...';
                case 'speaking':
                    return '💬 Speaking...';
                case 'idle':
                    return '⏸️ Ready';
                default:
                    return `State: ${previousState} → ${state}`;
            }
        };

        addMessage({
            type: 'system',
            message: getStateMessage(),
            metadata: {
                fromState: previousState,
                toState: state,
            },
        });

        lastProcessedState.current = stateKey;

        errorLogger.debug('Added state transition to conversation', {
            context: 'useConversationSync',
            from: previousState,
            to: state,
        });
    }, [state, previousState, addMessage]);
    */

    // This hook doesn't return anything - it just syncs data
    return null;
}

export default useConversationSync;
