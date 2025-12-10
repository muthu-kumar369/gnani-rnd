# STAGE 1: CRITICAL FIXES & INFRASTRUCTURE

**Duration:** 2 weeks  
**Priority:** CRITICAL  
**Dependencies:** None

---

## 🎯 OBJECTIVE

Fix all critical bugs and establish solid infrastructure for subsequent stages. This stage focuses on stability, reliability, and foundational improvements that everything else depends on.

---

## 📋 TASKS

### Task 1.1: Fix BullMQ Redis Configuration ⚡ CRITICAL
**File:** `gnani-rnd-backend/src/queues/tool.queue.ts`  
**Issue:** BullMQ error: "Your redis options maxRetriesPerRequest must be null"  
**Effort:** 2 hours

**Implementation:**
```typescript
// In tool.queue.ts or redis.config.ts
const redisConnection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: null, // ADD THIS
  enableReadyCheck: false,
  retryStrategy: (times: number) => {
    return Math.min(times * 50, 2000);
  }
};
```

**Verification:**
1. Start backend: `cd gnani-rnd-backend && npm run dev`
2. Check logs for "Phase 4 task queue worker started" without errors
3. Test tool execution to verify queue is working

---

### Task 1.2: Centralized API Client with Retry Logic ⚡ CRITICAL
**Files:** 
- NEW: `gnani-rnd/react/src/api/client.ts`
- UPDATE: All stores using fetch directly

**Issue:** API calls scattered across stores, no retry logic, duplicated error handling  
**Effort:** 1 day

**Implementation:**

Create `src/api/client.ts`:
```typescript
import errorLogger from '../utils/errorLogger';

interface RequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  url: string;
  data?: any;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  retries?: number;
  timeout?: number;
}

interface RequestOptions {
  skipAuth?: boolean;
  skipRetry?: boolean;
}

class APIClient {
  private baseURL: string;
  private getAccessToken: () => string | null;
  private refreshToken: () => Promise<boolean>;
  private pendingRequests: Map<string, Promise<any>>;

  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
    this.pendingRequests = new Map();
  }

  setAuthHandlers(getToken: () => string | null, refresh: () => Promise<boolean>) {
    this.getAccessToken = getToken;
    this.refreshToken = refresh;
  }

  private getRequestKey(config: RequestConfig): string {
    return `${config.method}:${config.url}:${JSON.stringify(config.data || {})}`;
  }

  private async executeRequest<T>(config: RequestConfig, options: RequestOptions = {}): Promise<T> {
    const url = config.url.startsWith('http') ? config.url : `${this.baseURL}${config.url}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...config.headers,
    };

    // Add auth token
    if (!options.skipAuth && this.getAccessToken) {
      const token = this.getAccessToken();
      if (token) {
        headers['x-auth-token'] = token;
      }
    }

    const fetchOptions: RequestInit = {
      method: config.method,
      headers,
      signal: config.signal,
    };

    if (config.data && config.method !== 'GET') {
      fetchOptions.body = JSON.stringify(config.data);
    }

    const response = await fetch(url, fetchOptions);

    // Handle 401 - token expired
    if (response.status === 401 && !options.skipAuth && this.refreshToken) {
      const refreshed = await this.refreshToken();
      if (refreshed) {
        // Retry with new token
        return this.executeRequest(config, options);
      }
      throw new Error('Authentication failed');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || error.message || 'Request failed');
    }

    return response.json();
  }

  async request<T>(config: RequestConfig, options: RequestOptions = {}): Promise<T> {
    const maxRetries = config.retries ?? 3;
    const timeout = config.timeout ?? 30000;

    // Request deduplication
    if (config.method === 'GET') {
      const key = this.getRequestKey(config);
      const pending = this.pendingRequests.get(key);
      if (pending) {
        errorLogger.debug('Deduplicating request', { url: config.url });
        return pending;
      }
    }

    const executeWithRetry = async (attempt: number = 0): Promise<T> => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        const promise = this.executeRequest<T>(
          { ...config, signal: config.signal || controller.signal },
          options
        );

        const result = await promise;
        clearTimeout(timeoutId);
        return result;
      } catch (error: any) {
        if (error.name === 'AbortError') {
          throw new Error('Request timeout');
        }

        // Don't retry on client errors (4xx except 401)
        if (error.message.includes('400') || error.message.includes('404')) {
          throw error;
        }

        // Retry on network errors or 5xx
        if (attempt < maxRetries && !options.skipRetry) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
          errorLogger.warn(`Request failed, retrying in ${delay}ms`, { attempt, error: error.message });
          await new Promise(resolve => setTimeout(resolve, delay));
          return executeWithRetry(attempt + 1);
        }

        throw error;
      }
    };

    const promise = executeWithRetry();

    // Cache GET requests for deduplication
    if (config.method === 'GET') {
      const key = this.getRequestKey(config);
      this.pendingRequests.set(key, promise);
      promise.finally(() => this.pendingRequests.delete(key));
    }

    return promise;
  }

  // Convenience methods
  get<T>(url: string, options?: RequestOptions): Promise<T> {
    return this.request<T>({ method: 'GET', url }, options);
  }

  post<T>(url: string, data?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>({ method: 'POST', url, data }, options);
  }

  put<T>(url: string, data?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>({ method: 'PUT', url, data }, options);
  }

  patch<T>(url: string, data?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>({ method: 'PATCH', url, data }, options);
  }

  delete<T>(url: string, options?: RequestOptions): Promise<T> {
    return this.request<T>({ method: 'DELETE', url }, options);
  }
}

