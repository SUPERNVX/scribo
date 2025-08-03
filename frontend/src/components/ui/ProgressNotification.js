// Progress Notification - Notificações de progresso avançadas
import React, { memo, useState, useEffect } from 'react';

import { SmartIcon } from '../ModernIcons';

/**
 * Componente para notificações de progresso em tempo real
 * Mantém 100% dos estilos visuais existentes
 */
const ProgressNotification = memo(
  ({
    title = 'Processando...',
    message,
    progress = 0,
    status = 'loading', // loading, success, error, warning
    showPercentage = true,
    showETA = false,
    estimatedTime,
    onCancel,
    onRetry,
    className = '',
  }) => {
    const [displayProgress, setDisplayProgress] = useState(0);
    const [eta, setEta] = useState(null);

    // Animação suave do progresso
    useEffect(() => {
      const timer = setTimeout(() => {
        setDisplayProgress(progress);
      }, 100);
      return () => clearTimeout(timer);
    }, [progress]);

    // Cálculo de ETA
    useEffect(() => {
      if (showETA && estimatedTime && progress > 0) {
        const remaining = (estimatedTime * (100 - progress)) / progress;
        setEta(Math.ceil(remaining));
      }
    }, [progress, estimatedTime, showETA]);

    const getStatusIcon = () => {
      switch (status) {
        case 'loading':
          return 'loader';
        case 'success':
          return 'check-circle';
        case 'error':
          return 'alert-circle';
        case 'warning':
          return 'alert-triangle';
        default:
          return 'loader';
      }
    };

    const getStatusColor = () => {
      switch (status) {
        case 'loading':
          return '#a855f7';
        case 'success':
          return '#10b981';
        case 'error':
          return '#ef4444';
        case 'warning':
          return '#f59e0b';
        default:
          return '#6b7280';
      }
    };

    const getProgressColor = () => {
      if (status === 'error') return 'bg-red-500';
      if (status === 'warning') return 'bg-yellow-500';
      if (status === 'success') return 'bg-green-500';
      return 'bg-pastel-purple-500';
    };

    const formatTime = seconds => {
      if (seconds < 60) return `${seconds}s`;
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}m ${remainingSeconds}s`;
    };

    return (
      <div
        className={`
      bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 
      p-4 min-w-[320px] max-w-md backdrop-blur-sm
      ${className}
    `}
      >
        {/* Header */}
        <div className='flex items-center justify-between mb-3'>
          <div className='flex items-center gap-3'>
            <div className={status === 'loading' ? 'animate-spin' : ''}>
              <SmartIcon
                type={getStatusIcon()}
                size={20}
                color={getStatusColor()}
              />
            </div>
            <div>
              <h4 className='font-medium text-sm text-gray-900 dark:text-white'>
                {title}
              </h4>
              {message && (
                <p className='text-xs text-gray-600 dark:text-gray-400 mt-0.5'>
                  {message}
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className='flex items-center gap-1'>
            {onCancel && status === 'loading' && (
              <button
                onClick={onCancel}
                className='p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors'
                aria-label='Cancelar'
              >
                <SmartIcon type='x' size={16} />
              </button>
            )}

            {onRetry && status === 'error' && (
              <button
                onClick={onRetry}
                className='p-1 text-blue-500 hover:text-blue-600 transition-colors'
                aria-label='Tentar novamente'
              >
                <SmartIcon type='refresh-cw' size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        {status !== 'success' && (
          <div className='mb-3'>
            <div className='flex items-center justify-between mb-1'>
              {showPercentage && (
                <span className='text-xs font-medium text-gray-700 dark:text-gray-300'>
                  {Math.round(displayProgress)}%
                </span>
              )}
              {eta && showETA && (
                <span className='text-xs text-gray-500 dark:text-gray-400'>
                  ~{formatTime(eta)} restante
                </span>
              )}
            </div>

            <div className='w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden'>
              <div
                className={`h-full rounded-full transition-all duration-500 ease-out ${getProgressColor()}`}
                style={{
                  width: `${displayProgress}%`,
                  transform:
                    status === 'loading' ? 'translateX(0)' : 'translateX(0)',
                }}
              />
            </div>
          </div>
        )}

        {/* Status Messages */}
        {status === 'success' && (
          <div className='flex items-center gap-2 text-green-700 dark:text-green-400 text-sm'>
            <SmartIcon type='check' size={16} color='#10b981' />
            <span>Concluído com sucesso!</span>
          </div>
        )}

        {status === 'error' && (
          <div className='flex items-center gap-2 text-red-700 dark:text-red-400 text-sm'>
            <SmartIcon type='alert-circle' size={16} color='#ef4444' />
            <span>Erro durante o processamento</span>
          </div>
        )}

        {status === 'warning' && (
          <div className='flex items-center gap-2 text-yellow-700 dark:text-yellow-400 text-sm'>
            <SmartIcon type='alert-triangle' size={16} color='#f59e0b' />
            <span>Processamento com avisos</span>
          </div>
        )}
      </div>
    );
  }
);

/**
 * Hook para gerenciar notificações de progresso
 */
export const useProgressNotification = () => {
  const [notifications, setNotifications] = useState(new Map());

  const createProgressNotification = (id, config) => {
    setNotifications(prev =>
      new Map(prev).set(id, {
        ...config,
        id,
        createdAt: Date.now(),
      })
    );
    return id;
  };

  const updateProgress = (id, progress, updates = {}) => {
    setNotifications(prev => {
      const notification = prev.get(id);
      if (!notification) return prev;

      const updated = new Map(prev);
      updated.set(id, {
        ...notification,
        progress,
        ...updates,
      });
      return updated;
    });
  };

  const completeProgress = (id, message = 'Concluído!') => {
    updateProgress(id, 100, {
      status: 'success',
      message,
    });

    // Auto-remove após 3 segundos
    setTimeout(() => {
      removeNotification(id);
    }, 3000);
  };

  const failProgress = (id, message = 'Erro no processamento') => {
    updateProgress(id, undefined, {
      status: 'error',
      message,
    });
  };

  const removeNotification = id => {
    setNotifications(prev => {
      const updated = new Map(prev);
      updated.delete(id);
      return updated;
    });
  };

  return {
    notifications: Array.from(notifications.values()),
    createProgressNotification,
    updateProgress,
    completeProgress,
    failProgress,
    removeNotification,
  };
};

ProgressNotification.displayName = 'ProgressNotification';

export default ProgressNotification;
