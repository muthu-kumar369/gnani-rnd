// electron/vad/test/playbackTest.js
const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');
const VadManager = require('../vadManager');
const logger = require('../../utils/logger');

// Mock MicCapture for testing purposes
class MockMicCapture extends EventEmitter {
  constructor() {
    super();
    this.isRecording = false;
  }
  startMicrophone() { this.isRecording = true; logger.info('MockMicCapture started.'); }
  stopMicrophone() { this.isRecording = false; logger.info('MockMicCapture stopped.'); }
  getIsRecording() { return this.isRecording; }
}

async function runPlaybackTest(wavFilePath) {
  logger.info(`Starting VAD playback test with: ${wavFilePath}`);

  const mockMicCapture = new MockMicCapture();
  const vadManager = new VadManager(mockMicCapture);

  // Suppress console output for events to avoid clutter during test
  // In a real test, you'd assert these events
  vadManager.on('audio:listening', (isListening) => logger.debug(`Test: audio:listening -> ${isListening}`));
  vadManager.on('audio:chunk', (payload) => logger.info(`Test: audio:chunk (ID: ${payload.id}, Duration: ${payload.durationMs}ms, Size: ${payload.pcm.length} bytes)`));
  vadManager.on('audio:ended', () => logger.debug('Test: audio:ended'));
  vadManager.on('vad:status', (status) => logger.debug(`Test: vad:status -> ${JSON.stringify(status)}`));

  await vadManager.init();
  vadManager.startVAD();
  mockMicCapture.startMicrophone();

  const buffer = fs.readFileSync(wavFilePath);
  // Assuming a WAV file with header, we need to skip it to get raw PCM
  // This is a simplification; a proper WAV parser would be needed for robustness.
  const pcmData = buffer.slice(44); // Skip typical 44-byte WAV header

  const sampleRate = vadManager.config.sampleRate; // Expect 16000
  const frameSizeSamples = vadManager.config.frameSize; // Expect 480 samples (30ms at 16kHz)
  const frameSizeBytes = frameSizeSamples * 2; // 16-bit PCM = 2 bytes per sample

  logger.info(`Feeding WAV file into VAD. Sample rate: ${sampleRate}, Frame size: ${frameSizeBytes} bytes`);

  for (let i = 0; i < pcmData.length; i += frameSizeBytes) {
    const frame = pcmData.slice(i, i + frameSizeBytes);
    if (frame.length === frameSizeBytes) {
      mockMicCapture.emit('audio-frame', frame);
      await new Promise(resolve => setTimeout(resolve, 30)); // Simulate real-time 30ms frame interval
    }
  }

  // Give VAD some time to process any remaining buffers/hangover
  await new Promise(resolve => setTimeout(resolve, 500)); 

  vadManager.stopVAD();
  mockMicCapture.stopMicrophone();
  vadManager.cleanup();
  logger.info('VAD playback test finished.');
}

// Example usage:
// if (require.main === module) {
//   // Create a dummy WAV file for testing if it doesn't exist
//   const dummyWavPath = path.join(__dirname, 'dummy.wav');
//   if (!fs.existsSync(dummyWavPath)) {
//     logger.warn('Dummy WAV file not found. Create a 16kHz, 16-bit mono WAV file for testing.');
//     logger.warn('You can use sox: `sox -n dummy.wav synth 1 sine 440 gain -6 rate 16k channels 1`');
//     // Create a silent dummy WAV for now
//     const silentWavBuffer = Buffer.alloc(16000 * 2 * 1 + 44, 0); // 1 second silent 16k 16bit mono + header
//     // Fill in basic WAV header (very minimal, likely incomplete)
//     silentWavBuffer.write('RIFF', 0);
//     silentWavBuffer.writeUInt32LE(silentWavBuffer.length - 8, 4);
//     silentWavBuffer.write('WAVE', 8);
//     silentWavBuffer.write('fmt ', 12);
//     silentWavBuffer.writeUInt32LE(16, 16); // subchunk1 size
//     silentWavBuffer.writeUInt16LE(1, 20); // audio format (PCM)
//     silentWavBuffer.writeUInt16LE(1, 22); // num channels
//     silentWavBuffer.writeUInt32LE(16000, 24); // sample rate
//     silentWavBuffer.writeUInt32LE(16000 * 2 * 1, 28); // byte rate
//     silentWavBuffer.writeUInt16LE(2, 32); // block align
//     silentWavBuffer.writeUInt16LE(16, 34); // bits per sample
//     silentWavBuffer.write('data', 36);
//     silentWavBuffer.writeUInt32LE(silentWavBuffer.length - 44, 40); // data size
//     fs.writeFileSync(dummyWavPath, silentWavBuffer);
//     logger.info(`Created a 1-second silent dummy WAV at: ${dummyWavPath}`);
//   }

//   runPlaybackTest(dummyWavPath);
// }

module.exports = runPlaybackTest;
