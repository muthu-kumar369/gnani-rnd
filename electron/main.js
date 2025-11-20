// electron/main.js
const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const logger = require("./utils/logger");
const MicCapture = require("./mic/micCapture");
const WakeManager = require("./wake/wakeManager");
const VadManager = require("./vad/vadManager");
const StreamingClient = require("./stream/client"); // New import
const TtsPlayer = require("./stream/ttsPlayer"); // New import
const MockWebSocketServer = require('./stream/test/mockServer'); // For dev mode

const { setupAudioIPC } = require("./ipc/audio");
const { setupSystemIPC } = require("./ipc/system");
const { setupWakeIPC } = require("./ipc/wake");
const { setupVadIPC } = require("./ipc/vad");
const { setupStreamIPC } = require("./ipc/stream"); // New import

logger.info("Electron main process starting...");

const isDev = process.env.NODE_ENV !== "production";

if (isDev) {
  try {
    require("electron-reloader")(module);
  } catch (err) {
    logger.error("Failed to load electron-reloader:", err);
  }
}

let mainWindow;
let micCapture;
let wakeManager;
let vadManager;
let streamingClient; // New variable
let ttsPlayer; // New variable
let mockServer; // For dev mode

async function main() {
  // --- Development-only Mock Server ---
  if (isDev) {
    mockServer = new MockWebSocketServer(8080);
    mockServer.start();
  }

  // Initialize all managers and engines first
  micCapture = new MicCapture();
  wakeManager = new WakeManager();
  vadManager = new VadManager(micCapture); // Correctly pass micCapture instance
  streamingClient = new StreamingClient();
  ttsPlayer = new TtsPlayer();

  await wakeManager.initialize();
  await vadManager.init(); // This will now correctly subscribe to micCapture
  
  if (isDev) {
    // In development, force the client to use the local mock server
    logger.info("Running in dev mode. Overriding stream endpoint to use mock server.");
    streamingClient.init({ endpoint: 'ws://localhost:8080' });
  } else {
    streamingClient.init();
  }

  // --- Audio Pipeline Wiring ---
  // 1. MicCapture emits raw audio frames
  micCapture.on('audio-frame', (frame) => {
    // 2. WakeManager processes the frame. VAD manager is self-subscribed.
    wakeManager.processAudioFrame(frame);
  });

  // 3. VAD emits a complete speech segment, which is then passed to the streaming client
  vadManager.on("audio:chunk", (payload) => {
    logger.info(`VAD emitted audio chunk, passing to streaming client.`);
    // The payload.pcm should be a Buffer as per the VAD implementation.
    // If it's base64, it needs decoding first. Assuming Buffer for now.
    const pcmBuffer = Buffer.isBuffer(payload.pcm) ? payload.pcm : Buffer.from(payload.pcm, "base64");
    streamingClient.addAudioFrame(pcmBuffer, payload.id);
  });
  
  vadManager.on("audio:ended", () => {
    logger.info(`VAD emitted audio ended, finalizing stream segment.`);
    streamingClient.stopAudioStreaming();
  });

  // Setup IPC handlers now that managers are ready
  setupAudioIPC(micCapture);
  setupSystemIPC();
  setupWakeIPC(wakeManager);
  setupVadIPC(vadManager);
  setupStreamIPC(streamingClient, ttsPlayer);

  logger.info("All managers initialized and IPCs are set up.");

  // Create the main window
  createWindow();
}

// function createWindow() {
//   mainWindow = new BrowserWindow({
//     width: 800,
//     height: 600,
//     webPreferences: {
//       preload: path.join(__dirname, "preload.js"),
//       contextIsolation: true,
//       nodeIntegration: false,
//     },
//   });

//   global.mainWindow = mainWindow;

//   if (isDev) {
//     logger.info(
//       "Running in development mode. Loading Vite server at http://localhost:5173"
//     );
//     mainWindow.loadURL("http://localhost:5173");
//     mainWindow.webContents.openDevTools();
//   } else {
//     logger.info("Running in production mode. Loading built React app.");
//     const reactAppPath = path.join(__dirname, "../../react/dist/index.html");
//     mainWindow.loadFile(reactAppPath);
//   }

//   mainWindow.on("closed", () => {
//     logger.info("Main window closed.");
//     mainWindow = null;
//   });
// }

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.resolve(__dirname, "preload.js"), // FIXED
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true, // Enable webSecurity
      // CSP for Vite development server and production build
      // In development, 'unsafe-eval' and 'unsafe-inline' are needed for Vite's HMR.
      // For production, these should be removed.
      // connect-src needs ws://localhost:5173 for Vite's HMR.
      contentSecurityPolicy: isDev
        ? "default-src 'self' http://localhost:5173 ws://localhost:5173 data: blob:; script-src 'self' http://localhost:5173 'unsafe-inline' 'unsafe-eval'; style-src 'self' http://localhost:5173 'unsafe-inline';"
        : "default-src 'self' data: blob:; script-src 'self'; style-src 'self';"
    },
  });

  global.mainWindow = mainWindow;

  if (isDev) {
    logger.info(
      "Running in development mode. Loading Vite server at http://localhost:5173"
    );
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools();
  } else {
    logger.info("Running in production mode. Loading built React app.");
    const reactAppPath = path.join(__dirname, "../../react/dist/index.html");
    mainWindow.loadFile(reactAppPath);
  }

  mainWindow.on("closed", () => {
    logger.info("Main window closed.");
    mainWindow = null;
  });
}

app.whenReady().then(main);

app.on("window-all-closed", () => {
  logger.info("All windows closed, cleaning up and quitting.");
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
  if (ttsPlayer) {
    // Cleanup TtsPlayer
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
  logger.info(`Renderer is thinking: ${data}`);
});

ipcMain.on("message", (event, channel, ...args) => {
  logger.warn(
    `Unhandled IPC message on channel: "${channel}" with args: ${args}`
  );
});
