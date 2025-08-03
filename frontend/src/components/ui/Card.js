// Reusable Card Component - mantendo estilos existentes
import React, { memo } from 'react';
import { clsx } from 'clsx';

/**
 * Card Component Reutilizável
 * Mantém todos os estilos existentes do dashboard
 */
const Card = memo(
  ({
    children,
    className = '',
    padding = 'default',
    shadow = 'default',
    border = true,
    background = 'white',
    ...props
  }) => {
    const baseClasses = 'rounded-lg transition-all duration-200';

    const paddingClasses = {
      none: '',
      sm: 'p-4',
      default: 'p-6',
      lg: 'p-8',
    };

    const shadowClasses = {
      none: '',
      sm: 'shadow-sm',
      default: 'shadow-sm hover:shadow-lg',
      lg: 'shadow-lg hover:shadow-xl',
    };

    const backgroundClasses = {
      white: 'bg-white dark:bg-gray-800',
      transparent: 'bg-white/60 dark:bg-gray-800/60 backdrop-blur-lg',
      gradient:
        'bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20',
    };

    const borderClasses = border
      ? 'border border-gray-200 dark:border-gray-700'
      : '';

    return (
      <div
        className={clsx(
          baseClasses,
          paddingClasses[padding],
          shadowClasses[shadow],
          backgroundClasses[background],
          borderClasses,
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export default Card;
