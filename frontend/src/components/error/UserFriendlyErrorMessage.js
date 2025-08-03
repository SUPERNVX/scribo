// User-Friendly Error Message Components
import React, { memo, useState, useEffect } from 'react';
import { SmartIcon } from '../ModernIcons';
import { getUserFriendlyMessage } from '../../utils/networkErrorHandler';
import { useErrorRecovery } from '../../utils/errorRecovery';

/**
 * Error Message Types
 */
const ERROR_MESSAGE_TYPES = {
  INLINE: 'inline',
  TOAST: 'toast',
  MODAL: 'modal',
  BANNER: 'banner',
};

/**
 * Error Severity Levels
 */
const ERROR_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
};

/**
 * Main User-Friendly Error Message Component
 */
const UserFriendlyErrorMessage = memo(({
  error,
  type = ERROR_MESSAGE_TYPES.INLINE,
  severity = ERROR_SEVERITY.MEDIUM,
  showRetry = true,
  showDetails = false,
  onRetry,
  onDismiss,
  autoHide = false,
  autoHideDelay = 5000,
  className = '',
  context = {},
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const { recover, isRecovering } = useErrorRecovery();

  // Auto-hide functionality
  useEffect(() => {
    if (autoHide && autoHideDelay > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onDismiss?.();
      }, autoHideDelay);

      return () => clearTimeout(timer);
    }
  }, [autoHide, autoHideDelay, onDismiss]);

  if (!isVisible || !error) return null;

  const userMessage = getUserFriendlyMessage(error);
  const errorIcon = getErrorIcon(severity);
  const errorColors = getErrorColors(severity);

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      recover(error, context);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  // Render based on type
  switch (type) {
    case ERROR_MESSAGE_TYPES.TOAST:
      return <ErrorToast {...{ error, userMessage, errorIcon, errorColors, handleRetry, handleDismiss, showRetry, isRecovering, className }} />;
    
    case ERROR_MESSAGE_TYPES.MODAL:
      return <ErrorModal {...{ error, userMessage, errorIcon, errorColors, handleRetry, handleDismiss, showRetry, showDetails, isRecovering, isExpanded, setIsExpanded, className }} />;
    
    case ERROR_MESSAGE_TYPES.BANNER:
      return <ErrorBanner {...{ error, userMessage, errorIcon, errorColors, handleRetry, handleDismiss, showRetry, isRecovering, className }} />;
    
    default:
      return <ErrorInline {...{ error, userMessage, errorIcon, errorColors, handleRetry, handleDismiss, showRetry, showDetails, isRecovering, isExpanded, setIsExpanded, className }} />;
  }
});

/**
 * Inline Error Message
 */
