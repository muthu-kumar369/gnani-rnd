// electron/main.js
const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const Store = require('electron-store');
const logger = require("./utils/logger");
const MicCapture = require("./mic/micCapture");
const WakeManager = require("./wake/wakeManager");
const VadManager = require("./vad/vadManager");
const StreamingClient = require("./stream/client");
const TtsPlayer = require("./stream/ttsPlayer");
const { setupAudioIPC } = require("./ipc/audio");
const { setupSystemIPC } = require("./ipc/system");
const { setupWakeIPC } = require("./ipc/wake");
const { setupVadIPC } = require("./ipc/vad");
const { setupStreamIPC } = require("./ipc/stream");
const MockWebSocketServer = require('./stream/test/mockServer.js');

logger.info("Electron main process starting...", { context: 'MainProcess' });

const isDev = process.env.NODE_ENV !== "production";

if (isDev) {
  try {
    // require("electron-reloader")(module);
    logger.info("Electron reloader disabled for stability.", { context: 'MainProcess' });
  } catch (err) {
    logger.error("Failed to load electron-reloader:", err, { context: 'MainProcess' });
  }
}

let mainWindow;
let micCapture;
let wakeManager;
let vadManager;
let streamingClient;
let ttsPlayer;
let mockServer;
let store;

ipcMain.handle('auth:store-tokens', (event, { accessToken, refreshToken, userId }) => {
  store.set('accessToken', accessToken);
  store.set('refreshToken', refreshToken);
  if (userId) {
    store.set('userId', userId);
  }
  logger.info('Tokens and User ID stored securely.', { context: 'MainProcess' });
  return true;
});

ipcMain.handle('auth:get-tokens', () => {
  const accessToken = store.get('accessToken');
  const refreshToken = store.get('refreshToken');
  logger.info('Tokens retrieved.', { context: 'MainProcess' });
  return { accessToken, refreshToken };
});

ipcMain.handle('auth:clear-tokens', () => {
  store.delete('accessToken');
  store.delete('refreshToken');
  logger.info('Tokens cleared securely.', { context: 'MainProcess' });
  return true;
});

async function callRefreshTokenApiFromMain(refreshToken) {
  logger.warn('callRefreshTokenApiFromMain is not implemented. Returning null.', { context: 'MainProcess' });
  return null;
}

async function main() {
  store = new Store();

  createWindow();

  micCapture = new MicCapture();
  wakeManager = new WakeManager();
  vadManager = new VadManager();
  streamingClient = new StreamingClient({
    mainWindow: mainWindow,
    store: store,
    callRefreshTokenApiFromMain: callRefreshTokenApiFromMain,
  });
  ttsPlayer = new TtsPlayer();

  await wakeManager.initialize();
  await vadManager.init();

  vadManager.on('speech:start', () => {
    logger.info('VAD detected speech, starting audio stream.', { context: 'MainProcess' });
    streamingClient.startAudioStreaming(true);
  });

  vadManager.on('speech:end', () => {
    logger.info('VAD detected silence, stopping audio stream.', { context: 'MainProcess' });
    streamingClient.stopAudioStreaming();
  });

  vadManager.on('audio:frame', (frame) => {
    streamingClient.addAudioFrame(frame);
  });

  setupAudioIPC(wakeManager, vadManager);
  setupSystemIPC();
  setupWakeIPC(wakeManager);
  setupVadIPC(vadManager);
  setupStreamIPC(streamingClient, ttsPlayer);

  // When stream disconnects, we DO NOT want to stop TTS playback immediately.
  // The frontend might still have text buffered that needs to be spoken.
  // The frontend handles stream:disconnected by flushing its buffer.
  streamingClient.on('stream:disconnected', () => {
    logger.info('Stream disconnected. Letting frontend handle TTS completion.', { context: 'MainProcess' });
  });

  // Echo Cancellation: Pause VAD when TTS is playing (Controlled by Renderer)
  // We removed the ttsPlayer.on('tts:started') listener because it could fire for partial chunks
  // that don't result in immediate playback, causing VAD to get stuck in 'stopped' state.

  logger.info("All managers initialized and IPCs are set up.", { context: 'MainProcess' });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.resolve(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
      contentSecurityPolicy: isDev
        ? "default-src 'self' http://localhost:5173 ws://localhost:5173 data: blob:; script-src 'self' http://localhost:5173 'unsafe-inline' 'unsafe-eval'; style-src 'self' http://localhost:5173 'unsafe-inline';"
        : "default-src 'self' data: blob:; script-src 'self'; style-src 'self';"
    },
  });

  global.mainWindow = mainWindow;

  if (isDev) {
    logger.info(
      "Running in development mode. Loading Vite server at http://localhost:5173", { context: 'MainProcess' }
    );
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools();
  } else {
    logger.info("Running in production mode. Loading built React app.", { context: 'MainProcess' });
    const reactAppPath = path.join(__dirname, "../../react/dist/index.html");
    mainWindow.loadFile(reactAppPath);
  }

  mainWindow.on("closed", () => {
    logger.info("Main window closed.", { context: 'MainProcess' });
    mainWindow = null;
  });
}

app.whenReady().then(main);

app.on("window-all-closed", () => {
  logger.info("All windows closed, cleaning up and quitting.", { context: 'MainProcess' });
  if (mockServer) {
    mockServer.stop();
  }
  if (wakeManager) {
    wakeManager.cleanup();
  }
  if (vadManager) {
    vadManager.cleanup();
  }
  if (streamingClient) {
    streamingClient.cleanup();
  }
  if (ttsPlayer) {
    ttsPlayer.cleanup();
  }
  if (micCapture) {
    micCapture.stopMicrophone();
  }
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

ipcMain.on('mic:start', async () => {
  logger.info('Received mic:start IPC from renderer. Starting microphone and VAD...', { context: 'MainProcess' });
  micCapture.startMicrophone();
  vadManager.startProcessing();
});

ipcMain.on('mic:stop', () => {
  logger.info('Received mic:stop IPC from renderer. Stopping microphone and VAD...', { context: 'MainProcess' });
  micCapture.stopMicrophone();
  vadManager.stopProcessing();
});

ipcMain.on('tts:started', () => {
  logger.info('Received tts:started IPC from renderer. Pausing VAD.', { context: 'MainProcess' });
  vadManager.stopProcessing();
});

ipcMain.on('tts:ended', () => {
  logger.info('Received tts:ended IPC from renderer. Resuming VAD.', { context: 'MainProcess' });
  vadManager.startProcessing();
});

ipcMain.on('log', (event, { level, message, context, extra }) => {
  // Map frontend log levels to backend logger
  const logFn = logger[level] || logger.info;
  logFn(`[Frontend] ${message}`, { context: context || 'Frontend', extra });
});

ipcMain.on("message", (event, channel, ...args) => {
  logger.warn(
    `Unhandled IPC message on channel: "${channel}" with args: ${args}`, { context: 'MainProcess' }
  );
});