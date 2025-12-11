type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'perf';

interface LogEntry {
    level: LogLevel;
    message: string;
    timestamp: number;
    context?: Record<string, any>;
    [key: string]: any;
}

/**
 * Logger - Structured logging utility
 * Stage 4 Task 4.6: Comprehensive Logging
 */
class Logger {
    private context: Record<string, any> = {};
    private minLevel: LogLevel = 'info';

    constructor() {
        // Set log level from environment
        const envLevel = import.meta.env.VITE_LOG_LEVEL as LogLevel;
        if (envLevel) {
            this.minLevel = envLevel;
        }
    }

    /**
     * Set global context for all logs
     */
    setContext(context: Record<string, any>) {
        this.context = { ...this.context, ...context };
    }

    /**
     * Clear global context
     */
    clearContext() {
        this.context = {};
    }

    /**
     * Check if level should be logged
     */
    private shouldLog(level: LogLevel): boolean {
        const levels: LogLevel[] = ['debug', 'info', 'warn', 'error', 'perf'];
        const minIndex = levels.indexOf(this.minLevel);
        const currentIndex = levels.indexOf(level);
        return currentIndex >= minIndex;
    }

    /**
     * Format and output log entry
     */
    private log(entry: LogEntry) {
        if (!this.shouldLog(entry.level)) return;

        const output = JSON.stringify({
            ...entry,
            ...this.context
        });

        switch (entry.level) {
            case 'error':
                console.error(output);
                break;
            case 'warn':
                console.warn(output);
                break;
            case 'debug':
                console.debug(output);
                break;
            default:
                console.log(output);
        }
    }

    /**
     * Debug log
     */
    debug(message: string, data?: any) {
        this.log({
            level: 'debug',
            message,
            timestamp: Date.now(),
            ...data
        });
    }

    /**
     * Info log
     */
    info(message: string, data?: any) {
        this.log({
            level: 'info',
            message,
            timestamp: Date.now(),
            ...data
        });
    }

    /**
     * Warning log
     */
    warn(message: string, data?: any) {
        this.log({
            level: 'warn',
            message,
            timestamp: Date.now(),
            ...data
        });
    }

    /**
     * Error log
     */
    error(message: string, error: Error | any, context?: any) {
        this.log({
            level: 'error',
            message,
            error: error?.message || String(error),
            stack: error?.stack,
            timestamp: Date.now(),
            ...context
        });
    }

    /**
     * Performance log
     */
    perf(operation: string, data: any) {
        this.log({
            level: 'perf',
            message: `Performance: ${operation}`,
            operation,
            timestamp: Date.now(),
            ...data
        });
    }

    /**
     * Log with custom level
     */
    custom(level: LogLevel, message: string, data?: any) {
        this.log({
            level,
            message,
            timestamp: Date.now(),
            ...data
        });
    }
}

export const logger = new Logger();

// Helper for performance measurement
export function measurePerf<T>(
    operation: string,
    fn: () => T | Promise<T>
): T | Promise<T> {
    const start = Date.now();

    try {
        const result = fn();

        if (result instanceof Promise) {
            return result.then(value => {
                logger.perf(operation, {
                    duration: Date.now() - start,
                    success: true
                });
                return value;
            }).catch(error => {
                logger.perf(operation, {
                    duration: Date.now() - start,
                    success: false,
                    error: error.message
                });
                throw error;
            }) as T;
        }

        logger.perf(operation, {
            duration: Date.now() - start,
            success: true
        });

        return result;
    } catch (error: any) {
        logger.perf(operation, {
            duration: Date.now() - start,
            success: false,
            error: error.message
        });
        throw error;
    }
}
