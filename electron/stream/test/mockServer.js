// electron/stream/test/mockServer.js
const WebSocket = require('ws');
const logger = require('../../utils/logger');
const StreamSerializer = require('../serializer'); // Assuming StreamSerializer is general enough

class MockWebSocketServer {
  constructor(port = 8080) {
    this.port = port;
    this.wss = null;
    this.serializer = new StreamSerializer();
    this.connectedClients = new Set();
    this.messageCount = 0;
    this.transcripts = [
      "Hello there, how can I help you today?",
      "The weather is quite nice, isn't it?",
      "I'm a mock server, providing simulated responses.",
      "This is a test of the streaming functionality."
    ];
    this.ttsAudioChunks = [
      Buffer.from('Mock TTS Audio Chunk 1', 'utf8'),
      Buffer.from('Mock TTS Audio Chunk 2', 'utf8'),
      Buffer.from('Mock TTS Audio Chunk 3', 'utf8')
    ];
    logger.info(`MockWebSocketServer initialized on port ${port}.`);
  }

  start() {
    this.wss = new WebSocket.Server({ port: this.port });

    this.wss.on('listening', () => {
      logger.info(`Mock WebSocket Server started on ws://localhost:${this.port}`);
    });

    this.wss.on('connection', (ws) => {
      const clientId = Math.random().toString(36).substring(7);
      this.connectedClients.add(ws);
      logger.info(`Client ${clientId} connected. Total clients: ${this.connectedClients.size}`);

      ws.on('message', (message) => this._handleMessage(ws, message, clientId));
      ws.on('close', () => this._handleClose(ws, clientId));
      ws.on('error', (error) => this._handleError(ws, error, clientId));
      ws.on('pong', () => logger.debug(`Client ${clientId} ponged.`));

      // Send initial welcome message
      ws.send(this.serializer.encodeControlMessage({
        type: 'meta',
        event: 'welcome',
        message: 'Welcome to the Mock Streaming Server!',
      }));
    });

    this.wss.on('error', (error) => {
      logger.error('Mock WebSocket Server error:', error);
    });
  }

  _handleMessage(ws, message, clientId) {
    this.messageCount++;
    logger.debug(`Client ${clientId} received message type: ${typeof message}, size: ${message.length || message.byteLength}. Total messages: ${this.messageCount}`);

    const decoded = this.serializer.decodeIncomingMessage(message);

    if (decoded && decoded.type) {
      if (decoded.type === 'meta') {
        if (decoded.event === 'start_segment') {
          logger.info(`Client ${clientId} started segment: ${decoded.segment_id}`);
          this._simulateResponse(ws, decoded.segment_id);
        } else if (decoded.event === 'end_segment') {
          logger.info(`Client ${clientId} ended segment: ${decoded.segment_id}`);
          // Send final transcript after segment ends
          ws.send(this.serializer.encodeControlMessage({
            type: 'transcript.final',
            segment_id: decoded.segment_id,
            text: this.transcripts[Math.floor(Math.random() * this.transcripts.length)],
            timestamp: new Date().toISOString(),
          }));
        } else if (decoded.event === 'session_start') {
          logger.info(`Client ${clientId} session started: ${decoded.session_id}. Client meta: ${JSON.stringify(decoded.client_meta)}`);
        }
      }
    } else if (Buffer.isBuffer(message)) {
      // Treat as raw audio frames
      logger.debug(`Client ${clientId} sent ${message.length} bytes of audio.`);
      // Optionally process audio frames, e.g., accumulate for a mock transcript
    } else {
      logger.warn(`Client ${clientId} sent unknown message:`, decoded);
    }
  }

  _simulateResponse(ws, segmentId) {
    // Simulate partial transcripts
    let partialText = '';
    const words = this.transcripts[Math.floor(Math.random() * this.transcripts.length)].split(' ');
    let wordIndex = 0;

    const partialInterval = setInterval(() => {
      if (wordIndex < words.length) {
        partialText += (wordIndex > 0 ? ' ' : '') + words[wordIndex];
        ws.send(this.serializer.encodeControlMessage({
          type: 'transcript.partial',
          segment_id: segmentId,
          text: partialText,
          tokens: words.slice(0, wordIndex + 1),
          timestamp: new Date().toISOString(),
        }));
        wordIndex++;
      } else {
        clearInterval(partialInterval);
        // Simulate sending TTS chunks after a short delay
        this._simulateTtsChunks(ws, segmentId);
      }
    }, 200 + Math.random() * 100); // Send partial every 200-300ms
  }

  _simulateTtsChunks(ws, segmentId) {
    let chunkIndex = 0;
    const ttsInterval = setInterval(() => {
      if (chunkIndex < this.ttsAudioChunks.length) {
        const ttsChunk = this.ttsAudioChunks[chunkIndex];
        ws.send(this.serializer.encodeControlMessage({
          type: 'tts.chunk',
          segment_id: segmentId,
          audio: ttsChunk.toString('base64'),
          format: 'pcm_s16le',
          sampleRate: 16000,
          timestamp: new Date().toISOString(),
        }));
        chunkIndex++;
      } else {
        clearInterval(ttsInterval);
      }
    }, 500 + Math.random() * 200); // Send TTS chunk every 500-700ms
  }


  _handleClose(ws, clientId) {
    this.connectedClients.delete(ws);
    logger.info(`Client ${clientId} disconnected. Total clients: ${this.connectedClients.size}`);
  }

  _handleError(ws, error, clientId) {
    logger.error(`Client ${clientId} WebSocket error:`, error);
  }

  stop() {
    if (this.wss) {
      this.wss.close(() => {
        logger.info('Mock WebSocket Server stopped.');
      });
    }
  }
}

// Example usage:
// if (require.main === module) {
//   const server = new MockWebSocketServer(8080);
//   server.start();

//   // Stop server after some time for testing
//   // setTimeout(() => {
//   //   server.stop();
//   // }, 10000);
// }

module.exports = MockWebSocketServer;
