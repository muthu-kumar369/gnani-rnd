// electron/stream/client.js
const { EventEmitter } = require("events");
const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const path = require("path");
const logger = require("../utils/logger");
const ExponentialBackoff = require("./utils/backoff");
const Metrics = require("./utils/metrics");

const PROTO_PATH = path.join(__dirname, "../proto/audio.proto");

class StreamingClient extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = {
      endpoint: options.endpoint || "localhost:50051",
      reconnect: options.reconnect || {},
      mainWindow: options.mainWindow || null,
      callRefreshTokenApiFromMain: options.callRefreshTokenApiFromMain || null,
      ...options,
    };
    this.store = options.store;
    if (!this.store) {
      throw new Error("StreamingClient requires an electron-store instance.");
    }
    if (!this.options.callRefreshTokenApiFromMain) {
      throw new Error("StreamingClient requires a callRefreshTokenApiFromMain function.");
    }
    this.grpcClient = null;
    this.call = null;
    this.isConnected = false;
    this.isStreamingAudio = false;
    this.currentSessionId = null;  // gRPC session ID (temporary)
    this.conversationId = null;    // Conversation ID (permanent)
    this.backoff = new ExponentialBackoff(this.options.reconnect);
    this.metrics = new Metrics();
    this.isRefreshingToken = false;
    this.pendingAudioBuffer = [];
    this.isConnecting = false;

    // NEW: Reconnection state management
    this.isReconnecting = false;
    this.reconnectBuffer = [];  // Buffer audio during reconnection
    this.sessionState = null;   // Store session state for recovery
    this.MAX_BUFFER_FRAMES = 480; // ~30s at 16kHz

    this.init();
  }

  init() {
    try {
      const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
      });
      const gnaniProto = grpc.loadPackageDefinition(packageDefinition).gnani;
      this.grpcClient = new gnaniProto.GnaniService(
        this.options.endpoint,
        grpc.credentials.createInsecure()
      );
      logger.info(
        `gRPC client initialized for endpoint: ${this.options.endpoint}`,
        { context: "StreamingClient" }
      );
    } catch (error) {
      logger.error("Failed to initialize gRPC client:", error, {
        context: "StreamingClient",
      });
      this.emit("stream:error", {
        message: "Failed to load gRPC protocol definitions.",
      });
    }
  }

  async startSession(metadata) {
    const userId = this.store.get('userId') || "electron-user";
    // Send conversationId to backend if we have one
    const sessionIdToPass = this.currentSessionId;

    return new Promise((resolve, reject) => {
      this.grpcClient.StartSession(
        { 
          user_id: userId, 
          session_id: sessionIdToPass,
          conversation_id: this.conversationId  // Send conversationId
        },
        metadata,
        (error, response) => {
          if (error) {
            logger.error("StartSession RPC failed:", error, {
              context: "StreamingClient",
            });
            return reject(error);
          }
          if (!response || !response.session_id) {
            logger.error("StartSession response is invalid or missing session_id.", response, {
              context: "StreamingClient",
            });
            return reject(new Error("Failed to get session_id from backend."));
          }

          // Workaround for corrupted session_id string
          let sessionId = response.session_id;
          if (sessionId.includes('$')) {
            logger.warn(`Corrupted session_id detected. Cleaning it up. Original: ${sessionId}`);
            sessionId = sessionId.split('$').pop();
          }

          // Store conversationId from response
          if (response.conversation_id) {
            this.conversationId = response.conversation_id;
            logger.info(`Conversation ID set to: ${this.conversationId}`, { context: "StreamingClient" });
            this.emit('stream:conversation_id', { conversationId: this.conversationId });
          }

          resolve(sessionId);
        }
      );
    });
  }

  async endSession(metadata) {
    if (!this.currentSessionId) return;
    return new Promise((resolve, reject) => {
      this.grpcClient.EndSession(
        { session_id: this.currentSessionId },
        metadata,
        (error, response) => {
          if (error) {
            logger.error("EndSession RPC failed:", error, {
              context: "StreamingClient",
            });
            return reject(error);
          }
          logger.info("Session ended successfully.", {
            context: "StreamingClient",
          });
          resolve(response);
        }
      );
    });
  }


  async connect(isTest = false) {
    if (!this.grpcClient) {
      logger.error("gRPC client not initialized. Cannot connect.", {
        context: "StreamingClient",
      });
      return;
    }
    if (this.call) {
      logger.warn("Already connected or connecting.", {
        context: "StreamingClient",
      });
      return;
    }

    const accessToken = this.store.get("accessToken");
    logger.debug(`Attempting to connect. Token present: ${!!accessToken}`, { context: "StreamingClient" });

    const metadata = new grpc.Metadata();
    if (!accessToken && !isTest) {
      logger.warn("No access token found. Cannot start session.", {
        context: "StreamingClient",
      });
      this.emit("stream:error", {
        message: "User unauthenticated. Please log in.",
      });
      return;
    }

    if (accessToken) {
      metadata.add("authorization", `Bearer ${accessToken}`);
    }

    try {
      this.currentSessionId = await this.startSession(metadata);
    } catch (error) {
      logger.error("Failed to start session:", error, { context: "StreamingClient" });
      this.emit("stream:error", {
        message: "Failed to start a new session with the server.",
      });
      return;
    }

    this.call = this.grpcClient.SendAudioStream(metadata);
    this.isConnected = true;
    this.backoff.reset();

    this.call.on('data', (data) => {
      // Handle backpressure: if main window is not available or destroyed, pause stream
      if (!this.options.mainWindow || this.options.mainWindow.isDestroyed()) {
        logger.warn('Main window not available. Pausing stream.', { context: 'StreamingClient' });
        this.pause();
        return;
      }

      if (data.partial_text) {
        this.emit('stream:partial', { text: data.partial_text, segment_id: data.segment_id });
        this.metrics.recordTranscriptPartial();
      }
      if (data.final_text) {
        this.emit('stream:final', { text: data.final_text, segment_id: data.segment_id });
        this.metrics.recordTranscriptFinal();
      }
      if (data.llm_chunk) {
        try {
          // Parse if it's a string, otherwise use as is
          const chunk = typeof data.llm_chunk === 'string' ? JSON.parse(data.llm_chunk) : data.llm_chunk;
          this.emit('stream:llm_chunk', { chunk });
          this.metrics.recordTtsChunkReceived(); // Reusing metric for now
        } catch (e) {
          logger.error('Failed to parse LLM chunk:', e, { context: 'StreamingClient' });
        }
      }
      if (data.tool_status) {
        this.emit('stream:tool_status', { tool_status: data.tool_status });
      }

      this.metrics.recordBytesReceived(JSON.stringify(data).length); // Approx size
    });

    this.call.on('error', (error) => {
      logger.error('gRPC stream error:', error, { context: 'StreamingClient' });
      this.handleDisconnect(true);
    });

    this.call.on("end", () => {
      logger.info("gRPC stream ended by server.", {
        context: "StreamingClient",
      });
      this.handleDisconnect();
    });
  }

  pause() {
    if (this.call && !this.call.isPaused()) {
      logger.info('Pausing gRPC stream.', { context: 'StreamingClient' });
      this.call.pause();
    }
  }

  resume() {
    if (this.call && this.call.isPaused()) {
      logger.info('Resuming gRPC stream.', { context: 'StreamingClient' });
      this.call.resume();
    }
  }

  async handleDisconnect(forceReconnect = false) {
    if (!this.isConnected && !this.isStreamingAudio) return; // Prevent multiple disconnect calls
    logger.info("Handling gRPC stream disconnect.", {
      context: "StreamingClient",
    });
    const metadata = new grpc.Metadata();
    const accessToken = this.store.get("accessToken");
    if (accessToken) {
      metadata.add("authorization", `Bearer ${accessToken}`);
    }
    await this.endSession(metadata).catch(err => logger.error("endSession failed during disconnect:", err, { context: "StreamingClient" }));

    this.isConnected = false;
    this.isStreamingAudio = false;
    this.currentSessionId = null;
    if (this.call) {
      this.call.cancel();
      this.call = null;
    }
    this.emit("stream:disconnected");

    if (forceReconnect && this.backoff.shouldRetry()) {
      // NEW: Set reconnecting flag and preserve session state
      if (this.currentSessionId) {
        this.sessionState = {
          sessionId: this.currentSessionId,
          userId: this.store.get('userId'),
          wasStreaming: this.isStreamingAudio
        };
        this.isReconnecting = true;
        this.emit('stream:reconnecting');
        logger.info('Preserved session state for reconnection', {
          context: 'StreamingClient',
          sessionId: this.currentSessionId
        });
      }

      logger.info("Scheduling gRPC stream reconnect...", {
        context: "StreamingClient",
      });
      this.backoff.retry(() => this._attemptReconnect());
    }
  }

  async _attemptReconnect() {
    logger.info("Attempting gRPC stream reconnect...", {
      context: "StreamingClient",
      bufferedFrames: this.reconnectBuffer ? this.reconnectBuffer.length : 0
    });

    try {
      // NEW: Restore session ID if preserved
      if (this.sessionState && this.sessionState.sessionId) {
        this.currentSessionId = this.sessionState.sessionId;
      }

      await this.connect();

      // NEW: Replay buffered audio if reconnection successful
      if (this.isConnected && this.reconnectBuffer && this.reconnectBuffer.length > 0) {
        logger.info(`Replaying ${this.reconnectBuffer.length} buffered audio frames`, {
          context: 'StreamingClient'
        });

        for (const { frame, isLast } of this.reconnectBuffer) {
          if (this.call && this.isConnected) {
            this.call.write({
              session_id: this.currentSessionId,
              audio_chunk: frame,
              end_of_stream: isLast
            });
          }
        }
        this.reconnectBuffer = [];
      }

      this.isReconnecting = false;
      this.sessionState = null;
      this.emit('stream:reconnected');

    } catch (error) {
      logger.error('Reconnection attempt failed', { context: 'StreamingClient', error: error.message });
    }
  }

  disconnect() {
    logger.info("Disconnecting gRPC stream gracefully.", {
      context: "StreamingClient",
    });
    if (this.call) {
      this.call.end();
    }
    this.handleDisconnect(false);
  }

  async startAudioStreaming(isTest = false) {
    this.isConnecting = true; // Set connecting flag
    // Don't clear buffer - preserve frames that arrive during connection

    if (!this.isConnected) {
      await this.connect(isTest);
    }

    this.isConnecting = false; // Clear connecting flag

    if (this.isConnected) { // Check if connection was successful
      this.isStreamingAudio = true;
      logger.info("Started gRPC audio streaming.", {
        context: "StreamingClient",
      });

      // Flush buffered frames
      if (this.pendingAudioBuffer.length > 0) {
        logger.info(`Flushing ${this.pendingAudioBuffer.length} buffered audio frames.`, { context: "StreamingClient" });
        for (const frame of this.pendingAudioBuffer) {
          this.addAudioFrame(frame);
        }
        this.pendingAudioBuffer = [];
      }
    } else {
      logger.error("Failed to start audio streaming because connection failed.", {
        context: "StreamingClient",
      });
      this.emit("stream:error", { message: "Connection to server failed." });
      this.pendingAudioBuffer = []; // Clear buffer on failure
    }
  }

  stopAudioStreaming() {
    if (this.isStreamingAudio && this.call) {
      this.addAudioFrame(Buffer.alloc(0), true);
      this.isStreamingAudio = false;
      logger.info("Stopped gRPC audio streaming.", {
        context: "StreamingClient",
      });
    }
    this.isConnecting = false;
    this.pendingAudioBuffer = [];
  }

  addAudioFrame(pcmFrame, isLast = false) {
    // If connecting, buffer the frame
    if (this.isConnecting) {
      if (this.pendingAudioBuffer) {
        this.pendingAudioBuffer.push(pcmFrame);
      }
      return;
    }

    // NEW: If reconnecting, buffer the frame
    if (this.isReconnecting) {
      if (!this.reconnectBuffer) this.reconnectBuffer = [];

      if (this.reconnectBuffer.length < this.MAX_BUFFER_FRAMES) {
        this.reconnectBuffer.push({ frame: pcmFrame, isLast });
      } else {
        this.reconnectBuffer.shift(); // Drop oldest
        this.reconnectBuffer.push({ frame: pcmFrame, isLast });
        if (this.reconnectBuffer.length % 50 === 0) {
          logger.warn('Reconnect buffer full, dropping oldest frame', { context: 'StreamingClient' });
        }
      }
      return;
    }

    if (!this.call || !this.isStreamingAudio) {
      // Stream is not active (e.g. VAD is monitoring but not recording). 
      // Ignored frames are expected behavior in this state.
      return;
    }

    // Log every 100th frame
    this.framesSent = (this.framesSent || 0) + 1;
    if (this.framesSent % 100 === 0) {
      logger.debug(`Sent ${this.framesSent} audio frames for session ${this.currentSessionId}`, { context: 'StreamingClient' });
    }

    try {
      // Send the raw PCM frame as 'audio_chunk'
      // The backend (WhisperService) handles the binary framing for the Python runner.
      this.call.write({
        session_id: this.currentSessionId,
        audio_chunk: pcmFrame,
        end_of_stream: isLast,
      });

      this.metrics.recordBytesSent(pcmFrame.length);

      if (isLast) {
        logger.info(`Sent LAST chunk for session ${this.currentSessionId}`, { context: "StreamingClient" });
      }

    } catch (error) {
      logger.error("Error sending audio chunk:", error, {
        context: "StreamingClient",
      });
      this.emit("stream:error", { message: "Failed to send audio data." });
    }
  }

  async setSessionId(sessionId) {
    logger.info(`Switching to session ID: ${sessionId}`, { context: 'StreamingClient' });
    if (this.currentSessionId === sessionId) return;

    // If we are currently connected/streaming, we need to restart the session
    if (this.isConnected) {
      logger.info('Disconnecting current session to switch...', { context: 'StreamingClient' });
      await this.handleDisconnect();
    }

    this.currentSessionId = sessionId;
    // We don't automatically connect here; we wait for the next interaction (mic start or text input)
    // to trigger connection, which will now use this new sessionId.
  }

  async setConversationId(conversationId) {
    logger.info(`Setting conversation ID: ${conversationId}`, { context: 'StreamingClient' });
    if (this.conversationId === conversationId) return;

    this.conversationId = conversationId;
    
    // Disconnect current session to ensure next connection uses new conversation ID
    if (this.isConnected) {
      logger.info('Disconnecting current session to switch conversation...', { context: 'StreamingClient' });
      await this.handleDisconnect();
    }
  }

  setEndpoint(cfg) {
    const oldEndpoint = this.options.endpoint;
    this.options = { ...this.options, ...cfg };
    if (this.isConnected && oldEndpoint !== this.options.endpoint) {
      this.disconnect();
      this.init();
      this.connect();
    }
  }

  getStatus() {
    return {
      isConnected: this.isConnected,
      isStreamingAudio: this.isStreamingAudio,
      sessionId: this.currentSessionId,
      endpoint: this.options.endpoint,
      clientType: "grpc",
      metrics: this.metrics.getMetrics(),
    };
  }

  cleanup() {
    this.disconnect();
    this.backoff.reset();
    this.disconnect();
    this.backoff.reset();
    logger.info("gRPC StreamingClient cleaned up.", {
      context: "StreamingClient",
    });
  }

  async startFileStreamTest() {
    logger.info('--- Starting Audio File Stream Test ---', { context: 'StreamingClient' });
    try {
      await this.startAudioStreaming(true);
      if (!this.isConnected) {
        throw new Error("Failed to connect for file stream test.");
      }

      const audioFilePath = path.join(__dirname, '../../speech_test.wav');
      if (!require('fs').existsSync(audioFilePath)) {
        throw new Error(`Test audio file not found at: ${audioFilePath}`);
      }

      logger.info(`Streaming audio file: ${audioFilePath}`, { context: 'StreamingClient' });
      const audioBuffer = require('fs').readFileSync(audioFilePath);
      const pcmData = audioBuffer.slice(44); // Simple 44-byte WAV header strip

      const chunkSize = 3200; // 100ms of 16-bit 16kHz PCM audio
      let offset = 0;

      while (offset < pcmData.length) {
        const chunk = pcmData.slice(offset, offset + chunkSize);
        const isLast = (offset + chunkSize) >= pcmData.length;
        this.addAudioFrame(chunk, isLast);
        offset += chunkSize;
        await new Promise(resolve => setTimeout(resolve, 100)); // Simulate real-time streaming
      }
      logger.info('Finished sending all audio chunks for file test.', { context: 'StreamingClient' });

      this.stopAudioStreaming();

    } catch (error) {
      logger.error('Audio file stream test failed:', error, { context: 'StreamingClient' });
      this.emit('stream:error', { message: `File stream test failed: ${error.message}` });
    } finally {
      this.disconnect();
      logger.info('--- Finished Audio File Stream Test ---', { context: 'StreamingClient' });
    }
  }

  async sendText(text) {
    logger.info(`Sending text input: "${text}"`, { context: 'StreamingClient' });

    if (!this.isConnected) {
      try {
        logger.info("Not connected, attempting to connect before sending text...", { context: 'StreamingClient' });
        await this.connect();
      } catch (error) {
        logger.error("Failed to connect for text input:", error, { context: "StreamingClient" });
        this.emit("stream:error", { message: "Failed to connect to server." });
        return;
      }
    }

    // Check again after attempted connection
    if (!this.isConnected || !this.call) {
      logger.error("gRPC call object is null or not connected after connect attempt.", { context: "StreamingClient" });
      this.emit("stream:error", { message: "Connection error. Please try again." });
      return;
    }

    try {
      this.call.write({
        session_id: this.currentSessionId,
        text_input: text,
        end_of_stream: true, // Text input is always a complete request
      });
      logger.info("Text input sent successfully.", { context: "StreamingClient" });
    } catch (error) {
      logger.error("Error sending text input:", error, { context: "StreamingClient" });
      this.emit("stream:error", { message: "Failed to send text." });
    }
  }
}

module.exports = StreamingClient;