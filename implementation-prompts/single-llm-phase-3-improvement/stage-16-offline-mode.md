# Stage 16: Offline Mode & Queue

## Overview
Implement offline message queue that syncs when connection restored.

## Implementation Steps

### Step 1: Detect Offline Status
```typescript
const [isOnline, setIsOnline] = useState(navigator.onLine);

useEffect(() => {
  const handleOnline = () => setIsOnline(true);
  const handleOffline = () => setIsOnline(false);
  
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}, []);
```

### Step 2: Queue Messages Offline
```typescript
const messageQueue = useRef<Message[]>([]);

const sendMessage = async (text: string) => {
  if (!isOnline) {
    messageQueue.current.push({ text, timestamp: Date.now() });
    addMessage({ type: 'user', message: text, status: 'queued' });
    return;
  }
  
  // Normal send logic
};
```

### Step 3: Sync When Online
```typescript
useEffect(() => {
  if (isOnline && messageQueue.current.length > 0) {
    syncQueuedMessages();
  }
}, [isOnline]);

const syncQueuedMessages = async () => {
  for (const msg of messageQueue.current) {
    await sendMessage(msg.text);
  }
  messageQueue.current = [];
};
```

## Success Criteria
- ✅ Messages queue when offline
- ✅ Auto-sync when back online
- ✅ Visual indicator for queued messages

## Estimated Time: 8 hours
