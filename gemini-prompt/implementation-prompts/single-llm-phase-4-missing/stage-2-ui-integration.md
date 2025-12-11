# STAGE 2: UI INTEGRATION COMPLETION

**Duration:** 2 weeks  
**Priority:** HIGH  
**Dependencies:** Stage 1 (API Client)

---

## 🎯 OBJECTIVE

Connect existing UI components to routes and flows. Many features are built but not accessible to users. This stage makes them usable.

---

## 📋 TASKS

### Task 2.1: Connect Advanced Search UI ⚡ HIGH PRIORITY
**Files:**
- `gnani-rnd/react/src/components/common/AdvancedSearch.tsx` (EXISTS - not accessible)
- NEW: `gnani-rnd/react/src/pages/SearchPage.tsx`
- `gnani-rnd/react/src/App.tsx`

**Issue:** Advanced Search component built but no route/navigation  
**Impact:** Users can't access advanced search features  
**Effort:** 4 hours

**Implementation:**

**Step 1:** Create Search Page
```typescript
// src/pages/SearchPage.tsx
import React from 'react';
import AdvancedSearch from '../components/common/AdvancedSearch';
import { useSearchStore } from '../store/useSearchStore';

export const SearchPage: React.FC = () => {
  const { results, isLoading } = useSearchStore();
  
  return (
    <div className="search-page">
      <h1>Advanced Search</h1>
      <AdvancedSearch />
      
      {isLoading && <div>Searching...</div>}
      
      {results.length > 0 && (
        <div className="search-results">
          {results.map(result => (
            <SearchResultItem key={result.id} result={result} />
          ))}
        </div>
      )}
    </div>
  );
};
```

**Step 2:** Add route
```typescript
// src/App.tsx
import { SearchPage } from './pages/SearchPage';

<Route path="/search" element={<SearchPage />} />
```

**Step 3:** Add navigation
```typescript
// src/components/chat/ChatHeader.tsx
import { Search } from 'lucide-react';

<button onClick={() => navigate('/search')}>
  <Search size={20} />
  Advanced Search
</button>
```

**Step 4:** Connect to backend
```typescript
// src/store/useSearchStore.ts
import { api } from '../api/client';

const search = async (query: string, filters: SearchFilters) => {
  set({ isLoading: true });
  
  try {
    const results = await api.post('/search/advanced', {
      query,
      filters
    });
    
    set({ results, isLoading: false });
  } catch (error) {
    set({ error, isLoading: false });
  }
};
```

**Verification:**
1. Click search icon - should navigate to /search
2. Enter query with filters - should show results
3. Click result - should navigate to conversation
4. Test all filter combinations

---

### Task 2.2: Wire Up Undo Toast Completely
**Files:**
- `gnani-rnd/react/src/components/common/UndoToast.tsx` (EXISTS)
- `gnani-rnd/react/src/components/common/UndoToastWrapper.tsx` (EXISTS)
- `gnani-rnd/react/src/store/useConversationStore.ts`

**Issue:** Undo Toast exists but not fully wired to all actions  
**Effort:** 1 day

**Implementation:**

**Step 1:** Add undo stack to store
```typescript
// useConversationStore.ts
interface UndoAction {
  type: 'delete' | 'edit' | 'regenerate';
  messageId: string;
  previousState: any;
  timestamp: number;
}

const undoStack: UndoAction[] = [];

const pushUndo = (action: UndoAction) => {
  undoStack.push(action);
  if (undoStack.length > 10) {
    undoStack.shift(); // Keep last 10
  }
};
```

**Step 2:** Implement undo for delete
```typescript
const deleteMessage = async (messageId: string) => {
  const message = get().allMessages.find(m => m.id === messageId);
  
  // Save for undo
  pushUndo({
    type: 'delete',
    messageId,
    previousState: message,
    timestamp: Date.now()
  });
  
  // Delete
  await api.delete(`/conversations/messages/${messageId}`);
  
  // Show undo toast
  showUndoToast('Message deleted', () => undoDelete(messageId));
};

const undoDelete = async (messageId: string) => {
  const action = undoStack.find(a => a.messageId === messageId);
  if (!action) return;
  
  // Restore message
  await api.post('/conversations/messages', action.previousState);
  await refreshConversation();
};
```

