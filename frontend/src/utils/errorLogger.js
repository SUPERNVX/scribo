// Structured Error Logging System
import { storage } from './storage';

/**
 * Log Levels
 */
export const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  CRITICAL: 4,
};

/**
 * Error Categories
 */
export const ERROR_CATEGORIES = {
  NETWORK: 'network',
  AUTHENTICATION: 'authentication',
  VALIDATION: 'validation',
  RUNTIME: 'runtime',
  PERFORMANCE: 'performance',
  USER_ACTION: 'user_action',
  EXTERNAL_SERVICE: 'external_service',
};

/**
 * Structured Error Logger Class
 */
class ErrorLogger {
  constructor() {
    this.logs = [];
    this.maxLogs = 1000; // Keep last 1000 logs in memory
    this.logLevel = process.env.NODE_ENV === 'development' ? LOG_LEVELS.DEBUG : LOG_LEVELS.WARN;
    this.enableConsoleOutput = process.env.NODE_ENV === 'development';
    this.enableRemoteLogging = process.env.NODE_ENV === 'production';
    
    // Initialize from localStorage
    this.loadStoredLogs();
    
    // Setup periodic log cleanup
    this.setupLogCleanup();
  }

  /**
   * Load stored logs from localStorage
   */
  loadStoredLogs() {
    try {
      const storedLogs = localStorage.getItem('error_logs');
      if (storedLogs) {
        const parsedLogs = JSON.parse(storedLogs);
        if (Array.isArray(parsedLogs)) {
          this.logs = parsedLogs.slice(-this.maxLogs);
        }
      }
    } catch (error) {
      console.warn('Failed to load stored logs:', error);
    }
  }

  /**
   * Save logs to localStorage
   */
  saveLogsToStorage() {
    try {
      localStorage.setItem('error_logs', JSON.stringify(this.logs.slice(-this.maxLogs)));
    } catch (error) {
      console.warn('Failed to save logs to storage:', error);
    }
  }

  /**
   * Setup periodic log cleanup
   */
  setupLogCleanup() {
    // Clean up old logs every 5 minutes
    setInterval(() => {
      this.cleanupOldLogs();
    }, 5 * 60 * 1000);
  }

  /**
   * Clean up logs older than 24 hours
   */
  cleanupOldLogs() {
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    this.logs = this.logs.filter(log => log.timestamp > oneDayAgo);
    this.saveLogsToStorage();
  }

  /**
   * Create structured log entry
   */
  createLogEntry(level, message, error = null, context = {}) {
    const logEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      level,
      message,
      category: this.categorizeError(error, context),
      error: error ? this.serializeError(error) : null,
      context: this.sanitizeContext(context),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: this.getCurrentUserId(),
      sessionId: this.getSessionId(),
      buildVersion: process.env.REACT_APP_VERSION || 'unknown',
    };

