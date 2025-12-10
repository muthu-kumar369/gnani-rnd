# Stage 9: State Management Consolidation

## Overview
Consolidate 7 Zustand stores into 2-3 well-organized stores to reduce complexity and improve maintainability.

## Current State Analysis

**Current Stores** (7 total):
1. `useConversationStore` - Active conversation state
2. `useConversationHistoryStore` - Conversation list
3. `useGnaniStore` - State machine & UI state
4. `useUserStore` - User authentication
5. `usePreferencesStore` - User preferences
6. `themeStore` - Theme settings
7. `useGnaniUIState` - Additional UI state

**Problems**:
- State scattered across too many stores
- Circular dependencies between stores
- Hard to debug state flow
- Duplicate state in multiple stores

---

## Implementation Steps

### Step 1: Design New Store Structure

**New Structure** (3 stores):

1. **`useAppStore`** - Application-level state
   - User authentication
   - User preferences
   - Theme settings
   - Global UI state

2. **`useConversationStore`** - Conversation data (MERGE existing conversation stores)
   - Active conversation
   - Conversation list
   - Message cache
   - Conversation actions

3. **`useVoiceStore`** - Voice/Audio state
   - State machine
   - Audio levels
   - VAD state
   - TTS state

### Step 2: Create Unified App Store

**File**: `D:\learning\hey\gnani-rnd\react\src\store\useAppStore.ts` (NEW)

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  name: string;
  settings: UserSettings;
}

interface UserSettings {
  avatarEnabled: boolean;
  avatarGender: 'male' | 'female';
  showTimestamps: boolean;
  theme: 'dark' | 'light';
  language: 'en' | 'es' | 'fr';
}

interface AppState {
  // User
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  loading: boolean;

  // Preferences
  lastUsedModel: string | null;
  lastUsedTemplate: string | null;

  // Theme
  theme: 'dark' | 'light';

  // Global UI
  showTerminal: boolean;
  showHistory: boolean;
  showSettings: boolean;
  voicePanelCollapsed: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setAccessToken: (token: string | null) => void;
  setTheme: (theme: 'dark' | 'light') => void;
  toggleTerminal: () => void;
  toggleHistory: () => void;
  toggleSettings: () => void;
  toggleVoicePanel: () => void;
  updateUserSettings: (settings: Partial<UserSettings>) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      accessToken: null,
      isAuthenticated: false,
      loading: false,
      lastUsedModel: null,
      lastUsedTemplate: null,
      theme: 'dark',
      showTerminal: true,
      showHistory: false,
      showSettings: false,
      voicePanelCollapsed: true,

      // Actions
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setAccessToken: (token) => set({ accessToken }),
      setTheme: (theme) => set({ theme }),
      toggleTerminal: () => set((state) => ({ showTerminal: !state.showTerminal })),
      toggleHistory: () => set((state) => ({ showHistory: !state.showHistory })),
      toggleSettings: () => set((state) => ({ showSettings: !state.showSettings })),
      toggleVoicePanel: () => set((state) => ({ voicePanelCollapsed: !state.voicePanelCollapsed })),
      
