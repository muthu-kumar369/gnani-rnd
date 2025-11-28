// electron/device/index.js
const EventEmitter = require('events');
const logger = require('../utils/logger');
const ActiveWindowDetector = require('./active-window');
const SystemMonitor = require('./system-monitor');
const BatteryMonitor = require('./battery-monitor');
const ConnectivityMonitor = require('./connectivity-monitor');
const AudioDeviceManager = require('./audio-device-manager');

/**
 * OS Awareness Manager
 * Central hub for all device and system awareness features
 */
class OSAwarenessManager extends EventEmitter {
    constructor() {
        super();
        this.activeWindowDetector = null;
        this.systemMonitor = null;
        this.batteryMonitor = null;
        this.connectivityMonitor = null;
        this.audioDeviceManager = null;
        this.isInitialized = false;

        logger.info('OSAwarenessManager created', { context: 'OSAwareness' });
    }

    /**
     * Initialize all monitoring modules
     */
    async initialize() {
        if (this.isInitialized) {
            logger.warn('OSAwarenessManager already initialized', { context: 'OSAwareness' });
            return;
        }

        try {
            logger.info('Initializing OS Awareness modules...', { context: 'OSAwareness' });

            // Initialize Active Window Detector
            logger.info('Initializing Active Window Detector...', { context: 'OSAwareness' });
            this.activeWindowDetector = new ActiveWindowDetector();
            this.activeWindowDetector.on('window-changed', (data) => {
                this.emit('active-window-changed', data);
            });
            await this.activeWindowDetector.start();
            logger.info('Active Window Detector initialized.', { context: 'OSAwareness' });

            // Initialize System Monitor
            logger.info('Initializing System Monitor...', { context: 'OSAwareness' });
            this.systemMonitor = new SystemMonitor();
            this.systemMonitor.on('status-update', (data) => {
                this.emit('system-status-update', data);
            });
            await this.systemMonitor.start();
            logger.info('System Monitor initialized.', { context: 'OSAwareness' });

            // Initialize Battery Monitor
            logger.info('Initializing Battery Monitor...', { context: 'OSAwareness' });
            this.batteryMonitor = new BatteryMonitor();
            this.batteryMonitor.on('battery-changed', (data) => {
                this.emit('battery-changed', data);
            });
            await this.batteryMonitor.start();
            logger.info('Battery Monitor initialized.', { context: 'OSAwareness' });

            // Initialize Connectivity Monitor
            logger.info('Initializing Connectivity Monitor...', { context: 'OSAwareness' });
            this.connectivityMonitor = new ConnectivityMonitor();
            this.connectivityMonitor.on('connectivity-changed', (data) => {
                this.emit('connectivity-changed', data);
            });
            await this.connectivityMonitor.start();
            logger.info('Connectivity Monitor initialized.', { context: 'OSAwareness' });

            // Initialize Audio Device Manager
            logger.info('Initializing Audio Device Manager...', { context: 'OSAwareness' });
            this.audioDeviceManager = new AudioDeviceManager();
            this.audioDeviceManager.on('devices-changed', (data) => {
                this.emit('audio-devices-changed', data);
            });
            await this.audioDeviceManager.start();
            logger.info('Audio Device Manager initialized.', { context: 'OSAwareness' });

            this.isInitialized = true;
            logger.info('OS Awareness modules initialized successfully', { context: 'OSAwareness' });
        } catch (error) {
            logger.error('Failed to initialize OS Awareness modules', error, { context: 'OSAwareness' });
            throw error;
        }
    }

    /**
     * Get current active window information
     */
    async getActiveWindow() {
        if (!this.activeWindowDetector) {
            throw new Error('Active Window Detector not initialized');
        }
        return this.activeWindowDetector.getCurrentWindow();
    }

    /**
     * Get current system status
     */
    async getSystemStatus() {
        if (!this.systemMonitor) {
            throw new Error('System Monitor not initialized');
        }
        return this.systemMonitor.getCurrentStatus();
    }

    /**
     * Get current battery status
     */
    async getBatteryStatus() {
        if (!this.batteryMonitor) {
            throw new Error('Battery Monitor not initialized');
        }
        return this.batteryMonitor.getCurrentStatus();
    }

    /**
     * Get current connectivity status
     */
    async getConnectivityStatus() {
        if (!this.connectivityMonitor) {
            throw new Error('Connectivity Monitor not initialized');
        }
        return this.connectivityMonitor.getCurrentStatus();
    }

    /**
     * Get audio devices
     */
    async getAudioDevices() {
        if (!this.audioDeviceManager) {
            throw new Error('Audio Device Manager not initialized');
        }
        return this.audioDeviceManager.getDevices();
    }

    /**
     * Cleanup and stop all monitoring
     */
    async cleanup() {
        logger.info('Cleaning up OS Awareness modules...', { context: 'OSAwareness' });

        if (this.activeWindowDetector) {
            await this.activeWindowDetector.stop();
        }
        if (this.systemMonitor) {
            await this.systemMonitor.stop();
        }
        if (this.batteryMonitor) {
            await this.batteryMonitor.stop();
        }
        if (this.connectivityMonitor) {
            await this.connectivityMonitor.stop();
        }
        if (this.audioDeviceManager) {
            await this.audioDeviceManager.stop();
        }

        this.isInitialized = false;
        logger.info('OS Awareness modules cleaned up', { context: 'OSAwareness' });
    }
}

// Singleton instance
let instance = null;

module.exports = {
    getInstance: () => {
        if (!instance) {
            instance = new OSAwarenessManager();
        }
        return instance;
    },
    OSAwarenessManager
};
