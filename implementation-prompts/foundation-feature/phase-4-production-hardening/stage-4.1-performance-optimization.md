# Stage 4.1: Performance Optimization

## Summary
Optimize database queries, caching, and rendering to ensure smooth performance at scale.

## Goals
- Database query optimization (indexes, aggregation pipelines)
- Redis caching for frequently accessed data
- Frontend lazy loading and code splitting
- Message virtualization for long conversations
- Image optimization and lazy loading

## Files to Modify / Create

### Backend
- `/src/modules/database/indexes.ts` → **[NEW]** Index definitions
- `/src/config/redis.config.ts` → Tuning

### Frontend
- `/src/components/Terminal/MessageList.tsx` → Implement virtualization

## Detailed Implementation Instructions

### Backend Implementation

#### Step 1: Add Database Indexes
Analyze query patterns and add compound indexes.

### Frontend Implementation

#### Step 2: Virtualize Message List
Use `react-window` or `react-virtuoso` for message list.

## Acceptance Criteria
- [ ] Conversation load time < 500ms
- [ ] Message list scrolls smoothly with 1000+ messages
- [ ] Redis hit rate > 80%
