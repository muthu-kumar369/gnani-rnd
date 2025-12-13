// react/src/machines/gnaniStateMachine.ts
import { setup, assign } from 'xstate';

// Define the context type
export interface GnaniMachineContext {
    transcript: string;
    partialTranscript: string;
    response: string;
    error: string | null;
    conversationMessages: Message[];
    segmentId: string | null;
    // IPC state flags
    isMicActive: boolean;
    isWakeWordReady: boolean;
    isVADReady: boolean;
    isStreamConnected: boolean;
    isWakeWordTriggered: boolean;
    isAudioListening: boolean;
    isAudioEnded: boolean;
    isTtsStarted: boolean;
    isTtsEnded: boolean;
}

export interface Message {
    id: string;
    sender: 'user' | 'gnani';
    text: string;
    isFinal: boolean;
    type?: 'partial_text' | 'llm_chunk' | 'final_text' | 'error_message';
    segmentId?: string;
}

// Define event types
export type GnaniMachineEvent =
    | { type: 'INITIALIZED' }
    | { type: 'WAKE_WORD_DETECTED' }
    | { type: 'MIC_START' }
    | { type: 'MIC_STOP' }
    | { type: 'STREAM_CONNECTED' }
    | { type: 'STREAM_DISCONNECTED' }
    | { type: 'STREAM_ERROR'; error: string }
    | { type: 'PARTIAL_STT'; transcript: string; segmentId: string }
    | { type: 'FINAL_STT'; transcript: string; segmentId: string }
    | { type: 'LLM_CHUNK'; chunk: string; segmentId: string }
    | { type: 'TTS_STARTED' }
    | { type: 'TTS_ENDED' }
    | { type: 'BARGE_IN' }
    | { type: 'TIMEOUT' }
    | { type: 'RETRY' }
    | { type: 'DISMISS' }
    | { type: 'RESET' }
    | { type: 'UPDATE_IPC_STATE'; payload: Partial<GnaniMachineContext> };

