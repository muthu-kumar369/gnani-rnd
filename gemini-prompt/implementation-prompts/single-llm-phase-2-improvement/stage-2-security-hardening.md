# Stage 2: Security Hardening

**Priority:** P0 (Blocking Production)  
**Duration:** 7 days  
**Dependencies:** None  
**Current Completion:** 50%

---

## Context & Background

### Current State Analysis

Gnani has basic security mechanisms but lacks production-grade security hardening:

**✅ What Exists:**
- `src/core/security/auth.middleware.ts` - JWT authentication
- `src/core/security/jwt.utils.ts` - JWT token utilities
- `src/core/security/permissions.checker.ts` - Permission-based access control
- `src/middleware/rate-limit.middleware.ts` - HTTP rate limiting only
- Basic input validation (partial)

**❌ What's Missing:**
- **gRPC rate limiting** (P0 - critical security gap)
- **Comprehensive input validation and sanitization** (P0)
- **Secrets management** (currently in .env files)
- **PII detection and masking**
- **Content filtering for safety**
- **Abuse detection**
- **Security audit logging**

### Why This Matters

Without comprehensive security:
- **Vulnerable to DDoS** attacks on gRPC endpoints
- **Injection attacks** possible through unsanitized inputs
- **Secrets exposure** risk from .env files in version control
- **Privacy violations** from unmasked PII in logs
- **Harmful content** generation without filtering
- **Abuse** from malicious users without detection

---

## Objectives

### Primary Goals

1. **Prevent Abuse** - Rate limiting on all endpoints (HTTP + gRPC)
2. **Input Safety** - Validate and sanitize all user inputs
3. **Secrets Protection** - Secure storage and rotation of secrets
4. **Privacy Compliance** - Detect and mask PII
5. **Content Safety** - Filter harmful content requests/responses

### Success Criteria

- [ ] gRPC rate limiting implemented and tested
- [ ] All inputs validated with schemas
- [ ] Secrets moved to secure vault
- [ ] PII detection working with 95%+ accuracy
- [ ] Content filtering blocking harmful requests
- [ ] Security audit logs capturing all critical events
- [ ] Security documentation complete
- [ ] Penetration testing passed

---

## Technical Requirements

### 1. gRPC Rate Limiting

#### Problem Statement

Currently, only HTTP endpoints have rate limiting. gRPC endpoints (audio streaming, session management) are unprotected, making them vulnerable to:
- Resource exhaustion attacks
- Brute force attempts
- Accidental client bugs causing request floods

#### Implementation Approach

**Option A: Token Bucket Algorithm (Recommended)**

Create `src/middleware/grpc-rate-limit.middleware.ts`:

```typescript
import { ServerUnaryCall, ServerWritableStream, status } from '@grpc/grpc-js';
import { RedisService } from '@/core/cache/redis.service';
import { Logger } from '@/core/logger/logger';

interface RateLimitConfig {
  windowMs: number;        // Time window in milliseconds
  maxRequests: number;     // Max requests per window
  keyGenerator: (call: any) => string;  // Function to generate rate limit key
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export class GrpcRateLimiter {
  private readonly logger = new Logger('GrpcRateLimiter');
  
  constructor(
    private readonly redis: RedisService,
    private readonly config: RateLimitConfig
  ) {}

  /**
   * Middleware for unary calls (single request/response)
   */
  async checkUnaryRateLimit(call: ServerUnaryCall<any, any>): Promise<void> {
    const key = this.config.keyGenerator(call);
    const rateLimitKey = `rate_limit:${key}`;
    
    const current = await this.redis.incr(rateLimitKey);
    
    if (current === 1) {
      // First request in window, set expiry
      await this.redis.expire(rateLimitKey, Math.ceil(this.config.windowMs / 1000));
    }
    
    if (current > this.config.maxRequests) {
      this.logger.warn(`Rate limit exceeded for key: ${key}`, {
        current,
        limit: this.config.maxRequests,
        metadata: call.metadata.getMap(),
      });
      
      throw {
        code: status.RESOURCE_EXHAUSTED,
        message: `Rate limit exceeded. Try again in ${this.config.windowMs / 1000}s`,
        details: {
          retryAfter: this.config.windowMs / 1000,
          limit: this.config.maxRequests,
          windowMs: this.config.windowMs,
        },
      };
    }
    
    // Add rate limit headers to metadata
    call.metadata.set('X-RateLimit-Limit', this.config.maxRequests.toString());
    call.metadata.set('X-RateLimit-Remaining', (this.config.maxRequests - current).toString());
  }

  /**
   * Middleware for streaming calls
   */
  async checkStreamRateLimit(call: ServerWritableStream<any, any>): Promise<void> {
    // Similar to unary, but may need different limits for streams
    return this.checkUnaryRateLimit(call as any);
  }
}

/**
 * Factory function to create rate limiters for different endpoints
 */
export function createGrpcRateLimiter(
  redis: RedisService,
  config: Partial<RateLimitConfig> = {}
): GrpcRateLimiter {
  const defaultConfig: RateLimitConfig = {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
    keyGenerator: (call) => {
      // Use user ID from JWT if available, otherwise IP
      const userId = call.metadata.get('user-id')?.[0];
      const ip = call.metadata.get('x-forwarded-for')?.[0] || 
                 call.getPeer(); // Fallback to peer address
      return userId || ip;
    },
    ...config,
  };
  
  return new GrpcRateLimiter(redis, defaultConfig);
}
```