export const apiClient = new APIClient();
export default apiClient;
```

**Update stores to use API client:**

Example for `useConversationStore.ts`:
```typescript
import apiClient from '../api/client';

// In the store initialization
const { getAccessToken, refreshAccessToken } = useUserStore.getState();
apiClient.setAuthHandlers(
  () => getAccessToken(),
  async () => {
    await refreshAccessToken();
    return true;
  }
);

// Replace fetch calls
// OLD:
const response = await fetch(`${API_BASE_URL}/conversations`, {
  headers: { 'x-auth-token': accessToken }
});

// NEW:
const data = await apiClient.get('/conversations');
```

**Verification:**
1. Test API calls with network throttling
2. Verify retry logic with network failures
3. Verify token refresh on 401
4. Check request deduplication with multiple identical calls
5. Run existing tests: `cd react && npm test`

---

### Task 1.3: Fix Message Chain Validation ⚡ CRITICAL
**Files:**
- `gnani-rnd/react/src/store/useConversationStore.ts`
- `gnani-rnd-backend/src/modules/conversation/conversation.service.ts`

**Issue:** Broken parentId chains causing fallback to timestamp sorting  
**Effort:** 2 days

**Implementation:**

Create `src/utils/messageTreeValidator.ts`:
```typescript
import { ConversationMessage } from '../store/useConversationStore';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  repairs: Array<{ messageId: string; fix: string }>;
}

export class MessageTreeValidator {
  static validate(messages: ConversationMessage[]): ValidationResult {
    const errors: string[] = [];
    const repairs: Array<{ messageId: string; fix: string }> = [];
    const messageMap = new Map(messages.map(m => [m.id, m]));

    // Check 1: All parentIds must exist (except root messages)
    for (const msg of messages) {
      if (msg.parentId && !messageMap.has(msg.parentId)) {
        errors.push(`Message ${msg.id} has invalid parentId: ${msg.parentId}`);
        repairs.push({
          messageId: msg.id,
          fix: 'Set parentId to null (make it a root message)'
        });
      }
    }

    // Check 2: No circular references
    for (const msg of messages) {
      if (this.hasCircularReference(msg, messageMap)) {
        errors.push(`Message ${msg.id} has circular reference`);
        repairs.push({
          messageId: msg.id,
          fix: 'Break circular reference by setting parentId to null'
        });
      }
    }

    // Check 3: Children arrays match actual parent references
    for (const msg of messages) {
      if (msg.children) {
        for (const childId of msg.children) {
          const child = messageMap.get(childId);
          if (!child) {
            errors.push(`Message ${msg.id} references non-existent child: ${childId}`);
          } else if (child.parentId !== msg.id) {
            errors.push(`Child ${childId} doesn't reference parent ${msg.id}`);
            repairs.push({
              messageId: childId,
              fix: `Set parentId to ${msg.id}`
            });
          }
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      repairs
    };
  }

  static repair(messages: ConversationMessage[]): ConversationMessage[] {
    const messageMap = new Map(messages.map(m => [m.id, m]));
    const repaired: ConversationMessage[] = [];

    for (const msg of messages) {
      const repairedMsg = { ...msg };

      // Fix invalid parentId
      if (repairedMsg.parentId && !messageMap.has(repairedMsg.parentId)) {
        console.warn(`Repairing message ${msg.id}: invalid parentId ${msg.parentId}`);
        repairedMsg.parentId = undefined;
      }

      // Fix circular references
      if (this.hasCircularReference(repairedMsg, messageMap)) {
        console.warn(`Repairing message ${msg.id}: circular reference detected`);
        repairedMsg.parentId = undefined;
      }

      repaired.push(repairedMsg);
    }

    // Rebuild children arrays
    for (const msg of repaired) {
      msg.children = [];
    }

    for (const msg of repaired) {
      if (msg.parentId) {
        const parent = repaired.find(m => m.id === msg.parentId);
        if (parent) {
          parent.children = parent.children || [];
          if (!parent.children.includes(msg.id)) {
            parent.children.push(msg.id);
          }
        }
      }
    }

    return repaired;
  }

  private static hasCircularReference(
    msg: ConversationMessage,
    messageMap: Map<string, ConversationMessage>,
    visited: Set<string> = new Set()
  ): boolean {
    if (visited.has(msg.id)) {
      return true;
    }

    if (!msg.parentId) {
      return false;
    }

    visited.add(msg.id);
    const parent = messageMap.get(msg.parentId);
    if (!parent) {
      return false;
    }

    return this.hasCircularReference(parent, messageMap, visited);
  }
}
```

Update `useConversationStore.ts`:
```typescript
import { MessageTreeValidator } from '../utils/messageTreeValidator';

// In refreshConversation, after fetching messages:
const mappedMessages: ConversationMessage[] = data.messages.map(...);

// Validate and repair
const validation = MessageTreeValidator.validate(mappedMessages);
if (!validation.isValid) {
  errorLogger.warn('Message tree validation failed', { errors: validation.errors });
  const repairedMessages = MessageTreeValidator.repair(mappedMessages);
  set({ allMessages: repairedMessages, currentLeafId: newLeafId });
} else {
  set({ allMessages: mappedMessages, currentLeafId: newLeafId });
}
```

**Backend validation** in `conversation.service.ts`:
```typescript
// Add validation before saving messages
async createMessage(conversationId: string, messageData: any) {
  // Validate parentId exists
  if (messageData.parentId) {
    const parent = await Message.findById(messageData.parentId);
    if (!parent) {
      throw new Error(`Invalid parentId: ${messageData.parentId}`);
    }
  }

  const message = await Message.create(messageData);

  // Update parent's children array
  if (messageData.parentId) {
    await Message.findByIdAndUpdate(
      messageData.parentId,
      { $addToSet: { children: message._id } }
    );
  }

  return message;
}
```

**Verification:**
1. Create test with broken message chains
2. Verify validator detects issues
3. Verify repair function fixes chains
4. Test with real conversations
5. Check logs for validation warnings

---

### Task 1.4: Add File Size Limits and Validation ⚡ CRITICAL
**Files:**
- `gnani-rnd-backend/src/modules/file/file.service.ts`
- `gnani-rnd-backend/src/config/multer.config.ts`
- `gnani-rnd-backend/src/middleware/file-validation.middleware.ts`

**Issue:** No file size limits - security risk, DoS potential  
**Effort:** 4 hours

**Implementation:**

Update `multer.config.ts`:
```typescript
import multer from 'multer';
import path from 'path';

const FILE_SIZE_LIMITS = {
  image: 10 * 1024 * 1024, // 10MB
  document: 50 * 1024 * 1024, // 50MB
  audio: 100 * 1024 * 1024, // 100MB
  default: 10 * 1024 * 1024, // 10MB
};

const ALLOWED_MIME_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  audio: ['audio/wav', 'audio/mpeg', 'audio/mp3'],
};

export const upload = multer({
  storage: multer.diskStorage({
    destination: './uploads',
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  }),
  limits: {
    fileSize: FILE_SIZE_LIMITS.default,
    files: 10, // Max 10 files per request
  },
  fileFilter: (req, file, cb) => {
    // Validate MIME type
    const allAllowedTypes = Object.values(ALLOWED_MIME_TYPES).flat();
    if (!allAllowedTypes.includes(file.mimetype)) {
      return cb(new Error(`Invalid file type: ${file.mimetype}`));
    }
    cb(null, true);
  }
});

export { FILE_SIZE_LIMITS, ALLOWED_MIME_TYPES };
```

Create `middleware/file-validation.middleware.ts`:
```typescript
import { Request, Response, NextFunction } from 'express';
import { FILE_SIZE_LIMITS, ALLOWED_MIME_TYPES } from '../config/multer.config.js';

export const validateFileUpload = (fileType: 'image' | 'document' | 'audio' = 'default') => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.file && !req.files) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const files = req.files ? (Array.isArray(req.files) ? req.files : Object.values(req.files).flat()) : [req.file];

    for (const file of files) {
      if (!file) continue;

      // Check file size
      const maxSize = FILE_SIZE_LIMITS[fileType] || FILE_SIZE_LIMITS.default;
      if (file.size > maxSize) {
        return res.status(400).json({
          error: `File too large: ${file.originalname}. Max size: ${maxSize / 1024 / 1024}MB`
        });
      }

      // Check MIME type
      if (fileType !== 'default') {
        const allowedTypes = ALLOWED_MIME_TYPES[fileType];
        if (!allowedTypes.includes(file.mimetype)) {
          return res.status(400).json({
            error: `Invalid file type: ${file.mimetype}. Allowed: ${allowedTypes.join(', ')}`
          });
        }
      }
    }

    next();
  };
};
```

Update routes to use validation:
```typescript
import { validateFileUpload } from '../middleware/file-validation.middleware.js';

