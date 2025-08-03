// Dictionary Modal - Modal de dicionário para definições de palavras
import React, { memo, useState, useEffect } from 'react';

import { SmartIcon } from '../ModernIcons';

/**
 * Modal de dicionário para mostrar definições de palavras
 * Mantém 100% dos estilos visuais existentes
 */
const DictionaryModal = memo(({ isOpen, onClose, word, definition }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleBackdropClick = e => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = e => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isVisible) return null;

  return (
    <div
      className={`
        fixed inset-0 z-50 flex items-center justify-center p-4
        bg-black/50 backdrop-blur-sm transition-opacity duration-300
        ${isOpen ? 'opacity-100' : 'opacity-0'}
      `}
      onClick={handleBackdropClick}
    >
      <div
        className={`
          bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-600
          w-full max-w-md transform transition-all duration-300
          ${isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}
        `}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className='flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-600'>
          <div className='flex items-center gap-3'>
            <div className='p-2 bg-pastel-purple-100 dark:bg-pastel-purple-900/30 rounded-lg'>
              <SmartIcon type='book-open' size={20} color='#a855f7' />
            </div>
            <div>
              <h3 className='font-semibold text-gray-900 dark:text-white'>
                Dicionário
              </h3>
              <p className='text-sm text-gray-500 dark:text-gray-400'>
                Definição da palavra
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className='p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700'
            aria-label='Fechar dicionário'
          >
            <SmartIcon type='x' size={20} />
          </button>
        </div>

        {/* Content */}
        <div className='p-6'>
          {definition ? (
            <div className='space-y-4'>
              {/* Palavra */}
              <div>
                <h4 className='text-2xl font-bold text-pastel-purple-700 dark:text-pastel-purple-300 mb-2'>
                  {word}
                </h4>
                <span className='inline-block px-2 py-1 bg-pastel-purple-100 dark:bg-pastel-purple-900/30 text-pastel-purple-700 dark:text-pastel-purple-300 text-xs font-medium rounded-full'>
                  {definition.p || 'palavra'}
                </span>
              </div>

              {/* Definição */}
              <div>
                <h5 className='font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2'>
                  <SmartIcon type='info' size={16} color='#6b7280' />
                  Definição:
                </h5>
                <p className='text-gray-700 dark:text-gray-300 leading-relaxed'>
                  {definition.d}
                </p>
              </div>

              {/* Sinônimos */}
              {definition.s &&
                definition.s.length > 0 &&
                definition.s[0] !== 'nenhum' && (
                  <div>
                    <h5 className='font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2'>
                      <SmartIcon type='shuffle' size={16} color='#6b7280' />
                      Sinônimos:
                    </h5>
                    <div className='flex flex-wrap gap-2'>
                      {definition.s.map((synonym, index) => (
                        <span
                          key={index}
                          className='px-3 py-1 bg-pastel-green-100 dark:bg-pastel-green-900/30 text-pastel-green-700 dark:text-pastel-green-300 text-sm rounded-full'
                        >
                          {synonym}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

              {/* Antônimos */}
              {definition.a &&
                definition.a.length > 0 &&
                definition.a[0] !== 'nenhum' && (
                  <div>
                    <h5 className='font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2'>
                      <SmartIcon
                        type='minus-circle'
                        size={16}
                        color='#6b7280'
                      />
                      Antônimos:
                    </h5>
                    <div className='flex flex-wrap gap-2'>
                      {definition.a.map((antonym, index) => (
                        <span
                          key={index}
                          className='px-3 py-1 bg-pastel-red-100 dark:bg-pastel-red-900/30 text-pastel-red-700 dark:text-pastel-red-300 text-sm rounded-full'
                        >
                          {antonym}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          ) : (
            /* Palavra não encontrada */
            <div className='text-center py-8'>
              <div className='mb-4'>
                <SmartIcon
                  type='search'
                  size={48}
                  color='#9ca3af'
                  className='mx-auto'
                />
              </div>
              <h4 className='text-lg font-semibold text-gray-900 dark:text-white mb-2'>
                Palavra não encontrada
              </h4>
              <p className='text-gray-600 dark:text-gray-400 mb-4'>
                A palavra "<strong>{word}</strong>" não foi encontrada no
                dicionário.
              </p>
              <div className='p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800'>
                <p className='text-sm text-blue-800 dark:text-blue-200'>
                  💡 <strong>Dica:</strong> Verifique a ortografia ou tente uma
                  palavra similar.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className='flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-600'>
          <button
            onClick={onClose}
            className='px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors'
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
});

DictionaryModal.displayName = 'DictionaryModal';

export default DictionaryModal;
