# STAGE 5: ADVANCED FEATURES (OPEN SOURCE)

**Duration:** 3 weeks  
**Priority:** MEDIUM  
**Dependencies:** Stage 4

---

## 🎯 OBJECTIVE

Upgrade basic implementations to advanced features using ONLY open-source solutions. No paid ML services. Focus on Silero VAD, advanced RAG, semantic search, and intelligent caching.

---

## 📋 TASKS

### Task 5.1: Upgrade VAD to Silero VAD (Open Source ML)
**Files:** `electron/vad/vadManager.js`  
**Effort:** 3 days  
**License:** MIT (Free, Open Source)

**Implementation:**
```javascript
// Install: npm install @ricky0123/vad-web
import { MicVAD } from '@ricky0123/vad-web';

class VadManager {
  async init() {
    this.vad = await MicVAD.new({
      onSpeechStart: () => {
        this.emit('speech:start');
      },
      onSpeechEnd: (audio) => {
        this.emit('speech:end');
        this.emit('audio:frame', audio);
      },
      onVADMisfire: () => {
        logger.debug('VAD misfire detected');
      },
      positiveSpeechThreshold: 0.8,
      negativeSpeechThreshold: 0.5,
      redemptionFrames: 8,
      preSpeechPadFrames: 1,
      minSpeechFrames: 3,
    });
  }

  startProcessing() {
    this.vad.start();
  }

  stopProcessing() {
    this.vad.pause();
  }
}
```

**Verification:**
- Test in quiet environment
- Test with background noise
- Compare with old VAD (should have fewer false positives)
- Measure latency (should be < 100ms)

---

### Task 5.2: Implement Advanced RAG for Memory System
**Files:** `long-term-memory.service.ts`, NEW `rag-pipeline.service.ts`  
**Effort:** 4 days

**Implementation:**
```typescript
class RAGPipeline {
  async retrieve(query: string, userId: string, k: number = 5) {
    // Step 1: Generate query embedding
    const queryEmbedding = await this.embedQuery(query);

    // Step 2: Vector search
    const vectorResults = await chromaClient.query({
      queryEmbeddings: [queryEmbedding],
      nResults: k * 2, // Get more for reranking
      where: { userId }
    });

    // Step 3: Rerank results
    const reranked = await this.rerank(query, vectorResults);

    // Step 4: Deduplicate
    const deduplicated = this.deduplicate(reranked);

    // Step 5: Return top K
    return deduplicated.slice(0, k);
  }

  async rerank(query: string, results: any[]) {
    // Use cross-encoder for reranking (sentence-transformers)
    const scores = await Promise.all(
      results.map(async (result) => {
        const score = await this.computeRelevance(query, result.document);
        return { ...result, rerankScore: score };
      })
    );

    return scores.sort((a, b) => b.rerankScore - a.rerankScore);
  }

  async embedQuery(query: string) {
    // Use sentence-transformers (open source)
    // Run via Python subprocess or ONNX runtime
    const { spawn } = require('child_process');

    return new Promise((resolve, reject) => {
      const python = spawn('python', ['scripts/embed.py', query]);
      let output = '';

      python.stdout.on('data', (data) => {
        output += data.toString();
      });

      python.on('close', (code) => {
        if (code === 0) {
          resolve(JSON.parse(output));
        } else {
          reject(new Error('Embedding failed'));
        }
      });
    });
  }
}
```

Create `scripts/embed.py`:
```python
# Using sentence-transformers (open source)
from sentence_transformers import SentenceTransformer
import sys
import json

model = SentenceTransformer('all-MiniLM-L6-v2')
query = sys.argv[1]
embedding = model.encode(query).tolist()
print(json.dumps(embedding))
```

**Verification:**
- Query "authentication issues"
- Should find "login problems", "auth errors"
- Compare with simple vector search
- Verify reranking improves relevance

---

### Task 5.3: Add Memory Importance Scoring and Pruning
**Files:** Already done in Stage 3, Task 3.7  
**Status:** ✅ Completed in Stage 3

---

