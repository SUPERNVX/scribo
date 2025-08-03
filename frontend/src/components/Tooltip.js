import React from 'react';

const Tooltip = ({ children, text, position = 'auto', delay = 0 }) => {
  const getPositionClasses = () => {
    switch (position) {
      case 'top':
        return 'bottom-full left-1/2 transform -translate-x-1/2 mb-3';
      case 'bottom':
        return 'top-full left-1/2 transform -translate-x-1/2 mt-3';
      case 'left':
        return 'right-full top-1/2 transform -translate-y-1/2 mr-3';
      case 'right':
        return 'left-full top-1/2 transform -translate-y-1/2 ml-3';
      case 'auto':
        // Para header, usar bottom por padrão para evitar corte
        return 'top-full left-1/2 transform -translate-x-1/2 mt-3';
      default:
        return 'top-full left-1/2 transform -translate-x-1/2 mt-3';
    }
  };

  const getArrowClasses = () => {
    switch (position) {
      case 'top':
        return 'absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-soft-gray-900 dark:border-t-dark-bg-card';
      case 'bottom':
        return 'absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-soft-gray-900 dark:border-b-dark-bg-card';
      case 'left':
        return 'absolute left-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-l-4 border-transparent border-l-soft-gray-900 dark:border-l-dark-bg-card';
      case 'right':
        return 'absolute right-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-soft-gray-900 dark:border-r-dark-bg-card';
      default:
        return 'absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-soft-gray-900 dark:border-t-dark-bg-card';
    }
  };

  return (
    <div className='relative group'>
      {children}
      <div
        className={`absolute ${getPositionClasses()} opacity-0 group-hover:opacity-100 transition-all duration-200 ease-out pointer-events-none z-20`}
        style={{ transitionDelay: `${delay}ms` }}
      >
        <div className='bg-soft-gray-900 dark:bg-dark-bg-card text-white dark:text-dark-text-primary text-xs font-medium px-3 py-2 rounded-lg shadow-lg whitespace-nowrap'>
          {text}
          <div className={getArrowClasses()}></div>
        </div>
      </div>
    </div>
  );
};

export default Tooltip;
