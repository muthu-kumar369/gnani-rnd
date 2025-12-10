# Stage 1: Inline Message Editing

## Overview
Implement inline message editing functionality to allow users to edit their messages directly in the conversation, similar to ChatGPT's editing feature.

## Current State Analysis

**Location**: `D:\learning\hey\gnani-rnd\react\src\components\terminal\MessageBubble.tsx`

**Current Behavior**:
- Messages are read-only once sent
- No edit functionality visible
- Users must retype entire message to correct mistakes

**Gap**: ChatGPT allows clicking any user message to edit it, which then regenerates the conversation from that point.

---

## Implementation Steps

### Step 1: Add Edit State to MessageBubble

**File**: `D:\learning\hey\gnani-rnd\react\src\components\terminal\MessageBubble.tsx`

```typescript
import { useState, useRef, useEffect } from 'react';
import { Edit2, Check, X } from 'lucide-react';

// Add to component state
const [isEditing, setIsEditing] = useState(false);
const [editedText, setEditedText] = useState(message.message);
const textareaRef = useRef<HTMLTextAreaElement>(null);

// Auto-focus textarea when editing
useEffect(() => {
  if (isEditing && textareaRef.current) {
    textareaRef.current.focus();
    textareaRef.current.setSelectionRange(editedText.length, editedText.length);
  }
}, [isEditing]);
```

### Step 2: Add Edit Button to User Messages

```tsx
{message.type === 'user' && !isEditing && (
  <button
    onClick={() => setIsEditing(true)}
    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-cyan-500/20 rounded"
    title="Edit message"
  >
    <Edit2 size={14} className="text-cyan-400" />
  </button>
)}
```

### Step 3: Implement Edit Mode UI

```tsx
{isEditing ? (
  <div className="space-y-2">
    <textarea
      ref={textareaRef}
      value={editedText}
      onChange={(e) => setEditedText(e.target.value)}
      className="w-full bg-black/50 border border-cyan-500 rounded p-3 text-sm text-cyan-100 focus:outline-none focus:border-cyan-400 resize-none"
      rows={Math.max(3, editedText.split('\n').length)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && e.ctrlKey) {
          handleSaveEdit();
        } else if (e.key === 'Escape') {
          handleCancelEdit();
        }
      }}
    />
    <div className="flex gap-2 justify-end">
      <button
        onClick={handleCancelEdit}
        className="px-3 py-1.5 text-xs bg-gray-700 hover:bg-gray-600 rounded flex items-center gap-1"
      >
        <X size={12} />
        Cancel
      </button>
      <button
        onClick={handleSaveEdit}
        className="px-3 py-1.5 text-xs bg-cyan-500 hover:bg-cyan-400 text-black rounded flex items-center gap-1"
      >
        <Check size={12} />
        Save & Regenerate
      </button>
    </div>
  </div>
) : (
  <ReactMarkdown>{message.message}</ReactMarkdown>
)}
```

### Step 4: Add Edit Handlers

```typescript
const handleSaveEdit = async () => {
  if (editedText.trim() === message.message.trim()) {
    setIsEditing(false);
    return;
  }

  try {
    // Call edit message API
    await editMessage(message._id, editedText);
    setIsEditing(false);
  } catch (error) {
    console.error('Failed to edit message:', error);
    // Show error toast
  }
};

const handleCancelEdit = () => {
  setEditedText(message.message);
  setIsEditing(false);
};
```

### Step 5: Add Edit Action to useConversationStore

**File**: `D:\learning\hey\gnani-rnd\react\src\store\useConversationStore.ts`

```typescript
editMessage: async (messageId: string, newContent: string, accessToken: string) => {
  const { conversationId } = get();
  if (!conversationId) return;

  try {
    const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}/edit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-auth-token': accessToken
      },
      body: JSON.stringify({
        messageId,
        content: newContent,
        autoRegenerate: true // Automatically regenerate response
      })
    });

    if (!response.ok) throw new Error('Failed to edit message');

    const data = await response.json();

    // Update local state with edited message and new response
    set(state => ({
      messages: data.messages,
      allMessages: data.allMessages,
      currentLeafId: data.currentLeafId
    }));

    return data;
  } catch (error) {
    console.error('Error editing message:', error);
    throw error;
  }
},
```

### Step 6: Add Visual Indicator for Edited Messages

```tsx
{message.metadata?.edited && (
  <span className="text-xs text-cyan-500/60 ml-2">(edited)</span>
)}
```

---

## Backend Changes Required

**File**: `D:\learning\hey\gnani-rnd-backend\src\modules\conversation\conversation.service.ts`

