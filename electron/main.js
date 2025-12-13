// electron/main.js
const { app, BrowserWindow, ipcMain, globalShortcut, Tray, Menu, desktopCapturer } = require("electron");
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
const { setupAuthIPC } = require("./ipc/auth");
const { OSAwarenessManager } = require("./device");
const NotificationManager = require("./notifications/manager");

// Global Error Handlers
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error, { context: 'MainProcess' });
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection:', reason, { context: 'MainProcess' });
});

// Simple file logger
function logToFile(msg) {
  try {
    fs.appendFileSync('debug.log', `[${new Date().toISOString()}] ${msg}\n`);
  } catch (e) {
    // ignore
  }
}

logToFile("Electron script loaded. Waiting for app ready...");

// ... (existing imports)

let mainWindow;
let micCapture;
let wakeManager;
let vadManager;
let streamingClient;
let ttsPlayer;
let mockServer;
let store;
let osAwarenessManager; // Add variable
let tray = null;
let notificationManager;

async function captureScreenshot() {
  try {
    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: { width: 1920, height: 1080 }
    });

    // Get primary screen
    const primarySource = sources[0];
    const screenshot = primarySource.thumbnail.toPNG();

    return screenshot;
  } catch (error) {
    logger.error(`Failed to capture screenshot: ${error.message}`, { context: 'MainProcess' });
    return null;
  }
}

function registerGlobalHotkey() {
  const hotkey = store.get('globalHotkey') || 'CommandOrControl+Shift+Space';
  const screenshotHotkey = 'CommandOrControl+Shift+S';

  // Unregister existing to avoid conflicts if changing
  globalShortcut.unregisterAll();

  try {
    // Register Mic Activation Hotkey
    const success = globalShortcut.register(hotkey, () => {
      logger.info(`Global hotkey ${hotkey} pressed`, { context: 'MainProcess' });

      if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.show();
        mainWindow.focus();

        // Trigger mic activation
        mainWindow.webContents.send('hotkey:activate-mic');
      }
    });

    if (!success) {
      logger.error(`Failed to register global hotkey: ${hotkey}`, { context: 'MainProcess' });
    } else {
      logger.info(`Global hotkey registered: ${hotkey}`, { context: 'MainProcess' });
    }

    // Register Screenshot Hotkey
    const screenshotSuccess = globalShortcut.register(screenshotHotkey, async () => {
      logger.info(`Screenshot hotkey ${screenshotHotkey} pressed`, { context: 'MainProcess' });
      const screenshot = await captureScreenshot();
      if (screenshot && mainWindow) {
        mainWindow.show();
        mainWindow.focus();
        mainWindow.webContents.send('screenshot:captured', screenshot);
        logger.info('Screenshot captured and sent to renderer', { context: 'MainProcess' });
      }
    });

    if (!screenshotSuccess) {
      logger.error(`Failed to register screenshot hotkey: ${screenshotHotkey}`, { context: 'MainProcess' });
    } else {
      logger.info(`Screenshot hotkey registered: ${screenshotHotkey}`, { context: 'MainProcess' });
    }

  } catch (error) {
    logger.error(`Error registering hotkey: ${error.message}`, { context: 'MainProcess' });
  }
}

function createTray() {
  const iconPath = process.platform === 'darwin'
    ? path.join(__dirname, 'assets/tray-icon-mac.png')
    : path.join(__dirname, 'assets/tray-icon.png');

  try {
    tray = new Tray(iconPath);

    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Activate Mic',
        click: () => {
          if (mainWindow) {
            mainWindow.show();
            mainWindow.webContents.send('hotkey:activate-mic');
          }
        }
      },
      { type: 'separator' },
      {
        label: 'Show/Hide Window',
        click: () => {
          if (mainWindow) {
            if (mainWindow.isVisible()) {
              mainWindow.hide();
            } else {
              mainWindow.show();
              mainWindow.focus();
            }
          }
        }
      },
      { type: 'separator' },
      {
        label: 'Quit',
        click: () => {
          app.quit();
        }
      }
    ]);

    tray.setContextMenu(contextMenu);
    tray.setToolTip('Gnani AI Assistant');

    tray.on('click', () => {
      if (mainWindow) {
        if (mainWindow.isVisible()) {
          mainWindow.hide();
        } else {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    });

    logger.info('System tray created successfully', { context: 'MainProcess' });
  } catch (error) {
    logger.error(`Failed to create system tray: ${error.message}`, { context: 'MainProcess' });
  }
}

