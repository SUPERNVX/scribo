// Empty State Component - mantendo estilos existentes
import React, { memo } from 'react';

import { SmartIcon } from '../ModernIcons';

import Button from './Button';

/**
 * EmptyState Component
 * Mantém o estilo existente para estados vazios
 */
const EmptyState = memo(
  ({
    title = 'Nenhum item encontrado',
    description = 'Não há dados para exibir no momento.',
    icon = 'file-text',
    actionLabel,
    onAction,
    className = '',
  }) => {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className='text-gray-400 mb-4'>
          <SmartIcon type={icon} size={48} />
        </div>
        <h3 className='text-lg font-medium text-gray-900 dark:text-white mb-2'>
          {title}
        </h3>
        <p className='text-gray-600 dark:text-gray-300 mb-4'>{description}</p>
        {actionLabel && onAction && (
          <Button variant='primary' onClick={onAction}>
            <SmartIcon type='pen' size={16} className='mr-2' />
            {actionLabel}
          </Button>
        )}
      </div>
    );
  }
);

EmptyState.displayName = 'EmptyState';

export default EmptyState;
