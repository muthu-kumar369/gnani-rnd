# Stage 7: Database Optimization

**Priority:** P1 (Important for Scale)  
**Estimated Time:** 1 week  
**Dependencies:** Stage 1 (Session Persistence)

---

## Objective

Optimize MongoDB performance through strategic indexing, connection pooling, query optimization, and efficient data modeling to support high-scale operations.

---

## Current State Analysis

### Existing Database Usage
- **Collections:**
  - `conversations`: Conversation metadata
  - `conversationmessages`: Message tree with branching
  - `users`: User profiles and preferences
  - `sessions`: Session state (from Stage 1)
  - `templates`: System prompt templates

### Issues
1. ❌ Missing indexes on frequently queried fields
2. ❌ No connection pooling configuration
3. ❌ Slow queries not identified
4. ❌ No query performance monitoring
5. ❌ Inefficient data models (embedded vs referenced)
6. ❌ No database migration strategy

---

## Implementation Requirements

### 1. Strategic Indexing

**File:** `src/modules/conversation/conversation.model.ts`

```typescript
import mongoose, { Schema, Document } from 'mongoose';

export interface IConversation extends Document {
  userId: string;
  conversationId: string;
  title: string;
  systemPrompt?: string;
  currentModel?: string;
  currentTemplate?: string;
  createdAt: Date;
  updatedAt: Date;
  lastMessageAt?: Date;
  messageCount: number;
  isArchived: boolean;
  tags: string[];
}

const ConversationSchema = new Schema<IConversation>({
  userId: { type: String, required: true, index: true },
  conversationId: { type: String, required: true, unique: true, index: true },
  title: { type: String, required: true },
  systemPrompt: String,
  currentModel: { type: String, default: 'gemma:2b' },
  currentTemplate: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  lastMessageAt: Date,
  messageCount: { type: Number, default: 0 },
  isArchived: { type: Boolean, default: false, index: true },
  tags: [String]
});

// ============================================
// Compound Indexes for Common Queries
// ============================================

// Get user's conversations sorted by last activity
ConversationSchema.index({ userId: 1, lastMessageAt: -1 });

// Get user's active (non-archived) conversations
ConversationSchema.index({ userId: 1, isArchived: 1, lastMessageAt: -1 });

// Search conversations by tags
ConversationSchema.index({ userId: 1, tags: 1 });

// Full-text search on title
ConversationSchema.index({ title: 'text' });

// ============================================
// Pre-save Middleware
// ============================================

ConversationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// ============================================
// Static Methods for Optimized Queries
// ============================================

ConversationSchema.statics.findUserConversations = function(
  userId: string,
  options: { limit?: number; skip?: number; includeArchived?: boolean } = {}
) {
  const query: any = { userId };
  
  if (!options.includeArchived) {
    query.isArchived = false;
  }

  return this.find(query)
    .sort({ lastMessageAt: -1 })
    .limit(options.limit || 50)
    .skip(options.skip || 0)
    .select('conversationId title lastMessageAt messageCount createdAt')
    .lean(); // Use lean() for read-only queries (faster)
};

export default mongoose.model<IConversation>('Conversation', ConversationSchema);
```

**File:** `src/modules/memory/entities/conversation.entity.ts`

