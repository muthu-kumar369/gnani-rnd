# Stage 7: Advanced Features & Polish

**Priority:** P2 (Important for Scale)  
**Duration:** 7 days  
**Dependencies:** All previous stages (builds on complete foundation)  
**Current Completion:** 60%

---

## Context & Background

### Current State Analysis

**✅ What Exists:**
- Vector search (ChromaDB)
- Session persistence
- Memory management
- Tool execution framework
- Intent classification
- Action dispatching

**❌ What's Missing:**
- **Hybrid search** (semantic + keyword)
- **Multi-step planning**
- **Cross-conversation memory linking**
- **Session replay for debugging**
- **Advanced analytics**
- **Open-source model backend support** (llama.cpp, vLLM, LocalAI)
- **Prompt versioning and A/B testing**

### Why This Matters

These advanced features enable:
- **Better search results** with hybrid approach
- **Complex task handling** with multi-step planning
- **Contextual awareness** across conversations
- **Easier debugging** with session replay
- **Data-driven improvements** with analytics
- **Flexibility** in model backends

---

## Objectives

### Primary Goals

1. **Hybrid Search** - Combine semantic and keyword search
2. **Multi-Step Planning** - Handle complex multi-step tasks
3. **Cross-Conversation Memory** - Link related conversations
4. **Session Replay** - Debug and analyze sessions
5. **Advanced Analytics** - Insights and optimization
6. **Multi-Backend Support** - Support various open-source model servers

### Success Criteria

- [ ] Hybrid search improving retrieval accuracy by 20%
- [ ] Multi-step planning handling 3+ step tasks
- [ ] Cross-conversation memory working
- [ ] Session replay functional
- [ ] Analytics dashboard showing insights
- [ ] 3+ model backends supported
- [ ] Documentation complete

---

## Technical Requirements

### 1. Hybrid Search (Days 1-2)

#### Implementation

Create `src/modules/search/hybrid-search.service.ts`:

```typescript
import { VectorManager } from '@/modules/vector/vector.manager';
import { Logger } from '@/core/logger/logger';

interface SearchResult {
  id: string;
  content: string;
  score: number;
  metadata: any;
}

export class HybridSearchService {
  private readonly logger = new Logger('HybridSearch');

  constructor(private readonly vectorManager: VectorManager) {}

  /**
   * Hybrid search combining semantic and keyword search
   */
  async search(
    query: string,
    options: {
      limit?: number;
      semanticWeight?: number;  // 0-1, weight for semantic search
      keywordWeight?: number;   // 0-1, weight for keyword search
      filters?: Record<string, any>;
    } = {}
  ): Promise<SearchResult[]> {
    const {
      limit = 10,
      semanticWeight = 0.7,
      keywordWeight = 0.3,
      filters = {},
    } = options;

    // Perform both searches in parallel
    const [semanticResults, keywordResults] = await Promise.all([
      this.semanticSearch(query, limit * 2, filters),
      this.keywordSearch(query, limit * 2, filters),
    ]);

    // Combine and re-rank results
    const combined = this.combineResults(
      semanticResults,
      keywordResults,
      semanticWeight,
      keywordWeight
    );

    // Return top results
    return combined.slice(0, limit);
  }

  /**
   * Semantic search using embeddings
   */
  private async semanticSearch(
    query: string,
    limit: number,
    filters: Record<string, any>
  ): Promise<SearchResult[]> {
    const results = await this.vectorManager.search(query, limit, filters);
    
    return results.map(r => ({
      id: r.id,
      content: r.document,
      score: r.distance,
      metadata: r.metadata,
    }));
  }

  /**
   * Keyword search using BM25
   */
  private async keywordSearch(
    query: string,
    limit: number,
    filters: Record<string, any>
  ): Promise<SearchResult[]> {
    // Tokenize query
    const tokens = this.tokenize(query);

    // Get documents (from database or cache)
    const documents = await this.getDocuments(filters);

    // Calculate BM25 scores
    const scores = documents.map(doc => ({
      ...doc,
      score: this.calculateBM25(tokens, doc.content, documents),
    }));

    // Sort by score and return top results
    return scores
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Combine results from semantic and keyword search
   */
  private combineResults(
    semanticResults: SearchResult[],
    keywordResults: SearchResult[],
    semanticWeight: number,
    keywordWeight: number
  ): SearchResult[] {
    // Create a map of all unique results
    const resultMap = new Map<string, SearchResult>();

    // Add semantic results
    for (const result of semanticResults) {
      resultMap.set(result.id, {
        ...result,
        score: result.score * semanticWeight,
      });
    }

    // Add/merge keyword results
    for (const result of keywordResults) {
      if (resultMap.has(result.id)) {
        // Combine scores
        const existing = resultMap.get(result.id)!;
        existing.score += result.score * keywordWeight;
      } else {
        resultMap.set(result.id, {
          ...result,
          score: result.score * keywordWeight,
        });
      }
    }

    // Convert to array and sort by combined score
    return Array.from(resultMap.values())
      .sort((a, b) => b.score - a.score);
  }

  /**
   * Tokenize text for keyword search
   */
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(token => token.length > 2);
  }

  /**
   * Calculate BM25 score
   */
  private calculateBM25(
    queryTokens: string[],
    document: string,
    corpus: any[],
    k1: number = 1.5,
    b: number = 0.75
  ): number {
    const docTokens = this.tokenize(document);
    const docLength = docTokens.length;
    const avgDocLength = corpus.reduce((sum, doc) => 
      sum + this.tokenize(doc.content).length, 0) / corpus.length;

    let score = 0;

    for (const token of queryTokens) {
      const termFreq = docTokens.filter(t => t === token).length;
      const docFreq = corpus.filter(doc => 
        this.tokenize(doc.content).includes(token)).length;
      
      const idf = Math.log((corpus.length - docFreq + 0.5) / (docFreq + 0.5) + 1);
      const tf = (termFreq * (k1 + 1)) / 
        (termFreq + k1 * (1 - b + b * (docLength / avgDocLength)));
      
      score += idf * tf;
    }

    return score;
  }

  private async getDocuments(filters: Record<string, any>): Promise<any[]> {
    // Fetch documents from database
    // This is a placeholder - implement based on your data source
    return [];
  }
}
```

