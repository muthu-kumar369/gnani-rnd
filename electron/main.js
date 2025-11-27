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

ipcMain.handle('auth:start-oauth', async (event, provider) => {
  logger.info(`Starting OAuth flow for provider: ${provider}`, { context: 'MainProcess' });

  // Base URL configuration
  const baseUrl = isDev ? 'http://localhost:3000' : 'https://api.gnani.ai';
  const startEndpoint = `${baseUrl}/api/auth/oauth/${provider}/start?platform=desktop`;

  let authUrl;
  try {
    // Fetch the actual OAuth URL from the backend
    logger.info(`Fetching OAuth URL from: ${startEndpoint}`, { context: 'MainProcess' });
    const response = await fetch(startEndpoint);
    if (!response.ok) {
      throw new Error(`Failed to fetch OAuth URL: ${response.statusText}`);
    }
    const data = await response.json();
    if (!data.authUrl) {
      throw new Error('Backend did not return an authUrl');
    }
    authUrl = data.authUrl;
    logger.info(`Got OAuth URL: ${authUrl}`, { context: 'MainProcess' });
  } catch (error) {
    logger.error('Failed to initiate OAuth flow', error, { context: 'MainProcess' });
    throw error;
  }

  return new Promise((resolve, reject) => {
    const authWindow = new BrowserWindow({
      width: 600,
      height: 700,
      show: true,
      parent: mainWindow,
      modal: true,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        webSecurity: true,
      },
    });

    // Handle window close by user
    let isResolved = false;
    authWindow.on('closed', () => {
      if (!isResolved) {
        logger.info('OAuth window closed by user', { context: 'MainProcess' });
        reject(new Error('OAuth cancelled by user'));
      }
    });

    // Intercept navigation to capture the callback
    const filter = {
      urls: ['http://localhost:3000/auth/oauth/callback*'] // Adjust if your backend URL is different
    };

    // We can also check the title or page content if the backend returns a specific success page
    // Assuming the backend redirects to a page that displays the token or sends it via postMessage
    // For this implementation, we'll assume the backend returns a JSON response on the callback URL
    // or redirects to a success page with tokens in the URL hash/query.

    // Better approach for Electron:
    // The backend should ideally redirect to a custom protocol (e.g. gnani://auth/callback)
    // OR we can inject a script to extract tokens if the backend renders a page.
    
    // Let's assume the backend returns JSON on the callback endpoint.
    // We can intercept the response.
    
    // NOTE: Since we can't easily read the response body of a navigation request in Electron without
    // complex debugger attachment, a common pattern is:
    // 1. Backend redirects to a success page (e.g. /auth/success?token=...)
    // 2. We detect that URL.
    
    // Let's try to detect the callback URL and extract params.
    authWindow.webContents.on('will-redirect', (event, url) => {
      handleCallbackUrl(url);
    });
    
    authWindow.webContents.on('will-navigate', (event, url) => {
      handleCallbackUrl(url);
    });

    function handleCallbackUrl(url) {
      if (url.includes('/auth/oauth/callback')) {
        logger.info('Detected OAuth callback URL', { context: 'MainProcess', url });
        // If the backend returns JSON directly, Electron might download it or show it as text.
        // We need to parse it.
        
        // Strategy: Inject code to read the document body if it's a JSON response displayed in browser
        // OR check URL params if tokens are there.
        
        // Let's assume the backend returns the tokens in the URL query parameters for simplicity in this "desktop app" flow
        // If your backend sets cookies, we can grab session.
        
        // If the backend returns a JSON body, we can wait for 'did-finish-load' and execute JS.
      }
    }

    authWindow.webContents.on('did-finish-load', async () => {
      const url = authWindow.webContents.getURL();
      if (url.includes('/auth/oauth/callback')) {
        try {
          // Attempt to read the content of the page (assuming it's the JSON response)
          const pageContent = await authWindow.webContents.executeJavaScript('document.body.innerText');
          logger.info('OAuth callback page loaded', { context: 'MainProcess' });
          
          try {
            const data = JSON.parse(pageContent);
            if (data.token || data.accessToken) {
              const accessToken = data.token || data.accessToken;
              const refreshToken = data.refreshToken;
              const userId = data.user?.id || data.userId;
              
              // Store tokens
              store.set('accessToken', accessToken);
              if (refreshToken) store.set('refreshToken', refreshToken);
              if (userId) store.set('userId', userId);
              
              isResolved = true;
              authWindow.close();
              resolve({ 
                success: true, 
                user: data.user, 
                accessToken, 
                refreshToken 
              });
            } else if (data.error) {
               isResolved = true;
               authWindow.close();
               reject(new Error(data.error));
            }
          } catch (e) {
            // Not JSON, maybe just a redirect page?
            logger.warn('Could not parse OAuth response as JSON', { context: 'MainProcess' });
          }
        } catch (err) {
          logger.error('Error executing JS in auth window', err, { context: 'MainProcess' });
        }
      }
    });

    // Load the fetched auth URL
    authWindow.loadURL(authUrl);
  });
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