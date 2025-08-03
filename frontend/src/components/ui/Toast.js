// Enhanced Toast Component - mantendo estilos existentes
import React, { memo } from 'react';
import { toast } from 'react-hot-toast';

import { SmartIcon } from '../ModernIcons';

/**
 * Enhanced Toast utilities
 * Toasts mais elegantes mantendo o design atual
 */

// Custom toast component
const CustomToast = memo(({ type, title, message, onDismiss }) => {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return 'check-circle';
      case 'error':
        return 'alert-circle';
      case 'warning':
        return 'alert-triangle';
      case 'info':
        return 'info';
      default:
        return 'info';
    }
  };

  const getColors = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getIconColor = () => {
    switch (type) {
      case 'success':
        return '#10b981';
      case 'error':
        return '#ef4444';
      case 'warning':
        return '#f59e0b';
      case 'info':
        return '#3b82f6';
      default:
        return '#6b7280';
    }
  };

  return (
    <div
      className={`
      flex items-start gap-3 p-4 rounded-lg border shadow-lg backdrop-blur-sm
      ${getColors()}
      dark:bg-gray-800 dark:border-gray-600 dark:text-white
    `}
    >
      <SmartIcon type={getIcon()} size={20} color={getIconColor()} />
      <div className='flex-1 min-w-0'>
        {title && <h4 className='font-medium text-sm mb-1'>{title}</h4>}
        <p className='text-sm opacity-90'>{message}</p>
      </div>
      <button
        onClick={onDismiss}
        className='text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors'
      >
        <SmartIcon type='x' size={16} />
      </button>
    </div>
  );
});

CustomToast.displayName = 'CustomToast';

// Enhanced toast functions
export const showSuccessToast = (message, title = 'Sucesso!') => {
  toast.custom(
    t => (
      <CustomToast
        type='success'
        title={title}
        message={message}
        onDismiss={() => toast.dismiss(t.id)}
      />
    ),
    {
      duration: 4000,
      position: 'top-right',
    }
  );
};

export const showErrorToast = (message, title = 'Erro') => {
  toast.custom(
    t => (
      <CustomToast
        type='error'
        title={title}
        message={message}
        onDismiss={() => toast.dismiss(t.id)}
      />
    ),
    {
      duration: 6000,
      position: 'top-right',
    }
  );
};

export const showWarningToast = (message, title = 'Atenção') => {
  toast.custom(
    t => (
      <CustomToast
        type='warning'
        title={title}
        message={message}
        onDismiss={() => toast.dismiss(t.id)}
      />
    ),
    {
      duration: 5000,
      position: 'top-right',
    }
  );
};

export const showInfoToast = (message, title = 'Informação') => {
  toast.custom(
    t => (
      <CustomToast
        type='info'
        title={title}
        message={message}
        onDismiss={() => toast.dismiss(t.id)}
      />
    ),
    {
      duration: 4000,
      position: 'top-right',
    }
  );
};

// Progress toast for long operations
export const showProgressToast = (message, progress = 0) => {
  return toast.custom(
    t => (
      <div className='bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 min-w-[300px]'>
        <div className='flex items-center gap-3 mb-3'>
          <div className='animate-spin'>
            <SmartIcon type='loader' size={20} color='#a855f7' />
          </div>
          <span className='text-sm font-medium text-gray-900 dark:text-white'>
            {message}
          </span>
        </div>
        <div className='w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2'>
          <div
            className='bg-pastel-purple-500 h-2 rounded-full transition-all duration-300'
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className='text-xs text-gray-500 dark:text-gray-400 mt-1 text-right'>
          {Math.round(progress)}%
        </div>
      </div>
    ),
    {
      duration: Infinity,
      position: 'top-right',
    }
  );
};

export default {
  showSuccessToast,
  showErrorToast,
  showWarningToast,
  showInfoToast,
  showProgressToast,
};
