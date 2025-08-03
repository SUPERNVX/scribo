// Contextual Help Component for Micro-UX improvements
import React, { memo, useState, useRef, useEffect } from 'react';

/**
 * ContextualHelp Component
 * Tooltip inteligente com ajuda contextual
 */
const ContextualHelp = memo(
  ({
    content,
    position = 'top',
    trigger = 'hover',
    delay = 300,
    maxWidth = '300px',
    className = '',
    children,
  }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [actualPosition, setActualPosition] = useState(position);
    const timeoutRef = useRef();
    const tooltipRef = useRef();
    const triggerRef = useRef();

    // Calcular melhor posição baseada no viewport
    const calculatePosition = () => {
      if (!triggerRef.current || !tooltipRef.current) return;

      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight,
      };

      let newPosition = position;

      // Verificar se tooltip sai da tela e ajustar posição
      if (position === 'top' && triggerRect.top - tooltipRect.height < 10) {
        newPosition = 'bottom';
      } else if (
        position === 'bottom' &&
        triggerRect.bottom + tooltipRect.height > viewport.height - 10
      ) {
        newPosition = 'top';
      } else if (
        position === 'left' &&
        triggerRect.left - tooltipRect.width < 10
      ) {
        newPosition = 'right';
      } else if (
        position === 'right' &&
        triggerRect.right + tooltipRect.width > viewport.width - 10
      ) {
        newPosition = 'left';
      }

      setActualPosition(newPosition);
    };

    const showTooltip = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      timeoutRef.current = setTimeout(() => {
        setIsVisible(true);
        setTimeout(calculatePosition, 10);
      }, delay);
    };

    const hideTooltip = () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setIsVisible(false);
    };

    const handleClick = () => {
      if (trigger === 'click') {
        setIsVisible(!isVisible);
        if (!isVisible) {
          setTimeout(calculatePosition, 10);
        }
      }
    };

    useEffect(() => {
      return () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      };
    }, []);

    // Classes de posicionamento
    const positionClasses = {
      top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
      bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
      left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
      right: 'left-full top-1/2 transform -translate-y-1/2 ml-2',
    };

    // Classes da seta
    const arrowClasses = {
      top: 'top-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent border-t-gray-800',
      bottom:
        'bottom-full left-1/2 transform -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent border-b-gray-800',
      left: 'left-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent border-l-gray-800',
      right:
        'right-full top-1/2 transform -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent border-r-gray-800',
    };

    const triggerProps = {
      ref: triggerRef,
      ...(trigger === 'hover' && {
        onMouseEnter: showTooltip,
        onMouseLeave: hideTooltip,
      }),
      ...(trigger === 'click' && {
        onClick: handleClick,
      }),
      ...(trigger === 'focus' && {
        onFocus: showTooltip,
        onBlur: hideTooltip,
      }),
    };

    return (
      <div className={`relative inline-block ${className}`}>
        <div {...triggerProps}>{children}</div>

        {isVisible && (
          <>
            {/* Overlay para fechar no click (apenas para trigger click) */}
            {trigger === 'click' && (
              <div
                className='fixed inset-0 z-10'
                onClick={() => setIsVisible(false)}
              />
            )}

            {/* Tooltip */}
            <div
              ref={tooltipRef}
              className={`
              absolute z-20 px-3 py-2 text-sm text-white bg-gray-800 rounded-lg shadow-lg
              animate-in fade-in-0 zoom-in-95 duration-200
              ${positionClasses[actualPosition]}
            `}
              style={{ maxWidth }}
            >
              {/* Seta */}
              <div
                className={`absolute w-0 h-0 border-4 ${arrowClasses[actualPosition]}`}
              />

              {/* Conteúdo */}
              <div className='relative z-10'>
                {typeof content === 'string' ? (
                  <p className='text-sm leading-relaxed'>{content}</p>
                ) : (
                  content
                )}
              </div>
            </div>
          </>
        )}
      </div>
    );
  }
);

ContextualHelp.displayName = 'ContextualHelp';

/**
 * HelpIcon Component
 * Ícone de ajuda padrão
 */
export const HelpIcon = memo(({ size = 'sm', className = '', ...props }) => {
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <svg
      className={`${sizeClasses[size]} text-gray-400 hover:text-gray-600 cursor-help ${className}`}
      fill='none'
      stroke='currentColor'
      viewBox='0 0 24 24'
      {...props}
    >
      <path
        strokeLinecap='round'
        strokeLinejoin='round'
        strokeWidth={2}
        d='M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
      />
    </svg>
  );
});

HelpIcon.displayName = 'HelpIcon';

/**
 * QuickHelp Component
 * Ajuda rápida com ícone integrado
 */
export const QuickHelp = memo(
  ({ content, position = 'top', size = 'sm', className = '' }) => {
    return (
      <ContextualHelp
        content={content}
        position={position}
        trigger='hover'
        className={className}
      >
        <HelpIcon size={size} />
      </ContextualHelp>
    );
  }
);

QuickHelp.displayName = 'QuickHelp';

/**
 * InlineHelp Component
 * Ajuda inline para formulários
 */
export const InlineHelp = memo(
  ({ content, label, required = false, className = '' }) => {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <label className='text-sm font-medium text-gray-700 dark:text-gray-300'>
          {label}
          {required && <span className='text-red-500 ml-1'>*</span>}
        </label>
        <QuickHelp content={content} size='xs' />
      </div>
    );
  }
);

InlineHelp.displayName = 'InlineHelp';

export default ContextualHelp;
