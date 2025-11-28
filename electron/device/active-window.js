// electron/device/active-window.js
const EventEmitter = require('events');
const activeWin = require('active-win');
const throttle = require('lodash.throttle');
const logger = require('../utils/logger');

/**
 * Active Window Detector
 * Monitors the currently active window/application
 */
class ActiveWindowDetector extends EventEmitter {
    constructor(options = {}) {
        super();
        this.pollInterval = options.pollInterval || 1000; // 1 second
        this.intervalId = null;
        this.currentWindow = null;
        this.isRunning = false;

        // Throttle the emit to prevent spam
        this.emitWindowChanged = throttle((data) => {
            this.emit('window-changed', data);
        }, 500);

        logger.debug('ActiveWindowDetector created', { context: 'ActiveWindow' });
    }

    /**
     * Start monitoring active window
     */
    async start() {
        if (this.isRunning) {
            logger.warn('ActiveWindowDetector already running', { context: 'ActiveWindow' });
            return;
        }

        logger.info('Starting Active Window detection...', { context: 'ActiveWindow' });

        // Get initial window
        await this.checkActiveWindow();

        // Start polling
        this.intervalId = setInterval(() => {
            this.checkActiveWindow().catch(err => {
                logger.error('Error checking active window', err, { context: 'ActiveWindow' });
            });
        }, this.pollInterval);

        this.isRunning = true;
        logger.info('Active Window detection started', { context: 'ActiveWindow' });
    }

    /**
     * Check current active window
     */
    async checkActiveWindow() {
        try {
            // const result = await activeWin();
            const result = null; // Disable active-win for now to prevent crash

            if (!result) {
                // No active window (e.g., desktop focused)
                if (this.currentWindow !== null) {
                    this.currentWindow = null;
                    this.emitWindowChanged({
                        title: null,
                        owner: {
                            name: null,
                            processId: null,
                            path: null
                        },
                        timestamp: Date.now()
                    });
                }
                return;
            }

            const windowData = {
                title: result.title || 'Unknown',
                owner: {
                    name: result.owner?.name || 'Unknown',
                    processId: result.owner?.processId || null,
                    path: result.owner?.path || null
                },
                timestamp: Date.now()
            };

            // Check if window changed
            const hasChanged = !this.currentWindow ||
                this.currentWindow.title !== windowData.title ||
                this.currentWindow.owner.name !== windowData.owner.name;

            if (hasChanged) {
                this.currentWindow = windowData;
                this.emitWindowChanged(windowData);

                logger.debug('Active window changed', {
                    context: 'ActiveWindow',
                    app: windowData.owner.name,
                    title: windowData.title.substring(0, 50)
                });
            }
        } catch (error) {
            // active-win can fail on some platforms/situations
            logger.debug('Failed to get active window', {
                context: 'ActiveWindow',
                error: error.message
            });
        }
    }

    /**
     * Get current window information
     */
    getCurrentWindow() {
        return this.currentWindow || {
            title: null,
            owner: {
                name: null,
                processId: null,
                path: null
            },
            timestamp: Date.now()
        };
    }

    /**
     * Stop monitoring
     */
    async stop() {
        if (!this.isRunning) {
            return;
        }

        logger.info('Stopping Active Window detection...', { context: 'ActiveWindow' });

        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }

        this.isRunning = false;
        this.currentWindow = null;

        logger.info('Active Window detection stopped', { context: 'ActiveWindow' });
    }
}

module.exports = ActiveWindowDetector;
