# Stage 13: Intent Classification & Tool Interface (Single-LLM)

**Priority:** P2  
**Estimated Time:** 3-4 days  
**Dependencies:** Stage 11 (State Machine)

---

## Objective

Enhance the single-LLM system with intent classification for better routing to specialized prompts/tools, and improve the tool interface for better management and extensibility.

---

## Implementation

### 1. Intent Classification

**File:** `src/core/nlp/intent-classifier.ts`

```typescript
export enum Intent {
  GENERAL_CONVERSATION = 'GENERAL_CONVERSATION',
  QUESTION_ANSWERING = 'QUESTION_ANSWERING',
  TASK_EXECUTION = 'TASK_EXECUTION',
  INFORMATION_RETRIEVAL = 'INFORMATION_RETRIEVAL',
  CREATIVE_WRITING = 'CREATIVE_WRITING',
  CODE_ASSISTANCE = 'CODE_ASSISTANCE',
  SYSTEM_CONTROL = 'SYSTEM_CONTROL',
  UNKNOWN = 'UNKNOWN'
}

export interface IntentClassification {
  intent: Intent;
  confidence: number;
  subIntent?: string;
  entities?: Record<string, any>;
}

export class IntentClassifier {
  private logger: Logger;

  constructor() {
    this.logger = createContextualLogger({ module: 'IntentClassifier' });
  }

  /**
   * Classify user intent from text
   */
  async classify(text: string, context?: any): Promise<IntentClassification> {
    // Simple keyword-based classification (can be enhanced with ML later)
    const lowerText = text.toLowerCase();

    // Question patterns
    if (this.isQuestion(lowerText)) {
      return {
        intent: Intent.QUESTION_ANSWERING,
        confidence: 0.9,
        entities: this.extractQuestionEntities(lowerText)
      };
    }

    // Task execution patterns
    if (this.isTaskRequest(lowerText)) {
      return {
        intent: Intent.TASK_EXECUTION,
        confidence: 0.85,
        entities: this.extractTaskEntities(lowerText)
      };
    }

    // Code assistance patterns
    if (this.isCodeRelated(lowerText)) {
      return {
        intent: Intent.CODE_ASSISTANCE,
        confidence: 0.8,
        subIntent: this.getCodeSubIntent(lowerText)
      };
    }

    // System control patterns
    if (this.isSystemControl(lowerText)) {
      return {
        intent: Intent.SYSTEM_CONTROL,
        confidence: 0.9,
        entities: this.extractSystemEntities(lowerText)
      };
    }

    // Creative writing patterns
    if (this.isCreativeRequest(lowerText)) {
      return {
        intent: Intent.CREATIVE_WRITING,
        confidence: 0.75
      };
    }

    // Default to general conversation
    return {
      intent: Intent.GENERAL_CONVERSATION,
      confidence: 0.6
    };
  }

  private isQuestion(text: string): boolean {
    const questionWords = ['what', 'when', 'where', 'who', 'why', 'how', 'which', 'can you', 'could you', 'would you'];
    return questionWords.some(word => text.startsWith(word)) || text.includes('?');
  }

  private isTaskRequest(text: string): boolean {
    const taskVerbs = ['create', 'make', 'build', 'generate', 'write', 'send', 'open', 'close', 'start', 'stop', 'run', 'execute'];
    return taskVerbs.some(verb => text.includes(verb));
  }

  private isCodeRelated(text: string): boolean {
    const codeKeywords = ['code', 'function', 'class', 'variable', 'bug', 'error', 'debug', 'refactor', 'implement', 'algorithm'];
    return codeKeywords.some(keyword => text.includes(keyword));
  }

  private isSystemControl(text: string): boolean {
    const systemKeywords = ['open app', 'close app', 'screenshot', 'volume', 'brightness', 'wifi', 'bluetooth'];
    return systemKeywords.some(keyword => text.includes(keyword));
  }

  private isCreativeRequest(text: string): boolean {
    const creativeKeywords = ['write a story', 'poem', 'song', 'creative', 'imagine', 'describe'];
    return creativeKeywords.some(keyword => text.includes(keyword));
  }

  private extractQuestionEntities(text: string): Record<string, any> {
    return {
      questionType: this.getQuestionType(text)
    };
  }

  private extractTaskEntities(text: string): Record<string, any> {
    return {
      action: this.extractAction(text),
      target: this.extractTarget(text)
    };
  }

  private extractSystemEntities(text: string): Record<string, any> {
    return {
      systemAction: this.extractSystemAction(text)
    };
  }

  private getQuestionType(text: string): string {
    if (text.startsWith('what')) return 'definition';
    if (text.startsWith('how')) return 'process';
    if (text.startsWith('why')) return 'reason';
    if (text.startsWith('when')) return 'time';
    if (text.startsWith('where')) return 'location';
    return 'general';
  }

  private getCodeSubIntent(text: string): string {
    if (text.includes('debug') || text.includes('error') || text.includes('bug')) return 'debugging';
    if (text.includes('refactor')) return 'refactoring';
    if (text.includes('implement') || text.includes('create')) return 'implementation';
    if (text.includes('explain') || text.includes('understand')) return 'explanation';
    return 'general';
  }

  private extractAction(text: string): string {
    const actionMatch = text.match(/\b(create|make|build|generate|write|send|open|close|start|stop)\b/i);
    return actionMatch ? actionMatch[1] : 'unknown';
  }

  private extractTarget(text: string): string {
    // Simple extraction - can be enhanced
    const words = text.split(' ');
    const actionIndex = words.findIndex(w => 
      ['create', 'make', 'build', 'generate', 'write', 'send', 'open', 'close'].includes(w.toLowerCase())
    );
    return actionIndex >= 0 && actionIndex < words.length - 1 ? words[actionIndex + 1] : 'unknown';
  }

  private extractSystemAction(text: string): string {
    if (text.includes('screenshot')) return 'screenshot';
    if (text.includes('volume')) return 'volume';
    if (text.includes('brightness')) return 'brightness';
    return 'unknown';
  }
}

export default new IntentClassifier();
```

