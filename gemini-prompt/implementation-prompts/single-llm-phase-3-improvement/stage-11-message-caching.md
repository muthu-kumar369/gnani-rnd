# Stage 11: Message Caching Implementation

## Overview
Implement intelligent message caching to dramatically improve conversation switching performance.

## Current State Analysis

**Current Behavior**:
- Every conversation switch fetches all messages from backend
- Slow conversation switching (500ms-2s delay)
- Unnecessary network requests
- Poor UX for frequent conversation switching

**Target**: Instant conversation switching (<100ms) using LRU cache.

---

## Implementation Steps

### Step 1: Implement LRU Cache

**File**: `D:\learning\hey\gnani-rnd\react\src\utils\LRUCache.ts` (NEW)

```typescript
export class LRUCache<K, V> {
  private cache: Map<K, V>;
  private maxSize: number;

  constructor(maxSize: number = 10) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    if (!this.cache.has(key)) return undefined;

    // Move to end (most recently used)
    const value = this.cache.get(key)!;
    this.cache.delete(key);
    this.cache.set(key, value);
    
    return value;
  }

  set(key: K, value: V): void {
    // Remove if exists (to re-add at end)
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    // Add to end
    this.cache.set(key, value);

    // Evict oldest if over capacity
    if (this.cache.size > this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}
```

### Step 2: Add Cache to Conversation Store

**File**: `D:\learning\hey\gnani-rnd\react\src\store\useConversationStore.ts`

```typescript
import { LRUCache } from '../utils/LRUCache';

interface Message {
  _id: string;
  type: 'user' | 'gnani' | 'system';
  message: string;
  timestamp: Date;
}

interface CachedConversation {
  messages: Message[];
  allMessages: Message[];
  currentLeafId: string | null;
  title: string;
  cachedAt: number;
}

// Create cache instance (max 10 conversations)
const conversationCache = new LRUCache<string, CachedConversation>(10);

// Add to store
refreshConversation: async (accessToken) => {
  const { conversationId } = get();
  if (!conversationId) return;

  // Check cache first
  const cached = conversationCache.get(conversationId);
  if (cached) {
    const age = Date.now() - cached.cachedAt;
    
    // Use cache if less than 5 minutes old
    if (age < 5 * 60 * 1000) {
      console.log('[Cache HIT] Loading conversation from cache:', conversationId);
      set({
        messages: cached.messages,
        allMessages: cached.allMessages,
        currentLeafId: cached.currentLeafId,
        title: cached.title,
      });
      return;
    }
  }

  // Cache miss or stale - fetch from backend
  console.log('[Cache MISS] Fetching conversation from backend:', conversationId);
  
  const response = await fetch(
    `http://localhost:3000/api/conversations/${conversationId}`,
    { headers: { 'x-auth-token': accessToken } }
  );

  if (!response.ok) throw new Error('Failed to fetch conversation');

  const data = await response.json();

  // Update cache
  conversationCache.set(conversationId, {
    messages: data.messages,
    allMessages: data.allMessages,
    currentLeafId: data.currentLeafId,
    title: data.title,
    cachedAt: Date.now(),
  });

  set({
    messages: data.messages,
    allMessages: data.allMessages,
    currentLeafId: data.currentLeafId,
    title: data.title,
  });
},

// Add method to invalidate cache
invalidateCache: (conversationId?: string) => {
  if (conversationId) {
    conversationCache.set(conversationId, {
      ...conversationCache.get(conversationId)!,
      cachedAt: 0, // Force refresh on next access
    });
  } else {
    conversationCache.clear();
  }
},
```

### Step 3: Add Prefetching on Hover

**File**: `D:\learning\hey\gnani-rnd\react\src\components\conversation\ConversationListItem.tsx`

```tsx
import { useCallback } from 'react';
import { useConversationStore } from '../../store/useConversationStore';
import { useUserStore } from '../../store/useUserStore';

const ConversationListItem = ({ conversation, isActive, onResume }) => {
  const { refreshConversation } = useConversationStore();
  const { accessToken } = useUserStore();

  // Prefetch on hover
  const handleMouseEnter = useCallback(() => {
    if (!isActive && accessToken) {
      // Prefetch in background (don't await)
      refreshConversation(accessToken).catch(console.error);
    }
  }, [isActive, accessToken, refreshConversation]);

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onClick={() => onResume(conversation.conversationId)}
      className="conversation-item"
    >
      {/* ... existing content ... */}
    </div>
  );
};
```

### Step 4: Add Cache Metrics

**File**: `D:\learning\hey\gnani-rnd\react\src\components\dev\CacheMetrics.tsx` (NEW)

```tsx
import React, { useState, useEffect } from 'react';

const CacheMetrics = () => {
  const [metrics, setMetrics] = useState({
    size: 0,
    hits: 0,
    misses: 0,
    hitRate: 0,
  });

  useEffect(() => {
    // Update metrics every second
    const interval = setInterval(() => {
      // Get metrics from cache (would need to expose this)
      setMetrics({
        size: conversationCache.size(),
        hits: cacheHits,
        misses: cacheMisses,
        hitRate: cacheHits / (cacheHits + cacheMisses) * 100,
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed bottom-4 left-4 bg-black/80 border border-cyan-500/30 rounded p-3 text-xs font-mono">
      <div className="text-cyan-400 mb-2">Cache Metrics</div>
      <div className="text-cyan-500/60">
        <div>Size: {metrics.size}/10</div>
        <div>Hits: {metrics.hits}</div>
        <div>Misses: {metrics.misses}</div>
        <div>Hit Rate: {metrics.hitRate.toFixed(1)}%</div>
      </div>
    </div>
  );
};

export default CacheMetrics;
```

---

## Testing Instructions

1. **Test Cache Hit**:
   - Switch to conversation A
   - Switch to conversation B
   - Switch back to conversation A
   - ✅ Verify instant load (<100ms)
   - ✅ Check console for "[Cache HIT]" log

2. **Test Cache Miss**:
   - Switch to new conversation C
   - ✅ Check console for "[Cache MISS]" log
   - ✅ Verify data fetched from backend

3. **Test LRU Eviction**:
   - Switch between 11 different conversations
   - ✅ Verify oldest conversation evicted
   - ✅ Verify cache size stays at 10

4. **Test Prefetching**:
   - Hover over conversation in list
   - Wait 500ms
   - Click conversation
   - ✅ Verify instant load (prefetched)

5. **Test Cache Invalidation**:
   - Send new message
   - ✅ Verify cache invalidated
   - ✅ Verify fresh data fetched

---

## Success Criteria

- ✅ Conversation switching < 100ms (cached)
- ✅ Cache hit rate > 80% after warmup
- ✅ LRU eviction works correctly
- ✅ Prefetching reduces perceived latency
- ✅ Cache invalidates on updates
- ✅ Memory usage stays bounded

---

## Performance Impact

**Before**:
- Conversation switch: 500-2000ms
- Network requests: Every switch
- User experience: Noticeable lag

**After**:
- Conversation switch: <100ms (cached)
- Network requests: Only on cache miss
- User experience: Instant, smooth

---

## Estimated Time: 6 hours
