# Stage 3: Advanced Features

**Priority:** P2 (Enhancement)  
**Duration:** 5-7 days  
**Dependencies:** Stages 1-2  
**Effort:** 40-56 hours

---

## Context & Background

### Current State

Stage 7 (Advanced Features) from the original Phase 2 plan is only 30% complete:

**Implemented:**
- ⚠️ Session replay service exists but incomplete (`src/modules/session/session-replay.service.ts`)

**Missing:**
- ❌ Hybrid search (semantic + BM25 keyword)
- ❌ Multi-step planning framework
- ❌ Cross-conversation memory linking
- ❌ Multi-backend support (llama.cpp, vLLM, LocalAI)

### Why This Matters

These features enable:
- **Better Search:** Hybrid search combines semantic understanding with keyword precision
- **Complex Tasks:** Multi-step planning handles tasks requiring multiple actions
- **Continuity:** Cross-conversation memory provides context across sessions
- **Flexibility:** Multi-backend support allows model selection based on needs

---

## Objectives

### Primary Goals

1. **Implement Hybrid Search** - Combine semantic and keyword search
2. **Build Multi-step Planner** - Handle complex multi-action tasks
3. **Enable Cross-conversation Memory** - Link related conversations
4. **Complete Session Replay** - Full debugging and analysis capability
5. **Add Multi-backend Support** - Support llama.cpp, vLLM, LocalAI

### Success Criteria

- [ ] Hybrid search 20% more accurate than semantic alone
- [ ] Multi-step planner handles 3+ step tasks
- [ ] Cross-conversation memory finds relevant context
- [ ] Session replay fully functional
- [ ] 3+ LLM backends supported and tested

---

## Technical Requirements

### 1. Hybrid Search (Semantic + BM25)

#### Implementation Steps

**Step 1: Install BM25 Library**

```bash
npm install natural
npm install --save-dev @types/natural
```

**Step 2: Create BM25 Search Service**

File: `src/modules/search/bm25-search.service.ts`

```typescript
import natural from 'natural';
import { createContextualLogger } from '../../core/logger/logger.js';

const TfIdf = natural.TfIdf;

export interface SearchDocument {
    id: string;
    content: string;
    metadata?: Record<string, any>;
}

export class BM25SearchService {
    private readonly logger = createContextualLogger({ module: 'BM25Search' });
    private tfidf: any;
    private documents: Map<string, SearchDocument> = new Map();

    constructor() {
        this.tfidf = new TfIdf();
    }

    /**
     * Index documents for BM25 search
     */
    indexDocuments(documents: SearchDocument[]): void {
        this.documents.clear();
        this.tfidf = new TfIdf();

        for (const doc of documents) {
            this.documents.set(doc.id, doc);
            this.tfidf.addDocument(doc.content);
        }

        this.logger.info(`Indexed ${documents.length} documents for BM25 search`);
    }

    /**
     * Search using BM25 algorithm
     */
    search(query: string, limit: number = 10): Array<{
        id: string;
        score: number;
        document: SearchDocument;
    }> {
        const results: Array<{id: string; score: number; document: SearchDocument}> = [];

        this.tfidf.tfidfs(query, (i: number, measure: number) => {
            const docArray = Array.from(this.documents.values());
            if (i < docArray.length) {
                results.push({
                    id: docArray[i].id,
                    score: measure,
                    document: docArray[i],
                });
            }
        });

        // Sort by score descending and limit
        return results
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);
    }
}
```

**Step 3: Create Hybrid Search Service**

File: `src/modules/search/hybrid-search.service.ts`

