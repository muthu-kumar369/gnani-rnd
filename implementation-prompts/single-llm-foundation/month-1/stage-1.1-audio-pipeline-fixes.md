# Stage 1.1: Audio Pipeline Fixes

**Duration:** Week 1-2 (10 working days)  
**Priority:** 🔴 Critical  
**Dependencies:** None (can start immediately)

---

## Overview

Fix critical audio pipeline issues to ensure stable, crash-free audio streaming for extended sessions (1+ hours). This stage addresses VAD false positives, audio buffer overflows, and gRPC connection reliability.

## Goals

1. Implement adaptive VAD with noise profiling
2. Add audio buffer overflow protection
3. Implement resilient gRPC client with auto-reconnection
4. Test with 1-hour continuous recording sessions

## Current Issues

### Issue 1: VAD False Positives
**Location:** `gnani-rnd/electron/modules/vad-manager.js`
**Problem:** Background noise triggers recording, wastes STT resources
**Impact:** High - causes unnecessary processing, poor UX

### Issue 2: Audio Buffer Overflow
**Location:** `gnani-rnd-backend/src/modules/session/session.manager.ts` (lines 94-128)
**Problem:** No size limit on audio buffer, memory leak on long recordings
**Impact:** Critical - crashes after ~30 minutes of continuous use

### Issue 3: gRPC Connection Failures
**Location:** `gnani-rnd/electron/modules/grpc-client.js`
**Problem:** No reconnection logic, app becomes unusable on network hiccup
**Impact:** Critical - requires app restart

---

## Implementation Tasks

### Task 1: Adaptive VAD Implementation

**File to Modify:** `gnani-rnd/electron/modules/vad-manager.js`

**Current Code Analysis:**
```javascript
// Current VAD is basic threshold-based
class VADManager {
  constructor() {
    this.threshold = 0.5; // Fixed threshold
  }
  
  detectSpeech(audioData) {
    const energy = this.calculateEnergy(audioData);
    return energy > this.threshold; // Simple comparison
  }
}
```

**Required Changes:**

1. **Add Noise Profiling:**
```javascript
class ImprovedVADManager {
  constructor() {
    this.threshold = 0.5;
    this.noiseProfile = null;
    this.adaptiveThreshold = 0.5;
    this.calibrationSamples = [];
    this.isCalibrated = false;
  }
  
  // Step 1: Calibrate during first 2 seconds of silence
  async calibrateNoise(audioData) {
    if (this.calibrationSamples.length < 100) { // 2 seconds at 50fps
      this.calibrationSamples.push(audioData);
      return;
    }
    
    // Calculate noise floor from calibration samples
    const noiseEnergies = this.calibrationSamples.map(sample => 
      this.calculateEnergy(sample)
    );
    
    const avgNoise = noiseEnergies.reduce((a, b) => a + b) / noiseEnergies.length;
    const stdNoise = this.calculateStdDev(noiseEnergies, avgNoise);
    
    // Set adaptive threshold: 3 standard deviations above noise floor
    this.adaptiveThreshold = avgNoise + (3 * stdNoise);
    this.isCalibrated = true;
    
    logger.info('VAD calibrated', { 
      avgNoise, 
      stdNoise, 
      threshold: this.adaptiveThreshold 
    });
  }
  
  detectSpeech(audioData) {
    // Use adaptive threshold if calibrated
    const threshold = this.isCalibrated 
      ? this.adaptiveThreshold 
      : this.threshold;
    
    const energy = this.calculateEnergy(audioData);
    return energy > threshold;
  }
  
  calculateStdDev(values, mean) {
    const squareDiffs = values.map(value => Math.pow(value - mean, 2));
    const avgSquareDiff = squareDiffs.reduce((a, b) => a + b) / values.length;
    return Math.sqrt(avgSquareDiff);
  }
}
```

2. **Add Manual Recalibration:**
```javascript
// Add IPC handler in main.js
ipcMain.on('vad:recalibrate', () => {
  if (vadManager) {
    vadManager.isCalibrated = false;
    vadManager.calibrationSamples = [];
    logger.info('VAD recalibration started');
  }
});
```

3. **Add UI Button for Recalibration:**
```typescript
// In GnaniCore.tsx, add button
<button onClick={() => window.electron.ipcRenderer.send('vad:recalibrate')}>
  Recalibrate Microphone
</button>
```

**Acceptance Criteria:**
- [ ] VAD calibrates automatically on first use
- [ ] Adaptive threshold reduces false positives by 80%
- [ ] Manual recalibration button works
- [ ] Calibration status shown in UI

---

### Task 2: Audio Buffer Overflow Protection

**File to Modify:** `gnani-rnd-backend/src/modules/session/session.manager.ts`

**Current Code (lines 94-128):**
```typescript
async appendAudioChunk(sessionId: string, audioChunk: Buffer, inputSampleRate: number): Promise<void> {
  const session = this.sessions.get(sessionId);
  if (!session) {
    throw new Error(`Session ${sessionId} not found`);
  }

  // Problem: No size limit!
  session.audioBuffer.push(audioChunk);
  
  // Rest of the code...
}
```

