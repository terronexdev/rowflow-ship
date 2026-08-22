import pino from 'pino';

const isDevelopment = process.env.NODE_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test';

// Create logger instance with environment-specific configuration
const logger = pino({
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),

  // Pretty print in development for better readability
  ...(isDevelopment && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    },
  }),

  // Disable logging in test environment unless explicitly enabled
  ...(isTest && !process.env.ENABLE_TEST_LOGS && {
    level: 'silent',
  }),

  // Production configuration
  ...(!isDevelopment && !isTest && {
    formatters: {
      level: (label) => {
        return { level: label };
      },
    },
    timestamp: pino.stdTimeFunctions.isoTime,
  }),

  // Base fields included in all logs
  base: {
    env: process.env.NODE_ENV,
  },
});

// Helper functions for common logging patterns
export const log = {
  // Info level - general application information
  info: (message: string, meta?: Record<string, any>) => {
    logger.info(meta, message);
  },

  // Error level - errors that need attention
  error: (message: string, error?: Error | unknown, meta?: Record<string, any>) => {
    if (error instanceof Error) {
      logger.error({ ...meta, err: error, stack: error.stack }, message);
    } else {
      logger.error({ ...meta, error }, message);
    }
  },

  // Warn level - warnings that should be investigated
  warn: (message: string, meta?: Record<string, any>) => {
    logger.warn(meta, message);
  },

  // Debug level - detailed debugging information
  debug: (message: string, meta?: Record<string, any>) => {
    logger.debug(meta, message);
  },

  // API request logging
  apiRequest: (method: string, path: string, meta?: Record<string, any>) => {
    logger.info({ method, path, ...meta }, `API ${method} ${path}`);
  },

  // API response logging
  apiResponse: (method: string, path: string, status: number, duration?: number, meta?: Record<string, any>) => {
    logger.info({ method, path, status, duration, ...meta }, `API ${method} ${path} - ${status}`);
  },

  // Database query logging
  dbQuery: (query: string, duration?: number, meta?: Record<string, any>) => {
    logger.debug({ query, duration, ...meta }, 'Database query executed');
  },

  // Authentication events
  authEvent: (event: string, userId?: string, meta?: Record<string, any>) => {
    logger.info({ event, userId, ...meta }, `Auth: ${event}`);
  },

  // Payment events
  paymentEvent: (event: string, customerId?: string, meta?: Record<string, any>) => {
    logger.info({ event, customerId, ...meta }, `Payment: ${event}`);
  },
};

// Export both the logger instance and helper functions
export default logger;
