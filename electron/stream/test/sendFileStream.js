// electron/stream/test/sendFileStream.js
const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');
const StreamingClient = require('../client'); // The main client abstraction
const { concatPcmBuffers } = require('../../vad/utils/pcmUtils'); // Assuming this utility is available

const logger = require('../../utils/logger');
const { v4: uuidv4 } = require('uuid');

// Mock VAD Manager for testing purposes
class MockVadManager extends EventEmitter {
  constructor(sampleRate = 16000, frameSize = 480) { // 30ms frame at 16kHz
    super();
    this.config = { sampleRate, frameSize };
    this.isRunning = false;
    logger.info('MockVadManager initialized for sendFileStream.');
  }

  startVAD() {
    this.isRunning = true;
    logger.debug('MockVadManager: VAD started.');
  }

  stopVAD() {
    this.isRunning = false;
    logger.debug('MockVadManager: VAD stopped.');
  }

  // Simulate emitting audio:chunk events similar to real VAD
  emitAudioChunk(pcmBuffer, segmentId) {
    if (this.isRunning) {
      this.emit('audio:chunk', {
        id: segmentId,
        timestamp: new Date().toISOString(),
        sampleRate: this.config.sampleRate,
        channels: 1,
        pcm: pcmBuffer.toString('base64'),
        durationMs: (pcmBuffer.length / 2 / this.config.sampleRate) * 1000,
      });
      logger.debug(`MockVadManager emitted audio:chunk for segment ${segmentId}, size: ${pcmBuffer.length}`);
    }
  }

  emitAudioEnded() {
    if (this.isRunning) {
      this.emit('audio:ended');
      logger.debug('MockVadManager emitted audio:ended.');
    }
  }
}

/**
 * Simulates streaming a WAV file by feeding its PCM data to the StreamingClient
 * via a mock VAD Manager.
 * @param {string} wavFilePath - Path to the WAV file.
 * @param {object} streamOptions - Options for the StreamingClient.
 */
async function sendFileStream(wavFilePath, streamOptions = {}) {
  logger.info(`Starting file stream test for ${wavFilePath}`);

  const mockVadManager = new MockVadManager(streamOptions.sampleRate || 16000);
  const streamingClient = new StreamingClient();
  streamingClient.init(streamOptions);

  // Manually link VAD -> StreamingClient for this test
  mockVadManager.on('audio:chunk', (payload) => {
    const pcmBuffer = Buffer.from(payload.pcm, 'base64');
    streamingClient.addAudioFrame(pcmBuffer, payload.id);
  });
  mockVadManager.on('audio:ended', () => {
    streamingClient.stopAudioStreaming();
  });

  // Attach event listeners for output
  streamingClient.on('stream:connected', () => logger.info('Test: Stream connected.'));
  streamingClient.on('stream:disconnected', () => logger.info('Test: Stream disconnected.'));
  streamingClient.on('stream:partial', (p) => logger.info(`Test: Partial: ${p.text}`));
  streamingClient.on('stream:final', (f) => logger.info(`Test: Final: ${f.text}`));
  streamingClient.on('stream:tts_chunk', (t) => logger.info(`Test: TTS Chunk (size: ${t.pcm_base64.length})`));
  streamingClient.on('stream:error', (e) => logger.error('Test: Stream Error:', e));
  streamingClient.on('stream:metrics', (m) => logger.debug('Test: Metrics:', m));

  await streamingClient.connect();
  streamingClient.startAudioStreaming();
  mockVadManager.startVAD();

  const buffer = fs.readFileSync(wavFilePath);
  // Assuming a WAV file with header, skip it for raw PCM
  const pcmData = buffer.slice(44);

  const sampleRate = mockVadManager.config.sampleRate;
  const frameSizeBytes = mockVadManager.config.frameSize * 2; // 16-bit PCM

  let currentSegmentId = uuidv4();
  let bufferedFrames = [];
  let bufferedFramesSize = 0;
  const chunkLengthMs = streamingClient.options.chunkMs; // From client config
  const framesPerChunk = Math.floor((sampleRate / 1000) * chunkLengthMs);
  const bytesPerChunk = framesPerChunk * 2;

  logger.info(`Processing WAV file. Sample rate: ${sampleRate}, Bytes per simulated network chunk: ${bytesPerChunk}`);

  for (let i = 0; i < pcmData.length; i += frameSizeBytes) {
    const frame = pcmData.slice(i, i + frameSizeBytes);
    if (frame.length === frameSizeBytes) {
      bufferedFrames.push(frame);
      bufferedFramesSize += frame.length;

      if (bufferedFramesSize >= bytesPerChunk) {
        const chunkBuffer = concatPcmBuffers(bufferedFrames);
        mockVadManager.emitAudioChunk(chunkBuffer, currentSegmentId);
        bufferedFrames = [];
        bufferedFramesSize = 0;
      }
      await new Promise(resolve => setTimeout(resolve, 30)); // Simulate 30ms frame interval
    }
  }

  // Emit any remaining buffered frames as a final chunk for the segment
  if (bufferedFrames.length > 0) {
    const finalChunkBuffer = concatPcmBuffers(bufferedFrames);
    mockVadManager.emitAudioChunk(finalChunkBuffer, currentSegmentId);
  }
  
  mockVadManager.emitAudioEnded(); // Signal end of speech for VAD
  
  // Give some time for final messages to be processed
  await new Promise(resolve => setTimeout(resolve, 2000)); 

  streamingClient.disconnect();
  streamingClient.cleanup();
  mockVadManager.stopVAD();
  logger.info('File stream test finished.');
}

// Example usage:
// if (require.main === module) {
//   // Make sure to create a dummy.wav or provide a real path
//   // You can use sox to create a 16kHz, 16-bit mono WAV:
//   // sox -n dummy_speech.wav synth 3 sine 440-660 vol 0.5 rate 16k channels 1
//   const testWavPath = path.join(__dirname, 'dummy_speech.wav'); 
//   if (!fs.existsSync(testWavPath)) {
//     logger.warn(`Test WAV file not found at ${testWavPath}. Please create one.`);
//     // Optionally create a silent one like in playbackTest.js if you don't have one.
//   } else {
//     sendFileStream(testWavPath, {
//       endpoint: 'ws://localhost:8080', // Or your actual test server
//       apiKey: 'TEST_API_KEY',
//       // other options as needed
//     });
//   }
// }

module.exports = sendFileStream;
