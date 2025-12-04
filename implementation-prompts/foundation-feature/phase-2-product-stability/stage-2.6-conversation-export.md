# Stage 2.6: Conversation Export

## Summary
Export conversations to Markdown or JSON format for archiving and sharing.

## Goals
- Export conversation as Markdown (readable)
- Export conversation as JSON (data)
- Include attachments in export (optional)
- Support exporting single conversation or all conversations

## Files to Modify / Create

### Backend
- `/src/modules/conversation/export.service.ts` → **[NEW]** Service to handle export logic
- `/src/modules/conversation/conversation.controller.ts` → Add export endpoints

### Frontend
- `/src/components/ConversationSidebar/ExportButton.tsx` → **[NEW]** UI for export action
- `/src/utils/download.ts` → **[NEW]** Helper to trigger download

## Detailed Implementation Instructions

### Backend Implementation

#### Step 1: Create Export Service
In `/src/modules/conversation/export.service.ts`:

- `exportToMarkdown(conversationId: string): Promise<string>`
- `exportToJson(conversationId: string): Promise<object>`

### Frontend Implementation

#### Step 2: Create Export Button
In `/src/components/ConversationSidebar/ExportButton.tsx`:

- Button in conversation menu
- Dropdown to select format (Markdown/JSON)
- Trigger download on selection

## Acceptance Criteria
- [ ] Users can export conversation to Markdown
- [ ] Users can export conversation to JSON
- [ ] Exported files contain full conversation history
- [ ] Attachments are referenced correctly in export
