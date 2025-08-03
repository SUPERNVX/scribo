// Enhanced Network Error Handler with Retry and Offline Queue
import { logError, logWarning, logInfo } from './errorLogger';
import { storage } from './storage';

/**
 * Network Error Types
 */
export const NETWORK_ERROR_TYPES = {
  TIMEOUT: 'timeout',
  CONNECTION_LOST: 'connection_lost',
  SERVER_ERROR: 'server_error',
  RATE_LIMITED: 'rate_limited',
  UNAUTHORIZED: 'unauthorized',
  FORBIDDEN: 'forbidden',
  NOT_FOUND: 'not_found',
  VALIDATION_ERROR: 'validation_error',
};

/**
 * Retry Configuration
 */
const DEFAULT_RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  jitter: true,
};

/**
 * Network Error Handler Class
 */
class NetworkErrorHandler {
  constructor() {
    this.offlineQueue = [];
    this.isOnline = navigator.onLine;
    this.retryAttempts = new Map();
    this.setupNetworkListeners();
    this.loadOfflineQueue();
  }

  /**
   * Setup network status listeners
   */
  setupNetworkListeners() {
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));
  }

  /**
   * Handle online event
   */
  handleOnline() {
    this.isOnline = true;
    logInfo('Network connection restored', { queueSize: this.offlineQueue.length });
    this.processOfflineQueue();
  }

  /**
   * Handle offline event
   */
  handleOffline() {
    this.isOnline = false;
    logWarning('Network connection lost', { timestamp: Date.now() });
  }

  /**
   * Load offline queue from storage
   */
  loadOfflineQueue() {
    try {
      const storedQueue = localStorage.getItem('offline_queue');
      if (storedQueue) {
        const parsedQueue = JSON.parse(storedQueue);
        if (Array.isArray(parsedQueue)) {
          this.offlineQueue = parsedQueue.filter(item => {
            // Remove items older than 24 hours
            const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
            return item.timestamp > oneDayAgo;
          });
        }
      }
    } catch (error) {
      logError(error, { context: 'loadOfflineQueue' });
    }
  }

  /**
   * Save offline queue to storage
   */
  saveOfflineQueue() {
    try {
      localStorage.setItem('offline_queue', JSON.stringify(this.offlineQueue));
    } catch (error) {
      logError(error, { context: 'saveOfflineQueue' });
    }
  }

  /**
   * Add request to offline queue
   */
  addToOfflineQueue(requestConfig, options = {}) {
    const queueItem = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      requestConfig,
      timestamp: Date.now(),
      retries: 0,
      maxRetries: options.maxRetries || 3,
      priority: options.priority || 'normal',
      userMessage: options.userMessage || 'Ação será sincronizada quando voltar online',
    };

    // Insert based on priority
    if (queueItem.priority === 'high') {
      this.offlineQueue.unshift(queueItem);
    } else {
      this.offlineQueue.push(queueItem);
    }

    this.saveOfflineQueue();
    
    logInfo('Request added to offline queue', {
      queueId: queueItem.id,
      queueSize: this.offlineQueue.length,
      priority: queueItem.priority,
    });

    return queueItem.id;
  }

  /**
   * Remove item from offline queue
   */
  removeFromOfflineQueue(queueId) {
    this.offlineQueue = this.offlineQueue.filter(item => item.id !== queueId);
    this.saveOfflineQueue();
  }

  /**
   * Process offline queue when back online
   */
  async processOfflineQueue() {
    if (!this.isOnline || this.offlineQueue.length === 0) {
      return;
    }

    logInfo('Processing offline queue', { queueSize: this.offlineQueue.length });

    const processPromises = this.offlineQueue.map(async (item) => {
      try {
        await this.executeQueuedRequest(item);
        this.removeFromOfflineQueue(item.id);
      } catch (error) {
        if (item.retries < item.maxRetries) {
          item.retries++;
          logWarning('Queued request failed, will retry', {
            queueId: item.id,
            retries: item.retries,
            maxRetries: item.maxRetries,
          });
        } else {
          logError(error, {
            context: 'processOfflineQueue',
            queueId: item.id,
            finalFailure: true,
          });
          this.removeFromOfflineQueue(item.id);
        }
      }
    });

    await Promise.allSettled(processPromises);
    this.saveOfflineQueue();
  }

  /**
   * Execute queued request
   */
  async executeQueuedRequest(queueItem) {
    const { requestConfig } = queueItem;
    
    // Recreate the original request
    const response = await fetch(requestConfig.url, {
      method: requestConfig.method || 'GET',
      headers: requestConfig.headers || {},
      body: requestConfig.body,
      ...requestConfig.options,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response;
  }

  /**
   * Determine error type from response/error
   */
  getErrorType(error) {
    if (error.name === 'AbortError') {
      return NETWORK_ERROR_TYPES.TIMEOUT;
    }

    if (error.code === 'NETWORK_ERROR' || !navigator.onLine) {
      return NETWORK_ERROR_TYPES.CONNECTION_LOST;
    }

    const status = error.response?.status || error.status;

    switch (status) {
      case 401:
        return NETWORK_ERROR_TYPES.UNAUTHORIZED;
      case 403:
        return NETWORK_ERROR_TYPES.FORBIDDEN;
      case 404:
        return NETWORK_ERROR_TYPES.NOT_FOUND;
      case 400:
        return NETWORK_ERROR_TYPES.VALIDATION_ERROR;
      case 429:
        return NETWORK_ERROR_TYPES.RATE_LIMITED;
      case 500:
      case 502:
      case 503:
      case 504:
        return NETWORK_ERROR_TYPES.SERVER_ERROR;
      default:
        return NETWORK_ERROR_TYPES.CONNECTION_LOST;
    }
  }

  /**
   * Check if error should be retried
   */
  shouldRetry(error, retryCount = 0, config = DEFAULT_RETRY_CONFIG) {
    if (retryCount >= config.maxRetries) {
      return false;
    }

    const errorType = this.getErrorType(error);

    // Don't retry client errors (except rate limiting)
    const nonRetryableErrors = [
      NETWORK_ERROR_TYPES.UNAUTHORIZED,
      NETWORK_ERROR_TYPES.FORBIDDEN,
      NETWORK_ERROR_TYPES.NOT_FOUND,
      NETWORK_ERROR_TYPES.VALIDATION_ERROR,
    ];

    if (nonRetryableErrors.includes(errorType)) {
      return false;
    }

    return true;
  }

  /**
   * Calculate retry delay with exponential backoff and jitter
   */
  calculateRetryDelay(retryCount, config = DEFAULT_RETRY_CONFIG) {
    let delay = Math.min(
      config.baseDelay * Math.pow(config.backoffMultiplier, retryCount),
      config.maxDelay
    );

    // Add jitter to prevent thundering herd
    if (config.jitter) {
      delay = delay * (0.5 + Math.random() * 0.5);
    }

    return Math.floor(delay);
  }

  /**
   * Execute request with automatic retry
   */
  async executeWithRetry(requestFn, config = DEFAULT_RETRY_CONFIG) {
    const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    let lastError;

    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        const result = await requestFn();
        
        // Clear retry attempts on success
        this.retryAttempts.delete(requestId);
        
        if (attempt > 0) {
          logInfo('Request succeeded after retry', {
            requestId,
            attempts: attempt + 1,
          });
        }

        return result;
      } catch (error) {
        lastError = error;
        
        logError(error, {
          context: 'executeWithRetry',
          requestId,
          attempt: attempt + 1,
          maxRetries: config.maxRetries + 1,
        });

        // Don't retry on last attempt
        if (attempt === config.maxRetries) {
          break;
        }

        // Check if we should retry
        if (!this.shouldRetry(error, attempt, config)) {
          break;
        }

        // Calculate delay and wait
        const delay = this.calculateRetryDelay(attempt, config);
        
        logInfo('Retrying request', {
          requestId,
          attempt: attempt + 1,
          delay,
          nextAttempt: attempt + 2,
        });

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // All retries failed
    this.retryAttempts.delete(requestId);
    throw lastError;
  }

  /**
   * Handle network error with appropriate strategy
   */
  async handleNetworkError(error, requestConfig, options = {}) {
    const errorType = this.getErrorType(error);
    
    logError(error, {
      context: 'handleNetworkError',
      errorType,
      url: requestConfig?.url,
      method: requestConfig?.method,
    });

    // If offline and request can be queued
    if (!this.isOnline && this.canQueueRequest(requestConfig)) {
      return this.addToOfflineQueue(requestConfig, options);
    }

    // Handle specific error types
    switch (errorType) {
      case NETWORK_ERROR_TYPES.UNAUTHORIZED:
        // Clear auth tokens and redirect to login
        storage.removeToken();
        storage.removeUser();
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        break;

      case NETWORK_ERROR_TYPES.RATE_LIMITED:
        // Extract retry-after header if available
        const retryAfter = error.response?.headers?.['retry-after'];
        if (retryAfter) {
          const delay = parseInt(retryAfter) * 1000;
          logInfo('Rate limited, waiting before retry', { delay });
          await new Promise(resolve => setTimeout(resolve, delay));
        }
        break;

      case NETWORK_ERROR_TYPES.SERVER_ERROR:
        // Server errors can be retried
        if (options.autoRetry !== false) {
          return this.executeWithRetry(() => 
            fetch(requestConfig.url, requestConfig)
          );
        }
        break;
    }

    throw error;
  }

  /**
   * Check if request can be queued for offline processing
   */
  canQueueRequest(requestConfig) {
    if (!requestConfig) return false;

    const method = requestConfig.method?.toUpperCase();
    
    // Only queue state-changing operations
    const queueableMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
    
    return queueableMethods.includes(method);
  }

  /**
   * Get user-friendly error message
   */
  getUserFriendlyMessage(error) {
    const errorType = this.getErrorType(error);

    const messages = {
      [NETWORK_ERROR_TYPES.TIMEOUT]: 'A requisição demorou muito para responder. Tente novamente.',
      [NETWORK_ERROR_TYPES.CONNECTION_LOST]: 'Sem conexão com a internet. Verifique sua conexão.',
      [NETWORK_ERROR_TYPES.SERVER_ERROR]: 'Nossos servidores estão temporariamente indisponíveis.',
      [NETWORK_ERROR_TYPES.RATE_LIMITED]: 'Muitas tentativas. Aguarde alguns minutos.',
      [NETWORK_ERROR_TYPES.UNAUTHORIZED]: 'Sua sessão expirou. Faça login novamente.',
      [NETWORK_ERROR_TYPES.FORBIDDEN]: 'Você não tem permissão para esta ação.',
      [NETWORK_ERROR_TYPES.NOT_FOUND]: 'O recurso solicitado não foi encontrado.',
      [NETWORK_ERROR_TYPES.VALIDATION_ERROR]: 'Dados inválidos. Verifique as informações.',
    };

    return messages[errorType] || 'Ocorreu um erro inesperado. Tente novamente.';
  }

  /**
   * Get current queue status
   */
  getQueueStatus() {
    return {
      size: this.offlineQueue.length,
      items: this.offlineQueue.map(item => ({
        id: item.id,
        timestamp: item.timestamp,
        retries: item.retries,
        maxRetries: item.maxRetries,
        priority: item.priority,
        userMessage: item.userMessage,
      })),
      isOnline: this.isOnline,
    };
  }

  /**
   * Clear offline queue
   */
  clearOfflineQueue() {
    this.offlineQueue = [];
    this.saveOfflineQueue();
    logInfo('Offline queue cleared');
  }
}

// Create singleton instance
const networkErrorHandler = new NetworkErrorHandler();

// Export convenience functions
export const handleNetworkError = (error, requestConfig, options) => 
  networkErrorHandler.handleNetworkError(error, requestConfig, options);

export const executeWithRetry = (requestFn, config) => 
  networkErrorHandler.executeWithRetry(requestFn, config);

export const addToOfflineQueue = (requestConfig, options) => 
  networkErrorHandler.addToOfflineQueue(requestConfig, options);

export const getQueueStatus = () => 
  networkErrorHandler.getQueueStatus();

export const getUserFriendlyMessage = (error) => 
  networkErrorHandler.getUserFriendlyMessage(error);

export { networkErrorHandler };
export default networkErrorHandler;