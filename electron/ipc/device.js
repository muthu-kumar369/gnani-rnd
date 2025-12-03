// electron/ipc/device.js
const { ipcMain } = require('electron');
const logger = require('../utils/logger');
const { getInstance: getOSAwarenessManager } = require('../device');

function setupDeviceIPC(mainWindow) {
    logger.info('Setting up Device Awareness IPC channels.', { context: 'DeviceIPC' });

    const osManager = getOSAwarenessManager();

    // Forward events to renderer
    osManager.on('active-window-changed', (data) => {
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('device:active-window-changed', data);
        }
    });

    osManager.on('system-status-update', (data) => {
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('device:system-status-update', data);
        }
    });

    osManager.on('battery-changed', (data) => {
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('device:battery-changed', data);
        }
    });

    osManager.on('connectivity-changed', (data) => {
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('device:connectivity-changed', data);
        }
    });

    osManager.on('audio-devices-changed', (data) => {
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('device:audio-devices-changed', data);
        }
    });

    // Handle requests from renderer
    ipcMain.handle('device:get-active-window', async () => {
        try {
            return await osManager.getActiveWindow();
        } catch (error) {
            logger.error('Error getting active window', error, { context: 'DeviceIPC' });
            return null;
        }
    });

    ipcMain.handle('device:get-system-status', async () => {
        try {
            return await osManager.getSystemStatus();
        } catch (error) {
            logger.error('Error getting system status', error, { context: 'DeviceIPC' });
            return null;
        }
    });

    ipcMain.handle('device:get-battery-status', async () => {
        try {
            return await osManager.getBatteryStatus();
        } catch (error) {
            logger.error('Error getting battery status', error, { context: 'DeviceIPC' });
            return null;
        }
    });

    ipcMain.handle('device:get-connectivity-status', async () => {
        try {
            return await osManager.getConnectivityStatus();
        } catch (error) {
            logger.error('Error getting connectivity status', error, { context: 'DeviceIPC' });
            return null;
        }
    });

    ipcMain.handle('device:get-audio-devices', async () => {
        try {
            return await osManager.getAudioDevices();
        } catch (error) {
            logger.error('Error getting audio devices', error, { context: 'DeviceIPC' });
            return null;
        }
    });

    logger.info('Device Awareness IPC channels set up successfully.', { context: 'DeviceIPC' });
}

module.exports = { setupDeviceIPC };
