# Stage 1.2: Session Manager Refactoring

**Duration:** Week 3-4 (10 working days)  
**Priority:** 🔴 Critical  
**Dependencies:** Stage 1.1 (Audio Pipeline Fixes)

---

## Overview

Refactor the monolithic 480-line Session Manager into 6 focused, testable services. This improves maintainability, enables better testing, and prepares the architecture for future multi-agent evolution.

## Goals

1. Split Session Manager into 6 focused services
2. Implement dependency injection throughout
3. Achieve 80% test coverage
4. Maintain backward compatibility (no breaking changes)

## Current Architecture Problem

**File:** `gnani-rnd-backend/src/modules/session/session.manager.ts` (480 lines)

**Issues:**
- Does too much: audio, STT, memory, LLM, tools
- Hard to test (tight coupling)
- Hard to debug (complex flow)
- Not future-proof for multi-agent

**Current Responsibilities:**
```typescript
class SessionManager {
  // 1. Session lifecycle
  startSession()
  endSession()
  
  // 2. Audio handling
  appendAudioChunk()
  clearAudioBuffer()
  
  // 3. Transcript processing
  processTranscript()
  
  // 4. Memory/context
  buildContext()
  
  // 5. LLM execution
  generateResponse()
  
  // 6. Tool execution
  executeTool()
}
```

---

## New Architecture

### Service Breakdown

```
session/
├── session.coordinator.ts      # Orchestrates flow (100 lines)
├── audio.processor.ts          # Audio buffering (80 lines)
├── transcript.processor.ts     # STT integration (60 lines)
├── context.builder.ts          # Memory + RAG (100 lines)
├── llm.executor.ts             # LLM calls (80 lines)
└── tool.executor.ts            # Tool execution (80 lines)
```

**Total:** ~500 lines (same as before, but modular)

---

## Implementation Tasks

### Task 1: Create Session Coordinator

**File:** `gnani-rnd-backend/src/modules/session/session.coordinator.ts`

```typescript
import { v4 as uuidv4 } from 'uuid';
import { createContextualLogger } from '../../core/logger/logger.js';
import { AudioProcessor } from './audio.processor.js';
import { TranscriptProcessor } from './transcript.processor.js';
import { ContextBuilder } from './context.builder.js';
import { LLMExecutor } from './llm.executor.js';
import { ToolExecutor } from './tool.executor.js';
import { Logger } from 'winston';

interface Session {
  userId: string;
  createdAt: number;
  lastActivity: number;
  timeoutId: NodeJS.Timeout | null;
  onTranscriptionCallback: (transcript: string, isFinal: boolean) => Promise<void> | void;
  onLlmChunkCallback?: (text: string) => Promise<void> | void;
  onToolStatusCallback?: (status: any) => Promise<void> | void;
  metadata: any;
}

export class SessionCoordinator {
  private logger: Logger;
  private sessions: Map<string, Session> = new Map();
  private SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

  constructor(
    private audioProcessor: AudioProcessor,
    private transcriptProcessor: TranscriptProcessor,
    private contextBuilder: ContextBuilder,
    private llmExecutor: LLMExecutor,
    private toolExecutor: ToolExecutor
  ) {
    this.logger = createContextualLogger({ module: 'SessionCoordinator' });
  }

  async startSession(
    userId: string,
    onTranscriptionCallback: (transcript: string, isFinal: boolean) => Promise<void> | void,
    onLlmChunkCallback?: (text: string) => Promise<void> | void,
    onToolStatusCallback?: (status: any) => Promise<void> | void,
    existingSessionId?: string
  ): Promise<string> {
    const sessionId = existingSessionId || uuidv4();

    const session: Session = {
      userId,
      createdAt: Date.now(),
      lastActivity: Date.now(),
      timeoutId: null,
      onTranscriptionCallback,
      onLlmChunkCallback,
      onToolStatusCallback,
      metadata: {}
    };

    this.sessions.set(sessionId, session);
    
    // Initialize audio processor for this session
    await this.audioProcessor.initialize(sessionId);
    
    this.logger.info('Session started', { sessionId, userId });
    return sessionId;
  }

  async processAudioChunk(sessionId: string, audioChunk: Buffer, sampleRate: number): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    // Delegate to audio processor
    await this.audioProcessor.appendChunk(sessionId, audioChunk, sampleRate);
    
    this.resetSessionTimeout(sessionId);
  }

  async processTranscript(sessionId: string, transcript: string, isFinal: boolean): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    // Notify frontend
    await session.onTranscriptionCallback(transcript, isFinal);

    if (isFinal) {
      // Process complete transcript
      await this.handleFinalTranscript(sessionId, transcript);
    }
  }

  private async handleFinalTranscript(sessionId: string, transcript: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    try {
      // Step 1: Build context (memory + RAG)
      const context = await this.contextBuilder.build(sessionId, session.userId, transcript);

      // Step 2: Generate LLM response
      const response = await this.llmExecutor.generate(
        context,
        session.onLlmChunkCallback
      );

      // Step 3: Execute tools if needed
      if (response.toolCalls && response.toolCalls.length > 0) {
        await this.toolExecutor.executeTools(
          sessionId,
          response.toolCalls,
          session.onToolStatusCallback
        );
      }

    } catch (error: any) {
      this.logger.error('Error processing transcript', { sessionId, error: error.message });
      throw error;
    }
  }

  async endSession(sessionId: string): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    // Cleanup
    if (session.timeoutId) {
      clearTimeout(session.timeoutId);
    }

    await this.audioProcessor.cleanup(sessionId);
    this.sessions.delete(sessionId);

    this.logger.info('Session ended', { sessionId });
    return true;
  }

  private resetSessionTimeout(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    if (session.timeoutId) {
      clearTimeout(session.timeoutId);
    }

    session.timeoutId = setTimeout(() => {
      this.logger.warn('Session timeout', { sessionId });
      this.endSession(sessionId);
    }, this.SESSION_TIMEOUT_MS);

    session.lastActivity = Date.now();
  }

  getSession(sessionId: string): Session | undefined {
    return this.sessions.get(sessionId);
  }
}

export default new SessionCoordinator(
  new AudioProcessor(),
  new TranscriptProcessor(),
  new ContextBuilder(),
  new LLMExecutor(),
  new ToolExecutor()
);
```

