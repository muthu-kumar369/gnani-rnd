# Stage 1.1: LLM Abstraction Layer

**Duration:** 2 weeks  
**Goal:** Create a future-proof LLM abstraction layer that supports single LLM now and multi-LLM later

---

## Context

Currently, Gnani uses Ollama directly throughout the codebase. This works fine for a single model, but makes it hard to:
- Add specialized models (CodeLlama for code, Llama 70B for planning)
- Switch between models based on task type
- Add fallback mechanisms
- Support mobile (cloud LLM fallback)

**Solution:** Create an abstraction layer that works with single Ollama model now, but is ready for multi-agent future.

---

## Objectives

1. Create `LLMProvider` interface
2. Implement `OllamaProvider` 
3. Create `LLMManager` to route requests
4. Refactor existing code to use `LLMManager`
5. Add configuration for model selection
6. Write tests for abstraction layer

---

## Implementation Tasks

### Task 1: Create LLM Provider Interface

**File:** `gnani-rnd-backend/src/core/llm/llm.interface.ts`

Create a generic interface that any LLM provider must implement:

```typescript
export interface GenerateOptions {
  temperature?: number;
  maxTokens?: number;
  stopSequences?: string[];
  stream?: boolean;
}

export interface LLMResponse {
  text: string;
  finishReason: 'stop' | 'length' | 'tool_call';
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface ToolCall {
  name: string;
  parameters: Record<string, any>;
}

export interface LLMProvider {
  name: string;
  
  // Basic generation
  generate(prompt: string, options?: GenerateOptions): AsyncIterator<string>;
  
  // Generation with tools (function calling)
  generateWithTools(
    prompt: string, 
    tools: Tool[], 
    options?: GenerateOptions
  ): AsyncIterator<LLMResponse>;
  
  // Capabilities
  supportsFunctionCalling: boolean;
  maxContextLength: number;
  
  // Health check
  isAvailable(): Promise<boolean>;
}
```

**Requirements:**
- Interface must be generic (not Ollama-specific)
- Support streaming responses
- Support function calling
- Include health check method

---

### Task 2: Implement Ollama Provider

**File:** `gnani-rnd-backend/src/core/llm/ollama.provider.ts`

Implement the Ollama provider:

```typescript
import { LLMProvider, GenerateOptions, LLMResponse } from './llm.interface.js';
import axios from 'axios';

export class OllamaProvider implements LLMProvider {
  name = 'ollama';
  private baseUrl: string;
  private model: string;
  
  constructor(config: { baseUrl?: string; model?: string } = {}) {
    this.baseUrl = config.baseUrl || process.env.LLM_SERVER_URL || 'http://localhost:11434';
    this.model = config.model || process.env.LLM_MODEL || 'llama3.1:8b';
  }
  
  async *generate(prompt: string, options?: GenerateOptions): AsyncIterator<string> {
    const response = await axios.post(
      `${this.baseUrl}/api/generate`,
      {
        model: this.model,
        prompt,
        stream: true,
        options: {
          temperature: options?.temperature || 0.7,
          num_predict: options?.maxTokens || 200,
          stop: options?.stopSequences
        }
      },
      { responseType: 'stream' }
    );
    
    for await (const chunk of response.data) {
      const data = JSON.parse(chunk.toString());
      if (data.response) {
        yield data.response;
      }
      if (data.done) break;
    }
  }
  
  async *generateWithTools(
    prompt: string,
    tools: Tool[],
    options?: GenerateOptions
  ): AsyncIterator<LLMResponse> {
    // Ollama supports function calling via system prompt
    const systemPrompt = this.buildToolPrompt(tools);
    const fullPrompt = `${systemPrompt}\n\n${prompt}`;
    
    for await (const chunk of this.generate(fullPrompt, options)) {
      yield {
        text: chunk,
        finishReason: 'stop'
      };
    }
  }
  
  supportsFunctionCalling = true;
  maxContextLength = 8192;
  
  async isAvailable(): Promise<boolean> {
    try {
      await axios.get(`${this.baseUrl}/api/tags`);
      return true;
    } catch {
      return false;
    }
  }
  
  private buildToolPrompt(tools: Tool[]): string {
    const toolDescriptions = tools.map(t => 
      `- ${t.name}: ${t.description}\n  Parameters: ${JSON.stringify(t.parameters)}`
    ).join('\n');
    
    return `You have access to the following tools:\n${toolDescriptions}\n\nTo use a tool, respond with: TOOL_CALL: {"name": "tool_name", "parameters": {...}}`;
  }
}
```