### 2. Intent-Based Prompt Selection

**File:** `src/core/prompts/prompt-selector.ts`

```typescript
import { Intent } from '../nlp/intent-classifier.js';

export class PromptSelector {
  private prompts: Map<Intent, string> = new Map();

  constructor() {
    this.initializePrompts();
  }

  private initializePrompts() {
    this.prompts.set(Intent.QUESTION_ANSWERING, `You are a knowledgeable assistant focused on providing accurate, concise answers to questions. Cite sources when possible.`);
    
    this.prompts.set(Intent.TASK_EXECUTION, `You are a task-oriented assistant. Break down complex tasks into steps and execute them systematically. Use tools when available.`);
    
    this.prompts.set(Intent.CODE_ASSISTANCE, `You are a coding assistant. Provide clear, well-commented code examples. Explain your reasoning and suggest best practices.`);
    
    this.prompts.set(Intent.SYSTEM_CONTROL, `You are a system control assistant. Execute system commands safely and confirm actions with the user.`);
    
    this.prompts.set(Intent.CREATIVE_WRITING, `You are a creative writing assistant. Be imaginative, descriptive, and engaging in your responses.`);
    
    this.prompts.set(Intent.GENERAL_CONVERSATION, `You are a friendly, helpful AI assistant. Engage in natural conversation and assist with various tasks.`);
  }

  getPrompt(intent: Intent): string {
    return this.prompts.get(intent) || this.prompts.get(Intent.GENERAL_CONVERSATION)!;
  }

  getSystemPrompt(intent: Intent, basePrompt: string): string {
    const intentPrompt = this.getPrompt(intent);
    return `${basePrompt}\n\n${intentPrompt}`;
  }
}

export default new PromptSelector();
```

### 3. Enhanced Tool Interface

**File:** `src/core/tools/tool.interface.ts`

```typescript
export enum ToolCategory {
  SYSTEM = 'SYSTEM',
  WEB = 'WEB',
  FILE = 'FILE',
  COMMUNICATION = 'COMMUNICATION',
  PRODUCTIVITY = 'PRODUCTIVITY',
  CUSTOM = 'CUSTOM'
}

export interface ToolMetadata {
  name: string;
  description: string;
  category: ToolCategory;
  version: string;
  author?: string;
  tags?: string[];
  requiredPermissions?: string[];
}

export interface ToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description: string;
  required: boolean;
  default?: any;
  validation?: (value: any) => boolean;
}

export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
  metadata?: Record<string, any>;
}

export interface ITool {
  metadata: ToolMetadata;
  parameters: ToolParameter[];
  
  /**
   * Execute the tool
   */
  execute(params: Record<string, any>): Promise<ToolResult>;
  
  /**
   * Validate parameters
   */
  validate(params: Record<string, any>): boolean;
  
  /**
   * Get JSON schema for the tool
   */
  getSchema(): object;
}
```

**File:** `src/core/tools/base-tool.ts`