```typescript
import mongoose, { Schema, Document } from 'mongoose';

export interface IConversationMessage extends Document {
  userId: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  generationId: string;
  status: 'pending' | 'completed' | 'error';
  version: number;
  parentId: string | null;
  children: string[];
  tokenUsage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    estimatedCost: number;
    model: string;
  };
  metadata?: Record<string, any>;
}

const ConversationMessageSchema = new Schema<IConversationMessage>({
  userId: { type: String, required: true, index: true },
  conversationId: { type: String, required: true, index: true },
  role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now, index: true },
  generationId: { type: String, required: true, index: true },
  status: { type: String, enum: ['pending', 'completed', 'error'], default: 'pending' },
  version: { type: Number, default: 1 },
  parentId: { type: String, index: true },
  children: [String],
  tokenUsage: {
    inputTokens: Number,
    outputTokens: Number,
    totalTokens: Number,
    estimatedCost: Number,
    model: String
  },
  metadata: Schema.Types.Mixed
});

// ============================================
// Compound Indexes
// ============================================

// Get conversation messages sorted by time
ConversationMessageSchema.index({ conversationId: 1, timestamp: -1 });

// Get user's messages across all conversations
ConversationMessageSchema.index({ userId: 1, timestamp: -1 });

// Find messages by generation ID (for branching)
ConversationMessageSchema.index({ generationId: 1 }, { unique: true });

// Find children of a message
ConversationMessageSchema.index({ parentId: 1 });

// Get messages by status (for cleanup/retry)
ConversationMessageSchema.index({ status: 1, timestamp: -1 });

// ============================================
// Static Methods
// ============================================

ConversationMessageSchema.statics.getConversationHistory = function(
  conversationId: string,
  options: { limit?: number; before?: Date } = {}
) {
  const query: any = { conversationId, status: 'completed' };
  
  if (options.before) {
    query.timestamp = { $lt: options.before };
  }

  return this.find(query)
    .sort({ timestamp: -1 })
    .limit(options.limit || 50)
    .select('role content timestamp tokenUsage')
    .lean();
};

ConversationMessageSchema.statics.getMessageTree = async function(messageId: string) {
  const message = await this.findById(messageId).lean();
  if (!message) return null;

  // Recursively get children
  const children = await Promise.all(
    message.children.map((childId: string) => this.getMessageTree(childId))
  );

  return {
    ...message,
    children: children.filter(Boolean)
  };
};

export default mongoose.model<IConversationMessage>('ConversationMessage', ConversationMessageSchema);
```

### 2. Connection Pooling

**File:** `src/config/database.config.ts`

```typescript
import mongoose from 'mongoose';
import { createContextualLogger } from '../core/logger/logger.js';
import { dbConnectionPoolSize, dbQueryDuration, dbOperationsTotal } from '../core/monitoring/metrics.js';

const logger = createContextualLogger({ module: 'Database' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gnani';

export async function connectDatabase(): Promise<void> {
  try {
    await mongoose.connect(MONGODB_URI, {
      // Connection Pool Settings
      maxPoolSize: 100,        // Maximum number of connections
      minPoolSize: 10,         // Minimum number of connections to maintain
      maxIdleTimeMS: 30000,    // Close idle connections after 30s
      
      // Timeout Settings
      serverSelectionTimeoutMS: 10000,  // Timeout for selecting a server
      socketTimeoutMS: 45000,           // Timeout for socket operations
      connectTimeoutMS: 10000,          // Timeout for initial connection
      
      // Retry Settings
      retryWrites: true,
      retryReads: true,
      
      // Read Preference
      readPreference: 'primaryPreferred',  // Prefer primary, fallback to secondary
      
      // Write Concern
      w: 'majority',  // Wait for majority of replica set to acknowledge
      
      // Compression
      compressors: ['zlib'],  // Enable compression for network traffic
    });

    logger.info('MongoDB connected successfully', {
      host: mongoose.connection.host,
      database: mongoose.connection.name,
      poolSize: mongoose.connection.getClient().options.maxPoolSize
    });

    // Monitor connection pool
    setupPoolMonitoring();

  } catch (error: any) {
    logger.error(`MongoDB connection failed: ${error.message}`);
    throw error;
  }
}

function setupPoolMonitoring() {
  const client = mongoose.connection.getClient();

  // Monitor connection pool events
  client.on('connectionPoolCreated', () => {
    logger.info('Connection pool created');
  });

  client.on('connectionCreated', () => {
    updatePoolMetrics();
  });

  client.on('connectionClosed', () => {
    updatePoolMetrics();
  });

  // Update metrics every 10 seconds
  setInterval(updatePoolMetrics, 10000);
}

function updatePoolMetrics() {
  const client = mongoose.connection.getClient();
  const pool = (client as any).topology?.s?.pool;

  if (pool) {
    dbConnectionPoolSize.set({ state: 'active' }, pool.totalConnectionCount || 0);
    dbConnectionPoolSize.set({ state: 'idle' }, pool.availableConnectionCount || 0);
  }
}

// Query Performance Monitoring
mongoose.plugin((schema) => {
  schema.pre(/^find/, function() {
    (this as any)._startTime = Date.now();
  });

  schema.post(/^find/, function(result) {
    const duration = (Date.now() - (this as any)._startTime) / 1000;
    const collection = (this as any).mongooseCollection?.name || 'unknown';
    
    dbQueryDuration.observe({ operation: 'find', collection }, duration);
    dbOperationsTotal.inc({ operation: 'find', collection, status: 'success' });

    if (duration > 1) {
      logger.warn(`Slow query detected`, {
        collection,
        duration,
        query: (this as any).getQuery()
      });
    }
  });

  schema.post(/^find/, function(error: any) {
    if (error) {
      const collection = (this as any).mongooseCollection?.name || 'unknown';
      dbOperationsTotal.inc({ operation: 'find', collection, status: 'error' });
    }
  });
});

export async function disconnectDatabase(): Promise<void> {
  await mongoose.connection.close();
  logger.info('MongoDB disconnected');
}

export default mongoose;
```

