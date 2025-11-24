// electron/main.js
const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const Store = require('electron-store'); // Import electron-store
const logger = require("./utils/logger");
const MicCapture = require("./mic/micCapture");
const WakeManager = require("./wake/wakeManager");
const VadManager = require("./vad/vadManager");
const StreamingClient = require("./stream/client");
const TtsPlayer = require("./stream/ttsPlayer"); // New import for TTSPlayer

const { setupAudioIPC } = require("./ipc/audio");
const { setupSystemIPC } = require("./ipc/system");
const { setupWakeIPC } = require("./ipc/wake");
const { setupVadIPC } = require("./ipc/vad");
const { setupStreamIPC } = require("./ipc/stream"); // New import

logger.info("Electron main process starting...", { context: 'MainProcess' });

const isDev = process.env.NODE_ENV !== "production";

if (isDev) {
  try {
    require("electron-reloader")(module);
  } catch (err) {
    logger.error("Failed to load electron-reloader:", err, { context: 'MainProcess' });
  }
}

let mainWindow;
let micCapture;
let wakeManager;
let vadManager;
let streamingClient; // New variable
let ttsPlayer; // Declare ttsPlayer
let mockServer; // For dev mode

// Initialize electron-store for persistent, secure storage of user data like tokens.
const store = new Store();

// IPC Handlers for secure token storage
ipcMain.handle('auth:store-tokens', (event, { accessToken, refreshToken }) => {
  store.set('accessToken', accessToken);
  store.set('refreshToken', refreshToken);
  logger.info('Tokens stored securely.', { context: 'MainProcess' });
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

async function main() {
  // --- Development-only Mock Server ---
  if (isDev) {
    // Only start mock WebSocket server in development mode for testing.
    mockServer = new MockWebSocketServer(8080);
    mockServer.start();
  }

  // Create the main window
  createWindow();

  // Initialize all managers and engines after mainWindow is available
  micCapture = new MicCapture();
  wakeManager = new WakeManager();
  // VADManager requires micCapture instance to subscribe to audio frames.
  vadManager = new VadManager(micCapture);
  // StreamingClient now handles gRPC communication. It requires mainWindow for IPC.
  streamingClient = new StreamingClient({ mainWindow: mainWindow });
  ttsPlayer = new TtsPlayer(); // Instantiate TtsPlayer

  await wakeManager.initialize();
  await vadManager.init(); // This will now correctly subscribe to micCapture
  
  if (isDev) {
    // In development, force the client to use the local mock server
    logger.info("Running in dev mode. Overriding stream endpoint to use mock server.", { context: 'MainProcess' });
    streamingClient.init({ endpoint: 'ws://localhost:8080' });
  } else {
    streamingClient.init();
  }

  // --- Audio Pipeline Wiring ---
  // The audio frames are now sent directly from the renderer process via IPC 'stream:audio-frame'.
  // These frames are then routed to the StreamingClient, WakeManager, and VadManager.

  // Setup IPC handlers now that managers are ready
  setupAudioIPC(micCapture);
  setupSystemIPC();
  setupWakeIPC(wakeManager);
  setupVadIPC(vadManager);
  setupStreamIPC(streamingClient, ttsPlayer); // Pass ttsPlayer

  logger.info("All managers initialized and IPCs are set up.", { context: 'MainProcess' });
}

/**
 * Creates the main Electron browser window.
 */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.resolve(__dirname, "preload.js"),
      contextIsolation: true, // Recommended for security
      nodeIntegration: false, // Recommended for security
      webSecurity: true, // Enable webSecurity
      // Content Security Policy (CSP) configuration
      // In development, 'unsafe-eval' and 'unsafe-inline' are needed for Vite's HMR.
      // For production, these should be locked down further or removed if not strictly necessary.
      contentSecurityPolicy: isDev
        ? "default-src 'self' http://localhost:5173 ws://localhost:5173 data: blob:; script-src 'self' http://localhost:5173 'unsafe-inline' 'unsafe-eval'; style-src 'self' http://localhost:5173 'unsafe-inline';"
        : "default-src 'self' data: blob:; script-src 'self'; style-src 'self';"
    },
  });

  // Expose mainWindow globally for debugging or specific IPC needs (use with caution).
  global.mainWindow = mainWindow;

  if (isDev) {
    logger.info(
      "Running in development mode. Loading Vite server at http://localhost:5173", { context: 'MainProcess' }
    );
    mainWindow.loadURL("http://localhost:5173");
    // Open DevTools in development for easier debugging.
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
    // Cleanup StreamingClient
    streamingClient.cleanup();
  }
  if (ttsPlayer) { // Cleanup TtsPlayer
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

ipcMain.on("audio:thinking", (event, data) => {
  logger.info(`Renderer is thinking: ${data}`, { context: 'MainProcess' });
});

// IPC Handler for mic:start
ipcMain.on('mic:start', () => {
  logger.info('Received mic:start IPC from renderer. Starting microphone and managers...', { context: 'MainProcess' });
  micCapture.startMicrophone();
  wakeManager.startProcessing(); // Start wake word processing
  vadManager.startProcessing(); // Start VAD processing
});

// IPC Handler for mic:stop
ipcMain.on('mic:stop', () => {
  logger.info('Received mic:stop IPC from renderer. Stopping microphone and managers...', { context: 'MainProcess' });
  micCapture.stopMicrophone();
  wakeManager.stopProcessing(); // Stop wake word processing
  vadManager.stopProcessing(); // Stop VAD processing
});

ipcMain.on("stream:audio-frame", (event, pcmData) => {
  const audioBuffer = Buffer.from(pcmData);
  if (streamingClient) {
    streamingClient.addAudioFrame(audioBuffer);
  } else {
    logger.warn('StreamingClient not initialized. Cannot add audio frame.', { context: 'MainProcess' });
  }
  if (wakeManager) {
    wakeManager.processAudioFrame(audioBuffer);
  } else {
    logger.warn('WakeManager not initialized. Cannot process audio frame.', { context: 'MainProcess' });
  }
  if (vadManager) {
    vadManager.processAudioFrame(audioBuffer);
  } else {
    logger.warn('VadManager not initialized. Cannot process audio frame.', { context: 'MainProcess' });
  }
});

ipcMain.on("message", (event, channel, ...args) => {
  logger.warn(
    `Unhandled IPC message on channel: "${channel}" with args: ${args}`, { context: 'MainProcess' }
  );
});