**Acceptance Criteria:**
- [ ] Coordinator orchestrates flow without implementing logic
- [ ] All dependencies injected via constructor
- [ ] Session lifecycle managed correctly
- [ ] Timeout handling works

---

### Task 2: Create Audio Processor

**File:** `gnani-rnd-backend/src/modules/session/audio.processor.ts`

```typescript
import { createContextualLogger } from '../../core/logger/logger.js';
import whisperService from '../asr/whisper.service.js';
import { Logger } from 'winston';

interface AudioSession {
  buffer: Buffer[];
  sampleRate: number;
}

export class AudioProcessor {
  private logger: Logger;
  private sessions: Map<string, AudioSession> = new Map();
  private MAX_BUFFER_SIZE = 10 * 1024 * 1024; // 10MB

  constructor() {
    this.logger = createContextualLogger({ module: 'AudioProcessor' });
  }

  async initialize(sessionId: string): Promise<void> {
    this.sessions.set(sessionId, {
      buffer: [],
      sampleRate: 16000
    });
    
    this.logger.debug('Audio session initialized', { sessionId });
  }

  async appendChunk(sessionId: string, chunk: Buffer, sampleRate: number): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Audio session ${sessionId} not found`);
    }

    // Update sample rate if changed
    session.sampleRate = sampleRate;

    // Check buffer size
    const currentSize = session.buffer.reduce((sum, buf) => sum + buf.length, 0);
    const newSize = currentSize + chunk.length;

    if (newSize > this.MAX_BUFFER_SIZE) {
      this.logger.warn('Buffer overflow, flushing', { sessionId, size: newSize });
      await this.flush(sessionId);
    }

    session.buffer.push(chunk);
  }

  async flush(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session || session.buffer.length === 0) return;

    const combinedBuffer = Buffer.concat(session.buffer);
    
    // Send to Whisper
    await whisperService.transcribe(sessionId, combinedBuffer, session.sampleRate);
    
    // Clear buffer
    session.buffer = [];
    
    this.logger.debug('Audio buffer flushed', { sessionId });
  }

  async cleanup(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId);
    this.logger.debug('Audio session cleaned up', { sessionId });
  }

  getBufferStats(sessionId: string): { size: number; chunks: number } {
    const session = this.sessions.get(sessionId);
    if (!session) return { size: 0, chunks: 0 };

    const size = session.buffer.reduce((sum, buf) => sum + buf.length, 0);
    return { size, chunks: session.buffer.length };
  }
}
```

**Acceptance Criteria:**
- [ ] Handles audio buffering only
- [ ] Prevents overflow (10MB limit)
- [ ] Auto-flushes when needed
- [ ] Provides buffer stats

---

### Task 3: Create Transcript Processor

**File:** `gnani-rnd-backend/src/modules/session/transcript.processor.ts`

```typescript
import { createContextualLogger } from '../../core/logger/logger.js';
import whisperService from '../asr/whisper.service.js';
import { Logger } from 'winston';

