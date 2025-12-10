# Stage 12: Database Optimization

## Overview
Optimize MongoDB queries with indexes, aggregation pipelines, and query optimization.

## Implementation Steps

### Step 1: Add Compound Indexes
```javascript
// conversation.model.ts
conversationSchema.index({ userId: 1, updatedAt: -1 }); // List conversations
conversationSchema.index({ userId: 1, title: 'text' }); // Search
conversationSchema.index({ userId: 1, pinned: -1, updatedAt: -1 }); // Pinned first
```

### Step 2: Optimize List Query with Aggregation
```typescript
async listConversations(userId: string, options: PaginationOptions) {
  return await Conversation.aggregate([
    { $match: { userId } },
    { $sort: { pinned: -1, updatedAt: -1 } },
    { $skip: (options.page - 1) * options.limit },
    { $limit: options.limit },
    { $project: {
      _id: 1,
      title: 1,
      updatedAt: 1,
      messageCount: { $size: '$messages' },
      preview: { $arrayElemAt: ['$messages.message', -1] }
    }}
  ]);
}
```

### Step 3: Add Query Explain for Analysis
```typescript
const explain = await Conversation.find({ userId }).explain('executionStats');
console.log('Query execution time:', explain.executionTimeMillis);
```

## Success Criteria
- ✅ Query time < 50ms for list
- ✅ All queries use indexes
- ✅ No collection scans

## Estimated Time: 8 hours
