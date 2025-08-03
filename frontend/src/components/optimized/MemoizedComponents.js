// Memoized versions of existing components for performance
import React, { memo } from 'react';

import { SmartIcon } from '../ModernIcons';

/**
 * Memoized Icon Component
 * Evita re-renderizações desnecessárias de ícones
 */
export const MemoizedIcon = memo(
  ({ type, size, color, className, ...props }) => {
    return (
      <SmartIcon
        type={type}
        size={size}
        color={color}
        className={className}
        {...props}
      />
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.type === nextProps.type &&
      prevProps.size === nextProps.size &&
      prevProps.color === nextProps.color &&
      prevProps.className === nextProps.className
    );
  }
);

/**
 * Memoized Date Display
 * Para datas que não mudam frequentemente
 */
export const MemoizedDate = memo(
  ({ date, format = 'pt-BR' }) => {
    const formattedDate = new Date(date).toLocaleDateString(format);
    return <span>{formattedDate}</span>;
  },
  (prevProps, nextProps) => {
    return (
      prevProps.date === nextProps.date && prevProps.format === nextProps.format
    );
  }
);

/**
 * Memoized Score Display
 * Para pontuações que não mudam
 */
export const MemoizedScore = memo(
  ({ score, className = '' }) => {
    const getScoreColor = score => {
      if (score >= 900) return 'text-green-600';
      if (score >= 700) return 'text-blue-600';
      if (score >= 500) return 'text-yellow-600';
      if (score >= 300) return 'text-orange-600';
      return 'text-red-600';
    };

    return (
      <span className={`font-bold ${getScoreColor(score)} ${className}`}>
        {score.toFixed(1)}
      </span>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.score === nextProps.score &&
      prevProps.className === nextProps.className
    );
  }
);

/**
 * Memoized Text Truncate
 * Para textos longos que são truncados
 */
export const MemoizedTruncatedText = memo(
  ({ text, maxLength = 100, className = '' }) => {
    const truncatedText =
      text && text.length > maxLength
        ? text.substring(0, maxLength).trim() + '...'
        : text;

    return <span className={className}>{truncatedText}</span>;
  },
  (prevProps, nextProps) => {
    return (
      prevProps.text === nextProps.text &&
      prevProps.maxLength === nextProps.maxLength &&
      prevProps.className === nextProps.className
    );
  }
);

/**
 * Memoized Loading State
 * Para estados de carregamento
 */
export const MemoizedLoadingState = memo(
  ({ message = 'Carregando...', size = 'md' }) => {
    const sizeClasses = {
      sm: 'h-4 w-4',
      md: 'h-8 w-8',
      lg: 'h-12 w-12',
    };

    return (
      <div className='flex items-center justify-center py-8'>
        <div className='text-center'>
          <div
            className={`animate-spin rounded-full border-2 border-gray-300 border-t-pastel-purple-500 ${sizeClasses[size]} mx-auto mb-4`}
          ></div>
          <p className='text-gray-600 dark:text-gray-300'>{message}</p>
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.message === nextProps.message &&
      prevProps.size === nextProps.size
    );
  }
);

export default {
  MemoizedIcon,
  MemoizedDate,
  MemoizedScore,
  MemoizedTruncatedText,
  MemoizedLoadingState,
};