### Task 5.4: Implement Context Compression
**Files:** `context-manager.service.ts`  
**Effort:** 2 days

**Implementation:**
```typescript
class ContextCompressor {
  async compress(messages: Message[]): Promise<Message[]> {
    if (messages.length <= 10) return messages;

    // Keep first (system) and last 5 messages
    const recent = messages.slice(-5);
    const older = messages.slice(1, -5);

    if (older.length === 0) return messages;

    // Summarize older messages
    const summary = await this.summarizeMessages(older);

    return [
      messages[0], // System prompt
      {
        role: 'system',
        content: `Previous conversation summary: ${summary}`
      },
      ...recent
    ];
  }

  async summarizeMessages(messages: Message[]): Promise<string> {
    const conversation = messages
      .map(m => `${m.role}: ${m.content}`)
      .join('\\n');

    const prompt = `Summarize this conversation in 2-3 sentences:\\n${conversation}`;

    const response = await llmService.generate([
      { role: 'user', content: prompt }
    ]);

    return response.content;
  }
}
```

**Verification:**
- Create 50-message conversation
- Verify compression to ~10 messages
- Check summary is accurate
- Verify LLM still has context

---

### Task 5.5: Add Predictive Cache Warming
**Files:** `cache-warming.service.ts`  
**Effort:** 2 days

**Implementation:**
```typescript
class PredictiveCacheWarmer {
  async warmPredictively(userId: string) {
    // Analyze user patterns
    const patterns = await this.analyzeUserPatterns(userId);

    // Predict likely queries
    const predictions = this.predictQueries(patterns);

    // Pre-warm cache
    for (const prediction of predictions) {
      await this.warmCache(prediction);
    }
  }

  async analyzeUserPatterns(userId: string) {
    const recentQueries = await AnalyticsEvent.find({
      userId,
      eventType: 'query',
      timestamp: { $gt: Date.now() - 7 * 24 * 60 * 60 * 1000 } // Last 7 days
    }).sort({ timestamp: -1 }).limit(100);

    // Find common patterns
    const patterns = {
      commonTopics: this.extractTopics(recentQueries),
      timeOfDay: this.analyzeTimePatterns(recentQueries),
      queryTypes: this.categorizeQueries(recentQueries)
    };

    return patterns;
  }

  predictQueries(patterns: any): string[] {
    // Simple prediction: most common topics
    return patterns.commonTopics.slice(0, 5);
  }
}
```

**Verification:**
- Run for active user
- Check cache hit rate before/after
- Verify predicted queries are relevant
- Measure cache hit improvement

---

### Task 5.6: Implement Tiered Caching (L1/L2/L3)
**Files:** `cache.service.ts`  
**Effort:** 2 days

**Implementation:**
```typescript
class TieredCache {
  private l1Cache: Map<string, any>; // In-memory (fast)
  private l2Cache: Redis; // Redis (medium)
  private l3Cache: MongoDB; // MongoDB (slow but persistent)

  async get<T>(key: string): Promise<T | null> {
    // L1: Check memory
    if (this.l1Cache.has(key)) {
      return this.l1Cache.get(key);
    }

    // L2: Check Redis
    const l2Value = await this.l2Cache.get(key);
    if (l2Value) {
      this.l1Cache.set(key, l2Value); // Promote to L1
      return l2Value;
    }

    // L3: Check MongoDB
    const l3Value = await this.l3Cache.findOne({ key });
    if (l3Value) {
      await this.l2Cache.set(key, l3Value.value); // Promote to L2
      this.l1Cache.set(key, l3Value.value); // Promote to L1
      return l3Value.value;
    }

    return null;
  }

  async set(key: string, value: any, ttl: number) {
    // Write to all tiers
    this.l1Cache.set(key, value);
    await this.l2Cache.set(key, value, 'EX', ttl);
    await this.l3Cache.updateOne(
      { key },
      { key, value, expiresAt: Date.now() + ttl * 1000 },
      { upsert: true }
    );
  }
}
```

**Verification:**
- Measure cache hit rates per tier
- Verify L1 is fastest
- Check promotion works
- Monitor memory usage