export const gnaniMachine = setup({
    types: {
        context: {} as GnaniMachineContext,
        events: {} as GnaniMachineEvent,
    },
    actions: {
        setPartialTranscript: assign({
            partialTranscript: ({ event }) => {
                if (event.type === 'PARTIAL_STT') {
                    return event.transcript;
                }
                return '';
            },
        }),
        setFinalTranscript: assign({
            transcript: ({ event }) => {
                if (event.type === 'FINAL_STT') {
                    return event.transcript;
                }
                return '';
            },
            partialTranscript: () => '', // Clear partial when final arrives
        }),
        appendLLMChunk: assign({
            response: ({ context, event }) => {
                if (event.type === 'LLM_CHUNK') {
                    return context.response + event.chunk;
                }
                return context.response;
            },
        }),
        setError: assign({
            error: ({ event }) => {
                if (event.type === 'STREAM_ERROR') {
                    return event.error;
                }
                return null;
            },
        }),
        clearError: assign({
            error: () => null,
        }),
        addUserMessage: assign({
            conversationMessages: ({ context, event }) => {
                if (event.type === 'PARTIAL_STT' || event.type === 'FINAL_STT') {
                    const messageId = event.segmentId;
                    const existingIndex = context.conversationMessages.findIndex(
                        (msg) => msg.id === messageId
                    );

                    const newMessage: Message = {
                        id: messageId,
                        sender: 'user',
                        text: event.transcript,
                        isFinal: event.type === 'FINAL_STT',
                        type: event.type === 'FINAL_STT' ? 'final_text' : 'partial_text',
                        segmentId: event.segmentId,
                    };

                    if (existingIndex !== -1) {
                        const updated = [...context.conversationMessages];
                        updated[existingIndex] = newMessage;
                        return updated;
                    }
                    return [...context.conversationMessages, newMessage];
                }
                return context.conversationMessages;
            },
            segmentId: ({ event }) => {
                if (event.type === 'PARTIAL_STT' || event.type === 'FINAL_STT') {
                    return event.segmentId;
                }
                return null;
            },
        }),
        addGnaniMessage: assign({
            conversationMessages: ({ context, event }) => {
                if (event.type === 'LLM_CHUNK' && context.segmentId) {
                    const gnaniMessageId = `gnani-${context.segmentId}`;
                    const existingIndex = context.conversationMessages.findIndex(
                        (msg) => msg.id === gnaniMessageId
                    );

                    const existingMessage = context.conversationMessages[existingIndex];
                    const newText = existingMessage
                        ? existingMessage.text + event.chunk
                        : event.chunk;

                    const newMessage: Message = {
                        id: gnaniMessageId,
                        sender: 'gnani',
                        text: newText,
                        isFinal: false,
                        type: 'llm_chunk',
                        segmentId: context.segmentId,
                    };

                    if (existingIndex !== -1) {
                        const updated = [...context.conversationMessages];
                        updated[existingIndex] = newMessage;
                        return updated;
                    }
                    return [...context.conversationMessages, newMessage];
                }
                return context.conversationMessages;
            },
        }),
        finalizeGnaniMessage: assign({
            conversationMessages: ({ context }) => {
                if (context.segmentId) {
                    const gnaniMessageId = `gnani-${context.segmentId}`;
                    const existingIndex = context.conversationMessages.findIndex(
                        (msg) => msg.id === gnaniMessageId
                    );

                    if (existingIndex !== -1) {
                        const updated = [...context.conversationMessages];
                        updated[existingIndex] = {
                            ...updated[existingIndex],
                            isFinal: true,
                            type: 'final_text',
                        };
                        return updated;
                    }
                }
                return context.conversationMessages;
            },
        }),
        resetConversation: assign({
            transcript: () => '',
            partialTranscript: () => '',
            response: () => '',
            conversationMessages: () => [],
            segmentId: () => null,
        }),
        updateIPCState: assign(({ event }) => {
            if (event.type === 'UPDATE_IPC_STATE') {
                return event.payload;
            }
            return {};
        }),
    },
    guards: {
        isAuthenticated: ({ context }) => {
            // This will be passed from the hook
            return true; // Placeholder, actual check in hook
        },
    },
}).createMachine({
    id: 'gnani',
    initial: 'initializing',
    context: {
        transcript: '',
        partialTranscript: '',
        response: '',
        error: null,
        conversationMessages: [],
        segmentId: null,
        isMicActive: false,
        isWakeWordReady: false,
        isVADReady: false,
        isStreamConnected: false,
        isWakeWordTriggered: false,
        isAudioListening: false,
        isAudioEnded: false,
        isTtsStarted: false,
        isTtsEnded: false,
    },
    on: {
        UPDATE_IPC_STATE: {
            actions: 'updateIPCState',
        },
        STREAM_ERROR: {
            target: '.error',
            actions: 'setError',
        },
        RESET: {
            target: '.idle',
            actions: 'resetConversation',
        },
    },
    states: {
        initializing: {
            on: {
                INITIALIZED: 'idle',
            },
        },
        idle: {
            entry: 'clearError',
            on: {
                WAKE_WORD_DETECTED: {
                    target: 'wakeWordListening',
                },
                MIC_START: {
                    target: 'micRecording',
                },
            },
        },
        wakeWordListening: {
            on: {
                MIC_START: 'micRecording',
                TIMEOUT: 'idle',
            },
        },
        micRecording: {
            on: {
                STREAM_CONNECTED: 'streaming',
                MIC_STOP: 'idle',
            },
        },
        streaming: {
            on: {
                PARTIAL_STT: {
                    target: 'receivingSTT',
                    actions: ['setPartialTranscript', 'addUserMessage'],
                },
                MIC_STOP: 'idle',
            },
        },
        receivingSTT: {
            on: {
                PARTIAL_STT: {
                    actions: ['setPartialTranscript', 'addUserMessage'],
                },
                FINAL_STT: {
                    target: 'thinking',
                    actions: ['setFinalTranscript', 'addUserMessage'],
                },
                MIC_STOP: 'idle',
            },
        },
        thinking: {
            on: {
                LLM_CHUNK: {
                    target: 'responding',
                    actions: ['appendLLMChunk', 'addGnaniMessage'],
                },
                TTS_STARTED: 'responding',
            },
        },
        responding: {
            on: {
                LLM_CHUNK: {
                    actions: ['appendLLMChunk', 'addGnaniMessage'],
                },
                TTS_ENDED: {
                    target: 'idle',
                    actions: 'finalizeGnaniMessage',
                },
                BARGE_IN: {
                    target: 'micRecording',
                },
            },
        },
        error: {
            on: {
                RETRY: {
                    target: 'idle',
                    actions: 'clearError',
                },
                DISMISS: {
                    target: 'idle',
                    actions: 'clearError',
                },
            },
        },
    },
});