```typescript
import { VectorManager } from '../vector/vector.manager.js';
import { BM25SearchService, SearchDocument } from './bm25-search.service.js';
import { createContextualLogger } from '../../core/logger/logger.js';

export interface HybridSearchResult {
    id: string;
    content: string;
    score: number;
    semanticScore: number;
    keywordScore: number;
    metadata?: Record<string, any>;
}

export class HybridSearchService {
    private readonly logger = createContextualLogger({ module: 'HybridSearch' });
    private bm25: BM25SearchService;

    constructor(
        private readonly vectorManager: VectorManager,
        private readonly semanticWeight: number = 0.7, // 70% semantic, 30% keyword
    ) {
        this.bm25 = new BM25SearchService();
    }

    /**
     * Index documents for hybrid search
     */
    async indexDocuments(documents: SearchDocument[]): Promise<void> {
        // Index for BM25
        this.bm25.indexDocuments(documents);

        // Index for semantic search (already done via VectorManager)
        this.logger.info(`Indexed ${documents.length} documents for hybrid search`);
    }

    /**
     * Perform hybrid search combining semantic and keyword
     */
    async search(
        query: string,
        limit: number = 10,
        collection: string = 'conversations'
    ): Promise<HybridSearchResult[]> {
        // Get semantic search results
        const semanticResults = await this.vectorManager.search(query, limit * 2, collection);

        // Get BM25 keyword results
        const keywordResults = this.bm25.search(query, limit * 2);

        // Combine and re-rank
        const combined = this.combineResults(semanticResults, keywordResults);

        // Sort by combined score and limit
        return combined
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);
    }

    /**
     * Combine semantic and keyword results with weighted scoring
     */
    private combineResults(
        semanticResults: any[],
        keywordResults: any[]
    ): HybridSearchResult[] {
        const resultMap = new Map<string, HybridSearchResult>();

        // Normalize and add semantic results
        const maxSemanticScore = Math.max(...semanticResults.map(r => r.score || 1));
        for (const result of semanticResults) {
            const normalizedScore = (result.score || 0) / maxSemanticScore;
            resultMap.set(result.id, {
                id: result.id,
                content: result.content || result.text,
                score: normalizedScore * this.semanticWeight,
                semanticScore: normalizedScore,
                keywordScore: 0,
                metadata: result.metadata,
            });
        }

        // Normalize and add keyword results
        const maxKeywordScore = Math.max(...keywordResults.map(r => r.score || 1));
        for (const result of keywordResults) {
            const normalizedScore = (result.score || 0) / maxKeywordScore;
            const existing = resultMap.get(result.id);

            if (existing) {
                // Combine scores
                existing.keywordScore = normalizedScore;
                existing.score += normalizedScore * (1 - this.semanticWeight);
            } else {
                // Add new result
                resultMap.set(result.id, {
                    id: result.id,
                    content: result.document.content,
                    score: normalizedScore * (1 - this.semanticWeight),
                    semanticScore: 0,
                    keywordScore: normalizedScore,
                    metadata: result.document.metadata,
                });
            }
        }

        return Array.from(resultMap.values());
    }
}
```

**Step 4: Integrate into Memory Manager**

Update `src/modules/memory/memory.manager.ts`:

```typescript
import { HybridSearchService } from '../search/hybrid-search.service.js';

export class MemoryManager {
    private hybridSearch: HybridSearchService;

    constructor(
        private readonly vectorManager: VectorManager,
        // ... other dependencies
    ) {
        this.hybridSearch = new HybridSearchService(vectorManager);
    }

    /**
     * Search memories using hybrid search
     */
    async searchMemories(
        query: string,
        userId: string,
        limit: number = 5
    ): Promise<any[]> {
        // Use hybrid search instead of just semantic
        const results = await this.hybridSearch.search(
            query,
            limit,
            `user_${userId}_memories`
        );

        this.logger.info('Hybrid search results', {
            query,
            resultCount: results.length,
            avgSemanticScore: results.reduce((sum, r) => sum + r.semanticScore, 0) / results.length,
            avgKeywordScore: results.reduce((sum, r) => sum + r.keywordScore, 0) / results.length,
        });

        return results;
    }
}
```

**Testing:**

```typescript
describe('Hybrid Search', () => {
    it('should combine semantic and keyword results', async () => {
        const documents = [
            { id: '1', content: 'Machine learning algorithms' },
            { id: '2', content: 'Deep neural networks' },
            { id: '3', content: 'ML models and algorithms' },
        ];

        await hybridSearch.indexDocuments(documents);

        const results = await hybridSearch.search('machine learning', 3);

        expect(results).toHaveLength(3);
        expect(results[0].score).toBeGreaterThan(0);
        expect(results[0].semanticScore).toBeGreaterThan(0);
        expect(results[0].keywordScore).toBeGreaterThan(0);
    });
});
```

---

### 2. Multi-step Planning Framework

#### Implementation Steps

**Step 1: Create Planner Service**

File: `src/modules/planner/multi-step-planner.service.ts`

