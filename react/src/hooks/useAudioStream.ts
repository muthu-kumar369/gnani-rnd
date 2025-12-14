import { useCallback } from 'react';
import errorLogger from '../utils/errorLogger';
import { useIPC } from './useIPC';

export interface UseAudioStreamReturn {
  isConnected: boolean;
  sessionId: string | null;
  sendText: (text: string) => void;
  setSessionId: (sessionId: string | null) => void;
  setConversationId: (conversationId: string | null) => void;
  startStream: (options?: any) => void;
  stopStream: () => void;
}

export const useAudioStream = (): UseAudioStreamReturn => {
  // Leverage existing state from useIPC to avoid duplication
  const { isStreamConnected, sessionId: ipcSessionId } = useIPC();

  // We might want local state if we need to track optimistic updates, 
  // but for now relying on IPC truth is safer.

  const sendText = useCallback((text: string) => {
    if (!window.gnani?.stream?.sendText) {
      errorLogger.error('IPC stream.sendText not available', null, { context: 'useAudioStream' });
      return;
    }

    try {
      window.gnani.stream.sendText(text);
      errorLogger.info('Text sent via gRPC stream', { context: 'useAudioStream', textLength: text.length });
    } catch (error) {
      errorLogger.error('Failed to send text via stream', error as Error, { context: 'useAudioStream' });
    }
  }, []);

  const setSessionId = useCallback((id: string | null) => {
    if (!window.gnani?.stream?.setSessionId) {
      errorLogger.error('IPC stream.setSessionId not available', null, { context: 'useAudioStream' });
      return;
    }
    window.gnani.stream.setSessionId(id);
  }, []);

  const setConversationId = useCallback((id: string | null) => {
    if (!window.gnani?.stream?.setConversationId) {
      // It's possible old Electron build doesn't expose it yet, warn but don't error hard
      console.warn('IPC stream.setConversationId not available');
      return;
    }
    window.gnani.stream.setConversationId(id);
  }, []);

  const startStream = useCallback((options?: any) => {
    if (window.gnani?.stream?.startStream) {
      window.gnani.stream.startStream(options);
    }
  }, []);

  const stopStream = useCallback(() => {
    if (window.gnani?.stream?.stopStream) {
      window.gnani.stream.stopStream();
    }
  }, []);

  return {
    isConnected: isStreamConnected,
    sessionId: ipcSessionId,
    sendText,
    setSessionId,
    setConversationId,
    startStream,
    stopStream
  };
};