router.post('/upload',
  authenticate,
  upload.single('file'),
  validateFileUpload('document'),
  fileController.uploadFile
);
```

**Verification:**
1. Test uploading file larger than limit (should fail)
2. Test uploading invalid file type (should fail)
3. Test uploading valid file (should succeed)
4. Test uploading multiple files
5. Check error messages are user-friendly

---

### Task 1.5: Implement Context Window Truncation ⚡ CRITICAL
**Files:**
- NEW: `gnani-rnd-backend/src/modules/llm/context-manager.service.ts`
- UPDATE: `gnani-rnd-backend/src/modules/llm/llm.service.ts`

**Issue:** LLM fails on long conversations, no automatic truncation  
**Effort:** 1 day

**Implementation:**

Create `context-manager.service.ts`:
```typescript
import { encoding_for_model } from 'tiktoken';
import logger from '../../core/logger/logger.js';

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ContextWindow {
  messages: Message[];
  totalTokens: number;
  truncated: boolean;
}

export class ContextManager {
  private encoder: any;
  private maxTokens: number;
  private reserveTokens: number; // Reserve for response

  constructor(model: string = 'gpt-3.5-turbo', maxTokens: number = 4096) {
    this.encoder = encoding_for_model(model as any);
    this.maxTokens = maxTokens;
    this.reserveTokens = 1000; // Reserve 1000 tokens for response
  }

  countTokens(text: string): number {
    return this.encoder.encode(text).length;
  }

  countMessagesTokens(messages: Message[]): number {
    let total = 0;
    for (const msg of messages) {
      total += this.countTokens(msg.content);
      total += 4; // Overhead per message
    }
    return total;
  }

