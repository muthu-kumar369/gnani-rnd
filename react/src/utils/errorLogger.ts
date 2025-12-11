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
  [key: string]: any; // Allow any additional properties
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

// History buffer for Monitoring Dashboard
const history: { timestamp: number; level: string; message: string; context?: string; error?: any }[] = [];
const MAX_HISTORY = 100;

const logToHistory = (level: string, message: string, options: LogOptions, error?: any) => {
  history.unshift({
    timestamp: Date.now(),
    level,
    message,
    context: options.context,
    error
  });
  if (history.length > MAX_HISTORY) {
    history.pop();
  }
};

const errorLogger = {
  log: (message: string, options?: LogOptions) => {
    const opts = { ...defaultOptions, ...options };
    console.log(formatMessage('info', message, opts), opts.extra || '');
    if (window.gnani) window.gnani.send('log', { level: 'info', message, context: opts.context, extra: opts.extra });
    logToHistory('info', message, opts);
  },
  info: (message: string, options?: LogOptions) => {
    const opts = { ...defaultOptions, ...options };
    console.info(formatMessage('info', message, opts), opts.extra || '');
    if (window.gnani) window.gnani.send('log', { level: 'info', message, context: opts.context, extra: opts.extra });
    logToHistory('info', message, opts);
  },
  warn: (message: string, options?: LogOptions) => {
    const opts = { ...defaultOptions, ...options };
    console.warn(formatMessage('warn', message, opts), opts.extra || '');
    if (window.gnani) window.gnani.send('log', { level: 'warn', message, context: opts.context, extra: opts.extra });
    logToHistory('warn', message, opts);
  },
  error: (message: string, error?: Error | any, options?: LogOptions) => {
    const opts = { ...defaultOptions, ...options };
    console.error(formatMessage('error', message, opts), error, opts.extra || '');
    if (window.gnani) window.gnani.send('log', { level: 'error', message, context: opts.context, extra: { ...opts.extra, error: error?.message || error } });
    logToHistory('error', message, opts, error);
  },
  debug: (message: string, options?: LogOptions) => {
    if (import.meta.env.MODE === 'development') {
      const opts = { ...defaultOptions, ...options };
      console.debug(formatMessage('debug', message, opts), opts.extra || '');
      if (window.gnani) window.gnani.send('log', { level: 'debug', message, context: opts.context, extra: opts.extra });
    }
    // Note: Debug logs are NOT stored in history to avoid noise
  },
  getHistory: () => [...history],
  clearHistory: () => { history.length = 0; }
};

export default errorLogger;
