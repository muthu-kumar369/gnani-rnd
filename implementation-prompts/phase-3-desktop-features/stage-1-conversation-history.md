# Stage 1: Conversation History & Search Implementation

## Objective

Implement a complete conversation history system that allows users to view, search, and resume past conversations. This feature is critical for desktop AI assistants and must integrate seamlessly with the existing conversation terminal.

---

## Context

**Current State**:
- Conversations are saved to MongoDB but not displayed in UI
- Terminal shows only current session messages
- No way to view or search past conversations

**Desired State**:
- Sidebar showing list of past conversations
- Full-text search across all conversations
- Click to resume/view past conversation
- Export conversations to Markdown/PDF

**Constraints**:
- Must not break existing conversation terminal
- Must preserve current session state when viewing history
- Must be performant (search <500ms)

---

## Implementation Prompt

### Part 1: Backend API Development

**Task**: Create REST API endpoints for conversation history management.

**Requirements**:

1. **GET `/api/conversations`** - List user's conversations
   - Query params: `page`, `limit`, `sortBy` (date/title)
   - Response: Paginated list with metadata
   ```typescript
   {
     conversations: [{
       id: string,
       title: string, // Auto-generated from first message
       createdAt: Date,
       updatedAt: Date,
       messageCount: number,
       preview: string // First 100 chars
     }],
     total: number,
     page: number,
     hasMore: boolean
   }
   ```

2. **GET `/api/conversations/:id`** - Get full conversation
   - Response: Complete message history
   ```typescript
   {
     id: string,
     title: string,
     messages: [{
       id: string,
       role: 'user' | 'assistant' | 'system',
       content: string,
       timestamp: Date,
       metadata?: any
     }],
     createdAt: Date,
     updatedAt: Date
   }
   ```

3. **POST `/api/conversations/search`** - Search conversations
   - Body: `{ query: string, limit?: number }`
   - Use MongoDB text index for full-text search
   - Response: Matching conversations with highlighted snippets

