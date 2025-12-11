import { useIPCConnection } from './useIPCConnection';
import { useIPCAudio } from './useIPCAudio';
import { useIPCTts } from './useIPCTts';
import { useIPCData } from './useIPCData';
import { useIPCMeta } from './useIPCMeta';

export type IPCAppStatus = 'idle' | 'listening' | 'thinking' | 'speaking';

export const useIPC = () => {
    const connection = useIPCConnection();
    const audio = useIPCAudio();
    const tts = useIPCTts();
    const data = useIPCData();
    const meta = useIPCMeta();

    return {
        // Connection
        isStreamConnected: connection.isStreamConnected,
        streamErrorMessage: connection.streamErrorMessage,
        latestSessionId: connection.latestSessionId,
        latestConversationId: connection.latestConversationId,
        sessionId: connection.latestSessionId, // Alias
        conversationId: connection.latestConversationId, // Alias
        setSessionId: connection.setSessionId,

        // Audio
        isWakeWordReady: audio.isWakeWordReady,
        isVADReady: audio.isVADReady,
        isWakeWordTriggered: audio.isWakeWordTriggered,
        isAudioListening: audio.isAudioListening,
        isAudioEnded: audio.isAudioEnded,

        // TTS
        isTtsStarted: tts.isTtsStarted,
        isTtsEnded: tts.isTtsEnded,

        // Data
        latestPartialSTT: data.latestPartialSTT,
        latestFinalSTT: data.latestFinalSTT,
        latestLLMChunk: data.latestLLMChunk,
        latestSTTSegmentId: data.latestSTTSegmentId,

        // Meta
        toolStatus: meta.toolStatus
    };
};