#### Rate Limit Configurations

Create `src/config/rate-limits.config.ts`:

```typescript
export const RATE_LIMIT_CONFIGS = {
  // Audio streaming - more lenient (long-running connections)
  audioStream: {
    windowMs: 60 * 1000,      // 1 minute
    maxRequests: 10,          // 10 stream starts per minute
  },
  
  // Session management - moderate
  sessionManagement: {
    windowMs: 60 * 1000,      // 1 minute
    maxRequests: 60,          // 60 requests per minute
  },
  
  // LLM requests - strict (expensive operations)
  llmRequests: {
    windowMs: 60 * 1000,      // 1 minute
    maxRequests: 30,          // 30 requests per minute
  },
  
  // Tool execution - moderate
  toolExecution: {
    windowMs: 60 * 1000,      // 1 minute
    maxRequests: 50,          // 50 requests per minute
  },
  
  // Authentication - very strict
  authentication: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,           // 5 attempts per 15 minutes
  },
};
```

#### Integration with gRPC Server

Update `src/grpc/server.ts`:

```typescript
import { createGrpcRateLimiter } from '@/middleware/grpc-rate-limit.middleware';
import { RATE_LIMIT_CONFIGS } from '@/config/rate-limits.config';

// Create rate limiters
const audioStreamLimiter = createGrpcRateLimiter(redisService, RATE_LIMIT_CONFIGS.audioStream);
const sessionLimiter = createGrpcRateLimiter(redisService, RATE_LIMIT_CONFIGS.sessionManagement);
const llmLimiter = createGrpcRateLimiter(redisService, RATE_LIMIT_CONFIGS.llmRequests);

// Apply to gRPC methods
server.addService(SessionServiceDefinition, {
  async createSession(call, callback) {
    try {
      await sessionLimiter.checkUnaryRateLimit(call);
      // ... existing implementation
    } catch (error) {
      callback(error);
    }
  },
  
  async streamAudio(call) {
    try {
      await audioStreamLimiter.checkStreamRateLimit(call);
      // ... existing implementation
    } catch (error) {
      call.destroy(error);
    }
  },
});
```

#### Testing Rate Limiting

Create `tests/middleware/grpc-rate-limit.test.ts`:

```typescript
import { createGrpcRateLimiter } from '@/middleware/grpc-rate-limit.middleware';
import { RedisService } from '@/core/cache/redis.service';

describe('GrpcRateLimiter', () => {
  let redis: RedisService;
  let rateLimiter: GrpcRateLimiter;

  beforeEach(() => {
    redis = new RedisService();
    rateLimiter = createGrpcRateLimiter(redis, {
      windowMs: 1000,
      maxRequests: 5,
    });
  });

  it('should allow requests under limit', async () => {
    const mockCall = createMockCall('user-123');
    
    for (let i = 0; i < 5; i++) {
      await expect(rateLimiter.checkUnaryRateLimit(mockCall)).resolves.not.toThrow();
    }
  });

  it('should block requests over limit', async () => {
    const mockCall = createMockCall('user-123');
    
    // Make 5 requests (at limit)
    for (let i = 0; i < 5; i++) {
      await rateLimiter.checkUnaryRateLimit(mockCall);
    }
    
    // 6th request should fail
    await expect(rateLimiter.checkUnaryRateLimit(mockCall)).rejects.toMatchObject({
      code: status.RESOURCE_EXHAUSTED,
    });
  });

  it('should reset after window expires', async () => {
    const mockCall = createMockCall('user-123');
    
    // Fill up limit
    for (let i = 0; i < 5; i++) {
      await rateLimiter.checkUnaryRateLimit(mockCall);
    }
    
    // Wait for window to expire
    await new Promise(resolve => setTimeout(resolve, 1100));
    
    // Should work again
    await expect(rateLimiter.checkUnaryRateLimit(mockCall)).resolves.not.toThrow();
  });
});
```