```typescript
import { ITool, ToolMetadata, ToolParameter, ToolResult } from './tool.interface.js';

export abstract class BaseTool implements ITool {
  abstract metadata: ToolMetadata;
  abstract parameters: ToolParameter[];

  abstract execute(params: Record<string, any>): Promise<ToolResult>;

  validate(params: Record<string, any>): boolean {
    // Check required parameters
    for (const param of this.parameters) {
      if (param.required && !(param.name in params)) {
        return false;
      }

      // Type validation
      if (param.name in params) {
        const value = params[param.name];
        if (!this.validateType(value, param.type)) {
          return false;
        }

        // Custom validation
        if (param.validation && !param.validation(value)) {
          return false;
        }
      }
    }

    return true;
  }

  private validateType(value: any, type: string): boolean {
    switch (type) {
      case 'string': return typeof value === 'string';
      case 'number': return typeof value === 'number';
      case 'boolean': return typeof value === 'boolean';
      case 'object': return typeof value === 'object' && !Array.isArray(value);
      case 'array': return Array.isArray(value);
      default: return true;
    }
  }

  getSchema(): object {
    return {
      name: this.metadata.name,
      description: this.metadata.description,
      category: this.metadata.category,
      parameters: this.parameters.map(p => ({
        name: p.name,
        type: p.type,
        description: p.description,
        required: p.required,
        default: p.default
      }))
    };
  }
}
```

### 4. Tool Registry

**File:** `src/core/tools/tool-registry.ts`

```typescript
import { ITool, ToolCategory } from './tool.interface.js';
import { createContextualLogger } from '../logger/logger.js';

export class ToolRegistry {
  private tools: Map<string, ITool> = new Map();
  private logger = createContextualLogger({ module: 'ToolRegistry' });

  register(tool: ITool): void {
    this.tools.set(tool.metadata.name, tool);
    this.logger.info(`Registered tool: ${tool.metadata.name}`, {
      category: tool.metadata.category,
      version: tool.metadata.version
    });
  }

  unregister(toolName: string): void {
    this.tools.delete(toolName);
    this.logger.info(`Unregistered tool: ${toolName}`);
  }

  getTool(toolName: string): ITool | undefined {
    return this.tools.get(toolName);
  }

  getAllTools(): ITool[] {
    return Array.from(this.tools.values());
  }

  getToolsByCategory(category: ToolCategory): ITool[] {
    return this.getAllTools().filter(t => t.metadata.category === category);
  }

  getToolSchemas(): object[] {
    return this.getAllTools().map(t => t.getSchema());
  }

  hasPermission(toolName: string, userPermissions: string[]): boolean {
    const tool = this.getTool(toolName);
    if (!tool || !tool.metadata.requiredPermissions) {
      return true;
    }

    return tool.metadata.requiredPermissions.every(p => 
      userPermissions.includes(p)
    );
  }
}

export default new ToolRegistry();
```

### 5. Integration with Context Builder

**File:** `src/modules/session/context.builder.ts` (modify)

```typescript
import intentClassifier from '../../core/nlp/intent-classifier.js';
import promptSelector from '../../core/prompts/prompt-selector.js';

export class ContextBuilder {
  async build(conversationId: string, userInput: string): Promise<Context> {
    // ... existing code ...

    // Classify intent
    const classification = await intentClassifier.classify(userInput, {
      conversationId,
      history: messages
    });

    logger.info(`Intent classified`, {
      intent: classification.intent,
      confidence: classification.confidence
    });

    // Select appropriate system prompt
    const systemPrompt = promptSelector.getSystemPrompt(
      classification.intent,
      baseSystemPrompt
    );

    return {
      systemPrompt,
      messages,
      intent: classification,
      // ... rest of context
    };
  }
}
```

---

## Verification Checklist

- [ ] Intent classifier implemented
- [ ] Prompt selector working
- [ ] Tool interface defined
- [ ] Base tool class created
- [ ] Tool registry functional
- [ ] Integration with context builder
- [ ] Tests for intent classification
- [ ] Tests for tool validation

---

## Success Criteria

1. ✅ **Intent Classification:** 80%+ accuracy on test cases
2. ✅ **Prompt Selection:** Correct prompt for each intent
3. ✅ **Tool Interface:** All tools follow standard interface
4. ✅ **Tool Registry:** Dynamic tool registration/unregistration
5. ✅ **Integration:** Seamless integration with existing flow

---

## Benefits

1. **Better Responses:** Intent-specific prompts improve response quality
2. **Tool Management:** Standardized tool interface for extensibility
3. **Debugging:** Intent classification helps debug routing issues
4. **Future-Proof:** Prepares for multi-agent upgrade
5. **Flexibility:** Easy to add new intents and tools