The backend already has `editMessage` method (lines 136-157 in conversation.controller.ts). Verify it:
- ✅ Marks message as edited
- ✅ Auto-regenerates response if `autoRegenerate: true`
- ✅ Updates conversation tree structure

---

## Testing Instructions

### Manual Testing

1. **Start the application**
   ```bash
   cd D:\learning\hey\gnani-rnd-backend && npm run dev
   cd D:\learning\hey\gnani-rnd && npm run dev
   ```

2. **Test edit flow**:
   - Send a message: "What is 2+2?"
   - Wait for response
   - Hover over user message → Click edit button
   - Change to: "What is 3+3?"
   - Click "Save & Regenerate"
   - ✅ Verify message updates
   - ✅ Verify new response generates
   - ✅ Verify "(edited)" label appears

3. **Test keyboard shortcuts**:
   - Enter edit mode
   - Press `Ctrl+Enter` → Should save
   - Press `Escape` → Should cancel

4. **Test edge cases**:
   - Edit message to empty string → Should show error
   - Edit message while streaming → Should cancel stream first
   - Edit message in middle of conversation → Should regenerate from that point

### Automated Testing

**File**: `D:\learning\hey\gnani-rnd\react\src\tests\components\MessageBubble.test.tsx` (NEW)

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MessageBubble from '../../components/terminal/MessageBubble';

describe('MessageBubble - Inline Editing', () => {
  it('shows edit button on hover for user messages', () => {
    const message = { type: 'user', message: 'Test message', _id: '123' };
    render(<MessageBubble message={message} />);
    
    const bubble = screen.getByText('Test message').closest('div');
    fireEvent.mouseEnter(bubble!);
    
    expect(screen.getByTitle('Edit message')).toBeInTheDocument();
  });

  it('enters edit mode when edit button clicked', () => {
    const message = { type: 'user', message: 'Test message', _id: '123' };
    render(<MessageBubble message={message} />);
    
    fireEvent.click(screen.getByTitle('Edit message'));
    
    expect(screen.getByRole('textbox')).toHaveValue('Test message');
  });

  it('saves edited message on Ctrl+Enter', async () => {
    const editMessage = jest.fn();
    const message = { type: 'user', message: 'Original', _id: '123' };
    
    render(<MessageBubble message={message} editMessage={editMessage} />);
    
    fireEvent.click(screen.getByTitle('Edit message'));
    const textarea = screen.getByRole('textbox');
    
    fireEvent.change(textarea, { target: { value: 'Edited' } });
    fireEvent.keyDown(textarea, { key: 'Enter', ctrlKey: true });
    
    await waitFor(() => {
      expect(editMessage).toHaveBeenCalledWith('123', 'Edited');
    });
  });
});
```

---

## Success Criteria

- ✅ Edit button appears on hover for user messages
- ✅ Clicking edit button enters edit mode
- ✅ Textarea auto-focuses with cursor at end
- ✅ `Ctrl+Enter` saves and regenerates
- ✅ `Escape` cancels edit
- ✅ Edited messages show "(edited)" label
- ✅ Conversation regenerates from edited point
- ✅ Edit works for messages in middle of conversation
- ✅ UI is smooth and responsive (< 100ms to enter edit mode)

---

## UI/UX Considerations

1. **Visual Feedback**:
   - Smooth transition to edit mode (200ms fade)
   - Clear save/cancel buttons
   - Disabled state while saving

2. **Keyboard Shortcuts**:
   - `Ctrl+Enter`: Save
   - `Escape`: Cancel
   - `Tab`: Focus next button

3. **Error Handling**:
   - Show toast on save failure
   - Preserve edited text on error
   - Allow retry

4. **Accessibility**:
   - Add ARIA labels to buttons
   - Announce edit mode to screen readers
   - Keyboard navigation support

---

## Performance Considerations

- Debounce auto-save (if implemented)
- Cancel pending requests on edit
- Optimistic UI update for instant feedback

---

## Future Enhancements

- Auto-save drafts to localStorage
- Show edit history
- Allow editing assistant messages (with disclaimer)
- Batch edit multiple messages

---

## Dependencies

- ✅ Backend `editMessage` endpoint (already exists)
- ✅ `useConversationStore` (already exists)
- ⚠️ May need to add `editMessage` action to store

---

## Estimated Time

- **Implementation**: 4 hours
- **Testing**: 2 hours
- **Total**: 6 hours

---

## Related Stages

- **Stage 2**: Regeneration UX (uses similar patterns)
- **Stage 3**: Message branching (shows edit history)