---

### 2. Input Validation & Sanitization

#### Problem Statement

Partial input validation exists, but not comprehensive. Need:
- Schema-based validation for all inputs
- Sanitization to prevent injection attacks
- Type safety enforcement
- Custom validation rules

#### Implementation Approach

**Use Zod for Schema Validation**

Install dependencies:
```bash
npm install zod
npm install --save-dev @types/zod
```

Create `src/core/validation/schemas.ts`:

```typescript
import { z } from 'zod';

/**
 * Common validation schemas
 */

// User ID validation
export const userIdSchema = z.string().uuid();

// Session ID validation
export const sessionIdSchema = z.string().uuid();

// Message validation
export const messageSchema = z.object({
  content: z.string()
    .min(1, 'Message cannot be empty')
    .max(10000, 'Message too long (max 10000 characters)')
    .transform(sanitizeHtml), // Remove HTML tags
  role: z.enum(['user', 'assistant', 'system']),
  metadata: z.record(z.any()).optional(),
});

// Session creation validation
export const createSessionSchema = z.object({
  userId: userIdSchema,
  conversationId: z.string().uuid().optional(),
  systemPrompt: z.string()
    .max(5000, 'System prompt too long')
    .optional()
    .transform(sanitizeHtml),
  model: z.string()
    .regex(/^[a-zA-Z0-9\-_.]+$/, 'Invalid model name')
    .optional(),
  metadata: z.record(z.any()).optional(),
});

// LLM request validation
export const llmRequestSchema = z.object({
  messages: z.array(messageSchema)
    .min(1, 'At least one message required')
    .max(100, 'Too many messages'),
  model: z.string()
    .regex(/^[a-zA-Z0-9\-_.]+$/, 'Invalid model name'),
  temperature: z.number()
    .min(0)
    .max(2)
    .optional(),
  maxTokens: z.number()
    .int()
    .positive()
    .max(8192)
    .optional(),
  stream: z.boolean().optional(),
});

// Tool execution validation
export const toolExecutionSchema = z.object({
  toolName: z.string()
    .regex(/^[a-zA-Z0-9_-]+$/, 'Invalid tool name'),
  parameters: z.record(z.any()),
  sessionId: sessionIdSchema,
});

// Audio chunk validation
export const audioChunkSchema = z.object({
  sessionId: sessionIdSchema,
  audioData: z.instanceof(Buffer)
    .refine(buf => buf.length > 0, 'Audio data cannot be empty')
    .refine(buf => buf.length <= 1024 * 1024, 'Audio chunk too large (max 1MB)'),
  sampleRate: z.number()
    .int()
    .refine(rate => [8000, 16000, 44100, 48000].includes(rate), 'Invalid sample rate'),
  isFinal: z.boolean().optional(),
});

/**
 * Sanitization functions
 */

function sanitizeHtml(input: string): string {
  // Remove HTML tags and potentially dangerous characters
  return input
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[<>]/g, '')    // Remove remaining < >
    .trim();
}

export function sanitizeFilename(filename: string): string {
  // Remove path traversal attempts and dangerous characters
  return filename
    .replace(/\.\./g, '')
    .replace(/[\/\\]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .substring(0, 255);
}

export function sanitizeSqlInput(input: string): string {
  // Escape SQL special characters (use parameterized queries instead when possible)
  return input
    .replace(/'/g, "''")
    .replace(/;/g, '')
    .replace(/--/g, '');
}

export function sanitizeCommandInput(input: string): string {
  // Remove shell command injection attempts
  return input
    .replace(/[;&|`$()]/g, '')
    .trim();
}
```

Create validation middleware `src/middleware/validation.middleware.ts`:

```typescript
import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { Logger } from '@/core/logger/logger';

