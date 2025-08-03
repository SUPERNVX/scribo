// Skeleton Loader Component - mantendo estilos existentes
import React, { memo } from 'react';

/**
 * SkeletonLoader Component
 * Loading skeleton que mantém o layout durante carregamento
 */
const SkeletonLoader = memo(
  ({ type = 'text', lines = 3, className = '', animate = true }) => {
    const baseClasses = `bg-gray-200 dark:bg-gray-700 rounded ${animate ? 'animate-pulse' : ''}`;

    const renderSkeleton = () => {
      switch (type) {
        case 'card':
          return (
            <div
              className={`bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}
            >
              <div className='flex justify-between items-start mb-4'>
                <div className='flex-1'>
                  <div className={`${baseClasses} h-6 w-3/4 mb-2`}></div>
                  <div className={`${baseClasses} h-4 w-1/2`}></div>
                </div>
                <div className={`${baseClasses} h-8 w-16`}></div>
              </div>
              <div className='space-y-2'>
                <div className={`${baseClasses} h-4 w-full`}></div>
                <div className={`${baseClasses} h-4 w-4/5`}></div>
                <div className={`${baseClasses} h-4 w-3/5`}></div>
              </div>
            </div>
          );

        case 'stat':
          return (
            <div
              className={`bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}
            >
              <div className='flex items-center justify-between'>
                <div className='flex-1'>
                  <div className={`${baseClasses} h-4 w-1/2 mb-2`}></div>
                  <div className={`${baseClasses} h-8 w-1/3`}></div>
                </div>
                <div className={`${baseClasses} h-6 w-6 rounded-full`}></div>
              </div>
            </div>
          );

        case 'avatar':
          return (
            <div
              className={`${baseClasses} h-10 w-10 rounded-full ${className}`}
            ></div>
          );

        case 'button':
          return (
            <div
              className={`${baseClasses} h-10 w-24 rounded-lg ${className}`}
            ></div>
          );

        case 'text':
        default:
          return (
            <div className={`space-y-2 ${className}`}>
              {Array.from({ length: lines }).map((_, index) => (
                <div
                  key={index}
                  className={`${baseClasses} h-4`}
                  style={{
                    width: index === lines - 1 ? '60%' : '100%',
                  }}
                ></div>
              ))}
            </div>
          );
      }
    };

    return renderSkeleton();
  }
);

SkeletonLoader.displayName = 'SkeletonLoader';

export default SkeletonLoader;
