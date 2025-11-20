// electron/main.js
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const logger = require('./utils/logger');
const MicCapture = require('./mic/micCapture');
const WakeManager = require('./wake/wakeManager');
const VadManager = require('./vad/vadManager');
const StreamingClient = require('./stream/client'); // New import
const TtsPlayer = require('./stream/ttsPlayer');   // New import

const { setupAudioIPC } = require('./ipc/audio');
const { setupSystemIPC } = require('./ipc/system');
const { setupWakeIPC } = require('./ipc/wake');
const { setupVadIPC } = require('./ipc/vad');
const { setupStreamIPC } = require('./ipc/stream'); // New import

logger.info('Electron main process starting...');

const isDev = process.env.NODE_ENV !== 'production';

if (isDev) {
  try {
    require('electron-reloader')(module);
  } catch (err) {
    logger.error('Failed to load electron-reloader:', err);
  }
}

let mainWindow;
let micCapture;
let wakeManager;
let vadManager;
let streamingClient; // New variable
let ttsPlayer;      // New variable

async function main() {
  // Initialize all managers and engines first
  micCapture = new MicCapture();
  wakeManager = new WakeManager();
  vadManager = new VadManager(micCapture);
  streamingClient = new StreamingClient(); // Initialize StreamingClient
  ttsPlayer = new TtsPlayer();            // Initialize TtsPlayer
  
  await wakeManager.initialize();
  await vadManager.init();
  streamingClient.init(); // Initialize StreamingClient with default config

  // Link managers that need to communicate
  micCapture.wakeManager = wakeManager;

  // VAD -> StreamingClient: pipe audio chunks from VAD to streaming client
  vadManager.on('audio:chunk', (payload) => {
    // payload.pcm is base64 string, need to convert back to Buffer for streamingClient
    const pcmBuffer = Buffer.from(payload.pcm, 'base64');
    streamingClient.addAudioFrame(pcmBuffer, payload.id);
  });
  // VAD -> StreamingClient: notify when speech ends to finalize segment
  vadManager.on('audio:ended', () => {
    streamingClient.stopAudioStreaming(); // Notifies streaming client that the segment is fully processed
  });
  
  // Setup IPC handlers now that managers are ready
  setupAudioIPC(micCapture);
  setupSystemIPC();
  setupWakeIPC(wakeManager);
  setupVadIPC(vadManager);
  setupStreamIPC(streamingClient, ttsPlayer); // Setup Streaming IPC
  
  logger.info('All managers initialized and IPCs are set up.');

  // Create the main window
  createWindow();
}


function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  global.mainWindow = mainWindow;

  if (isDev) {
    logger.info('Running in development mode. Loading Vite server at http://localhost:5173');
    mainWindow.loadURL('http://localhost:5173');
    // mainWindow.webContents.openDevTools();
  } else {
    logger.info('Running in production mode. Loading built React app.');
    const reactAppPath = path.join(__dirname, '../../react/dist/index.html');
    mainWindow.loadFile(reactAppPath);
  }

  mainWindow.on('closed', () => {
    logger.info('Main window closed.');
    mainWindow = null;
  });
}

app.whenReady().then(main);

app.on('window-all-closed', () => {
  logger.info('All windows closed, cleaning up and quitting.');
  if (wakeManager) {
    wakeManager.cleanup();
  }
  if (vadManager) {
    vadManager.cleanup();
  }
  if (streamingClient) { // Cleanup StreamingClient
    streamingClient.cleanup();
  }
  if (ttsPlayer) {      // Cleanup TtsPlayer
    ttsPlayer.cleanup();
  }
  if (micCapture) {
    micCapture.stopMicrophone();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

ipcMain.on('audio:thinking', (event, data) => {
  logger.info(`Renderer is thinking: ${data}`);
});

ipcMain.on('message', (event, channel, ...args) => {
  logger.warn(`Unhandled IPC message on channel: "${channel}" with args: ${args}`);
});
