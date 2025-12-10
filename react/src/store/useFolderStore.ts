import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Folder {
    id: string;
    name: string;
    color?: string;
    icon?: string;
    conversationIds: string[];
    createdAt: number;
    updatedAt: number;
}

interface FolderState {
    folders: Folder[];
    createFolder: (name: string, color?: string, icon?: string) => string;
    updateFolder: (folderId: string, updates: Partial<Folder>) => void;
    deleteFolder: (folderId: string) => void;
    addConversationToFolder: (folderId: string, conversationId: string) => void;
    removeConversationFromFolder: (folderId: string, conversationId: string) => void;
    moveConversation: (conversationId: string, fromFolderId: string | null, toFolderId: string | null) => void;
    getFolderByConversation: (conversationId: string) => Folder | null;
}

export const useFolderStore = create<FolderState>()(
    persist(
        (set, get) => ({
            folders: [],

            createFolder: (name: string, color?: string, icon?: string) => {
                const newFolder: Folder = {
                    id: `folder-${Date.now()}`,
                    name,
                    color: color || '#22d3ee',
                    icon: icon || '📁',
                    conversationIds: [],
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                };

                set((state) => ({
                    folders: [...state.folders, newFolder],
                }));

                return newFolder.id;
            },

            updateFolder: (folderId: string, updates: Partial<Folder>) => {
                set((state) => ({
                    folders: state.folders.map((folder) =>
                        folder.id === folderId
                            ? { ...folder, ...updates, updatedAt: Date.now() }
                            : folder
                    ),
                }));
            },

            deleteFolder: (folderId: string) => {
                set((state) => ({
                    folders: state.folders.filter((folder) => folder.id !== folderId),
                }));
            },

            addConversationToFolder: (folderId: string, conversationId: string) => {
                set((state) => ({
                    folders: state.folders.map((folder) =>
                        folder.id === folderId && !folder.conversationIds.includes(conversationId)
                            ? {
                                ...folder,
                                conversationIds: [...folder.conversationIds, conversationId],
                                updatedAt: Date.now(),
                            }
                            : folder
                    ),
                }));
            },

            removeConversationFromFolder: (folderId: string, conversationId: string) => {
                set((state) => ({
                    folders: state.folders.map((folder) =>
                        folder.id === folderId
                            ? {
                                ...folder,
                                conversationIds: folder.conversationIds.filter((id) => id !== conversationId),
                                updatedAt: Date.now(),
                            }
                            : folder
                    ),
                }));
            },

            moveConversation: (conversationId: string, fromFolderId: string | null, toFolderId: string | null) => {
                set((state) => {
                    let updatedFolders = [...state.folders];

                    // Remove from old folder
                    if (fromFolderId) {
                        updatedFolders = updatedFolders.map((folder) =>
                            folder.id === fromFolderId
                                ? {
                                    ...folder,
                                    conversationIds: folder.conversationIds.filter((id) => id !== conversationId),
                                    updatedAt: Date.now(),
                                }
                                : folder
                        );
                    }

                    // Add to new folder
                    if (toFolderId) {
                        updatedFolders = updatedFolders.map((folder) =>
                            folder.id === toFolderId && !folder.conversationIds.includes(conversationId)
                                ? {
                                    ...folder,
                                    conversationIds: [...folder.conversationIds, conversationId],
                                    updatedAt: Date.now(),
                                }
                                : folder
                        );
                    }

                    return { folders: updatedFolders };
                });
            },

            getFolderByConversation: (conversationId: string) => {
                const folders = get().folders;
                return folders.find((folder) => folder.conversationIds.includes(conversationId)) || null;
            },
        }),
        {
            name: 'gnani-folders',
        }
    )
);
