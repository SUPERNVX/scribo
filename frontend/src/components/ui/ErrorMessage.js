// Error Message Component - mantendo estilos existentes
import React, { memo } from 'react';

import { SmartIcon } from '../ModernIcons';

import Button from './Button';

/**
 * ErrorMessage Component
 * Mantém o estilo existente de tratamento de erros
 */
const ErrorMessage = memo(
  ({
    message = 'Ocorreu um erro inesperado',
    title = 'Erro',
    onRetry,
    showRetryButton = true,
    icon = 'alert-circle',
    className = '',
  }) => {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className='text-red-500 mb-4'>
          <SmartIcon type={icon} size={48} />
        </div>
        <h2 className='text-xl font-semibold text-gray-800 dark:text-white mb-2'>
          {title}
        </h2>
        <p className='text-gray-600 dark:text-gray-300 mb-6'>{message}</p>
        {showRetryButton && onRetry && (
          <Button variant='primary' onClick={onRetry}>
            Tentar Novamente
          </Button>
        )}
      </div>
    );
  }
);

ErrorMessage.displayName = 'ErrorMessage';

export default ErrorMessage;