```typescript
import { createContextualLogger } from '../../core/logger/logger.js';
import { LLMService } from '../llm/llm.service.js';
import { ToolService } from '../tool/tool.service.js';

export interface PlanStep {
    id: string;
    action: string;
    tool?: string;
    parameters?: Record<string, any>;
    dependencies: string[];
    status: 'pending' | 'executing' | 'completed' | 'failed';
    result?: any;
    error?: string;
}

export interface Plan {
    id: string;
    goal: string;
    steps: PlanStep[];
    status: 'planning' | 'executing' | 'completed' | 'failed';
    currentStep: number;
}

export class MultiStepPlannerService {
    private readonly logger = createContextualLogger({ module: 'MultiStepPlanner' });

    constructor(
        private readonly llmService: LLMService,
        private readonly toolService: ToolService
    ) {}

    /**
     * Create a plan for achieving a goal
     */
    async createPlan(goal: string, context?: string): Promise<Plan> {
        this.logger.info('Creating plan for goal', { goal });

        const planningPrompt = `
You are a task planner. Break down the following goal into specific, actionable steps.

Goal: ${goal}
${context ? `Context: ${context}` : ''}

Available tools:
${this.getAvailableToolsDescription()}

Create a step-by-step plan. For each step, specify:
1. Action description
2. Tool to use (if applicable)
3. Parameters for the tool
4. Dependencies on previous steps (by step number)

Format your response as JSON:
{
  "steps": [
    {
      "action": "description",
      "tool": "tool_name",
      "parameters": {},
      "dependencies": []
    }
  ]
}
`;

        const response = await this.llmService.getLlmResponse({
            messages: [{ role: 'user', content: planningPrompt }],
            model: 'llama3.1',
            temperature: 0.3, // Lower temperature for more deterministic planning
        });

        const planData = JSON.parse(response.text);

        const plan: Plan = {
            id: `plan-${Date.now()}`,
            goal,
            steps: planData.steps.map((step: any, index: number) => ({
                id: `step-${index}`,
                action: step.action,
                tool: step.tool,
                parameters: step.parameters,
                dependencies: step.dependencies.map((d: number) => `step-${d}`),
                status: 'pending',
            })),
            status: 'planning',
            currentStep: 0,
        };

        this.logger.info('Plan created', {
            planId: plan.id,
            stepCount: plan.steps.length,
        });

        return plan;
    }

    /**
     * Execute a plan step by step
     */
    async executePlan(plan: Plan, sessionId: string): Promise<Plan> {
        plan.status = 'executing';

        for (let i = 0; i < plan.steps.length; i++) {
            const step = plan.steps[i];

            // Check dependencies
            const dependenciesMet = step.dependencies.every(depId => {
                const depStep = plan.steps.find(s => s.id === depId);
                return depStep?.status === 'completed';
            });

            if (!dependenciesMet) {
                this.logger.warn('Step dependencies not met', {
                    stepId: step.id,
                    dependencies: step.dependencies,
                });
                continue;
            }

            // Execute step
            step.status = 'executing';
            plan.currentStep = i;

            try {
                if (step.tool) {
                    // Execute tool
                    const result = await this.toolService.executeTool(
                        step.tool,
                        step.parameters || {},
                        sessionId
                    );
                    step.result = result.output;
                } else {
                    // Execute as LLM task
                    const response = await this.llmService.getLlmResponse({
                        messages: [{ role: 'user', content: step.action }],
                        model: 'llama3.1',
                    });
                    step.result = response.text;
                }

                step.status = 'completed';
                this.logger.info('Step completed', {
                    stepId: step.id,
                    action: step.action,
                });
            } catch (error: any) {
                step.status = 'failed';
                step.error = error.message;
                this.logger.error('Step failed', {
                    stepId: step.id,
                    error: error.message,
                });

                // Decide whether to continue or abort
                if (this.isStepCritical(step)) {
                    plan.status = 'failed';
                    break;
                }
            }
        }

        // Check if all steps completed
        const allCompleted = plan.steps.every(s => s.status === 'completed');
        plan.status = allCompleted ? 'completed' : 'failed';

        return plan;
    }

    private getAvailableToolsDescription(): string {
        // Get list of available tools
        const tools = this.toolService.getAvailableTools();
        return tools.map(t => `- ${t.name}: ${t.description}`).join('\n');
    }

    private isStepCritical(step: PlanStep): boolean {
        // Determine if step failure should abort the plan
        // For now, treat all steps as critical
        return true;
    }
}
```

**Step 2: Integrate into Session Coordinator**

