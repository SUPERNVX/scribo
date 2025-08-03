// Network Status Component - mantendo estilos existentes
import React, { memo, useState, useEffect } from 'react';

import {
  useNetworkStatus,
  useOfflineQueue,
} from '../../hooks/useErrorHandling';
import { SmartIcon } from '../ModernIcons';

/**
 * NetworkStatus Component
 * Indicador de status da rede mantendo design atual
 */
const NetworkStatus = memo(
  ({ showWhenOnline = false, position = 'top-right', className = '' }) => {
    const { isOnline, isOffline, effectiveType, isSlowConnection } =
      useNetworkStatus();
    const { queueSize } = useOfflineQueue();
    const [showNotification, setShowNotification] = useState(false);

    useEffect(() => {
      if (isOffline || isSlowConnection || (showWhenOnline && isOnline)) {
        setShowNotification(true);

        // Auto hide online notification after 3 seconds
        if (isOnline && !isSlowConnection) {
          const timer = setTimeout(() => {
            setShowNotification(false);
          }, 3000);
          return () => clearTimeout(timer);
        }
      } else {
        setShowNotification(false);
      }
    }, [isOnline, isOffline, isSlowConnection, showWhenOnline]);

    if (!showNotification) return null;

    const getStatusConfig = () => {
      if (isOffline) {
        return {
          icon: 'wifi-off',
          color: '#ef4444',
          bgColor: 'bg-red-50 dark:bg-red-900/20',
          borderColor: 'border-red-200 dark:border-red-800',
          textColor: 'text-red-800 dark:text-red-200',
          title: 'Sem Conexão',
          message:
            queueSize > 0
              ? `${queueSize} ações serão sincronizadas quando voltar online`
              : 'Verifique sua conexão com a internet',
        };
      }

      if (isSlowConnection) {
        return {
          icon: 'wifi',
          color: '#f59e0b',
          bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
          borderColor: 'border-yellow-200 dark:border-yellow-800',
          textColor: 'text-yellow-800 dark:text-yellow-200',
          title: 'Conexão Lenta',
          message: `Conectado via ${effectiveType.toUpperCase()}`,
        };
      }

      return {
        icon: 'wifi',
        color: '#10b981',
        bgColor: 'bg-green-50 dark:bg-green-900/20',
        borderColor: 'border-green-200 dark:border-green-800',
        textColor: 'text-green-800 dark:text-green-200',
        title: 'Conectado',
        message: 'Conexão restaurada',
      };
    };

    const config = getStatusConfig();

    const positionClasses = {
      'top-left': 'top-4 left-4',
      'top-right': 'top-4 right-4',
      'bottom-left': 'bottom-4 left-4',
      'bottom-right': 'bottom-4 right-4',
    };

    return (
      <div className={`fixed ${positionClasses[position]} z-50 ${className}`}>
        <div
          className={`
        flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg backdrop-blur-sm
        ${config.bgColor} ${config.borderColor} ${config.textColor}
        animate-slide-in-down
      `}
        >
          <SmartIcon type={config.icon} size={20} color={config.color} />
          <div className='min-w-0'>
            <h4 className='font-medium text-sm'>{config.title}</h4>
            <p className='text-xs opacity-90'>{config.message}</p>
          </div>

          {!isOffline && (
            <button
              onClick={() => setShowNotification(false)}
              className='text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors'
            >
              <SmartIcon type='x' size={16} />
            </button>
          )}
        </div>
      </div>
    );
  }
);

/**
 * OfflineIndicator Component
 * Indicador simples de status offline
 */
export const OfflineIndicator = memo(({ className = '' }) => {
  const { isOffline } = useNetworkStatus();

  if (!isOffline) return null;

  return (
    <div
      className={`flex items-center gap-2 text-red-600 dark:text-red-400 ${className}`}
    >
      <SmartIcon type='wifi-off' size={16} />
      <span className='text-sm font-medium'>Offline</span>
    </div>
  );
});

/**
 * ConnectionQuality Component
 * Indicador de qualidade da conexão
 */
export const ConnectionQuality = memo(({ className = '' }) => {
  const { effectiveType, isSlowConnection } = useNetworkStatus();

  const getQualityConfig = () => {
    switch (effectiveType) {
      case 'slow-2g':
        return { bars: 1, color: '#ef4444', label: 'Muito Lenta' };
      case '2g':
        return { bars: 2, color: '#f59e0b', label: 'Lenta' };
      case '3g':
        return { bars: 3, color: '#f59e0b', label: 'Moderada' };
      case '4g':
        return { bars: 4, color: '#10b981', label: 'Rápida' };
      case '5g':
        return { bars: 5, color: '#10b981', label: 'Muito Rápida' };
      default:
        return { bars: 3, color: '#6b7280', label: 'Desconhecida' };
    }
  };

  const { bars, color, label } = getQualityConfig();

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className='flex items-end gap-1'>
        {[1, 2, 3, 4, 5].map(bar => (
          <div
            key={bar}
            className={`w-1 rounded-sm transition-colors ${
              bar <= bars ? 'opacity-100' : 'opacity-30'
            }`}
            style={{
              height: `${bar * 3 + 2}px`,
              backgroundColor: bar <= bars ? color : '#d1d5db',
            }}
          />
        ))}
      </div>
      <span className='text-xs text-gray-600 dark:text-gray-400'>{label}</span>
    </div>
  );
});

NetworkStatus.displayName = 'NetworkStatus';
OfflineIndicator.displayName = 'OfflineIndicator';
ConnectionQuality.displayName = 'ConnectionQuality';

export default NetworkStatus;
