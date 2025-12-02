// electron/ipc/system.js
const { ipcMain } = require('electron');
const logger = require('../utils/logger');

function setupSystemIPC(osAwarenessManager) {
  logger.info('Setting up system IPC channels.');

  // --- Device Awareness Getters ---

  ipcMain.handle('device:get-active-window', async () => {
    try {
      return await osAwarenessManager.getActiveWindow();
    } catch (error) {
      logger.error('Failed to get active window', error);
      return null;
    }
  });

  ipcMain.handle('device:get-system-status', async () => {
    try {
      return await osAwarenessManager.getSystemStatus();
    } catch (error) {
      logger.error('Failed to get system status', error);
      return null;
    }
  });

  ipcMain.handle('device:get-battery-status', async () => {
    try {
      return await osAwarenessManager.getBatteryStatus();
    } catch (error) {
      logger.error('Failed to get battery status', error);
      return null;
    }
  });

  ipcMain.handle('device:get-connectivity-status', async () => {
    try {
      return await osAwarenessManager.getConnectivityStatus();
    } catch (error) {
      logger.error('Failed to get connectivity status', error);
      return null;
    }
  });

  ipcMain.handle('device:get-audio-devices', async () => {
    try {
      return await osAwarenessManager.getAudioDevices();
    } catch (error) {
      logger.error('Failed to get audio devices', error);
      return [];
    }
  });

  // --- Device Awareness Event Forwarding ---

  if (osAwarenessManager) {
    osAwarenessManager.on('active-window-changed', (data) => {
      if (global.mainWindow && !global.mainWindow.isDestroyed()) {
        global.mainWindow.webContents.send('device:active-window-changed', data);
      }
    });

    osAwarenessManager.on('system-status-update', (data) => {
      if (global.mainWindow && !global.mainWindow.isDestroyed()) {
        global.mainWindow.webContents.send('device:system-status-update', data);
      }
    });

    osAwarenessManager.on('battery-changed', (data) => {
      if (global.mainWindow && !global.mainWindow.isDestroyed()) {
        global.mainWindow.webContents.send('device:battery-changed', data);
      }
    });

    osAwarenessManager.on('connectivity-changed', (data) => {
      if (global.mainWindow && !global.mainWindow.isDestroyed()) {
        global.mainWindow.webContents.send('device:connectivity-changed', data);
      }
    });

    osAwarenessManager.on('audio-devices-changed', (data) => {
      if (global.mainWindow && !global.mainWindow.isDestroyed()) {
        global.mainWindow.webContents.send('device:audio-devices-changed', data);
      }
    });
  }

  // --- Existing Placeholders (kept for compatibility if needed) ---

  // Placeholder for ui:status - renderer can request status
  ipcMain.on('get-ui-status', (event) => {
    logger.debug('Received get-ui-status request from renderer.');
    // In a real app, this would get actual status
    event.sender.send('ui:status', { message: 'System is ready', type: 'info' });
  });

  // Placeholder for wake:triggered
  ipcMain.on('wake:triggered', (event, data) => {
    logger.info(`Wake word triggered: ${data}`);
    // In a real app, this would initiate further processing
    event.sender.send('wake:triggered', data);
  });

  // Placeholder for llm:response
  ipcMain.on('send-llm-response', (event, data) => {
    logger.info(`Received LLM response to send to UI: ${data}`);
    if (global.mainWindow && !global.mainWindow.isDestroyed()) {
      global.mainWindow.webContents.send('llm:response', data);
    }
  });
  ipcMain.handle('system:get-hotkey', async () => {
    const Store = require('electron-store');
    const store = new Store();
    return store.get('globalHotkey') || 'CommandOrControl+Shift+Space';
  });
}

module.exports = { setupSystemIPC };
