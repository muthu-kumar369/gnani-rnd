// react/src/hooks/useConversationSync.ts

import { useEffect, useRef } from 'react';
import { useConversation } from '../context/ConversationContext';
import { useIPC } from './useIPC';
import { useGnaniStateContext } from '../context/GnaniStateContext';
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
    const { addMessage } = useConversation();
    const { latestFinalSTT, latestLLMChunk, latestSTTSegmentId } = useIPC();
    const { state, previousState } = useGnaniStateContext();

    // Track last processed items to prevent duplicates
    const lastProcessedSTT = useRef<string | null>(null);
    const lastProcessedLLM = useRef<string | null>(null);
    const lastProcessedState = useRef<string | null>(null);
    // const lastTTSText = useRef<string | null>(null);

    /**
     * Sync final STT (user messages)
     */
    useEffect(() => {
        if (!latestFinalSTT || latestFinalSTT === lastProcessedSTT.current) {
            return;
        }

        // Only add user message if we're in listening or thinking state
        // (to ensure it's part of an active conversation)
        if (state === 'listening' || state === 'thinking' || previousState === 'listening') {
            addMessage({
                type: 'user',
                message: latestFinalSTT,
                metadata: {
                    segmentId: latestSTTSegmentId || undefined,
                },
            });

            lastProcessedSTT.current = latestFinalSTT;
            
            errorLogger.info('Added user message to conversation', {
                context: 'useConversationSync',
                text: latestFinalSTT.substring(0, 50),
            });
        }
    }, [latestFinalSTT, latestSTTSegmentId, state, previousState, addMessage]);

    /**
     * Sync complete LLM responses (Gnani messages)
     */
    useEffect(() => {
        if (!latestLLMChunk) return;

        try {
            let chunk = latestLLMChunk;
            
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
                // lastTTSText.current = text; // Removed to prevent duplicate TTS message

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
     * Sync TTS events (TTS messages)
     */
    // TTS sync removed to prevent duplicate messages in terminal.
    // The 'gnani' message from LLM response is sufficient.
    /*
    useEffect(() => {
        const handleTTSStarted = () => {
            // ...
        };
        // ...
    }, [addMessage]);
    */

    /**
     * Sync state transitions (system messages)
     */
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

    // This hook doesn't return anything - it just syncs data
    return null;
}

export default useConversationSync;
