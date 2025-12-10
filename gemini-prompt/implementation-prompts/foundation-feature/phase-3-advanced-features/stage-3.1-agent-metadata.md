# Stage 3.1: Agent Metadata in Messages

## Summary
Track which agent/model generated each message to support multi-agent conversations and provide transparency.

## Goals
- Add `agentId` and `modelId` to message schema
- Display agent badge on messages
- Support agent-specific avatars and colors
- Filter messages by agent

## Files to Modify / Create

### Backend
- `/src/modules/conversation/conversation.schema.ts` → Add metadata fields
- `/src/modules/agent/agent.service.ts` → **[NEW]** Service to manage agent identities

### Frontend
- `/src/components/Terminal/AgentBadge.tsx` → **[NEW]** UI component for agent identity
- `/src/components/Terminal/MessageBubble.tsx` → Integrate AgentBadge

## Detailed Implementation Instructions

### Backend Implementation

#### Step 1: Update Schema
In `/src/modules/conversation/conversation.schema.ts`:

```typescript
agentId: { type: String, required: false }
modelId: { type: String, required: true }
```

### Frontend Implementation

#### Step 2: Create Agent Badge
In `/src/components/Terminal/AgentBadge.tsx`:

- Display agent name and icon
- Tooltip with model details

## Acceptance Criteria
- [ ] Every assistant message shows which agent/model generated it
- [ ] Different agents have distinct visual indicators
- [ ] Metadata is persisted correctly
