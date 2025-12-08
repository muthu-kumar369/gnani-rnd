# Stage 3: Error Handling & Retry Logic

**Priority:** P0 (Blocking Production)  
**Estimated Time:** 1 week  
**Dependencies:** Stage 2 (Circuit Breakers)

---

## Objective

Standardize error handling across the entire application with consistent error codes, retry logic with exponential backoff, and graceful degradation strategies.

---

## Implementation

### 1. Error Classification System

**File:** `src/shared/errors/error-types.ts`

```typescript
export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export enum ErrorCategory {
  NETWORK = 'NETWORK',
  DATABASE = 'DATABASE',
  EXTERNAL_SERVICE = 'EXTERNAL_SERVICE',
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  BUSINESS_LOGIC = 'BUSINESS_LOGIC',
  SYSTEM = 'SYSTEM'
}

export interface ErrorContext {
  userId?: string;
  sessionId?: string;
  requestId?: string;
  timestamp: Date;
  stackTrace?: string;
  additionalData?: Record<string, any>;
}

export class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public severity: ErrorSeverity,
    public category: ErrorCategory,
    public isRetryable: boolean = false,
    public context?: ErrorContext
  ) {
    super(message);
    this.name = 'AppError';
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      severity: this.severity,
      category: this.category,
      isRetryable: this.isRetryable,
      context: this.context
    };
  }
}

// Specific error classes
export class NetworkError extends AppError {
  constructor(message: string, context?: ErrorContext) {
    super('NETWORK_ERROR', message, ErrorSeverity.MEDIUM, ErrorCategory.NETWORK, true, context);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, context?: ErrorContext) {
    super('DATABASE_ERROR', message, ErrorSeverity.HIGH, ErrorCategory.DATABASE, true, context);
  }
}

export class LLMError extends AppError {
  constructor(message: string, isRetryable: boolean = true, context?: ErrorContext) {
    super('LLM_ERROR', message, ErrorSeverity.HIGH, ErrorCategory.EXTERNAL_SERVICE, isRetryable, context);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, context?: ErrorContext) {
    super('VALIDATION_ERROR', message, ErrorSeverity.LOW, ErrorCategory.VALIDATION, false, context);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string, context?: ErrorContext) {
    super('AUTH_ERROR', message, ErrorSeverity.MEDIUM, ErrorCategory.AUTHENTICATION, false, context);
  }
}
```

### 2. Enhanced Retry Utility

**File:** `src/utils/retry.ts`

```typescript
import { createContextualLogger } from '../core/logger/logger.js';
import { AppError, ErrorSeverity } from '../shared/errors/error-types.js';

const logger = createContextualLogger({ module: 'RetryUtil' });

export interface RetryOptions {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  exponentialBase: number;
  jitter: boolean;
  retryableErrors?: string[]; // Error codes that should trigger retry
  onRetry?: (attempt: number, error: Error) => void;
}

const DEFAULT_OPTIONS: RetryOptions = {
  maxRetries: 3,
  baseDelayMs: 500,
  maxDelayMs: 10000,
  exponentialBase: 2,
  jitter: true
};

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {},
  operationName: string = 'Operation'
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      logger.debug(`${operationName}: Attempt ${attempt + 1}/${opts.maxRetries + 1}`);
      return await fn();
    } catch (error: any) {
      lastError = error;

      // Check if error is retryable
      if (error instanceof AppError && !error.isRetryable) {
        logger.warn(`${operationName}: Non-retryable error, aborting: ${error.message}`);
        throw error;
      }

      // Check if we've exhausted retries
      if (attempt === opts.maxRetries) {
        logger.error(`${operationName}: Max retries (${opts.maxRetries}) exceeded`);
        break;
      }

      // Calculate delay with exponential backoff
      const exponentialDelay = opts.baseDelayMs * Math.pow(opts.exponentialBase, attempt);
      let delay = Math.min(exponentialDelay, opts.maxDelayMs);

      // Add jitter to prevent thundering herd
      if (opts.jitter) {
        delay = delay * (0.5 + Math.random() * 0.5);
      }

      logger.warn(`${operationName}: Attempt ${attempt + 1} failed: ${error.message}. Retrying in ${Math.round(delay)}ms...`);

      // Call onRetry callback if provided
      if (opts.onRetry) {
        opts.onRetry(attempt + 1, error);
      }

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

// Specialized retry for specific operations
export async function retryDatabaseOperation<T>(
  fn: () => Promise<T>,
  operationName: string = 'Database Operation'
): Promise<T> {
  return retryWithBackoff(fn, {
    maxRetries: 3,
    baseDelayMs: 1000,
    maxDelayMs: 5000,
    onRetry: (attempt, error) => {
      logger.warn(`Database retry attempt ${attempt}: ${error.message}`);
    }
  }, operationName);
}

export async function retryNetworkOperation<T>(
  fn: () => Promise<T>,
  operationName: string = 'Network Operation'
): Promise<T> {
  return retryWithBackoff(fn, {
    maxRetries: 5,
    baseDelayMs: 500,
    maxDelayMs: 10000,
    jitter: true
  }, operationName);
}
```

### 3. Global Error Handler