Update `src/modules/session/session.coordinator.ts`:

```typescript
import { MultiStepPlannerService } from '../planner/multi-step-planner.service.js';

export class SessionCoordinator {
    private planner: MultiStepPlannerService;

    constructor(/* ... */) {
        this.planner = new MultiStepPlannerService(llmService, toolService);
    }

    /**
     * Handle complex multi-step requests
     */
    async handleComplexRequest(
        sessionId: string,
        request: string
    ): Promise<void> {
        // Detect if request requires multi-step planning
        if (this.requiresPlanning(request)) {
            this.logger.info('Creating multi-step plan', { sessionId, request });

            // Create plan
            const plan = await this.planner.createPlan(request);

            // Execute plan
            const executedPlan = await this.planner.executePlan(plan, sessionId);

            // Send results back
            const summary = this.summarizePlan(executedPlan);
            await this.sendResponse(sessionId, summary);
        } else {
            // Handle as normal request
            await this.processNormalRequest(sessionId, request);
        }
    }

    private requiresPlanning(request: string): boolean {
        // Simple heuristic: check for multi-step indicators
        const indicators = [
            'first.*then',
            'after.*do',
            'step by step',
            'multiple',
            'and then',
        ];

        return indicators.some(pattern =>
            new RegExp(pattern, 'i').test(request)
        );
    }

    private summarizePlan(plan: Plan): string {
        const completedSteps = plan.steps.filter(s => s.status === 'completed');
        const results = completedSteps.map(s => s.result).join('\n\n');

        return `I completed the following steps:\n${results}`;
    }
}
```

**Testing:**

```typescript
describe('Multi-step Planner', () => {
    it('should create and execute a plan', async () => {
        const goal = 'Get the weather in London and then search for umbrella stores';

        const plan = await planner.createPlan(goal);

        expect(plan.steps).toHaveLength(2);
        expect(plan.steps[0].tool).toBe('get_weather');
        expect(plan.steps[1].tool).toBe('search_web');
        expect(plan.steps[1].dependencies).toContain('step-0');

        const executed = await planner.executePlan(plan, 'test-session');

        expect(executed.status).toBe('completed');
        expect(executed.steps[0].status).toBe('completed');
        expect(executed.steps[1].status).toBe('completed');
    });
});
```

---

### 3. Cross-conversation Memory Linking

#### Implementation Steps

**Step 1: Create Memory Linking Service**

File: `src/modules/memory/memory-linking.service.ts`

```typescript
import { createContextualLogger } from '../../core/logger/logger.js';
import { VectorManager } from '../vector/vector.manager.js';

export interface MemoryLink {
    fromConversationId: string;
    toConversationId: string;
    relevance: number;
    sharedTopics: string[];
    timestamp: Date;
}

export class MemoryLinkingService {
    private readonly logger = createContextualLogger({ module: 'MemoryLinking' });

    constructor(private readonly vectorManager: VectorManager) {}

    /**
     * Find related conversations based on content similarity
     */
    async findRelatedConversations(
        conversationId: string,
        userId: string,
        limit: number = 5
    ): Promise<MemoryLink[]> {
        // Get conversation summary
        const summary = await this.getConversationSummary(conversationId);

        // Search for similar conversations
        const results = await this.vectorManager.search(
            summary,
            limit + 1, // +1 to exclude self
            `user_${userId}_conversations`
        );

        // Filter out self and create links
        const links: MemoryLink[] = results
            .filter(r => r.metadata?.conversationId !== conversationId)
            .slice(0, limit)
            .map(r => ({
                fromConversationId: conversationId,
                toConversationId: r.metadata?.conversationId,
                relevance: r.score || 0,
                sharedTopics: this.extractSharedTopics(summary, r.content),
                timestamp: new Date(),
            }));

        this.logger.info('Found related conversations', {
            conversationId,
            relatedCount: links.length,
        });

        return links;
    }

    /**
     * Get enriched context from related conversations
     */
    async getEnrichedContext(
        conversationId: string,
        userId: string,
        query: string
    ): Promise<string> {
        // Find related conversations
        const links = await this.findRelatedConversations(conversationId, userId, 3);

        if (links.length === 0) {
            return '';
        }

        // Get relevant excerpts from related conversations
        const excerpts: string[] = [];

        for (const link of links) {
            const excerpt = await this.getRelevantExcerpt(
                link.toConversationId,
                query
            );

            if (excerpt) {
                excerpts.push(
                    `From previous conversation (${link.sharedTopics.join(', ')}):\n${excerpt}`
                );
            }
        }

        return excerpts.join('\n\n');
    }

    private async getConversationSummary(conversationId: string): Promise<string> {
        // Get conversation messages and create summary
        // This would integrate with conversation service
        return 'Conversation summary placeholder';
    }

    private async getRelevantExcerpt(
        conversationId: string,
        query: string
    ): Promise<string> {
        // Search within specific conversation for relevant content
        const results = await this.vectorManager.search(
            query,
            1,
            `conversation_${conversationId}`
        );

        return results[0]?.content || '';
    }

    private extractSharedTopics(text1: string, text2: string): string[] {
        // Simple topic extraction (could be enhanced with NLP)
        const words1 = new Set(text1.toLowerCase().split(/\s+/));
        const words2 = new Set(text2.toLowerCase().split(/\s+/));

        const shared: string[] = [];
        for (const word of words1) {
            if (words2.has(word) && word.length > 4) {
                shared.push(word);
            }
        }

        return shared.slice(0, 3); // Top 3 shared topics
    }
}
```

