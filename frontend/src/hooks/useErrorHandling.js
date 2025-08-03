// Error Handling Hooks for intelligent error management
import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * useErrorBoundary Hook
 * Captura e gerencia erros de forma inteligente
 */
export const useErrorBoundary = () => {
  const [error, setError] = useState(null);
  const [errorInfo, setErrorInfo] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  const captureError = useCallback((error, errorInfo = null) => {
    setError(error);
    setErrorInfo(errorInfo);

    // Log error for debugging
    console.error('Error captured:', error, errorInfo);

    // Send to error reporting service in production
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureException(error, { extra: errorInfo });
    }
  }, []);

  const retry = useCallback(() => {
    setRetryCount(prev => prev + 1);
    setError(null);
    setErrorInfo(null);
  }, []);

  const reset = useCallback(() => {
    setError(null);
    setErrorInfo(null);
    setRetryCount(0);
  }, []);

  return {
    error,
    errorInfo,
    retryCount,
    captureError,
    retry,
    reset,
    hasError: !!error,
  };
};

/**
 * useRetryableRequest Hook
 * Requisições com retry automático e backoff exponencial
 */
export const useRetryableRequest = (requestFn, options = {}) => {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2,
    retryCondition = error => error.response?.status >= 500,
  } = options;

  const [state, setState] = useState({
    data: null,
    loading: false,
    error: null,
    retryCount: 0,
  });

  const abortController = useRef();
  const retryTimeout = useRef();

  const executeRequest = useCallback(
    async (...args) => {
      // Cancel previous request
      if (abortController.current) {
        abortController.current.abort();
      }

      abortController.current = new AbortController();

      setState(prev => ({
        ...prev,
        loading: true,
        error: null,
      }));

      const attemptRequest = async (attempt = 0) => {
        try {
          const result = await requestFn(...args, {
            signal: abortController.current.signal,
          });

          setState({
            data: result,
            loading: false,
            error: null,
            retryCount: attempt,
          });

          return result;
        } catch (error) {
          if (error.name === 'AbortError') {
            return; // Request was cancelled
          }

          const shouldRetry = attempt < maxRetries && retryCondition(error);

          if (shouldRetry) {
            const delay = Math.min(
              baseDelay * Math.pow(backoffFactor, attempt),
              maxDelay
            );

            setState(prev => ({
              ...prev,
              retryCount: attempt + 1,
            }));

            retryTimeout.current = setTimeout(() => {
              attemptRequest(attempt + 1);
            }, delay);
          } else {
            setState({
              data: null,
              loading: false,
              error,
              retryCount: attempt,
            });
            throw error;
          }
        }
      };

      return attemptRequest();
    },
    [requestFn, maxRetries, baseDelay, maxDelay, backoffFactor, retryCondition]
  );

  const cancel = useCallback(() => {
    if (abortController.current) {
      abortController.current.abort();
    }
    if (retryTimeout.current) {
      clearTimeout(retryTimeout.current);
    }
    setState(prev => ({
      ...prev,
      loading: false,
    }));
  }, []);

  useEffect(() => {
    return () => {
      cancel();
    };
  }, [cancel]);

  return {
    ...state,
    execute: executeRequest,
    cancel,
    isRetrying: state.loading && state.retryCount > 0,
  };
};

/**
 * useNetworkStatus Hook
 * Detecta status da conexão de rede
 */
export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionType, setConnectionType] = useState('unknown');
  const [effectiveType, setEffectiveType] = useState('4g');

  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    const updateConnectionInfo = () => {
      if ('connection' in navigator) {
        const connection = navigator.connection;
        setConnectionType(connection.type || 'unknown');
        setEffectiveType(connection.effectiveType || '4g');
      }
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    if ('connection' in navigator) {
      navigator.connection.addEventListener('change', updateConnectionInfo);
      updateConnectionInfo();
    }

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);

      if ('connection' in navigator) {
        navigator.connection.removeEventListener(
          'change',
          updateConnectionInfo
        );
      }
    };
  }, []);

  return {
    isOnline,
    isOffline: !isOnline,
    connectionType,
    effectiveType,
    isSlowConnection: effectiveType === 'slow-2g' || effectiveType === '2g',
    isFastConnection: effectiveType === '4g' || effectiveType === '5g',
  };
};

/**
 * useOfflineQueue Hook
 * Fila de requisições para quando voltar online
 */
