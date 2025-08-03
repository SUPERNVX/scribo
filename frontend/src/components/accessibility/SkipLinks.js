// Skip Links Component for accessibility
import React, { memo } from 'react';

import { useSkipNavigation } from '../../hooks/useKeyboardNavigation';

/**
 * SkipLinks Component
 * Links de navegação rápida para acessibilidade
 * Mantém estilos existentes, apenas adiciona funcionalidade
 */
const SkipLinks = memo(() => {
  const { skipToContent, skipToNavigation } = useSkipNavigation();

  return (
    <div className='sr-only focus-within:not-sr-only'>
      <div className='fixed top-0 left-0 z-[9999] bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-br-lg shadow-lg'>
        <ul className='flex flex-col p-2 gap-1'>
          <li>
            <button
              onClick={skipToContent}
              className='px-3 py-2 text-sm font-medium text-gray-900 dark:text-white bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-pastel-purple-500 transition-colors'
            >
              Pular para conteúdo principal
            </button>
          </li>
          <li>
            <button
              onClick={skipToNavigation}
              className='px-3 py-2 text-sm font-medium text-gray-900 dark:text-white bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded focus:outline-none focus:ring-2 focus:ring-pastel-purple-500 transition-colors'
            >
              Pular para navegação
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
});

SkipLinks.displayName = 'SkipLinks';

export default SkipLinks;