const logger = new Logger('ValidationMiddleware');

/**
 * Express middleware for request validation
 */
export function validateRequest(schema: AnyZodObject) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request body, query, and params
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        logger.warn('Validation failed', {
          path: req.path,
          errors: error.errors,
          body: req.body,
        });
        
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }
      
      next(error);
    }
  };
}

/**
 * gRPC validation helper
 */
export async function validateGrpcRequest<T>(
  schema: AnyZodObject,
  request: any
): Promise<T> {
  try {
    return await schema.parseAsync(request);
  } catch (error) {
    if (error instanceof ZodError) {
      logger.warn('gRPC validation failed', {
        errors: error.errors,
        request,
      });
      
      throw {
        code: status.INVALID_ARGUMENT,
        message: 'Invalid request',
        details: error.errors,
      };
    }
    throw error;
  }
}
```

#### Apply Validation to Endpoints

Update `src/routes/session.routes.ts`:

```typescript
import { validateRequest } from '@/middleware/validation.middleware';
import { createSessionSchema } from '@/core/validation/schemas';
import { z } from 'zod';

router.post(
  '/sessions',
  validateRequest(z.object({
    body: createSessionSchema,
  })),
  sessionController.createSession
);
```

Update gRPC handlers:

```typescript
import { validateGrpcRequest } from '@/middleware/validation.middleware';
import { audioChunkSchema } from '@/core/validation/schemas';

async streamAudio(call: ServerWritableStream<AudioChunk, TranscriptResponse>) {
  for await (const chunk of call) {
    // Validate each chunk
    const validatedChunk = await validateGrpcRequest(audioChunkSchema, chunk);
    // ... process chunk
  }
}
```

---

### 3. Secrets Management

#### Problem Statement

Secrets (API keys, database passwords, JWT secrets) are currently stored in `.env` files, which:
- Can be accidentally committed to version control
- Are visible to anyone with file system access
- Cannot be rotated easily
- Don't support audit logging

#### Implementation Approach

**Option A: HashiCorp Vault (Recommended for Production)**

**Setup Vault:**

```yaml
# Add to docker-compose.yml
vault:
  image: vault:latest
  ports:
    - "8200:8200"
  environment:
    VAULT_DEV_ROOT_TOKEN_ID: "dev-root-token"
    VAULT_DEV_LISTEN_ADDRESS: "0.0.0.0:8200"
  cap_add:
    - IPC_LOCK
  volumes:
    - vault-data:/vault/data
```

**Install Vault Client:**

```bash
npm install node-vault
npm install --save-dev @types/node-vault
```

**Create Vault Service:**

Create `src/core/secrets/vault.service.ts`:

```typescript
import vault from 'node-vault';
import { Logger } from '@/core/logger/logger';

export class VaultService {
  private readonly logger = new Logger('VaultService');
  private client: any;
  private readonly secretPath = 'secret/data/gnani';

  constructor() {
    this.client = vault({
      endpoint: process.env.VAULT_ADDR || 'http://localhost:8200',
      token: process.env.VAULT_TOKEN,
    });
  }

  /**
   * Initialize Vault and load secrets
   */
  async initialize(): Promise<void> {
    try {
      // Test connection
      await this.client.health();
      this.logger.info('Connected to Vault successfully');
      
      // Load secrets into memory (cached)
      await this.loadSecrets();
    } catch (error) {
      this.logger.error('Failed to connect to Vault', error);
      throw new Error('Vault initialization failed');
    }
  }

  /**
   * Get a secret value
   */
  async getSecret(key: string): Promise<string> {
    try {
      const result = await this.client.read(`${this.secretPath}/${key}`);
      return result.data.data.value;
    } catch (error) {
      this.logger.error(`Failed to read secret: ${key}`, error);
      throw error;
    }
  }

  /**
   * Set a secret value
   */
  async setSecret(key: string, value: string): Promise<void> {
    try {
      await this.client.write(`${this.secretPath}/${key}`, {
        data: { value },
      });
      this.logger.info(`Secret updated: ${key}`);
    } catch (error) {
      this.logger.error(`Failed to write secret: ${key}`, error);
      throw error;
    }
  }

