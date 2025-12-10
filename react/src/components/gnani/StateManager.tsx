import React, { useEffect } from 'react';
import errorLogger from '../../utils/errorLogger';
import type { GnaniState } from '../../store/useGnaniStore';

interface StateManagerProps {
    state: GnaniState;
    isIdle: boolean;
    isListening: boolean;
    isThinking: boolean;
    isSpeaking: boolean;
    isWakeWordTriggered: boolean;
    latestFinalSTT: string | null;
    lastProcessedFinalSTT: React.MutableRefObject<string | null>;
    isTtsStarted: boolean; // From IPC
    isTtsEnded: boolean;   // From IPC
    streamingTTS: any;     // Ref to StreamingTTS (to stop it on error)
    transition: (eventName: any) => void;
    setIsStreaming: (isStreaming: boolean) => void;
    showNotification: (title: string, body: string) => void;
}

export const StateManager: React.FC<StateManagerProps> = React.memo(({
    state,
    isIdle,
    isListening,
    isThinking,
    isSpeaking,
    isWakeWordTriggered,
    latestFinalSTT,
    lastProcessedFinalSTT,
    isTtsStarted,
    isTtsEnded,
    streamingTTS,
    transition,
    setIsStreaming,
    showNotification
}) => {

    // --- Transitions ---

    // Wake Word -> Listening
    useEffect(() => {
        if (isWakeWordTriggered && isIdle) {
            errorLogger.info('Wake word triggered, transitioning to listening', { context: 'StateManager' });
            showNotification('Gnani Listening', 'Wake word detected');
            transition('wake-word-detected');
        }
    }, [isWakeWordTriggered, isIdle, transition, showNotification]);

    // Final STT -> Thinking
    useEffect(() => {
        if (latestFinalSTT && isListening && latestFinalSTT !== lastProcessedFinalSTT.current) {
            errorLogger.info('Final STT received, transitioning to thinking', { context: 'StateManager', text: latestFinalSTT });
            lastProcessedFinalSTT.current = latestFinalSTT;
            setIsStreaming(true);
            transition('vad-end');
        }
    }, [latestFinalSTT, isListening, transition, setIsStreaming]);
    // Note: lastProcessedFinalSTT.current assignment is valid in effect.

    // TTS Start -> Speaking
    useEffect(() => {
        if (isTtsStarted && isThinking) {
            errorLogger.info('TTS started, transitioning to speaking', { context: 'StateManager' });
            transition('tts-start');
        }
    }, [isTtsStarted, isThinking, transition]);

    // TTS End -> Idle (or TTS Complete)
    useEffect(() => {
        if (isTtsEnded && isSpeaking) {
            errorLogger.info('TTS ended, transitioning to idle', { context: 'StateManager' });
            transition('tts-complete');
        }
    }, [isTtsEnded, isSpeaking, transition]);

    // --- Timeouts ---

    // Thinking Timeout (30s)
    useEffect(() => {
        if (isThinking) {
            const timeout = setTimeout(() => {
                errorLogger.error('Thinking state timeout (30s), recovering to idle', null, { context: 'StateManager' });
                showNotification('Error', 'Response timeout - returning to idle');
                transition('error');
            }, 30000);
            return () => clearTimeout(timeout);
        }
    }, [isThinking, transition, showNotification]);

    // Speaking Timeout (30s)
    useEffect(() => {
        if (isSpeaking) {
            const timeout = setTimeout(() => {
                errorLogger.error('Speaking state timeout (30s), recovering to idle', null, { context: 'StateManager' });
                showNotification('Error', 'TTS timeout - stopping playback');
                if (streamingTTS) {
                    streamingTTS.stop();
                }
                transition('error');
            }, 30000);
            return () => clearTimeout(timeout);
        }
    }, [isSpeaking, transition, showNotification, streamingTTS]);

    // Listening Timeout (60s)
    useEffect(() => {
        if (isListening) {
            const timeout = setTimeout(() => {
                errorLogger.warn('Listening state timeout (60s), transitioning to thinking', { context: 'StateManager' });
                showNotification('Info', 'Listening timeout - processing input');
                transition('manual-stop');
            }, 60000);
            return () => clearTimeout(timeout);
        }
    }, [isListening, transition, showNotification]);

    return null;
});

StateManager.displayName = 'StateManager';
