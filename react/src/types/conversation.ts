// react/src/types/conversation.ts
// Shared types to avoid circular dependencies

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
        state?: any;
        trigger?: any;
        actionType?: string;
        fromState?: any;
        toState?: any;
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