**File:** `src/middleware/error-handler.middleware.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { AppError, ErrorSeverity } from '../shared/errors/error-types.js';
import { createContextualLogger } from '../core/logger/logger.js';
import metrics from '../core/monitoring/metrics.js';

const logger = createContextualLogger({ module: 'ErrorHandler' });

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Log error with context
  const context = {
    method: req.method,
    path: req.path,
    userId: (req as any).userId,
    sessionId: (req as any).sessionId,
    ip: req.ip
  };

  if (error instanceof AppError) {
    logger.error(`${error.code}: ${error.message}`, { ...context, ...error.context });

    // Increment error metrics
    metrics.errorCounter.inc({
      code: error.code,
      category: error.category,
      severity: error.severity
    });

    // Alert on critical errors
    if (error.severity === ErrorSeverity.CRITICAL) {
      // TODO: Send to alerting system (PagerDuty, Slack, etc.)
      logger.error('CRITICAL ERROR DETECTED', { error: error.toJSON(), context });
    }

    // Return appropriate HTTP status
    const statusCode = getHttpStatusCode(error);
    return res.status(statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        severity: error.severity,
        isRetryable: error.isRetryable
      }
    });
  }

  // Unknown error
  logger.error(`Unhandled error: ${error.message}`, { ...context, stack: error.stack });
  metrics.errorCounter.inc({ code: 'UNKNOWN_ERROR', category: 'SYSTEM', severity: 'HIGH' });

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      isRetryable: false
    }
  });
}

function getHttpStatusCode(error: AppError): number {
  switch (error.category) {
    case 'VALIDATION':
      return 400;
    case 'AUTHENTICATION':
      return 401;
    case 'AUTHORIZATION':
      return 403;
    case 'BUSINESS_LOGIC':
      return 422;
    case 'NETWORK':
    case 'DATABASE':
    case 'EXTERNAL_SERVICE':
      return 503;
    default:
      return 500;
  }
}
```

### 4. Graceful Degradation Strategies

**File:** `src/core/reliability/degradation.service.ts`

```typescript
import { createContextualLogger } from '../logger/logger.js';

const logger = createContextualLogger({ module: 'Degradation' });

export class DegradationService {
  /**
   * Execute with fallback
   */
  async executeWithFallback<T>(
    primary: () => Promise<T>,
    fallback: () => Promise<T> | T,
    operationName: string
  ): Promise<T> {
    try {
      return await primary();
    } catch (error: any) {
      logger.warn(`${operationName} failed, using fallback: ${error.message}`);
      return await fallback();
    }
  }

  /**
   * Execute with multiple fallbacks
   */
  async executeWithFallbacks<T>(
    strategies: Array<() => Promise<T>>,
    operationName: string
  ): Promise<T> {
    let lastError: Error;

    for (let i = 0; i < strategies.length; i++) {
      try {
        logger.debug(`${operationName}: Trying strategy ${i + 1}/${strategies.length}`);
        return await strategies[i]();
      } catch (error: any) {
        lastError = error;
        logger.warn(`${operationName}: Strategy ${i + 1} failed: ${error.message}`);
      }
    }

    logger.error(`${operationName}: All strategies failed`);
    throw lastError!;
  }
}

export default new DegradationService();
```

**Usage Example:**

```typescript
// In LLM Service
async getLlmResponse(prompt: any): Promise<string> {
  return degradationService.executeWithFallbacks([
    // Strategy 1: Full RAG + LLM
    async () => {
      const context = await this.contextBuilder.build(prompt);
      return await this.llm.generate(context);
    },
    // Strategy 2: LLM without RAG
    async () => {
      logger.warn('RAG failed, using LLM without context');
      return await this.llm.generate({ prompt: prompt.query });
    },
    // Strategy 3: Cached response
    async () => {
      logger.warn('LLM failed, checking cache');
      const cached = await this.cache.get(prompt.query);
      if (cached) return cached;
      throw new Error('No cached response');
    },
    // Strategy 4: Fallback message
    async () => {
      logger.error('All strategies failed, returning fallback');
      return "I'm having trouble processing that right now. Please try again.";
    }
  ], 'LLM Response Generation');
}
```

---

## Testing

```typescript
describe('Error Handling', () => {
  it('should retry on retryable errors', async () => {
    let attempts = 0;
    const fn = async () => {
      attempts++;
      if (attempts < 3) {
        throw new NetworkError('Connection failed');
      }
      return 'success';
    };

    const result = await retryWithBackoff(fn, { maxRetries: 3 });
    expect(result).toBe('success');
    expect(attempts).toBe(3);
  });

  it('should not retry on non-retryable errors', async () => {
    let attempts = 0;
    const fn = async () => {
      attempts++;
      throw new ValidationError('Invalid input');
    };

    await expect(retryWithBackoff(fn, { maxRetries: 3 })).rejects.toThrow();
    expect(attempts).toBe(1);
  });
});
```

---

## Verification Checklist

- [ ] Error classification system implemented
- [ ] Retry utility with exponential backoff
- [ ] Global error handler middleware
- [ ] Graceful degradation service
- [ ] Error metrics exported
- [ ] All services updated to use new error types
- [ ] Unit tests passing
- [ ] Integration tests passing

---

## Success Criteria

1. ✅ All errors classified and logged consistently
2. ✅ Automatic retry on transient failures
3. ✅ Graceful degradation when services fail
4. ✅ Error metrics tracked in Prometheus
5. ✅ Critical errors trigger alerts
