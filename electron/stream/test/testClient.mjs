process.env.GRPC_VERBOSITY = 'DEBUG';
process.env.GRPC_TRACE = 'all';

import fs from 'fs';
import path from 'path';
import Store from 'electron-store';
import StreamingClient from '../client.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const mockMainWindow = {
  webContents: {
    send: (channel, ...args) => {
      console.log(`[MockRenderer] IPC SEND: ${channel}`, ...args);
    },
    isDestroyed: () => false,
  },
};

async function runTest() {
  console.log('--- Gnani StreamingClient Standalone Test (ESM) ---');
  const store = new Store({ name: 'standalone-client-test-esm' });
  store.clear();
  store.set('accessToken', 'your-valid-access-token');
  store.set('refreshToken', 'your-valid-refresh-token');
  console.log('Mock tokens set in test store.');

  const streamingClient = new StreamingClient({
    mainWindow: mockMainWindow,
    store: store,
    callRefreshTokenApiFromMain: async (refreshToken) => {
      console.log(`[MOCK] callRefreshTokenApiFromMain called with: ${refreshToken}`);
      return {
        accessToken: 'mock-refreshed-access-token',
        refreshToken: 'mock-refreshed-refresh-token',
      };
    },
  });

  let testFailed = false;
  streamingClient.on('stream:connected', (payload) => {
    console.log(`[SUCCESS] Stream connected with session ID: ${payload.sessionId}`);
  });
  streamingClient.on('stream:disconnected', () => {
    console.log('[INFO] Stream disconnected.');
  });
  streamingClient.on('stream:partial', (payload) => {
    console.log(`[DATA] Partial Transcript: "${payload.text}"`);
  });
  streamingClient.on('stream:final', (payload) => {
    console.log(`[DATA] Final Transcript: "${payload.text}"`);
  });
  streamingClient.on('stream:error', (payload) => {
    console.error(`[ERROR] Stream Error: ${payload.message}`);
    testFailed = true;
  });
  streamingClient.on('stream:tts_chunk', (payload) => {
    console.log(`[DATA] Received TTS chunk.`);
  });

  try {
    console.log('Attempting to start audio streaming...');
    await streamingClient.startAudioStreaming();
    if (testFailed) throw new Error("Failed to start stream due to connection error.");

    console.log('Audio streaming started successfully.');

    const audioFilePath = path.join(__dirname, '../../../speech_test.wav');
    if (!fs.existsSync(audioFilePath)) {
      throw new Error(`Test audio file not found at: ${audioFilePath}`);
    }
    console.log(`Streaming audio file: ${audioFilePath}`);
    const audioBuffer = fs.readFileSync(audioFilePath);
    const pcmData = audioBuffer.slice(44);

    const chunkSize = 3200;
    let offset = 0;

    while (offset < pcmData.length) {
      const chunk = pcmData.slice(offset, offset + chunkSize);
      const isLast = (offset + chunkSize) >= pcmData.length;
      streamingClient.addAudioFrame(chunk, isLast);
      offset += chunkSize;
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    console.log('Finished sending all audio chunks.');

    console.log('Stopping audio streaming...');
    streamingClient.stopAudioStreaming();
    
    await new Promise(resolve => setTimeout(resolve, 2000));

  } catch (error) {
    console.error('!!! TEST FAILED !!!');
    console.error(error.message);
    testFailed = true;
  } finally {
    console.log('Disconnecting client...');
    streamingClient.disconnect();
    store.clear();
    console.log('Test store cleared.');
    
    if (testFailed) {
        console.error('\n--- Test finished with ERRORS. ---');
        process.exit(1);
    } else {
        console.log('\n--- Test finished SUCCESSFULLY. ---');
    }
  }
}

runTest();
