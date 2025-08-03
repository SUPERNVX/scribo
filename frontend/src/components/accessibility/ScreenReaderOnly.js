// Screen Reader Only Component for accessibility
import React, { memo } from 'react';

/**
 * ScreenReaderOnly Component
 * Conteúdo visível apenas para screen readers
 */
const ScreenReaderOnly = memo(
  ({ children, as: Component = 'span', ...props }) => {
    return (
      <Component className='sr-only' {...props}>
        {children}
      </Component>
    );
  }
);

/**
 * LiveRegion Component
 * Região dinâmica para anúncios de screen reader
 */
export const LiveRegion = memo(
  ({
    children,
    politeness = 'polite', // 'polite' | 'assertive' | 'off'
    atomic = false,
    className = '',
    ...props
  }) => {
    return (
      <div
        aria-live={politeness}
        aria-atomic={atomic}
        className={`sr-only ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

/**
 * VisuallyHidden Component
 * Esconde visualmente mas mantém para screen readers
 */
export const VisuallyHidden = memo(
  ({ children, focusable = false, ...props }) => {
    return (
      <span
        className={focusable ? 'sr-only focus:not-sr-only' : 'sr-only'}
        {...props}
      >
        {children}
      </span>
    );
  }
);

/**
 * Heading Component
 * Cabeçalho semântico com nível apropriado
 */
export const AccessibleHeading = memo(
  ({ level = 1, children, className = '', visualLevel, ...props }) => {
    const HeadingTag = `h${level}`;

    // Permite estilo visual diferente do nível semântico
    const visualClass = visualLevel ? `text-${visualLevel}xl font-bold` : '';

    return (
      <HeadingTag className={`${visualClass} ${className}`} {...props}>
        {children}
      </HeadingTag>
    );
  }
);

/**
 * DescribedBy Component
 * Wrapper para elementos com descrição
 */
export const DescribedBy = memo(
  ({ children, description, descriptionId, className = '', ...props }) => {
    const generatedId =
      descriptionId || `desc-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div className={className} {...props}>
        <div aria-describedby={generatedId}>{children}</div>
        <ScreenReaderOnly id={generatedId}>{description}</ScreenReaderOnly>
      </div>
    );
  }
);

ScreenReaderOnly.displayName = 'ScreenReaderOnly';
LiveRegion.displayName = 'LiveRegion';
VisuallyHidden.displayName = 'VisuallyHidden';
AccessibleHeading.displayName = 'AccessibleHeading';
DescribedBy.displayName = 'DescribedBy';

export default ScreenReaderOnly;
