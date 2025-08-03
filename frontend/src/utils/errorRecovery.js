// Error Recovery Strategies
import React from 'react';
import { logError } from './errorLogger';

/**
 * Error Recovery Strategy Types
 */
export const RECOVERY_STRATEGIES = {
  RETRY: 'retry',
  FALLBACK: 'fallback',
  REDIRECT: 'redirect',
  REFRESH: 'refresh',
  IGNORE: 'ignore',
};

/**
 * Get appropriate recovery strategy based on error type and context
 */
export const getErrorRecoveryStrategy = (error, context = {}) => {
  const errorMessage = error?.message || '';
  const errorStack = error?.stack || '';
  const componentName = context?.name || '';

  // Network-related errors
  if (
    errorMessage.includes('fetch') ||
    errorMessage.includes('network') ||
    errorMessage.includes('timeout') ||
    error?.code === 'NETWORK_ERROR'
  ) {
    return {
      type: RECOVERY_STRATEGIES.RETRY,
      maxRetries: 3,
      retryDelay: 2000,
      autoRetry: true,
      backoffMultiplier: 1.5,
      userMessage: 'Problema de conexão detectado. Tentando reconectar...',
    };
  }

  // Chunk loading errors (code splitting)
  if (
    errorMessage.includes('Loading chunk') ||
    errorMessage.includes('ChunkLoadError') ||
    errorStack.includes('webpackChunkName')
  ) {
    return {
      type: RECOVERY_STRATEGIES.REFRESH,
      maxRetries: 1,
      retryDelay: 1000,
      autoRetry: true,
      userMessage: 'Atualizando recursos da aplicação...',
    };
  }

  // Authentication errors
  if (
    errorMessage.includes('401') ||
    errorMessage.includes('Unauthorized') ||
    errorMessage.includes('authentication')
  ) {
    return {
      type: RECOVERY_STRATEGIES.REDIRECT,
      redirectPath: '/login',
      userMessage: 'Sessão expirada. Redirecionando para login...',
    };
  }

  // Permission errors
  if (
    errorMessage.includes('403') ||
    errorMessage.includes('Forbidden') ||
    errorMessage.includes('permission')
  ) {
    return {
      type: RECOVERY_STRATEGIES.REDIRECT,
      redirectPath: '/',
      userMessage: 'Acesso negado. Redirecionando para página inicial...',
    };
  }

  // Component-specific recovery strategies
  if (componentName.includes('Analytics') || componentName.includes('Chart')) {
    return {
      type: RECOVERY_STRATEGIES.FALLBACK,
      fallbackComponent: 'SimpleAnalytics',
      userMessage: 'Carregando versão simplificada dos analytics...',
    };
  }

  if (componentName.includes('Editor') || componentName.includes('Writing')) {
    return {
      type: RECOVERY_STRATEGIES.RETRY,
      maxRetries: 2,
      retryDelay: 1000,
      autoRetry: false,
      userMessage: 'Erro no editor. Clique para tentar novamente.',
    };
  }

  // Memory-related errors
  if (
    errorMessage.includes('out of memory') ||
    errorMessage.includes('Maximum call stack')
  ) {
    return {
      type: RECOVERY_STRATEGIES.REFRESH,
      userMessage: 'Problema de memória detectado. Recarregando aplicação...',
    };
  }

  // Script errors (external resources)
  if (errorMessage.includes('Script error') || errorStack.includes('external')) {
    return {
      type: RECOVERY_STRATEGIES.IGNORE,
      userMessage: 'Erro em recurso externo. Funcionalidade pode estar limitada.',
    };
  }

  // Default strategy for unknown errors
  return {
    type: RECOVERY_STRATEGIES.RETRY,
    maxRetries: 1,
    retryDelay: 1000,
    autoRetry: false,
    userMessage: 'Erro inesperado. Clique para tentar novamente.',
  };
};

/**
 * Execute recovery action based on strategy
 */
export const executeRecoveryAction = (strategy, context = {}) => {
  const { type, redirectPath, fallbackComponent } = strategy;

  switch (type) {
    case RECOVERY_STRATEGIES.RETRY:
      if (context.retryFn) {
        context.retryFn();
      }
      break;

    case RECOVERY_STRATEGIES.REFRESH:
      window.location.reload();
      break;

    case RECOVERY_STRATEGIES.REDIRECT:
      if (redirectPath) {
        window.location.href = redirectPath;
      }
      break;

    case RECOVERY_STRATEGIES.FALLBACK:
      if (context.setFallback && fallbackComponent) {
        context.setFallback(fallbackComponent);
      }
      break;

    case RECOVERY_STRATEGIES.IGNORE:
      // Log but don't take action
      logError(new Error('Ignored error'), {
        strategy: 'ignore',
        context,
      });
      break;

    default:
      console.warn('Unknown recovery strategy:', type);
  }
};

/**
 * Get user-friendly error message based on error type
 */
export const getUserFriendlyErrorMessage = (error, context = {}) => {
  const strategy = getErrorRecoveryStrategy(error, context);
  return strategy.userMessage || 'Ocorreu um erro inesperado.';
};

/**
 * Check if error should be auto-retried
 */
export const shouldAutoRetry = (error, retryCount = 0) => {
  const strategy = getErrorRecoveryStrategy(error);
  return strategy.autoRetry && retryCount < (strategy.maxRetries || 0);
};

/**
 * Calculate retry delay with exponential backoff
 */
export const calculateRetryDelay = (error, retryCount = 0) => {
  const strategy = getErrorRecoveryStrategy(error);
  const baseDelay = strategy.retryDelay || 1000;
  const multiplier = strategy.backoffMultiplier || 1;
  
  return Math.min(baseDelay * Math.pow(multiplier, retryCount), 10000); // Max 10s
};

/**
 * Error Recovery Hook for functional components
 */
export const useErrorRecovery = () => {
  const [recoveryState, setRecoveryState] = React.useState({
    isRecovering: false,
    retryCount: 0,
    lastError: null,
  });

  const recover = React.useCallback((error, context = {}) => {
    const strategy = getErrorRecoveryStrategy(error, context);
    
    setRecoveryState(prev => ({
      isRecovering: true,
      retryCount: prev.retryCount + 1,
      lastError: error,
    }));

    if (strategy.autoRetry && recoveryState.retryCount < strategy.maxRetries) {
      const delay = calculateRetryDelay(error, recoveryState.retryCount);
      
      setTimeout(() => {
        executeRecoveryAction(strategy, context);
        setRecoveryState(prev => ({ ...prev, isRecovering: false }));
      }, delay);
    } else {
      setRecoveryState(prev => ({ ...prev, isRecovering: false }));
    }

    return strategy;
  }, [recoveryState.retryCount]);

  const reset = React.useCallback(() => {
    setRecoveryState({
      isRecovering: false,
      retryCount: 0,
      lastError: null,
    });
  }, []);

  return {
    ...recoveryState,
    recover,
    reset,
  };
};

export default {
  getErrorRecoveryStrategy,
  executeRecoveryAction,
  getUserFriendlyErrorMessage,
  shouldAutoRetry,
  calculateRetryDelay,
  useErrorRecovery,
  RECOVERY_STRATEGIES,
};