      updateUserSettings: (settings) => set((state) => ({
        user: state.user ? {
          ...state.user,
          settings: { ...state.user.settings, ...settings }
        } : null
      })),
    }),
    {
      name: 'gnani-app-storage',
      partialize: (state) => ({
        accessToken: state.accessToken,
        theme: state.theme,
        lastUsedModel: state.lastUsedModel,
        lastUsedTemplate: state.lastUsedTemplate,
      }),
    }
  )
);
```

### Step 3: Consolidate Conversation Stores

**File**: `D:\learning\hey\gnani-rnd\react\src\store\useConversationStore.ts` (REFACTOR)

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ConversationState {
  // Active Conversation
  conversationId: string | null;
  messages: Message[];
  allMessages: Message[];
  currentLeafId: string | null;
  title: string | null;
  isStreaming: boolean;

  // Conversation List
  conversations: Conversation[];
  isLoadingConversations: boolean;
  hasMore: boolean;
  page: number;
  searchQuery: string;

  // Message Cache (NEW)
  messageCache: Map<string, Message[]>;

  // Actions - Active Conversation
  setConversationId: (id: string | null) => void;
  addMessage: (message: Partial<Message>) => void;
  updateMessageContent: (id: string, content: string, append: boolean) => void;
  sendMessage: (text: string, accessToken: string, attachments: any[], sendViaGrpc?: any) => Promise<void>;
  refreshConversation: (accessToken: string) => Promise<void>;
  clearMessages: () => void;

  // Actions - Conversation List
  fetchConversations: (accessToken: string) => Promise<void>;
  createConversation: (accessToken: string, systemPrompt?: string) => Promise<string>;
  deleteConversation: (id: string, accessToken: string) => Promise<void>;
  searchConversations: (query: string) => void;

  // Actions - Cache Management (NEW)
  getCachedMessages: (conversationId: string) => Message[] | null;
  setCachedMessages: (conversationId: string, messages: Message[]) => void;
  clearCache: () => void;
}

export const useConversationStore = create<ConversationState>()(
  persist(
    (set, get) => ({
      // ... existing state ...
      messageCache: new Map(),

      // NEW: Cache management
      getCachedMessages: (conversationId) => {
        return get().messageCache.get(conversationId) || null;
      },

      setCachedMessages: (conversationId, messages) => {
        set((state) => {
          const newCache = new Map(state.messageCache);
          newCache.set(conversationId, messages);
          // Limit cache size to 10 conversations
          if (newCache.size > 10) {
            const firstKey = newCache.keys().next().value;
            newCache.delete(firstKey);
          }
          return { messageCache: newCache };
        });
      },

      clearCache: () => set({ messageCache: new Map() }),

      // UPDATED: Use cache in refreshConversation
      refreshConversation: async (accessToken) => {
        const { conversationId, getCachedMessages, setCachedMessages } = get();
        if (!conversationId) return;

        // Check cache first
        const cached = getCachedMessages(conversationId);
        if (cached) {
          set({ messages: cached });
          return;
        }

        // Fetch from backend
        const response = await fetch(`http://localhost:3000/api/conversations/${conversationId}`, {
          headers: { 'x-auth-token': accessToken }
        });
        const data = await response.json();

        // Update cache
        setCachedMessages(conversationId, data.messages);
        
        set({
          messages: data.messages,
          allMessages: data.allMessages,
          currentLeafId: data.currentLeafId,
          title: data.title
        });
      },

      // ... rest of actions ...
    }),
    {
      name: 'gnani-conversation-storage',
      partialize: (state) => ({
        conversationId: state.conversationId,
        messages: state.messages,
        title: state.title,
      }),
    }
  )
);
```

### Step 4: Create Voice Store

**File**: `D:\learning\hey\gnani-rnd\react\src\store\useVoiceStore.ts` (NEW)

```typescript
import { create } from 'zustand';
import GnaniStateMachine, { GnaniState, StateTrigger } from '../state/GnaniStateMachine';

interface VoiceState {
  // State Machine
  stateMachine: GnaniStateMachine;
  state: GnaniState;
  
  // Audio
  audioLevel: number;
  isMicActive: boolean;
  
  // VAD
  vadActive: boolean;
  
  // TTS
  isTtsPlaying: boolean;
  
  // Barge-in
  bargeInEnabled: boolean;

  // Actions
  transition: (trigger: StateTrigger) => boolean;
  setAudioLevel: (level: number) => void;
  setMicActive: (active: boolean) => void;
  setVadActive: (active: boolean) => void;
  setTtsPlaying: (playing: boolean) => void;
  setBargeInEnabled: (enabled: boolean) => void;
}

const stateMachine = new GnaniStateMachine();

export const useVoiceStore = create<VoiceState>((set, get) => ({
  stateMachine,
  state: 'idle',
  audioLevel: 0,
  isMicActive: false,
  vadActive: false,
  isTtsPlaying: false,
  bargeInEnabled: true,

  transition: (trigger) => {
    const success = get().stateMachine.transition(trigger);
    if (success) {
      set({ state: get().stateMachine.getState() });
    }
    return success;
  },

  setAudioLevel: (level) => set({ audioLevel: level }),
  setMicActive: (active) => set({ isMicActive: active }),
  setVadActive: (active) => set({ vadActive: active }),
  setTtsPlaying: (playing) => set({ isTtsPlaying: playing }),
  setBargeInEnabled: (enabled) => set({ bargeInEnabled: enabled }),
}));
```

### Step 5: Migration Guide

**Update all components** to use new stores:

```typescript
// OLD
import { useUserStore } from '../store/useUserStore';
import { usePreferencesStore } from '../store/usePreferencesStore';
import { useGnaniStore } from '../store/useGnaniStore';

const { user, accessToken } = useUserStore();
const { theme } = usePreferencesStore();
const { state } = useGnaniStore();

// NEW
import { useAppStore } from '../store/useAppStore';
import { useVoiceStore } from '../store/useVoiceStore';

const { user, accessToken, theme } = useAppStore();
const { state } = useVoiceStore();
```

---

## Testing Instructions

1. Run migration script
2. ✅ Verify all components still work
3. ✅ Verify state persists correctly
4. ✅ Verify no console errors
5. ✅ Test conversation switching (should use cache)
6. ✅ Test theme switching
7. ✅ Test voice state transitions

---

## Success Criteria

- ✅ Reduced from 7 stores to 3 stores
- ✅ No circular dependencies
- ✅ Clear separation of concerns
- ✅ Message caching improves performance
- ✅ All existing functionality works
- ✅ State debugging is easier

---

## Estimated Time: 16 hours
