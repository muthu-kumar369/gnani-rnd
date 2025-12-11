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
      "stream:setSessionId", // New channel for setting session ID
      "stream:setConversationId", // New channel for setting conversation ID
      "stream:audio-frame", // New channel for sending audio frames
      "stream:start-file-test",
      "stream:sendText", // New channel for sending text input
      "tts:started", // Allow renderer to signal TTS start
      "tts:ended", // Allow renderer to signal TTS end
      "log", // Allow renderer to send logs to main process
    ];

    if (validSendChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
      // Don't log "log" calls to avoid recursion/spam in devtools
      if (channel !== 'log') {
        logger.debug(`Sent to main process: ${channel}`, { context: 'Preload' });
      }
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
      "hotkey:activate-mic",
      "screenshot:captured",
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
  getListenerCount: (channel) => {
     return ipcRenderer.listenerCount(channel);
  },

  // --- Auth IPC ---
  auth: {
    storeTokens: (accessToken, refreshToken, userId) => {
      logger.info("Preload invoking auth:store-tokens", { context: 'Preload' });
      return ipcRenderer.invoke('auth:store-tokens', { accessToken, refreshToken, userId });
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
    startOAuth: (provider) => {
      logger.info(`Preload invoking auth:start-oauth for ${provider}`, { context: 'Preload' });
      return ipcRenderer.invoke('auth:start-oauth', provider);
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
    setSpeaking: (isSpeaking) => {
        // Low-level debug log, often noisy
        // logger.debug(`Preload calling vad:setSpeaking: ${isSpeaking}`, { context: 'Preload' });
        ipcRenderer.send("vad:setSpeaking", isSpeaking);
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
    startFileStream: () => {
      logger.info("Preload calling stream:start-file-test", { context: 'Preload' });
      ipcRenderer.send("stream:start-file-test");
    },
    setEndpoint: (cfg) => {
      logger.info("Preload calling stream:setEndpoint with config:", { context: 'Preload', extra: cfg });
      ipcRenderer.send("stream:setEndpoint", cfg);
    },
    setSessionId: (sessionId) => {
      logger.info(`Preload calling stream:setSessionId with: ${sessionId}`, { context: 'Preload' });
      ipcRenderer.send("stream:setSessionId", sessionId);
    },
    setConversationId: (conversationId) => {
      logger.info("Preload calling stream:setConversationId", { context: 'Preload', extra: conversationId });
      ipcRenderer.send("stream:setConversationId", conversationId);
    },
    getStatus: () => {
      logger.info("Preload invoking stream:getStatus", { context: 'Preload' });
      return ipcRenderer.invoke("stream:getStatus");
    },
    sendAudioFrame: (pcmData) => { // New function to send audio frames
      // pcmData is an ArrayBuffer from AudioWorkletNode
      ipcRenderer.send('stream:audio-frame', pcmData);
    },
    sendText: (text) => {
      logger.info("Preload calling stream:sendText", { context: 'Preload', extra: text });
      ipcRenderer.send("stream:sendText", text);
    },
    on: (event, callback) => {
      const validStreamEvents = [
        "stream:connected",
        "stream:disconnected",
        "stream:partial",
        "stream:final",
        "stream:tts_chunk",
        "stream:llm_chunk",
        "stream:error",
        "stream:metrics",
        "stream:backpressure",
        "tts:started",
        "tts:ended",
        "tts:error",
        "stream:tts_stop",
        "stream:conversation_id",
        "stream:tool_status",
        "stream:title_update",
        "stream:typing_status",
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

  // --- Device Awareness API ---
  device: {
    // Getters
    getActiveWindow: () => ipcRenderer.invoke('device:get-active-window'),
    getSystemStatus: () => ipcRenderer.invoke('device:get-system-status'),
    getBatteryStatus: () => ipcRenderer.invoke('device:get-battery-status'),
    getConnectivityStatus: () => ipcRenderer.invoke('device:get-connectivity-status'),
    getAudioDevices: () => ipcRenderer.invoke('device:get-audio-devices'),

    // Event Listeners
    on: (event, callback) => {
      const validDeviceEvents = [
        'device:active-window-changed',
        'device:system-status-update',
        'device:battery-changed',
        'device:connectivity-changed',
        'device:audio-devices-changed',
      ];

      if (validDeviceEvents.includes(event)) {
        const subscription = (ipcEvent, ...args) => callback(...args);
        ipcRenderer.on(event, subscription);
        return () => {
          ipcRenderer.removeListener(event, subscription);
        };
      } else {
        logger.warn(`Unknown Device event channel: ${event}`, { context: 'Preload' });
        return () => { };
      }
    },
  },

  // --- System IPC ---
  system: {
    updateHotkey: (hotkey) => {
      logger.info(`Preload calling system:update-hotkey with: ${hotkey}`, { context: 'Preload' });
      ipcRenderer.send('system:update-hotkey', hotkey);
    },
    getHotkey: () => {
      logger.info("Preload invoking system:get-hotkey", { context: 'Preload' });
      return ipcRenderer.invoke('system:get-hotkey');
    },
  },
});
