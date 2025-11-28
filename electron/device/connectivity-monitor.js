// electron/device/connectivity-monitor.js
const EventEmitter = require('events');
const isOnline = require('is-online');
const logger = require('../utils/logger');

/**
 * Connectivity Monitor
 * Monitors internet connectivity and network status
 */
class ConnectivityMonitor extends EventEmitter {
    constructor(options = {}) {
        super();
        this.checkInterval = options.checkInterval || 30000; // 30 seconds
        this.intervalId = null;
        this.currentStatus = null;
        this.isRunning = false;

        logger.debug('ConnectivityMonitor created', { context: 'ConnectivityMonitor' });
    }

    /**
     * Start monitoring connectivity
     */
    async start() {
        if (this.isRunning) {
            logger.warn('ConnectivityMonitor already running', { context: 'ConnectivityMonitor' });
            return;
        }

        logger.info('Starting Connectivity monitoring...', { context: 'ConnectivityMonitor' });

        // Get initial status
        await this.checkConnectivity();

        // Start polling
        this.intervalId = setInterval(() => {
            this.checkConnectivity().catch(err => {
                logger.error('Error checking connectivity', err, { context: 'ConnectivityMonitor' });
            });
        }, this.checkInterval);

        this.isRunning = true;
        logger.info('Connectivity monitoring started', { context: 'ConnectivityMonitor' });
    }

    /**
     * Check connectivity status
     */
    async checkConnectivity() {
        try {
            const startTime = Date.now();
            const online = await isOnline({
                timeout: 5000 // 5 second timeout
            });
            const latency = Date.now() - startTime;

            const status = {
                online,
                latency: online ? latency : null,
                timestamp: Date.now()
            };

            // Check if status changed
            const hasChanged = !this.currentStatus ||
                this.currentStatus.online !== status.online;

            if (hasChanged) {
                this.currentStatus = status;
                this.emit('connectivity-changed', status);

                logger.info('Connectivity status changed', {
                    context: 'ConnectivityMonitor',
                    online: status.online,
                    latency: status.latency
                });
            } else {
                // Update latency even if online status didn't change
                this.currentStatus = status;
            }
        } catch (error) {
            logger.error('Failed to check connectivity', error, { context: 'ConnectivityMonitor' });

            // Assume offline on error
            const status = {
                online: false,
                latency: null,
                timestamp: Date.now()
            };

            if (!this.currentStatus || this.currentStatus.online !== false) {
                this.currentStatus = status;
                this.emit('connectivity-changed', status);
            }
        }
    }

    /**
     * Get current connectivity status
     */
    getCurrentStatus() {
        return this.currentStatus || {
            online: false,
            latency: null,
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

        logger.info('Stopping Connectivity monitoring...', { context: 'ConnectivityMonitor' });

        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }

        this.isRunning = false;
        this.currentStatus = null;

        logger.info('Connectivity monitoring stopped', { context: 'ConnectivityMonitor' });
    }
}

module.exports = ConnectivityMonitor;
