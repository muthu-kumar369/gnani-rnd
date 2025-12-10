# Stage 18: Timeout Handling

## Overview
Add visual countdown timers for long operations and allow users to extend timeouts.

## Implementation Steps

### Step 1: Create Timeout Hook
```typescript
const useTimeout = (duration: number, onTimeout: () => void) => {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (!isActive) return;
    
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          onTimeout();
          setIsActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive]);

  return { timeLeft, start: () => setIsActive(true), extend: (seconds: number) => setTimeLeft(prev => prev + seconds) };
};
```

### Step 2: Add Timeout UI
```tsx
const TimeoutIndicator = ({ timeLeft, onExtend }) => (
  <div className="flex items-center gap-3 text-sm text-cyan-500">
    <Clock size={16} />
    <span>{timeLeft}s remaining</span>
    <button onClick={() => onExtend(30)} className="px-2 py-1 bg-cyan-500/20 rounded">
      +30s
    </button>
  </div>
);
```

## Success Criteria
- ✅ Countdown shows during long operations
- ✅ Users can extend timeout
- ✅ Clear visual feedback

## Estimated Time: 4 hours
