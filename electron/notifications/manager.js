const { Notification } = require('electron');
const path = require('path');
const logger = require('../utils/logger');

class NotificationManager {
    constructor(mainWindow) {
        this.mainWindow = mainWindow;
    }

    showNotification(title, body, options = {}) {
        if (!Notification.isSupported()) {
            logger.warn('Notifications not supported on this system', { context: 'NotificationManager' });
            return;
        }

        const notification = new Notification({
            title,
            body,
            icon: process.platform === 'win32' 
                ? path.join(__dirname, '../../assets/icon.ico') 
                : path.join(__dirname, '../../assets/icon.png'),
            ...options
        });

        notification.on('click', () => {
            if (this.mainWindow) {
                if (this.mainWindow.isMinimized()) this.mainWindow.restore();
                this.mainWindow.show();
                this.mainWindow.focus();
            }
        });

        notification.show();
        logger.info(`Notification shown: ${title}`, { context: 'NotificationManager' });
    }
}

module.exports = NotificationManager;
