// Reusable Button Component - mantendo estilos existentes
import React, { memo } from 'react';
import { clsx } from 'clsx';

import LoadingSpinner from './LoadingSpinner';

/**
 * Button Component Reutilizável
 * Mantém todos os estilos existentes, apenas organiza melhor
 */
const Button = memo(
  ({
    children,
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    className = '',
    onClick,
    type = 'button',
    ...props
  }) => {
    const baseClasses =
      'inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2';

    const variants = {
      primary:
        'bg-pastel-purple-500 hover:bg-pastel-purple-600 text-white focus:ring-pastel-purple-500 transform hover:scale-105 shadow-lg',
      secondary:
        'border-2 border-pastel-purple-500 text-pastel-purple-600 hover:bg-pastel-purple-50 dark:hover:bg-pastel-purple-900/20 focus:ring-pastel-purple-500',
      gradient:
        'bg-gradient-to-r from-pastel-purple-500 to-pastel-blue-500 hover:from-pastel-purple-600 hover:to-pastel-blue-600 text-white font-bold transform hover:scale-105 shadow-xl',
      danger: 'bg-red-500 hover:bg-red-600 text-white focus:ring-red-500',
    };

    const sizes = {
      sm: 'px-4 py-2 text-sm',
      md: 'px-6 py-3 text-base',
      lg: 'px-8 py-4 text-lg',
    };

    const handleClick = e => {
      if (!loading && !disabled && onClick) {
        onClick(e);
      }
    };

    return (
      <button
        type={type}
        className={clsx(
          baseClasses,
          variants[variant],
          sizes[size],
          {
            'opacity-50 cursor-not-allowed': disabled || loading,
          },
          className
        )}
        disabled={disabled || loading}
        onClick={handleClick}
        {...props}
      >
        {loading && <LoadingSpinner size='sm' className='mr-2' />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
