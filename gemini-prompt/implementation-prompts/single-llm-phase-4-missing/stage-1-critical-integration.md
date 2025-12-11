# STAGE 1: CRITICAL INTEGRATION FIXES

**Duration:** 1 week  
**Priority:** CRITICAL  
**Dependencies:** None

---

## 🎯 OBJECTIVE

Fix critical integration gaps that affect reliability, performance, and security. These are high-impact fixes for features that exist but aren't properly integrated.

---

## 📋 TASKS

### Task 1.1: Integrate API Client into All Stores ⚡ CRITICAL
**Files:**
- `gnani-rnd/react/src/api/client.ts` (EXISTS - not used)
- `gnani-rnd/react/src/store/useConversationStore.ts`
- `gnani-rnd/react/src/store/useUserStore.ts`
- `gnani-rnd/react/src/store/useTemplateStore.ts`
- `gnani-rnd/react/src/store/useModelStore.ts`
- `gnani-rnd/react/src/store/useAnalyticsStore.ts`

**Issue:** API client with retry logic exists but all stores still use direct `fetch()` calls  
**Impact:** No retry logic, no request deduplication, manual error handling  
**Effort:** 2 days

**Current State:**
```typescript
// client.ts EXISTS with:
- Retry logic ✅
- Request deduplication ✅
- Token refresh ✅
- Circuit breaker integration ✅

// BUT stores still do:
const response = await fetch(`${API_BASE_URL}/conversations`);
```

**Implementation:**

**Step 1:** Initialize API client in App.tsx
```typescript
// src/App.tsx
import { useEffect } from 'react';
import { api } from './api/client';
import { useUserStore } from './store/useUserStore';

function App() {
  const { accessToken, refreshAccessToken } = useUserStore();
  
  useEffect(() => {
    // Set auth token getter
    api.setTokenGetter(() => accessToken);
    
    // Set token refresh handler
    api.setTokenRefresher(async () => {
      await refreshAccessToken();
      return useUserStore.getState().accessToken;
    });
  }, []);
  
  // ... rest of app
}
```

**Step 2:** Replace fetch in useConversationStore
```typescript
// Before:
const response = await fetch(`${API_BASE_URL}/conversations`, {
  headers: { 'x-auth-token': accessToken }
});
const data = await response.json();

// After:
import { api } from '../api/client';

const data = await api.get('/conversations');
```

**Step 3:** Replace all fetch calls in stores
Update these methods in each store:
- `useConversationStore`: 15 fetch calls
- `useUserStore`: 8 fetch calls  
- `useTemplateStore`: 5 fetch calls
- `useModelStore`: 3 fetch calls
- `useAnalyticsStore`: 4 fetch calls

**Step 4:** Remove hardcoded API URLs
```typescript
// Remove all instances of:
const API_BASE_URL = 'http://localhost:3000/api/v1';

// API client already uses config.apiUrl
```

**Verification:**
1. Test with network throttling - verify retries work
2. Simulate 401 error - verify token refresh
3. Make duplicate requests - verify deduplication
4. Check network tab - no duplicate requests
5. Test offline - verify error handling

---

### Task 1.2: Apply File Validation Middleware ⚡ CRITICAL
**Files:**
- `gnani-rnd-backend/src/middleware/file-validation.middleware.ts` (EXISTS - not used)
- `gnani-rnd-backend/src/routes/file.routes.ts`
- `gnani-rnd-backend/src/routes/conversation.routes.ts`

**Issue:** File validation middleware exists but not applied to upload routes  
**Impact:** No file size limits, security risk, DoS potential  
**Effort:** 4 hours

**Current State:**
```typescript
// Middleware EXISTS in file-validation.middleware.ts
export const validateFileUpload = (fileType) => { ... }

// But routes don't use it:
router.post('/upload', upload.single('file'), fileController.uploadFile);
```

**Implementation:**

