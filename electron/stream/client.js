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
    this.currentSessionId = null;
    this.backoff = new ExponentialBackoff(this.options.reconnect);
    this.metrics = new Metrics();
    this.isRefreshingToken = false;
    this.pendingAudioBuffer = [];
    this.isConnecting = false;
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
    return new Promise((resolve, reject) => {
      this.grpcClient.StartSession(
        { user_id: userId },
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
      this.emit("stream:error", {
        message: "Failed to start a new session with the server.",
      });
      return;
    }

    this.call = this.grpcClient.SendAudioStream(metadata);
    this.isConnected = true;
    this.backoff.reset();
    this.emit("stream:connected", { sessionId: this.currentSessionId });
    logger.info(
      `gRPC stream connected with Session ID: ${this.currentSessionId}`,
      { context: "StreamingClient" }
    );

    this.call.on("data", (response) => {
      logger.info('[gRPC] Received data:', response, { context: 'StreamingClient' }); // DEBUG LOG
      if (response.partial_text && response.partial_text.trim() !== '') {
        this.emit("stream:partial", { text: response.partial_text });
      }

      // Handle LLM text chunks
      if (response.llm_chunk) {
        console.log(`[StreamingClient] Received LLM chunk: "${response.llm_chunk}"`);
        if (response.llm_chunk.trim() !== '') {
          this.emit("stream:llm_chunk", { chunk: response.llm_chunk });
        } else {
          console.log('[StreamingClient] Ignored empty LLM chunk');
        }
      }

      if (response.final_text && response.final_text.trim() !== '') {
        this.emit("stream:final", { text: response.final_text });
      }

      if (response.error_message && response.error_message.trim() !== '') {
        this.emit("stream:error", { message: response.error_message });
      }
    });

    this.call.on("error", async (error) => {
      logger.error(
        `gRPC stream error: ${error.details || error.message} (Code: ${error.code
        })`,
        { context: "StreamingClient" }
      );
      this.handleDisconnect();
      if (
        error.code === grpc.status.UNAUTHENTICATED &&
        !this.isRefreshingToken
      ) {
        this.isRefreshingToken = true;
        logger.info("Attempting to refresh token due to UNAUTHENTICATED error...", { context: "StreamingClient" });
        try {
          const newTokens = await this.refreshTokensAndReconnect();
          if (newTokens) {
            logger.info("Tokens refreshed. A new connection will be attempted on next audio start.", { context: "StreamingClient" });
          } else {
            this.emit("stream:error", { message: "Session expired. Please log in again." });
            if (this.options.mainWindow) {
              this.options.mainWindow.webContents.send("auth:force-logout");
            }
          }
        } catch (refreshError) {
          logger.error("Error during token refresh:", refreshError, { context: "StreamingClient" });
          this.emit("stream:error", { message: "Failed to refresh session." });
        } finally {
          this.isRefreshingToken = false;
        }
      }
    });

    this.call.on("end", () => {
      logger.info("gRPC stream ended by server.", {
        context: "StreamingClient",
      });
      this.handleDisconnect();
    });
  }

  async refreshTokensAndReconnect() {
    const refreshToken = this.store.get("refreshToken");
    if (!refreshToken) {
      logger.error("No refresh token available.", {
        context: "StreamingClient",
      });
      return null;
    }
    try {
      const newTokens = await this.options.callRefreshTokenApiFromMain(refreshToken);
      if (newTokens && newTokens.accessToken && newTokens.refreshToken) {
        this.store.set("accessToken", newTokens.accessToken);
        this.store.set("refreshToken", newTokens.refreshToken);
        logger.info("New tokens stored after successful refresh.", {
          context: "StreamingClient",
        });
        return newTokens;
      }
      return null;
    } catch (error) {
      logger.error("callRefreshTokenApiFromMain failed:", error, {
        context: "StreamingClient",
      });
      return null;
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
      logger.info("Scheduling gRPC stream reconnect...", {
        context: "StreamingClient",
      });
      this.backoff.retry(() => this._attemptReconnect());
    }
  }

  async _attemptReconnect() {
    logger.info("Attempting gRPC stream reconnect...", {
      context: "StreamingClient",
    });
    await this.connect();
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
    this.pendingAudioBuffer = []; // Initialize buffer

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

    if (!this.call || !this.isStreamingAudio) {
      logger.warn(
        "Attempted to send audio frame but gRPC stream is not active.",
        { context: "StreamingClient" }
      );
      this.emit("stream:error", {
        message: "Audio stream not active.",
      });
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
        await this.connect();
      } catch (error) {
        logger.error("Failed to connect for text input:", error, { context: "StreamingClient" });
        this.emit("stream:error", { message: "Failed to connect to server." });
        return;
      }
    }

    if (!this.call) {
      logger.error("gRPC call object is null despite connection.", { context: "StreamingClient" });
      this.emit("stream:error", { message: "Connection error." });
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