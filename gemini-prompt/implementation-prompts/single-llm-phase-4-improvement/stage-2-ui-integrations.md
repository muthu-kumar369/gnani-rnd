# STAGE 2: MISSING UI INTEGRATIONS

**Duration:** 2 weeks  
**Priority:** HIGH  
**Dependencies:** Stage 1 (API client)

---

## 🎯 OBJECTIVE

Integrate all built but unused UI components into the application. Connect frontend features to backend APIs. Make all implemented features accessible and functional to users.

---

## 📋 TASKS

### Task 2.1: Integrate Folder UI into ConversationSidebar ⚡ HIGH
**Files:**
- `gnani-rnd/react/src/components/conversation/ConversationSidebar.tsx`
- `gnani-rnd/react/src/components/common/FolderList.tsx`
- `gnani-rnd/react/src/components/common/CreateFolderModal.tsx`
- `gnani-rnd/react/src/store/useFolderStore.ts`

**Issue:** Folder organization fully implemented in store but not visible in UI  
**Effort:** 2 days

**Implementation:**

Update `ConversationSidebar.tsx`:
```typescript
import { useState } from 'react';
import { useFolderStore } from '../../store/useFolderStore';
import { useConversationStore } from '../../store/useConversationStore';
import FolderList from '../common/FolderList';
import CreateFolderModal from '../common/CreateFolderModal';
import { FolderPlus, ChevronDown, ChevronRight } from 'lucide-react';

export default function ConversationSidebar() {
  const { folders, selectedFolderId, selectFolder, createFolder, deleteFolder } = useFolderStore();
  const { conversations } = useConversationStore();
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  // Group conversations by folder
  const conversationsByFolder = conversations.reduce((acc, conv) => {
    const folderId = conv.folderId || 'unorganized';
    if (!acc[folderId]) acc[folderId] = [];
    acc[folderId].push(conv);
    return acc;
  }, {} as Record<string, typeof conversations>);

  return (
    <div className=\"flex flex-col h-full bg-gray-900\">
      {/* Header with New Folder button */}
      <div className=\"p-4 border-b border-gray-800 flex justify-between items-center\">
        <h2 className=\"text-lg font-semibold\">Conversations</h2>
        <button
          onClick={() => setShowCreateFolder(true)}
          className=\"p-2 hover:bg-gray-800 rounded-lg transition-colors\"
          title=\"Create Folder\"
        >
          <FolderPlus className=\"w-5 h-5\" />
        </button>
      </div>

      {/* Folder List */}
      <div className=\"flex-1 overflow-y-auto\">
        {/* All Conversations (no folder) */}
        <div className=\"p-2\">
          <button
            onClick={() => selectFolder(null)}
            className={`w-full text-left p-2 rounded-lg transition-colors ${
              selectedFolderId === null ? 'bg-gray-800' : 'hover:bg-gray-800'
            }`}
          >
            <div className=\"flex items-center gap-2\">
              <span>All Conversations</span>
              <span className=\"text-sm text-gray-400\">
                ({conversationsByFolder['unorganized']?.length || 0})
              </span>
            </div>
          </button>
        </div>

        {/* Folders */}
        {folders.map(folder => {
          const isExpanded = expandedFolders.has(folder.id);
          const folderConversations = conversationsByFolder[folder.id] || [];

          return (
            <div key={folder.id} className=\"p-2\">
              <div className=\"flex items-center gap-1\">
                <button
                  onClick={() => toggleFolder(folder.id)}
                  className=\"p-1 hover:bg-gray-800 rounded\"
                >
                  {isExpanded ? (
                    <ChevronDown className=\"w-4 h-4\" />
                  ) : (
                    <ChevronRight className=\"w-4 h-4\" />
                  )}
                </button>

                <button
                  onClick={() => selectFolder(folder.id)}
                  className={`flex-1 text-left p-2 rounded-lg transition-colors ${
                    selectedFolderId === folder.id ? 'bg-gray-800' : 'hover:bg-gray-800'
                  }`}
                >
                  <div className=\"flex items-center justify-between\">
                    <span>{folder.name}</span>
                    <span className=\"text-sm text-gray-400\">
                      ({folderConversations.length})
                    </span>
                  </div>
                </button>
              </div>

              {/* Conversations in folder */}
              {isExpanded && (
                <div className=\"ml-6 mt-1 space-y-1\">
                  {folderConversations.map(conv => (
                    <ConversationListItem
                      key={conv.id}
                      conversation={conv}
                      isInFolder={true}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Unorganized conversations */}
        {conversationsByFolder['unorganized']?.length > 0 && (
          <div className=\"p-2 mt-4\">
            <div className=\"text-sm text-gray-400 mb-2 px-2\">Unorganized</div>
            {conversationsByFolder['unorganized'].map(conv => (
              <ConversationListItem
                key={conv.id}
                conversation={conv}
                isInFolder={false}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Folder Modal */}
      {showCreateFolder && (
        <CreateFolderModal
          onClose={() => setShowCreateFolder(false)}
          onCreate={async (name) => {
            await createFolder(name);
            setShowCreateFolder(false);
          }}
        />
      )}
    </div>
  );
}
```

