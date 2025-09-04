// No file imports needed - console logging only

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

// Log levels
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

const currentLogLevel = LOG_LEVELS[process.env.LOG_LEVEL?.toUpperCase()] ?? LOG_LEVELS.INFO;

// Format timestamp
const getTimestamp = () => {
  return new Date().toISOString().replace('T', ' ').substring(0, 19);
};

// Write to log file
// No file logging - console only

// Console logger with colors
const consoleLog = (level, color, message, meta = {}) => {
  const timestamp = getTimestamp().substring(11); // Just time part
  const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta, null, 2)}` : '';
  
  if (process.env.NODE_ENV !== 'production') {
    console.log(`${color}${timestamp} [${level}]:${colors.reset} ${message}${metaStr}`);
  }
  
  // No file logging - console only
};

// Logger object
const logger = {
  error: (message, meta = {}) => {
    if (currentLogLevel >= LOG_LEVELS.ERROR) {
      consoleLog('ERROR', colors.red, message, meta);
    }
  },
  
  warn: (message, meta = {}) => {
    if (currentLogLevel >= LOG_LEVELS.WARN) {
      consoleLog('WARN', colors.yellow, message, meta);
    }
  },
  
  info: (message, meta = {}) => {
    if (currentLogLevel >= LOG_LEVELS.INFO) {
      consoleLog('INFO', colors.blue, message, meta);
    }
  },
  
  debug: (message, meta = {}) => {
    if (currentLogLevel >= LOG_LEVELS.DEBUG) {
      consoleLog('DEBUG', colors.cyan, message, meta);
    }
  }
};

// Create request logger middleware
export const requestLogger = (req, res, next) => {
  const start = Date.now();
  const { method, url, ip } = req;
  
  // Log request
  logger.info('Incoming request', {
    method,
    url,
    ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id || null
  });

  // Override res.json to log response
  const originalJson = res.json;
  res.json = function(body) {
    const duration = Date.now() - start;
    const { statusCode } = res;
    
    const logLevel = statusCode >= 400 ? 'error' : 'info';
    logger[logLevel]('Response sent', {
      method,
      url,
      statusCode,
      duration: `${duration}ms`,
      userId: req.user?.id || null,
      success: body?.success || null,
      errorMsg: body?.msg || null
    });
    
    return originalJson.call(this, body);
  };

  next();
};

// Helper functions for different log levels
export const logInfo = (message, meta = {}) => {
  logger.info(message, meta);
};

export const logError = (message, error = null, meta = {}) => {
  logger.error(message, {
    ...meta,
    error: error ? {
      message: error.message,
      stack: error.stack,
      name: error.name
    } : null
  });
};

export const logWarn = (message, meta = {}) => {
  logger.warn(message, meta);
};

export const logDebug = (message, meta = {}) => {
  logger.debug(message, meta);
};

export default logger;