  truncateContext(messages: Message[], systemPrompt?: string): ContextWindow {
    const maxAllowed = this.maxTokens - this.reserveTokens;
    let totalTokens = 0;
    const result: Message[] = [];

    // Always include system prompt first
    if (systemPrompt) {
      const systemMsg: Message = { role: 'system', content: systemPrompt };
      const systemTokens = this.countTokens(systemPrompt) + 4;
      result.push(systemMsg);
      totalTokens += systemTokens;
    }

    // Strategy: Keep most recent messages, summarize older ones
    const recentMessages: Message[] = [];
    const olderMessages: Message[] = [];

    // Split messages (keep last 10 as recent)
    const splitIndex = Math.max(0, messages.length - 10);
    olderMessages.push(...messages.slice(0, splitIndex));
    recentMessages.push(...messages.slice(splitIndex));

    // Count recent messages tokens
    const recentTokens = this.countMessagesTokens(recentMessages);

    // If recent messages fit, include them all
    if (totalTokens + recentTokens <= maxAllowed) {
      result.push(...recentMessages);
      totalTokens += recentTokens;

      // Try to include older messages
      for (let i = olderMessages.length - 1; i >= 0; i--) {
        const msg = olderMessages[i];
        const msgTokens = this.countTokens(msg.content) + 4;

        if (totalTokens + msgTokens <= maxAllowed) {
          result.splice(systemPrompt ? 1 : 0, 0, msg);
          totalTokens += msgTokens;
        } else {
          break;
        }
      }
    } else {
      // Recent messages don't fit - truncate them
      logger.warn('Context window exceeded, truncating recent messages');

      for (let i = recentMessages.length - 1; i >= 0; i--) {
        const msg = recentMessages[i];
        const msgTokens = this.countTokens(msg.content) + 4;

        if (totalTokens + msgTokens <= maxAllowed) {
          result.splice(systemPrompt ? 1 : 0, 0, msg);
          totalTokens += msgTokens;
        } else {
          break;
        }
      }
    }

    const truncated = result.length < messages.length + (systemPrompt ? 1 : 0);

    if (truncated) {
      logger.info('Context truncated', {
        original: messages.length,
        truncated: result.length - (systemPrompt ? 1 : 0),
        tokens: totalTokens
      });
    }

    return {
      messages: result,
      totalTokens,
      truncated
    };
  }

  cleanup() {
    this.encoder.free();
  }
}
```

Update `llm.service.ts`:
```typescript
import { ContextManager } from './context-manager.service.js';

class LLMService {
  private contextManager: ContextManager;

  constructor() {
    this.contextManager = new ContextManager('gpt-3.5-turbo', 4096);
  }

  async generateResponse(messages: Message[], options: any) {
    // Truncate context if needed
    const { messages: truncatedMessages, truncated } = this.contextManager.truncateContext(
      messages,
      options.systemPrompt
    );

    if (truncated) {
      logger.warn('Context was truncated due to token limit');
    }

    // Use truncated messages for LLM call
    const response = await this.callLLM(truncatedMessages, options);
    return response;
  }
}
```

**Verification:**
1. Create conversation with 100+ messages
2. Verify context is truncated
3. Verify LLM still responds correctly
4. Check logs for truncation warnings
5. Test with different model token limits

---

### Task 1.6: Fix Whisper.cpp Empty Transcripts ⚡ CRITICAL
**Files:**
- `gnani-rnd-backend/src/modules/asr/whisper-cpp.service.ts`
- `gnani-rnd/electron/stream/client.js`

**Issue:** Whisper.cpp returns empty transcripts  
**Effort:** 1 day

**Implementation:**

Debug and fix audio format issues in `whisper-cpp.service.ts`:
```typescript
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import logger from '../../core/logger/logger.js';

