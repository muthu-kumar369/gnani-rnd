// electron/device/battery-monitor.js
const EventEmitter = require('events');
const { powerMonitor } = require('electron');
const logger = require('../utils/logger');

/**
 * Battery Monitor
 * Monitors battery level, charging status, and power source
 */
class BatteryMonitor extends EventEmitter {
    constructor() {
        super();
        this.currentStatus = null;
        this.isRunning = false;
        this.updateInterval = null;

        logger.debug('BatteryMonitor created', { context: 'BatteryMonitor' });
    }

    /**
     * Start monitoring battery status
     */
    async start() {
        if (this.isRunning) {
            logger.warn('BatteryMonitor already running', { context: 'BatteryMonitor' });
            return;
        }

        logger.info('Starting Battery monitoring...', { context: 'BatteryMonitor' });

        // Get initial status
        await this.updateBatteryStatus();

        // Listen to power monitor events
        powerMonitor.on('on-ac', () => {
            logger.debug('Power source changed to AC', { context: 'BatteryMonitor' });
            this.updateBatteryStatus();
        });

        powerMonitor.on('on-battery', () => {
            logger.debug('Power source changed to Battery', { context: 'BatteryMonitor' });
            this.updateBatteryStatus();
        });

        // Poll for battery level changes (every 30 seconds)
        this.updateInterval = setInterval(() => {
            this.updateBatteryStatus().catch(err => {
                logger.error('Error updating battery status', err, { context: 'BatteryMonitor' });
            });
        }, 30000);

        this.isRunning = true;
        logger.info('Battery monitoring started', { context: 'BatteryMonitor' });
    }

    /**
     * Update battery status
     */
    async updateBatteryStatus() {
        try {
            const isOnBattery = powerMonitor.isOnBatteryPower();

            // Note: Electron doesn't provide battery level directly
            // We'll use a workaround or native module if needed
            // For now, we'll use navigator.getBattery() equivalent via systeminformation
            const si = require('systeminformation');
            const battery = await si.battery();

            const status = {
                hasBattery: battery.hasBattery,
                isCharging: battery.isCharging,
                level: battery.percent || 0,
                timeRemaining: battery.timeRemaining || null, // minutes
                onAC: !isOnBattery,
                onBattery: isOnBattery,
                timestamp: Date.now()
            };

            // Check if status changed
            const hasChanged = !this.currentStatus ||
                this.currentStatus.level !== status.level ||
                this.currentStatus.isCharging !== status.isCharging ||
                this.currentStatus.onAC !== status.onAC;

            if (hasChanged) {
                this.currentStatus = status;
                this.emit('battery-changed', status);

                logger.debug('Battery status changed', {
                    context: 'BatteryMonitor',
                    level: status.level,
                    charging: status.isCharging
                });
            }
        } catch (error) {
            logger.error('Failed to get battery status', error, { context: 'BatteryMonitor' });

            // Fallback status
            this.currentStatus = {
                hasBattery: false,
                isCharging: false,
                level: 0,
                timeRemaining: null,
                onAC: true,
                onBattery: false,
                timestamp: Date.now()
            };
        }
    }

    /**
     * Get current battery status
     */
    getCurrentStatus() {
        return this.currentStatus || {
            hasBattery: false,
            isCharging: false,
            level: 0,
            timeRemaining: null,
            onAC: true,
            onBattery: false,
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

        logger.info('Stopping Battery monitoring...', { context: 'BatteryMonitor' });

        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }

        // Remove event listeners
        powerMonitor.removeAllListeners('on-ac');
        powerMonitor.removeAllListeners('on-battery');

        this.isRunning = false;
        this.currentStatus = null;

        logger.info('Battery monitoring stopped', { context: 'BatteryMonitor' });
    }
}

module.exports = BatteryMonitor;
