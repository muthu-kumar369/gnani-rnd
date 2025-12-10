# Stage 13: Redis Caching Layer

## Overview
Implement Redis caching for conversations, user data, and LLM responses.

## Implementation Steps

### Step 1: Cache Conversation List
```typescript
async listConversations(userId: string) {
  const cacheKey = `conversations:${userId}`;
  const cached = await redisClient.get(cacheKey);
  
  if (cached) return JSON.parse(cached);
  
  const conversations = await Conversation.find({ userId });
  await redisClient.setex(cacheKey, 300, JSON.stringify(conversations)); // 5min TTL
  
  return conversations;
}
```

### Step 2: Cache User Preferences
```typescript
async getUserPreferences(userId: string) {
  const cacheKey = `user:${userId}:preferences`;
  const cached = await redisClient.get(cacheKey);
  
  if (cached) return JSON.parse(cached);
  
  const prefs = await User.findById(userId).select('settings');
  await redisClient.setex(cacheKey, 3600, JSON.stringify(prefs));
  
  return prefs;
}
```

### Step 3: Invalidate Cache on Updates
```typescript
async updateConversation(id: string, updates: any) {
  const conversation = await Conversation.findByIdAndUpdate(id, updates);
  
  // Invalidate cache
  await redisClient.del(`conversations:${conversation.userId}`);
  await redisClient.del(`conversation:${id}`);
  
  return conversation;
}
```

## Success Criteria
- ✅ Cache hit rate > 70%
- ✅ Response time improved by 50%
- ✅ Cache invalidation works correctly

## Estimated Time: 6 hours