**Step 1:** Apply to file upload routes
```typescript
// src/routes/file.routes.ts
import { validateFileUpload } from '../middleware/file-validation.middleware.js';

router.post('/upload',
  authenticateToken,
  upload.single('file'),
  validateFileUpload('document'), // ADD THIS
  fileController.uploadFile
);

router.post('/upload/image',
  authenticateToken,
  upload.single('image'),
  validateFileUpload('image'), // ADD THIS
  fileController.uploadImage
);
```

**Step 2:** Apply to conversation file uploads
```typescript
// src/routes/conversation.routes.ts
router.post('/:id/attachments',
  authenticateToken,
  upload.array('files', 10),
  validateFileUpload('document'), // ADD THIS
  conversationController.addAttachments
);
```

**Step 3:** Add error handling in frontend
```typescript
// src/hooks/useFileUpload.ts
const uploadFile = async (file: File) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post('/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    
    return response.data;
  } catch (error: any) {
    if (error.message.includes('File too large')) {
      throw new Error(`File exceeds maximum size limit`);
    }
    if (error.message.includes('Invalid file type')) {
      throw new Error(`File type not supported`);
    }
    throw error;
  }
};
```

**Verification:**
1. Upload file larger than 50MB - should fail with clear error
2. Upload invalid file type (.exe) - should fail
3. Upload valid PDF - should succeed
4. Upload 11 files at once - should fail (limit 10)
5. Check error messages are user-friendly

---

### Task 1.3: Verify and Fix Whisper.cpp Empty Transcripts ⚡ CRITICAL
**Files:**
- `gnani-rnd-backend/src/modules/asr/whisper-cpp.service.ts`
- `gnani-rnd/electron/stream/client.js`

**Issue:** Whisper.cpp sometimes returns empty transcripts  
**Impact:** Voice input fails silently  
**Effort:** 1 day

**Implementation:**

**Step 1:** Add audio format validation
```typescript
// whisper-cpp.service.ts
async transcribe(audioBuffer: Buffer): Promise<string> {
  // Validate audio buffer
  if (!audioBuffer || audioBuffer.length === 0) {
    logger.error('Empty audio buffer received');
    throw new Error('Empty audio buffer');
  }
  
  // Check minimum audio length (at least 0.5 seconds)
  const minBytes = 16000 * 2 * 0.5; // 16kHz * 2 bytes * 0.5s
  if (audioBuffer.length < minBytes) {
    logger.warn('Audio too short for transcription', {
      bytes: audioBuffer.length,
      minBytes
    });
    return '';
  }
  
  // Save to temp file with proper WAV header
  const tempFile = await this.saveAsWav(audioBuffer);
  
  // ... rest of transcription
}

private async saveAsWav(pcmData: Buffer): Promise<string> {
  const wavHeader = this.createWavHeader(pcmData.length);
  const wavFile = Buffer.concat([wavHeader, pcmData]);
  
  const tempPath = path.join('./uploads', `audio-${Date.now()}.wav`);
  await fs.promises.writeFile(tempPath, wavFile);
  
  return tempPath;
}

private createWavHeader(dataLength: number): Buffer {
  const header = Buffer.alloc(44);
  
  // RIFF header
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataLength, 4);
  header.write('WAVE', 8);
  
  // fmt chunk
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // fmt chunk size
  header.writeUInt16LE(1, 20); // PCM format
  header.writeUInt16LE(1, 22); // Mono
  header.writeUInt32LE(16000, 24); // Sample rate
  header.writeUInt32LE(32000, 28); // Byte rate
  header.writeUInt16LE(2, 32); // Block align
  header.writeUInt16LE(16, 34); // Bits per sample
  
  // data chunk
  header.write('data', 36);
  header.writeUInt32LE(dataLength, 40);
  
  return header;
}
```