function createWindow() {
  const { width, height } = store.get("windowBounds") || { width: 1200, height: 800 };

  mainWindow = new BrowserWindow({
    width,
    height,
    icon: path.join(__dirname, "assets/icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
    titleBarStyle: 'default', // Restore default title bar
    backgroundColor: '#000000',
  });

  mainWindow.setMenu(null);

  const startUrl = process.env.NODE_ENV === "development"
    ? "http://localhost:5173"
    : `file://${path.join(__dirname, "../react/dist/index.html")}`;

  mainWindow.loadURL(startUrl);

  // Assign to global for IPC access
  global.mainWindow = mainWindow;

  if (process.env.NODE_ENV === "development") {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on("resize", () => {
    const { width, height } = mainWindow.getBounds();
    store.set("windowBounds", { width, height });
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// ... (existing code)

// Real implementation of refresh token API call
const callRefreshTokenApiFromMain = async (refreshToken) => {
  try {
    const API_BASE_URL = "http://localhost:3000/api/auth";
    logger.info('Attempting to refresh token from main process...', { context: 'MainProcess' });

    const response = await fetch(`${API_BASE_URL}/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`Refresh token API failed with status ${response.status}: ${errorText}`, { context: 'MainProcess' });
      return null;
    }

    const data = await response.json();
    logger.info('Token refresh successful.', { context: 'MainProcess' });
    return {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken
    };
  } catch (error) {
    logger.error('Error calling refresh token API from main:', error, { context: 'MainProcess' });
    return null;
  }
};

async function main() {
  try {
    logger.info("Starting main function...", { context: 'MainProcess' });
    // Single Instance Lock
    const gotTheLock = app.requestSingleInstanceLock();
    if (!gotTheLock) {
      logger.info("Another instance is already running. Quitting...", { context: 'MainProcess' });
      app.quit();
      return;
    }

    app.on('second-instance', (event, commandLine, workingDirectory) => {
      // Someone tried to run a second instance, we should focus our window.
      if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.focus();
      }
    });

    // Content Security Policy (CSP)
    const { session } = require('electron');
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': ["default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: ws: http://localhost:3000 https://fonts.googleapis.com https://fonts.gstatic.com; img-src 'self' data: blob: https:; media-src 'self' data: blob:;"]
        }
      });
    });

    store = new Store();

    logger.info("Creating window...", { context: 'MainProcess' });
    createWindow();

    logger.info("Initializing managers...", { context: 'MainProcess' });

    try {
      micCapture = new MicCapture();
    } catch (error) {
      logger.error('Failed to instantiate MicCapture:', error, { context: 'MainProcess' });
    }

    try {
      wakeManager = new WakeManager();
    } catch (error) {
      logger.error('Failed to instantiate WakeManager:', error, { context: 'MainProcess' });
    }

    try {
      vadManager = new VadManager();
    } catch (error) {
      logger.error('Failed to instantiate VadManager:', error, { context: 'MainProcess' });
    }

    try {
      streamingClient = new StreamingClient({
        mainWindow: mainWindow,
        store: store,
        callRefreshTokenApiFromMain: callRefreshTokenApiFromMain,
      });
    } catch (error) {
      logger.error('Failed to instantiate StreamingClient:', error, { context: 'MainProcess' });
    }

    try {
      ttsPlayer = new TtsPlayer();
    } catch (error) {
      logger.error('Failed to instantiate TtsPlayer:', error, { context: 'MainProcess' });
    }

    // Instantiate OS Awareness Manager early
    try {
      osAwarenessManager = new OSAwarenessManager();
    } catch (error) {
      logger.error('Failed to instantiate OS Awareness Manager:', error, { context: 'MainProcess' });
    }

    try {
      notificationManager = new NotificationManager(mainWindow);
    } catch (error) {
      logger.error('Failed to instantiate NotificationManager:', error, { context: 'MainProcess' });
    }

    // Setup IPCs EARLY to ensure handlers are registered even if initialization fails or hangs
    logger.info("Setting up IPCs...", { context: 'MainProcess' });
    try {
      setupAudioIPC(wakeManager, vadManager);
    } catch (error) {
      logger.error('Failed to setup Audio IPC:', error, { context: 'MainProcess' });
    }

    try {
      setupSystemIPC(osAwarenessManager); // Pass manager
    } catch (error) {
      logger.error('Failed to setup System IPC:', error, { context: 'MainProcess' });
    }

    try {
      setupWakeIPC(wakeManager);
    } catch (error) {
      logger.error('Failed to setup Wake IPC:', error, { context: 'MainProcess' });
    }

    try {
      setupVadIPC(vadManager);
    } catch (error) {
      logger.error('Failed to setup VAD IPC:', error, { context: 'MainProcess' });
    }

    try {
      setupStreamIPC(streamingClient, ttsPlayer);
    } catch (error) {
      logger.error('Failed to setup Stream IPC:', error, { context: 'MainProcess' });
    }

    try {
      setupAuthIPC();
    } catch (error) {
      logger.error('Failed to setup Auth IPC:', error, { context: 'MainProcess' });
    }

    // Initialize OS Awareness (Async)
    if (osAwarenessManager) {
      try {
        logger.info("Initializing OS Awareness Manager...", { context: 'MainProcess' });
        await osAwarenessManager.initialize();
        logger.info("OS Awareness Manager initialized.", { context: 'MainProcess' });
      } catch (error) {
        logger.error('Failed to initialize OS Awareness:', error, { context: 'MainProcess' });
        // Continue without OS awareness
      }
    }

    logger.info("Initializing Wake Manager...", { context: 'MainProcess' });
    try {
      await wakeManager.initialize();
    } catch (error) {
      logger.error('Failed to initialize Wake Manager:', error, { context: 'MainProcess' });
    }

    logger.info("Initializing VAD Manager...", { context: 'MainProcess' });
    try {
      await vadManager.init();
    } catch (error) {
      logger.error('Failed to initialize VAD Manager:', error, { context: 'MainProcess' });
    }

    logger.info("Setting up VAD listeners...", { context: 'MainProcess' });
    vadManager.on('speech:start', () => {
      logger.info('VAD detected speech.', { context: 'MainProcess' });

      // STAGE 1: Barge-in logic with state machine
      if (audioState.isTTSPlaying && audioState.bargeInEnabled) {
        logger.info('Barge-in detected! Stopping TTS.', { context: 'MainProcess' });
        if (ttsPlayer) {
          ttsPlayer.stopPlayback();
        }
        audioState.isTTSPlaying = false;

        // Notify frontend of interruption
        if (mainWindow) {
          mainWindow.webContents.send('tts:interrupted');
        }
      }

      audioState.isUserSpeaking = true;

      logger.info('Starting audio stream.', { context: 'MainProcess' });
      streamingClient.startAudioStreaming(true);
    });

    vadManager.on('speech:end', () => {
      logger.info('VAD detected silence, stopping audio stream.', { context: 'MainProcess' });
      audioState.isUserSpeaking = false;
      streamingClient.stopAudioStreaming();
    });

    vadManager.on('audio:frame', (frame) => {
      streamingClient.addAudioFrame(frame);
    });

    // When stream disconnects, we DO NOT want to stop TTS playback immediately.
    // The frontend might still have text buffered that needs to be spoken.
    // The frontend handles stream:disconnected by flushing its buffer.
    streamingClient.on('stream:disconnected', () => {
      logger.info('Stream disconnected. Letting frontend handle TTS completion.', { context: 'MainProcess' });
    });

    logger.info("All managers initialized and IPCs are set up.", { context: 'MainProcess' });

    // Register Global Hotkey
    registerGlobalHotkey();

    // Create System Tray
    createTray();
  } catch (error) {
    logger.error("CRITICAL ERROR IN MAIN:", error, { context: 'MainProcess' });
  }
}

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
  if (osAwarenessManager) {
    osAwarenessManager.cleanup();
  }
  if (process.platform !== "darwin") {
    app.quit();
  }
  globalShortcut.unregisterAll();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// STAGE 1: Audio state machine for barge-in
let audioState = {
  isTTSPlaying: false,
  isUserSpeaking: false,
  bargeInEnabled: true
};

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

// STAGE 1: TTS state management
ipcMain.on('tts:started', () => {
  logger.info('Received tts:started IPC from renderer.', { context: 'MainProcess' });
  audioState.isTTSPlaying = true;
  audioState.isUserSpeaking = false;
});

ipcMain.on('tts:ended', () => {
  logger.info('Received tts:ended IPC from renderer.', { context: 'MainProcess' });
  audioState.isTTSPlaying = false;
});

// STAGE 1: Additional IPC handlers for state machine
ipcMain.on('tts:start', () => {
  logger.info('Received tts:start IPC from renderer.', { context: 'MainProcess' });
  audioState.isTTSPlaying = true;
  audioState.isUserSpeaking = false;
});

ipcMain.on('tts:end', () => {
  logger.info('Received tts:end IPC from renderer.', { context: 'MainProcess' });
  audioState.isTTSPlaying = false;
});

// STAGE 1: VAD speech IPC handlers (in addition to event listeners)
ipcMain.on('vad:speech-start', () => {
  logger.info('Received vad:speech-start IPC from renderer.', { context: 'MainProcess' });

  if (audioState.isTTSPlaying && audioState.bargeInEnabled) {
    logger.info('Barge-in detected via IPC - stopping TTS', { context: 'MainProcess' });

    if (ttsPlayer) {
      ttsPlayer.stopPlayback();
    }
    audioState.isTTSPlaying = false;

    // Notify frontend
    if (mainWindow) {
      mainWindow.webContents.send('tts:interrupted');
    }
  }

  audioState.isUserSpeaking = true;
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

ipcMain.on('system:update-hotkey', (event, newHotkey) => {
  logger.info(`Received system:update-hotkey with: ${newHotkey}`, { context: 'MainProcess' });
  store.set('globalHotkey', newHotkey);
  registerGlobalHotkey(); // Re-register with new hotkey
});

ipcMain.on('notification:show', (event, { title, body, options }) => {
  if (notificationManager) {
    notificationManager.showNotification(title, body, options);
  }
});

app.whenReady().then(main);