### 3. Query Optimization Utilities

**File:** `src/utils/query-optimizer.ts`

```typescript
import { createContextualLogger } from '../core/logger/logger.js';

const logger = createContextualLogger({ module: 'QueryOptimizer' });

/**
 * Optimize query by using lean() for read-only operations
 */
export function optimizeReadQuery<T>(query: any): any {
  return query.lean();
}

/**
 * Paginate query results efficiently
 */
export interface PaginationOptions {
  page: number;
  limit: number;
  sort?: Record<string, 1 | -1>;
}

export async function paginateQuery<T>(
  model: any,
  filter: any,
  options: PaginationOptions
): Promise<{ data: T[]; total: number; page: number; pages: number }> {
  const { page = 1, limit = 50, sort = { createdAt: -1 } } = options;
  const skip = (page - 1) * limit;

  // Execute count and find in parallel
  const [total, data] = await Promise.all([
    model.countDocuments(filter),
    model.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean()
  ]);

  return {
    data,
    total,
    page,
    pages: Math.ceil(total / limit)
  };
}

/**
 * Batch operations for better performance
 */
export async function batchInsert<T>(
  model: any,
  documents: T[],
  batchSize: number = 1000
): Promise<void> {
  for (let i = 0; i < documents.length; i += batchSize) {
    const batch = documents.slice(i, i + batchSize);
    await model.insertMany(batch, { ordered: false });
    logger.debug(`Inserted batch ${i / batchSize + 1}`, {
      size: batch.length
    });
  }
}

/**
 * Efficient aggregation with cursor
 */
export async function aggregateWithCursor<T>(
  model: any,
  pipeline: any[],
  processor: (doc: T) => Promise<void>
): Promise<void> {
  const cursor = model.aggregate(pipeline).cursor();

  for await (const doc of cursor) {
    await processor(doc);
  }
}
```

### 4. Database Migration System

**File:** `migrations/001-add-indexes.ts`

```typescript
import mongoose from 'mongoose';
import { createContextualLogger } from '../src/core/logger/logger.js';

const logger = createContextualLogger({ module: 'Migration' });

export async function up() {
  logger.info('Running migration: add-indexes');

  const db = mongoose.connection.db;

  // Add indexes to conversations collection
  await db.collection('conversations').createIndexes([
    { key: { userId: 1, lastMessageAt: -1 } },
    { key: { userId: 1, isArchived: 1, lastMessageAt: -1 } },
    { key: { userId: 1, tags: 1 } },
    { key: { title: 'text' } }
  ]);

  // Add indexes to conversationmessages collection
  await db.collection('conversationmessages').createIndexes([
    { key: { conversationId: 1, timestamp: -1 } },
    { key: { userId: 1, timestamp: -1 } },
    { key: { parentId: 1 } },
    { key: { status: 1, timestamp: -1 } }
  ]);

  logger.info('Migration completed: add-indexes');
}

export async function down() {
  logger.info('Rolling back migration: add-indexes');

  const db = mongoose.connection.db;

  // Drop indexes (except _id)
  await db.collection('conversations').dropIndexes();
  await db.collection('conversationmessages').dropIndexes();

  logger.info('Rollback completed: add-indexes');
}
```