  /**
   * Load all secrets into environment variables (for backward compatibility)
   */
  private async loadSecrets(): Promise<void> {
    const secretKeys = [
      'JWT_SECRET',
      'MONGODB_URI',
      'REDIS_URL',
      'OLLAMA_BASE_URL',
      'CHROMADB_URL',
      'SLACK_WEBHOOK_URL',
      'SMTP_PASSWORD',
    ];

    for (const key of secretKeys) {
      try {
        const value = await this.getSecret(key);
        process.env[key] = value;
      } catch (error) {
        this.logger.warn(`Secret not found in Vault: ${key}, using .env fallback`);
      }
    }
  }

  /**
   * Rotate a secret (generate new value and update)
   */
  async rotateSecret(key: string, generator: () => string): Promise<void> {
    const newValue = generator();
    await this.setSecret(key, newValue);
    process.env[key] = newValue;
    this.logger.info(`Secret rotated: ${key}`);
  }
}

// Singleton instance
export const vaultService = new VaultService();
```

**Update Application Startup:**

Update `src/index.ts`:

```typescript
import { vaultService } from '@/core/secrets/vault.service';

async function bootstrap() {
  // Initialize Vault first
  await vaultService.initialize();
  
  // Then start application
  await startServer();
}

bootstrap();
```

**Migration Script:**

Create `scripts/migrate-secrets-to-vault.ts`:

```typescript
import { vaultService } from '@/core/secrets/vault.service';
import dotenv from 'dotenv';

dotenv.config();

async function migrateSecrets() {
  await vaultService.initialize();

  const secrets = {
    JWT_SECRET: process.env.JWT_SECRET,
    MONGODB_URI: process.env.MONGODB_URI,
    REDIS_URL: process.env.REDIS_URL,
    OLLAMA_BASE_URL: process.env.OLLAMA_BASE_URL,
    CHROMADB_URL: process.env.CHROMADB_URL,
    SLACK_WEBHOOK_URL: process.env.SLACK_WEBHOOK_URL,
    SMTP_PASSWORD: process.env.SMTP_PASSWORD,
  };

  for (const [key, value] of Object.entries(secrets)) {
    if (value) {
      await vaultService.setSecret(key, value);
      console.log(`✓ Migrated ${key}`);
    }
  }

  console.log('Migration complete!');
}

migrateSecrets();
```

**Option B: AWS Secrets Manager / Azure Key Vault**

Similar approach, use respective SDKs:
- AWS: `@aws-sdk/client-secrets-manager`
- Azure: `@azure/keyvault-secrets`

---

### 4. PII Detection & Masking

#### Problem Statement

User conversations may contain Personally Identifiable Information (PII) such as:
- Email addresses
- Phone numbers
- Credit card numbers
- Social security numbers
- Physical addresses

This PII should be:
- Detected in real-time
- Masked in logs
- Optionally masked in storage
- Flagged for compliance review

#### Implementation Approach

Create `src/core/security/pii-detector.service.ts`:

```typescript
import { Logger } from '@/core/logger/logger';

export interface PIIMatch {
  type: 'email' | 'phone' | 'ssn' | 'credit_card' | 'address' | 'custom';
  value: string;
  start: number;
  end: number;
  confidence: number;
}

export class PIIDetectorService {
  private readonly logger = new Logger('PIIDetector');

  // Regex patterns for common PII
  private readonly patterns = {
    email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    phone: /\b(\+\d{1,3}[-.]?)?\(?\d{3}\)?[-.]?\d{3}[-.]?\d{4}\b/g,
    ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
    creditCard: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
    // Add more patterns as needed
  };

  /**
   * Detect PII in text
   */
  detectPII(text: string): PIIMatch[] {
    const matches: PIIMatch[] = [];

    for (const [type, pattern] of Object.entries(this.patterns)) {
      const regex = new RegExp(pattern);
      let match;

      while ((match = regex.exec(text)) !== null) {
        matches.push({
          type: type as any,
          value: match[0],
          start: match.index,
          end: match.index + match[0].length,
          confidence: this.calculateConfidence(type, match[0]),
        });
      }
    }

    return matches;
  }

  /**
   * Mask PII in text
   */
  maskPII(text: string, maskChar: string = '*'): string {
    const matches = this.detectPII(text);
    
    // Sort matches by start position (descending) to avoid index shifting
    matches.sort((a, b) => b.start - a.start);

    let maskedText = text;
    for (const match of matches) {
      const masked = this.getMaskedValue(match.type, match.value, maskChar);
      maskedText = 
        maskedText.substring(0, match.start) +
        masked +
        maskedText.substring(match.end);
    }

    return maskedText;
  }

