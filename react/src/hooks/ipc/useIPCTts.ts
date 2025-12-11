import { useState, useEffect } from 'react';
import errorLogger from '../../utils/errorLogger';
import { eventManager } from '../../utils/eventManager';

export const useIPCTts = () => {
    const [isTtsStarted, setIsTtsStarted] = useState(false);
    const [isTtsEnded, setIsTtsEnded] = useState(false);

    useEffect(() => {
        if (!window.gnani) return;

        const unsubs: (() => void)[] = [];

        // Backend Event
        if (window.gnani.stream) {
            unsubs.push(window.gnani.stream.on('stream:tts_stop', () => {
                errorLogger.info('[IPC] stream:tts_stop received. Dispatching tts:interrupted', { context: 'useIPCTts' });
                errorLogger.info('IPC: TTS Stop received', { context: 'useIPC' });
                window.dispatchEvent(new CustomEvent('tts:interrupted'));
            }));
        }

        // Frontend Custom Events (StreamingTTS)
        const handleTtsStarted = () => {
            errorLogger.debug('CustomEvent: TTS started', { context: 'useIPC' });
            setIsTtsStarted(true);
            window.gnani?.send('tts:started');
        };

        const handleTtsEnded = () => {
            errorLogger.debug('CustomEvent: TTS ended', { context: 'useIPC' });
            setIsTtsEnded(true);

            setTimeout(() => {
                setIsTtsStarted(false);
                setIsTtsEnded(false);
            }, 150);

            window.gnani?.send('tts:ended');
        };

        const cleanup1 = eventManager.addEventListener('tts:started', handleTtsStarted as EventListener, undefined, 'useIPCTts');
        const cleanup2 = eventManager.addEventListener('tts:ended', handleTtsEnded as EventListener, undefined, 'useIPCTts');

        unsubs.push(cleanup1, cleanup2);

        return () => {
            unsubs.forEach(u => u && typeof u === 'function' && u());

            // Verify cleanup in development
            // Verify cleanup in development - REMOVED due to StrictMode false positives
            /* if (import.meta.env.MODE === 'development') { ... } */
        };
    }, []);

    return {
        isTtsStarted,
        isTtsEnded
    };
};