**File:** `scripts/migrate.ts`

```typescript
import mongoose from 'mongoose';
import { connectDatabase } from '../src/config/database.config.js';
import fs from 'fs';
import path from 'path';

async function runMigrations() {
  await connectDatabase();

  const migrationsDir = path.join(process.cwd(), 'migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.ts') || f.endsWith('.js'))
    .sort();

  for (const file of files) {
    const migration = await import(path.join(migrationsDir, file));
    console.log(`Running migration: ${file}`);
    await migration.up();
  }

  await mongoose.connection.close();
  console.log('All migrations completed');
}

runMigrations().catch(console.error);
```

### 5. Query Performance Analysis

**File:** `scripts/analyze-queries.ts`

```typescript
import mongoose from 'mongoose';
import { connectDatabase } from '../src/config/database.config.js';

async function analyzeQueries() {
  await connectDatabase();

  const db = mongoose.connection.db;

  // Enable profiling
  await db.command({ profile: 2, slowms: 100 });

  console.log('Query profiling enabled. Slow queries (>100ms) will be logged.');
  console.log('Run your application and then check system.profile collection.');

  // Get slow queries
  const slowQueries = await db.collection('system.profile')
    .find({ millis: { $gt: 100 } })
    .sort({ millis: -1 })
    .limit(10)
    .toArray();

  console.log('\nTop 10 slowest queries:');
  slowQueries.forEach((query, i) => {
    console.log(`\n${i + 1}. Duration: ${query.millis}ms`);
    console.log(`   Collection: ${query.ns}`);
    console.log(`   Operation: ${query.op}`);
    console.log(`   Query:`, JSON.stringify(query.command, null, 2));
  });

  await mongoose.connection.close();
}

analyzeQueries().catch(console.error);
```

---

## Testing Requirements

### Performance Benchmarks

```typescript
// tests/performance/database.bench.ts
import Conversation from '../../src/modules/conversation/conversation.model.js';

describe('Database Performance', () => {
  it('should fetch user conversations in <50ms', async () => {
    const start = Date.now();
    await Conversation.findUserConversations('user-123', { limit: 50 });
    const duration = Date.now() - start;
    
    expect(duration).toBeLessThan(50);
  });

  it('should handle 1000 concurrent queries', async () => {
    const promises = Array(1000).fill(null).map(() =>
      Conversation.findUserConversations('user-123')
    );
    
    const start = Date.now();
    await Promise.all(promises);
    const duration = Date.now() - start;
    
    expect(duration).toBeLessThan(5000); // 5 seconds for 1000 queries
  });
});
```

---

## Verification Checklist

- [ ] All indexes created on frequently queried fields
- [ ] Connection pool configured (100 max, 10 min)
- [ ] Query performance monitoring enabled
- [ ] Slow queries logged (>100ms)
- [ ] Migration system implemented
- [ ] Pagination utilities created
- [ ] Batch operations optimized
- [ ] Read queries use `.lean()` for performance
- [ ] Compound indexes for common query patterns
- [ ] Database metrics exported to Prometheus

---

## Success Criteria

1. ✅ **Query Performance:** 95% of queries <50ms
2. ✅ **Throughput:** Handle 1000+ queries/second
3. ✅ **Connection Efficiency:** Pool utilization <80%
4. ✅ **Index Coverage:** All common queries use indexes
5. ✅ **No Slow Queries:** Zero queries >1s under normal load

---

## Next Steps

- **Stage 8:** Caching & Performance
- **Stage 9:** Security & Rate Limiting
