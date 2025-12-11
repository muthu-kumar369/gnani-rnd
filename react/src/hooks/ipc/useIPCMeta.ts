import { useState, useEffect } from 'react';
import errorLogger from '../../utils/errorLogger';

export const useIPCMeta = () => {
    const [toolStatus, setToolStatus] = useState<any>(null);

    useEffect(() => {
        if (!window.gnani || !window.gnani.stream) return;

        const unsubs: (() => void)[] = [];

        // Tool Status
        unsubs.push(window.gnani.stream.on('stream:tool_status', ({ status }: { status: any }) => {
            errorLogger.debug('[IPC] Tool Status received', { context: 'useIPCMeta', extra: { status } });
            setToolStatus(status);
        }));

        // Title Update
        unsubs.push(window.gnani.stream.on('stream:title_update', ({ session_id, title }: { session_id: string, title: string }) => {
            errorLogger.debug(`[IPC] Title Update received for session ${session_id}: "${title}"`, { context: 'useIPCMeta' });
            errorLogger.debug(`IPC: Title Update: ${title}`, { context: 'useIPC', sessionId: session_id });

            import('../../store/useConversationHistoryStore').then(({ useConversationHistoryStore }) => {
                useConversationHistoryStore.getState().updateConversationTitle(session_id, title);
            });
        }));

        // Typing Status
        unsubs.push(window.gnani.stream.on('stream:typing_status', ({ status, message }: { status: string, message?: string }) => {
            errorLogger.debug(`[IPC] Typing Status received: ${status} ${message ? `(${message})` : ''}`, { context: 'useIPCMeta' });
            errorLogger.debug(`IPC: Typing Status: ${status}`, { context: 'useIPC', message });

            import('../../store/useGnaniStore').then(({ useGnaniStore }) => {
                useGnaniStore.getState().setTypingStatus(status as any, message);
            });
        }));

        return () => {
            unsubs.forEach(u => u && typeof u === 'function' && u());

            // Verify cleanup in development
            // Verify cleanup in development - REMOVED due to StrictMode false positives
            /* if (import.meta.env.MODE === 'development') { ... } */
        };
    }, []);

    return {
        toolStatus
    };
};
