import { useEffect } from 'react';
import { eventManager } from '../utils/eventManager';
import { useFolderStore } from '../store/useFolderStore';

export const useFolderDragDrop = () => {
    const { moveConversation, getFolderByConversation } = useFolderStore();

    useEffect(() => {
        const handleDrop = (e: CustomEvent) => {
            const { folderId, conversationId } = e.detail;

            // Get current folder
            const currentFolder = getFolderByConversation(conversationId);
            const fromFolderId = currentFolder?.id || null;

            // Move conversation
            moveConversation(conversationId, fromFolderId, folderId);

            // Announce to screen reader
            window.dispatchEvent(new CustomEvent('announce', {
                detail: { message: `Conversation moved to folder` }
            }));
        };

        const cleanup = eventManager.addEventListener('folder:drop', handleDrop as EventListener, undefined, 'useFolderDragDrop');
        return cleanup;
    }, [moveConversation, getFolderByConversation]);

    const makeDraggable = (conversationId: string) => ({
        draggable: true,
        onDragStart: (e: React.DragEvent) => {
            e.dataTransfer.setData('conversationId', conversationId);
            e.dataTransfer.effectAllowed = 'move';
        },
        onDragEnd: (e: React.DragEvent) => {
            e.currentTarget.classList.remove('opacity-50');
        },
    });

    return { makeDraggable };
};