**Required Changes:**

1. **Add Buffer Size Limits:**
```typescript
class SessionManager {
  private MAX_BUFFER_SIZE = 10 * 1024 * 1024; // 10MB limit
  private BUFFER_WARNING_SIZE = 8 * 1024 * 1024; // 8MB warning
  
  async appendAudioChunk(sessionId: string, audioChunk: Buffer, inputSampleRate: number): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    // Calculate current buffer size
    const currentSize = session.audioBuffer.reduce((sum, buf) => sum + buf.length, 0);
    const newSize = currentSize + audioChunk.length;

    // Check for overflow
    if (newSize > this.MAX_BUFFER_SIZE) {
      this.logger.error('Audio buffer overflow detected', {
        sessionId,
        currentSize,
        maxSize: this.MAX_BUFFER_SIZE
      });
      
      // Auto-flush to prevent crash
      await this.flushAudioBuffer(sessionId);
      
      // Emit warning to frontend
      session.onTranscriptionCallback('⚠️ Audio buffer overflow - processing...', false);
    }
    
    // Warning at 80% capacity
    if (newSize > this.BUFFER_WARNING_SIZE && currentSize <= this.BUFFER_WARNING_SIZE) {
      this.logger.warn('Audio buffer approaching limit', {
        sessionId,
        currentSize: newSize,
        maxSize: this.MAX_BUFFER_SIZE
      });
    }

    session.audioBuffer.push(audioChunk);
    this.resetSessionTimeout(sessionId);
  }
  
  private async flushAudioBuffer(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session || session.audioBuffer.length === 0) return;
    
    this.logger.info('Flushing audio buffer', { sessionId });
    
    // Process accumulated audio
    const combinedBuffer = Buffer.concat(session.audioBuffer);
    await whisperService.transcribe(sessionId, combinedBuffer, 16000);
    
    // Clear buffer
    session.audioBuffer = [];
  }
}
```

2. **Add Buffer Monitoring:**
```typescript
// Add to session manager
getBufferStats(sessionId: string): { size: number; chunks: number } {
  const session = this.sessions.get(sessionId);
  if (!session) return { size: 0, chunks: 0 };
  
  const size = session.audioBuffer.reduce((sum, buf) => sum + buf.length, 0);
  return { size, chunks: session.audioBuffer.length };
}
```

3. **Add Metrics:**
```typescript
// In appendAudioChunk
metrics.gauge('audio_buffer_size', newSize, { sessionId });
metrics.gauge('audio_buffer_chunks', session.audioBuffer.length, { sessionId });
```

**Acceptance Criteria:**
- [ ] Buffer never exceeds 10MB
- [ ] Auto-flush prevents crashes
- [ ] Warning logged at 80% capacity
- [ ] Metrics track buffer size
- [ ] 1-hour recording test passes

---

### Task 3: Resilient gRPC Client

**File to Modify:** `gnani-rnd/electron/modules/grpc-client.js`

**Current Code:**
```javascript
class GRPCClient {
  connect() {
    this.call = this.client.SendAudioStream();
    
    this.call.on('error', (error) => {
      console.error('gRPC error:', error);
      // Problem: No reconnection!
    });
  }
}
```

**Required Changes:**

1. **Add Reconnection Logic:**
```javascript
class ResilientGRPCClient {
  constructor() {
    this.reconnectAttempts = 0;
    this.maxReconnects = 5;
    this.reconnectDelay = 1000; // Start with 1s
    this.isConnected = false;
    this.reconnectTimer = null;
  }
  
  async connect() {
    try {
      this.call = this.client.SendAudioStream();
      
      this.call.on('data', (response) => {
        this.handleResponse(response);
      });
      
      this.call.on('error', (error) => {
        logger.error('gRPC error', { error: error.message });
        this.handleDisconnection(error);
      });
      
      this.call.on('end', () => {
        logger.warn('gRPC stream ended');
        this.handleDisconnection(new Error('Stream ended'));
      });
      
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;
      
      logger.info('gRPC connected successfully');
      
      // Notify frontend
      this.emit('connected');
      
    } catch (error) {
      logger.error('gRPC connection failed', { error: error.message });
      this.handleDisconnection(error);
    }
  }
  
  handleDisconnection(error) {
    this.isConnected = false;
    
    // Notify frontend
    this.emit('disconnected', { error: error.message });
    
    // Attempt reconnection
    if (this.reconnectAttempts < this.maxReconnects) {
      this.reconnectAttempts++;
      
      logger.info('Attempting reconnection', {
        attempt: this.reconnectAttempts,
        delay: this.reconnectDelay
      });
      
      this.reconnectTimer = setTimeout(() => {
        this.connect();
      }, this.reconnectDelay);
      
      // Exponential backoff
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000); // Max 30s
      
    } else {
      logger.error('Max reconnection attempts reached');
      this.emit('reconnect-failed');
    }
  }
  
  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    
    if (this.call) {
      this.call.end();
    }
    
    this.isConnected = false;
  }
  
  sendAudio(audioData) {
    if (!this.isConnected) {
      logger.warn('Cannot send audio: not connected');
      return false;
    }
    
    try {
      this.call.write({ audioChunk: audioData });
      return true;
    } catch (error) {
      logger.error('Error sending audio', { error: error.message });
      this.handleDisconnection(error);
      return false;
    }
  }
}
```