**Step 2:** Add logging for debugging
```typescript
async transcribe(audioBuffer: Buffer): Promise<string> {
  const startTime = Date.now();
  
  logger.info('Whisper.cpp transcription started', {
    bufferSize: audioBuffer.length,
    durationSeconds: audioBuffer.length / (16000 * 2)
  });
  
  const transcript = await this.runWhisperCpp(tempFile);
  
  logger.info('Whisper.cpp transcription completed', {
    duration: Date.now() - startTime,
    transcriptLength: transcript.length,
    isEmpty: transcript.trim().length === 0
  });
  
  if (!transcript || transcript.trim().length === 0) {
    logger.warn('Empty transcript returned', {
      audioSize: audioBuffer.length,
      tempFile
    });
  }
  
  return transcript.trim();
}
```

**Step 3:** Add fallback to Whisper API
```typescript
async transcribe(audioBuffer: Buffer): Promise<string> {
  try {
    const transcript = await this.transcribeWithCpp(audioBuffer);
    
    if (!transcript || transcript.trim().length === 0) {
      logger.warn('Whisper.cpp returned empty, trying API fallback');
      return await this.transcribeWithAPI(audioBuffer);
    }
    
    return transcript;
  } catch (error) {
    logger.error('Whisper.cpp failed, using API fallback', error);
    return await this.transcribeWithAPI(audioBuffer);
  }
}
```

**Verification:**
1. Record 5-second audio - verify transcript
2. Record 1-second audio - verify handling
3. Send empty buffer - verify error
4. Check logs for audio format details
5. Test with background noise

---

### Task 1.4: Complete Cache Eviction Implementation
**Files:**
- `gnani-rnd-backend/src/modules/cache/tiered-cache.service.ts`
- `gnani-rnd-backend/src/core/cache/cache.service.ts`

**Issue:** Cache has basic LRU but no comprehensive eviction  
**Effort:** 4 hours

**Implementation:**

```typescript
// tiered-cache.service.ts
class TieredCacheService {
  private l1MaxSize = 100; // 100 items
  private l2MaxSize = 1000; // 1000 items
  private l3MaxSize = 10000; // 10000 items
  
  private async evictL1() {
    if (this.l1Cache.size >= this.l1MaxSize) {
      // LRU eviction - remove oldest
      const firstKey = this.l1Cache.keys().next().value;
      if (firstKey) {
        const value = this.l1Cache.get(firstKey);
        this.l1Cache.delete(firstKey);
        
        // Promote to L2
        await this.setToL2(firstKey, value);
        
        logger.debug('L1 cache evicted', {
          key: firstKey,
          promotedToL2: true
        });
      }
    }
  }
  
  private async evictL2() {
    const size = await redis.dbsize();
    if (size >= this.l2MaxSize) {
      // Get random keys and remove oldest
      const keys = await redis.keys('cache:*');
      const oldest = keys[0]; // Simplified - should check timestamps
      
      const value = await redis.get(oldest);
      await redis.del(oldest);
      
      // Promote to L3 (MongoDB)
      if (value) {
        await this.setToL3(oldest, JSON.parse(value));
      }
      
      logger.debug('L2 cache evicted', {
        key: oldest,
        promotedToL3: true
      });
    }
  }
}
```

**Verification:**
1. Fill L1 cache beyond limit - verify eviction
2. Check L2 promotion works
3. Monitor memory usage
4. Verify cache hit rates

---

### Task 1.5: Enhance Health Check Endpoint
**Files:**
- `gnani-rnd-backend/src/routes/health.routes.ts`
- NEW: `gnani-rnd-backend/src/services/health-check.service.ts`

**Issue:** Health check is basic, doesn't verify all services  
**Effort:** 4 hours

**Implementation:**