**Requirements:**
- Handle streaming responses
- Support function calling via system prompt
- Include health check
- Use environment variables for configuration

---

### Task 3: Create LLM Manager

**File:** `gnani-rnd-backend/src/core/llm/llm.manager.ts`

Create a manager to route requests to appropriate providers:

```typescript
import { LLMProvider } from './llm.interface.js';
import { OllamaProvider } from './ollama.provider.js';
import logger from '../../utils/logger.js';

export type TaskType = 'chat' | 'code' | 'planning' | 'tool';

export class LLMManager {
  private providers: Map<string, LLMProvider> = new Map();
  private currentProvider: LLMProvider;
  
  constructor() {
    // Initialize default provider
    const defaultProvider = new OllamaProvider();
    this.providers.set('ollama', defaultProvider);
    this.currentProvider = defaultProvider;
    
    logger.info('LLMManager initialized', { 
      provider: this.currentProvider.name,
      model: (this.currentProvider as OllamaProvider).model
    });
  }
  
  // Main generation method
  async *generate(prompt: string, options?: GenerateOptions): AsyncIterator<string> {
    const available = await this.currentProvider.isAvailable();
    if (!available) {
      throw new Error(`LLM provider ${this.currentProvider.name} is not available`);
    }
    
    yield* this.currentProvider.generate(prompt, options);
  }
  
  // Generation with tools
  async *generateWithTools(
    prompt: string,
    tools: Tool[],
    options?: GenerateOptions
  ): AsyncIterator<LLMResponse> {
    yield* this.currentProvider.generateWithTools(prompt, tools, options);
  }
  
  // Future: Select provider based on task type
  selectProvider(taskType: TaskType): void {
    // For now, always use default Ollama
    // Future: Route to specialized models
    switch (taskType) {
      case 'code':
        // Future: this.currentProvider = this.providers.get('ollama-code') || this.currentProvider;
        break;
      case 'planning':
        // Future: this.currentProvider = this.providers.get('ollama-planner') || this.currentProvider;
        break;
      default:
        this.currentProvider = this.providers.get('ollama')!;
    }
    
    logger.debug('Provider selected', { taskType, provider: this.currentProvider.name });
  }
  
  // Get current provider info
  getProviderInfo() {
    return {
      name: this.currentProvider.name,
      supportsFunctionCalling: this.currentProvider.supportsFunctionCalling,
      maxContextLength: this.currentProvider.maxContextLength
    };
  }
}

// Singleton instance
export const llmManager = new LLMManager();
```

**Requirements:**
- Singleton pattern for global access
- Support provider selection (for future multi-agent)
- Health check before generation
- Logging for debugging

---

### Task 4: Refactor Existing Code

**Files to Update:**
- `gnani-rnd-backend/src/modules/session/session.manager.ts`
- `gnani-rnd-backend/src/modules/llm/*.ts`

**Changes:**

Replace direct Ollama calls with `llmManager`:

```typescript
// BEFORE:
import ollamaClient from '../llm/ollama.client.js';

const response = await ollamaClient.generate(prompt);

// AFTER:
import { llmManager } from '../../core/llm/llm.manager.js';

const response = llmManager.generate(prompt);
for await (const chunk of response) {
  // Process chunk
}
```

**Requirements:**
- Replace all direct LLM calls
- Maintain existing functionality
- Add error handling
- Test each change

---

### Task 5: Add Configuration

**File:** `gnani-rnd-backend/src/config/llm.config.ts`

Create configuration for LLM providers:

```typescript
export const LLM_CONFIG = {
  defaultProvider: process.env.LLM_PROVIDER || 'ollama',
  
  providers: {
    ollama: {
      baseUrl: process.env.LLM_SERVER_URL || 'http://localhost:11434',
      models: {
        chat: process.env.LLM_MODEL || 'llama3.1:8b',
        code: process.env.LLM_CODE_MODEL || 'llama3.1:8b', // Future: codellama
        planning: process.env.LLM_PLANNING_MODEL || 'llama3.1:8b' // Future: llama3.1:70b
      }
    }
  },
  
  generation: {
    temperature: parseFloat(process.env.LLM_TEMPERATURE || '0.7'),
    maxTokens: parseInt(process.env.LLM_MAX_TOKENS || '200'),
    streamingEnabled: process.env.LLM_STREAMING_ENABLED === 'true'
  }
};
```