---

### Task 5.7: Add Semantic Search with Embeddings
**Files:** NEW `semantic-search.service.ts`  
**Effort:** 3 days

**Implementation:**
```typescript
class SemanticSearchService {
  async search(query: string, userId: string) {
    // Generate query embedding
    const embedding = await this.generateEmbedding(query);

    // Search in ChromaDB
    const results = await chromaClient.query({
      queryEmbeddings: [embedding],
      nResults: 20,
      where: { userId }
    });

    // Enhance with metadata
    const enhanced = await this.enhanceResults(results);

    return enhanced;
  }

  async generateEmbedding(text: string): Promise<number[]> {
    // Use sentence-transformers via Python
    // Or use ONNX runtime for in-process inference
    const { spawn } = require('child_process');

    return new Promise((resolve, reject) => {
      const python = spawn('python', ['scripts/embed.py', text]);
      let output = '';

      python.stdout.on('data', (data) => {
        output += data.toString();
      });

      python.on('close', (code) => {
        if (code === 0) {
          resolve(JSON.parse(output));
        } else {
          reject(new Error('Embedding generation failed'));
        }
      });
    });
  }

  async indexDocument(doc: any, userId: string) {
    const embedding = await this.generateEmbedding(doc.content);

    await chromaClient.add({
      ids: [doc.id],
      embeddings: [embedding],
      metadatas: [{ userId, ...doc.metadata }],
      documents: [doc.content]
    });
  }
}
```

**Verification:**
- Index 1000 documents
- Search for "authentication"
- Verify finds "login", "auth", "credentials"
- Compare with text search
- Measure search latency

---

### Task 5.8: Implement Faceted Search with Filters
**Files:** `hybrid-search.service.ts`  
**Effort:** 2 days

**Implementation:**
```typescript
interface SearchFilters {
  dateRange?: { start: Date; end: Date };
  folders?: string[];
  hasAttachments?: boolean;
  messageType?: 'user' | 'assistant';
  minLength?: number;
  maxLength?: number;
}

class FacetedSearchService {
  async search(query: string, filters: SearchFilters) {
    // Build MongoDB query
    const mongoQuery: any = {};

    if (filters.dateRange) {
      mongoQuery.timestamp = {
        $gte: filters.dateRange.start,
        $lte: filters.dateRange.end
      };
    }

    if (filters.folders) {
      mongoQuery.folderId = { $in: filters.folders };
    }

    if (filters.hasAttachments !== undefined) {
      mongoQuery.hasAttachments = filters.hasAttachments;
    }

    if (filters.messageType) {
      mongoQuery.role = filters.messageType;
    }

    if (filters.minLength) {
      mongoQuery.$expr = { $gte: [{ $strLenCP: '$content' }, filters.minLength] };
    }

    // Combine with text/semantic search
    const textResults = await this.textSearch(query);
    const semanticResults = await this.semanticSearch(query);

    // Merge and filter
    const merged = this.mergeResults(textResults, semanticResults);
    const filtered = await Message.find({
      _id: { $in: merged.map(r => r.id) },
      ...mongoQuery
    });

    return filtered;
  }

  async getFacets(query: string) {
    // Return available facets
    const results = await this.search(query, {});

    return {
      folders: this.extractFolders(results),
      dateRanges: this.extractDateRanges(results),
      types: this.extractTypes(results),
      hasAttachments: this.countAttachments(results)
    };
  }
}
```

**Verification:**
- Search with multiple filters
- Verify results match all filters
- Test facet extraction
- Check performance with filters

---

### Task 5.9: Add Search Suggestions and Autocomplete
**Files:** NEW `search-suggestions.service.ts`  
**Effort:** 2 days