```typescript
// services/health-check.service.ts
export class HealthCheckService {
  async checkAll(): Promise<HealthStatus> {
    const checks = await Promise.allSettled([
      this.checkMongoDB(),
      this.checkRedis(),
      this.checkLLM(),
      this.checkWhisper(),
      this.checkChromaDB(),
    ]);
    
    const results = {
      mongodb: checks[0].status === 'fulfilled' ? checks[0].value : { healthy: false },
      redis: checks[1].status === 'fulfilled' ? checks[1].value : { healthy: false },
      llm: checks[2].status === 'fulfilled' ? checks[2].value : { healthy: false },
      whisper: checks[3].status === 'fulfilled' ? checks[3].value : { healthy: false },
      chromadb: checks[4].status === 'fulfilled' ? checks[4].value : { healthy: false },
    };
    
    const allHealthy = Object.values(results).every(r => r.healthy);
    
    return {
      status: allHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      services: results
    };
  }
  
  private async checkMongoDB() {
    try {
      await mongoose.connection.db.admin().ping();
      return { healthy: true, latency: 0 };
    } catch (error) {
      return { healthy: false, error: error.message };
    }
  }
  
  // ... similar for other services
}
```

**Verification:**
1. Call `/health` - all services should be healthy
2. Stop MongoDB - health should show degraded
3. Restart MongoDB - health should recover
4. Check response time < 1s

---

### Task 1.6: Fix VAD/TTS Race Conditions
**Files:**
- `gnani-rnd/electron/main.js`
- `gnani-rnd/electron/vad/vadManager.js`
- `gnani-rnd/electron/stream/ttsPlayer.js`

**Issue:** Barge-in has race conditions  
**Effort:** 4 hours

**Implementation:**

```javascript
// main.js - Add state machine for barge-in
let audioState = {
  isTTSPlaying: false,
  isUserSpeaking: false,
  bargeInEnabled: true
};

// VAD speech start
ipcMain.on('vad:speech-start', () => {
  if (audioState.isTTSPlaying && audioState.bargeInEnabled) {
    logger.info('Barge-in detected - stopping TTS');
    
    // Stop TTS immediately
    ttsPlayer.stop();
    audioState.isTTSPlaying = false;
    
    // Notify frontend
    mainWindow.webContents.send('tts:interrupted');
  }
  
  audioState.isUserSpeaking = true;
});

// TTS start
ipcMain.on('tts:start', () => {
  audioState.isTTSPlaying = true;
  audioState.isUserSpeaking = false;
});

// TTS end
ipcMain.on('tts:end', () => {
  audioState.isTTSPlaying = false;
});
```

**Verification:**
1. Start TTS playback
2. Speak while TTS playing - TTS should stop
3. Verify no audio overlap
4. Check logs for race conditions

---

### Task 1.7: Complete Configuration Centralization
**Files:**
- `gnani-rnd-backend/src/config/app.config.ts` (EXISTS)
- All files with hardcoded config

**Issue:** Config partially centralized, still has hardcoded values  
**Effort:** 4 hours

**Implementation:**

```typescript
// Find and replace all hardcoded values:
grep -r "http://localhost:3000" src/
grep -r "http://localhost:11434" src/
grep -r "localhost:6379" src/

// Replace with:
import config from '../config/app.config.js';

// Use:
config.API_URL
config.LLM_SERVER_URL
config.REDIS_HOST
```

**Verification:**
1. Search codebase for hardcoded URLs - should find none
2. Change config value - verify app uses new value
3. Test with different environments

---

## ✅ VERIFICATION CHECKLIST

After completing all tasks:

- [ ] All stores use API client (no fetch() calls)
- [ ] File uploads validated and size-limited
- [ ] Whisper.cpp returns valid transcripts
- [ ] Cache eviction works properly
- [ ] Health check verifies all services
- [ ] No VAD/TTS race conditions
- [ ] No hardcoded configuration values
- [ ] All tests pass
- [ ] No console errors
- [ ] Performance acceptable

---

## 📊 SUCCESS METRICS

- **API Reliability:** 99%+ success rate with retries
- **File Security:** 100% uploads validated
- **Transcription:** 95%+ non-empty transcripts
- **Health Check:** < 1s response time
- **Configuration:** 0 hardcoded values

---

## 🚀 NEXT STEPS

After Stage 1 completion:
→ **Stage 2:** UI Integration Completion
