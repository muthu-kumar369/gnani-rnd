import { useState, useEffect } from 'react';
import errorLogger from '../../utils/errorLogger';

export const useIPCAudio = () => {
    const [isWakeWordReady, setIsWakeWordReady] = useState(false);
    const [isVADReady, setIsVADReady] = useState(false);
    const [isWakeWordTriggered, setIsWakeWordTriggered] = useState(false);
    const [isAudioListening, setIsAudioListening] = useState(false);
    const [isAudioEnded, setIsAudioEnded] = useState(false);

    useEffect(() => {
        if (!window.gnani) return;

        const unsubs: (() => void)[] = [];

        unsubs.push(window.gnani.on('wake:status', ({ state }: { state: string }) => {
            errorLogger.debug(`IPC: Wake word status: ${state}`, { context: 'useIPC' });
            setIsWakeWordReady(state === 'ready');
        }));

        unsubs.push(window.gnani.on('vad:status', ({ state }: { state: string }) => {
            errorLogger.debug(`IPC: VAD status: ${state}`, { context: 'useIPC' });
            setIsVADReady(state === 'ready');
        }));

        unsubs.push(window.gnani.on('wake:triggered', () => {
            errorLogger.debug('IPC: Wake triggered', { context: 'useIPC' });
            setIsWakeWordTriggered(true);
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

        return () => {
            unsubs.forEach(u => u && typeof u === 'function' && u());

            // Verify cleanup in development
            // Verify cleanup in development - REMOVED due to StrictMode false positives
            /* if (import.meta.env.MODE === 'development') { ... } */
        };
    }, []);

    return {
        isWakeWordReady,
        isVADReady,
        isWakeWordTriggered,
        isAudioListening,
        isAudioEnded
    };
};
