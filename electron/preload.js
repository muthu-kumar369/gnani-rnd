// electron/preload.js
const { contextBridge, ipcRenderer } = require("electron");

const logger = {
  info: (...args) => console.log("[PRELOAD]", ...args),
  warn: (...args) => console.warn("[PRELOAD]", ...args),
  debug: (...args) => console.debug("[PRELOAD]", ...args),
  error: (...args) => console.error("[PRELOAD]", ...args),
};

logger.info("Preload script loaded.", { context: 'Preload' });

contextBridge.exposeInMainWorld("gnani", {
  // --- General IPC ---
  send: (channel, data) => {
    // Whitelist channels for sending to main process
    const validSendChannels = [
      "mic:start", // Corrected channel name
      "mic:stop",  // Corrected channel name
      "send-llm-response",
      "get-ui-status",
      "wake:start",
      "wake:stop",
      "vad:start",
      "vad:stop",
      "vad:setAggressiveness",
      "stream:start",
      "stream:stop",
      "stream:setEndpoint",
      "stream:audio-frame", // New channel for sending audio frames
    ];

    if (validSendChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
      logger.debug(`Sent to main process: ${channel}`, { context: 'Preload' });
    } else {
      logger.warn(`Unknown IPC send channel: ${channel}`, { context: 'Preload' });
    }
  },
  on: (channel, callback) => {
    // Whitelist channels for receiving from main process
    const validReceiveChannels = [
      "audio:frame",
      "wake:triggered",
      "wake:status",
      "audio:listening",
      "audio:thinking",
      "llm:response",
      "ui:status",
      "mic-status",
      "audio:chunk", // VAD segment ready
      "audio:ended", // VAD speech ended
      "vad:status", // VAD state updates
      // Streaming and TTS events
      "stream:connected",
      "stream:disconnected",
      "stream:partial",
      "stream:final",
      "stream:tts_chunk",
      "stream:error",
      "stream:metrics",
      "stream:backpressure",
      "stream:tts_stop", // For stopping TTS playback from main
      "tts:started",
      "tts:ended",
      "tts:error",
    ];
    if (validReceiveChannels.includes(channel)) {
      const subscription = (event, ...args) => callback(...args);
      ipcRenderer.on(channel, subscription);
      logger.debug(`Subscribed to main process channel: ${channel}`, { context: 'Preload' });
      return () => {
        ipcRenderer.removeListener(channel, subscription);
        logger.debug(`Unsubscribed from main process channel: ${channel}`, { context: 'Preload' });
      };
    } else {
      logger.warn(`Unknown IPC receive channel: ${channel}`, { context: 'Preload' });
    }
  },

  // --- Auth IPC ---
  auth: {
    storeTokens: (accessToken, refreshToken) => {
      logger.info("Preload invoking auth:store-tokens", { context: 'Preload' });
      return ipcRenderer.invoke('auth:store-tokens', { accessToken, refreshToken });
    },
    getTokens: () => {
      logger.info("Preload invoking auth:get-tokens", { context: 'Preload' });
      return ipcRenderer.invoke('auth:get-tokens');
    },
    clearTokens: () => {
      logger.info("Preload invoking auth:clear-tokens", { context: 'Preload' });
      return ipcRenderer.invoke('auth:clear-tokens');
    },
    onForceLogout: (callback) => { // New method for force logout
      const subscription = (event, ...args) => callback(...args);
      ipcRenderer.on('auth:force-logout', subscription);
      return () => {
        ipcRenderer.removeListener('auth:force-logout', subscription);
      };
    },
  },

  // --- Wake Word ---
  wake: {
    startWakeWord: () => {
      logger.info("Preload calling wake:start", { context: 'Preload' });
      ipcRenderer.send("wake:start");
    },
    stopWakeWord: () => {
      logger.info("Preload calling wake:stop", { context: 'Preload' });
      ipcRenderer.send("wake:stop");
    },
    getWakeStatus: () => {
      logger.info("Preload invoking wake:getStatus", { context: 'Preload' });
      return ipcRenderer.invoke("wake:getStatus");
    },
    onWakeTriggered: (callback) => {
      const subscription = (event, ...args) => callback(...args);
      ipcRenderer.on("wake:triggered", subscription);
      return () => {
        ipcRenderer.removeListener("wake:triggered", subscription);
      };
    },
  },

  // --- VAD ---
  vad: {
    startVAD: () => {
      logger.info("Preload calling vad:start", { context: 'Preload' });
      ipcRenderer.send("vad:start");
    },
    stopVAD: () => {
      logger.info("Preload calling vad:stop", { context: 'Preload' });
      ipcRenderer.send("vad:stop");
    },
    getVADStatus: () => {
      logger.info("Preload invoking vad:getStatus", { context: 'Preload' });
      return ipcRenderer.invoke("vad:getStatus");
    },
    setAggressiveness: (level) => {
      logger.info(`Preload calling vad:setAggressiveness with level: ${level}`, { context: 'Preload' });
      ipcRenderer.send("vad:setAggressiveness", level);
    },
    on: (event, callback) => {
      // VAD-specific events
      const validVadEvents = [
        "audio:listening",
        "audio:chunk",
        "audio:ended",
        "vad:status",
      ];
      if (validVadEvents.includes(event)) {
        const subscription = (ipcEvent, ...args) => callback(...args);
        ipcRenderer.on(event, subscription);
        return () => {
          ipcRenderer.removeListener(event, subscription);
        };
      } else {
        logger.warn(`Unknown VAD event channel for 'on': ${event}`, { context: 'Preload' });
      }
    },
  },

  // --- Streaming ---
  stream: {
    startStream: (options) => {
      logger.info("Preload calling stream:start with options:", { context: 'Preload', extra: options });
      ipcRenderer.send("stream:start", options);
    },
    stopStream: () => {
      logger.info("Preload calling stream:stop", { context: 'Preload' });
      ipcRenderer.send("stream:stop");
    },
    setEndpoint: (cfg) => {
      logger.info("Preload calling stream:setEndpoint with config:", { context: 'Preload', extra: cfg });
      ipcRenderer.send("stream:setEndpoint", cfg);
    },
    getStatus: () => {
      logger.info("Preload invoking stream:getStatus", { context: 'Preload' });
      return ipcRenderer.invoke("stream:getStatus");
    },
    sendAudioFrame: (pcmData) => { // New function to send audio frames
      // pcmData is an ArrayBuffer from AudioWorkletNode
      ipcRenderer.send('stream:audio-frame', pcmData);
    },
    on: (event, callback) => {
      const validStreamEvents = [
        "stream:connected",
        "stream:disconnected",
        "stream:partial",
        "stream:final",
        "stream:tts_chunk",
        "stream:error",
        "stream:metrics",
        "stream:backpressure",
        "tts:started",
        "tts:ended",
        "tts:error",
        "stream:tts_stop",
      ];
      if (validStreamEvents.includes(event)) {
        const subscription = (ipcEvent, ...args) => callback(...args);
        ipcRenderer.on(event, subscription);
        return () => {
          ipcRenderer.removeListener(event, subscription);
        };
      } else {
        logger.warn(`Unknown Stream event channel for 'on': ${event}`, { context: 'Preload' });
      }
    },
  },
});
