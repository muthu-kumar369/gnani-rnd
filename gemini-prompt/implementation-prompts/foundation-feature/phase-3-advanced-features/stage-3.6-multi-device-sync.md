# Stage 3.6: Multi-Device Sync

## Summary
Sync conversations across devices using WebSocket and cloud storage.

## Goals
- Real-time sync via WebSocket
- Conflict resolution for concurrent edits
- Offline support with sync queue
- Selective sync

## Files to Modify / Create

### Backend
- `/src/modules/sync/sync.gateway.ts` → **[NEW]** WebSocket gateway for sync
- `/src/modules/sync/sync.service.ts` → **[NEW]** Conflict resolution logic

### Frontend
- `/src/stores/syncStore.ts` → **[NEW]** Client-side sync logic

## Detailed Implementation Instructions

### Backend Implementation

#### Step 1: Implement Sync Gateway
Handle `sync:push` and `sync:pull` events.

### Frontend Implementation

#### Step 2: Implement Offline Queue
Queue actions when offline, replay when online.

## Acceptance Criteria
- [ ] Conversations sync between two open clients in real-time
- [ ] Offline changes sync when connection is restored
- [ ] Conflicts are resolved gracefully (last write wins or merge)
