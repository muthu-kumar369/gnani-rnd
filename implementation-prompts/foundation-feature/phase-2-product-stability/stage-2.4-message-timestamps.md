# Stage 2.4: Message Timestamps (Visible)

## Summary
Display relative timestamps on messages (e.g., "2 minutes ago", "Yesterday at 3:45 PM") to improve conversation context.

## Goals
- Display relative timestamps on messages
- Update timestamps in real-time
- Group messages by date
- Allow user to toggle timestamp visibility

## Files to Modify / Create

### Frontend
- `/src/components/Terminal/MessageTimestamp.tsx` → **[NEW]** Component for rendering timestamp
- `/src/utils/date-formatter.ts` → **[NEW]** Utility for date formatting
- `/src/components/Terminal/MessageBubble.tsx` → Integrate timestamp

## Detailed Implementation Instructions

### Frontend Implementation

#### Step 1: Create Date Formatter Utility
In `/src/utils/date-formatter.ts`:

- Use `date-fns` or `dayjs`
- Function `formatRelativeTime(date: Date): string`
- Function `formatAbsoluteTime(date: Date): string`

#### Step 2: Create Message Timestamp Component
In `/src/components/Terminal/MessageTimestamp.tsx`:

- Render formatted time
- Tooltip with exact date/time

#### Step 3: Integrate into Message Bubble
In `/src/components/Terminal/MessageBubble.tsx`:

- Add timestamp to message header or footer
- Respect user preference for visibility

## Acceptance Criteria
- [ ] Relative timestamps are shown on messages
- [ ] Timestamps update automatically (e.g., "just now" -> "1 min ago")
- [ ] Exact time is visible on hover