---

### 2. Multi-Step Planning (Days 3-4)

Create `src/modules/planner/multi-step-planner.service.ts`:

```typescript
import { LLMService } from '@/modules/llm/llm.service';
import { ToolService } from '@/modules/tool/tool.service';
import { Logger } from '@/core/logger/logger';

interface PlanStep {
  id: string;
  description: string;
  tool?: string;
  parameters?: any;
  dependencies: string[];
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: any;
  error?: string;
}

interface Plan {
  id: string;
  goal: string;
  steps: PlanStep[];
  status: 'planning' | 'executing' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
}

export class MultiStepPlannerService {
  private readonly logger = new Logger('MultiStepPlanner');

  constructor(
    private readonly llmService: LLMService,
    private readonly toolService: ToolService
  ) {}

  /**
   * Create a multi-step plan for a complex goal
   */
  async createPlan(goal: string, context: any): Promise<Plan> {
    this.logger.info(`Creating plan for goal: ${goal}`);

    // Use LLM to generate plan
    const planPrompt = this.buildPlanningPrompt(goal, context);
    const response = await this.llmService.generateResponse({
      messages: [{ role: 'user', content: planPrompt }],
      model: 'llama3.1',
      temperature: 0.3, // Lower temperature for more deterministic planning
    });

    // Parse plan from LLM response
    const steps = this.parsePlan(response.content);

    const plan: Plan = {
      id: this.generatePlanId(),
      goal,
      steps,
      status: 'planning',
      createdAt: new Date(),
    };

    return plan;
  }

  /**
   * Execute a multi-step plan
   */
  async executePlan(plan: Plan): Promise<Plan> {
    this.logger.info(`Executing plan: ${plan.id}`);
    plan.status = 'executing';

    try {
      // Execute steps in dependency order
      const completed = new Set<string>();

      while (completed.size < plan.steps.length) {
        // Find steps ready to execute
        const ready = plan.steps.filter(step =>
          step.status === 'pending' &&
          step.dependencies.every(dep => completed.has(dep))
        );

        if (ready.length === 0) {
          throw new Error('No steps ready to execute - possible circular dependency');
        }

        // Execute ready steps in parallel
        await Promise.all(ready.map(step => this.executeStep(step, plan)));

        // Mark completed steps
        ready.forEach(step => {
          if (step.status === 'completed') {
            completed.add(step.id);
          }
        });
      }

      plan.status = 'completed';
      plan.completedAt = new Date();
    } catch (error) {
      this.logger.error('Plan execution failed', error);
      plan.status = 'failed';
      throw error;
    }

    return plan;
  }

  /**
   * Execute a single step
   */
  private async executeStep(step: PlanStep, plan: Plan): Promise<void> {
    this.logger.info(`Executing step: ${step.description}`);
    step.status = 'running';

    try {
      if (step.tool) {
        // Execute tool
        step.result = await this.toolService.execute(step.tool, step.parameters);
      } else {
        // Execute with LLM
        const response = await this.llmService.generateResponse({
          messages: [
            { role: 'system', content: 'You are executing a step in a multi-step plan.' },
            { role: 'user', content: step.description },
          ],
          model: 'llama3.1',
        });
        step.result = response.content;
      }

      step.status = 'completed';
    } catch (error) {
      this.logger.error(`Step execution failed: ${step.description}`, error);
      step.status = 'failed';
      step.error = error.message;
      throw error;
    }
  }

  /**
   * Build planning prompt
   */
  private buildPlanningPrompt(goal: string, context: any): string {
    return `
