# Stage 1.4: Message Action Buttons UI

## Summary
Expose existing backend message manipulation features (regenerate, edit, delete) through intuitive UI controls. Add a hover menu to each message bubble with action buttons, plus additional actions like copy message and copy code blocks.

## Goals
- Add hover menu to message bubbles with action buttons
- Implement copy message functionality
- Implement copy code block functionality
- Wire up existing regenerate message backend
- Wire up existing edit message backend
- Add delete message confirmation dialog
- Ensure actions work with conversation tree structure
- Maintain Jarvis HUD theme consistency

## Files to Modify / Create

### Frontend
- `/src/components/Terminal/MessageBubble.tsx` → Add action buttons and hover menu
- `/src/components/Terminal/MessageActions.tsx` → **[NEW]** Action buttons component
- `/src/components/Terminal/CodeBlock.tsx` → **[NEW]** Code block with copy button
- `/src/components/Terminal/EditMessageModal.tsx` → **[NEW]** Modal for editing messages
- `/src/components/Terminal/DeleteConfirmDialog.tsx` → **[NEW]** Confirmation dialog
- `/src/stores/gnaniStore.ts` → Add message action handlers
- `/src/hooks/useMessageActions.ts` → **[NEW]** Custom hook for message actions
- `/src/styles/messageActions.css` → **[NEW]** Styles for action buttons

### Backend (Minor Updates)
- `/src/modules/conversation/conversation.controller.ts` → Ensure endpoints are properly exposed
- `/src/modules/conversation/conversation.routes.ts` → Verify routes are accessible

## Detailed Implementation Instructions

### Frontend Implementation

#### Step 1: Create MessageActions Component
Create `/src/components/Terminal/MessageActions.tsx`:

```typescript
interface MessageActionsProps {
  message: Message;
  onCopy: () => void;
  onRegenerate: () => void;
  onEdit: () => void;
  onDelete: () => void;
  isVisible: boolean;
}

const MessageActions: React.FC<MessageActionsProps> = ({
  message,
  onCopy,
  onRegenerate,
  onEdit,
  onDelete,
  isVisible
}) => {
  return (
    <div className={`message-actions ${isVisible ? 'visible' : ''}`}>
      <button onClick={onCopy} title="Copy message">
        <CopyIcon />
      </button>
      
      {message.role === 'assistant' && (
        <button onClick={onRegenerate} title="Regenerate response">
          <RefreshIcon />
        </button>
      )}
      
      {message.role === 'user' && (
        <button onClick={onEdit} title="Edit message">
          <EditIcon />
        </button>
      )}
      
      <button onClick={onDelete} title="Delete message">
        <TrashIcon />
      </button>
    </div>
  );
};
```

#### Step 2: Update MessageBubble Component
In `/src/components/Terminal/MessageBubble.tsx`:

1. Add hover state:
   ```typescript
   const [isHovered, setIsHovered] = useState(false);
   ```

2. Add action handlers:
   ```typescript
   const handleCopy = () => {
     navigator.clipboard.writeText(message.content);
     toast.success('Message copied to clipboard');
   };
   
   const handleRegenerate = async () => {
     await regenerateMessage(conversationId, message.id);
   };
   
   const handleEdit = () => {
     setEditModalOpen(true);
   };
   
   const handleDelete = () => {
     setDeleteDialogOpen(true);
   };
   ```

3. Add hover handlers to message container:
   ```typescript
   <div 
     className="message-bubble"
     onMouseEnter={() => setIsHovered(true)}
     onMouseLeave={() => setIsHovered(false)}
   >
     {/* Message content */}
     
     <MessageActions
       message={message}
       onCopy={handleCopy}
       onRegenerate={handleRegenerate}
       onEdit={handleEdit}
       onDelete={handleDelete}
       isVisible={isHovered}
     />
   </div>
   ```

#### Step 3: Create CodeBlock Component with Copy Button
Create `/src/components/Terminal/CodeBlock.tsx`:

```typescript
interface CodeBlockProps {
  code: string;
  language: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ code, language }) => {
  const [copied, setCopied] = useState(false);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <div className="code-block">
      <div className="code-header">
        <span className="language-label">{language}</span>
        <button onClick={handleCopy} className="copy-code-btn">
          {copied ? <CheckIcon /> : <CopyIcon />}
          {copied ? 'Copied!' : 'Copy code'}
        </button>
      </div>
      <SyntaxHighlighter language={language} style={atomOneDark}>
        {code}
      </SyntaxHighlighter>
    </div>
  );
};
```

#### Step 4: Integrate CodeBlock into Message Rendering
Update message content rendering to detect code blocks:

```typescript
// Parse markdown and replace code blocks with CodeBlock component
const renderMessageContent = (content: string) => {
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  
  // Split content by code blocks
  // Render regular markdown for text
  // Render CodeBlock component for code sections
};
```

#### Step 5: Create Edit Message Modal
Create `/src/components/Terminal/EditMessageModal.tsx`:

```typescript
interface EditMessageModalProps {
  message: Message;
  isOpen: boolean;
  onClose: () => void;
  onSave: (newContent: string) => void;
}

const EditMessageModal: React.FC<EditMessageModalProps> = ({
  message,
  isOpen,
  onClose,
  onSave
}) => {
  const [editedContent, setEditedContent] = useState(message.content);
  
  const handleSave = async () => {
    await onSave(editedContent);
    onClose();
  };
  
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2>Edit Message</h2>
      <textarea
        value={editedContent}
        onChange={(e) => setEditedContent(e.target.value)}
        rows={10}
      />
      <div className="modal-actions">
        <button onClick={onClose}>Cancel</button>
        <button onClick={handleSave}>Save & Regenerate</button>
      </div>
    </Modal>
  );
};
```

