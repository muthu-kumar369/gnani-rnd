# Stage 30: Custom Wake Words

## Overview
Integrate Porcupine for custom wake word training and detection.

## Implementation Steps

### Step 1: Install Porcupine
```bash
npm install @picovoice/porcupine-node
```

### Step 2: Initialize Porcupine
```typescript
import { Porcupine } from '@picovoice/porcupine-node';

const porcupine = new Porcupine(
  accessKey,
  ['/path/to/custom_wake_word.ppn'],
  [0.5] // sensitivity
);
```

### Step 3: Process Audio for Wake Word
```typescript
const processAudioForWakeWord = (audioFrame: Int16Array) => {
  const keywordIndex = porcupine.process(audioFrame);
  
  if (keywordIndex !== -1) {
    console.log('Wake word detected!');
    window.dispatchEvent(new CustomEvent('wake-word-detected'));
  }
};
```

### Step 4: Wake Word Training UI
```tsx
const WakeWordTrainer = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [samples, setSamples] = useState([]);
  
  const recordSample = async () => {
    setIsRecording(true);
    const audio = await recordAudio(3000); // 3 seconds
    setSamples([...samples, audio]);
    setIsRecording(false);
  };
  
  const trainWakeWord = async () => {
    const model = await trainPorcupineModel(samples);
    await saveWakeWordModel(model);
  };
  
  return (
    <div>
      <h3>Train Your Wake Word</h3>
      <p>Record your wake word 5 times</p>
      
      <button onClick={recordSample} disabled={isRecording}>
        {isRecording ? 'Recording...' : `Record Sample ${samples.length + 1}/5`}
      </button>
      
      {samples.length >= 5 && (
        <button onClick={trainWakeWord}>
          Train Model
        </button>
      )}
    </div>
  );
};
```

### Step 5: Wake Word Settings
```tsx
const WakeWordSettings = () => {
  const [wakeWords, setWakeWords] = useState([]);
  const [selectedWakeWord, setSelectedWakeWord] = useState('');
  
  return (
    <div>
      <h3>Wake Word Settings</h3>
      
      <select
        value={selectedWakeWord}
        onChange={(e) => setSelectedWakeWord(e.target.value)}
      >
        <option value="hey-gnani">Hey Gnani (Default)</option>
        {wakeWords.map(ww => (
          <option key={ww.id} value={ww.id}>{ww.name}</option>
        ))}
      </select>
      
      <button onClick={() => openWakeWordTrainer()}>
        Create Custom Wake Word
      </button>
      
      <div className="mt-4">
        <label>Sensitivity</label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          defaultValue="0.5"
        />
      </div>
    </div>
  );
};
```

## Success Criteria
- ✅ Porcupine integrated successfully
- ✅ Custom wake words can be trained
- ✅ Wake word detection works reliably
- ✅ Multiple wake words supported
- ✅ Sensitivity adjustable

## Estimated Time: 10 hours