const ErrorInline = memo(({
  error,
  userMessage,
  errorIcon,
  errorColors,
  handleRetry,
  handleDismiss,
  showRetry,
  showDetails,
  isRecovering,
  isExpanded,
  setIsExpanded,
  className,
}) => (
  <div className={`rounded-lg border p-4 ${errorColors.bg} ${errorColors.border} ${className}`}>
    <div className="flex items-start">
      <div className="flex-shrink-0">
        {isRecovering ? (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
        ) : (
          <SmartIcon type={errorIcon} size={20} color={errorColors.icon} />
        )}
      </div>
      
      <div className="ml-3 flex-1">
        <p className={`text-sm font-medium ${errorColors.text}`}>
          {userMessage}
        </p>
        
        {showDetails && error && (
          <div className="mt-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={`text-xs ${errorColors.link} hover:underline focus:outline-none`}
            >
              {isExpanded ? 'Ocultar detalhes' : 'Ver detalhes'}
            </button>
            
            {isExpanded && (
              <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono text-gray-600 dark:text-gray-400">
                <div><strong>Erro:</strong> {error.message}</div>
                {error.code && <div><strong>Código:</strong> {error.code}</div>}
                {error.status && <div><strong>Status:</strong> {error.status}</div>}
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="ml-4 flex-shrink-0 flex space-x-2">
        {showRetry && (
          <button
            onClick={handleRetry}
            disabled={isRecovering}
            className={`text-sm font-medium ${errorColors.button} hover:underline focus:outline-none disabled:opacity-50`}
          >
            {isRecovering ? 'Tentando...' : 'Tentar Novamente'}
          </button>
        )}
        
        <button
          onClick={handleDismiss}
          className={`text-sm font-medium ${errorColors.dismiss} hover:underline focus:outline-none`}
        >
          Dispensar
        </button>
      </div>
    </div>
  </div>
));

/**
 * Toast Error Message
 */
const ErrorToast = memo(({
  userMessage,
  errorIcon,
  errorColors,
  handleRetry,
  handleDismiss,
  showRetry,
  isRecovering,
  className,
}) => (
  <div className={`fixed top-4 right-4 z-50 max-w-sm w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg border ${errorColors.border} ${className} slide-in-down`}>
    <div className="p-4">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {isRecovering ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
          ) : (
            <SmartIcon type={errorIcon} size={20} color={errorColors.icon} />
          )}
        </div>
        
        <div className="ml-3 flex-1">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {userMessage}
          </p>
        </div>
        
        <button
          onClick={handleDismiss}
          className="ml-4 flex-shrink-0 text-gray-400 hover:text-gray-600 focus:outline-none"
        >
          <SmartIcon type="x" size={16} />
        </button>
      </div>
      
      {showRetry && (
        <div className="mt-3 flex justify-end">
          <button
            onClick={handleRetry}
            disabled={isRecovering}
            className="text-sm font-medium text-pastel-purple-600 hover:text-pastel-purple-500 focus:outline-none disabled:opacity-50"
          >
            {isRecovering ? 'Tentando...' : 'Tentar Novamente'}
          </button>
        </div>
      )}
    </div>
  </div>
));

/**
 * Banner Error Message
 */
const ErrorBanner = memo(({
  userMessage,
  errorIcon,
  errorColors,
  handleRetry,
  handleDismiss,
  showRetry,
  isRecovering,
  className,
}) => (
  <div className={`${errorColors.bg} ${errorColors.border} border-b ${className}`}>
    <div className="max-w-7xl mx-auto py-3 px-3 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between flex-wrap">
        <div className="w-0 flex-1 flex items-center">
          <span className="flex p-2 rounded-lg">
            {isRecovering ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
            ) : (
              <SmartIcon type={errorIcon} size={20} color={errorColors.icon} />
            )}
          </span>
          <p className={`ml-3 font-medium ${errorColors.text}`}>
            {userMessage}
          </p>
        </div>
        
        <div className="order-3 mt-2 flex-shrink-0 w-full sm:order-2 sm:mt-0 sm:w-auto">
          <div className="flex space-x-4">
            {showRetry && (
              <button
                onClick={handleRetry}
                disabled={isRecovering}
                className={`text-sm font-medium ${errorColors.button} hover:underline focus:outline-none disabled:opacity-50`}
              >
                {isRecovering ? 'Tentando...' : 'Tentar Novamente'}
              </button>
            )}
            
            <button
              onClick={handleDismiss}
              className={`text-sm font-medium ${errorColors.dismiss} hover:underline focus:outline-none`}
            >
              Dispensar
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
));

/**
 * Modal Error Message
 */
const ErrorModal = memo(({
  error,
  userMessage,
  errorIcon,
  errorColors,
  handleRetry,
  handleDismiss,
  showRetry,
  showDetails,
  isRecovering,
  isExpanded,
  setIsExpanded,
  className,
}) => (
  <div className="fixed inset-0 z-50 overflow-y-auto">
    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleDismiss}></div>
      
      <div className={`inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full ${className}`}>
        <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
          <div className="sm:flex sm:items-start">
            <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${errorColors.bg} sm:mx-0 sm:h-10 sm:w-10`}>
              {isRecovering ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-current"></div>
              ) : (
                <SmartIcon type={errorIcon} size={24} color={errorColors.icon} />
              )}
            </div>
            
            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                {isRecovering ? 'Recuperando...' : 'Erro na Aplicação'}
              </h3>
              
              <div className="mt-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {userMessage}
                </p>
                
                {showDetails && error && (
                  <div className="mt-4">
                    <button
                      onClick={() => setIsExpanded(!isExpanded)}
                      className="text-sm text-pastel-purple-600 hover:text-pastel-purple-500 focus:outline-none"
                    >
                      {isExpanded ? 'Ocultar detalhes técnicos' : 'Ver detalhes técnicos'}
                    </button>
                    
                    {isExpanded && (
                      <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono text-gray-600 dark:text-gray-300">
                        <div><strong>Erro:</strong> {error.message}</div>
                        {error.code && <div><strong>Código:</strong> {error.code}</div>}
                        {error.status && <div><strong>Status:</strong> {error.status}</div>}
                        {error.stack && (
                          <details className="mt-2">
                            <summary className="cursor-pointer">Stack Trace</summary>
                            <pre className="mt-1 whitespace-pre-wrap text-xs">{error.stack}</pre>
                          </details>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
          {showRetry && (
            <button
              onClick={handleRetry}
              disabled={isRecovering}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-pastel-purple-600 text-base font-medium text-white hover:bg-pastel-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pastel-purple-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
            >
              {isRecovering ? 'Tentando...' : 'Tentar Novamente'}
            </button>
          )}
          
          <button
            onClick={handleDismiss}
            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pastel-purple-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  </div>
));

/**
 * Helper function to get error icon based on severity
 */
const getErrorIcon = (severity) => {
  switch (severity) {
    case ERROR_SEVERITY.CRITICAL:
      return 'alert-circle';
    case ERROR_SEVERITY.HIGH:
      return 'alert-triangle';
    case ERROR_SEVERITY.MEDIUM:
      return 'info';
    case ERROR_SEVERITY.LOW:
      return 'alert-circle';
    default:
      return 'alert-triangle';
  }
};

/**
 * Helper function to get error colors based on severity
 */
const getErrorColors = (severity) => {
  switch (severity) {
    case ERROR_SEVERITY.CRITICAL:
      return {
        bg: 'bg-red-50 dark:bg-red-900/20',
        border: 'border-red-200 dark:border-red-800',
        text: 'text-red-800 dark:text-red-200',
        icon: '#dc2626',
        button: 'text-red-600 dark:text-red-400',
        link: 'text-red-600 dark:text-red-400',
        dismiss: 'text-red-500 dark:text-red-400',
      };
    case ERROR_SEVERITY.HIGH:
      return {
        bg: 'bg-orange-50 dark:bg-orange-900/20',
        border: 'border-orange-200 dark:border-orange-800',
        text: 'text-orange-800 dark:text-orange-200',
        icon: '#ea580c',
        button: 'text-orange-600 dark:text-orange-400',
        link: 'text-orange-600 dark:text-orange-400',
        dismiss: 'text-orange-500 dark:text-orange-400',
      };
    case ERROR_SEVERITY.MEDIUM:
      return {
        bg: 'bg-yellow-50 dark:bg-yellow-900/20',
        border: 'border-yellow-200 dark:border-yellow-800',
        text: 'text-yellow-800 dark:text-yellow-200',
        icon: '#d97706',
        button: 'text-yellow-600 dark:text-yellow-400',
        link: 'text-yellow-600 dark:text-yellow-400',
        dismiss: 'text-yellow-500 dark:text-yellow-400',
      };
    case ERROR_SEVERITY.LOW:
      return {
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        border: 'border-blue-200 dark:border-blue-800',
        text: 'text-blue-800 dark:text-blue-200',
        icon: '#2563eb',
        button: 'text-blue-600 dark:text-blue-400',
        link: 'text-blue-600 dark:text-blue-400',
        dismiss: 'text-blue-500 dark:text-blue-400',
      };
    default:
      return {
        bg: 'bg-gray-50 dark:bg-gray-900/20',
        border: 'border-gray-200 dark:border-gray-800',
        text: 'text-gray-800 dark:text-gray-200',
        icon: '#6b7280',
        button: 'text-gray-600 dark:text-gray-400',
        link: 'text-gray-600 dark:text-gray-400',
        dismiss: 'text-gray-500 dark:text-gray-400',
      };
  }
};

// Export components and utilities
export {
  UserFriendlyErrorMessage,
  ErrorInline,
  ErrorToast,
  ErrorBanner,
  ErrorModal,
  ERROR_MESSAGE_TYPES,
  ERROR_SEVERITY,
};

export default UserFriendlyErrorMessage;