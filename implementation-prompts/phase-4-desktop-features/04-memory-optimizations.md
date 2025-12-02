# Stage 4: Memory Management Optimizations

## Objective
Optimize the backend memory systems to prevent unbounded growth and improve retrieval latency. This involves setting Time-To-Live (TTL) for Redis keys and implementing a caching layer for vector search results.

## Context
- **Redis**: Currently stores session context and short-term memory. Without TTL, old sessions might persist forever, consuming memory.
- **Vector Search**: Semantic search is expensive. Frequently asked questions or similar queries should be cached to avoid hitting the vector database/embedding model every time.

## Implementation Steps

### 1. Redis TTL Policies

#### [MODIFY] `src/modules/memory/redis.service.ts` (or equivalent)
- Review where keys are set.
- Add `EX` (expiration) to `SET` commands for session data.
- Recommended TTLs:
  - Session Context: 24 hours (or session duration + buffer)
  - Short-term Memory: 1-3 days
  - Cache Keys: 1 hour

### 2. Vector Search Caching

#### [MODIFY] `src/modules/memory/vector.store.ts`
- Before generating an embedding for a query, check a "Query Cache" (Redis).
- Key: Hash of the query string.
- Value: Cached search results.
- If cache miss: Generate embedding -> Search Vector DB -> Cache results.

#### [MODIFY] `src/modules/memory/memory.manager.ts`
- Integrate the caching logic into the retrieval flow.

## Verification
1. **Redis**:
   - Create a session and interact.
   - Check Redis (CLI) to verify that keys have an `TTL` set.
2. **Vector Cache**:
   - Ask the same question twice.
   - Verify that the second response is faster (or check logs for "Cache Hit").
