import React, { useMemo } from 'react';
import { useConversationStore } from '../../store/useConversationStore';
import type { ConversationMessage } from '../../store/useConversationStore';

interface BranchTreeProps {
    className?: string;
}

interface TreeNode {
    message: ConversationMessage;
    children: TreeNode[];
    depth: number;
}

const BranchTree: React.FC<BranchTreeProps> = ({ className = '' }) => {
    const { allMessages, currentLeafId } = useConversationStore();

    // Build tree structure from flat message list
    const tree = useMemo(() => {
        if (!allMessages || allMessages.length === 0) return null;

        // Create a map for quick lookup
        const messageMap = new Map<string, ConversationMessage>();
        allMessages.forEach(msg => {
            const id = msg.id || msg._id;
            if (id) messageMap.set(id, msg);
        });

        // Find root message (no parent)
        const root = allMessages.find(m => !m.parentId);
        if (!root) return null;

        // Recursive function to build tree
        const buildNode = (message: ConversationMessage, depth: number): TreeNode => {
            const children: TreeNode[] = [];

            if (message.children && message.children.length > 0) {
                message.children.forEach(childId => {
                    const childMsg = messageMap.get(childId);
                    if (childMsg) {
                        children.push(buildNode(childMsg, depth + 1));
                    }
                });
            }

            return { message, children, depth };
        };

        return buildNode(root, 0);
    }, [allMessages]);

    // Check if message is in current branch
    const isInCurrentBranch = (messageId: string): boolean => {
        if (!currentLeafId || !allMessages) return false;

        // Trace from current leaf to root
        let current = allMessages.find(m => (m.id || m._id) === currentLeafId);
        while (current) {
            if ((current.id || current._id) === messageId) return true;
            if (!current.parentId) break;
            current = allMessages.find(m => (m.id || m._id) === current!.parentId);
        }
        return false;
    };

    // Render tree node
    const renderNode = (node: TreeNode, index: number = 0): React.ReactNode => {
        const messageId = node.message.id || node.message._id || '';
        const isActive = isInCurrentBranch(messageId);
        const hasSiblings = node.children.length > 1;

        return (
            <div key={messageId} className="relative">
                {/* Message node */}
                <div
                    className={`
                        flex items-center gap-2 py-1 px-2 rounded text-xs
                        ${isActive ? 'bg-cyan-500/20 text-cyan-300' : 'text-cyan-500/60'}
                        ${hasSiblings ? 'font-semibold' : ''}
                    `}
                    style={{ marginLeft: `${node.depth * 20}px` }}
                >
                    {/* Branch indicator */}
                    {hasSiblings && (
                        <span className="text-cyan-400">⎇</span>
                    )}

                    {/* Message type */}
                    <span className="uppercase text-[10px]">
                        {node.message.type}
                    </span>

                    {/* Message preview */}
                    <span className="truncate max-w-[200px]">
                        {node.message.message.substring(0, 50)}
                        {node.message.message.length > 50 && '...'}
                    </span>

                    {/* Branch count */}
                    {hasSiblings && (
                        <span className="text-cyan-500/60 text-[10px]">
                            ({node.children.length} branches)
                        </span>
                    )}
                </div>

                {/* Children */}
                {node.children.length > 0 && (
                    <div className="relative">
                        {/* Vertical line */}
                        {node.children.length > 1 && (
                            <div
                                className="absolute left-0 top-0 bottom-0 w-px bg-cyan-500/30"
                                style={{ marginLeft: `${(node.depth + 1) * 20 - 10}px` }}
                            />
                        )}

                        {/* Render children */}
                        {node.children.map((child, idx) => renderNode(child, idx))}
                    </div>
                )}
            </div>
        );
    };

    if (!tree) {
        return (
            <div className={`text-xs text-cyan-500/60 p-4 ${className}`}>
                No conversation tree available
            </div>
        );
    }

    return (
        <div className={`branch-tree overflow-auto ${className}`}>
            <div className="text-xs font-semibold text-cyan-400 mb-2 px-2">
                Conversation Tree
            </div>
            {renderNode(tree)}
        </div>
    );
};

export default BranchTree;
