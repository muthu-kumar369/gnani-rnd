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
      console.log(`[MockRenderer] IPC SEND: ${channel}`, JSON.stringify(args, null, 2));
    },
    isDestroyed: () => false,
  },
};

async function runTest() {
  console.log('--- Gnani StreamingClient Manual Verification (ESM) ---');
  
  // Read the real config file directly
  const configPath = path.join('C:', 'Users', 'muthu', 'AppData', 'Roaming', 'gnani', 'config.json');
  console.log(`Reading config from: ${configPath}`);
  
  let config = {};
  try {
    if (fs.existsSync(configPath)) {
      const rawData = fs.readFileSync(configPath);
      config = JSON.parse(rawData);
    } else {
      console.error(`Config file not found at ${configPath}`);
    }
  } catch (err) {
    console.error(`Error reading config file: ${err.message}`);
  }

  const accessToken = config.accessToken;
  const userId = config.userId;

  const streamingClient = new StreamingClient({
    mainWindow: mockMainWindow,
    store: store,
    callRefreshTokenApiFromMain: async (refreshToken) => {
      console.log(`[MOCK] callRefreshTokenApiFromMain called (should not be needed if token is valid)`);
      return { accessToken, refreshToken };
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
  streamingClient.on('stream:llm_chunk', (payload) => {
      console.log(`[DATA] LLM Chunk received:`, payload);
      if (payload.chunk && payload.chunk.type === 'complete_response') {
          console.log(`[SUCCESS] COMPLETE RESPONSE RECEIVED:`, payload.chunk.text);
      }
  });
  streamingClient.on('stream:error', (payload) => {
    console.error(`[ERROR] Stream Error: ${payload.message}`);
    testFailed = true;
  });

  try {
    console.log('Attempting to start audio streaming...');
    await streamingClient.startAudioStreaming();
    
    console.log('Audio streaming started successfully.');

    // Look for speech_test.wav in project root
    const audioFilePath = path.resolve(__dirname, '../../../speech_test.wav');
    
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

    // Wait for response
    console.log('Waiting for LLM response...');
    await new Promise(resolve => setTimeout(resolve, 10000));

    console.log('Stopping audio streaming...');
    streamingClient.stopAudioStreaming();
    
  } catch (error) {
    console.error('!!! TEST FAILED !!!');
    console.error(error);
    testFailed = true;
  } finally {
    console.log('Disconnecting client...');
    streamingClient.disconnect();
    
    if (testFailed) {
        console.error('\n--- Test finished with ERRORS. ---');
        process.exit(1);
    } else {
        console.log('\n--- Test finished SUCCESSFULLY. ---');
        process.exit(0);
    }
  }
}

runTest();