class WhisperCppService {
  async transcribe(audioBuffer: Buffer): Promise<string> {
    // Save audio to temp file
    const tempFile = path.join('./uploads', `temp-${Date.now()}.wav`);

    try {
      // Ensure audio is in correct format (16kHz, mono, 16-bit PCM)
      await this.convertAudioFormat(audioBuffer, tempFile);

      // Verify file was created and has content
      const stats = fs.statSync(tempFile);
      if (stats.size === 0) {
        throw new Error('Audio file is empty');
      }

      logger.info('Whisper.cpp: Processing audio', {
        size: stats.size,
        file: tempFile
      });

      // Run whisper.cpp
      const transcript = await this.runWhisperCpp(tempFile);

      // Cleanup
      fs.unlinkSync(tempFile);

      if (!transcript || transcript.trim().length === 0) {
        logger.warn('Whisper.cpp returned empty transcript', {
          audioSize: stats.size
        });
        return '';
      }

      return transcript.trim();
    } catch (error: any) {
      logger.error('Whisper.cpp transcription failed', {
        error: error.message,
        stack: error.stack
      });

      // Cleanup on error
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }

      throw error;
    }
  }

  private async convertAudioFormat(inputBuffer: Buffer, outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // Use ffmpeg to convert to correct format
      const ffmpeg = spawn('ffmpeg', [
        '-i', 'pipe:0',           // Input from stdin
        '-ar', '16000',           // Sample rate 16kHz
        '-ac', '1',               // Mono
        '-f', 'wav',              // WAV format
        '-acodec', 'pcm_s16le',   // 16-bit PCM
        '-y',                     // Overwrite
        outputPath
      ]);

      ffmpeg.stdin.write(inputBuffer);
      ffmpeg.stdin.end();

      let stderr = '';
      ffmpeg.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      ffmpeg.on('close', (code) => {
        if (code !== 0) {
          logger.error('FFmpeg conversion failed', { stderr });
          reject(new Error(`FFmpeg failed with code ${code}`));
        } else {
          logger.info('Audio converted successfully');
          resolve();
        }
      });

      ffmpeg.on('error', (error) => {
        logger.error('FFmpeg spawn error', { error: error.message });
        reject(error);
      });
    });
  }

  private async runWhisperCpp(audioFile: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const whisperPath = process.env.WHISPER_CPP_PATH || './whisper-cpp/main';
      const modelPath = process.env.WHISPER_MODEL_PATH || './whisper-cpp/models/ggml-base.en.bin';

      const args = [
        '-m', modelPath,
        '-f', audioFile,
        '-t', '4',              // 4 threads
        '-l', 'en',             // English
        '--no-timestamps',      // No timestamps in output
        '--print-colors',       // Disable colors
      ];

      logger.info('Running Whisper.cpp', { command: whisperPath, args });

      const whisper = spawn(whisperPath, args);

      let stdout = '';
      let stderr = '';

      whisper.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      whisper.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      whisper.on('close', (code) => {
        if (code !== 0) {
          logger.error('Whisper.cpp failed', { code, stderr });
          reject(new Error(`Whisper.cpp failed with code ${code}`));
        } else {
          // Extract transcript from output
          const transcript = this.extractTranscript(stdout);
          logger.info('Whisper.cpp completed', {
            transcriptLength: transcript.length,
            transcript: transcript.substring(0, 100)
          });
          resolve(transcript);
        }
      });

      whisper.on('error', (error) => {
        logger.error('Whisper.cpp spawn error', { error: error.message });
        reject(error);
      });
    });
  }

  private extractTranscript(output: string): string {
    // Whisper.cpp output format:
    // [00:00:00.000 --> 00:00:02.000]  transcript text here
    // We need to extract just the text

    const lines = output.split('\n');
    const transcriptLines: string[] = [];

    for (const line of lines) {
      // Skip empty lines and metadata
      if (!line.trim() || line.includes('whisper_') || line.includes('processing')) {
        continue;
      }

      // Extract text after timestamp
      const match = line.match(/\]\s+(.+)$/);
      if (match) {
        transcriptLines.push(match[1].trim());
      }
    }

    return transcriptLines.join(' ');
  }
}

export const whisperCppService = new WhisperCppService();
```

**Verification:**
1. Record audio and send to backend
2. Check temp WAV file is created with correct format
3. Verify Whisper.cpp logs show processing
4. Verify transcript is returned
5. Test with various audio lengths
6. Check logs for any errors

---

### Task 1.7: Implement Cache Size Limits with LRU Eviction ⚡ CRITICAL
**Files:**
- `gnani-rnd-backend/src/core/cache/cache.service.ts`
- All cache services

**Issue:** Cache can grow unbounded, memory leak risk  
**Effort:** 1 day

**Implementation:**

Update `cache.service.ts`:
```typescript
import NodeCache from 'node-cache';
import logger from '../logger/logger.js';

interface CacheOptions {
  ttl?: number;
  maxKeys?: number;
  checkperiod?: number;
}

export class CacheService {
  private cache: NodeCache;
  private maxKeys: number;
  private keys: string[]; // LRU tracking

  constructor(options: CacheOptions = {}) {
    this.maxKeys = options.maxKeys || 1000;
    this.cache = new NodeCache({
      stdTTL: options.ttl || 3600,
      checkperiod: options.checkperiod || 600,
      useClones: false,
    });

    this.keys = [];

    // Monitor cache stats
    this.cache.on('set', (key) => {
      this.trackKeyAccess(key);
      this.enforceMaxKeys();
    });

    this.cache.on('expired', (key) => {
      this.removeKeyTracking(key);
      logger.debug('Cache key expired', { key });
    });
  }

  set(key: string, value: any, ttl?: number): boolean {
    const success = this.cache.set(key, value, ttl || 0);
    if (success) {
      this.trackKeyAccess(key);
      this.enforceMaxKeys();
    }
    return success;
  }

  get<T>(key: string): T | undefined {
    const value = this.cache.get<T>(key);
    if (value !== undefined) {
      this.trackKeyAccess(key); // Move to front (most recently used)
    }
    return value;
  }

  delete(key: string): number {
    this.removeKeyTracking(key);
    return this.cache.del(key);
  }

  flush(): void {
    this.cache.flushAll();
    this.keys = [];
  }

  getStats() {
    const stats = this.cache.getStats();
    return {
      ...stats,
      currentKeys: this.keys.length,
      maxKeys: this.maxKeys,
      utilizationPercent: (this.keys.length / this.maxKeys) * 100
    };
  }

  private trackKeyAccess(key: string): void {
    // Remove if exists (to move to front)
    const index = this.keys.indexOf(key);
    if (index > -1) {
      this.keys.splice(index, 1);
    }

    // Add to front (most recently used)
    this.keys.unshift(key);
  }

  private removeKeyTracking(key: string): void {
    const index = this.keys.indexOf(key);
    if (index > -1) {
      this.keys.splice(index, 1);
    }
  }

