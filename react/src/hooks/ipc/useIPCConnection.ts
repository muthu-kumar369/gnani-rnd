import { useState, useEffect } from 'react';
import errorLogger from '../../utils/errorLogger';
import { resourceTracker } from '../../utils/resourceTracker';

export const useIPCConnection = () => {
    const [isStreamConnected, setIsStreamConnected] = useState(false);
    const [streamErrorMessage, setStreamErrorMessage] = useState<string | null>(null);
    const [latestSessionId, setLatestSessionId] = useState<string | null>(null);
    const [latestConversationId, setLatestConversationId] = useState<string | null>(null);

    useEffect(() => {
        if (!window.gnani || !window.gnani.stream) return;

        const unsubs: (() => void)[] = [];

        unsubs.push(window.gnani.stream.on('stream:connected', ({ sessionId }: { sessionId?: string }) => {
            errorLogger.debug(`IPC: Stream connected (Session: ${sessionId})`, { context: 'useIPC' });
            setIsStreamConnected(true);
            setStreamErrorMessage(null);
            if (sessionId) setLatestSessionId(sessionId);

            // Track stream resource
            resourceTracker.track('stream', 'gRPC-Stream', sessionId || 'unknown', {
                sessionId,
                timestamp: Date.now()
            });
        }));

        unsubs.push(window.gnani.stream.on('stream:conversation_id', ({ conversationId }: { conversationId: string }) => {
            errorLogger.info(`IPC: Conversation ID update: ${conversationId}`, { context: 'useIPC' });
            setLatestConversationId(conversationId);
        }));

        unsubs.push(window.gnani.stream.on('stream:disconnected', () => {
            errorLogger.debug('IPC: Stream disconnected', { context: 'useIPC' });
            setIsStreamConnected(false);

            // Release stream resource
            resourceTracker.release('stream', 'gRPC-Stream');
        }));

        unsubs.push(window.gnani.stream.on('stream:error', (error: Error) => {
            errorLogger.error('IPC: Stream error', error, { context: 'useIPC' });
            setStreamErrorMessage(error.message);
            setIsStreamConnected(false);

            // Release stream resource on error
            resourceTracker.release('stream', 'gRPC-Stream');
        }));

        return () => {
            unsubs.forEach(u => u && typeof u === 'function' && u());

            // Verify cleanup in development - REMOVED due to StrictMode false positives
            // (StrictMode remounts immediately, so listeners are back by the time this check runs)
            /* if (import.meta.env.MODE === 'development') { ... } */
        };
    }, []);

    const setSessionId = (sessionId: string | null) => {
        if (window.gnani && window.gnani.stream) {
            window.gnani.stream.setSessionId(sessionId);
        }
    };

    const setConversationId = (conversationId: string | null) => {
        if (window.gnani && window.gnani.stream && window.gnani.stream.setConversationId) {
            window.gnani.stream.setConversationId(conversationId);
        }
    };

    return {
        isStreamConnected,
        streamErrorMessage,
        latestSessionId,
        latestConversationId,
        setSessionId,
        setConversationId
    };
};