#### Step 6: Create Delete Confirmation Dialog
Create `/src/components/Terminal/DeleteConfirmDialog.tsx`:

```typescript
interface DeleteConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  messagePreview: string;
}

const DeleteConfirmDialog: React.FC<DeleteConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  messagePreview
}) => {
  return (
    <Dialog isOpen={isOpen} onClose={onClose}>
      <h2>Delete Message?</h2>
      <p>This will delete the message and all subsequent messages in this branch.</p>
      <div className="message-preview">
        {messagePreview.substring(0, 100)}...
      </div>
      <div className="dialog-actions">
        <button onClick={onClose}>Cancel</button>
        <button onClick={onConfirm} className="danger">Delete</button>
      </div>
    </Dialog>
  );
};
```

#### Step 7: Create Message Actions Hook
Create `/src/hooks/useMessageActions.ts`:

```typescript
export const useMessageActions = (conversationId: string) => {
  const regenerateMessage = async (messageId: string) => {
    try {
      // Call backend API: POST /api/conversations/:id/messages/:messageId/regenerate
      const response = await api.post(
        `/conversations/${conversationId}/messages/${messageId}/regenerate`
      );
      
      // Update conversation store with new message
      conversationStore.updateMessage(response.data);
      
      toast.success('Response regenerated');
    } catch (error) {
      toast.error('Failed to regenerate message');
    }
  };
  
  const editMessage = async (messageId: string, newContent: string) => {
    try {
      // Call backend API: PUT /api/conversations/:id/messages/:messageId
      const response = await api.put(
        `/conversations/${conversationId}/messages/${messageId}`,
        { content: newContent }
      );
      
      // Update conversation store
      conversationStore.updateMessage(response.data);
      
      toast.success('Message edited');
    } catch (error) {
      toast.error('Failed to edit message');
    }
  };
  
  const deleteMessage = async (messageId: string) => {
    try {
      // Call backend API: DELETE /api/conversations/:id/messages/:messageId
      await api.delete(
        `/conversations/${conversationId}/messages/${messageId}`
      );
      
      // Update conversation store
      conversationStore.removeMessage(messageId);
      
      toast.success('Message deleted');
    } catch (error) {
      toast.error('Failed to delete message');
    }
  };
  
  return { regenerateMessage, editMessage, deleteMessage };
};
```

#### Step 8: Style Message Actions
Create `/src/styles/messageActions.css`:

```css
.message-actions {
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s ease;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  padding: 4px;
}

.message-actions.visible {
  opacity: 1;
}

.message-actions button {
  background: transparent;
  border: none;
  color: #00ffff; /* Jarvis cyan */
  padding: 6px;
  cursor: pointer;
  border-radius: 4px;
  transition: background 0.2s ease;
}

.message-actions button:hover {
  background: rgba(0, 255, 255, 0.2);
}

.code-block {
  position: relative;
  margin: 12px 0;
  border-radius: 8px;
  overflow: hidden;
  background: #1e1e1e;
}

.code-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #2d2d2d;
  border-bottom: 1px solid #404040;
}

.language-label {
  font-size: 12px;
  color: #888;
  text-transform: uppercase;
}

.copy-code-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  background: transparent;
  border: 1px solid #00ffff;
  color: #00ffff;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s ease;
}

.copy-code-btn:hover {
  background: rgba(0, 255, 255, 0.1);
}
```

### Backend Verification

#### Step 9: Verify Backend Endpoints
Ensure these endpoints exist and are working:

1. **POST /api/conversations/:id/messages/:messageId/regenerate**
   - Regenerates assistant response
   - Returns new message

2. **PUT /api/conversations/:id/messages/:messageId**
   - Edits user message
   - Triggers regeneration of subsequent messages
   - Returns updated conversation branch

3. **DELETE /api/conversations/:id/messages/:messageId**
   - Deletes message and all children in tree
   - Returns updated conversation

If any endpoints are missing, implement them in conversation controller.

### User Experience Flow

#### Regenerate Flow:
1. User hovers over assistant message
2. Clicks regenerate button
3. Loading indicator appears
4. New response streams in
5. Old response is preserved in conversation tree (can switch branches)

#### Edit Flow:
1. User hovers over their message
2. Clicks edit button
3. Modal opens with message content
4. User edits text
5. Clicks "Save & Regenerate"
6. Message updates and assistant response regenerates

#### Delete Flow:
1. User hovers over message
2. Clicks delete button
3. Confirmation dialog appears
4. User confirms
5. Message and all subsequent messages in branch are deleted

#### Copy Flow:
1. User hovers over message
2. Clicks copy button
3. Toast notification: "Message copied to clipboard"
4. Content is in clipboard

## Acceptance Criteria

- [ ] Action buttons appear on message hover
- [ ] Action buttons fade in/out smoothly
- [ ] Copy message button copies full message text to clipboard
- [ ] Regenerate button triggers new assistant response
- [ ] Edit button opens modal with message content
- [ ] Editing message triggers response regeneration
- [ ] Delete button shows confirmation dialog
- [ ] Deleting message removes it and all children from tree
- [ ] Code blocks have copy button in header
- [ ] Copy code button copies code without syntax highlighting
- [ ] Copy code button shows "Copied!" feedback for 2 seconds
- [ ] All actions show loading states during API calls
- [ ] Error messages are displayed if actions fail
- [ ] Actions respect conversation tree structure
- [ ] UI matches Jarvis HUD theme (cyan accents, dark background)
- [ ] Action buttons are accessible via keyboard
- [ ] Mobile: Actions are accessible via long-press or tap