Add folder context menu to conversations:
```typescript
// In ConversationListItem.tsx
import { useFolderStore } from '../../store/useFolderStore';

const { folders, moveConversationToFolder } = useFolderStore();

// Add context menu option
<ContextMenu>
  <ContextMenuItem onClick={() => setShowMoveToFolder(true)}>
    Move to Folder
  </ContextMenuItem>
</ContextMenu>

// Move to folder modal
{showMoveToFolder && (
  <div className=\"modal\">
    <h3>Move to Folder</h3>
    {folders.map(folder => (
      <button
        key={folder.id}
        onClick={() => {
          moveConversationToFolder(conversation.id, folder.id);
          setShowMoveToFolder(false);
        }}
      >
        {folder.name}
      </button>
    ))}
  </div>
)}
```

**Verification:**
1. Create a new folder
2. Move conversations into folder
3. Expand/collapse folders
4. Verify conversation count updates
5. Delete a folder (conversations should move to unorganized)
6. Test folder selection filtering

---

### Task 2.2: Connect Advanced Search UI to Backend ⚡ HIGH
**Files:**
- `gnani-rnd/react/src/components/common/AdvancedSearch.tsx`
- `gnani-rnd/react/src/components/common/SearchFilters.tsx`
- `gnani-rnd/react/src/store/useSearchStore.ts`
- `gnani-rnd-backend/src/modules/search/hybrid-search.service.ts`

**Issue:** Advanced search UI built but not connected to backend API  
**Effort:** 2 days

**Implementation:**

Update `useSearchStore.ts` to use hybrid search:
```typescript
import apiClient from '../api/client';

interface SearchStore {
  query: string;
  filters: SearchFilters;
  results: SearchResult[];
  isSearching: boolean;
  searchMode: 'basic' | 'semantic' | 'hybrid';

  setQuery: (query: string) => void;
  setFilters: (filters: SearchFilters) => void;
  setSearchMode: (mode: 'basic' | 'semantic' | 'hybrid') => void;
  search: () => Promise<void>;
  clearResults: () => void;
}

export const useSearchStore = create<SearchStore>()((set, get) => ({
  query: '',
  filters: {},
  results: [],
  isSearching: false,
  searchMode: 'hybrid',

  setQuery: (query) => set({ query }),
  setFilters: (filters) => set({ filters }),
  setSearchMode: (mode) => set({ searchMode: mode }),

  search: async () => {
    const { query, filters, searchMode } = get();

    if (!query.trim()) {
      set({ results: [] });
      return;
    }

    set({ isSearching: true });

    try {
      const response = await apiClient.post('/search', {
        query,
        mode: searchMode,
        filters: {
          dateRange: filters.dateRange,
          folders: filters.folders,
          hasAttachments: filters.hasAttachments,
          messageType: filters.messageType,
        },
        limit: 50,
      });

      set({ results: response.results });
    } catch (error) {
      console.error('Search failed:', error);
      set({ results: [] });
    } finally {
      set({ isSearching: false });
    }
  },

  clearResults: () => set({ results: [], query: '' }),
}));
```