2. **Add Connection Status UI:**
```typescript
// In GnaniCore.tsx
const [grpcStatus, setGrpcStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('disconnected');

useEffect(() => {
  window.electron.grpc.on('connected', () => {
    setGrpcStatus('connected');
    showNotification('Connected', 'Voice assistant ready');
  });
  
  window.electron.grpc.on('disconnected', () => {
    setGrpcStatus('reconnecting');
    showNotification('Disconnected', 'Attempting to reconnect...');
  });
  
  window.electron.grpc.on('reconnect-failed', () => {
    setGrpcStatus('disconnected');
    showNotification('Connection Failed', 'Please restart the app');
  });
}, []);

// Show status indicator
<div className={`status-indicator ${grpcStatus}`}>
  {grpcStatus === 'connected' && '🟢 Connected'}
  {grpcStatus === 'reconnecting' && '🟡 Reconnecting...'}
  {grpcStatus === 'disconnected' && '🔴 Disconnected'}
</div>
```

**Acceptance Criteria:**
- [ ] Auto-reconnects on network failure
- [ ] Exponential backoff (1s, 2s, 4s, 8s, 16s, 30s)
- [ ] Max 5 reconnection attempts
- [ ] Connection status shown in UI
- [ ] Queued audio sent after reconnection

---

## Testing Plan

### Unit Tests

**File:** `gnani-rnd-backend/tests/unit/session-manager.test.ts`

```typescript
describe('SessionManager - Audio Buffer', () => {
  it('should prevent buffer overflow', async () => {
    const manager = new SessionManager();
    const sessionId = await manager.startSession('user123', mockCallback);
    
    // Send 15MB of audio (exceeds 10MB limit)
    const chunk = Buffer.alloc(1024 * 1024); // 1MB chunks
    for (let i = 0; i < 15; i++) {
      await manager.appendAudioChunk(sessionId, chunk, 16000);
    }
    
    const stats = manager.getBufferStats(sessionId);
    expect(stats.size).toBeLessThan(10 * 1024 * 1024);
  });
  
  it('should auto-flush on overflow', async () => {
    const manager = new SessionManager();
    const sessionId = await manager.startSession('user123', mockCallback);
    
    const chunk = Buffer.alloc(11 * 1024 * 1024); // 11MB
    await manager.appendAudioChunk(sessionId, chunk, 16000);
    
    // Should have triggered flush
    expect(mockCallback).toHaveBeenCalled();
  });
});
```

### Integration Tests

**File:** `gnani-rnd-backend/tests/integration/audio-pipeline.test.ts`

```typescript
describe('Audio Pipeline Integration', () => {
  it('should handle 1-hour continuous recording', async () => {
    const duration = 60 * 60 * 1000; // 1 hour
    const startTime = Date.now();
    
    while (Date.now() - startTime < duration) {
      const audioChunk = generateTestAudio(1000); // 1s of audio
      await sendAudioToBackend(audioChunk);
      await sleep(1000);
    }
    
    // Should not crash
    expect(isBackendRunning()).toBe(true);
  });
});
```

### Manual Testing Checklist

- [ ] Record for 1 hour continuously - no crashes
- [ ] Disconnect WiFi during recording - auto-reconnects
- [ ] Test in noisy environment - VAD adapts
- [ ] Monitor memory usage - stays under 500MB
- [ ] Check logs - no errors

---

## Setup Scripts

**File:** `gnani-rnd-backend/scripts/setup-audio-pipeline.sh`

```bash
#!/bin/bash

echo "Setting up Audio Pipeline improvements..."

# Install testing dependencies
npm install --save-dev @types/jest jest ts-jest

# Create test directories
mkdir -p tests/unit
mkdir -p tests/integration

# Run initial tests
npm test

echo "Audio Pipeline setup complete!"
```

---

## Rollback Plan

If issues occur:

1. **Revert VAD Changes:**
   ```bash
   git checkout HEAD -- electron/modules/vad-manager.js
   ```

2. **Revert Buffer Protection:**
   ```bash
   git checkout HEAD -- gnani-rnd-backend/src/modules/session/session.manager.ts
   ```

3. **Revert gRPC Client:**
   ```bash
   git checkout HEAD -- electron/modules/grpc-client.js
   ```

---

## Success Metrics

- ✅ 0 crashes in 1-hour recording test
- ✅ VAD false positives reduced by 80%
- ✅ gRPC reconnects within 5 seconds
- ✅ Memory usage stays under 500MB
- ✅ All unit tests passing
- ✅ All integration tests passing

---

## Next Stage

After completing this stage, proceed to:
**Stage 1.2: Session Manager Refactoring**
