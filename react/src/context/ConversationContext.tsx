import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { GnaniState, StateTrigger } from '../state/GnaniStateMachine';
import errorLogger from '../utils/errorLogger';

/**
 * Conversation message types
 */
export interface ConversationMessage {
    id: string;
    type: 'user' | 'gnani' | 'tts' | 'action' | 'system';
    message: string;
    timestamp: number;
    metadata?: {
        segmentId?: string;
        state?: GnaniState;
        trigger?: StateTrigger;
        actionType?: string;
        fromState?: GnaniState;
        toState?: GnaniState;
    };
}

/**
 * Context value interface
 */
interface ConversationContextValue {
    messages: ConversationMessage[];
    addMessage: (message: Omit<ConversationMessage, 'id' | 'timestamp'>) => void;
    clearMessages: () => void;
    getMessagesByType: (type: ConversationMessage['type']) => ConversationMessage[];
    lastUserMessage: ConversationMessage | null;
    lastGnaniMessage: ConversationMessage | null;
}

const ConversationContext = createContext<ConversationContextValue | undefined>(undefined);

const STORAGE_KEY = 'gnani_conversation_history';
const MAX_MESSAGES = 100; // Limit to prevent memory issues

interface ConversationProviderProps {
    children: ReactNode;
    persistToStorage?: boolean;
}

export const ConversationProvider: React.FC<ConversationProviderProps> = ({
    children,
    persistToStorage = true
}) => {
    const [messages, setMessages] = useState<ConversationMessage[]>(() => {
        // Load from localStorage on init if persistence enabled
        if (persistToStorage && typeof window !== 'undefined') {
            try {
                const stored = localStorage.getItem(STORAGE_KEY);
                console.log('[ConversationContext] Loading from storage:', STORAGE_KEY, stored ? 'Found data' : 'No data');
                if (stored) {
                    const parsed = JSON.parse(stored);
                    errorLogger.info('Loaded conversation history from storage', {
                        context: 'ConversationContext',
                        messageCount: parsed.length
                    });
                    console.log('[ConversationContext] Parsed messages:', parsed.length);
                    return parsed;
                }
            } catch (error) {
                console.error('[ConversationContext] Failed to load:', error);
                errorLogger.error('Failed to load conversation history', error as Error, {
                    context: 'ConversationContext'
                });
            }
        } else {
            console.log('[ConversationContext] Persistence disabled or no window');
        }
        return [];
    });

    // Persist to localStorage whenever messages change
    useEffect(() => {
        if (persistToStorage && typeof window !== 'undefined') {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
            } catch (error) {
                errorLogger.error('Failed to persist conversation history', error as Error, {
                    context: 'ConversationContext'
                });
            }
        }
    }, [messages, persistToStorage]);

    /**
     * Generate unique ID for message
     */
    const generateId = useCallback((): string => {
        return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }, []);

    /**
     * Add a new message to the conversation
     */
    const addMessage = useCallback((message: Omit<ConversationMessage, 'id' | 'timestamp'>) => {
        const newMessage: ConversationMessage = {
            ...message,
            id: generateId(),
            timestamp: Date.now(),
        };

        setMessages(prev => {
            const updated = [...prev, newMessage];

            // Limit message count to prevent memory issues
            if (updated.length > MAX_MESSAGES) {
                const trimmed = updated.slice(-MAX_MESSAGES);
                errorLogger.debug('Trimmed conversation history', {
                    context: 'ConversationContext',
                    removed: updated.length - MAX_MESSAGES
                });
                return trimmed;
            }

            return updated;
        });

        errorLogger.debug('Added message to conversation', {
            context: 'ConversationContext',
            type: message.type,
            messagePreview: message.message.substring(0, 50)
        });
    }, [generateId]);

    /**
     * Clear all messages
     */
    const clearMessages = useCallback(() => {
        setMessages([]);
        if (persistToStorage && typeof window !== 'undefined') {
            localStorage.removeItem(STORAGE_KEY);
        }
        errorLogger.info('Cleared conversation history', { context: 'ConversationContext' });
    }, [persistToStorage]);

    /**
     * Get messages filtered by type
     */
    const getMessagesByType = useCallback((type: ConversationMessage['type']): ConversationMessage[] => {
        return messages.filter(msg => msg.type === type);
    }, [messages]);

    /**
     * Get last user message
     */
    const lastUserMessage = [...messages].reverse().find(msg => msg.type === 'user') || null;

    /**
     * Get last Gnani message
     */
    const lastGnaniMessage = [...messages].reverse().find(msg => msg.type === 'gnani') || null;

    const value: ConversationContextValue = {
        messages,
        addMessage,
        clearMessages,
        getMessagesByType,
        lastUserMessage,
        lastGnaniMessage,
    };

    return (
        <ConversationContext.Provider value={value}>
            {children}
        </ConversationContext.Provider>
    );
};

/**
 * Hook to access conversation context
 */
export const useConversation = (): ConversationContextValue => {
    const context = useContext(ConversationContext);
    if (context === undefined) {
        throw new Error('useConversation must be used within a ConversationProvider');
    }
    return context;
};

export default ConversationContext;