You are a task planner. Break down the following goal into a series of steps.

Goal: ${goal}

Context:
${JSON.stringify(context, null, 2)}

Available tools:
- search: Search for information
- calculate: Perform calculations
- write_file: Write content to a file
- read_file: Read content from a file

Instructions:
1. Break down the goal into 3-7 concrete steps
2. For each step, specify:
   - A clear description
   - The tool to use (if applicable)
   - Parameters for the tool
   - Dependencies on other steps (by step number)

Format your response as JSON:
{
  "steps": [
    {
      "id": "step-1",
      "description": "...",
      "tool": "search",
      "parameters": {...},
      "dependencies": []
    },
    ...
  ]
}
    `.trim();
  }

  /**
   * Parse plan from LLM response
   */
  private parsePlan(response: string): PlanStep[] {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      return parsed.steps.map((step: any) => ({
        ...step,
        status: 'pending' as const,
      }));
    } catch (error) {
      this.logger.error('Failed to parse plan', error);
      throw new Error('Failed to parse plan from LLM response');
    }
  }

  private generatePlanId(): string {
    return `plan-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
```

---

### 3. Cross-Conversation Memory (Day 5)

Create `src/modules/memory/cross-conversation-memory.service.ts`:

```typescript
import { VectorManager } from '@/modules/vector/vector.manager';
import { Logger } from '@/core/logger/logger';

interface ConversationLink {
  conversationId: string;
  relevance: number;
  sharedTopics: string[];
  timestamp: Date;
}

export class CrossConversationMemoryService {
  private readonly logger = new Logger('CrossConversationMemory');

  constructor(private readonly vectorManager: VectorManager) {}

  /**
   * Find related conversations
   */
  async findRelatedConversations(
    currentConversationId: string,
    userId: string,
    limit: number = 5
  ): Promise<ConversationLink[]> {
    // Get current conversation summary
    const currentSummary = await this.getConversationSummary(currentConversationId);

    // Search for similar conversations
    const results = await this.vectorManager.search(
      currentSummary,
      limit,
      { userId, conversationId: { $ne: currentConversationId } }
    );

    // Convert to conversation links
    return results.map(r => ({
      conversationId: r.metadata.conversationId,
      relevance: r.distance,
      sharedTopics: this.extractSharedTopics(currentSummary, r.document),
      timestamp: new Date(r.metadata.timestamp),
    }));
  }

  /**
   * Get conversation summary
   */
  private async getConversationSummary(conversationId: string): Promise<string> {
    // Fetch from database or cache
    // This is a placeholder
    return '';
  }

  /**
   * Extract shared topics between conversations
   */
  private extractSharedTopics(summary1: string, summary2: string): string[] {
    // Simple keyword extraction
    const keywords1 = this.extractKeywords(summary1);
    const keywords2 = this.extractKeywords(summary2);

    return keywords1.filter(k => keywords2.includes(k));
  }

