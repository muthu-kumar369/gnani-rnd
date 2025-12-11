import type { ConversationMessage } from '../../store/useConversationStore';
import { messageTreeService, type MessageNode } from './MessageTreeService';

/**
 * BranchingService - Handles message branching and navigation
 * Extracted from useConversationStore for better testability
 */
export class BranchingService {
    /**
     * Navigate to a specific branch
     */
    navigateToBranch(
        currentPath: ConversationMessage[],
        targetMessageId: string,
        tree: MessageNode | null
    ): ConversationMessage[] {
        if (!tree) return currentPath;
        return messageTreeService.getPath(tree, targetMessageId);
    }

    /**
     * Get branch options for a message (siblings)
     */
    getBranchOptions(messageId: string, tree: MessageNode | null): ConversationMessage[] {
        return messageTreeService.getSiblings(tree, messageId);
    }

    /**
     * Navigate to next/previous generation (sibling)
     */
    navigateToGeneration(
        currentPath: ConversationMessage[],
        messageId: string,
        direction: 'prev' | 'next',
        tree: MessageNode | null
    ): ConversationMessage[] {
        if (!tree) return currentPath;

        const siblings = messageTreeService.getSiblings(tree, messageId);
        if (siblings.length <= 1) return currentPath;

        const currentIndex = siblings.findIndex(msg => msg.id === messageId);
        if (currentIndex === -1) return currentPath;

        let newIndex: number;
        if (direction === 'next') {
            newIndex = (currentIndex + 1) % siblings.length;
        } else {
            newIndex = (currentIndex - 1 + siblings.length) % siblings.length;
        }

        const targetMessage = siblings[newIndex];
        return messageTreeService.getPath(tree, targetMessage.id);
    }

    /**
     * Get current leaf message from path
     */
    getCurrentLeaf(path: ConversationMessage[]): ConversationMessage | null {
        return path.length > 0 ? path[path.length - 1] : null;
    }

    /**
     * Check if message has siblings (alternative generations)
     */
    hasSiblings(messageId: string, tree: MessageNode | null): boolean {
        const siblings = messageTreeService.getSiblings(tree, messageId);
        return siblings.length > 1;
    }
}

export const branchingService = new BranchingService();
