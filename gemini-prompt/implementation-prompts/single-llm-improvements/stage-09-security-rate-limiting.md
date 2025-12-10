# Stage 9: Security & Rate Limiting

**Priority:** P0  
**Estimated Time:** 1 week  
**Dependencies:** Stage 3 (Error Handling)

---

## Objective

Implement production-grade security measures including rate limiting, input validation, audit logging, and protection against common attacks.

---

## Implementation

### 1. Rate Limiting

**File:** `src/middleware/rate-limit.middleware.ts`

```typescript
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import redis from '../config/redis.config.js';

// Global API rate limiter
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    client: redis,
    prefix: 'rl:api:'
  }),
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests, please try again later',
        retryAfter: 60
      }
    });
  }
});

// LLM-specific rate limiter (more restrictive)
export const llmLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20, // 20 LLM requests per minute
  store: new RedisStore({
    client: redis,
    prefix: 'rl:llm:'
  }),
  keyGenerator: (req) => {
    // Rate limit by user ID if authenticated, otherwise by IP
    return (req as any).userId || req.ip;
  }
});

// Auth endpoints rate limiter (very restrictive)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per 15 minutes
  store: new RedisStore({
    client: redis,
    prefix: 'rl:auth:'
  })
});

// gRPC rate limiter
export class GrpcRateLimiter {
  private limits: Map<string, { count: number; resetAt: number }> = new Map();
  private readonly maxRequests = 100;
  private readonly windowMs = 60000;

  async checkLimit(userId: string): Promise<boolean> {
    const now = Date.now();
    const userLimit = this.limits.get(userId);

    if (!userLimit || now > userLimit.resetAt) {
      this.limits.set(userId, {
        count: 1,
        resetAt: now + this.windowMs
      });
      return true;
    }

    if (userLimit.count >= this.maxRequests) {
      return false;
    }

    userLimit.count++;
    return true;
  }
}

export const grpcRateLimiter = new GrpcRateLimiter();
```

### 2. Input Validation

**File:** `src/middleware/validation.middleware.ts`

```typescript
import { body, param, query, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../shared/errors/error-types.js';

// Validation error handler
export function handleValidationErrors(req: Request, res: Response, next: NextFunction) {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    throw new ValidationError(
      'Validation failed',
      { errors: errors.array(), path: req.path }
    );
  }
  
  next();
}

// Text input validation
export const validateTextInput = [
  body('text')
    .isString()
    .trim()
    .isLength({ min: 1, max: 5000 })
    .withMessage('Text must be between 1 and 5000 characters')
    .matches(/^[a-zA-Z0-9\s.,!?'"()-]+$/)
    .withMessage('Text contains invalid characters'),
  handleValidationErrors
];

// Conversation ID validation
export const validateConversationId = [
  param('conversationId')
    .isUUID()
    .withMessage('Invalid conversation ID format'),
  handleValidationErrors
];

// Pagination validation
export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .toInt(),
  handleValidationErrors
];

// Sanitize user input
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, ''); // Remove event handlers
}
```

### 3. Audit Logging

**File:** `src/core/logger/audit.service.ts`

```typescript
import { createContextualLogger } from './logger.js';
import AuditLog from './audit-log.model.js';

const logger = createContextualLogger({ module: 'AuditService' });

export class AuditService {
  /**
   * Log security event
   */
  async logSecurityEvent(
    eventType: string,
    userId: string | null,
    details: any,
    severity: 'low' | 'medium' | 'high' | 'critical'
  ): Promise<void> {
    try {
      await AuditLog.create({
        eventType,
        userId,
        category: 'security',
        severity,
        details,
        timestamp: new Date(),
        ipAddress: details.ip,
        userAgent: details.userAgent
      });

      logger.info('Security event logged', {
        eventType,
        userId,
        severity
      });

      // Alert on critical events
      if (severity === 'critical') {
        await this.alertSecurityTeam(eventType, details);
      }
    } catch (error: any) {
      logger.error(`Failed to log audit event: ${error.message}`);
    }
  }

  /**
   * Log authentication event
   */
  async logAuthEvent(
    userId: string,
    eventType: 'login' | 'logout' | 'failed_login' | 'password_reset',
    success: boolean,
    details: any
  ): Promise<void> {
    await this.logSecurityEvent(
      `auth_${eventType}`,
      userId,
      { ...details, success },
      success ? 'low' : 'medium'
    );
  }

  /**
   * Log data access
   */
  async logDataAccess(
    userId: string,
    resource: string,
    action: 'read' | 'write' | 'delete',
    details: any
  ): Promise<void> {
    await AuditLog.create({
      eventType: `data_${action}`,
      userId,
      category: 'data_access',
      severity: 'low',
      details: { resource, ...details },
      timestamp: new Date()
    });
  }

  private async alertSecurityTeam(eventType: string, details: any): Promise<void> {
    // TODO: Integrate with alerting system (PagerDuty, Slack, etc.)
    logger.error('CRITICAL SECURITY EVENT', { eventType, details });
  }
}

export default new AuditService();
```

