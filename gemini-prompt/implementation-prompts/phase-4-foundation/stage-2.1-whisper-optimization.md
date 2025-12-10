# Stage 2.1: Whisper Optimization

**Duration:** 2 weeks  
**Goal:** Reduce STT latency from 500ms to 300ms while maintaining 95% accuracy

---

## Context

Current Whisper setup uses the medium model with 500ms latency. For a voice-first assistant, this feels laggy. We need to optimize without sacrificing accuracy.

**Current:** Whisper Medium (500ms, 95% accuracy)  
**Target:** Whisper Turbo (300ms, 95% accuracy)

---

## Objectives

1. Upgrade to Whisper Turbo model
2. Implement batch processing for audio chunks
3. Add GPU acceleration (if available)
4. Optimize Python process communication
5. Add latency monitoring

---

## Implementation Tasks

### Task 1: Upgrade to Whisper Turbo

**File:** `gnani-rnd-backend/scripts/shell/whisper_runner.py`

Update to use Whisper Turbo:

```python
import whisper
import sys
import json

# Load Whisper Turbo model (faster than medium, same accuracy)
model = whisper.load_model("turbo")

# Optimize for speed
options = {
    "fp16": True,  # Use half-precision for 2x speedup
    "language": "en",  # Specify language to skip detection
    "task": "transcribe",
    "beam_size": 1,  # Faster beam search
    "best_of": 1  # Don't generate multiple candidates
}

def transcribe_audio(audio_path):
    result = model.transcribe(audio_path, **options)
    return result["text"]

# ... rest of the code
```

**Update `.env`:**
```bash
WHISPER_MODEL=turbo  # Changed from medium
WHISPER_COMPUTE_TYPE=float16  # Use half-precision
```

---

### Task 2: Implement Batch Processing

**File:** `gnani-rnd-backend/src/modules/asr/whisper.service.ts`

Add batch processing to reduce overhead:

```typescript
class WhisperService {
  private audioBatch: Buffer[] = [];
  private batchTimeout: NodeJS.Timeout | null = null;
  private readonly BATCH_SIZE = 3; // Process 3 chunks together
  private readonly BATCH_TIMEOUT_MS = 100; // Max wait time
  
  sendAudioChunk(sessionId: string, audioChunk: Buffer, callback: Function) {
    this.audioBatch.push(audioChunk);
    
    // Process batch if size reached
    if (this.audioBatch.length >= this.BATCH_SIZE) {
      this.processBatch(sessionId, callback);
    } else {
      // Set timeout to process partial batch
      if (this.batchTimeout) clearTimeout(this.batchTimeout);
      this.batchTimeout = setTimeout(() => {
        this.processBatch(sessionId, callback);
      }, this.BATCH_TIMEOUT_MS);
    }
  }
  
  private processBatch(sessionId: string, callback: Function) {
    if (this.audioBatch.length === 0) return;
    
    // Combine audio chunks
    const combinedAudio = Buffer.concat(this.audioBatch);
    this.audioBatch = [];
    
    // Send to Whisper
    this.processAudio(sessionId, combinedAudio, callback);
  }
}
```

---

### Task 3: Add GPU Acceleration

**File:** `gnani-rnd-backend/scripts/setup-whisper-gpu.sh`

```bash
#!/bin/bash

echo "Setting up Whisper GPU acceleration..."

# Check if CUDA is available
if command -v nvidia-smi &> /dev/null; then
  echo "✅ NVIDIA GPU detected"
  
  # Install CUDA-enabled PyTorch
  ./.venv/bin/pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
  
  # Update .env
  echo "WHISPER_DEVICE=cuda" >> .env
  echo "✅ GPU acceleration enabled"
else
  echo "⚠️  No NVIDIA GPU detected, using CPU"
  echo "WHISPER_DEVICE=cpu" >> .env
fi
```

**Update `whisper_runner.py`:**
```python
import torch

# Use GPU if available
device = "cuda" if torch.cuda.is_available() else "cpu"
model = whisper.load_model("turbo", device=device)
```

---

### Task 4: Add Latency Monitoring

**File:** `gnani-rnd-backend/src/modules/asr/whisper.service.ts`

Add performance tracking:

```typescript
import { metrics } from '../../core/monitoring/metrics.js';

class WhisperService {
  async processAudio(sessionId: string, audioChunk: Buffer, callback: Function) {
    const startTime = Date.now();
    
    try {
      // ... existing processing logic
      
      const latency = Date.now() - startTime;
      
      // Record metrics
      metrics.whisperLatency.observe(latency);
      
      if (latency > 400) {
        logger.warn('Whisper latency high', { sessionId, latency });
      }
      
    } catch (error) {
      metrics.whisperErrors.inc();
      throw error;
    }
  }
}
```

**File:** `gnani-rnd-backend/src/core/monitoring/metrics.ts`

Add Whisper metrics:

```typescript
export class Metrics {
  public whisperLatency: client.Histogram;
  public whisperErrors: client.Counter;
  
  constructor() {
    this.whisperLatency = new client.Histogram({
      name: 'gnani_whisper_latency_ms',
      help: 'Whisper STT latency in milliseconds',
      buckets: [50, 100, 200, 300, 400, 500, 1000]
    });
    
    this.whisperErrors = new client.Counter({
      name: 'gnani_whisper_errors_total',
      help: 'Total Whisper errors'
    });
  }
}
```

---

## Setup Scripts

**File:** `gnani-rnd-backend/scripts/setup-whisper-optimization.sh`

```bash
#!/bin/bash

echo "Optimizing Whisper STT..."

# Activate virtual environment
source .venv/bin/activate

# Upgrade to Whisper Turbo
pip install --upgrade openai-whisper

# Download Turbo model
python -c "import whisper; whisper.load_model('turbo')"

# Setup GPU if available
./scripts/setup-whisper-gpu.sh

# Update environment
sed -i 's/WHISPER_MODEL=.*/WHISPER_MODEL=turbo/' .env
sed -i 's/WHISPER_COMPUTE_TYPE=.*/WHISPER_COMPUTE_TYPE=float16/' .env

echo "✅ Whisper optimization complete!"
```

---

## Verification Steps

1. **Run setup:**
   ```bash
   cd gnani-rnd-backend
   ./scripts/setup-whisper-optimization.sh
   ```

2. **Test latency:**
   ```bash
   # Start backend
   npm run dev
   
   # In another terminal, measure latency
   node tests/integration/measure_stt_latency.js
   ```

3. **Check metrics:**
   ```bash
   curl http://localhost:3000/metrics | grep whisper_latency
   ```

---

## Success Criteria

- [ ] Whisper Turbo model installed
- [ ] Batch processing implemented
- [ ] GPU acceleration enabled (if GPU available)
- [ ] Latency monitoring added
- [ ] Average latency <300ms
- [ ] Accuracy maintained at 95%
- [ ] Setup script created and tested

---

## Next Stage

Proceed to [Stage 2.2 - Task Queue Implementation](./stage-2.2-task-queue.md)
