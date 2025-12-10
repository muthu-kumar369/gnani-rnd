import type { ConversationMessage } from '../store/useConversationStore';

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
    repairs: Array<{ messageId: string; fix: string }>;
}

export class MessageTreeValidator {
    static validate(messages: ConversationMessage[]): ValidationResult {
        const errors: string[] = [];
        const repairs: Array<{ messageId: string; fix: string }> = [];
        const messageMap = new Map(messages.map(m => [m.id, m]));

        // Check 1: All parentIds must exist (except root messages)
        for (const msg of messages) {
            if (msg.parentId && !messageMap.has(msg.parentId)) {
                errors.push(`Message ${msg.id} has invalid parentId: ${msg.parentId}`);
                repairs.push({
                    messageId: msg.id,
                    fix: 'Set parentId to null (make it a root message)'
                });
            }
        }

        // Check 2: No circular references
        for (const msg of messages) {
            if (this.hasCircularReference(msg, messageMap)) {
                errors.push(`Message ${msg.id} has circular reference`);
                repairs.push({
                    messageId: msg.id,
                    fix: 'Break circular reference by setting parentId to null'
                });
            }
        }

        // Check 3: Children arrays match actual parent references
        for (const msg of messages) {
            if (msg.children) {
                for (const childId of msg.children) {
                    const child = messageMap.get(childId);
                    if (!child) {
                        errors.push(`Message ${msg.id} references non-existent child: ${childId}`);
                    } else if (child.parentId !== msg.id) {
                        errors.push(`Child ${childId} doesn't reference parent ${msg.id}`);
                        repairs.push({
                            messageId: childId,
                            fix: `Set parentId to ${msg.id}`
                        });
                    }
                }
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
            repairs
        };
    }

    static repair(messages: ConversationMessage[]): ConversationMessage[] {
        const messageMap = new Map(messages.map(m => [m.id, m]));
        const repaired: ConversationMessage[] = [];

        for (const msg of messages) {
            const repairedMsg = { ...msg };

            // Fix invalid parentId
            if (repairedMsg.parentId && !messageMap.has(repairedMsg.parentId)) {
                console.warn(`Repairing message ${msg.id}: invalid parentId ${msg.parentId}`);
                repairedMsg.parentId = undefined;
            }

            // Fix circular references
            if (this.hasCircularReference(repairedMsg, messageMap)) {
                console.warn(`Repairing message ${msg.id}: circular reference detected`);
                repairedMsg.parentId = undefined;
            }

            repaired.push(repairedMsg);
        }

        // Rebuild children arrays
        for (const msg of repaired) {
            msg.children = [];
        }

        for (const msg of repaired) {
            if (msg.parentId) {
                const parent = repaired.find(m => m.id === msg.parentId);
                if (parent) {
                    parent.children = parent.children || [];
                    if (!parent.children.includes(msg.id)) {
                        parent.children.push(msg.id);
                    }
                }
            }
        }

        return repaired;
    }

    private static hasCircularReference(
        msg: ConversationMessage,
        messageMap: Map<string, ConversationMessage>,
        visited: Set<string> = new Set()
    ): boolean {
        if (visited.has(msg.id)) {
            return true;
        }

        if (!msg.parentId) {
            return false;
        }

        visited.add(msg.id);
        const parent = messageMap.get(msg.parentId);
        if (!parent) {
            return false;
        }

        return this.hasCircularReference(parent, messageMap, visited);
    }
}