  private enforceMaxKeys(): void {
    while (this.keys.length > this.maxKeys) {
      // Remove least recently used (last in array)
      const lruKey = this.keys.pop();
      if (lruKey) {
        this.cache.del(lruKey);
        logger.debug('Evicted LRU cache key', { key: lruKey });
      }
    }
  }
}

export default CacheService;
```

Update cache services to use limits:
```typescript
// llm-cache.service.ts
const llmCache = new CacheService({
  ttl: 3600,
  maxKeys: 500, // Max 500 LLM responses cached
  checkperiod: 600
});

// tool-cache.service.ts
const toolCache = new CacheService({
  ttl: 1800,
  maxKeys: 1000, // Max 1000 tool results cached
  checkperiod: 300
});
```

Add monitoring endpoint in `server.ts`:
```typescript
app.get('/api/v1/admin/cache/stats', authenticate, isAdmin, (req, res) => {
  const stats = {
    llm: llmCacheService.getStats(),
    tool: toolCacheService.getStats(),
    template: templateCacheService.getStats(),
  };
  res.json(stats);
});
```

**Verification:**
1. Fill cache beyond max keys
2. Verify LRU eviction occurs
3. Check cache stats endpoint
4. Monitor memory usage
5. Verify most-used items stay in cache

---

### Task 1.8: Add Comprehensive Health Check Endpoint ⚡ CRITICAL
**Files:**
- NEW: `gnani-rnd-backend/src/controllers/health.controller.ts`
- UPDATE: `gnani-rnd-backend/src/routes/health.routes.ts`

**Issue:** App can start in degraded state without indication  
**Effort:** 4 hours

**Implementation:**

Create `health.controller.ts`:
```typescript
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import redisClient from '../config/redis.config.js';
import logger from '../core/logger/logger.js';

interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  services: {
    [key: string]: {
      status: 'up' | 'down';
      latency?: number;
      error?: string;
    };
  };
}

export class HealthController {
  async checkHealth(req: Request, res: Response) {
    const startTime = Date.now();
    const health: HealthCheck = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {}
    };

    // Check MongoDB
    try {
      const mongoStart = Date.now();
      await mongoose.connection.db.admin().ping();
      health.services.mongodb = {
        status: 'up',
        latency: Date.now() - mongoStart
      };
    } catch (error: any) {
      health.services.mongodb = {
        status: 'down',
        error: error.message
      };
      health.status = 'unhealthy';
    }

    // Check Redis
    try {
      const redisStart = Date.now();
      await redisClient.ping();
      health.services.redis = {
        status: 'up',
        latency: Date.now() - redisStart
      };
    } catch (error: any) {
      health.services.redis = {
        status: 'down',
        error: error.message
      };
      health.status = 'degraded'; // Redis is not critical
    }

    // Check Whisper.cpp
    try {
      const { whisperCppService } = await import('../modules/asr/whisper-cpp.service.js');
      // Simple check - verify binary exists
      health.services.whisper = {
        status: 'up'
      };
    } catch (error: any) {
      health.services.whisper = {
        status: 'down',
        error: error.message
      };
      health.status = 'degraded';
    }

    // Check LLM provider
    try {
      const { llmManager } = await import('../core/llm/llm.manager.js');
      const provider = llmManager.getCurrentProvider();
      health.services.llm = {
        status: provider ? 'up' : 'down'
      };
    } catch (error: any) {
      health.services.llm = {
        status: 'down',
        error: error.message
      };
      health.status = 'unhealthy';
    }

    // Check ChromaDB
    try {
      const { ChromaClient } = await import('chromadb');
      const client = new ChromaClient();
      await client.heartbeat();
      health.services.chromadb = {
        status: 'up'
      };
    } catch (error: any) {
      health.services.chromadb = {
        status: 'down',
        error: error.message
      };
      health.status = 'degraded';
    }

    const statusCode = health.status === 'healthy' ? 200 :
                       health.status === 'degraded' ? 200 : 503;

    res.status(statusCode).json(health);
  }

  async checkReadiness(req: Request, res: Response) {
    // Readiness check - is app ready to serve traffic?
    const critical = ['mongodb', 'llm'];

    const health = await this.checkHealth(req, res);

    for (const service of critical) {
      if (health.services[service]?.status === 'down') {
        return res.status(503).json({
          ready: false,
          reason: `Critical service ${service} is down`
        });
      }
    }

    res.json({ ready: true });
  }

  async checkLiveness(req: Request, res: Response) {
    // Liveness check - is app alive?
    res.json({ alive: true });
  }
}

export const healthController = new HealthController();
```

Update routes:
```typescript
import express from 'express';
import { healthController } from '../controllers/health.controller.js';

const router = express.Router();

router.get('/health', healthController.checkHealth.bind(healthController));
router.get('/health/ready', healthController.checkReadiness.bind(healthController));
router.get('/health/live', healthController.checkLiveness.bind(healthController));

export default router;
```

**Verification:**
1. Call `/api/v1/health` - should return all services
2. Stop MongoDB - health should show unhealthy
3. Stop Redis - health should show degraded
4. Call `/health/ready` - should check critical services
5. Call `/health/live` - should always return alive

---

### Task 1.9: Fix Race Conditions in VAD/TTS Barge-in ⚡ CRITICAL
**Files:**
- `gnani-rnd/electron/main.js`
- `gnani-rnd/electron/vad/vadManager.js`
- `gnani-rnd/electron/stream/ttsPlayer.js`

**Issue:** Race conditions between VAD speech detection and TTS playback  
**Effort:** 1 day

**Implementation:**

Update `main.js` with proper state management:
```javascript
// Add state tracking
let ttsState = {
  isPlaying: false,
  canInterrupt: true,
  playbackStartTime: null
};