    return logEntry;
  }

  /**
   * Serialize error object for logging
   */
  serializeError(error) {
    if (!error) return null;

    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code,
      status: error.status || error.response?.status,
      response: error.response ? {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
      } : null,
    };
  }

  /**
   * Sanitize context to remove sensitive information
   */
  sanitizeContext(context) {
    const sanitized = { ...context };
    
    // Remove sensitive fields
    const sensitiveFields = ['password', 'token', 'authorization', 'secret', 'key'];
    
    const sanitizeObject = (obj, depth = 0) => {
      if (!obj || typeof obj !== 'object' || depth > 5) return obj;
      if (obj === null || obj instanceof Date || obj instanceof RegExp) return obj;
      
      // Prevent circular references
      if (obj.__sanitized) return '[Circular]';
      obj.__sanitized = true;
      
      const result = {};
      try {
        for (const [key, value] of Object.entries(obj)) {
          if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
            result[key] = '[REDACTED]';
          } else if (typeof value === 'object' && value !== null) {
            result[key] = sanitizeObject(value, depth + 1);
          } else {
            result[key] = value;
          }
        }
      } catch (e) {
        return '[Error sanitizing object]';
      } finally {
        delete obj.__sanitized;
      }
      return result;
    };

    return sanitizeObject(sanitized);
  }

  /**
   * Categorize error based on type and context
   */
  categorizeError(error, context) {
    if (!error) return ERROR_CATEGORIES.RUNTIME;

    const message = error.message?.toLowerCase() || '';
    const stack = error.stack?.toLowerCase() || '';

    if (message.includes('network') || message.includes('fetch') || error.code === 'NETWORK_ERROR') {
      return ERROR_CATEGORIES.NETWORK;
    }

    if (message.includes('401') || message.includes('unauthorized') || message.includes('authentication')) {
      return ERROR_CATEGORIES.AUTHENTICATION;
    }

    if (message.includes('400') || message.includes('validation') || context.type === 'validation') {
      return ERROR_CATEGORIES.VALIDATION;
    }

    if (message.includes('performance') || context.type === 'performance') {
      return ERROR_CATEGORIES.PERFORMANCE;
    }

    if (context.userAction) {
      return ERROR_CATEGORIES.USER_ACTION;
    }

    if (message.includes('external') || stack.includes('external')) {
      return ERROR_CATEGORIES.EXTERNAL_SERVICE;
    }

    return ERROR_CATEGORIES.RUNTIME;
  }

  /**
   * Get current user ID
   */
  getCurrentUserId() {
    try {
      const user = storage.getUser();
      return user?.id || 'anonymous';
    } catch {
      return 'anonymous';
    }
  }

  /**
   * Get or create session ID
   */
  getSessionId() {
    let sessionId = sessionStorage.getItem('session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('session_id', sessionId);
    }
    return sessionId;
  }

  /**
   * Check if error should be filtered out (not logged)
   */
  shouldFilterError(error, context) {
    // Filter out external API errors that are expected to fail
    const url = context.url || '';
    if (url.includes('api.quotable.io') || url.includes('languagetool.org')) {
      return true;
    }
    
    // Filter out prefetch/preload errors
    if (context.context === 'fetch_interceptor' && url.includes('quotable')) {
      return true;
    }
    
    return false;
  }

  /**
   * Log error with specified level
   */
  log(level, message, error = null, context = {}) {
    if (level < this.logLevel) return;
    
    // Filter out expected external API errors
    if (this.shouldFilterError(error, context)) {
      return;
    }

    const logEntry = this.createLogEntry(level, message, error, context);
    
    // Add to memory logs
    this.logs.push(logEntry);
    
    // Keep only recent logs in memory
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Save to localStorage
    this.saveLogsToStorage();

    // Console output for development
    if (this.enableConsoleOutput) {
      this.outputToConsole(logEntry);
    }

    // Send to remote logging service
    if (this.enableRemoteLogging && level >= LOG_LEVELS.ERROR) {
      this.sendToRemoteService(logEntry);
    }

    return logEntry.id;
  }

  /**
   * Output log to console with appropriate styling
   */
  outputToConsole(logEntry) {
    const { level, message, error, context } = logEntry;
    
    const styles = {
      [LOG_LEVELS.DEBUG]: 'color: #6b7280',
      [LOG_LEVELS.INFO]: 'color: #3b82f6',
      [LOG_LEVELS.WARN]: 'color: #f59e0b',
      [LOG_LEVELS.ERROR]: 'color: #ef4444; font-weight: bold',
      [LOG_LEVELS.CRITICAL]: 'color: #dc2626; font-weight: bold; background: #fef2f2',
    };

    const levelNames = ['DEBUG', 'INFO', 'WARN', 'ERROR', 'CRITICAL'];
    const levelName = levelNames[level] || 'UNKNOWN';

    console.group(`%c[${levelName}] ${message}`, styles[level]);
    
    if (error) {
      console.error('Error:', error);
    }
    
    if (Object.keys(context).length > 0) {
      console.log('Context:', context);
    }
    
    console.log('Timestamp:', new Date(logEntry.timestamp).toISOString());
    console.groupEnd();
  }

  /**
   * Send log to remote logging service
   */
  async sendToRemoteService(logEntry) {
    try {
      // In a real application, you would send to a service like Sentry, LogRocket, etc.
      // For now, we'll just simulate the call
      if (process.env.REACT_APP_LOGGING_ENDPOINT) {
        await fetch(process.env.REACT_APP_LOGGING_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(logEntry),
        });
      }
    } catch (error) {
      console.warn('Failed to send log to remote service:', error);
    }
  }

  /**
   * Convenience methods for different log levels
   */
  debug(message, context = {}) {
    return this.log(LOG_LEVELS.DEBUG, message, null, context);
  }

  info(message, context = {}) {
    return this.log(LOG_LEVELS.INFO, message, null, context);
  }

  warn(message, error = null, context = {}) {
    return this.log(LOG_LEVELS.WARN, message, error, context);
  }

  error(message, error = null, context = {}) {
    return this.log(LOG_LEVELS.ERROR, message, error, context);
  }

  critical(message, error = null, context = {}) {
    return this.log(LOG_LEVELS.CRITICAL, message, error, context);
  }

  /**
   * Get logs with optional filtering
   */
  getLogs(filters = {}) {
    let filteredLogs = [...this.logs];

    if (filters.level !== undefined) {
      filteredLogs = filteredLogs.filter(log => log.level >= filters.level);
    }

    if (filters.category) {
      filteredLogs = filteredLogs.filter(log => log.category === filters.category);
    }

    if (filters.since) {
      filteredLogs = filteredLogs.filter(log => log.timestamp >= filters.since);
    }

    if (filters.limit) {
      filteredLogs = filteredLogs.slice(-filters.limit);
    }

    return filteredLogs;
  }

  /**
   * Clear all logs
   */
  clearLogs() {
    this.logs = [];
    this.saveLogsToStorage();
  }

  /**
   * Export logs for debugging
   */
  exportLogs() {
    return {
      logs: this.logs,
      metadata: {
        totalLogs: this.logs.length,
        oldestLog: this.logs[0]?.timestamp,
        newestLog: this.logs[this.logs.length - 1]?.timestamp,
        exportedAt: Date.now(),
      },
    };
  }
}

// Create singleton instance
const errorLogger = new ErrorLogger();

// Convenience function exports
export const logError = (error, context = {}) => {
  return errorLogger.error(error?.message || 'Unknown error', error, context);
};

export const logWarning = (message, context = {}) => {
  return errorLogger.warn(message, null, context);
};

export const logInfo = (message, context = {}) => {
  return errorLogger.info(message, context);
};

export const logDebug = (message, context = {}) => {
  return errorLogger.debug(message, context);
};

export const logCritical = (error, context = {}) => {
  return errorLogger.critical(error?.message || 'Critical error', error, context);
};

// Export logger instance and utilities
export { errorLogger };
export default errorLogger;