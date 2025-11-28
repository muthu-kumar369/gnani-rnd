// electron/ipc/auth.js
const { ipcMain } = require('electron');
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

  logger.info('Auth IPC channels set up successfully.', { context: 'AuthIPC' });
}

module.exports = { setupAuthIPC };