export class TranscriptProcessor {
  private logger: Logger;

  constructor() {
    this.logger = createContextualLogger({ module: 'TranscriptProcessor' });
  }

  async processAudio(sessionId: string, audioBuffer: Buffer, sampleRate: number): Promise<string> {
    try {
      const transcript = await whisperService.transcribe(sessionId, audioBuffer, sampleRate);
      
      this.logger.info('Transcript generated', { 
        sessionId, 
        length: transcript.length 
      });
      
      return transcript;
      
    } catch (error: any) {
      this.logger.error('Transcription failed', { 
        sessionId, 
        error: error.message 
      });
      throw error;
    }
  }

  cleanTranscript(transcript: string): string {
    // Remove extra whitespace
    let cleaned = transcript.trim().replace(/\s+/g, ' ');
    
    // Remove common filler words if needed
    // cleaned = cleaned.replace(/\b(um|uh|like)\b/gi, '');
    
    return cleaned;
  }
}
```

**Acceptance Criteria:**
- [ ] Handles STT integration only
- [ ] Cleans transcript text
- [ ] Error handling for STT failures

---

### Task 4: Create Context Builder

**File:** `gnani-rnd-backend/src/modules/session/context.builder.ts`

```typescript
import { createContextualLogger } from '../../core/logger/logger.js';
import sessionMemory from '../memory/services/session-memory.service.js';
import vectorManager from '../vector/vector.manager.js';
import conversationService from '../conversation/conversation.service.js';
import { Logger } from 'winston';

interface Context {
  transcript: string;
  recentMessages: any[];
  relevantMemories: string[];
  systemPrompt: string;
}

export class ContextBuilder {
  private logger: Logger;
  private MAX_CONTEXT_MESSAGES = 10;

  constructor() {
    this.logger = createContextualLogger({ module: 'ContextBuilder' });
  }

  async build(sessionId: string, userId: string, transcript: string): Promise<Context> {
    try {
      // 1. Get recent messages from cache
      const cachedMessages = await sessionMemory.getCachedMessages(sessionId) || [];
      
      // 2. Get relevant memories from vector search
      const relevantMemories = await vectorManager.getRelevantEmbeddings(
        userId,
        transcript,
        3 // top 3 results
      );

      // 3. Build system prompt
      const systemPrompt = this.buildSystemPrompt(relevantMemories);

      const context: Context = {
        transcript,
        recentMessages: cachedMessages.slice(-this.MAX_CONTEXT_MESSAGES),
        relevantMemories,
        systemPrompt
      };

      this.logger.debug('Context built', {
        sessionId,
        messagesCount: context.recentMessages.length,
        memoriesCount: relevantMemories.length
      });

      return context;

    } catch (error: any) {
      this.logger.error('Error building context', { sessionId, error: error.message });
      throw error;
    }
  }