**Implementation:**
```typescript
class SearchSuggestionsService {
  private trie: Trie;

  async buildIndex(userId: string) {
    // Get all user queries
    const queries = await AnalyticsEvent.find({
      userId,
      eventType: 'search'
    }).distinct('query');

    // Build trie
    this.trie = new Trie();
    queries.forEach(q => this.trie.insert(q));
  }

  getSuggestions(prefix: string, limit: number = 5): string[] {
    return this.trie.search(prefix, limit);
  }

  async recordQuery(userId: string, query: string) {
    // Record for future suggestions
    await AnalyticsEvent.create({
      userId,
      eventType: 'search',
      query,
      timestamp: Date.now()
    });

    // Update trie
    this.trie.insert(query);
  }
}

class Trie {
  private root = new TrieNode();

  insert(word: string) {
    let node = this.root;
    for (const char of word.toLowerCase()) {
      if (!node.children.has(char)) {
        node.children.set(char, new TrieNode());
      }
      node = node.children.get(char)!;
      node.count++;
    }
    node.isEnd = true;
  }

  search(prefix: string, limit: number): string[] {
    let node = this.root;
    for (const char of prefix.toLowerCase()) {
      if (!node.children.has(char)) return [];
      node = node.children.get(char)!;
    }

    // DFS to find all words
    const results: Array<{ word: string; count: number }> = [];
    this.dfs(node, prefix, results);

    // Sort by frequency
    results.sort((a, b) => b.count - a.count);

    return results.slice(0, limit).map(r => r.word);
  }

  private dfs(node: TrieNode, prefix: string, results: any[]) {
    if (node.isEnd) {
      results.push({ word: prefix, count: node.count });
    }

    for (const [char, child] of node.children) {
      this.dfs(child, prefix + char, results);
    }
  }
}
```

**Verification:**
- Type "auth" - should suggest "authentication", "authorize"
- Verify suggestions ranked by frequency
- Test with partial words
- Check autocomplete latency < 50ms

---

### Task 5.10: Implement Anomaly Detection for Analytics
**Files:** NEW `anomaly-detection.service.ts`  
**Effort:** 2 days

**Implementation:**
```typescript
class AnomalyDetectionService {
  async detectAnomalies(userId: string) {
    // Get recent metrics
    const metrics = await this.getMetrics(userId, 30); // Last 30 days

    const anomalies = [];

    // Check for unusual patterns
    if (this.isAnomalous(metrics.requestRate, metrics.historicalRate)) {
      anomalies.push({
        type: 'request_rate',
        severity: 'high',
        message: 'Unusual request rate detected'
      });
    }

    if (this.isAnomalous(metrics.errorRate, metrics.historicalErrorRate)) {
      anomalies.push({
        type: 'error_rate',
        severity: 'critical',
        message: 'Error rate spike detected'
      });
    }

    if (this.isAnomalous(metrics.tokenUsage, metrics.historicalTokenUsage)) {
      anomalies.push({
        type: 'token_usage',
        severity: 'medium',
        message: 'Unusual token usage pattern'
      });
    }

    return anomalies;
  }

  isAnomalous(current: number, historical: number[]): boolean {
    const mean = historical.reduce((a, b) => a + b, 0) / historical.length;
    const stdDev = Math.sqrt(
      historical.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / historical.length
    );

    // Z-score > 3 is anomalous
    const zScore = Math.abs((current - mean) / stdDev);
    return zScore > 3;
  }
}
```

**Verification:**
- Create normal usage pattern
- Introduce spike (10x requests)
- Verify anomaly detected
- Check alert sent
- Test with different metrics

---

## ✅ STAGE 5 VERIFICATION CHECKLIST

### ML Features
- [ ] Silero VAD reduces false positives
- [ ] RAG retrieves relevant memories
- [ ] Semantic search finds related content
- [ ] Embeddings generated correctly

### Search
- [ ] Faceted search filters work
- [ ] Autocomplete suggests queries
- [ ] Search latency < 200ms
- [ ] Relevance improved

### Caching
- [ ] Tiered cache promotes items
- [ ] Predictive warming improves hit rate
- [ ] Cache hit rate > 80%
- [ ] Memory usage controlled

### Analytics
- [ ] Anomalies detected
- [ ] Alerts sent
- [ ] False positive rate low
- [ ] Detection latency < 1 minute

---

**END OF STAGE 5**
