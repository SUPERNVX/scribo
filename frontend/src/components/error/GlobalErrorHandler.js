// Enhanced Global Error Handler Component
import React, { memo, useEffect, useState, createContext, useContext } from 'react';
import './GlobalErrorHandler.css';

import {
  useErrorBoundary,
  useNetworkStatus,
  useOfflineQueue,
} from '../../hooks/useErrorHandling';
import { AriaAlert } from '../accessibility/AriaHelpers';
import { logError, logWarning, logInfo } from '../../utils/errorLogger';
import { networkErrorHandler } from '../../utils/networkErrorHandler';
import { UserFriendlyErrorMessage, ERROR_MESSAGE_TYPES, ERROR_SEVERITY } from './UserFriendlyErrorMessage';

import NetworkStatus from './NetworkStatus';
import ErrorBoundary from './ErrorBoundary';

/**
 * Enhanced GlobalErrorHandler Component
 * Gerenciador global de erros com estratégias de recuperação e logging estruturado
 */
const GlobalErrorHandler = memo(({ children }) => {
  const { captureError } = useErrorBoundary();
  const { isOnline, isOffline } = useNetworkStatus();
  const { queueSize, addToQueue } = useOfflineQueue();
  const [globalMessage, setGlobalMessage] = useState('');
  const [globalErrors, setGlobalErrors] = useState([]);
  const [networkError, setNetworkError] = useState(null);

  // Capturar erros JavaScript globais com logging estruturado
  useEffect(() => {
    const handleError = event => {
      const error = event.error;
      const context = {
        type: 'javascript_error',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        userAgent: navigator.userAgent,
        url: window.location.href,
      };

      // Log structured error
      logError(error, context);
      
      // Capture for error boundary
      captureError(error, context);

      // Add to global errors for user-friendly display
      const errorId = Date.now() + Math.random();
      setGlobalErrors(prev => [...prev, {
        id: errorId,
        error,
        context,
        timestamp: Date.now(),
        severity: ERROR_SEVERITY.HIGH,
      }]);
    };

    const handleUnhandledRejection = event => {
      const error = event.reason;
      const context = {
        type: 'unhandled_promise_rejection',
        promise: event.promise,
        userAgent: navigator.userAgent,
        url: window.location.href,
      };

      // Log structured error
      logError(error, context);
      
      // Capture for error boundary
      captureError(error, context);

      // Add to global errors
      const errorId = Date.now() + Math.random();
      setGlobalErrors(prev => [...prev, {
        id: errorId,
        error,
        context,
        timestamp: Date.now(),
        severity: ERROR_SEVERITY.MEDIUM,
      }]);

      // Prevent default browser error handling
      event.preventDefault();
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [captureError]);

  // Enhanced fetch interceptor with network error handling
  useEffect(() => {
    const originalFetch = window.fetch;

    window.fetch = async (...args) => {
      const [url, options = {}] = args;
      const method = options.method?.toUpperCase() || 'GET';

      // Handle offline requests
      if (isOffline) {
        if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
          const requestConfig = { url, method, ...options };
          const queueId = networkErrorHandler.addToOfflineQueue(requestConfig, {
            priority: options.priority || 'normal',
            userMessage: `${method} request queued for when back online`,
          });

          setGlobalMessage('Ação adicionada à fila offline. Será sincronizada quando voltar online.');
          
          logInfo('Request queued for offline processing', {
            url,
            method,
            queueId,
          });

          // Return simulated response
          return Promise.resolve(
            new Response(JSON.stringify({ queued: true, queueId }), {
              status: 202,
              statusText: 'Queued for later',
              headers: { 'Content-Type': 'application/json' },
            })
          );
        } else {
          // For GET requests when offline, show network error
          const error = new Error('No internet connection');
          error.code = 'NETWORK_ERROR';
          setNetworkError(error);
          throw error;
        }
      }

      try {
        const response = await originalFetch(...args);
        
        // Clear network error on successful request
        if (networkError) {
          setNetworkError(null);
        }

        // Log successful requests in development
        if (process.env.NODE_ENV === 'development') {
          logInfo('Fetch request successful', {
            url,
            method,
            status: response.status,
          });
        }

        return response;
      } catch (error) {
        // Enhanced error handling with structured logging
        const enhancedError = {
          ...error,
          url,
          method,
          timestamp: Date.now(),
        };

        logError(enhancedError, {
          context: 'fetch_interceptor',
          url,
          method,
          isOnline,
        });

        // Set network error for user display
        setNetworkError(enhancedError);

        // Try to handle with network error handler
        try {
          return await networkErrorHandler.handleNetworkError(
            enhancedError,
            { url, method, ...options },
            { autoRetry: true }
          );
        } catch (handledError) {
          // If network handler also fails, show user-friendly message
          setGlobalMessage(networkErrorHandler.getUserFriendlyMessage(handledError));
          throw handledError;
        }
      }
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [isOffline, addToQueue, networkError]);

  // Anunciar mudanças de status para screen readers
  useEffect(() => {
    if (isOffline) {
      setGlobalMessage('Conexão perdida. Trabalhando offline.');
    } else if (queueSize > 0) {
      setGlobalMessage(
        `Conexão restaurada. Sincronizando ${queueSize} ações pendentes.`
      );
    }
  }, [isOnline, isOffline, queueSize]);

  // Remove error from global errors list
  const removeGlobalError = (errorId) => {
    setGlobalErrors(prev => prev.filter(err => err.id !== errorId));
  };

  // Retry handler for global errors
  const retryGlobalError = (errorId) => {
    const error = globalErrors.find(err => err.id === errorId);
    if (error && error.context?.url) {
      // Retry the original request
      window.location.reload();
    }
  };

  return (
    <>
      {children}

      {/* Network Error Display */}
      {networkError && (
        <UserFriendlyErrorMessage
          error={networkError}
          type={ERROR_MESSAGE_TYPES.TOAST}
          severity={ERROR_SEVERITY.HIGH}
          showRetry={true}
          onRetry={() => {
            setNetworkError(null);
            window.location.reload();
          }}
          onDismiss={() => setNetworkError(null)}
          autoHide={false}
        />
      )}

      {/* Global JavaScript Errors Display */}
      {globalErrors.map(({ id, error, severity }) => (
        <UserFriendlyErrorMessage
          key={id}
          error={error}
          type={ERROR_MESSAGE_TYPES.TOAST}
          severity={severity}
          showRetry={true}
          showDetails={process.env.NODE_ENV === 'development'}
          onRetry={() => retryGlobalError(id)}
          onDismiss={() => removeGlobalError(id)}
          autoHide={true}
          autoHideDelay={8000}
        />
      ))}

      {/* Offline Queue Status */}
      {queueSize > 0 && (
        <div className="fixed bottom-4 left-4 z-50 bg-blue-100 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 shadow-lg">
          <div className="flex items-center space-x-2">
            <div className="animate-pulse w-2 h-2 bg-blue-500 rounded-full"></div>
            <span className="text-sm text-blue-800 dark:text-blue-200">
              {queueSize} ação{queueSize > 1 ? 'ões' : ''} na fila offline
            </span>
          </div>
        </div>
      )}

      {/* Network Status Indicator */}
      <NetworkStatus showWhenOnline={false} position='top-right' />

      {/* Screen Reader Announcements */}
      <AriaAlert message={globalMessage} />

    </>
  );
});

/**
 * ErrorProvider Component
 * Provider para contexto de erro global
 */
export const ErrorProvider = memo(({ children }) => {
  const [errors, setErrors] = useState([]);
  const [retryAttempts, setRetryAttempts] = useState({});

  const addError = (error, context = {}) => {
    const errorId = Date.now() + Math.random();
    const newError = {
      id: errorId,
      error,
      context,
      timestamp: Date.now(),
      dismissed: false,
    };

    setErrors(prev => [...prev, newError]);
    return errorId;
  };

  const removeError = errorId => {
    setErrors(prev => prev.filter(err => err.id !== errorId));
  };

  const dismissError = errorId => {
    setErrors(prev =>
      prev.map(err => (err.id === errorId ? { ...err, dismissed: true } : err))
    );
  };

  const incrementRetry = errorId => {
    setRetryAttempts(prev => ({
      ...prev,
      [errorId]: (prev[errorId] || 0) + 1,
    }));
  };

  const contextValue = {
    errors: errors.filter(err => !err.dismissed),
    addError,
    removeError,
    dismissError,
    incrementRetry,
    getRetryCount: errorId => retryAttempts[errorId] || 0,
  };

  return (
    <ErrorContext.Provider value={contextValue}>
      <GlobalErrorHandler>{children}</GlobalErrorHandler>
    </ErrorContext.Provider>
  );
});

/**
 * ErrorContext for sharing error state
 */
const ErrorContext = createContext();

export const useErrorContext = () => {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useErrorContext must be used within ErrorProvider');
  }
  return context;
};

/**
 * withErrorBoundary HOC
 * Higher-order component para adicionar error boundary
 */
export const withErrorBoundary = (Component, errorFallback) => {
  const WrappedComponent = props => (
    <ErrorBoundary fallback={errorFallback}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

GlobalErrorHandler.displayName = 'GlobalErrorHandler';
ErrorProvider.displayName = 'ErrorProvider';

export default GlobalErrorHandler;
