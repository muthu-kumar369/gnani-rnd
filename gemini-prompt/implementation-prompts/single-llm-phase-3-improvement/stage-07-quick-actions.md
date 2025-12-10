# Stage 7: Quick Action Buttons

## Overview
Add copy, share, and continue buttons to messages for quick actions.

## Implementation Steps

### Step 1: Add Action Buttons to Messages

```tsx
// MessageBubble.tsx
const MessageActions = ({ message }) => (
  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
    <button onClick={() => copyToClipboard(message.message)} title="Copy">
      <Copy size={14} />
    </button>
    <button onClick={() => shareMessage(message)} title="Share">
      <Share2 size={14} />
    </button>
    {message.type === 'gnani' && (
      <button onClick={() => continueConversation(message)} title="Continue">
        <CornerDownRight size={14} />
      </button>
    )}
  </div>
);
```

### Step 2: Implement Copy Function

```typescript
const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    showToast('Copied to clipboard');
  } catch (error) {
    console.error('Failed to copy:', error);
  }
};
```

### Step 3: Implement Share Function

```typescript
const shareMessage = async (message: Message) => {
  const shareData = {
    title: 'Gnani Conversation',
    text: message.message,
  };
  
  if (navigator.share) {
    await navigator.share(shareData);
  } else {
    // Fallback: copy link
    copyToClipboard(window.location.href);
  }
};
```

## Success Criteria
- ✅ Actions appear on hover
- ✅ Copy works reliably
- ✅ Share uses native share API when available
- ✅ Continue adds follow-up prompt

## Estimated Time: 4 hours