export const useOfflineQueue = () => {
  const [queue, setQueue] = useState([]);
  const { isOnline } = useNetworkStatus();
  const processingRef = useRef(false);

  const addToQueue = useCallback(request => {
    const queueItem = {
      id: Date.now() + Math.random(),
      request,
      timestamp: Date.now(),
      retries: 0,
    };

    setQueue(prev => [...prev, queueItem]);
    return queueItem.id;
  }, []);

  const removeFromQueue = useCallback(id => {
    setQueue(prev => prev.filter(item => item.id !== id));
  }, []);

  const processQueue = useCallback(async () => {
    if (processingRef.current || queue.length === 0 || !isOnline) {
      return;
    }

    processingRef.current = true;

    for (const item of queue) {
      try {
        await item.request();
        removeFromQueue(item.id);
      } catch (error) {
        if (item.retries < 3) {
          setQueue(prev =>
            prev.map(queueItem =>
              queueItem.id === item.id
                ? { ...queueItem, retries: queueItem.retries + 1 }
                : queueItem
            )
          );
        } else {
          removeFromQueue(item.id);
          console.error(
            'Failed to process queued request after 3 retries:',
            error
          );
        }
      }
    }

    processingRef.current = false;
  }, [queue, isOnline, removeFromQueue]);

  useEffect(() => {
    if (isOnline && queue.length > 0) {
      processQueue();
    }
  }, [isOnline, queue.length, processQueue]);

  return {
    queue,
    addToQueue,
    removeFromQueue,
    queueSize: queue.length,
    isProcessing: processingRef.current,
  };
};

/**
 * useErrorRecovery Hook
 * Sugestões inteligentes de recuperação de erro
 */
export const useErrorRecovery = () => {
  const getRecoverySuggestions = useCallback(error => {
    const suggestions = [];

    // Network errors
    if (error.code === 'NETWORK_ERROR' || error.message?.includes('fetch')) {
      suggestions.push({
        type: 'network',
        title: 'Problema de Conexão',
        description: 'Verifique sua conexão com a internet',
        actions: [
          { label: 'Tentar Novamente', action: 'retry' },
          { label: 'Verificar Conexão', action: 'check_network' },
        ],
      });
    }

    // Authentication errors
    if (error.response?.status === 401) {
      suggestions.push({
        type: 'auth',
        title: 'Sessão Expirada',
        description: 'Sua sessão expirou. Faça login novamente.',
        actions: [
          { label: 'Fazer Login', action: 'login' },
          { label: 'Atualizar Página', action: 'refresh' },
        ],
      });
    }

    // Server errors
    if (error.response?.status >= 500) {
      suggestions.push({
        type: 'server',
        title: 'Erro do Servidor',
        description: 'Nossos servidores estão temporariamente indisponíveis',
        actions: [
          { label: 'Tentar Novamente', action: 'retry' },
          { label: 'Reportar Problema', action: 'report' },
        ],
      });
    }

    // Validation errors
    if (error.response?.status === 400) {
      suggestions.push({
        type: 'validation',
        title: 'Dados Inválidos',
        description: 'Verifique os dados informados e tente novamente',
        actions: [
          { label: 'Corrigir Dados', action: 'edit' },
          { label: 'Limpar Formulário', action: 'reset' },
        ],
      });
    }

    // Rate limiting
    if (error.response?.status === 429) {
      suggestions.push({
        type: 'rate_limit',
        title: 'Muitas Tentativas',
        description: 'Aguarde alguns minutos antes de tentar novamente',
        actions: [{ label: 'Aguardar e Tentar', action: 'wait_retry' }],
      });
    }

    // Default fallback
    if (suggestions.length === 0) {
      suggestions.push({
        type: 'generic',
        title: 'Erro Inesperado',
        description: 'Ocorreu um erro inesperado. Tente novamente.',
        actions: [
          { label: 'Tentar Novamente', action: 'retry' },
          { label: 'Recarregar Página', action: 'refresh' },
        ],
      });
    }

    return suggestions;
  }, []);

  const executeRecoveryAction = useCallback((action, context = {}) => {
    switch (action) {
      case 'retry':
        context.retryFn?.();
        break;

      case 'refresh':
        window.location.reload();
        break;

      case 'login':
        window.location.href = '/login';
        break;

      case 'check_network':
        // Open network settings or show network status
        break;

      case 'report':
        // Open bug report or contact form
        break;

      case 'edit':
        context.editFn?.();
        break;

      case 'reset':
        context.resetFn?.();
        break;

      case 'wait_retry':
        setTimeout(() => {
          context.retryFn?.();
        }, 60000); // Wait 1 minute
        break;

      default:
        console.warn('Unknown recovery action:', action);
    }
  }, []);

  return {
    getRecoverySuggestions,
    executeRecoveryAction,
  };
};

export default {
  useErrorBoundary,
  useRetryableRequest,
  useNetworkStatus,
  useOfflineQueue,
  useErrorRecovery,
};