**Step 3:** Implement for edit and regenerate
```typescript
const editMessage = async (messageId: string, newContent: string) => {
  const message = get().allMessages.find(m => m.id === messageId);
  
  pushUndo({
    type: 'edit',
    messageId,
    previousState: { content: message.content },
    timestamp: Date.now()
  });
  
  // ... edit logic
  showUndoToast('Message edited', () => undoEdit(messageId));
};
```

**Verification:**
1. Delete message - undo toast appears
2. Click undo - message restored
3. Edit message - undo works
4. Regenerate - undo works
5. Undo expires after 5s

---

### Task 2.3: Implement Pagination for Conversations ⚡ HIGH PRIORITY
**Files:**
- `gnani-rnd/react/src/components/conversation/ConversationSidebar.tsx`
- `gnani-rnd/react/src/store/useConversationStore.ts`
- `gnani-rnd-backend/src/routes/conversation.routes.ts`

**Issue:** No pagination - loads all conversations  
**Impact:** Performance issues with many conversations  
**Effort:** 1 day

**Implementation:**

**Step 1:** Add pagination to backend
```typescript
// conversation.routes.ts
router.get('/',
  authenticateToken,
  async (req, res) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    
    const conversations = await Conversation.find({ userId: req.user.userId })
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Conversation.countDocuments({ userId: req.user.userId });
    
    res.json({
      conversations,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + conversations.length < total
      }
    });
  }
);
```

**Step 2:** Add pagination to store
```typescript
// useConversationStore.ts
interface PaginationState {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

const loadConversations = async (page = 1) => {
  const response = await api.get(`/conversations?page=${page}&limit=20`);
  
  set({
    conversations: response.conversations,
    pagination: response.pagination
  });
};

const loadMore = async () => {
  const { pagination } = get();
  if (!pagination.hasMore) return;
  
  const response = await api.get(`/conversations?page=${pagination.page + 1}&limit=20`);
  
  set({
    conversations: [...get().conversations, ...response.conversations],
    pagination: response.pagination
  });
};
```

**Step 3:** Add infinite scroll to UI
```typescript
// ConversationSidebar.tsx
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';

const ConversationSidebar = () => {
  const { conversations, pagination, loadMore } = useConversationStore();
  const { ref } = useInfiniteScroll({
    onLoadMore: loadMore,
    hasMore: pagination.hasMore
  });
  
  return (
    <div className="conversation-list">
      {conversations.map(conv => (
        <ConversationListItem key={conv.id} conversation={conv} />
      ))}
      
      {pagination.hasMore && (
        <div ref={ref} className="loading-trigger">
          Loading more...
        </div>
      )}
    </div>
  );
};
```

**Verification:**
1. Create 50+ conversations
2. Scroll to bottom - more load automatically
3. Check network - only 20 loaded initially
4. Verify smooth scrolling
5. Test with slow network

---

### Task 2.4: Implement Message Pagination
**Files:**
- `gnani-rnd/react/src/components/chat/MessageList.tsx`
- `gnani-rnd/react/src/store/useConversationStore.ts`

**Issue:** Loads all messages - performance issue for long conversations  
**Effort:** 1 day

**Implementation:**

```typescript
// useConversationStore.ts
const loadMessages = async (conversationId: string, before?: string) => {
  const url = before 
    ? `/conversations/${conversationId}/messages?before=${before}&limit=50`
    : `/conversations/${conversationId}/messages?limit=50`;
  
  const response = await api.get(url);
  
  if (before) {
    // Prepend older messages
    set({
      allMessages: [...response.messages, ...get().allMessages]
    });
  } else {
    // Initial load
    set({
      allMessages: response.messages
    });
  }
};

// MessageList.tsx - Load more when scrolling to top
const handleScroll = (e: React.UIEvent) => {
  if (e.currentTarget.scrollTop === 0 && hasMoreMessages) {
    const oldestMessage = allMessages[0];
    loadMessages(conversationId, oldestMessage.id);
  }
};
```

**Verification:**
1. Open conversation with 200+ messages
2. Scroll to top - older messages load
3. Check network - only 50 loaded initially
4. Verify scroll position maintained

---

### Task 2.5: Add Conversation Search in Sidebar
**Files:**
- `gnani-rnd/react/src/components/conversation/ConversationSidebar.tsx`

**Issue:** No way to search conversations  
**Effort:** 4 hours

**Implementation:**