**Step 2: Integrate into Context Builder**

Update `src/modules/session/context.builder.ts`:

```typescript
import { MemoryLinkingService } from '../memory/memory-linking.service.js';

export class ContextBuilder {
    private memoryLinking: MemoryLinkingService;

    constructor(/* ... */) {
        this.memoryLinking = new MemoryLinkingService(vectorManager);
    }

    async buildContext(
        sessionId: string,
        conversationId: string,
        userId: string,
        currentMessage: string
    ): Promise<string> {
        const contextParts: string[] = [];

        // Add system prompt
        contextParts.push(await this.getSystemPrompt(conversationId));

        // Add recent messages
        contextParts.push(await this.getRecentMessages(conversationId));

        // Add relevant memories
        contextParts.push(await this.getRelevantMemories(userId, currentMessage));

        // NEW: Add cross-conversation context
        const enrichedContext = await this.memoryLinking.getEnrichedContext(
            conversationId,
            userId,
            currentMessage
        );

        if (enrichedContext) {
            contextParts.push(`\n## Related Context:\n${enrichedContext}`);
        }

        return contextParts.join('\n\n');
    }
}
```

**Testing:**

```typescript
describe('Memory Linking', () => {
    it('should find related conversations', async () => {
        const links = await memoryLinking.findRelatedConversations(
            'conv-1',
            'user-123',
            5
        );

        expect(links.length).toBeGreaterThan(0);
        expect(links[0].relevance).toBeGreaterThan(0);
        expect(links[0].sharedTopics.length).toBeGreaterThan(0);
    });

    it('should enrich context with related conversations', async () => {
        const context = await memoryLinking.getEnrichedContext(
            'conv-1',
            'user-123',
            'What did we discuss about AI?'
        );

        expect(context).toContain('From previous conversation');
    });
});
```

---

### 4. Complete Session Replay

#### Implementation Steps

**Step 1: Enhance Session Replay Service**

Update `src/modules/session/session-replay.service.ts`:

```typescript
import { createContextualLogger } from '../../core/logger/logger.js';
import { SessionPersistence } from './session.persistence.js';

export interface ReplayEvent {
    timestamp: Date;
    type: 'audio' | 'transcript' | 'llm_request' | 'llm_response' | 'tool_execution' | 'state_change';
    data: any;
}

export interface SessionReplay {
    sessionId: string;
    userId: string;
    startTime: Date;
    endTime?: Date;
    events: ReplayEvent[];
    metadata: {
        totalDuration: number;
        eventCount: number;
        audioChunks: number;
        llmRequests: number;
        toolExecutions: number;
    };
}

export class SessionReplayService {
    private readonly logger = createContextualLogger({ module: 'SessionReplay' });

    constructor(private readonly sessionPersistence: SessionPersistence) {}

    /**
     * Record an event for replay
     */
    async recordEvent(
        sessionId: string,
        type: ReplayEvent['type'],
        data: any
    ): Promise<void> {
        const event: ReplayEvent = {
            timestamp: new Date(),
            type,
            data,
        };

        // Store event in session persistence
        await this.sessionPersistence.appendEvent(sessionId, event);
    }