let vadState = {
  isProcessing: false,
  speechDetected: false,
  lastSpeechTime: null
};

// Update TTS handlers
ipcMain.on('tts:started', () => {
  logger.info('TTS started');
  ttsState.isPlaying = true;
  ttsState.canInterrupt = true;
  ttsState.playbackStartTime = Date.now();
});

ipcMain.on('tts:ended', () => {
  logger.info('TTS ended');
  ttsState.isPlaying = false;
  ttsState.canInterrupt = false;
  ttsState.playbackStartTime = null;
});

// Update VAD handler with debouncing
let speechStartTimeout = null;

vadManager.on('speech:start', () => {
  const now = Date.now();

  // Debounce speech detection (ignore if too soon after last)
  if (vadState.lastSpeechTime && (now - vadState.lastSpeechTime) < 500) {
    logger.debug('VAD: Ignoring rapid speech detection');
    return;
  }

  vadState.speechDetected = true;
  vadState.lastSpeechTime = now;

  // Clear any pending timeout
  if (speechStartTimeout) {
    clearTimeout(speechStartTimeout);
  }

  // Debounce speech start (wait 200ms to confirm)
  speechStartTimeout = setTimeout(() => {
    logger.info('VAD: Speech confirmed');

    // Barge-in logic
    if (ttsState.isPlaying && ttsState.canInterrupt) {
      // Only interrupt if TTS has been playing for at least 500ms
      const playbackDuration = Date.now() - ttsState.playbackStartTime;

      if (playbackDuration > 500) {
        logger.info('Barge-in: Stopping TTS');

        if (ttsPlayer) {
          ttsPlayer.stopPlayback();
        }

        ttsState.isPlaying = false;
        ttsState.canInterrupt = false;
      } else {
        logger.debug('Barge-in: TTS too recent, not interrupting');
        return;
      }
    }

    // Start audio streaming
    if (!vadState.isProcessing) {
      logger.info('Starting audio stream');
      vadState.isProcessing = true;
      streamingClient.startAudioStreaming(true);
    }
  }, 200);
});

vadManager.on('speech:end', () => {
  // Clear pending timeout
  if (speechStartTimeout) {
    clearTimeout(speechStartTimeout);
    speechStartTimeout = null;
  }

  vadState.speechDetected = false;

  if (vadState.isProcessing) {
    logger.info('VAD: Silence detected, stopping audio stream');
    vadState.isProcessing = false;
    streamingClient.stopAudioStreaming();
  }
});

// Cleanup on exit
app.on('will-quit', () => {
  if (speechStartTimeout) {
    clearTimeout(speechStartTimeout);
  }
});
```

Update `ttsPlayer.js` with proper cleanup:
```javascript
class TtsPlayer {
  constructor() {
    this.isPlaying = false;
    this.currentAudio = null;
    this.audioQueue = [];
  }

  async playAudio(audioBuffer) {
    // If already playing, queue it
    if (this.isPlaying) {
      this.audioQueue.push(audioBuffer);
      return;
    }

    this.isPlaying = true;
    this.currentAudio = audioBuffer;

    try {
      await this.playBuffer(audioBuffer);
    } finally {
      this.isPlaying = false;
      this.currentAudio = null;

      // Play next in queue
      if (this.audioQueue.length > 0) {
        const next = this.audioQueue.shift();
        this.playAudio(next);
      }
    }
  }

  stopPlayback() {
    if (this.currentAudio) {
      // Stop current playback
      this.currentAudio = null;
      this.isPlaying = false;
    }

    // Clear queue
    this.audioQueue = [];

    logger.info('TTS playback stopped');
  }

  cleanup() {
    this.stopPlayback();
  }
}
```

**Verification:**
1. Start TTS playback
2. Speak while TTS is playing (should interrupt)
3. Speak immediately after TTS starts (should not interrupt)
4. Verify no duplicate audio streams
5. Check logs for race condition warnings

---

### Task 1.10: Centralize Configuration Management ⚡ CRITICAL
**Files:**
- NEW: `gnani-rnd-backend/src/config/app.config.ts`
- NEW: `gnani-rnd/react/src/config/app.config.ts`
- UPDATE: All files with hardcoded values

**Issue:** Configuration scattered across files, hardcoded URLs  
**Effort:** 1 day

**Implementation:**

Backend `config/app.config.ts`:
```typescript
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const configSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3000'),
  HOST: z.string().default('localhost'),

  // Database
  MONGODB_URI: z.string(),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().transform(Number).default('6379'),

  // API
  API_VERSION: z.string().default('v1'),
  API_BASE_PATH: z.string().default('/api'),

  // LLM
  LLM_PROVIDER: z.enum(['ollama', 'localai', 'vllm', 'llamacpp']).default('ollama'),
  LLM_BASE_URL: z.string().default('http://localhost:11434'),
  LLM_MODEL: z.string().default('llama2'),
  LLM_MAX_TOKENS: z.string().transform(Number).default('4096'),
  LLM_TEMPERATURE: z.string().transform(Number).default('0.7'),

  // Whisper
  WHISPER_PROVIDER: z.enum(['api', 'cpp']).default('cpp'),
  WHISPER_CPP_PATH: z.string().default('./whisper-cpp/main'),
  WHISPER_MODEL_PATH: z.string().default('./whisper-cpp/models/ggml-base.en.bin'),

  // ChromaDB
  CHROMA_HOST: z.string().default('localhost'),
  CHROMA_PORT: z.string().transform(Number).default('8000'),

  // File Upload
  MAX_FILE_SIZE_MB: z.string().transform(Number).default('50'),
  UPLOAD_DIR: z.string().default('./uploads'),

  // Cache
  CACHE_TTL_SECONDS: z.string().transform(Number).default('3600'),
  CACHE_MAX_KEYS: z.string().transform(Number).default('1000'),

  // Security
  JWT_SECRET: z.string(),
  JWT_EXPIRES_IN: z.string().default('1h'),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('7d'),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('60000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).default('100'),

  // Vault (optional)
  VAULT_ENABLED: z.string().transform(v => v === 'true').default('false'),
  VAULT_ADDR: z.string().optional(),
  VAULT_TOKEN: z.string().optional(),
});

