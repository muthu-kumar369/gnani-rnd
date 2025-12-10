# Stage 10: Component Optimization

## Overview
Optimize React components to reduce re-renders and improve performance.

## Implementation Steps

### Step 1: Memoize Expensive Components
```tsx
import { memo } from 'react';

const MessageBubble = memo(({ message, isLatest }) => {
  // Component logic
}, (prevProps, nextProps) => {
  return prevProps.message._id === nextProps.message._id &&
         prevProps.isLatest === nextProps.isLatest;
});
```

### Step 2: Use useCallback for Event Handlers
```tsx
const handleSend = useCallback((text: string) => {
  sendMessage(text, accessToken);
}, [accessToken]); // Only recreate if accessToken changes
```

### Step 3: Use useMemo for Expensive Calculations
```tsx
const sortedMessages = useMemo(() => {
  return messages.sort((a, b) => a.timestamp - b.timestamp);
}, [messages]);
```

### Step 4: Split Large Components
```tsx
// Before: 722-line GnaniCore.tsx
// After: Split into smaller components
- GnaniCore.tsx (orchestration)
- AudioManager.tsx (audio logic)
- StateManager.tsx (state machine)
- UIShell.tsx (layout)
```

## Success Criteria
- ✅ Reduced re-renders by 50%
- ✅ Improved React DevTools profiler scores
- ✅ No unnecessary component updates

## Estimated Time: 10 hours