```typescript
// ConversationSidebar.tsx
const [searchQuery, setSearchQuery] = useState('');
const [filteredConversations, setFilteredConversations] = useState([]);

useEffect(() => {
  if (!searchQuery) {
    setFilteredConversations(conversations);
    return;
  }
  
  const filtered = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.messages?.some(m => 
      m.content.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );
  
  setFilteredConversations(filtered);
}, [searchQuery, conversations]);

return (
  <div className="sidebar">
    <input
      type="text"
      placeholder="Search conversations..."
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      className="search-input"
    />
    
    {filteredConversations.map(conv => (
      <ConversationListItem key={conv.id} conversation={conv} />
    ))}
  </div>
);
```

**Verification:**
1. Type in search - conversations filter
2. Search message content - finds conversations
3. Clear search - shows all
4. Test with special characters

---

### Task 2.6: Add Sorting Options for Conversations
**Files:**
- `gnani-rnd/react/src/components/conversation/ConversationSidebar.tsx`

**Issue:** Only sorted by date  
**Effort:** 2 hours

**Implementation:**

```typescript
type SortOption = 'date' | 'title' | 'messageCount';

const [sortBy, setSortBy] = useState<SortOption>('date');

const sortedConversations = useMemo(() => {
  const sorted = [...filteredConversations];
  
  switch (sortBy) {
    case 'date':
      return sorted.sort((a, b) => 
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    case 'title':
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    case 'messageCount':
      return sorted.sort((a, b) => 
        (b.messageCount || 0) - (a.messageCount || 0)
      );
    default:
      return sorted;
  }
}, [filteredConversations, sortBy]);

return (
  <div className="sidebar">
    <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortOption)}>
      <option value="date">Most Recent</option>
      <option value="title">Title (A-Z)</option>
      <option value="messageCount">Most Messages</option>
    </select>
    
    {sortedConversations.map(...)}
  </div>
);
```

---

### Task 2.7: Complete Share Modal Integration
**Files:**
- `gnani-rnd/react/src/components/common/ShareModal.tsx`
- `gnani-rnd/react/src/components/chat/ChatHeader.tsx`

**Issue:** Share modal partially implemented  
**Effort:** 4 hours

**Implementation:**

```typescript
// ChatHeader.tsx
import { ShareModal } from '../common/ShareModal';

const [showShareModal, setShowShareModal] = useState(false);

<button onClick={() => setShowShareModal(true)}>
  <Share size={20} />
</button>

{showShareModal && (
  <ShareModal
    conversationId={conversationId}
    onClose={() => setShowShareModal(false)}
  />
)}

// ShareModal.tsx - Complete implementation
const generateShareLink = async () => {
  const response = await api.post(`/conversations/${conversationId}/share`, {
    expiresIn: '7d',
    allowComments: false
  });
  
  return `${window.location.origin}/shared/${response.shareId}`;
};
```

---

### Task 2.8: Add Streaming Progress Indicator
**Files:**
- `gnani-rnd/react/src/components/common/StreamingProgress.tsx`
- `gnani-rnd/react/src/components/chat/MessageList.tsx`

**Issue:** Component exists but not used  
**Effort:** 2 hours

**Implementation:**

```typescript
// MessageList.tsx
import { StreamingProgress } from '../common/StreamingProgress';

{isStreaming && (
  <StreamingProgress
    progress={streamProgress}
    message="Generating response..."
  />
)}
```

---

### Task 2.9: Integrate Timeout Indicator
**Files:**
- `gnani-rnd/react/src/components/common/TimeoutIndicator.tsx`

**Issue:** Component exists but not used  
**Effort:** 2 hours

**Implementation:**

```typescript
// Add to message items that are taking too long
{messageAge > 30000 && status === 'pending' && (
  <TimeoutIndicator
    onRetry={() => regenerateMessage(messageId)}
    onCancel={() => cancelMessage(messageId)}
  />
)}
```

---

## ✅ VERIFICATION CHECKLIST

- [ ] Advanced Search accessible from UI
- [ ] Undo works for all message actions
- [ ] Conversations paginated (20 per page)
- [ ] Messages paginated (50 per load)
- [ ] Conversation search works
- [ ] Sorting options work
- [ ] Share modal functional
- [ ] Progress indicators show
- [ ] Timeout indicators work

---

## 🚀 NEXT STEPS

After Stage 2 completion:
→ **Stage 3:** Backend Service Integration
