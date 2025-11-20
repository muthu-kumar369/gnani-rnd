// electron/stream/wsClient.js
const { EventEmitter } = require("events");
const WebSocket = require("ws");
const { app } = require("electron");
const { v4: uuidv4 } = require("uuid");
const logger = require("../utils/logger");
const ExponentialBackoff = require("./utils/backoff");
const Metrics = require("./utils/metrics");
const StreamSerializer = require("./serializer");

class WebSocketClient extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = {
      endpoint: options.endpoint || "ws://localhost:8080",
      apiKey: options.apiKey || "",
      chunkMs: options.chunkMs || 200,
      sampleRate: options.sampleRate || 16000,
      reconnect: options.reconnect || {},
      tls: options.tls || { rejectUnauthorized: true },
      maxBufferSeconds: options.maxBufferSeconds || 5,
      debugLogRawAudio: options.debugLogRawAudio || false,
      ...options
    };

    this.ws = null;
    this.isConnected = false;
    this.backoff = new ExponentialBackoff(this.options.reconnect);
    this.metrics = new Metrics();
    this.serializer = new StreamSerializer();
    this.audioQueue = []; // Queue for audio frames
    this.audioQueueSize = 0; // Current size of audio queue in bytes
    this.sendInterval = null; // Interval for sending audio chunks
    this.currentSessionId = null;
    this.currentSegmentId = null;
    this.isStreamingAudio = false;
    this.pingInterval = null;

    logger.info("WebSocketClient initialized with options:", this.options);
  }

  /**
   * Connects to the WebSocket endpoint.
   */
  async connect() {
    if (
      this.ws &&
      (this.ws.readyState === WebSocket.CONNECTING ||
        this.ws.readyState === WebSocket.OPEN)
    ) {
      logger.warn("WebSocket is already connecting or open.");
      return;
    }

    this.isConnected = false;
    this.emit("stream:disconnected");
    logger.info(
      `Attempting to connect to ${this.options.endpoint}... (Attempt ${
        this.backoff.attempt + 1
      })`
    );

    const wsOptions = {
      headers: {
        Authorization: `Bearer ${this.options.apiKey}`,
        "X-Client-OS": process.platform,
        "X-Client-Version":
          app && app.getVersion ? app.getVersion() : "unknown",
        "X-Sample-Rate": this.options.sampleRate,
        "X-Channels": 1,
        "X-Codec": "pcm_s16le"
      },
      rejectUnauthorized: this.options.tls.rejectUnauthorized
    };

    try {
      this.ws = new WebSocket(this.options.endpoint, wsOptions);

      this.ws.onopen = this._onOpen.bind(this);
      this.ws.onmessage = this._onMessage.bind(this);
      this.ws.onerror = this._onError.bind(this);
      this.ws.onclose = this._onClose.bind(this);
      this.ws.on("pong", () => {
        this.metrics.recordRtt(Date.now() - this.lastPingTime);
        logger.debug("Received pong from server.");
      });
    } catch (error) {
      logger.error("WebSocket connection setup failed:", error);
      this._reconnect();
    }
  }

  _onOpen() {
    logger.info("WebSocket connection opened.");
    this.isConnected = true;
    this.backoff.reset(); // Reset backoff on successful connection
    this.currentSessionId = uuidv4(); // Generate new session ID
    this.emit("stream:connected", { sessionId: this.currentSessionId });

    // Send session_start message
    const sessionStartMessage = this.serializer.encodeControlMessage({
      type: "meta",
      event: "session_start",
      session_id: this.currentSessionId,
      client_meta: {
        os: process.platform,
        version: app && app.getVersion ? app.getVersion() : "unknown",
        sampleRate: this.options.sampleRate,
        channels: 1,
        codec: "pcm_s16le"
      }
    });
    this.ws.send(sessionStartMessage);
    this.metrics.recordBytesSent(sessionStartMessage.length);

    this._startPingInterval();
    this._startSendInterval();
  }

  _onMessage(event) {
    this.metrics.recordBytesReceived(
      event.data.length || event.data.byteLength || 0
    );
    const decodedMessage = this.serializer.decodeIncomingMessage(event.data);

    if (decodedMessage && decodedMessage.type) {
      switch (decodedMessage.type) {
        case "transcript.partial":
          this.emit("stream:partial", decodedMessage);
          this.metrics.recordTranscriptPartial();
          break;
        case "transcript.final":
          this.emit("stream:final", decodedMessage);
          this.metrics.recordTranscriptFinal();
          break;
        case "tts.chunk":
          this.emit("stream:tts_chunk", decodedMessage);
          this.metrics.recordTtsChunkReceived();
          break;
        case "error":
          logger.error("Received error from server:", decodedMessage);
          this.emit("stream:error", decodedMessage);
          if (
            decodedMessage.code === "rate_limit" ||
            decodedMessage.code === "auth_error"
          ) {
            this.disconnect(1000, decodedMessage.message);
          }
          break;
        default:
          logger.warn(
            "Received unknown message type from server:",
            decodedMessage
          );
      }
    } else {
      logger.warn(
        "Received undecipherable message from server:",
        decodedMessage
      );
    }
  }

  _onError(error) {
    logger.error("WebSocket error:", error);
    this.emit("stream:error", {
      code: "websocket_error",
      message: error.message
    });
  }

  _onClose(event) {
    logger.info(
      `WebSocket connection closed. Code: ${event.code}, Reason: ${event.reason}`
    );
    this.isConnected = false;
    this.isStreamingAudio = false;
    this._stopPingInterval();
    this._stopSendInterval();
    this.emit("stream:disconnected");

    if (!event.wasClean && event.code !== 1000 && event.code !== 1001) {
      this._reconnect();
    } else if (event.code === 1000) {
      logger.info("WebSocket closed cleanly.");
    } else {
      logger.warn("WebSocket closed unexpectedly:", event);
    }
  }

  _reconnect() {
    this.backoff
      .retry(() => this.connect())
      .then((scheduled) => {
        if (!scheduled) {
          logger.error("Max reconnect attempts reached. Giving up.");
          this.emit("stream:error", {
            code: "max_reconnect_attempts",
            message: "Max reconnect attempts reached."
          });
        }
      });
  }

  _startPingInterval() {
    this._stopPingInterval();
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.lastPingTime = Date.now();
        this.ws.ping();
      }
    }, 30000);
  }

  _stopPingInterval() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  _startSendInterval() {
    this._stopSendInterval();
    this.sendInterval = setInterval(() => {
      this._sendQueuedAudio();
    }, this.options.chunkMs);
  }

  _stopSendInterval() {
    if (this.sendInterval) {
      clearInterval(this.sendInterval);
      this.sendInterval = null;
    }
  }

  addAudioFrame(pcmFrame, segmentId) {
    if (!this.isConnected || !this.isStreamingAudio) {
      return;
    }

    if (this.currentSegmentId !== segmentId) {
      if (this.currentSegmentId && this.audioQueue.length > 0) {
        this._sendEndSegment(
          this.currentSegmentId,
          this.audioQueue.length *
            (this.options.frameSize / (this.options.sampleRate / 1000))
        );
      }
      this._sendStartSegment(segmentId);
      this.currentSegmentId = segmentId;
      this.audioQueue = [];
      this.audioQueueSize = 0;
    }

    this.audioQueue.push(pcmFrame);
    this.audioQueueSize += pcmFrame.length;

    const maxQueueBytes =
      this.options.maxBufferSeconds * this.options.sampleRate * 2;
    if (this.audioQueueSize > maxQueueBytes) {
      logger.warn(
        `Audio queue exceeding max buffer size (${this.options.maxBufferSeconds}s). Applying backpressure.`
      );
      this.emit("stream:backpressure", {
        currentQueueBytes: this.audioQueueSize,
        maxQueueBytes
      });
    }
    this.metrics.recordAudioFrameProcessed();
  }

  _sendStartSegment(segmentId) {
    const meta = {
      segment_id: segmentId,
      session_id: this.currentSessionId,
      sampleRate: this.options.sampleRate,
      channels: 1,
      timestamp: new Date().toISOString()
    };
    const message = this.serializer.createStartSegmentEnvelope(meta);
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(message);
      this.metrics.recordBytesSent(message.length);
      logger.debug(`Sent start_segment for ${segmentId}`);
    }
  }

  _sendEndSegment(segmentId, durationMs) {
    const meta = {
      segment_id: segmentId,
      session_id: this.currentSessionId,
      durationMs: durationMs
    };
    const message = this.serializer.createEndSegmentEnvelope(meta);
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(message);
      this.metrics.recordBytesSent(message.length);
      logger.debug(`Sent end_segment for ${segmentId}`);
    }
    this.metrics.recordSegmentSent();
  }

  _sendQueuedAudio() {
    if (
      !this.isConnected ||
      !this.ws ||
      this.ws.readyState !== WebSocket.OPEN ||
      this.audioQueue.length === 0
    ) {
      return;
    }

    const framesToSend = [];
    let bytesToSend = 0;
    const maxBytesPerWsMessage = 4 * 1024;

    while (this.audioQueue.length > 0 && bytesToSend < maxBytesPerWsMessage) {
      const frame = this.audioQueue[0];
      if (bytesToSend + frame.length <= maxBytesPerWsMessage) {
        framesToSend.push(this.audioQueue.shift());
        bytesToSend += frame.length;
      } else {
        break;
      }
    }

    if (framesToSend.length > 0) {
      const combinedBuffer = Buffer.concat(framesToSend);
      this.ws.send(combinedBuffer, { binary: true });
      this.metrics.recordBytesSent(combinedBuffer.length);
      this.audioQueueSize -= combinedBuffer.length;
      logger.debug(
        `Sent ${framesToSend.length} audio frames (${combinedBuffer.length} bytes) to server.`
      );
    }
  }

  startAudioStreaming() {
    if (this.isConnected) {
      this.isStreamingAudio = true;
      logger.info("Started audio streaming to backend.");
    } else {
      logger.warn("Cannot start audio streaming: Not connected to WebSocket.");
      this.connect();
    }
  }

  stopAudioStreaming() {
    this.isStreamingAudio = false;
    if (this.currentSegmentId && this.audioQueue.length > 0) {
      this._sendEndSegment(
        this.currentSegmentId,
        this.audioQueue.length *
          (this.options.frameSize / (this.options.sampleRate / 1000))
      );
    }
    this.audioQueue = [];
    this.audioQueueSize = 0;
    this.currentSegmentId = null;
    logger.info("Stopped audio streaming to backend. Queue cleared.");
  }

  disconnect(code = 1000, reason = "Normal Closure") {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      logger.info(`Disconnecting WebSocket. Code: ${code}, Reason: ${reason}`);
      this.ws.close(code, reason);
    } else {
      logger.warn("WebSocket not open, cannot disconnect.");
    }
    this._stopPingInterval();
    this._stopSendInterval();
    this.isConnected = false;
    this.isStreamingAudio = false;
    this.backoff.reset();
  }

  setEndpoint(cfg) {
    const oldEndpoint = this.options.endpoint;
    this.options = { ...this.options, ...cfg };
    logger.info(
      `Endpoint configuration updated. Old: ${oldEndpoint}, New: ${this.options.endpoint}`
    );
    if (this.isConnected && oldEndpoint !== this.options.endpoint) {
      logger.info("Endpoint changed, forcing reconnect.");
      this.disconnect();
      this.connect();
    }
  }

  getStatus() {
    return {
      isConnected: this.isConnected,
      isStreamingAudio: this.isStreamingAudio,
      sessionId: this.currentSessionId,
      segmentId: this.currentSegmentId,
      audioQueueSize: this.audioQueueSize,
      metrics: this.metrics.getMetrics()
    };
  }

  cleanup() {
    this.disconnect();
    this._stopPingInterval();
    this._stopSendInterval();
    this.metrics.report();
    logger.info("WebSocketClient cleaned up.");
  }
}

module.exports = WebSocketClient;