  private buildSystemPrompt(memories: string[]): string {
    let prompt = 'You are Gnani, a helpful AI assistant.\n\n';

    if (memories.length > 0) {
      prompt += 'Relevant context from previous conversations:\n';
      memories.forEach((memory, i) => {
        prompt += `${i + 1}. ${memory}\n`;
      });
      prompt += '\n';
    }

    return prompt;
  }
}
```

**Acceptance Criteria:**
- [ ] Retrieves recent messages from cache
- [ ] Performs vector search for relevant memories
- [ ] Builds system prompt with context
- [ ] Handles missing data gracefully

---

### Task 5: Create LLM Executor

**File:** `gnani-rnd-backend/src/modules/session/llm.executor.ts`

```typescript
import { createContextualLogger } from '../../core/logger/logger.js';
import { llmManager } from '../../core/llm/llm.manager.js';
import { Logger } from 'winston';

interface LLMResponse {
  text: string;
  toolCalls?: any[];
}

export class LLMExecutor {
  private logger: Logger;

  constructor() {
    this.logger = createContextualLogger({ module: 'LLMExecutor' });
  }

  async generate(
    context: any,
    onChunk?: (chunk: string) => Promise<void> | void
  ): Promise<LLMResponse> {
    try {
      const prompt = this.buildPrompt(context);
      
      let fullResponse = '';
      
      // Stream LLM response
      for await (const chunk of llmManager.generate(prompt)) {
        fullResponse += chunk;
        
        if (onChunk) {
          await onChunk(chunk);
        }
      }

      this.logger.info('LLM response generated', { 
        length: fullResponse.length 
      });

      // Parse for tool calls (if any)
      const toolCalls = this.extractToolCalls(fullResponse);

      return {
        text: fullResponse,
        toolCalls
      };

    } catch (error: any) {
      this.logger.error('LLM generation failed', { error: error.message });
      throw error;
    }
  }

  private buildPrompt(context: any): string {
    let prompt = context.systemPrompt + '\n\n';

    // Add recent messages
    context.recentMessages.forEach((msg: any) => {
      prompt += `${msg.role}: ${msg.content}\n`;
    });

    // Add current user input
    prompt += `user: ${context.transcript}\nassistant:`;

    return prompt;
  }

  private extractToolCalls(response: string): any[] {
    // Simple tool call extraction (improve as needed)
    const toolCallRegex = /<tool>(.*?)<\/tool>/gs;
    const matches = response.matchAll(toolCallRegex);
    
    const toolCalls = [];
    for (const match of matches) {
      try {
        const toolCall = JSON.parse(match[1]);
        toolCalls.push(toolCall);
      } catch (e) {
        this.logger.warn('Failed to parse tool call', { match: match[1] });
      }
    }

    return toolCalls;
  }
}
```

**Acceptance Criteria:**
- [ ] Generates LLM responses
- [ ] Streams chunks to callback
- [ ] Extracts tool calls from response
- [ ] Error handling for LLM failures

---

### Task 6: Create Tool Executor

**File:** `gnani-rnd-backend/src/modules/session/tool.executor.ts`

```typescript
import { createContextualLogger } from '../../core/logger/logger.js';
import toolRegistry from '../tools/tool.registry.js';
import { Logger } from 'winston';

export class ToolExecutor {
  private logger: Logger;

  constructor() {
    this.logger = createContextualLogger({ module: 'ToolExecutor' });
  }

  async executeTools(
    sessionId: string,
    toolCalls: any[],
    onStatus?: (status: any) => Promise<void> | void
  ): Promise<any[]> {
    const results = [];

    for (const toolCall of toolCalls) {
      try {
        this.logger.info('Executing tool', { 
          sessionId, 
          tool: toolCall.name 
        });

        const result = await toolRegistry.executeTool(
          toolCall.name,
          toolCall.parameters,
          onStatus
        );

        results.push(result);

      } catch (error: any) {
        this.logger.error('Tool execution failed', {
          sessionId,
          tool: toolCall.name,
          error: error.message
        });

        results.push({
          toolName: toolCall.name,
          error: error.message
        });
      }
    }

    return results;
  }
}
```

**Acceptance Criteria:**
- [ ] Executes tools via registry
- [ ] Handles multiple tool calls
- [ ] Reports progress via callback
- [ ] Error handling per tool

---

## Migration Plan

### Step 1: Create New Services (No Breaking Changes)

1. Create all 6 new service files
2. Keep old `session.manager.ts` unchanged
3. Test new services independently

### Step 2: Update gRPC Server

**File:** `gnani-rnd-backend/src/grpc.ts`

```typescript
// Old import
// import sessionManager from './modules/session/session.manager.js';

