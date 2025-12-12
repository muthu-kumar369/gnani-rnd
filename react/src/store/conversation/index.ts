import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ConversationStore } from './types';
import { createConversationSlice } from './conversationSlice';
import { createMessageSlice } from './messageSlice';
import { createUndoSlice } from './undoSlice';

export const useConversationStore = create<ConversationStore>()(
    persist(
        (set, get, api) => ({
            ...createConversationSlice(set, get, api),
            ...createMessageSlice(set, get, api),
            ...createUndoSlice(set, get, api),
        }),
        {
            name: 'gnani_conversation_history',
            storage: createJSONStorage(() => localStorage),
            partialize: (state) => ({
                // Only persist specific settings if needed, for now persist nothing to avoid stale data issues
            }),
            onRehydrateStorage: () => (state) => {
                if (state) {
                    state.conversationId = null;
                    state.messages = [];
                    state.currentLeafId = null;
                }
            }
        }
    )
);
