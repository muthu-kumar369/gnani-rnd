import type { ConversationMessage } from '../../store/useConversationStore';

/**
 * MessageValidation - Validates message data
 * Extracted from useConversationStore for better testability
 */
export class MessageValidation {
    /**
     * Validate message structure
     */
    static validateMessage(message: Partial<ConversationMessage>): boolean {
        if (!message.type || !message.message) {
            return false;
        }

        const validTypes = ['user', 'gnani', 'tts', 'action', 'system'];
        if (!validTypes.includes(message.type)) {
            return false;
        }

        return true;
    }

    /**
     * Validate message tree structure
     */
    static validateTree(messages: ConversationMessage[]): { valid: boolean; errors: string[] } {
        const errors: string[] = [];
        const messageIds = new Set(messages.map(m => m.id));

        messages.forEach(msg => {
            // Check if parent exists
            if (msg.parentId && !messageIds.has(msg.parentId)) {
                errors.push(`Message ${msg.id} has invalid parent ${msg.parentId}`);
            }

            // Check for circular references
            if (msg.parentId === msg.id) {
                errors.push(`Message ${msg.id} has circular reference to itself`);
            }
        });

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Sanitize message content
     */
    static sanitizeContent(content: string): string {
        // Basic sanitization - remove potentially harmful content
        return content
            .trim()
            .replace(/<script[^>]*>.*?<\/script>/gi, '')
            .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '');
    }
}
