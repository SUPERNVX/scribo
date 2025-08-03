// Smart Tooltip Component with Intelligent Positioning
import React, { useState, useRef, useEffect } from 'react';

/**
 * Smart Tooltip que ajusta automaticamente sua posição para não ser cortado
 */
const SmartTooltip = ({ 
  children, 
  text, 
  preferredPosition = 'bottom', 
  delay = 200,
  className = '' 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState(preferredPosition);
  const tooltipRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (isVisible && tooltipRef.current && containerRef.current) {
      const tooltip = tooltipRef.current;
      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      const tooltipRect = tooltip.getBoundingClientRect();
      
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      let newPosition = preferredPosition;
      
      // Verificar se o tooltip seria cortado e ajustar posição
      switch (preferredPosition) {
        case 'top':
          if (rect.top - tooltipRect.height < 10) {
            newPosition = 'bottom';
          }
          break;
        case 'bottom':
          if (rect.bottom + tooltipRect.height > viewportHeight - 10) {
            newPosition = 'top';
          }
          break;
        case 'left':
          if (rect.left - tooltipRect.width < 10) {
            newPosition = 'right';
          }
          break;
        case 'right':
          if (rect.right + tooltipRect.width > viewportWidth - 10) {
            newPosition = 'left';
          }
          break;
      }
      
      // Para elementos no header, sempre preferir bottom
      if (rect.top < 80) {
        newPosition = 'bottom';
      }
      
      setPosition(newPosition);
    }
  }, [isVisible, preferredPosition]);

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
      default:
        return 'top-full left-1/2 transform -translate-x-1/2 mt-3';
    }
  };

  const getArrowClasses = () => {
    switch (position) {
      case 'top':
        return 'absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-100';
      case 'bottom':
        return 'absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900 dark:border-b-gray-100';
      case 'left':
        return 'absolute left-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-l-4 border-transparent border-l-gray-900 dark:border-l-gray-100';
      case 'right':
        return 'absolute right-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-t-4 border-b-4 border-r-4 border-transparent border-r-gray-900 dark:border-r-gray-100';
      default:
        return 'absolute bottom-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900 dark:border-b-gray-100';
    }
  };

  let timeoutId;

  const handleMouseEnter = () => {
    timeoutId = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const handleMouseLeave = () => {
    clearTimeout(timeoutId);
    setIsVisible(false);
  };

  return (
    <div 
      ref={containerRef}
      className={`relative ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {isVisible && (
        <div
          ref={tooltipRef}
          className={`absolute ${getPositionClasses()} z-50 pointer-events-none`}
        >
          <div className='bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-medium px-3 py-2 rounded-lg shadow-lg whitespace-nowrap max-w-xs'>
            {text}
            <div className={getArrowClasses()}></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartTooltip;