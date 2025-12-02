# Stage 6: Conversation Threading & Regenerate

## Objective

Implement conversation branching with regenerate and edit message features.

---

## Context

**Current**: Linear conversation history  
**Desired**: Tree structure with branches, regenerate, edit  
**Constraints**: Must preserve existing conversations, must be intuitive

---

## Implementation Prompt

### Part 1: Database Schema

**Update Conversation Entity**:

```typescript
// src/modules/memory/entities/conversation.entity.ts
interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  parentId?: string; // NEW: Parent message ID
  children?: string[]; // NEW: Child message IDs
  branchIndex?: number; // NEW: Which branch (0, 1, 2...)
}

interface Conversation {
  id: string;
  userId: string;
  title: string;
  messages: Message[];
  messageTree: MessageTree; // NEW: Tree structure
  activeBranch: string[]; // NEW: Current active path
}

interface MessageTree {
  root: string; // Root message ID
  nodes: Map<string, MessageNode>;
}

interface MessageNode {
  messageId: string;
  parentId?: string;
  children: string[];
}
```

---

### Part 2: Regenerate Feature

**Backend**:

```typescript
// src/modules/conversation/conversation.service.ts
async regenerateResponse(
  conversationId: string,
  messageId: string,
  userId: string
): Promise<Message> {
  // 1. Get conversation
  const conversation = await this.getConversation(conversationId, userId);
  
  // 2. Find message to regenerate
  const message = conversation.messages.find(m => m.id === messageId);
  if (!message || message.role !== 'assistant') {
    throw new Error('Can only regenerate assistant messages');
  }
  
  // 3. Get parent (user message)
  const parent = conversation.messages.find(m => m.id === message.parentId);
  
  // 4. Generate new response
  const newResponse = await llmService.generate(parent.content, {
    temperature: 0.8 // Slightly higher for variation
  });
  
  // 5. Create new message as sibling
  const newMessage: Message = {
    id: uuidv4(),
    role: 'assistant',
    content: newResponse,
    timestamp: new Date(),
    parentId: message.parentId,
    branchIndex: (message.branchIndex || 0) + 1
  };
  
  // 6. Update parent's children
  parent.children = parent.children || [];
  parent.children.push(newMessage.id);
  
  // 7. Save and return
  conversation.messages.push(newMessage);
  await conversation.save();
  
  return newMessage;
}
```

**Frontend**:

```tsx
// src/components/terminal/MessageBubble.tsx
const MessageBubble: React.FC<{ message: Message }> = ({ message }) => {
  const { regenerate } = useConversation();
  
  return (
    <div className="message-bubble">
      <div className="message-content">{message.content}</div>
      
      {message.role === 'assistant' && (
        <div className="message-actions">
          <button onClick={() => regenerate(message.id)}>
            <RefreshCw size={14} /> Regenerate
          </button>
          
          {message.children && message.children.length > 1 && (
            <div className="branch-nav">
              <button>← Previous</button>
              <span>{message.branchIndex + 1} / {message.children.length}</span>
              <button>Next →</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
```

---

### Part 3: Edit Message

**Backend**:

```typescript
async editMessage(
  conversationId: string,
  messageId: string,
  newContent: string,
  userId: string
): Promise<{ newUserMessage: Message; newAssistantMessage: Message }> {
  // 1. Create new user message as sibling
  const newUserMessage = {
    id: uuidv4(),
    role: 'user',
    content: newContent,
    timestamp: new Date(),
    parentId: originalMessage.parentId,
    branchIndex: (originalMessage.branchIndex || 0) + 1
  };
  
  // 2. Generate new assistant response
  const newAssistantMessage = await this.generateResponse(newUserMessage);
  
  // 3. Update tree structure
  // ...
  
  return { newUserMessage, newAssistantMessage };
}
```

---

## Testing

- [ ] Regenerate creates new branch
- [ ] Edit message creates new branch
- [ ] Branch navigation works
- [ ] Tree structure is preserved

---

## Success Criteria

- [ ] Users can regenerate responses
- [ ] Users can edit messages
- [ ] Branch navigation is intuitive
- [ ] No data loss when branching
