// Focus Indicator Component for accessibility
import React, { memo } from 'react';

/**
 * FocusIndicator Component
 * Indicador de foco customizado mantendo design atual
 */
const FocusIndicator = memo(({ children, className = '', ...props }) => {
  return (
    <div
      className={`
        focus-within:ring-2 
        focus-within:ring-pastel-purple-500 
        focus-within:ring-offset-2 
        focus-within:ring-offset-white 
        dark:focus-within:ring-offset-gray-900
        rounded-lg
        transition-all
        duration-200
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
});

/**
 * AccessibleButton Component
 * Botão com acessibilidade completa mantendo estilos
 */
export const AccessibleButton = memo(
  ({
    children,
    onClick,
    disabled = false,
    ariaLabel,
    ariaDescribedBy,
    ariaExpanded,
    className = '',
    ...props
  }) => {
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        aria-expanded={ariaExpanded}
        className={`
        focus:outline-none 
        focus:ring-2 
        focus:ring-pastel-purple-500 
        focus:ring-offset-2
        transition-all
        duration-200
        ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
        ${className}
      `}
        {...props}
      >
        {children}
      </button>
    );
  }
);

/**
 * AccessibleLink Component
 * Link com acessibilidade completa
 */
export const AccessibleLink = memo(
  ({
    children,
    href,
    external = false,
    ariaLabel,
    className = '',
    ...props
  }) => {
    return (
      <a
        href={href}
        target={external ? '_blank' : undefined}
        rel={external ? 'noopener noreferrer' : undefined}
        aria-label={
          ariaLabel || (external ? `${children} (abre em nova aba)` : undefined)
        }
        className={`
        focus:outline-none 
        focus:ring-2 
        focus:ring-pastel-purple-500 
        focus:ring-offset-2
        transition-all
        duration-200
        ${className}
      `}
        {...props}
      >
        {children}
      </a>
    );
  }
);

FocusIndicator.displayName = 'FocusIndicator';
AccessibleButton.displayName = 'AccessibleButton';
AccessibleLink.displayName = 'AccessibleLink';

export default FocusIndicator;
