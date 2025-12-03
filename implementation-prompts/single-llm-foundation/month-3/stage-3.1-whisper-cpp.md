# Stage 3.1: Whisper.cpp Integration

**Duration:** Week 9-10 (10 working days)  
**Priority:** 🔴 Critical  
**Dependencies:** Month 1 & 2 Complete

---

## Overview

Replace Python Whisper with whisper.cpp for 3x faster STT performance (<100ms latency). This requires system-level setup across multiple development machines.

## Goals

1. Install and compile whisper.cpp
2. Integrate with Node.js backend
3. Achieve <100ms STT latency
4. Maintain backward compatibility

## System Setup Script

**File:** `gnani-rnd-backend/scripts/setup-whisper-cpp.sh`

```bash
#!/bin/bash

echo "========================================="
echo "Whisper.cpp Setup Script"
echo "========================================="

# Check OS
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="linux"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    OS="mac"
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    OS="windows"
else
    echo "Unsupported OS: $OSTYPE"
    exit 1
fi

echo "Detected OS: $OS"

# Install dependencies
echo "Installing dependencies..."

if [ "$OS" == "linux" ]; then
    sudo apt-get update
    sudo apt-get install -y build-essential git cmake
elif [ "$OS" == "mac" ]; then
    brew install cmake
fi

# Clone whisper.cpp
echo "Cloning whisper.cpp..."
cd /tmp
git clone https://github.com/ggerganov/whisper.cpp.git
cd whisper.cpp

# Compile
echo "Compiling whisper.cpp..."
make

# Download model
echo "Downloading Whisper base.en model..."
bash ./models/download-ggml-model.sh base.en

# Copy to project
echo "Installing to project..."
INSTALL_DIR="$HOME/.gnani/whisper-cpp"
mkdir -p $INSTALL_DIR
cp main $INSTALL_DIR/
cp -r models $INSTALL_DIR/

echo "========================================="
echo "Whisper.cpp installed successfully!"
echo "Location: $INSTALL_DIR"
echo "========================================="

# Test
echo "Testing whisper.cpp..."
$INSTALL_DIR/main -m $INSTALL_DIR/models/ggml-base.en.bin -f samples/jfk.wav

echo "Setup complete!"
```

## Integration Code

**File:** `gnani-rnd-backend/src/modules/asr/whisper-cpp.service.ts`

```typescript
import { spawn } from 'child_process';
import { createContextualLogger } from '../../core/logger/logger.js';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export class WhisperCppService {
  private logger = createContextualLogger({ module: 'WhisperCppService' });
  private whisperPath: string;
  private modelPath: string;

  constructor() {
    const homeDir = os.homedir();
    this.whisperPath = path.join(homeDir, '.gnani', 'whisper-cpp', 'main');
    this.modelPath = path.join(homeDir, '.gnani', 'whisper-cpp', 'models', 'ggml-base.en.bin');
    
    this.verifyInstallation();
  }

  private verifyInstallation(): void {
    if (!fs.existsSync(this.whisperPath)) {
      throw new Error(`Whisper.cpp not found at ${this.whisperPath}. Run setup script.`);
    }
    if (!fs.existsSync(this.modelPath)) {
      throw new Error(`Model not found at ${this.modelPath}. Run setup script.`);
    }
  }

  async transcribe(audioBuffer: Buffer): Promise<string> {
    // Save audio to temp file
    const tempFile = path.join(os.tmpdir(), `audio-${Date.now()}.wav`);
    fs.writeFileSync(tempFile, audioBuffer);

    return new Promise((resolve, reject) => {
      const whisper = spawn(this.whisperPath, [
        '-m', this.modelPath,
        '-f', tempFile,
        '-nt' // No timestamps
      ]);

      let output = '';
      let error = '';

      whisper.stdout.on('data', (data) => {
        output += data.toString();
      });

      whisper.stderr.on('data', (data) => {
        error += data.toString();
      });

      whisper.on('close', (code) => {
        // Cleanup temp file
        fs.unlinkSync(tempFile);

        if (code === 0) {
          const transcript = this.parseOutput(output);
          resolve(transcript);
        } else {
          reject(new Error(`Whisper failed: ${error}`));
        }
      });
    });
  }

  private parseOutput(output: string): string {
    // Extract transcript from whisper.cpp output
    const lines = output.split('\n');
    const transcriptLine = lines.find(line => line.includes('['));
    
    if (transcriptLine) {
      return transcriptLine.replace(/\[.*?\]/g, '').trim();
    }
    
    return '';
  }
}

export default new WhisperCppService();
```

## Success Metrics

- ✅ Whisper.cpp installed on all dev machines
- ✅ STT latency < 100ms
- ✅ Accuracy maintained (>95%)
- ✅ All tests passing

---

**Next:** Stage 3.2 - LLM & Tool Caching