Update `AdvancedSearch.tsx` to show results:
```typescript
import { useSearchStore } from '../../store/useSearchStore';
import { useEffect, useState } from 'react';
import SearchFilters from './SearchFilters';
import { Search, X, Filter } from 'lucide-react';

export default function AdvancedSearch({ onClose }: { onClose: () => void }) {
  const {
    query,
    filters,
    results,
    isSearching,
    searchMode,
    setQuery,
    setFilters,
    setSearchMode,
    search,
    clearResults
  } = useSearchStore();

  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    // Debounced search
    const timer = setTimeout(() => {
      if (query.trim()) {
        search();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, filters, searchMode]);

  return (
    <div className=\"fixed inset-0 bg-black/50 flex items-center justify-center z-50\">
      <div className=\"bg-gray-900 rounded-lg w-full max-w-4xl max-h-[80vh] flex flex-col\">
        {/* Header */}
        <div className=\"p-4 border-b border-gray-800 flex items-center gap-4\">
          <div className=\"flex-1 flex items-center gap-2 bg-gray-800 rounded-lg px-4 py-2\">
            <Search className=\"w-5 h-5 text-gray-400\" />
            <input
              type=\"text\"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder=\"Search conversations...\"
              className=\"flex-1 bg-transparent outline-none\"
              autoFocus
            />
            {query && (
              <button onClick={() => setQuery('')} className=\"p-1 hover:bg-gray-700 rounded\">
                <X className=\"w-4 h-4\" />
              </button>
            )}
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-lg transition-colors ${
              showFilters ? 'bg-blue-600' : 'hover:bg-gray-800'
            }`}
          >
            <Filter className=\"w-5 h-5\" />
          </button>

          <button onClick={onClose} className=\"p-2 hover:bg-gray-800 rounded-lg\">
            <X className=\"w-5 h-5\" />
          </button>
        </div>

        {/* Search Mode Selector */}
        <div className=\"p-4 border-b border-gray-800 flex gap-2\">
          {['basic', 'semantic', 'hybrid'].map(mode => (
            <button
              key={mode}
              onClick={() => setSearchMode(mode as any)}
              className={`px-4 py-2 rounded-lg capitalize transition-colors ${
                searchMode === mode ? 'bg-blue-600' : 'bg-gray-800 hover:bg-gray-700'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>

        {/* Filters */}
        {showFilters && (
          <div className=\"p-4 border-b border-gray-800\">
            <SearchFilters
              filters={filters}
              onChange={setFilters}
            />
          </div>
        )}

        {/* Results */}
        <div className=\"flex-1 overflow-y-auto p-4\">
          {isSearching ? (
            <div className=\"text-center py-8 text-gray-400\">Searching...</div>
          ) : results.length > 0 ? (
            <div className=\"space-y-4\">
              {results.map(result => (
                <SearchResultItem key={result.id} result={result} />
              ))}
            </div>
          ) : query ? (
            <div className=\"text-center py-8 text-gray-400\">No results found</div>
          ) : (
            <div className=\"text-center py-8 text-gray-400\">
              Start typing to search...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

Add search route in backend:
```typescript
// routes/search.routes.ts
router.post('/search',
  authenticate,
  validateRequest([
    body('query').isString().notEmpty(),
    body('mode').isIn(['basic', 'semantic', 'hybrid']).optional(),
  ]),
  searchController.search
);

// controllers/search.controller.ts
async search(req: Request, res: Response) {
  const { query, mode = 'hybrid', filters, limit = 50 } = req.body;
  const userId = req.user.id;

  const results = await hybridSearchService.search(userId, query, {
    mode,
    filters,
    limit
  });

  res.json({ results });
}
```

**Verification:**
1. Open advanced search (add keyboard shortcut Cmd+K)
2. Type query and see results
3. Switch between search modes
4. Apply filters (date range, folders)
5. Verify semantic search finds related content
6. Test hybrid search combines both

---

### Task 2.3: Wire Up Undo Toast Functionality ⚡ MEDIUM
**Files:**
- `gnani-rnd/react/src/components/common/UndoToast.tsx`
- `gnani-rnd/react/src/store/useConversationStore.ts`

**Issue:** Undo toast UI exists but not fully connected to undo API  
**Effort:** 1 day

**Implementation:**

Update `useConversationStore.ts` to show undo toast:
```typescript
import { create } from 'zustand';

interface UndoData {
  messageId: string;
  undoToken: string;
  action: 'delete' | 'edit';
  expiresAt: number;
}

interface ConversationStore {
  // ... existing fields
  undoData: UndoData | null;
  showUndoToast: boolean;

  setUndoData: (data: UndoData | null) => void;
  dismissUndo: () => void;
  executeUndo: (accessToken: string) => Promise<void>;
}

export const useConversationStore = create<ConversationStore>()((set, get) => ({
  // ... existing state
  undoData: null,
  showUndoToast: false,

  deleteMessage: async (messageId, accessToken) => {
    try {
      const response = await apiClient.delete(
        `/conversations/${get().conversationId}/messages/${messageId}`
      );

      if (response.undoToken) {
        set({
          undoData: {
            messageId,
            undoToken: response.undoToken,
            action: 'delete',
            expiresAt: Date.now() + 30000, // 30 seconds
          },
          showUndoToast: true
        });

        // Auto-dismiss after 30 seconds
        setTimeout(() => {
          if (get().undoData?.messageId === messageId) {
            get().dismissUndo();
          }
        }, 30000);
      }

      await get().refreshConversation(accessToken);
    } catch (error) {
      console.error('Delete failed:', error);
      throw error;
    }
  },

  executeUndo: async (accessToken) => {
    const { undoData } = get();
    if (!undoData) return;

    try {
      await apiClient.post(
        `/conversations/messages/${undoData.messageId}/restore`,
        { undoToken: undoData.undoToken }
      );

      set({ undoData: null, showUndoToast: false });
      await get().refreshConversation(accessToken);
    } catch (error) {
      console.error('Undo failed:', error);
      set({ undoData: null, showUndoToast: false });
      throw error;
    }
  },

  dismissUndo: () => {
    set({ undoData: null, showUndoToast: false });
  },
}));
```

Update `UndoToast.tsx`:
```typescript
import { useConversationStore } from '../../store/useConversationStore';
import { useUserStore } from '../../store/useUserStore';
import { Undo, X } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function UndoToast() {
  const { undoData, showUndoToast, executeUndo, dismissUndo } = useConversationStore();
  const { accessToken } = useUserStore();
  const [timeLeft, setTimeLeft] = useState(30);

  useEffect(() => {
    if (!undoData) return;

    const interval = setInterval(() => {
      const remaining = Math.ceil((undoData.expiresAt - Date.now()) / 1000);
      setTimeLeft(remaining);

      if (remaining <= 0) {
        dismissUndo();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [undoData]);

  if (!showUndoToast || !undoData) return null;

  return (
    <div className=\"fixed bottom-4 right-4 bg-gray-800 rounded-lg shadow-lg p-4 flex items-center gap-4 animate-slide-up z-50\">
      <div className=\"flex-1\">
        <p className=\"font-medium\">
          Message {undoData.action === 'delete' ? 'deleted' : 'edited'}
        </p>
        <p className=\"text-sm text-gray-400\">
          {timeLeft}s remaining
        </p>
      </div>

      <button
        onClick={() => executeUndo(accessToken!)}
        className=\"flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors\"
      >
        <Undo className=\"w-4 h-4\" />
        Undo
      </button>

      <button
        onClick={dismissUndo}
        className=\"p-2 hover:bg-gray-700 rounded-lg transition-colors\"
      >
        <X className=\"w-4 h-4\" />
      </button>
    </div>
  );
}
```

Add to `ChatLayout.tsx`:
```typescript
import UndoToast from '../components/common/UndoToast';

export default function ChatLayout() {
  return (
    <div className=\"flex h-screen\">
      {/* ... existing layout */}
      <UndoToast />
    </div>
  );
}
```

**Verification:**
1. Delete a message
2. Verify undo toast appears
3. Click undo within 30 seconds
4. Verify message is restored
5. Test auto-dismiss after 30 seconds
6. Test dismissing manually

---

### Task 2.4: Complete Share Modal Integration ⚡ MEDIUM
**Files:**
- `gnani-rnd/react/src/components/common/ShareModal.tsx`
- `gnani-rnd/react/src/store/useConversationStore.ts`
- `gnani-rnd-backend/src/modules/conversation/conversation.service.ts`

**Issue:** Share modal partially implemented  
**Effort:** 1 day

**Implementation:**

Update `ShareModal.tsx`:
```typescript
import { useState } from 'react';
import { useConversationStore } from '../../store/useConversationStore';
import { useUserStore } from '../../store/useUserStore';
import { Share2, Copy, Check, X } from 'lucide-react';
import apiClient from '../../api/client';

interface ShareModalProps {
  conversationId: string;
  onClose: () => void;
}

export default function ShareModal({ conversationId, onClose }: ShareModalProps) {
  const { accessToken } = useUserStore();
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [expiresIn, setExpiresIn] = useState<number>(7); // days
  const [isPublic, setIsPublic] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateShareLink = async () => {
    setIsGenerating(true);
    try {
      const response = await apiClient.post(`/conversations/${conversationId}/share`, {
        expiresInDays: expiresIn,
        isPublic
      });

      const link = `${window.location.origin}/share/${response.shareId}`;
      setShareLink(link);
    } catch (error) {
      console.error('Failed to generate share link:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    if (!shareLink) return;

    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <div className=\"fixed inset-0 bg-black/50 flex items-center justify-center z-50\">
      <div className=\"bg-gray-900 rounded-lg w-full max-w-md p-6\">
        <div className=\"flex items-center justify-between mb-6\">
          <h2 className=\"text-xl font-semibold flex items-center gap-2\">
            <Share2 className=\"w-5 h-5\" />
            Share Conversation
          </h2>
          <button onClick={onClose} className=\"p-2 hover:bg-gray-800 rounded-lg\">
            <X className=\"w-5 h-5\" />
          </button>
        </div>

        {!shareLink ? (
          <div className=\"space-y-4\">
            <div>
              <label className=\"block text-sm font-medium mb-2\">
                Link expires in
              </label>
              <select
                value={expiresIn}
                onChange={(e) => setExpiresIn(Number(e.target.value))}
                className=\"w-full bg-gray-800 rounded-lg px-4 py-2\"
              >
                <option value={1}>1 day</option>
                <option value={7}>7 days</option>
                <option value={30}>30 days</option>
                <option value={0}>Never</option>
              </select>
            </div>

            <div className=\"flex items-center gap-2\">
              <input
                type=\"checkbox\"
                id=\"public\"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className=\"rounded\"
              />
              <label htmlFor=\"public\" className=\"text-sm\">
                Make publicly discoverable
              </label>
            </div>

            <button
              onClick={generateShareLink}
              disabled={isGenerating}
              className=\"w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 rounded-lg px-4 py-2 transition-colors\"
            >
              {isGenerating ? 'Generating...' : 'Generate Share Link'}
            </button>
          </div>
        ) : (
          <div className=\"space-y-4\">
            <div>
              <label className=\"block text-sm font-medium mb-2\">
                Share Link
              </label>
              <div className=\"flex items-center gap-2 bg-gray-800 rounded-lg px-4 py-2\">
                <input
                  type=\"text\"
                  value={shareLink}
                  readOnly
                  className=\"flex-1 bg-transparent outline-none text-sm\"
                />
                <button
                  onClick={copyToClipboard}
                  className=\"p-2 hover:bg-gray-700 rounded-lg transition-colors\"
                >
                  {copied ? (
                    <Check className=\"w-4 h-4 text-green-500\" />
                  ) : (
                    <Copy className=\"w-4 h-4\" />
                  )}
                </button>
              </div>
            </div>

            <p className=\"text-sm text-gray-400\">
              {expiresIn === 0
                ? 'This link never expires'
                : `This link expires in ${expiresIn} day${expiresIn > 1 ? 's' : ''}`}
            </p>

            <button
              onClick={() => setShareLink(null)}
              className=\"w-full bg-gray-800 hover:bg-gray-700 rounded-lg px-4 py-2 transition-colors\"
            >
              Generate New Link
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
```

Add share button to conversation header:
```typescript
// In ChatHeader.tsx
import ShareModal from '../common/ShareModal';

const [showShareModal, setShowShareModal] = useState(false);

<button
  onClick={() => setShowShareModal(true)}
  className=\"p-2 hover:bg-gray-800 rounded-lg\"
  title=\"Share Conversation\"
>
  <Share2 className=\"w-5 h-5\" />
</button>

{showShareModal && (
  <ShareModal
    conversationId={conversationId}
    onClose={() => setShowShareModal(false)}
  />
)}
```

Backend implementation:
```typescript
// conversation.service.ts
async createShareLink(conversationId: string, userId: string, options: ShareOptions) {
  const conversation = await Conversation.findById(conversationId);

  if (!conversation || conversation.userId.toString() !== userId) {
    throw new Error('Conversation not found');
  }

  const shareId = generateShareId();
  const expiresAt = options.expiresInDays > 0
    ? new Date(Date.now() + options.expiresInDays * 24 * 60 * 60 * 1000)
    : null;

  const share = await ConversationShare.create({
    shareId,
    conversationId,
    userId,
    expiresAt,
    isPublic: options.isPublic,
  });

  return { shareId };
}
```

**Verification:**
1. Click share button on conversation
2. Generate share link
3. Copy link and open in new window
4. Verify conversation is viewable
5. Test expiration (create link with 1 day expiry)
6. Test public vs private links

---

### Task 2.5: Integrate Streaming Progress Indicator ⚡ LOW
**Files:**
- `gnani-rnd/react/src/components/common/StreamingProgress.tsx`
- `gnani-rnd/react/src/components/chat/MessageItem.tsx`

**Issue:** Streaming progress component built but not used  
**Effort:** 4 hours

**Implementation:**

Update `MessageItem.tsx` to show streaming progress:
```typescript
import StreamingProgress from '../common/StreamingProgress';
import { useConversationStore } from '../../store/useConversationStore';

export default function MessageItem({ message }: { message: ConversationMessage }) {
  const { isStreaming, currentLeafId } = useConversationStore();

  const isCurrentlyStreaming = isStreaming && message.id === currentLeafId && message.type === 'gnani';

  return (
    <div className=\"message-item\">
      {/* ... existing message content */}

      {isCurrentlyStreaming && (
        <StreamingProgress
          message={message.message}
          isComplete={false}
        />
      )}
    </div>
  );
}
```

Update `StreamingProgress.tsx`:
```typescript
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface StreamingProgressProps {
  message: string;
  isComplete: boolean;
}

export default function StreamingProgress({ message, isComplete }: StreamingProgressProps) {
  const [charCount, setCharCount] = useState(0);
  const [wordsPerSecond, setWordsPerSecond] = useState(0);

  useEffect(() => {
    setCharCount(message.length);

    // Calculate words per second
    const words = message.split(/\\s+/).length;
    const seconds = (Date.now() - startTime) / 1000;
    setWordsPerSecond(Math.round(words / seconds));
  }, [message]);

  if (isComplete) return null;

  return (
    <div className=\"flex items-center gap-2 text-sm text-gray-400 mt-2\">
      <Loader2 className=\"w-4 h-4 animate-spin\" />
      <span>{charCount} characters</span>
      <span>•</span>
      <span>{wordsPerSecond} words/s</span>
    </div>
  );
}
```

**Verification:**
1. Start streaming response
2. Verify progress indicator shows
3. Check character count updates
4. Verify words/second calculation
5. Confirm indicator disappears when complete

---

### Task 2.6: Integrate Timeout Indicator ⚡ LOW
**Files:**
- `gnani-rnd/react/src/components/common/TimeoutIndicator.tsx`
- `gnani-rnd/react/src/hooks/useGnaniUIState.ts`

**Issue:** Timeout indicator built but not integrated  
**Effort:** 4 hours

**Implementation:**

Update `useGnaniUIState.ts` to track timeout:
```typescript
const [thinkingStartTime, setThinkingStartTime] = useState<number | null>(null);
const [showTimeout, setShowTimeout] = useState(false);

useEffect(() => {
  if (appStatus === 'thinking') {
    setThinkingStartTime(Date.now());
  } else {
    setThinkingStartTime(null);
    setShowTimeout(false);
  }
}, [appStatus]);

useEffect(() => {
  if (!thinkingStartTime) return;

  const timer = setTimeout(() => {
    setShowTimeout(true);
  }, 30000); // 30 seconds

  return () => clearTimeout(timer);
}, [thinkingStartTime]);

return {
  ...uiState,
  showTimeout,
  thinkingDuration: thinkingStartTime ? Date.now() - thinkingStartTime : 0,
};
```

Update `TimeoutIndicator.tsx`:
```typescript
import { AlertTriangle } from 'lucide-react';

interface TimeoutIndicatorProps {
  duration: number;
  onCancel: () => void;
}

export default function TimeoutIndicator({ duration, onCancel }: TimeoutIndicatorProps) {
  const seconds = Math.floor(duration / 1000);

  return (
    <div className=\"fixed top-4 right-4 bg-yellow-900/90 border border-yellow-600 rounded-lg p-4 flex items-center gap-4 z-50\">
      <AlertTriangle className=\"w-5 h-5 text-yellow-500\" />
      <div className=\"flex-1\">
        <p className=\"font-medium\">Taking longer than expected</p>
        <p className=\"text-sm text-gray-300\">
          Processing for {seconds}s...
        </p>
      </div>
      <button
        onClick={onCancel}
        className=\"px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors\"
      >
        Cancel
      </button>
    </div>
  );
}
```

Add to `GnaniCore.tsx`:
```typescript
import TimeoutIndicator from '../common/TimeoutIndicator';

const { showTimeout, thinkingDuration } = useGnaniUIState();

{showTimeout && (
  <TimeoutIndicator
    duration={thinkingDuration}
    onCancel={() => {
      // Cancel current request
      conversationStore.cancelStream(sessionId, accessToken);
    }}
  />
)}
```

**Verification:**
1. Send message that takes >30s to process
2. Verify timeout indicator appears
3. Click cancel button
4. Verify request is cancelled
5. Test with fast responses (indicator shouldn't show)

---

### Task 2.7: Complete or Remove Terminal View ⚡ MEDIUM
**Files:**
- `gnani-rnd/react/src/components/terminal/*`
- `gnani-rnd/react/src/pages/ChatPage.tsx`

**Decision Required:** Complete implementation OR remove components  
**Effort:** 2 days (complete) OR 2 hours (remove)

**Option A: Complete Terminal View**
```typescript
// Add terminal mode toggle to ChatPage
const [viewMode, setViewMode] = useState<'chat' | 'terminal'>('chat');

<div className=\"flex gap-2 mb-4\">
  <button
    onClick={() => setViewMode('chat')}
    className={viewMode === 'chat' ? 'active' : ''}
  >
    Chat View
  </button>
  <button
    onClick={() => setViewMode('terminal')}
    className={viewMode === 'terminal' ? 'active' : ''}
  >
    Terminal View
  </button>
</div>

{viewMode === 'chat' ? (
  <ChatView />
) : (
  <TerminalView />
)}
```

**Option B: Remove Terminal Components**
```bash
# Remove terminal components
rm -rf src/components/terminal/
# Remove terminal imports from pages
# Remove terminal routes
```

**Recommendation:** Remove for now. Terminal view is not critical and adds complexity. Can be added in future phase if needed.

**Verification (if completing):**
1. Toggle between chat and terminal views
2. Verify messages display in terminal format
3. Test terminal commands
4. Verify history navigation

**Verification (if removing):**
1. Verify no broken imports
2. Verify app builds successfully
3. Verify no dead code references

---

### Task 2.8: Add Conversation Search in Sidebar ⚡ MEDIUM
**Files:**
- `gnani-rnd/react/src/components/conversation/ConversationSidebar.tsx`

**Issue:** No search functionality in conversation list  
**Effort:** 1 day

**Implementation:**

Update `ConversationSidebar.tsx`:
```typescript
import { Search, X } from 'lucide-react';
import { useState, useMemo } from 'react';

export default function ConversationSidebar() {
  const [searchQuery, setSearchQuery] = useState('');
  const { conversations } = useConversationStore();

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;

    const query = searchQuery.toLowerCase();
    return conversations.filter(conv =>
      conv.title.toLowerCase().includes(query)
    );
  }, [conversations, searchQuery]);

  return (
    <div className=\"flex flex-col h-full\">
      {/* Search Input */}
      <div className=\"p-4 border-b border-gray-800\">
        <div className=\"flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2\">
          <Search className=\"w-4 h-4 text-gray-400\" />
          <input
            type=\"text\"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder=\"Search conversations...\"
            className=\"flex-1 bg-transparent outline-none text-sm\"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className=\"p-1 hover:bg-gray-700 rounded\"
            >
              <X className=\"w-3 h-3\" />
            </button>
          )}
        </div>
      </div>

      {/* Conversation List */}
      <div className=\"flex-1 overflow-y-auto\">
        {filteredConversations.length > 0 ? (
          filteredConversations.map(conv => (
            <ConversationListItem key={conv.id} conversation={conv} />
          ))
        ) : (
          <div className=\"text-center py-8 text-gray-400 text-sm\">
            No conversations found
          </div>
        )}
      </div>
    </div>
  );
}
```

**Verification:**
1. Type in search box
2. Verify conversations filter in real-time
3. Clear search
4. Verify all conversations show again
5. Test with no results

---

### Task 2.9: Add Sorting Options for Conversations ⚡ LOW
**Files:**
- `gnani-rnd/react/src/components/conversation/ConversationSidebar.tsx`
- `gnani-rnd/react/src/store/useConversationStore.ts`

**Issue:** Conversations only sorted by date  
**Effort:** 4 hours

**Implementation:**

Update `useConversationStore.ts`:
```typescript
interface ConversationStore {
  sortBy: 'date' | 'name' | 'messageCount';
  sortOrder: 'asc' | 'desc';

  setSortBy: (sortBy: 'date' | 'name' | 'messageCount') => void;
  setSortOrder: (order: 'asc' | 'desc') => void;
  getSortedConversations: () => ConversationSummary[];
}

export const useConversationStore = create<ConversationStore>()((set, get) => ({
  sortBy: 'date',
  sortOrder: 'desc',

  setSortBy: (sortBy) => set({ sortBy }),
  setSortOrder: (sortOrder) => set({ sortOrder }),

  getSortedConversations: () => {
    const { conversations, sortBy, sortOrder } = get();
    const sorted = [...conversations];

    sorted.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'date':
          comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          break;
        case 'name':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'messageCount':
          comparison = (a.messageCount || 0) - (b.messageCount || 0);
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return sorted;
  },
}));
```

Update `ConversationSidebar.tsx`:
```typescript
import { ArrowUpDown } from 'lucide-react';

const { sortBy, sortOrder, setSortBy, setSortOrder, getSortedConversations } = useConversationStore();
const sortedConversations = getSortedConversations();

<div className=\"p-4 border-b border-gray-800 flex items-center gap-2\">
  <select
    value={sortBy}
    onChange={(e) => setSortBy(e.target.value as any)}
    className=\"flex-1 bg-gray-800 rounded-lg px-3 py-2 text-sm\"
  >
    <option value=\"date\">Last Updated</option>
    <option value=\"name\">Name</option>
    <option value=\"messageCount\">Message Count</option>
  </select>

  <button
    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
    className=\"p-2 hover:bg-gray-800 rounded-lg\"
    title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
  >
    <ArrowUpDown className=\"w-4 h-4\" />
  </button>
</div>
```

**Verification:**
1. Sort by date (ascending/descending)
2. Sort by name (A-Z, Z-A)
3. Sort by message count
4. Verify sorting persists across sessions

---

### Task 2.10: Implement Pagination for Conversations and Messages ⚡ HIGH
**Files:**
- `gnani-rnd/react/src/store/useConversationStore.ts`
- `gnani-rnd/react/src/components/conversation/ConversationSidebar.tsx`
- `gnani-rnd/react/src/components/chat/MessageList.tsx`
- `gnani-rnd-backend/src/modules/conversation/conversation.service.ts`

**Issue:** All data loaded at once - performance issue with large datasets  
**Effort:** 2 days

**Implementation:**

Backend pagination in `conversation.service.ts`:
```typescript
async getConversations(userId: string, options: PaginationOptions) {
  const { page = 1, limit = 20, sortBy = 'updatedAt', sortOrder = 'desc' } = options;

  const skip = (page - 1) * limit;

  const [conversations, total] = await Promise.all([
    Conversation.find({ userId })
      .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
      .skip(skip)
      .limit(limit)
      .select('_id title updatedAt messageCount')
      .lean(),
    Conversation.countDocuments({ userId })
  ]);

  return {
    conversations,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total
    }
  };
}

async getMessages(conversationId: string, options: PaginationOptions) {
  const { page = 1, limit = 50 } = options;
  const skip = (page - 1) * limit;

  const [messages, total] = await Promise.all([
    Message.find({ conversationId })
      .sort({ timestamp: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Message.countDocuments({ conversationId })
  ]);

  return {
    messages,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasMore: page * limit < total
    }
  };
}
```

Frontend pagination in `useConversationStore.ts`:
```typescript
interface ConversationStore {
  conversationPage: number;
  conversationHasMore: boolean;
  isLoadingMore: boolean;

  loadMoreConversations: (accessToken: string) => Promise<void>;
}

export const useConversationStore = create<ConversationStore>()((set, get) => ({
  conversationPage: 1,
  conversationHasMore: true,
  isLoadingMore: false,

  fetchConversations: async (accessToken) => {
    set({ isLoadingConversations: true, conversationPage: 1 });

    try {
      const response = await apiClient.get('/conversations', {
        params: { page: 1, limit: 20 }
      });

      set({
        conversations: response.conversations,
        conversationHasMore: response.pagination.hasMore
      });
    } finally {
      set({ isLoadingConversations: false });
    }
  },

  loadMoreConversations: async (accessToken) => {
    const { conversationPage, conversationHasMore, isLoadingMore } = get();

    if (!conversationHasMore || isLoadingMore) return;

    set({ isLoadingMore: true });

    try {
      const nextPage = conversationPage + 1;
      const response = await apiClient.get('/conversations', {
        params: { page: nextPage, limit: 20 }
      });

      set((state) => ({
        conversations: [...state.conversations, ...response.conversations],
        conversationPage: nextPage,
        conversationHasMore: response.pagination.hasMore,
      }));
    } finally {
      set({ isLoadingMore: false });
    }
  },
}));
```

Infinite scroll in `ConversationSidebar.tsx`:
```typescript
import { useEffect, useRef } from 'react';

export default function ConversationSidebar() {
  const { loadMoreConversations, conversationHasMore, isLoadingMore } = useConversationStore();
  const { accessToken } = useUserStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
      const scrolledToBottom = scrollHeight - scrollTop - clientHeight < 100;

      if (scrolledToBottom && conversationHasMore && !isLoadingMore) {
        loadMoreConversations(accessToken!);
      }
    };

    scrollContainer.addEventListener('scroll', handleScroll);
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, [conversationHasMore, isLoadingMore]);

  return (
    <div className=\"flex flex-col h-full\">
      <div ref={scrollRef} className=\"flex-1 overflow-y-auto\">
        {conversations.map(conv => (
          <ConversationListItem key={conv.id} conversation={conv} />
        ))}

        {isLoadingMore && (
          <div className=\"text-center py-4 text-gray-400\">
            Loading more...
          </div>
        )}
      </div>
    </div>
  );
}
```

**Verification:**
1. Load conversations - should show first 20
2. Scroll to bottom - should load more
3. Verify no duplicate conversations
4. Test with 100+ conversations
5. Verify performance improvement

---

## ✅ STAGE 2 VERIFICATION CHECKLIST

### Unit Tests
- [ ] Folder operations (create, delete, move)
- [ ] Search filtering
- [ ] Sorting logic
- [ ] Pagination logic

### Integration Tests
- [ ] Folder API integration
- [ ] Advanced search API integration
- [ ] Share link generation
- [ ] Pagination with backend

### Manual Testing
- [ ] Create and organize folders
- [ ] Search conversations
- [ ] Generate and use share links
- [ ] Undo message deletion
- [ ] Infinite scroll loading

### UI/UX Testing
- [ ] Folder UI is intuitive
- [ ] Search is responsive
- [ ] Share modal is clear
- [ ] Undo toast is visible
- [ ] Loading states are smooth

---

**END OF STAGE 2**
