import type { GnaniState, StateTrigger } from '../../state/GnaniStateMachine';

export interface ConversationMessage {
    id: string;
    _id?: string;
    type: 'user' | 'gnani' | 'tts' | 'action' | 'system';
    message: string;
    timestamp: number;
    parentId?: string;
    children?: string[];
    branchIndex?: number;
    metadata?: {
        segmentId?: string;
        state?: GnaniState;
        trigger?: StateTrigger;
        actionType?: string;
        fromState?: GnaniState;
        toState?: GnaniState;
        image?: string;
        mimeType?: string;
        edited?: boolean;
        status?: 'queued' | 'sending' | 'failed' | 'sent';
        model?: string;
    };
    tokenUsage?: {
        inputTokens: number;
        outputTokens: number;
        totalTokens: number;
        estimatedCost: number;
        model: string;
    };
}

export interface ConversationSummary {
    id: string;
    conversationId: string;
    title: string;
    updatedAt: string;
    timestamp: Date;
    preview: string;
}

export interface LlmModel {
    id: string;
    name: string;
    contextWindow: number;
    displayName?: string;
    description?: string;
    provider?: string;
}

export interface UndoAction {
    type: 'delete' | 'edit' | 'regenerate';
    messageId: string;
    previousState: any;
    timestamp: number;
    undoToken?: string;
}

// --- Slice Interfaces ---

export interface ConversationSlice {
    // State
    conversations: ConversationSummary[];
    models: LlmModel[];
    conversationId: string | null;
    title: string | null;
    selectedModel: string | null;
    selectedTemplate: string | null;
    isLoadingConversations: boolean;
    isLoadingModels: boolean;
    isSearching: boolean;

    // Actions
    setConversationId: (id: string | null) => void;
    setSelectedModel: (modelId: string) => void;
    setSelectedTemplate: (templateId: string) => void;
    createConversation: (accessToken: string, systemPrompt?: string) => Promise<string>;
    deleteConversation: (conversationId: string, accessToken: string) => Promise<void>;
    updateTitle: (conversationId: string, title: string, accessToken: string) => Promise<void>;
    updateConversationTemplate: (conversationId: string, templateId: string, accessToken: string) => Promise<void>;
    updateConversationModel: (conversationId: string, modelId: string, accessToken: string) => Promise<void>;
    loadConversation: (conversationId: string, accessToken: string) => Promise<void>;
    fetchModels: (accessToken: string) => Promise<void>;
    fetchConversations: (accessToken: string) => Promise<void>;
    searchConversations: (query: string) => Promise<void>;
    refreshConversation: (accessToken: string) => Promise<void>;
}

export interface MessageSlice {
    // State
    messages: ConversationMessage[];
    allMessages: ConversationMessage[];
    currentLeafId: string | null;
    isStreaming: boolean;
    streamProgress: number;
    isFetchingMessages: boolean;
    hasMoreMessages: boolean;
    abortController: AbortController | null;
    progressInterval: any;

    // Actions
    setIsStreaming: (isStreaming: boolean) => void;
    setStreamProgress: (progress: number) => void;
    addMessage: (message: Omit<ConversationMessage, 'id' | 'timestamp'>) => void;
    clearMessages: () => void;
    getMessagesByType: (type: ConversationMessage['type']) => ConversationMessage[];
    _deriveVisibleMessages: () => void;
    fetchPreviousMessages: (conversationId: string, before?: string) => Promise<void>;
    uploadFile: (file: File, accessToken: string) => Promise<{ fileId: string; url: string; filename: string }>;
    sendMessage: (text: string, accessToken: string, attachments?: any[], sendViaGrpc?: (text: string) => void) => Promise<void>;
    updateMessageContent: (messageId: string, content: string, append?: boolean) => void;
    updateLastMessageContent: (content: string, append?: boolean) => void;
    cancelStream: (sessionId: string, accessToken: string) => Promise<void>;
    regenerateResponse: (messageId: string, accessToken: string) => Promise<void>;
    editMessage: (messageId: string, newContent: string, accessToken: string) => Promise<void>;
    deleteMessage: (messageId: string, accessToken: string) => Promise<void>;
    navigateToBranch: (messageId: string, direction: 'prev' | 'next') => void;
    navigateToGeneration: (messageId: string, direction: 'prev' | 'next') => void;
}

export interface UndoSlice {
    // State
    undoData: { messageId: string; undoToken: string } | null;
    undoStack: UndoAction[];
    currentUndoToast: { message: string; onUndo: () => void; expiresAt: number } | null;

    // Actions
    pushUndo: (action: UndoAction) => void;
    popUndo: (messageId: string) => UndoAction | undefined;
    showUndoToast: (message: string, onUndo: () => void) => void;
    setUndoData: (data: { messageId: string; undoToken: string } | null) => void;
    dismissUndo: () => void;
    executeUndo: (accessToken: string) => Promise<void>;
    undoDelete: (messageId: string, accessToken: string) => Promise<void>;
    undoEdit: (messageId: string, accessToken: string) => Promise<void>;
    undoRegenerate: (messageId: string, accessToken: string) => Promise<void>;
    restoreMessage: (messageId: string, undoToken: string, accessToken: string) => Promise<void>;
}

// Combine for full store
export type ConversationStore = ConversationSlice & MessageSlice & UndoSlice;

// Re-export old interfaces if needed for compatibility (optional, but good for minimal diff)
export type ConversationState = Pick<ConversationStore,
    'conversations' | 'models' | 'conversationId' | 'title' | 'selectedModel' | 'selectedTemplate' |
    'isLoadingConversations' | 'isLoadingModels' | 'isSearching' |
    'messages' | 'allMessages' | 'currentLeafId' | 'isStreaming' | 'streamProgress' |
    'isFetchingMessages' | 'hasMoreMessages' | 'abortController' | 'progressInterval' |
    'undoData' | 'undoStack' | 'currentUndoToast'
>;

export type ConversationActions = Omit<ConversationStore, keyof ConversationState>;