  /**
   * Get masked value based on PII type
   */
  private getMaskedValue(type: string, value: string, maskChar: string): string {
    switch (type) {
      case 'email':
        // Show first char and domain: j***@example.com
        const [local, domain] = value.split('@');
        return `${local[0]}${maskChar.repeat(3)}@${domain}`;
      
      case 'phone':
        // Show last 4 digits: ***-***-1234
        return `${maskChar.repeat(3)}-${maskChar.repeat(3)}-${value.slice(-4)}`;
      
      case 'ssn':
        // Show last 4 digits: ***-**-1234
        return `${maskChar.repeat(3)}-${maskChar.repeat(2)}-${value.slice(-4)}`;
      
      case 'creditCard':
        // Show last 4 digits: **** **** **** 1234
        const cleaned = value.replace(/[-\s]/g, '');
        return `${maskChar.repeat(4)} ${maskChar.repeat(4)} ${maskChar.repeat(4)} ${cleaned.slice(-4)}`;
      
      default:
        return maskChar.repeat(value.length);
    }
  }

  /**
   * Calculate confidence score for PII match
   */
  private calculateConfidence(type: string, value: string): number {
    // Simple confidence calculation, can be enhanced with ML
    switch (type) {
      case 'email':
        return value.includes('.') && value.includes('@') ? 0.95 : 0.7;
      case 'phone':
        return value.length >= 10 ? 0.9 : 0.6;
      case 'ssn':
        return 0.95; // High confidence if pattern matches
      case 'creditCard':
        return this.luhnCheck(value.replace(/[-\s]/g, '')) ? 0.95 : 0.5;
      default:
        return 0.5;
    }
  }

  /**
   * Luhn algorithm for credit card validation
   */
  private luhnCheck(cardNumber: string): boolean {
    let sum = 0;
    let isEven = false;

    for (let i = cardNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cardNumber[i]);

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  }

  /**
   * Check if text contains PII
   */
  containsPII(text: string, threshold: number = 0.8): boolean {
    const matches = this.detectPII(text);
    return matches.some(match => match.confidence >= threshold);
  }
}

export const piiDetector = new PIIDetectorService();
```

**Integrate with Logger:**

Update `src/core/logger/logger.ts`:

```typescript
import { piiDetector } from '@/core/security/pii-detector.service';

export class Logger {
  // ... existing code

  private sanitizeLogData(data: any): any {
    if (typeof data === 'string') {
      return piiDetector.maskPII(data);
    }
    
    if (typeof data === 'object' && data !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(data)) {
        sanitized[key] = this.sanitizeLogData(value);
      }
      return sanitized;
    }
    
    return data;
  }

  info(message: string, metadata?: any) {
    const sanitizedMessage = piiDetector.maskPII(message);
    const sanitizedMetadata = metadata ? this.sanitizeLogData(metadata) : undefined;
    
    this.winston.info(sanitizedMessage, sanitizedMetadata);
  }

  // Apply to all log methods...
}
```

---

### 5. Content Filtering

#### Problem Statement

Need to prevent:
- Harmful content generation (violence, hate speech, etc.)
- Prompt injection attacks
- Jailbreak attempts
- Inappropriate requests

#### Implementation Approach

Create `src/core/security/content-filter.service.ts`:

```typescript
import { Logger } from '@/core/logger/logger';

export interface ContentFilterResult {
  allowed: boolean;
  reason?: string;
  category?: 'harmful' | 'injection' | 'jailbreak' | 'inappropriate';
  confidence: number;
}

export class ContentFilterService {
  private readonly logger = new Logger('ContentFilter');

  // Harmful content keywords (expand as needed)
  private readonly harmfulPatterns = [
    /\b(kill|murder|suicide|bomb|weapon)\b/i,
    /\b(hate|racist|sexist)\b/i,
    // Add more patterns
  ];

  // Prompt injection patterns
  private readonly injectionPatterns = [
    /ignore (previous|all) (instructions|prompts)/i,
    /you are now/i,
    /new instructions:/i,
    /system: /i,
    // Add more patterns
  ];

  // Jailbreak attempt patterns
  private readonly jailbreakPatterns = [
    /DAN mode/i,
    /developer mode/i,
    /pretend (you are|to be)/i,
    // Add more patterns
  ];

