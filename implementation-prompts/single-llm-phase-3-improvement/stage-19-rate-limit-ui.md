# Stage 19: Rate Limit UI

## Overview
Display rate limit status and countdown to reset.

## Implementation Steps

### Step 1: Parse Rate Limit Headers
```typescript
const parseRateLimitHeaders = (headers: Headers) => {
  return {
    limit: parseInt(headers.get('X-RateLimit-Limit') || '0'),
    remaining: parseInt(headers.get('X-RateLimit-Remaining') || '0'),
    reset: parseInt(headers.get('X-RateLimit-Reset') || '0')
  };
};
```

### Step 2: Create Rate Limit Store
```typescript
const useRateLimitStore = create((set) => ({
  limit: 0,
  remaining: 0,
  resetAt: 0,
  updateRateLimit: (headers) => {
    const rateLimit = parseRateLimitHeaders(headers);
    set(rateLimit);
  }
}));
```

### Step 3: Add Rate Limit Indicator
```tsx
const RateLimitIndicator = () => {
  const { remaining, limit, resetAt } = useRateLimitStore();
  const timeUntilReset = Math.max(0, resetAt - Date.now() / 1000);
  
  if (remaining > limit * 0.2) return null; // Only show when low
  
  return (
    <div className="text-xs text-yellow-500">
      {remaining}/{limit} requests remaining
      {remaining === 0 && ` (resets in ${Math.ceil(timeUntilReset)}s)`}
    </div>
  );
};
```

## Success Criteria
- ✅ Rate limit status visible
- ✅ Countdown to reset shown
- ✅ Warning when approaching limit

## Estimated Time: 4 hours
