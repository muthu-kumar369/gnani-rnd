# Stage 20: Usage Analytics

## Overview
Track token usage, costs, and conversation statistics.

## Implementation Steps

### Step 1: Add Analytics Schema
```typescript
// analytics.model.ts
const analyticsSchema = new Schema({
  userId: { type: String, required: true },
  conversationId: String,
  event: String, // 'message_sent', 'tokens_used', etc.
  metadata: {
    tokens: Number,
    cost: Number,
    model: String,
    duration: Number
  },
  timestamp: { type: Date, default: Date.now }
});
```

### Step 2: Track Token Usage
```typescript
// After LLM response
await Analytics.create({
  userId,
  conversationId,
  event: 'tokens_used',
  metadata: {
    tokens: response.usage.total_tokens,
    cost: calculateCost(response.usage.total_tokens, model),
    model,
    duration: Date.now() - startTime
  }
});
```

### Step 3: Create Analytics Dashboard
```tsx
const AnalyticsDashboard = () => {
  const [stats, setStats] = useState(null);
  
  useEffect(() => {
    fetchAnalytics().then(setStats);
  }, []);
  
  return (
    <div className="grid grid-cols-3 gap-4">
      <StatCard title="Total Tokens" value={stats?.totalTokens} />
      <StatCard title="Total Cost" value={`$${stats?.totalCost}`} />
      <StatCard title="Conversations" value={stats?.conversationCount} />
    </div>
  );
};
```

## Success Criteria
- ✅ Token usage tracked accurately
- ✅ Cost calculated correctly
- ✅ Dashboard shows real-time stats

## Estimated Time: 8 hours
