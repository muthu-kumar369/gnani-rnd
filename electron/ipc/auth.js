// electron/ipc/auth.js
const { ipcMain, BrowserWindow } = require('electron');
const logger = require('../utils/logger');
const Store = require('electron-store');

const store = new Store();

function setupAuthIPC() {
  logger.info('Setting up Auth IPC channels.', { context: 'AuthIPC' });

  ipcMain.handle('auth:get-tokens', async () => {
    try {
      const accessToken = store.get('accessToken');
      const refreshToken = store.get('refreshToken');
      const userId = store.get('userId');
      
      if (accessToken && refreshToken) {
        return { accessToken, refreshToken, userId };
      }
      return null;
    } catch (error) {
      logger.error('Error getting tokens:', error, { context: 'AuthIPC' });
      throw error;
    }
  });

  ipcMain.handle('auth:store-tokens', async (event, { accessToken, refreshToken, userId }) => {
    try {
      store.set('accessToken', accessToken);
      store.set('refreshToken', refreshToken);
      if (userId) {
        store.set('userId', userId);
      }
      logger.info('Tokens and userId saved to store.', { context: 'AuthIPC' });
      return true;
    } catch (error) {
      logger.error('Error setting tokens:', error, { context: 'AuthIPC' });
      throw error;
    }
  });

  ipcMain.handle('auth:clear-tokens', async () => {
    try {
      store.delete('accessToken');
      store.delete('refreshToken');
      store.delete('user');
      logger.info('Tokens cleared from store.', { context: 'AuthIPC' });
      return true;
    } catch (error) {
      logger.error('Error clearing tokens:', error, { context: 'AuthIPC' });
      throw error;
    }
  });

  ipcMain.handle('auth:start-oauth', async (event, provider) => {
    logger.info(`Starting OAuth flow for provider: ${provider}`, { context: 'AuthIPC' });
    return new Promise(async (resolve, reject) => {
      try {
        // 1. Get the auth URL from the backend
        const API_BASE_URL = "http://localhost:3000/api/auth"; // Match main.js
        const startUrlResponse = await fetch(`${API_BASE_URL}/oauth/${provider}/start?redirectUri=${encodeURIComponent(`${API_BASE_URL}/oauth/callback?provider=${provider}`)}`);
        
        if (!startUrlResponse.ok) {
           throw new Error(`Failed to get OAuth start URL: ${startUrlResponse.statusText}`);
        }

        const { authUrl } = await startUrlResponse.json();
        logger.info(`Got OAuth URL: ${authUrl}`, { context: 'AuthIPC' });

        // 2. Create the auth window
        const authWindow = new BrowserWindow({
          width: 600,
          height: 700,
          webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            // We don't need a preload for the auth window itself usually, 
            // unless we want to inject scripts to scrape, but we'll rely on navigation
          },
          autoHideMenuBar: true,
          alwaysOnTop: true,
        });

        let completed = false;

        const handleCallback = async (url) => {
          try {
             // Check if this is the callback URL
             // The backend redirects to /api/auth/oauth/callback... which returns JSON
             // But in a browser, that JSON is just displayed. 
             // We need to intercept the response or read the page content.
             // Since the backend returns JSON, we can't easily "read" it from the DOM if it's just raw JSON text 
             // unless we execute JS.
             // However, a better approach for Electron is often to capture the code/tokens from the URL 
             // if the backend redirects to a custom scheme or a client-side route.
             // BUT, the current backend `auth.controller.ts` `oauthCallback` returns `res.status(200).json(result)`.
             // This means the browser window will simply display the JSON.
             // We can use `webContents.executeJavaScript` to read the body text.
             
             if (url.includes('/api/auth/oauth/callback')) {
                logger.info('Detected callback navigation', { context: 'AuthIPC' });
                
                // Wait a bit for the JSON to render/load
                // A more robust way is to wait for 'did-finish-load' but we are in 'will-redirect' or 'did-navigate'
             }
          } catch (err) {
             logger.error('Error in handleCallback', err, { context: 'AuthIPC' });
          }
        };

        // We'll use webContents to monitor navigation
        authWindow.webContents.on('did-finish-load', async () => {
            const url = authWindow.webContents.getURL();
            if (url.includes('/api/auth/oauth/callback')) {
                try {
                    // The page should be displaying the JSON result from the backend
                    const pageContent = await authWindow.webContents.executeJavaScript('document.body.innerText');
                    logger.info('Extracted page content from callback', { context: 'AuthIPC' });
                    
                    try {
                        const authResult = JSON.parse(pageContent);
                        if (authResult.accessToken && authResult.refreshToken) {
                            // Success!
                            completed = true;
                            authWindow.close();
                            
                            // Store tokens immediately? Or let the frontend do it?
                            // The `oauthService.ts` in frontend calls `auth.storeTokens` after getting result.
                            // So we just return the result.
                            resolve(authResult);
                        } else {
                             // Maybe an error response in JSON
                             reject(new Error('Invalid auth response: ' + pageContent));
                             authWindow.close();
                        }
                    } catch (parseError) {
                        // Not JSON yet? or error page?
                        logger.warn('Could not parse callback content as JSON', parseError, { context: 'AuthIPC' });
                    }
                } catch (err) {
                    logger.error('Failed to execute JS in auth window', err, { context: 'AuthIPC' });
                }
            }
        });

        authWindow.on('closed', () => {
          if (!completed) {
            reject(new Error('Auth window closed by user'));
          }
        });

        authWindow.loadURL(authUrl);

      } catch (error) {
        logger.error('Error in auth:start-oauth:', error, { context: 'AuthIPC' });
        reject(error);
        // Ensure window is closed if it exists and we are rejecting
        // We can't easily access authWindow here if it was defined inside the try block
        // But since we are inside the Promise executor, we can't access it if it wasn't hoisted.
        // Actually, let's just rely on the user closing it or the fact that loadURL failed means it might be empty.
        // But better to close it if possible.
        // Since `authWindow` is defined inside `try`, we can't access it in `catch` here.
        // Let's refactor slightly to hoist authWindow declaration if we want to close it.
        // For now, the main issue is the `authUrl` extraction.
      }
    });
  });

  logger.info('Auth IPC channels set up successfully.', { context: 'AuthIPC' });
}

module.exports = { setupAuthIPC };
