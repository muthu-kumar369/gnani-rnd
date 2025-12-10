# Stage 5: Structured Logging & Distributed Tracing

**Priority:** P0  
**Time:** 1 week  
**Dependencies:** None

---

## Objective

Implement structured JSON logging and distributed tracing to enable debugging of complex flows across services.

---

## Implementation

### 1. Structured Logger Enhancement

**File:** `src/core/logger/logger.ts`

Update existing logger to output JSON format:

```typescript
import winston from 'winston';

const jsonFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: jsonFormat,
  defaultMeta: {
    service: 'gnani-backend',
    environment: process.env.NODE_ENV,
    version: process.env.APP_VERSION
  },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: process.env.NODE_ENV === 'development'
        ? winston.format.combine(winston.format.colorize(), winston.format.simple())
        : jsonFormat
    })
  ]
});

export function createContextualLogger(context: Record<string, any>) {
  return logger.child(context);
}
```

### 2. Request ID Middleware

**File:** `src/middleware/request-id.middleware.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction) {
  const requestId = req.headers['x-request-id'] as string || uuidv4();
  (req as any).requestId = requestId;
  res.setHeader('X-Request-ID', requestId);
  next();
}
```

### 3. OpenTelemetry Setup

**File:** `src/core/tracing/tracer.ts`

```typescript
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'gnani-backend',
    [SemanticResourceAttributes.SERVICE_VERSION]: process.env.APP_VERSION || '1.0.0'
  }),
  traceExporter: new JaegerExporter({
    endpoint: process.env.JAEGER_ENDPOINT || 'http://localhost:14268/api/traces'
  }),
  instrumentations: [
    getNodeAutoInstrumentations({
      '@opentelemetry/instrumentation-fs': { enabled: false }
    })
  ]
});

sdk.start();

export default sdk;
```

### 4. Custom Spans

**File:** `src/modules/session/session.coordinator.ts`

Add tracing to critical flows:

```typescript
import { trace } from '@opentelemetry/api';

const tracer = trace.getTracer('session-coordinator');

async handleFinalTranscript(sessionId: string, transcript: string): Promise<void> {
  const span = tracer.startSpan('handleFinalTranscript', {
    attributes: {
      'session.id': sessionId,
      'transcript.length': transcript.length
    }
  });

  try {
    // Context building
    const contextSpan = tracer.startSpan('buildContext', { parent: span });
    const context = await this.contextBuilder.build(sessionId, userId, transcript);
    contextSpan.end();

    // LLM generation
    const llmSpan = tracer.startSpan('llmGenerate', { parent: span });
    const response = await this.llmExecutor.generate(context);
    llmSpan.setAttribute('response.length', response.text.length);
    llmSpan.end();

    span.setStatus({ code: 0 }); // Success
  } catch (error: any) {
    span.recordException(error);
    span.setStatus({ code: 2, message: error.message }); // Error
    throw error;
  } finally {
    span.end();
  }
}
```

---

## Verification

- [ ] All logs output as JSON
- [ ] Request IDs propagated through entire request lifecycle
- [ ] OpenTelemetry traces visible in Jaeger
- [ ] Critical flows instrumented with custom spans
- [ ] Logs include correlation IDs

---

## Success Criteria

1. ✅ End-to-end request tracing working
2. ✅ Logs parseable by log aggregation tools
3. ✅ <1% performance overhead from tracing
4. ✅ Distributed traces show complete request flow
