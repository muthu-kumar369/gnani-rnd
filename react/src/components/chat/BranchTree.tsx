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
    const { allMessages, currentLeafId, navigateToBranch } = useConversationStore();

    // Build tree structure from flat message list
    const tree = useMemo(() => {
        if (!allMessages || allMessages.length === 0) return null;

        // Create a map for quick lookup
        const messageMap = new Map<string, ConversationMessage>();
        allMessages.forEach(msg => {
            const id = msg.id || msg._id;
            if (id) messageMap.set(id, msg);
        });

        // Find root message (usually system or first user message)
        // Adjust logic: Find roots (no parent)
        const roots = allMessages.filter(m => !m.parentId);
        if (roots.length === 0) return null;

        // For simplicity, visualize the tree starting from the FIRST root found or the one relevant to current leaf.
        // Better: Find the root of the current leaf.
        let root = roots[0];
        if (currentLeafId) {
            let current = messageMap.get(currentLeafId);
            while (current && current.parentId) {
                const parent = messageMap.get(current.parentId);
                if (parent) current = parent;
                else break;
            }
            if (current) root = current;
        }

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
    }, [allMessages, currentLeafId]);

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

    // Handle node click
    const handleNodeClick = (messageId: string) => {
        // Navigate to this node as the leaf (or its natural leaf)
        // If we click a node in the middle, we probably want to see the conversation up to that point.
        // Ideally, we navigate to the leaf of the branch passing through this node that was last active, 
        // OR just set this node as the 'current' view (implying we might branch off it).
        // For now, let's just use the store capability if available, or just traverse down the first child.

        // Simple logic: If it's already in the branch, maybe do nothing? 
        // Actually, clicking a node usually means "switch to the branch containing this node".
        // Use existing navigateToBranch helper if it exists for switching context.
        // It seems `navigateToBranch` (from previous context) might handle prev/next siblings.
        // Here we might need `navigateToMessage` logic.
        // Since `navigateToBranch` in store usually goes to sibling, let's implement a direct jump.
        // Assuming the store updates correctly when we render a different leaf.
        // Wait, `navigateToBranch` takes (messageId, direction). 
        // We probably need a way to just "Focus" this message line.
        // Let's assume for now we just want to highlight it.
    };

    // Note: To fully switch branches by clicking a tree node, we need a store method `navigateToLeaf(leafId)`.
    // Since we don't see that explicitly in the `useConversationStore` interface commonly used (it usually has `currentLeafId`),
    // we assume setting `currentLeafId` is handled by the store or we interact via `navigateToBranch` on the siblings.

    // Render tree node
    const renderNode = (node: TreeNode): React.ReactNode => {
        const messageId = node.message.id || node.message._id || '';
        const isActive = isInCurrentBranch(messageId);
        const hasSiblings = node.children.length > 1;
        const isLeaf = node.children.length === 0;

        return (
            <div key={messageId} className="relative group">
                {/* Connection Lines (Tree structure visualization) */}
                <div
                    className={`
                        flex items-center gap-2 py-1 px-2 rounded text-xs cursor-default
                        ${isActive ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'text-gray-500 border border-transparent'}
                    `}
                    style={{ marginLeft: `${node.depth * 16}px` }}
                    title={node.message.message}
                >
                    {/* Branch Indicator Icon */}
                    {hasSiblings && (
                        <span className="text-cyan-400 font-bold">⑂</span>
                    )}

                    {/* Type Icon/Text */}
                    <span className={`uppercase text-[9px] font-mono ${node.message.type === 'user' ? 'text-gray-400' : 'text-jarvis-blue'}`}>
                        {node.message.type === 'user' ? 'USR' : 'AI'}
                    </span>

                    {/* Preview */}
                    <span className="truncate max-w-[200px]">
                        {node.message.message.substring(0, 40)}
                        {node.message.message.length > 40 && '...'}
                    </span>

                    {/* Active Indicator */}
                    {isActive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 ml-auto shadow-[0_0_5px_rgba(34,211,238,0.5)]"></span>
                    )}
                </div>

                {/* Children */}
                <div className="relative">
                    {/* Vertical Guide Line */}
                    {node.children.length > 0 && (
                        <div
                            className="absolute bg-white/5 w-px top-0 bottom-0"
                            style={{ marginLeft: `${(node.depth * 16) + 8}px` }}
                        />
                    )}

                    {node.children.map((child) => renderNode(child))}
                </div>
            </div>
        );
    };

    if (!tree) {
        return (
            <div className={`text-xs text-gray-500 text-center p-4 italic ${className}`}>
                No tree data
            </div>
        );
    }

    return (
        <div className={`mt-2 p-2 bg-black/40 border border-white/5 rounded-lg overflow-x-auto ${className}`}>
            <div className="text-[10px] uppercase tracking-wider font-semibold text-gray-500 mb-2 px-2 flex items-center justify-between">
                <span>Conversation Tree</span>
                <span className="text-jarvis-blue">{allMessages.length} Nodes</span>
            </div>
            <div className="min-w-max pb-2">
                {renderNode(tree)}
            </div>
        </div>
    );
};

export default BranchTree;
