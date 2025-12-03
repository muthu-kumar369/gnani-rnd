# Stage 2.1: Error Handling & Recovery

**Duration:** Week 5-6 (10 working days)  
**Priority:** 🔴 Critical  
**Dependencies:** Month 1 Complete

---

## Overview

Implement comprehensive error handling and recovery mechanisms across frontend and backend to ensure GNANI never crashes and always recovers gracefully from failures.

## Goals

1. Add React Error Boundaries in frontend
2. Implement backend error categorization and handling
3. Add automatic retry logic with exponential backoff
4. Implement graceful degradation for service failures

---

## Frontend Error Handling

### Task 1: Enhanced Error Boundary

**File:** `gnani-rnd/react/src/components/ErrorBoundary.tsx`

**Current:** Basic error boundary exists but needs enhancement

**Add Error Recovery:**

```typescript
import React, { Component, ErrorInfo, ReactNode } from 'react';
import errorLogger from '../utils/errorLogger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorCount: number;
  lastErrorTime: number;
}

class ErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;
  private retryDelay = 1000;

  public state: State = {
    hasError: false,
    error: null,
    errorCount: 0,
    lastErrorTime: 0
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const now = Date.now();
    const timeSinceLastError = now - this.state.lastErrorTime;

    // Reset count if more than 5 minutes since last error
    const errorCount = timeSinceLastError > 300000 
      ? 1 
      : this.state.errorCount + 1;

    this.setState({ errorCount, lastErrorTime: now });

    // Log error
    errorLogger.error('React Error Boundary caught error', error, {
      context: 'ErrorBoundary',
      errorInfo,
      errorCount
    });

    // Send to error tracking service
    if (window.electron?.ipcRenderer) {
      window.electron.ipcRenderer.send('error:report', {
        error: error.message,
        stack: error.stack,
        errorInfo
      });
    }

    // Call custom error handler
    this.props.onError?.(error, errorInfo);

    // Attempt recovery
    this.attemptRecovery(error);
  }

  private attemptRecovery(error: Error) {
    const { errorCount } = this.state;

    if (errorCount <= this.maxRetries) {
      errorLogger.info('Attempting automatic recovery', { 
        attempt: errorCount,
        maxRetries: this.maxRetries 
      });

      // Categorize error and apply specific recovery
      if (error.message.includes('gRPC') || error.message.includes('network')) {
        this.recoverFromNetworkError();
      } else if (error.message.includes('audio') || error.message.includes('microphone')) {
        this.recoverFromAudioError();
      } else {
        this.recoverGeneric();
      }
    }
  }

  private recoverFromNetworkError() {
    errorLogger.info('Recovering from network error');
    
    // Reconnect gRPC
    if (window.electron?.grpc) {
      setTimeout(() => {
        window.electron.grpc.reconnect();
        this.resetError();
      }, this.retryDelay);
    }
  }

  private recoverFromAudioError() {
    errorLogger.info('Recovering from audio error');
    
    // Reset audio system
    if (window.electron?.audio) {
      setTimeout(() => {
        window.electron.audio.reset();
        this.resetError();
      }, this.retryDelay);
    }
  }

  private recoverGeneric() {
    errorLogger.info('Attempting generic recovery');
    
    // Simple retry after delay
    setTimeout(() => {
      this.resetError();
    }, this.retryDelay * this.state.errorCount);
  }

  private resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white p-4">
          <h1 className="text-2xl font-bold text-red-500 mb-4">
            Something went wrong
          </h1>
          <p className="text-gray-300 mb-2">
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <p className="text-sm text-gray-400 mb-6">
            Attempt {this.state.errorCount} of {this.maxRetries}
          </p>
          
          <div className="flex gap-4">
            <button
              className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 transition"
              onClick={this.resetError}
            >
              Try Again
            </button>
            <button
              className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-700 transition"
              onClick={() => window.location.reload()}
            >
              Reload Application
            </button>
          </div>

          {this.state.errorCount >= this.maxRetries && (
            <p className="mt-4 text-yellow-500">
              ⚠️ Multiple errors detected. Please restart the application.
            </p>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

### Task 2: Add Error Boundaries to Key Components

**File:** `gnani-rnd/react/src/main.tsx`

```typescript
import ErrorBoundary from './components/ErrorBoundary';