**Update `.env.example`:**
```bash
# LLM Configuration
LLM_PROVIDER=ollama
LLM_SERVER_URL=http://localhost:11434
LLM_MODEL=llama3.1:8b
LLM_CODE_MODEL=llama3.1:8b
LLM_PLANNING_MODEL=llama3.1:8b
LLM_TEMPERATURE=0.7
LLM_MAX_TOKENS=200
LLM_STREAMING_ENABLED=true
```

---

### Task 6: Write Tests

**File:** `gnani-rnd-backend/tests/unit/llm/llm.manager.test.ts`

Create comprehensive tests:

```typescript
import { describe, it, expect, beforeEach } from '@jest/globals';
import { LLMManager } from '../../../src/core/llm/llm.manager.js';

describe('LLMManager', () => {
  let manager: LLMManager;
  
  beforeEach(() => {
    manager = new LLMManager();
  });
  
  it('should initialize with default Ollama provider', () => {
    const info = manager.getProviderInfo();
    expect(info.name).toBe('ollama');
  });
  
  it('should generate streaming responses', async () => {
    const chunks: string[] = [];
    for await (const chunk of manager.generate('Hello')) {
      chunks.push(chunk);
    }
    expect(chunks.length).toBeGreaterThan(0);
  });
  
  it('should select provider based on task type', () => {
    manager.selectProvider('code');
    const info = manager.getProviderInfo();
    expect(info.name).toBe('ollama'); // For now, always Ollama
  });
  
  it('should throw error if provider unavailable', async () => {
    // Mock unavailable provider
    await expect(async () => {
      for await (const chunk of manager.generate('test')) {
        // Should throw
      }
    }).rejects.toThrow();
  });
});
```

**File:** `gnani-rnd-backend/tests/unit/llm/ollama.provider.test.ts`

```typescript
describe('OllamaProvider', () => {
  it('should check availability', async () => {
    const provider = new OllamaProvider();
    const available = await provider.isAvailable();
    expect(typeof available).toBe('boolean');
  });
  
  it('should generate responses', async () => {
    const provider = new OllamaProvider();
    const chunks: string[] = [];
    for await (const chunk of provider.generate('Hello')) {
      chunks.push(chunk);
    }
    expect(chunks.length).toBeGreaterThan(0);
  });
});
```

---

## Setup Scripts

**File:** `gnani-rnd-backend/scripts/setup-llm-abstraction.sh`

Create automated setup script:

```bash
#!/bin/bash

echo "Setting up LLM Abstraction Layer..."

# Create directories
mkdir -p src/core/llm
mkdir -p tests/unit/llm

# Install dependencies (if any new ones needed)
npm install

# Run tests
echo "Running LLM abstraction tests..."
npm test -- tests/unit/llm

# Verify Ollama is running
echo "Checking Ollama availability..."
curl -s http://localhost:11434/api/tags > /dev/null
if [ $? -eq 0 ]; then
  echo "✅ Ollama is running"
else
  echo "❌ Ollama is not running. Please start Ollama first."
  exit 1
fi

echo "✅ LLM Abstraction Layer setup complete!"
```

Make executable:
```bash
chmod +x scripts/setup-llm-abstraction.sh
```

---

## Verification Steps

1. **Run setup script:**
   ```bash
   cd gnani-rnd-backend
   ./scripts/setup-llm-abstraction.sh
   ```

2. **Test LLM Manager:**
   ```bash
   npm test -- tests/unit/llm
   ```

3. **Test integration:**
   ```bash
   # Start backend
   npm run dev
   
   # In another terminal, test gRPC
   node tests/integration/grpc_client.js
   ```

4. **Verify no regressions:**
   - Test wake word → listening → thinking → speaking flow
   - Verify LLM responses are still working
   - Check console logs for LLM provider info

---

## Success Criteria

- [ ] `LLMProvider` interface created
- [ ] `OllamaProvider` implemented and tested
- [ ] `LLMManager` created with provider selection
- [ ] All existing code refactored to use `llmManager`
- [ ] Configuration added to `.env`
- [ ] Tests written and passing (100% coverage for new code)
- [ ] Setup script created and tested
- [ ] No regressions in existing functionality
- [ ] Documentation updated

---

## Rollback Plan

If issues arise:

```bash
# Revert changes
git revert <commit-hash>

# Or restore from backup
git checkout main -- src/modules/llm
```

---

## Next Stage

After completing this stage, proceed to [Stage 1.2 - Testing Infrastructure](./stage-1.2-testing-infrastructure.md)