// New import
import sessionCoordinator from './modules/session/session.coordinator.js';

// Update all references
// sessionManager.startSession() → sessionCoordinator.startSession()
```

### Step 3: Deprecate Old Session Manager

1. Add deprecation warning to old file
2. Update all imports to use new coordinator
3. Delete old file after 1 week

---

## Testing Plan

### Unit Tests

**File:** `gnani-rnd-backend/tests/unit/session-coordinator.test.ts`

```typescript
import { SessionCoordinator } from '../../src/modules/session/session.coordinator';
import { AudioProcessor } from '../../src/modules/session/audio.processor';
import { TranscriptProcessor } from '../../src/modules/session/transcript.processor';
import { ContextBuilder } from '../../src/modules/session/context.builder';
import { LLMExecutor } from '../../src/modules/session/llm.executor';
import { ToolExecutor } from '../../src/modules/session/tool.executor';

describe('SessionCoordinator', () => {
  let coordinator: SessionCoordinator;
  let mockAudioProcessor: jest.Mocked<AudioProcessor>;
  let mockTranscriptProcessor: jest.Mocked<TranscriptProcessor>;
  let mockContextBuilder: jest.Mocked<ContextBuilder>;
  let mockLLMExecutor: jest.Mocked<LLMExecutor>;
  let mockToolExecutor: jest.Mocked<ToolExecutor>;

  beforeEach(() => {
    mockAudioProcessor = {
      initialize: jest.fn(),
      appendChunk: jest.fn(),
      cleanup: jest.fn()
    } as any;

    mockTranscriptProcessor = {
      processAudio: jest.fn()
    } as any;

    mockContextBuilder = {
      build: jest.fn()
    } as any;

    mockLLMExecutor = {
      generate: jest.fn()
    } as any;

    mockToolExecutor = {
      executeTools: jest.fn()
    } as any;

    coordinator = new SessionCoordinator(
      mockAudioProcessor,
      mockTranscriptProcessor,
      mockContextBuilder,
      mockLLMExecutor,
      mockToolExecutor
    );
  });

  it('should start session successfully', async () => {
    const sessionId = await coordinator.startSession(
      'user123',
      jest.fn()
    );

    expect(sessionId).toBeDefined();
    expect(mockAudioProcessor.initialize).toHaveBeenCalledWith(sessionId);
  });

  it('should process audio chunk', async () => {
    const sessionId = await coordinator.startSession('user123', jest.fn());
    const chunk = Buffer.from('test');

    await coordinator.processAudioChunk(sessionId, chunk, 16000);

    expect(mockAudioProcessor.appendChunk).toHaveBeenCalledWith(
      sessionId,
      chunk,
      16000
    );
  });

  it('should end session and cleanup', async () => {
    const sessionId = await coordinator.startSession('user123', jest.fn());
    
    const result = await coordinator.endSession(sessionId);

    expect(result).toBe(true);
    expect(mockAudioProcessor.cleanup).toHaveBeenCalledWith(sessionId);
  });
});
```

### Integration Tests

**File:** `gnani-rnd-backend/tests/integration/session-flow.test.ts`

```typescript
describe('Session Flow Integration', () => {
  it('should handle complete audio-to-response flow', async () => {
    const sessionId = await sessionCoordinator.startSession(
      'user123',
      mockTranscriptCallback,
      mockLLMCallback
    );

    // Send audio
    const audioChunk = generateTestAudio('Hello Gnani');
    await sessionCoordinator.processAudioChunk(sessionId, audioChunk, 16000);

    // Verify transcript callback was called
    expect(mockTranscriptCallback).toHaveBeenCalled();

    // Verify LLM callback was called
    expect(mockLLMCallback).toHaveBeenCalled();
  });
});
```

---

## Success Metrics

- ✅ All 6 services created and tested
- ✅ 80% test coverage achieved
- ✅ No breaking changes to existing API
- ✅ All integration tests passing
- ✅ Code review approved
- ✅ Documentation updated

---

## Next Stage

After completing this stage, proceed to:
**Stage 1.3: Unit Testing Infrastructure**