// Wrap entire app
<ErrorBoundary>
  <App />
</ErrorBoundary>

// Also wrap critical components
<ErrorBoundary fallback={<div>Audio system error</div>}>
  <GnaniCore />
</ErrorBoundary>
```

---

## Backend Error Handling

### Task 3: Error Classification System

**File:** `gnani-rnd-backend/src/shared/errors/error-types.ts`

```typescript
export class GnaniError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class LLMError extends GnaniError {
  constructor(message: string, public provider: string) {
    super(message, 'LLM_ERROR', 503, true);
  }
}

export class STTError extends GnaniError {
  constructor(message: string) {
    super(message, 'STT_ERROR', 503, true);
  }
}

export class ToolError extends GnaniError {
  constructor(message: string, public toolName: string) {
    super(message, 'TOOL_ERROR', 500, true);
  }
}

export class SessionError extends GnaniError {
  constructor(message: string) {
    super(message, 'SESSION_ERROR', 404, true);
  }
}

export class ValidationError extends GnaniError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400, true);
  }
}
```

### Task 4: Global Error Handler

**File:** `gnani-rnd-backend/src/shared/errors/error-handler.ts`

```typescript
import { createContextualLogger } from '../../core/logger/logger.js';
import metrics from '../../core/monitoring/metrics.js';
import { GnaniError } from './error-types.js';

class ErrorHandler {
  private logger = createContextualLogger({ module: 'ErrorHandler' });

  handle(error: Error, context: string = 'unknown'): void {
    // Log error
    this.logger.error(error.message, {
      context,
      stack: error.stack,
      type: error.constructor.name
    });

    // Track metrics
    metrics.increment('errors_total', {
      type: error.constructor.name,
      context
    });

    // Categorize and handle
    if (error instanceof GnaniError) {
      this.handleOperationalError(error, context);
    } else {
      this.handleProgrammerError(error, context);
    }
  }

  private handleOperationalError(error: GnaniError, context: string): void {
    this.logger.warn('Operational error occurred', {
      code: error.code,
      message: error.message,
      context
    });

    // Operational errors are expected, don't crash
    // Just log and continue
  }

  private handleProgrammerError(error: Error, context: string): void {
    this.logger.error('Programmer error occurred', {
      message: error.message,
      stack: error.stack,
      context
    });

    // For programmer errors, we might want to alert
    // but still try to continue
    this.sendAlert(error, context);
  }

  private sendAlert(error: Error, context: string): void {
    // Send to monitoring service (e.g., Sentry, PagerDuty)
    this.logger.error('ALERT: Critical error', {
      error: error.message,
      context
    });
  }

  async handleAsync(
    fn: () => Promise<any>,
    context: string = 'async-operation'
  ): Promise<any> {
    try {
      return await fn();
    } catch (error) {
      this.handle(error as Error, context);
      throw error;
    }
  }
}

export default new ErrorHandler();
```

### Task 5: Retry Logic with Exponential Backoff

**File:** `gnani-rnd-backend/src/shared/utils/retry.ts`

```typescript
import { createContextualLogger } from '../../core/logger/logger.js';

const logger = createContextualLogger({ module: 'RetryUtil' });

export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  shouldRetry?: (error: Error) => boolean;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 30000,
    backoffMultiplier = 2,
    shouldRetry = () => true
  } = options;

  let lastError: Error;
  let delay = initialDelay;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Check if we should retry
      if (!shouldRetry(lastError)) {
        logger.warn('Error not retryable', { error: lastError.message });
        throw lastError;
      }

      // Check if we've exhausted retries
      if (attempt === maxRetries) {
        logger.error('Max retries exhausted', {
          attempts: attempt,
          error: lastError.message
        });
        throw lastError;
      }

      // Log retry attempt
      logger.warn('Retrying after error', {
        attempt,
        maxRetries,
        delay,
        error: lastError.message
      });

      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, delay));

      // Exponential backoff
      delay = Math.min(delay * backoffMultiplier, maxDelay);
    }
  }

  throw lastError!;
}