**File:** `src/core/logger/audit-log.model.ts`

```typescript
import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
  eventType: string;
  userId: string | null;
  category: 'security' | 'data_access' | 'system' | 'compliance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: any;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

const AuditLogSchema = new Schema<IAuditLog>({
  eventType: { type: String, required: true, index: true },
  userId: { type: String, index: true },
  category: { type: String, required: true, index: true },
  severity: { type: String, required: true, index: true },
  details: Schema.Types.Mixed,
  timestamp: { type: Date, default: Date.now, index: true },
  ipAddress: String,
  userAgent: String
});

// Compound indexes for common queries
AuditLogSchema.index({ userId: 1, timestamp: -1 });
AuditLogSchema.index({ category: 1, severity: 1, timestamp: -1 });

// TTL index - delete logs older than 90 days
AuditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export default mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
```

### 4. Security Headers

**File:** `src/middleware/security.middleware.ts`

```typescript
import helmet from 'helmet';
import { Request, Response, NextFunction } from 'express';

// Helmet configuration for security headers
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  xssFilter: true,
  hidePoweredBy: true
});

// CORS configuration
export function corsMiddleware(req: Request, res: Response, next: NextFunction) {
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'];
  const origin = req.headers.origin;

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
}
```

### 5. Secrets Management

**File:** `src/config/secrets.config.ts`

```typescript
import { createContextualLogger } from '../core/logger/logger.js';

const logger = createContextualLogger({ module: 'Secrets' });

export class SecretsManager {
  private secrets: Map<string, string> = new Map();

  constructor() {
    this.loadSecrets();
  }

  private loadSecrets() {
    // In production, load from HashiCorp Vault, AWS Secrets Manager, etc.
    // For now, load from environment variables
    const requiredSecrets = [
      'JWT_SECRET',
      'MONGODB_URI',
      'REDIS_PASSWORD',
      'LLM_API_KEY'
    ];

    for (const key of requiredSecrets) {
      const value = process.env[key];
      if (!value) {
        logger.warn(`Missing secret: ${key}`);
      } else {
        this.secrets.set(key, value);
      }
    }
  }

  get(key: string): string | undefined {
    return this.secrets.get(key);
  }

  getOrThrow(key: string): string {
    const value = this.secrets.get(key);
    if (!value) {
      throw new Error(`Required secret not found: ${key}`);
    }
    return value;
  }

  // Rotate secret (for production)
  async rotate(key: string, newValue: string): Promise<void> {
    this.secrets.set(key, newValue);
    logger.info(`Secret rotated: ${key}`);
  }
}

export default new SecretsManager();
```

---

## Testing

```typescript
describe('Security', () => {
  it('should rate limit excessive requests', async () => {
    const requests = Array(70).fill(null).map(() =>
      request(app).get('/api/health')
    );

    const responses = await Promise.all(requests);
    const rateLimited = responses.filter(r => r.status === 429);

    expect(rateLimited.length).toBeGreaterThan(0);
  });

  it('should reject invalid input', async () => {
    const response = await request(app)
      .post('/api/conversation/message')
      .send({ text: '<script>alert("xss")</script>' });

    expect(response.status).toBe(400);
  });

  it('should log security events', async () => {
    await auditService.logSecurityEvent(
      'suspicious_activity',
      'user-123',
      { action: 'test' },
      'high'
    );

    const logs = await AuditLog.find({ userId: 'user-123' });
    expect(logs.length).toBeGreaterThan(0);
  });
});
```

---

## Verification Checklist

- [ ] Rate limiting enforced on all endpoints
- [ ] Input validation on all user inputs
- [ ] Audit logging for sensitive operations
- [ ] Security headers configured (Helmet.js)
- [ ] CORS properly configured
- [ ] Secrets not in code/env files
- [ ] XSS protection enabled
- [ ] SQL injection protection (via Mongoose)
- [ ] CSRF protection (if using cookies)

---

## Success Criteria

1. ✅ Rate limiting prevents abuse
2. ✅ All inputs validated and sanitized
3. ✅ Security events logged and monitored
4. ✅ No secrets in code repository
5. ✅ Security headers score A+ on securityheaders.com
