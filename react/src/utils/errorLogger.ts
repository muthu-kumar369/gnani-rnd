// react/src/utils/errorLogger.ts

/**
 * @file Centralized error logging utility for the React application.
 * This utility can be extended to send errors to an external logging service (e.g., Sentry, LogRocket).
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogOptions {
  context?: string; // Additional context for the log message
  tags?: { [key: string]: string }; // Key-value tags for filtering/analysis
  extra?: any; // Any extra data to attach to the log
}

const defaultOptions: LogOptions = {
  context: 'Frontend',
  tags: {},
  extra: null,
};

function formatMessage(level: LogLevel, message: string, options: LogOptions): string {
  const timestamp = new Date().toISOString();
  const context = options.context ? `[${options.context}]` : '';
  const tags = options.tags ? Object.entries(options.tags).map(([key, value]) => `${key}:${value}`).join(' ') : '';
  return `${timestamp} ${level.toUpperCase()} ${context} ${message} ${tags}`;
}

const errorLogger = {
  log: (message: string, options?: LogOptions) => {
    const opts = { ...defaultOptions, ...options };
    console.log(formatMessage('info', message, opts), opts.extra || '');
    // TODO: Integrate with external logging service for info messages
  },
  info: (message: string, options?: LogOptions) => {
    const opts = { ...defaultOptions, ...options };
    console.info(formatMessage('info', message, opts), opts.extra || '');
    // TODO: Integrate with external logging service for info messages
  },
  warn: (message: string, options?: LogOptions) => {
    const opts = { ...defaultOptions, ...options };
    console.warn(formatMessage('warn', message, opts), opts.extra || '');
    // TODO: Integrate with external logging service for warnings
  },
  error: (message: string, error?: Error | any, options?: LogOptions) => {
    const opts = { ...defaultOptions, ...options };
    console.error(formatMessage('error', message, opts), error, opts.extra || '');
    // TODO: Integrate with external logging service for errors (e.g., Sentry.captureException(error))
  },
  debug: (message: string, options?: LogOptions) => {
    if (process.env.NODE_ENV === 'development') {
      const opts = { ...defaultOptions, ...options };
      console.debug(formatMessage('debug', message, opts), opts.extra || '');
    }
  },
};

export default errorLogger;