    /**
     * Get full session replay
     */
    async getReplay(sessionId: string): Promise<SessionReplay> {
        const session = await this.sessionPersistence.loadSession(sessionId);
        const events = await this.sessionPersistence.getEvents(sessionId);

        const replay: SessionReplay = {
            sessionId,
            userId: session.userId,
            startTime: session.createdAt,
            endTime: session.endedAt,
            events,
            metadata: this.calculateMetadata(events),
        };

        return replay;
    }

    /**
     * Replay session at specific speed
     */
    async* replaySession(
        sessionId: string,
        speed: number = 1.0
    ): AsyncGenerator<ReplayEvent> {
        const replay = await this.getReplay(sessionId);

        for (let i = 0; i < replay.events.length; i++) {
            const event = replay.events[i];
            const nextEvent = replay.events[i + 1];

            yield event;

            // Wait for appropriate time before next event
            if (nextEvent) {
                const delay = (nextEvent.timestamp.getTime() - event.timestamp.getTime()) / speed;
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    private calculateMetadata(events: ReplayEvent[]): SessionReplay['metadata'] {
        return {
            totalDuration: events.length > 0
                ? events[events.length - 1].timestamp.getTime() - events[0].timestamp.getTime()
                : 0,
            eventCount: events.length,
            audioChunks: events.filter(e => e.type === 'audio').length,
            llmRequests: events.filter(e => e.type === 'llm_request').length,
            toolExecutions: events.filter(e => e.type === 'tool_execution').length,
        };
    }
}
```

**Step 2: Integrate Event Recording**

Update `src/modules/session/session.coordinator.ts` to record events:

```typescript
import { SessionReplayService } from './session-replay.service.js';

export class SessionCoordinator {
    private replayService: SessionReplayService;

    async processAudioChunk(/* ... */): Promise<void> {
        // Record audio event
        await this.replayService.recordEvent(sessionId, 'audio', {
            chunkSize: audioChunk.length,
            sampleRate,
        });

        // ... existing processing
    }

    async processTranscript(/* ... */): Promise<void> {
        // Record transcript event
        await this.replayService.recordEvent(sessionId, 'transcript', {
            text: transcript,
            isFinal,
        });

        // ... existing processing
    }

    // Similar for LLM requests, responses, tool executions, state changes
}
```

**Step 3: Create Replay API Endpoint**

File: `src/routes/replay.routes.ts`

```typescript
import { Router } from 'express';
import { SessionReplayService } from '../modules/session/session-replay.service.js';

const router = Router();

router.get('/replay/:sessionId', async (req, res) => {
    const { sessionId } = req.params;
    const replay = await replayService.getReplay(sessionId);
    res.json(replay);
});

router.get('/replay/:sessionId/stream', async (req, res) => {
    const { sessionId } = req.params;
    const speed = parseFloat(req.query.speed as string) || 1.0;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    for await (const event of replayService.replaySession(sessionId, speed)) {
        res.write(`data: ${JSON.stringify(event)}\n\n`);
    }

    res.end();
});

export default router;
```

---

### 5. Multi-backend Support

#### Implementation Steps

**Step 1: Create LLM Provider Interface**

Update `src/core/llm/llm.interface.ts`:

```typescript
export interface LLMProvider {
    name: string;
    generate(request: LLMRequest): Promise<LLMResponse>;
    generateStream(request: LLMRequest): AsyncGenerator<string>;
    isAvailable(): Promise<boolean>;
}
```

**Step 2: Create llama.cpp Provider**

File: `src/core/llm/llamacpp.provider.ts`

```typescript
import { LLMProvider, LLMRequest, LLMResponse } from './llm.interface.js';
import axios from 'axios';

export class LlamaCppProvider implements LLMProvider {
    name = 'llama.cpp';

    constructor(private readonly baseUrl: string = 'http://localhost:8080') {}

    async generate(request: LLMRequest): Promise<LLMResponse> {
        const response = await axios.post(`${this.baseUrl}/completion`, {
            prompt: this.formatMessages(request.messages),
            temperature: request.temperature || 0.7,
            n_predict: request.maxTokens || 512,
        });

        return {
            text: response.data.content,
            tokens: response.data.tokens_evaluated,
            model: request.model,
        };
    }

    async* generateStream(request: LLMRequest): AsyncGenerator<string> {
        // llama.cpp streaming implementation
        const response = await axios.post(`${this.baseUrl}/completion`, {
            prompt: this.formatMessages(request.messages),
            stream: true,
        }, {
            responseType: 'stream',
        });

        for await (const chunk of response.data) {
            yield chunk.toString();
        }
    }

    async isAvailable(): Promise<boolean> {
        try {
            await axios.get(`${this.baseUrl}/health`);
            return true;
        } catch {
            return false;
        }
    }

    private formatMessages(messages: any[]): string {
        return messages.map(m => `${m.role}: ${m.content}`).join('\n');
    }
}
```

**Step 3: Create vLLM Provider**

File: `src/core/llm/vllm.provider.ts`

```typescript
import { LLMProvider, LLMRequest, LLMResponse } from './llm.interface.js';
import axios from 'axios';

export class VLLMProvider implements LLMProvider {
    name = 'vLLM';

    constructor(private readonly baseUrl: string = 'http://localhost:8000') {}

    async generate(request: LLMRequest): Promise<LLMResponse> {
        const response = await axios.post(`${this.baseUrl}/v1/completions`, {
            model: request.model,
            prompt: this.formatMessages(request.messages),
            temperature: request.temperature || 0.7,
            max_tokens: request.maxTokens || 512,
        });

        return {
            text: response.data.choices[0].text,
            tokens: response.data.usage.total_tokens,
            model: request.model,
        };
    }

    async* generateStream(request: LLMRequest): AsyncGenerator<string> {
        const response = await axios.post(`${this.baseUrl}/v1/completions`, {
            model: request.model,
            prompt: this.formatMessages(request.messages),
            stream: true,
        }, {
            responseType: 'stream',
        });

        for await (const chunk of response.data) {
            const data = JSON.parse(chunk.toString());
            yield data.choices[0].text;
        }
    }

    async isAvailable(): Promise<boolean> {
        try {
            await axios.get(`${this.baseUrl}/health`);
            return true;
        } catch {
            return false;
        }
    }

    private formatMessages(messages: any[]): string {
        return messages.map(m => `${m.role}: ${m.content}`).join('\n');
    }
}
```

**Step 4: Update LLM Manager**

Update `src/core/llm/llm.manager.ts`:

```typescript
import { OllamaProvider } from './ollama.provider.js';
import { LlamaCppProvider } from './llamacpp.provider.js';
import { VLLMProvider } from './vllm.provider.js';

export class LLMManager {
    private providers: Map<string, LLMProvider> = new Map();

    constructor() {
        // Register all providers
        this.registerProvider(new OllamaProvider());
        this.registerProvider(new LlamaCppProvider());
        this.registerProvider(new VLLMProvider());
    }

    private registerProvider(provider: LLMProvider): void {
        this.providers.set(provider.name, provider);
    }

    async getProvider(name: string): Promise<LLMProvider> {
        const provider = this.providers.get(name);
        if (!provider) {
            throw new Error(`Provider ${name} not found`);
        }

        const available = await provider.isAvailable();
        if (!available) {
            throw new Error(`Provider ${name} is not available`);
        }

        return provider;
    }

    async getAvailableProviders(): Promise<string[]> {
        const available: string[] = [];

        for (const [name, provider] of this.providers) {
            if (await provider.isAvailable()) {
                available.push(name);
            }
        }

        return available;
    }
}
```

---

## Verification Steps

### 1. Hybrid Search Testing

```bash
npm run test -- hybrid-search.test.ts
```

### 2. Multi-step Planner Testing

```bash
npm run test -- multi-step-planner.test.ts
```

### 3. Memory Linking Testing

```bash
npm run test -- memory-linking.test.ts
```

### 4. Session Replay Testing

```bash
# Get replay
curl http://localhost:3000/api/replay/session-123

# Stream replay
curl http://localhost:3000/api/replay/session-123/stream?speed=2.0
```

### 5. Multi-backend Testing

```bash
# Check available providers
curl http://localhost:3000/api/llm/providers

# Test each provider
curl -X POST http://localhost:3000/api/llm/generate \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "llama.cpp",
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

---

## Success Metrics

- [ ] Hybrid search 20% more accurate
- [ ] Multi-step planner handles 3+ steps
- [ ] Cross-conversation memory working
- [ ] Session replay fully functional
- [ ] 3+ backends supported

---

**Stage 3 Status:** Ready for Implementation  
**Estimated Time:** 40-56 hours  
**Risk Level:** Medium (new features, complex integration)
