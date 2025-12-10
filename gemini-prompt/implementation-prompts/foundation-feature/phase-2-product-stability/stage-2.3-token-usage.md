# Stage 2.3: Token Usage Tracking

## Summary
Track and display token consumption per message and conversation for cost monitoring and optimization.

## Goals
- Count tokens for each message (input + output)
- Display token count in message metadata
- Show total conversation tokens
- Estimate costs based on model pricing
- Add token usage analytics dashboard

## Files to Modify / Create

### Backend
- `/src/modules/llm/token-counter.service.ts` → **[NEW]** Service to count tokens
- `/src/modules/conversation/conversation.schema.ts` → Add `tokenUsage` field
- `/src/modules/conversation/conversation.service.ts` → Integrate token counting

### Frontend
- `/src/components/TokenUsage/TokenBadge.tsx` → **[NEW]** Badge to display token count
- `/src/components/Analytics/TokenUsageChart.tsx` → **[NEW]** Chart for token usage
- `/src/components/Terminal/MessageBubble.tsx` → Integrate TokenBadge

## Detailed Implementation Instructions

### Backend Implementation

#### Step 1: Create Token Counter Service
In `/src/modules/llm/token-counter.service.ts`:

```typescript
interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCost: number;
}

async trackTokenUsage(message: Message, model: string): Promise<TokenUsage> {
  // Use tiktoken or model-specific tokenizer
  const inputTokens = await this.tokenizer.count(message.content);
  const outputTokens = await this.tokenizer.count(response.content);
  
  // Calculate cost based on model pricing
  const cost = this.calculateCost(inputTokens, outputTokens, model);
  
  // Store in message metadata
  await this.updateMessage(message.id, { tokenUsage });
}
```

### Frontend Implementation

#### Step 2: Create Token Badge
In `/src/components/TokenUsage/TokenBadge.tsx`:

- Small badge showing token count
- Hover tooltip with breakdown (input vs output)

#### Step 3: Integrate into Message Bubble
In `/src/components/Terminal/MessageBubble.tsx`:

- Display `TokenBadge` in message footer

## Acceptance Criteria
- [ ] Token count is displayed for each message
- [ ] Total conversation tokens are visible
- [ ] Token usage is persisted in database
- [ ] Cost estimation is accurate based on configured rates
