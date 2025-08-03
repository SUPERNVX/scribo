// Confirmation Modal Component - mantendo estilos existentes
import React, { memo } from 'react';

import { SmartIcon } from '../ModernIcons';

import { AnimatedButton } from './MicroAnimations';

/**
 * ConfirmationModal Component
 * Modal de confirmação elegante mantendo o design atual
 */
const ConfirmationModal = memo(
  ({
    isOpen = false,
    onClose,
    onConfirm,
    title = 'Confirmar ação',
    message = 'Tem certeza que deseja continuar?',
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    type = 'warning', // warning, danger, info, success
    loading = false,
  }) => {
    if (!isOpen) return null;

    const getIcon = () => {
      switch (type) {
        case 'danger':
          return { icon: 'alert-triangle', color: '#ef4444' };
        case 'warning':
          return { icon: 'alert-circle', color: '#f59e0b' };
        case 'info':
          return { icon: 'info', color: '#3b82f6' };
        case 'success':
          return { icon: 'check-circle', color: '#10b981' };
        default:
          return { icon: 'help-circle', color: '#6b7280' };
      }
    };

    const getButtonStyle = () => {
      switch (type) {
        case 'danger':
          return 'bg-red-500 hover:bg-red-600 text-white';
        case 'warning':
          return 'bg-yellow-500 hover:bg-yellow-600 text-white';
        case 'info':
          return 'bg-blue-500 hover:bg-blue-600 text-white';
        case 'success':
          return 'bg-green-500 hover:bg-green-600 text-white';
        default:
          return 'bg-pastel-purple-500 hover:bg-pastel-purple-600 text-white';
      }
    };

    const iconData = getIcon();

    const handleBackdropClick = e => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    };

    return (
      <div
        className='fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4'
        onClick={handleBackdropClick}
      >
        <div className='bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 animate-scale-in'>
          {/* Header */}
          <div className='flex items-center gap-3 p-6 border-b border-gray-200 dark:border-gray-600'>
            <SmartIcon type={iconData.icon} size={24} color={iconData.color} />
            <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
              {title}
            </h3>
          </div>

          {/* Content */}
          <div className='p-6'>
            <p className='text-gray-600 dark:text-gray-300 leading-relaxed'>
              {message}
            </p>
          </div>

          {/* Actions */}
          <div className='flex gap-3 p-6 border-t border-gray-200 dark:border-gray-600'>
            <AnimatedButton
              onClick={onClose}
              className='flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 rounded-lg font-medium transition-colors'
              disabled={loading}
            >
              {cancelText}
            </AnimatedButton>

            <AnimatedButton
              onClick={onConfirm}
              className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${getButtonStyle()}`}
              loading={loading}
              disabled={loading}
            >
              {confirmText}
            </AnimatedButton>
          </div>
        </div>
      </div>
    );
  }
);

ConfirmationModal.displayName = 'ConfirmationModal';

export default ConfirmationModal;
