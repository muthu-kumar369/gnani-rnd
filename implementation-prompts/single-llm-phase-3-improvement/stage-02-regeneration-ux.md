# Stage 2: Improved Regeneration UX

## Overview
Enhance the regeneration UX to match ChatGPT's quality with visible regenerate buttons, variant navigation, and smooth transitions.

## Current State Analysis

**Location**: `D:\learning\hey\gnani-rnd\react\src\hooks\useMessageActions.ts`

**Current Behavior**:
- Regeneration exists but hidden in message actions
- No visual indication of multiple variants
- No easy way to navigate between regenerated responses

**Gap**: ChatGPT shows a prominent "Regenerate" button below each assistant message with variant indicators (1/3, 2/3, etc.).

---

## Implementation Steps

### Step 1: Add Regenerate Button to MessageBubble

**File**: `D:\learning\hey\gnani-rnd\react\src\components\terminal\MessageBubble.tsx`

```tsx
import { RotateCw, ChevronLeft, ChevronRight } from 'lucide-react';

// Add to component
const { regenerateResponse, getMessageGenerations } = useMessageActions();
const [generations, setGenerations] = useState<any[]>([]);
const [currentGenIndex, setCurrentGenIndex] = useState(0);
const [isRegenerating, setIsRegenerating] = useState(false);

// Fetch generations on mount
useEffect(() => {
  if (message.type === 'gnani' && message._id) {
    fetchGenerations();
  }
}, [message._id]);

const fetchGenerations = async () => {
  const gens = await getMessageGenerations(message._id);
  setGenerations(gens || []);
  // Find current generation index
  const currentIndex = gens.findIndex(g => g._id === message._id);
  setCurrentGenIndex(currentIndex >= 0 ? currentIndex : 0);
};

const handleRegenerate = async () => {
  setIsRegenerating(true);
  try {
    await regenerateResponse(message._id);
    await fetchGenerations(); // Refresh generations
  } catch (error) {
    console.error('Regeneration failed:', error);
  } finally {
    setIsRegenerating(false);
  }
};

const handleNavigateGeneration = (direction: 'prev' | 'next') => {
  const newIndex = direction === 'prev' ? currentGenIndex - 1 : currentGenIndex + 1;
  if (newIndex >= 0 && newIndex < generations.length) {
    setCurrentGenIndex(newIndex);
    // Update message content
    updateMessageContent(message._id, generations[newIndex].content);
  }
};
```

### Step 2: Add Regeneration UI Below Assistant Messages

```tsx
{message.type === 'gnani' && isLatest && (
  <div className="mt-3 flex items-center justify-between border-t border-cyan-500/20 pt-3">
    {/* Variant Navigation */}
    {generations.length > 1 && (
      <div className="flex items-center gap-2 text-xs text-cyan-500/60">
        <button
          onClick={() => handleNavigateGeneration('prev')}
          disabled={currentGenIndex === 0}
          className="p-1 hover:bg-cyan-500/20 rounded disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={14} />
        </button>
        <span>{currentGenIndex + 1} / {generations.length}</span>
        <button
          onClick={() => handleNavigateGeneration('next')}
          disabled={currentGenIndex === generations.length - 1}
          className="p-1 hover:bg-cyan-500/20 rounded disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    )}

    {/* Regenerate Button */}
    <button
      onClick={handleRegenerate}
      disabled={isRegenerating}
      className="flex items-center gap-2 px-3 py-1.5 text-xs bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded transition-colors disabled:opacity-50"
    >
      <RotateCw size={14} className={isRegenerating ? 'animate-spin' : ''} />
      {isRegenerating ? 'Regenerating...' : 'Regenerate'}
    </button>
  </div>
)}
```

### Step 3: Add useMessageActions Hook

**File**: `D:\learning\hey\gnani-rnd\react\src\hooks\useMessageActions.ts`

```typescript
import { useCallback } from 'react';
import { useConversationStore } from '../store/useConversationStore';
import { useUserStore } from '../store/useUserStore';

export const useMessageActions = () => {
  const { conversationId, refreshConversation } = useConversationStore();
  const { accessToken } = useUserStore();

  const regenerateResponse = useCallback(async (messageId: string) => {
    if (!conversationId || !accessToken) return;

    const response = await fetch(
      `http://localhost:3000/api/conversations/${conversationId}/regenerate`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': accessToken
        },
        body: JSON.stringify({ messageId })
      }
    );

    if (!response.ok) throw new Error('Regeneration failed');

    // Refresh conversation to get new response
    await refreshConversation(accessToken);

    return await response.json();
  }, [conversationId, accessToken, refreshConversation]);

  const getMessageGenerations = useCallback(async (messageId: string) => {
    if (!conversationId || !accessToken) return [];

    const response = await fetch(
      `http://localhost:3000/api/conversations/${conversationId}/messages/${messageId}/generations`,
      {
        headers: { 'x-auth-token': accessToken }
      }
    );

    if (!response.ok) return [];

    const data = await response.json();
    return data.generations || [];
  }, [conversationId, accessToken]);

  return {
    regenerateResponse,
    getMessageGenerations
  };
};
```

---

## Testing Instructions

1. Send a message and wait for response
2. Click "Regenerate" button
3. ✅ Verify new response generates
4. ✅ Verify variant counter shows "2/2"
5. Click regenerate again
6. ✅ Verify counter shows "3/3"
7. Click left arrow
8. ✅ Verify previous variant displays
9. Click right arrow
10. ✅ Verify next variant displays

---

## Success Criteria

- ✅ Regenerate button visible below latest assistant message
- ✅ Variant navigation works smoothly
- ✅ Regeneration shows loading state
- ✅ Variants persist across page refresh
- ✅ UI matches ChatGPT quality

---

## Estimated Time: 6 hours
