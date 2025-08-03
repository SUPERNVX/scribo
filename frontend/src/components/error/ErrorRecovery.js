// Error Recovery Component - mantendo estilos existentes
import React, { memo, useState } from 'react';

import { useErrorRecovery } from '../../hooks/useErrorHandling';
import { SmartIcon } from '../ModernIcons';

/**
 * ErrorRecovery Component
 * Interface inteligente de recuperação de erros
 */
const ErrorRecovery = memo(
  ({
    error,
    onRetry,
    onReset,
    onEdit,
    className = '',
    showSuggestions = true,
  }) => {
    const { getRecoverySuggestions, executeRecoveryAction } =
      useErrorRecovery();
    const [isRetrying, setIsRetrying] = useState(false);
    const [selectedSuggestion, setSelectedSuggestion] = useState(null);

    const suggestions = showSuggestions ? getRecoverySuggestions(error) : [];

    const handleAction = async (action, suggestion) => {
      setIsRetrying(true);
      setSelectedSuggestion(suggestion);

      try {
        await executeRecoveryAction(action, {
          retryFn: onRetry,
          resetFn: onReset,
          editFn: onEdit,
        });
      } finally {
        setIsRetrying(false);
        setSelectedSuggestion(null);
      }
    };

    const getErrorIcon = type => {
      switch (type) {
        case 'network':
          return 'wifi-off';
        case 'auth':
          return 'lock';
        case 'server':
          return 'server';
        case 'validation':
          return 'alert-circle';
        case 'rate_limit':
          return 'clock';
        default:
          return 'alert-triangle';
      }
    };

    const getErrorColor = type => {
      switch (type) {
        case 'network':
          return '#f59e0b';
        case 'auth':
          return '#ef4444';
        case 'server':
          return '#ef4444';
        case 'validation':
          return '#f59e0b';
        case 'rate_limit':
          return '#6b7280';
        default:
          return '#ef4444';
      }
    };

    return (
      <div className={`space-y-4 ${className}`}>
        {suggestions.map((suggestion, index) => (
          <div
            key={index}
            className='bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-4 shadow-sm'
          >
            <div className='flex items-start gap-3'>
              <div className='flex-shrink-0'>
                <SmartIcon
                  type={getErrorIcon(suggestion.type)}
                  size={24}
                  color={getErrorColor(suggestion.type)}
                />
              </div>

              <div className='flex-1 min-w-0'>
                <h3 className='font-medium text-gray-900 dark:text-white mb-1'>
                  {suggestion.title}
                </h3>
                <p className='text-sm text-gray-600 dark:text-gray-300 mb-3'>
                  {suggestion.description}
                </p>

                <div className='flex flex-wrap gap-2'>
                  {suggestion.actions.map((action, actionIndex) => (
                    <button
                      key={actionIndex}
                      onClick={() => handleAction(action.action, suggestion)}
                      disabled={isRetrying}
                      className={`
                      px-3 py-1.5 text-sm font-medium rounded-md transition-colors
                      focus:outline-none focus:ring-2 focus:ring-pastel-purple-500 focus:ring-offset-2
                      ${
                        actionIndex === 0
                          ? 'bg-pastel-purple-500 hover:bg-pastel-purple-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
                      }
                      ${isRetrying && selectedSuggestion === suggestion ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                    >
                      {isRetrying &&
                      selectedSuggestion === suggestion &&
                      actionIndex === 0 ? (
                        <div className='flex items-center gap-2'>
                          <SmartIcon
                            type='loader'
                            size={14}
                            className='animate-spin'
                          />
                          Processando...
                        </div>
                      ) : (
                        action.label
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }
);

/**
 * QuickErrorActions Component
 * Ações rápidas de recuperação de erro
 */
export const QuickErrorActions = memo(
  ({ onRetry, onRefresh, onGoBack, loading = false, className = '' }) => {
    return (
      <div className={`flex flex-wrap gap-3 ${className}`}>
        {onRetry && (
          <button
            onClick={onRetry}
            disabled={loading}
            className='flex items-center gap-2 px-4 py-2 bg-pastel-purple-500 hover:bg-pastel-purple-600 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-pastel-purple-500 focus:ring-offset-2 disabled:opacity-50'
          >
            {loading ? (
              <SmartIcon type='loader' size={16} className='animate-spin' />
            ) : (
              <SmartIcon type='refresh-cw' size={16} />
            )}
            Tentar Novamente
          </button>
        )}

        {onRefresh && (
          <button
            onClick={onRefresh}
            className='flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-pastel-purple-500 focus:ring-offset-2'
          >
            <SmartIcon type='rotate-ccw' size={16} />
            Recarregar
          </button>
        )}

        {onGoBack && (
          <button
            onClick={onGoBack}
            className='flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-pastel-purple-500 focus:ring-offset-2'
          >
            <SmartIcon type='arrow-left' size={16} />
            Voltar
          </button>
        )}
      </div>
    );
  }
);

/**
 * RetryButton Component
 * Botão de retry com contador e loading
 */
export const RetryButton = memo(
  ({
    onRetry,
    retryCount = 0,
    maxRetries = 3,
    loading = false,
    disabled = false,
    className = '',
  }) => {
    const canRetry = retryCount < maxRetries && !disabled;

    return (
      <button
        onClick={onRetry}
        disabled={!canRetry || loading}
        className={`
        flex items-center gap-2 px-4 py-2 font-medium rounded-lg transition-colors
        focus:outline-none focus:ring-2 focus:ring-pastel-purple-500 focus:ring-offset-2
        ${
          canRetry && !loading
            ? 'bg-pastel-purple-500 hover:bg-pastel-purple-600 text-white'
            : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
        }
        ${className}
      `}
      >
        {loading ? (
          <SmartIcon type='loader' size={16} className='animate-spin' />
        ) : (
          <SmartIcon type='refresh-cw' size={16} />
        )}

        {loading ? 'Tentando...' : 'Tentar Novamente'}

        {retryCount > 0 && (
          <span className='text-xs opacity-75'>
            ({retryCount}/{maxRetries})
          </span>
        )}
      </button>
    );
  }
);

ErrorRecovery.displayName = 'ErrorRecovery';
QuickErrorActions.displayName = 'QuickErrorActions';
RetryButton.displayName = 'RetryButton';

export default ErrorRecovery;
