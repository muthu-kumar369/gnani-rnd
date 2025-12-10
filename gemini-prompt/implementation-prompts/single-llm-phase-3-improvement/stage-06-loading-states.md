# Stage 6: Improved Loading States

## Overview
Add skeleton loaders, typing indicators, and smooth loading transitions.

## Implementation Steps

### Step 1: Create Skeleton Loader Component

```tsx
// SkeletonLoader.tsx
const MessageSkeleton = () => (
  <div className="animate-pulse space-y-2">
    <div className="h-4 bg-cyan-500/20 rounded w-3/4"></div>
    <div className="h-4 bg-cyan-500/20 rounded w-1/2"></div>
  </div>
);
```

### Step 2: Add Typing Indicator

```tsx
// TypingIndicator.tsx
const TypingIndicator = () => (
  <div className="flex gap-1">
    <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
    <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
    <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
  </div>
);
```

### Step 3: Add Progress Bar for Streaming

```tsx
const StreamingProgress = ({ progress }) => (
  <div className="w-full h-1 bg-cyan-500/20 rounded-full overflow-hidden">
    <div 
      className="h-full bg-cyan-500 transition-all duration-300"
      style={{ width: `${progress}%` }}
    />
  </div>
);
```

## Success Criteria
- ✅ Skeleton loaders show while loading
- ✅ Typing indicator appears during streaming
- ✅ Smooth transitions between states
- ✅ No layout shift

## Estimated Time: 8 hours
