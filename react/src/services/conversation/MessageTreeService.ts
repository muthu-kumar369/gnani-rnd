import type { ConversationMessage } from '../../store/useConversationStore';

export interface MessageNode {
    message: ConversationMessage;
    children: MessageNode[];
    parent: MessageNode | null;
}

/**
 * MessageTreeService - Handles message tree operations
 * Extracted from useConversationStore for better testability
 */
export class MessageTreeService {
    /**
     * Build a message tree from flat array
     */
    buildTree(messages: ConversationMessage[]): MessageNode | null {
        if (messages.length === 0) return null;

        const nodeMap = new Map<string, MessageNode>();

        // Create nodes
        messages.forEach(msg => {
            nodeMap.set(msg.id, {
                message: msg,
                children: [],
                parent: null
            });
        });

        // Link parent-child relationships
        messages.forEach(msg => {
            if (msg.parentId) {
                const parent = nodeMap.get(msg.parentId);
                const child = nodeMap.get(msg.id);
                if (parent && child) {
                    parent.children.push(child);
                    child.parent = parent;
                }
            }
        });

        // Find root (message without parent)
        const root = Array.from(nodeMap.values()).find(node => !node.parent);
        return root || null;
    }

    /**
     * Get path from root to target message
     */
    getPath(tree: MessageNode | null, targetId: string): ConversationMessage[] {
        if (!tree) return [];

        const path: ConversationMessage[] = [];

        const findPath = (node: MessageNode): boolean => {
            path.push(node.message);

            if (node.message.id === targetId) {
                return true;
            }

            for (const child of node.children) {
                if (findPath(child)) {
                    return true;
                }
            }

            path.pop();
            return false;
        };

        findPath(tree);
        return path;
    }

    /**
     * Get all leaf messages (messages with no children)
     */
    getLeaves(tree: MessageNode | null): ConversationMessage[] {
        if (!tree) return [];

        const leaves: ConversationMessage[] = [];

        const traverse = (node: MessageNode) => {
            if (node.children.length === 0) {
                leaves.push(node.message);
            } else {
                node.children.forEach(traverse);
            }
        };

        traverse(tree);
        return leaves;
    }

    /**
     * Find a node by message ID
     */
    findNode(tree: MessageNode | null, messageId: string): MessageNode | null {
        if (!tree) return null;

        if (tree.message.id === messageId) {
            return tree;
        }

        for (const child of tree.children) {
            const found = this.findNode(child, messageId);
            if (found) return found;
        }

        return null;
    }

    /**
     * Get sibling messages (alternative branches)
     */
    getSiblings(tree: MessageNode | null, messageId: string): ConversationMessage[] {
        const node = this.findNode(tree, messageId);
        if (!node || !node.parent) return [];

        return node.parent.children.map(child => child.message);
    }
}

export const messageTreeService = new MessageTreeService();