4. **DELETE `/api/conversations/:id`** - Delete conversation
   - Soft delete (mark as deleted, don't remove from DB)
   - Response: Success confirmation

5. **PATCH `/api/conversations/:id/title`** - Update conversation title
   - Body: `{ title: string }`
   - Response: Updated conversation

**Implementation Steps**:

1. **Create Conversation Service** (`src/modules/conversation/conversation.service.ts`):
   ```typescript
   class ConversationService {
     async listConversations(userId: string, options: PaginationOptions)
     async getConversation(conversationId: string, userId: string)
     async searchConversations(userId: string, query: string)
     async deleteConversation(conversationId: string, userId: string)
     async updateTitle(conversationId: string, userId: string, title: string)
     async generateTitle(messages: Message[]): Promise<string> // Use LLM to generate title
   }
   ```

2. **Create Routes** (`src/modules/conversation/conversation.routes.ts`):
   - Add authentication middleware
   - Add rate limiting
   - Add input validation

3. **Add MongoDB Indexes**:
   ```typescript
   // In conversation.entity.ts
   @Index({ userId: 1, createdAt: -1 }) // For listing
   @Index({ userId: 1, 'messages.content': 'text' }) // For search
   @Index({ userId: 1, deleted: 1 }) // For soft delete
   ```

4. **Add Auto-Title Generation**:
   - When conversation has 2+ messages, generate title using LLM
   - Use first user message as context
   - Store in `title` field

**Files to Create/Modify**:
- `src/modules/conversation/conversation.service.ts` (NEW)
- `src/modules/conversation/conversation.routes.ts` (NEW)
- `src/modules/conversation/conversation.controller.ts` (NEW)
- `src/modules/memory/entities/conversation.entity.ts` (MODIFY - add indexes)
- `src/routes/index.ts` (MODIFY - add conversation routes)

**Testing**:
- Unit tests for conversation service
- Integration tests for API endpoints
- Test pagination, search, and soft delete

---

### Part 2: Frontend Conversation Sidebar

**Task**: Create a collapsible sidebar showing conversation history.

**Requirements**:

1. **Sidebar Component** (`ConversationSidebar.tsx`):
   - Collapsible (default: collapsed)
   - Shows list of conversations (newest first)
   - Search bar at top
   - "New Conversation" button
   - Infinite scroll for pagination

2. **Conversation List Item**:
   ```tsx
   <ConversationListItem>
     <Title>{conversation.title}</Title>
     <Preview>{conversation.preview}</Preview>
     <Timestamp>{formatRelative(conversation.updatedAt)}</Timestamp>
     <Actions>
       <IconButton onClick={onResume}>Resume</IconButton>
       <IconButton onClick={onDelete}>Delete</IconButton>
     </Actions>
   </ConversationListItem>
   ```

3. **Search Functionality**:
   - Debounced search input (300ms)
   - Show search results with highlighted matches
   - Clear search button

4. **State Management**:
   - Create `ConversationHistoryContext`:
     ```typescript
     interface ConversationHistoryState {
       conversations: Conversation[];
       currentConversation: Conversation | null;
       isLoading: boolean;
       searchQuery: string;
       hasMore: boolean;
     }
     ```

**Implementation Steps**:

1. **Create API Hook** (`useConversationHistory.ts`):
   ```typescript
   const useConversationHistory = () => {
     const [conversations, setConversations] = useState([]);
     const [isLoading, setIsLoading] = useState(false);
     
     const loadConversations = async (page = 1) => {
       const response = await fetch(`/api/conversations?page=${page}`);
       const data = await response.json();
       setConversations(prev => [...prev, ...data.conversations]);
     };
     
     const searchConversations = async (query: string) => {
       const response = await fetch('/api/conversations/search', {
         method: 'POST',
         body: JSON.stringify({ query })
       });
       const data = await response.json();
       setConversations(data.conversations);
     };
     
     return { conversations, loadConversations, searchConversations };
   };
   ```

2. **Create Sidebar Component**:
   - Use Framer Motion for slide-in animation
   - Add keyboard shortcuts (Cmd/Ctrl+K to toggle)
   - Preserve scroll position when toggling

3. **Integrate with GnaniCore**:
   - Add sidebar toggle button to header
   - When conversation is selected, load messages into terminal
   - Preserve current session when viewing history (don't mix)

**Files to Create/Modify**:
- `src/components/conversation/ConversationSidebar.tsx` (NEW)
- `src/components/conversation/ConversationListItem.tsx` (NEW)
- `src/hooks/useConversationHistory.ts` (NEW)
- `src/context/ConversationHistoryContext.tsx` (NEW)
- `src/components/gnani/GnaniCore.tsx` (MODIFY - add sidebar)

**Styling**:
- Match existing Jarvis theme
- Use glass-morphism for sidebar
- Smooth transitions (300ms ease-in-out)

---

### Part 3: Resume Conversation Feature

**Task**: Allow users to resume a past conversation.

**Requirements**:

1. **Backend**:
   - When resuming, load conversation context into session
   - Restore memory state (short-term, long-term)
   - Continue conversation from last message

2. **Frontend**:
   - "Resume" button on conversation list item
   - Load messages into terminal
   - Show indicator "Resumed from [date]"
   - Allow continuing conversation

**Implementation Steps**:

1. **Backend Resume Logic**:
   ```typescript
   async resumeConversation(conversationId: string, userId: string) {
     // 1. Load conversation from MongoDB
     const conversation = await this.getConversation(conversationId, userId);
     
     // 2. Create new session with conversation context
     const sessionId = await sessionManager.startSession(userId, ...);
     
     // 3. Restore memory state
     await memoryManager.restoreConversationContext(sessionId, conversation);
     
     // 4. Return session ID and messages
     return { sessionId, messages: conversation.messages };
   }
   ```

2. **Frontend Resume Flow**:
   - Click "Resume" → Call API → Get session ID
   - Load messages into terminal
   - Update `GnaniStateContext` with new session
   - Enable mic for continuing conversation

**Files to Create/Modify**:
- `src/modules/conversation/conversation.service.ts` (MODIFY - add resume)
- `src/modules/memory/memory.manager.ts` (MODIFY - add restore)
- `src/components/conversation/ConversationSidebar.tsx` (MODIFY - add resume button)

---

## Testing Checklist

### Backend
- [ ] List conversations returns paginated results
- [ ] Search returns relevant conversations
- [ ] Delete marks conversation as deleted
- [ ] Title generation creates meaningful titles
- [ ] Resume loads correct context

### Frontend
- [ ] Sidebar toggles smoothly
- [ ] Search debounces correctly
- [ ] Infinite scroll loads more conversations
- [ ] Resume loads messages into terminal
- [ ] Current session is preserved when viewing history

### Integration
- [ ] End-to-end: Create conversation → Search → Resume
- [ ] Performance: Search completes in <500ms
- [ ] UI: No flicker when switching conversations

---

## Rollback Plan

If issues arise:
1. **Disable sidebar**: Set feature flag `ENABLE_CONVERSATION_HISTORY=false`
2. **Fallback UI**: Hide sidebar, show only current session
3. **Database**: Soft delete allows recovery

---

## Success Criteria

- [ ] Users can view list of past conversations
- [ ] Search finds conversations by content
- [ ] Resume continues conversation with context
- [ ] Performance: <500ms search, <1s resume
- [ ] No breaking changes to existing terminal

---

## Notes

- **Auto-Title**: Use LLM to generate conversation titles (e.g., "Weather in Paris", "Python debugging help")
- **Export**: Add export to Markdown/PDF in future stage
- **Folders**: Add conversation folders/tags in future stage
- **Sync**: Consider multi-device sync in future (use MongoDB as source of truth)
