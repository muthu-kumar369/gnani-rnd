# Stage 2.2: System Prompts (Per-Conversation)

## Summary
Allow users to set custom system prompts for each conversation, enabling different assistant personalities and behaviors.

## Goals
- Add system prompt field to conversation settings
- Support prompt templates (e.g., "Code Assistant", "Creative Writer")
- Persist system prompt with conversation
- Inject system prompt into LLM context
- Allow editing system prompt mid-conversation

## Files to Modify / Create

### Backend
- `/src/modules/conversation/conversation.schema.ts` → Add `systemPrompt` field
- `/src/modules/conversation/conversation.service.ts` → Inject system prompt into context
- `/src/data/prompt-templates.ts` → **[NEW]** Library of prompt templates

### Frontend
- `/src/components/Settings/SystemPromptEditor.tsx` → **[NEW]** Editor for system prompts
- `/src/components/ConversationSettings.tsx` → Integrate SystemPromptEditor

## Detailed Implementation Instructions

### Backend Implementation

#### Step 1: Update Conversation Schema
In `/src/modules/conversation/conversation.schema.ts`:

```typescript
systemPrompt: { type: String, default: "You are a helpful AI assistant." }
```

#### Step 2: Inject System Prompt
In `/src/modules/conversation/conversation.service.ts`:

- Retrieve `systemPrompt` from conversation document
- Prepend to message history as `role: 'system'`

### Frontend Implementation

#### Step 3: Create System Prompt Editor
In `/src/components/Settings/SystemPromptEditor.tsx`:

- Textarea for editing prompt
- Template selector with presets
- Character counter (max 2000 chars)
- Preview how prompt affects responses

## Acceptance Criteria
- [ ] Users can set custom system prompt per conversation
- [ ] System prompt is correctly injected into LLM context
- [ ] Templates are available for quick selection
- [ ] Changes to system prompt are saved immediately
