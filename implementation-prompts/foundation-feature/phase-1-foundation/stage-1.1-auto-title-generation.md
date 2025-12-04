# Stage 1.1: Automatic Conversation Title Generation

## Summary
Implement LLM-based automatic conversation title generation that analyzes the first 2-3 messages of a conversation and generates a concise, descriptive title. This replaces the current "New Conversation" placeholder with meaningful titles that help users distinguish between conversations.

## Goals
- Generate meaningful conversation titles automatically using LLM
- Trigger title generation after first 2-3 messages
- Update conversation title in database and UI in real-time
- Maintain manual title editing capability
- Ensure title generation doesn't block conversation flow

## Files to Modify / Create

### Backend
- `/src/modules/conversation/conversation.service.ts` → Add `generateConversationTitle()` method
- `/src/modules/llm/llm.service.ts` → Add title generation prompt template
- `/src/modules/conversation/conversation.controller.ts` → Add endpoint for manual title regeneration (optional)

### Frontend
- `/src/stores/conversationHistoryStore.ts` → Handle title update events
- `/src/components/ConversationSidebar.tsx` → Display updated titles in real-time

## Detailed Implementation Instructions

### Backend Implementation

#### Step 1: Add Title Generation Method to Conversation Service
In `/src/modules/conversation/conversation.service.ts`:

1. Add a new method `generateConversationTitle(conversationId: string): Promise<string>`
2. Implementation logic:
   - Fetch the conversation by ID
   - Extract first 2-3 messages (user + assistant messages)
   - Build context string from these messages
   - Call LLM service with title generation prompt
   - Parse the generated title (max 60 characters)
   - Update conversation document with new title
   - Return the generated title

3. Add automatic trigger:
   - In the method that adds messages to conversation, check message count
   - If message count === 3 (or 4), automatically call `generateConversationTitle()`
   - Use async/non-blocking call so it doesn't delay message response

#### Step 2: Add Title Generation Prompt to LLM Service
In `/src/modules/llm/llm.service.ts`:

1. Create a new method `generateTitle(conversationContext: string): Promise<string>`
2. Define system prompt:
   ```
   You are a title generator. Given a conversation excerpt, generate a concise, descriptive title (max 60 characters).
   The title should capture the main topic or question.
   Output only the title, nothing else.
   ```
3. User prompt template:
   ```
   Conversation:
   {conversationContext}
   
   Generate a title:
   ```
4. Use low temperature (0.3) for consistent results
5. Set max tokens to 20
6. Return cleaned title (trim whitespace, remove quotes if present)

#### Step 3: Integrate Title Generation into Message Flow
In the conversation service where messages are added:

1. After successfully adding a message, check:
   ```typescript
   const messageCount = conversation.messages.length;
   if (messageCount === 3) {
     // Trigger title generation asynchronously
     this.generateConversationTitle(conversationId).catch(err => {
       logger.error('Failed to generate title:', err);
     });
   }
   ```

2. Ensure this doesn't block the message response to the user

#### Step 4: Add WebSocket Event for Title Updates
In the WebSocket handler:

1. When title is generated, emit event:
   ```typescript
   socket.emit('conversation:title-updated', {
     conversationId,
     title: generatedTitle
   });
   ```

### Frontend Implementation

#### Step 5: Handle Title Update Events
In `/src/stores/conversationHistoryStore.ts`:

1. Add listener for `conversation:title-updated` event
2. Update the conversation in the store:
   ```typescript
   updateConversationTitle: (conversationId: string, title: string) => {
     set(state => ({
       conversations: state.conversations.map(conv =>
         conv.id === conversationId ? { ...conv, title } : conv
       )
     }));
   }
   ```

#### Step 6: Update UI Display
In `/src/components/ConversationSidebar.tsx`:

1. Ensure the component displays the `title` field from conversation object
2. Add smooth transition animation when title updates from "New Conversation" to generated title
3. Maintain existing manual edit functionality

### Error Handling

1. **LLM Failure:** If title generation fails, keep "New Conversation" as fallback
2. **Timeout:** Set 10-second timeout for title generation
3. **Rate Limiting:** Ensure title generation doesn't count against user's main quota
4. **Logging:** Log all title generation attempts and failures for monitoring

### Performance Considerations

1. **Caching:** Cache the title generation prompt template
2. **Async Execution:** Never block message flow for title generation
3. **Retry Logic:** Don't retry failed title generation to avoid wasting resources
4. **Token Efficiency:** Use smallest model available for title generation (e.g., ollama local small model)

## Acceptance Criteria

- [ ] After 3 messages in a new conversation, a title is automatically generated
- [ ] Generated title appears in conversation sidebar within 5 seconds
- [ ] Title is descriptive and relevant to conversation content
- [ ] Title generation doesn't delay or block message responses
- [ ] Manual title editing still works as before
- [ ] If title generation fails, conversation keeps "New Conversation" without errors
- [ ] Title updates are reflected in real-time across all UI components
- [ ] Title is persisted in database and survives app restart