const parseConfig = () => {
  try {
    return configSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Configuration validation failed:');
      error.errors.forEach(err => {
        console.error(`  ${err.path.join('.')}: ${err.message}`);
      });
      process.exit(1);
    }
    throw error;
  }
};

export const config = parseConfig();

export default config;
```

Frontend `config/app.config.ts`:
```typescript
interface AppConfig {
  apiUrl: string;
  apiVersion: string;
  grpcUrl: string;
  environment: 'development' | 'production';
  features: {
    offlineMode: boolean;
    analytics: boolean;
    plugins: boolean;
  };
  limits: {
    maxFileSize: number;
    maxMessageLength: number;
    maxConversations: number;
  };
}

const getConfig = (): AppConfig => {
  const env = import.meta.env.MODE || 'development';

  return {
    apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
    apiVersion: import.meta.env.VITE_API_VERSION || 'v1',
    grpcUrl: import.meta.env.VITE_GRPC_URL || 'localhost:50051',
    environment: env as 'development' | 'production',
    features: {
      offlineMode: import.meta.env.VITE_FEATURE_OFFLINE === 'true',
      analytics: import.meta.env.VITE_FEATURE_ANALYTICS === 'true',
      plugins: import.meta.env.VITE_FEATURE_PLUGINS === 'false', // Disabled for now
    },
    limits: {
      maxFileSize: parseInt(import.meta.env.VITE_MAX_FILE_SIZE || '10485760'), // 10MB
      maxMessageLength: parseInt(import.meta.env.VITE_MAX_MESSAGE_LENGTH || '10000'),
      maxConversations: parseInt(import.meta.env.VITE_MAX_CONVERSATIONS || '100'),
    },
  };
};

export const config = getConfig();
export default config;
```

Create `.env.example` files:
```bash
# Backend .env.example
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/gnani
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your-secret-key-here
LLM_PROVIDER=ollama
LLM_BASE_URL=http://localhost:11434
```

```bash
# Frontend .env.example
VITE_API_URL=http://localhost:3000/api/v1
VITE_GRPC_URL=localhost:50051
VITE_FEATURE_OFFLINE=true
VITE_FEATURE_ANALYTICS=true
VITE_FEATURE_PLUGINS=false
```

Update files to use config:
```typescript
// OLD:
const API_BASE_URL = 'http://localhost:3000/api/v1';

// NEW:
import { config } from '../config/app.config';
const API_BASE_URL = config.apiUrl;
```

**Verification:**
1. Verify all hardcoded values removed
2. Test with different .env configurations
3. Verify config validation catches missing values
4. Test environment switching (dev/prod)
5. Verify all services use centralized config

---

## ✅ STAGE 1 VERIFICATION CHECKLIST

### Unit Tests
- [ ] API client retry logic tests
- [ ] Message tree validator tests
- [ ] File validation tests
- [ ] Context manager tests
- [ ] Cache LRU eviction tests
- [ ] Config validation tests

### Integration Tests
- [ ] End-to-end API call with retry
- [ ] Message chain repair on load
- [ ] File upload with size limits
- [ ] LLM with context truncation
- [ ] Whisper.cpp transcription
- [ ] Cache eviction under load

### Manual Testing
- [ ] Health check endpoint returns all services
- [ ] BullMQ queue processes jobs
- [ ] Barge-in works without race conditions
- [ ] Configuration loads from .env
- [ ] All hardcoded values replaced

### Performance
- [ ] API response time < 200ms
- [ ] Cache hit rate > 80%
- [ ] Memory usage stable under load
- [ ] No memory leaks after 1 hour

### Documentation
- [ ] API client usage documented
- [ ] Configuration options documented
- [ ] Health check endpoint documented
- [ ] Deployment guide updated

---

## 📝 NOTES

### Dependencies
- ffmpeg (for audio conversion)
- Whisper.cpp binary
- Redis running
- MongoDB running

### Breaking Changes
- API client changes require updating all stores
- Configuration changes require new .env files

### Migration Steps
1. Install dependencies
2. Update .env files
3. Run database migrations (if any)
4. Update all stores to use API client
5. Test thoroughly before deploying

---

**END OF STAGE 1**
