// Progress Bar Component - mantendo estilos existentes
import React, { memo } from 'react';

/**
 * ProgressBar Component
 * Barra de progresso elegante mantendo o design atual
 */
const ProgressBar = memo(
  ({
    progress = 0,
    showPercentage = true,
    size = 'md',
    color = 'purple',
    animated = true,
    className = '',
  }) => {
    const sizeClasses = {
      sm: 'h-1',
      md: 'h-2',
      lg: 'h-3',
    };

    const colorClasses = {
      purple: 'bg-pastel-purple-500',
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      yellow: 'bg-yellow-500',
      red: 'bg-red-500',
    };

    const clampedProgress = Math.min(100, Math.max(0, progress));

    return (
      <div className={`w-full ${className}`}>
        {showPercentage && (
          <div className='flex justify-between items-center mb-1'>
            <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
              Progresso
            </span>
            <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
              {Math.round(clampedProgress)}%
            </span>
          </div>
        )}

        <div
          className={`w-full bg-gray-200 dark:bg-gray-700 rounded-full ${sizeClasses[size]}`}
        >
          <div
            className={`
            ${colorClasses[color]} 
            ${sizeClasses[size]} 
            rounded-full 
            transition-all 
            duration-500 
            ease-out
            ${animated ? 'animate-pulse' : ''}
          `}
            style={{ width: `${clampedProgress}%` }}
          />
        </div>
      </div>
    );
  }
);

ProgressBar.displayName = 'ProgressBar';

export default ProgressBar;
