# Stage 23: Model Switching

## Overview
Allow users to switch AI models mid-conversation.

## Implementation Steps

### Step 1: Add Model Selector
```tsx
const ModelSelector = ({ currentModel, onChange }) => {
  const models = ['gpt-4', 'gpt-3.5-turbo', 'claude-3', 'llama-2'];
  
  return (
    <select value={currentModel} onChange={(e) => onChange(e.target.value)}>
      {models.map(model => (
        <option key={model} value={model}>{model}</option>
      ))}
    </select>
  );
};
```

### Step 2: Update Conversation Model
```typescript
const switchModel = async (conversationId: string, newModel: string) => {
  await fetch(`/api/conversations/${conversationId}/model`, {
    method: 'PATCH',
    body: JSON.stringify({ model: newModel })
  });
  
  // Add system message
  addMessage({
    type: 'system',
    message: `Switched to ${newModel}`
  });
};
```

### Step 3: Show Model in Messages
```tsx
{message.metadata?.model && (
  <span className="text-xs text-cyan-500/60">
    via {message.metadata.model}
  </span>
)}
```

## Success Criteria
- ✅ Model can be switched anytime
- ✅ System message shows switch
- ✅ New messages use new model
- ✅ Model shown in message metadata

## Estimated Time: 6 hours
