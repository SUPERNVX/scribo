// Notification Center - Centro de notificações inteligente
import React, { memo, useState, useCallback } from 'react';

import { SmartIcon } from '../ModernIcons';
import { useNotifications } from '../../hooks/useNotifications';

/**
 * Centro de notificações não-intrusivo
 * Mantém 100% dos estilos visuais existentes
 */
const NotificationCenter = memo(() => {
  const {
    notifications,
    dismissNotification,
    clearAll,
    hasNotifications,
    queueLength,
  } = useNotifications();
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggle = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  const handleDismiss = useCallback(
    (id, event) => {
      event.stopPropagation();
      dismissNotification(id);
    },
    [dismissNotification]
  );

  const handleClearAll = useCallback(
    event => {
      event.stopPropagation();
      clearAll();
      setIsExpanded(false);
    },
    [clearAll]
  );

  if (!hasNotifications && queueLength === 0) {
    return null;
  }

  return (
    <div className='fixed top-4 right-4 z-50'>
      {/* Notification Bell */}
      <button
        onClick={handleToggle}
        className={`
          relative p-3 rounded-full shadow-lg backdrop-blur-sm transition-all duration-200
          ${
            isExpanded
              ? 'bg-pastel-purple-100 border-2 border-pastel-purple-300'
              : 'bg-white/90 border border-gray-200 hover:bg-pastel-purple-50'
          }
          dark:bg-gray-800/90 dark:border-gray-600 dark:hover:bg-gray-700
        `}
        aria-label={`${notifications.length + queueLength} notificações`}
      >
        <SmartIcon
          type='bell'
          size={20}
          color={isExpanded ? '#a855f7' : '#6b7280'}
        />

        {/* Badge de contagem */}
        {notifications.length + queueLength > 0 && (
          <span className='absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium'>
            {Math.min(notifications.length + queueLength, 9)}
            {notifications.length + queueLength > 9 && '+'}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isExpanded && (
        <div className='absolute top-full right-0 mt-2 w-80 max-h-96 overflow-hidden bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-600 backdrop-blur-sm'>
          {/* Header */}
          <div className='flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-600'>
            <h3 className='font-medium text-gray-900 dark:text-white'>
              Notificações
            </h3>
            {notifications.length > 0 && (
              <button
                onClick={handleClearAll}
                className='text-sm text-pastel-purple-600 hover:text-pastel-purple-700 dark:text-pastel-purple-400 transition-colors'
              >
                Limpar todas
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className='max-h-80 overflow-y-auto'>
            {notifications.length === 0 && queueLength === 0 ? (
              <div className='p-4 text-center text-gray-500 dark:text-gray-400'>
                <SmartIcon
                  type='bell-off'
                  size={24}
                  color='#9ca3af'
                  className='mx-auto mb-2'
                />
                <p className='text-sm'>Nenhuma notificação</p>
              </div>
            ) : (
              <>
                {/* Notificações ativas */}
                {notifications.map(notification => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onDismiss={handleDismiss}
                  />
                ))}

                {/* Indicador de fila */}
                {queueLength > 0 && (
                  <div className='p-3 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-600'>
                    <div className='flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400'>
                      <SmartIcon type='clock' size={16} color='#9ca3af' />
                      <span>
                        {queueLength} notificação{queueLength > 1 ? 'ões' : ''}{' '}
                        na fila
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

/**
 * Item individual de notificação
 */
const NotificationItem = memo(({ notification, onDismiss }) => {
  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return 'check-circle';
      case 'error':
        return 'alert-circle';
      case 'warning':
        return 'alert-triangle';
      case 'info':
        return 'info';
      case 'celebration':
        return 'star';
      default:
        return 'bell';
    }
  };

  const getColors = () => {
    switch (notification.type) {
      case 'success':
        return 'border-l-green-400 bg-green-50 dark:bg-green-900/20';
      case 'error':
        return 'border-l-red-400 bg-red-50 dark:bg-red-900/20';
      case 'warning':
        return 'border-l-yellow-400 bg-yellow-50 dark:bg-yellow-900/20';
      case 'info':
        return 'border-l-blue-400 bg-blue-50 dark:bg-blue-900/20';
      case 'celebration':
        return 'border-l-purple-400 bg-purple-50 dark:bg-purple-900/20';
      default:
        return 'border-l-gray-400 bg-gray-50 dark:bg-gray-700/50';
    }
  };

  const getIconColor = () => {
    switch (notification.type) {
      case 'success':
        return '#10b981';
      case 'error':
        return '#ef4444';
      case 'warning':
        return '#f59e0b';
      case 'info':
        return '#3b82f6';
      case 'celebration':
        return '#a855f7';
      default:
        return '#6b7280';
    }
  };

  const formatTime = timestamp => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return 'agora';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  return (
    <div
      className={`
      relative p-4 border-l-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors
      ${getColors()}
    `}
    >
      <div className='flex items-start gap-3'>
        <SmartIcon
          type={getIcon()}
          size={18}
          color={getIconColor()}
          className='mt-0.5 flex-shrink-0'
        />

        <div className='flex-1 min-w-0'>
          {notification.title && (
            <h4 className='font-medium text-sm text-gray-900 dark:text-white mb-1'>
              {notification.title}
            </h4>
          )}
          <p className='text-sm text-gray-700 dark:text-gray-300 leading-relaxed'>
            {notification.message}
          </p>
          <p className='text-xs text-gray-500 dark:text-gray-400 mt-1'>
            {formatTime(notification.timestamp)}
          </p>
        </div>

        {!notification.persistent && (
          <button
            onClick={e => onDismiss(notification.id, e)}
            className='text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1'
            aria-label='Dispensar notificação'
          >
            <SmartIcon type='x' size={14} />
          </button>
        )}
      </div>

      {/* Priority indicator */}
      {notification.priority === 'high' && (
        <div className='absolute top-2 right-2'>
          <div className='w-2 h-2 bg-red-500 rounded-full animate-pulse'></div>
        </div>
      )}
    </div>
  );
});

NotificationCenter.displayName = 'NotificationCenter';
NotificationItem.displayName = 'NotificationItem';

export default NotificationCenter;