// Helper for specific error types
export function isRetryableError(error: Error): boolean {
  const retryablePatterns = [
    'ECONNREFUSED',
    'ETIMEDOUT',
    'ENOTFOUND',
    'network',
    'timeout',
    'temporarily unavailable'
  ];

  return retryablePatterns.some(pattern =>
    error.message.toLowerCase().includes(pattern.toLowerCase())
  );
}
```

### Task 6: Apply Retry Logic to Services

**File:** `gnani-rnd-backend/src/modules/session/llm.executor.ts`

```typescript
import { withRetry, isRetryableError } from '../../shared/utils/retry.js';
import { LLMError } from '../../shared/errors/error-types.js';

export class LLMExecutor {
  async generate(context: any, onChunk?: Function): Promise<any> {
    return withRetry(
      async () => {
        try {
          return await this.generateInternal(context, onChunk);
        } catch (error) {
          throw new LLMError(
            `LLM generation failed: ${error.message}`,
            'ollama'
          );
        }
      },
      {
        maxRetries: 3,
        initialDelay: 1000,
        shouldRetry: isRetryableError
      }
    );
  }

  private async generateInternal(context: any, onChunk?: Function): Promise<any> {
    // Actual LLM generation logic
    // ...
  }
}
```

---

## Graceful Degradation

### Task 7: Fallback Mechanisms

**File:** `gnani-rnd-backend/src/modules/session/session.coordinator.ts`

```typescript
export class SessionCoordinator {
  private async handleFinalTranscript(sessionId: string, transcript: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    try {
      // Try full flow
      const context = await this.contextBuilder.build(sessionId, session.userId, transcript);
      const response = await this.llmExecutor.generate(context, session.onLlmChunkCallback);
      
      if (response.toolCalls?.length > 0) {
        await this.toolExecutor.executeTools(sessionId, response.toolCalls, session.onToolStatusCallback);
      }

    } catch (error: any) {
      this.logger.error('Error in full flow, attempting graceful degradation', {
        sessionId,
        error: error.message
      });

      // Graceful degradation: try without RAG
      try {
        const simpleContext = { transcript, recentMessages: [] };
        const response = await this.llmExecutor.generate(simpleContext, session.onLlmChunkCallback);
        
        this.logger.info('Graceful degradation successful', { sessionId });
        
      } catch (degradedError: any) {
        // Last resort: return error message to user
        if (session.onLlmChunkCallback) {
          await session.onLlmChunkCallback(
            "I'm having trouble processing that right now. Please try again."
          );
        }
        
        this.logger.error('All fallbacks failed', {
          sessionId,
          error: degradedError.message
        });
      }
    }
  }
}
```

---

## Testing Plan

### Unit Tests

**File:** `gnani-rnd-backend/tests/unit/error-handling.test.ts`

```typescript
import { withRetry, isRetryableError } from '../../src/shared/utils/retry';

describe('Retry Logic', () => {
  it('should retry on retryable errors', async () => {
    let attempts = 0;
    const fn = async () => {
      attempts++;
      if (attempts < 3) {
        throw new Error('ECONNREFUSED');
      }
      return 'success';
    };

    const result = await withRetry(fn, { maxRetries: 3, initialDelay: 10 });
    
    expect(result).toBe('success');
    expect(attempts).toBe(3);
  });

  it('should not retry on non-retryable errors', async () => {
    let attempts = 0;
    const fn = async () => {
      attempts++;
      throw new Error('Invalid input');
    };

    await expect(
      withRetry(fn, { 
        maxRetries: 3, 
        initialDelay: 10,
        shouldRetry: isRetryableError
      })
    ).rejects.toThrow('Invalid input');
    
    expect(attempts).toBe(1);
  });
});
```

---

## Success Metrics

- ✅ Error boundaries prevent UI crashes
- ✅ All errors categorized and logged
- ✅ Retry logic reduces transient failures by 90%
- ✅ Graceful degradation maintains basic functionality
- ✅ Error recovery rate > 80%
- ✅ All tests passing

---

## Next Stage

**Stage 2.2: Monitoring & Observability**
