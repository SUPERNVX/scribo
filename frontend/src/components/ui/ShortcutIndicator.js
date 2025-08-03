// Shortcut Indicator Component
import React, { memo } from 'react';

/**
 * ShortcutIndicator Component
 * Mostra indicadores visuais de atalhos de teclado
 */
const ShortcutIndicator = memo(
  ({
    shortcut,
    description,
    size = 'sm',
    variant = 'default',
    className = '',
  }) => {
    if (!shortcut) return null;

    const sizeClasses = {
      xs: 'text-xs px-1 py-0.5',
      sm: 'text-xs px-1.5 py-1',
      md: 'text-sm px-2 py-1',
      lg: 'text-base px-2.5 py-1.5',
    };

    const variantClasses = {
      default:
        'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600',
      primary:
        'bg-pastel-purple-100 text-pastel-purple-700 border-pastel-purple-200 dark:bg-pastel-purple-900 dark:text-pastel-purple-300',
      secondary:
        'bg-pastel-blue-100 text-pastel-blue-700 border-pastel-blue-200 dark:bg-pastel-blue-900 dark:text-pastel-blue-300',
    };

    // Formatar atalho para exibição
    const formatShortcut = shortcut => {
      return shortcut
        .replace('ctrl+', 'Ctrl+')
        .replace('shift+', 'Shift+')
        .replace('alt+', 'Alt+')
        .replace('meta+', 'Ctrl+')
        .toUpperCase();
    };

    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <kbd
          className={`
          inline-flex items-center justify-center
          font-mono font-medium
          border rounded
          ${sizeClasses[size]}
          ${variantClasses[variant]}
        `}
          title={description}
        >
          {formatShortcut(shortcut)}
        </kbd>
        {description && (
          <span className='text-xs text-gray-500 dark:text-gray-400'>
            {description}
          </span>
        )}
      </div>
    );
  }
);

ShortcutIndicator.displayName = 'ShortcutIndicator';

/**
 * ShortcutsList Component
 * Lista de atalhos disponíveis
 */
export const ShortcutsList = memo(({ shortcuts = [], className = '' }) => {
  if (!shortcuts.length) return null;

  return (
    <div className={`space-y-2 ${className}`}>
      <h4 className='text-sm font-medium text-gray-700 dark:text-gray-300 mb-3'>
        Atalhos de Teclado
      </h4>
      <div className='grid gap-2'>
        {shortcuts.map((shortcut, index) => (
          <div key={index} className='flex items-center justify-between'>
            <span className='text-sm text-gray-600 dark:text-gray-400'>
              {shortcut.description}
            </span>
            <ShortcutIndicator
              shortcut={shortcut.key}
              size='xs'
              variant='default'
            />
          </div>
        ))}
      </div>
    </div>
  );
});

ShortcutsList.displayName = 'ShortcutsList';



export default ShortcutIndicator;
