// electron/device/audio-device-manager.js
const EventEmitter = require('events');
const { systemPreferences } = require('electron');
const logger = require('../utils/logger');

/**
 * Audio Device Manager
 * Monitors audio input/output devices
 */
class AudioDeviceManager extends EventEmitter {
    constructor() {
        super();
        this.devices = { input: [], output: [] };
        this.isRunning = false;
        this.checkInterval = null;

        logger.debug('AudioDeviceManager created', { context: 'AudioDeviceManager' });
    }

    /**
     * Start monitoring audio devices
     */
    async start() {
        if (this.isRunning) {
            logger.warn('AudioDeviceManager already running', { context: 'AudioDeviceManager' });
            return;
        }

        logger.info('Starting Audio Device monitoring...', { context: 'AudioDeviceManager' });

        // Request microphone permission on macOS
        if (process.platform === 'darwin') {
            try {
                const status = await systemPreferences.getMediaAccessStatus('microphone');
                if (status !== 'granted') {
                    logger.warn('Microphone permission not granted', { context: 'AudioDeviceManager' });
                    await systemPreferences.askForMediaAccess('microphone');
                }
            } catch (error) {
                logger.error('Error requesting microphone permission', error, { context: 'AudioDeviceManager' });
            }
        }

        // Get initial devices
        await this.updateDevices();

        // Poll for device changes (every 5 seconds)
        this.checkInterval = setInterval(() => {
            this.updateDevices().catch(err => {
                logger.error('Error updating audio devices', err, { context: 'AudioDeviceManager' });
            });
        }, 5000);

        this.isRunning = true;
        logger.info('Audio Device monitoring started', { context: 'AudioDeviceManager' });
    }

    /**
     * Update audio devices list
     */
    async updateDevices() {
        try {
            // Use navigator.mediaDevices.enumerateDevices() equivalent
            // In Electron main process, we need to use a different approach
            // For now, we'll use a placeholder implementation

            // Note: Full implementation would require:
            // 1. Using node-core-audio or similar native module
            // 2. Or exposing navigator.mediaDevices from renderer
            // 3. Or using platform-specific APIs

            const devices = {
                input: [
                    {
                        id: 'default',
                        label: 'Default Microphone',
                        kind: 'audioinput'
                    }
                ],
                output: [
                    {
                        id: 'default',
                        label: 'Default Speaker',
                        kind: 'audiooutput'
                    }
                ],
                timestamp: Date.now()
            };

            // Check if devices changed
            const hasChanged = JSON.stringify(this.devices.input) !== JSON.stringify(devices.input) ||
                JSON.stringify(this.devices.output) !== JSON.stringify(devices.output);

            if (hasChanged) {
                this.devices = devices;
                this.emit('devices-changed', devices);

                logger.debug('Audio devices changed', {
                    context: 'AudioDeviceManager',
                    inputCount: devices.input.length,
                    outputCount: devices.output.length
                });
            }
        } catch (error) {
            logger.error('Failed to update audio devices', error, { context: 'AudioDeviceManager' });
        }
    }

    /**
     * Get current audio devices
     */
    getDevices() {
        return this.devices;
    }

    /**
     * Stop monitoring
     */
    async stop() {
        if (!this.isRunning) {
            return;
        }

        logger.info('Stopping Audio Device monitoring...', { context: 'AudioDeviceManager' });

        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }

        this.isRunning = false;
        this.devices = { input: [], output: [] };

        logger.info('Audio Device monitoring stopped', { context: 'AudioDeviceManager' });
    }
}

module.exports = AudioDeviceManager;