  private extractKeywords(text: string): string[] {
    // Simple keyword extraction (can be enhanced with NLP)
    return text
      .toLowerCase()
      .split(/\W+/)
      .filter(word => word.length > 4)
      .slice(0, 10);
  }
}
```

---

### 4. Session Replay (Day 6)

Create `src/modules/session/session-replay.service.ts`:

```typescript
import { Logger } from '@/core/logger/logger';

interface SessionEvent {
  timestamp: Date;
  type: 'audio_input' | 'transcript' | 'llm_request' | 'llm_response' | 'tool_execution' | 'state_change';
  data: any;
}

export class SessionReplayService {
  private readonly logger = new Logger('SessionReplay');

  /**
   * Record session event
   */
  async recordEvent(sessionId: string, event: SessionEvent): Promise<void> {
    // Store in database
    await this.saveEvent(sessionId, event);
  }

  /**
   * Replay session
   */
  async replaySession(sessionId: string, speed: number = 1.0): Promise<void> {
    const events = await this.getEvents(sessionId);

    this.logger.info(`Replaying session ${sessionId} with ${events.length} events`);

    let previousTimestamp: Date | null = null;

    for (const event of events) {
      if (previousTimestamp) {
        const delay = (event.timestamp.getTime() - previousTimestamp.getTime()) / speed;
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      this.logger.info(`[${event.type}]`, event.data);
      previousTimestamp = event.timestamp;
    }
  }

  private async saveEvent(sessionId: string, event: SessionEvent): Promise<void> {
    // Save to database
  }

  private async getEvents(sessionId: string): Promise<SessionEvent[]> {
    // Fetch from database
    return [];
  }
}
```

---

### 5. Open-Source Model Backend Support (Day 7)

Create provider interfaces for multiple backends:

```typescript
// src/core/llm/providers/llamacpp.provider.ts
import { LLMProvider } from '../llm.interface';

export class LlamaCppProvider implements LLMProvider {
  constructor(private readonly baseUrl: string) {}

  async generateResponse(request: any): Promise<any> {
    // Implement llama.cpp API calls
  }

  async *streamResponse(request: any): AsyncGenerator<any> {
    // Implement streaming
  }
}

// src/core/llm/providers/vllm.provider.ts
export class VLLMProvider implements LLMProvider {
  // Similar implementation for vLLM
}

// src/core/llm/providers/localai.provider.ts
export class LocalAIProvider implements LLMProvider {
  // Similar implementation for LocalAI
}
```

Update LLM manager to support multiple providers:

```typescript
// src/core/llm/llm.manager.ts
export class LLMManager {
  private providers = new Map<string, LLMProvider>();

  registerProvider(name: string, provider: LLMProvider): void {
    this.providers.set(name, provider);
  }

  getProvider(name: string): LLMProvider {
    const provider = this.providers.get(name);
    if (!provider) {
      throw new Error(`Provider not found: ${name}`);
    }
    return provider;
  }
}
```

---

## Implementation Checklist

### Days 1-2: Hybrid Search
- [ ] Implement semantic search
- [ ] Implement keyword search (BM25)
- [ ] Combine results with weighting
- [ ] Test search accuracy
- [ ] Benchmark performance

### Days 3-4: Multi-Step Planning
- [ ] Implement plan generation
- [ ] Implement plan execution
- [ ] Handle dependencies
- [ ] Test with complex tasks
- [ ] Document planning system

### Day 5: Cross-Conversation Memory
- [ ] Implement conversation linking
- [ ] Find related conversations
- [ ] Extract shared topics
- [ ] Test relevance scoring
- [ ] Document memory system

### Day 6: Session Replay
- [ ] Implement event recording
- [ ] Implement replay functionality
- [ ] Add replay controls
- [ ] Test with real sessions
- [ ] Document replay system

### Day 7: Multi-Backend Support
- [ ] Implement llama.cpp provider
- [ ] Implement vLLM provider
- [ ] Implement LocalAI provider
- [ ] Test provider switching
- [ ] Document provider system

---

## Success Metrics

- [ ] Hybrid search 20% more accurate
- [ ] Multi-step planning handling 3+ steps
- [ ] Cross-conversation memory working
- [ ] Session replay functional
- [ ] 3+ model backends supported
- [ ] Documentation complete

---

**Estimated Effort:** 7 days  
**Complexity:** High  
**Risk:** Low (advanced features are additive)
