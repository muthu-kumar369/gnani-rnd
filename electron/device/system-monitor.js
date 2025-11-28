// electron/device/system-monitor.js
const EventEmitter = require('events');
const si = require('systeminformation');
const throttle = require('lodash.throttle');
const logger = require('../utils/logger');

/**
 * System Monitor
 * Monitors CPU, Memory, Disk, and system uptime
 */
class SystemMonitor extends EventEmitter {
    constructor(options = {}) {
        super();
        this.pollInterval = options.pollInterval || 2000; // 2 seconds
        this.intervalId = null;
        this.currentStatus = null;
        this.isRunning = false;

        // Throttle the emit
        this.emitStatusUpdate = throttle((data) => {
            this.emit('status-update', data);
        }, 1000);

        logger.debug('SystemMonitor created', { context: 'SystemMonitor' });
    }

    /**
     * Start monitoring system status
     */
    async start() {
        if (this.isRunning) {
            logger.warn('SystemMonitor already running', { context: 'SystemMonitor' });
            return;
        }

        logger.info('Starting System monitoring...', { context: 'SystemMonitor' });

        // Get initial status
        await this.updateSystemStatus();

        // Start polling
        this.intervalId = setInterval(() => {
            this.updateSystemStatus().catch(err => {
                logger.error('Error updating system status', err, { context: 'SystemMonitor' });
            });
        }, this.pollInterval);

        this.isRunning = true;
        logger.info('System monitoring started', { context: 'SystemMonitor' });
    }

    /**
     * Update system status
     */
    async updateSystemStatus() {
        try {
            // Get CPU, Memory, and Disk info in parallel
            const [cpu, mem, disk, uptime] = await Promise.all([
                si.currentLoad(),
                si.mem(),
                si.fsSize(),
                si.time()
            ]);

            const status = {
                cpu: {
                    usage: Math.round(cpu.currentLoad * 10) / 10, // Round to 1 decimal
                    cores: cpu.cpus?.length || 0,
                    speed: cpu.avgLoad || 0
                },
                memory: {
                    total: mem.total,
                    used: mem.used,
                    free: mem.free,
                    usagePercent: Math.round((mem.used / mem.total) * 100 * 10) / 10
                },
                disk: disk.map(d => ({
                    fs: d.fs,
                    type: d.type,
                    size: d.size,
                    used: d.used,
                    available: d.available,
                    usagePercent: Math.round(d.use * 10) / 10,
                    mount: d.mount
                })),
                uptime: uptime.uptime, // in seconds
                timestamp: Date.now()
            };

            this.currentStatus = status;
            this.emitStatusUpdate(status);

        } catch (error) {
            logger.error('Failed to get system status', error, { context: 'SystemMonitor' });
        }
    }

    /**
     * Get current system status
     */
    getCurrentStatus() {
        return this.currentStatus || {
            cpu: { usage: 0, cores: 0, speed: 0 },
            memory: { total: 0, used: 0, free: 0, usagePercent: 0 },
            disk: [],
            uptime: 0,
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

        logger.info('Stopping System monitoring...', { context: 'SystemMonitor' });

        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }

        this.isRunning = false;
        this.currentStatus = null;

        logger.info('System monitoring stopped', { context: 'SystemMonitor' });
    }
}

module.exports = SystemMonitor;
