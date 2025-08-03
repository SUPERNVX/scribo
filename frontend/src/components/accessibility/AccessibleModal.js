// Accessible Modal Component
import React, { memo, useEffect, useRef } from 'react';

import {
  useKeyboardNavigation,
  useFocusManagement,
} from '../../hooks/useKeyboardNavigation';
import { SmartIcon } from '../ModernIcons';

import ScreenReaderOnly from './ScreenReaderOnly';

/**
 * AccessibleModal Component
 * Modal com acessibilidade completa mantendo design atual
 */
const AccessibleModal = memo(
  ({
    isOpen = false,
    onClose,
    title,
    children,
    size = 'md',
    closeOnBackdrop = true,
    closeOnEscape = true,
    className = '',
    titleId,
    descriptionId,
  }) => {
    const modalRef = useRef();
    const closeButtonRef = useRef();

    // Gerenciar foco
    useFocusManagement(isOpen, true);

    // Navegação por teclado
    useKeyboardNavigation({
      onEscape: closeOnEscape ? onClose : undefined,
      trapFocus: isOpen,
    });

    // Focar no modal quando abrir
    useEffect(() => {
      if (isOpen && modalRef.current) {
        modalRef.current.focus();
      }
    }, [isOpen]);

    // Prevenir scroll do body quando modal estiver aberto
    useEffect(() => {
      if (isOpen) {
        document.body.style.overflow = 'hidden';
        return () => {
          document.body.style.overflow = 'unset';
        };
      }
    }, [isOpen]);

    if (!isOpen) return null;

    const sizeClasses = {
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-lg',
      xl: 'max-w-xl',
      '2xl': 'max-w-2xl',
      full: 'max-w-full mx-4',
    };

    const handleBackdropClick = e => {
      if (closeOnBackdrop && e.target === e.currentTarget) {
        onClose();
      }
    };

    const modalTitleId =
      titleId || `modal-title-${Math.random().toString(36).substr(2, 9)}`;
    const modalDescId =
      descriptionId || `modal-desc-${Math.random().toString(36).substr(2, 9)}`;

    return (
      <div
        className='fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4'
        onClick={handleBackdropClick}
        role='dialog'
        aria-modal='true'
        aria-labelledby={title ? modalTitleId : undefined}
        aria-describedby={descriptionId ? modalDescId : undefined}
      >
        <div
          ref={modalRef}
          className={`
          bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full
          ${sizeClasses[size]}
          animate-scale-in
          focus:outline-none
          ${className}
        `}
          tabIndex={-1}
        >
          {/* Header */}
          {title && (
            <div className='flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-600'>
              <h2
                id={modalTitleId}
                className='text-lg font-semibold text-gray-900 dark:text-white'
              >
                {title}
              </h2>

              <button
                ref={closeButtonRef}
                onClick={onClose}
                aria-label='Fechar modal'
                className='
                p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300
                focus:outline-none focus:ring-2 focus:ring-pastel-purple-500 focus:ring-offset-2
                rounded-lg transition-colors
              '
              >
                <SmartIcon type='x' size={20} />
              </button>
            </div>
          )}

          {/* Content */}
          <div className='p-6'>
            {descriptionId && (
              <ScreenReaderOnly id={modalDescId}>
                Conteúdo do modal. Use Tab para navegar e Escape para fechar.
              </ScreenReaderOnly>
            )}
            {children}
          </div>
        </div>
      </div>
    );
  }
);

/**
 * AccessibleDialog Component
 * Dialog simples com confirmação
 */
export const AccessibleDialog = memo(
  ({
    isOpen = false,
    onClose,
    onConfirm,
    title = 'Confirmar',
    message,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    type = 'info',
    loading = false,
  }) => {
    const confirmButtonRef = useRef();

    useEffect(() => {
      if (isOpen && confirmButtonRef.current) {
        setTimeout(() => {
          confirmButtonRef.current.focus();
        }, 100);
      }
    }, [isOpen]);

    const getIcon = () => {
      switch (type) {
        case 'danger':
          return { icon: 'alert-triangle', color: '#ef4444' };
        case 'warning':
          return { icon: 'alert-circle', color: '#f59e0b' };
        case 'success':
          return { icon: 'check-circle', color: '#10b981' };
        default:
          return { icon: 'info', color: '#3b82f6' };
      }
    };

    const iconData = getIcon();

    return (
      <AccessibleModal
        isOpen={isOpen}
        onClose={onClose}
        title={title}
        size='sm'
        titleId='dialog-title'
        descriptionId='dialog-description'
      >
        <div className='flex items-start gap-3 mb-6'>
          <SmartIcon
            type={iconData.icon}
            size={24}
            color={iconData.color}
            aria-hidden='true'
          />
          <p
            id='dialog-description'
            className='text-gray-600 dark:text-gray-300 leading-relaxed'
          >
            {message}
          </p>
        </div>

        <div className='flex gap-3 justify-end'>
          <button
            onClick={onClose}
            disabled={loading}
            className='
            px-4 py-2 border border-gray-300 dark:border-gray-600 
            text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 
            hover:bg-gray-50 dark:hover:bg-gray-600 rounded-lg font-medium 
            focus:outline-none focus:ring-2 focus:ring-pastel-purple-500 focus:ring-offset-2
            transition-colors disabled:opacity-50
          '
          >
            {cancelText}
          </button>

          <button
            ref={confirmButtonRef}
            onClick={onConfirm}
            disabled={loading}
            className='
            px-4 py-2 bg-pastel-purple-500 hover:bg-pastel-purple-600 
            text-white rounded-lg font-medium
            focus:outline-none focus:ring-2 focus:ring-pastel-purple-500 focus:ring-offset-2
            transition-colors disabled:opacity-50
          '
          >
            {loading ? (
              <>
                <SmartIcon
                  type='loader'
                  size={16}
                  className='animate-spin mr-2'
                />
                Processando...
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </AccessibleModal>
    );
  }
);

AccessibleModal.displayName = 'AccessibleModal';
AccessibleDialog.displayName = 'AccessibleDialog';

export default AccessibleModal;
