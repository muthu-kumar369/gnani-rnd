# Stage 5: Native Notifications & Error Recovery

## Objective

Add OS-native notifications and automatic error recovery with retry mechanisms.

---

## Context

**Current**: In-app toasts only, no retry  
**Desired**: OS notifications, automatic retry with backoff  
**Constraints**: Must respect OS notification permissions

---

## Implementation Prompt

### Part 1: Native Notifications

**Electron**:

```javascript
// electron/notifications/manager.js
const { Notification } = require('electron');

function showNotification(title, body, options = {}) {
  if (!Notification.isSupported()) {
    logger.warn('Notifications not supported');
    return;
  }
  
  const notification = new Notification({
    title,
    body,
    icon: path.join(__dirname, '../assets/icon.png'),
    ...options
  });
  
  notification.on('click', () => {
    mainWindow.show();
    mainWindow.focus();
  });
  
  notification.show();
}

// Examples:
// - Tool completed: "Search completed" / "Found 5 results"
// - Error: "Connection lost" / "Retrying..."
// - Long response: "Gnani is still thinking..."
```

**IPC Integration**:

```typescript
// Frontend requests notification
window.gnani.notifications.show({
  title: 'Search Completed',
  body: 'Found 5 results for "weather Paris"'
});
```

---

### Part 2: Error Recovery

**Automatic Retry**:

```typescript
// src/utils/retry.ts
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      
      const delay = baseDelay * Math.pow(2, i); // Exponential backoff
      logger.info(`Retry ${i + 1}/${maxRetries} after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Max retries exceeded');
}
```

**Usage**:

```typescript
// In gRPC client
const sendMessage = async (message: string) => {
  return retryWithBackoff(async () => {
    return await grpcClient.sendMessage(message);
  }, 3, 1000);
};
```

**Manual Retry Button**:

```tsx
// src/components/common/ErrorBoundary.tsx
const ErrorBoundary: React.FC = ({ error, retry }) => {
  return (
    <div className="error-container">
      <p>Something went wrong: {error.message}</p>
      <button onClick={retry}>Retry</button>
    </div>
  );
};
```

---

## Testing

- [ ] Notifications appear on all platforms
- [ ] Retry succeeds after transient failure
- [ ] Manual retry button works
- [ ] Exponential backoff delays correctly

---

## Success Criteria

- [ ] OS notifications for key events
- [ ] Automatic retry for network errors
- [ ] Manual retry for user-triggered errors
- [ ] No infinite retry loops