  /**
   * Filter user input
   */
  async filterInput(text: string): Promise<ContentFilterResult> {
    // Check for harmful content
    for (const pattern of this.harmfulPatterns) {
      if (pattern.test(text)) {
        this.logger.warn('Harmful content detected', { text: text.substring(0, 100) });
        return {
          allowed: false,
          reason: 'Harmful content detected',
          category: 'harmful',
          confidence: 0.9,
        };
      }
    }

    // Check for prompt injection
    for (const pattern of this.injectionPatterns) {
      if (pattern.test(text)) {
        this.logger.warn('Prompt injection detected', { text: text.substring(0, 100) });
        return {
          allowed: false,
          reason: 'Prompt injection attempt detected',
          category: 'injection',
          confidence: 0.85,
        };
      }
    }

    // Check for jailbreak attempts
    for (const pattern of this.jailbreakPatterns) {
      if (pattern.test(text)) {
        this.logger.warn('Jailbreak attempt detected', { text: text.substring(0, 100) });
        return {
          allowed: false,
          reason: 'Jailbreak attempt detected',
          category: 'jailbreak',
          confidence: 0.8,
        };
      }
    }

    return {
      allowed: true,
      confidence: 1.0,
    };
  }

  /**
   * Filter LLM output
   */
  async filterOutput(text: string): Promise<ContentFilterResult> {
    // Similar to input filtering, but may have different rules
    return this.filterInput(text);
  }
}

export const contentFilter = new ContentFilterService();
```

**Integrate with Session Coordinator:**

Update `src/modules/session/session.coordinator.ts`:

```typescript
import { contentFilter } from '@/core/security/content-filter.service';

async processUserMessage(message: string): Promise<void> {
  // Filter input
  const filterResult = await contentFilter.filterInput(message);
  
  if (!filterResult.allowed) {
    throw new Error(`Content blocked: ${filterResult.reason}`);
  }
  
  // Continue processing...
}
```

---

## Implementation Checklist

### Day 1-2: gRPC Rate Limiting
- [ ] Create `grpc-rate-limit.middleware.ts`
- [ ] Define rate limit configurations
- [ ] Integrate with gRPC server
- [ ] Write unit tests
- [ ] Test with load generator

### Day 3: Input Validation
- [ ] Install Zod
- [ ] Create validation schemas
- [ ] Create validation middleware
- [ ] Apply to all HTTP endpoints
- [ ] Apply to all gRPC endpoints
- [ ] Write validation tests

### Day 4-5: Secrets Management
- [ ] Set up Vault (Docker Compose)
- [ ] Create `vault.service.ts`
- [ ] Migrate secrets from .env to Vault
- [ ] Update application startup
- [ ] Test secret rotation
- [ ] Document secret management process

### Day 6: PII Detection & Content Filtering
- [ ] Create `pii-detector.service.ts`
- [ ] Integrate with logger
- [ ] Create `content-filter.service.ts`
- [ ] Integrate with session coordinator
- [ ] Write tests for PII detection
- [ ] Write tests for content filtering

### Day 7: Documentation & Testing
- [ ] Write security documentation
- [ ] Create security runbook
- [ ] Perform penetration testing
- [ ] Review and fix findings
- [ ] Final security audit

---

## Testing & Validation

### Rate Limiting Tests
```bash
# Test gRPC rate limiting with grpcurl
for i in {1..100}; do
  grpcurl -d '{"userId": "test"}' localhost:50051 gnani.SessionService/CreateSession
done
```

### Input Validation Tests
```bash
# Test malicious inputs
curl -X POST http://localhost:3001/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"userId": "<script>alert(1)</script>"}'

# Should return 400 Bad Request
```

### PII Detection Tests
```typescript
const text = "My email is john@example.com and phone is 555-123-4567";
const masked = piiDetector.maskPII(text);
// Should output: "My email is j***@example.com and phone is ***-***-4567"
```

---

## Success Metrics

- [ ] All gRPC endpoints have rate limiting
- [ ] 100% of inputs are validated
- [ ] Zero secrets in .env files
- [ ] PII detection accuracy > 95%
- [ ] Content filtering blocks 100% of test attacks
- [ ] Security audit passed
- [ ] Penetration testing passed

---

**Estimated Effort:** 7 days  
**Complexity:** Moderate-High  
**Risk:** Medium (security changes require careful testing)
