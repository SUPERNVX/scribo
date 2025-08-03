import React, { Fragment, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { SmartIcon } from './ModernIcons';

// Tentar importar Headless UI, com fallback
let HeadlessUI = {};
try {
  const headlessUI = require('@headlessui/react');
  HeadlessUI = {
    Dialog: headlessUI.Dialog,
    Transition: headlessUI.Transition,
  };
} catch (error) {
  console.log('Headless UI não instalado, usando componente customizado');
}

// Componente de overlay customizado
const CustomOverlay = ({ onClick, children }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.3 }}
    className='fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4'
    onClick={onClick}
  >
    {children}
  </motion.div>
);

// Componente de painel customizado
const CustomPanel = ({
  children,
  size = 'md',
  className = '',
  onClose,
  title,
  showCloseButton = true,
  ...props
}) => {
  const sizeClasses = {
    xs: 'max-w-xs',
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    full: 'max-w-full mx-4',
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 20 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`
        bg-white/95 dark:bg-soft-gray-800/95 
        backdrop-blur-md rounded-2xl 
        shadow-pastel-xl border border-pastel-purple-200/50 dark:border-pastel-purple-400/30
        w-full ${sizeClasses[size]} max-h-[90vh] overflow-hidden
        ${className}
      `}
      onClick={e => e.stopPropagation()}
      {...props}
    >
      {/* Header */}
      {(title || showCloseButton) && (
        <div className='flex items-center justify-between p-6 border-b border-pastel-purple-200/30 dark:border-pastel-purple-400/20'>
          {title && (
            <h3 className='text-xl font-bold text-soft-gray-900 dark:text-soft-gray-100'>
              {title}
            </h3>
          )}
          {showCloseButton && (
            <button
              onClick={onClose}
              className='ml-auto p-2 rounded-lg hover:bg-pastel-purple-100/50 dark:hover:bg-pastel-purple-400/20 transition-colors'
            >
              <SmartIcon type='close' size={20} />
            </button>
          )}
        </div>
      )}

      {/* Content */}
      <div className='overflow-y-auto max-h-[calc(90vh-8rem)]'>{children}</div>
    </motion.div>
  );
};

// Modal customizado (fallback)
const CustomModal = ({
  isOpen,
  onClose,
  children,
  size = 'md',
  title,
  showCloseButton = true,
  closeOnOverlayClick = true,
  className = '',
  ...props
}) => {
  // Fechar com ESC
  useEffect(() => {
    const handleEscape = e => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevenir scroll do body
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <CustomOverlay onClick={closeOnOverlayClick ? onClose : undefined}>
        <CustomPanel
          size={size}
          title={title}
          showCloseButton={showCloseButton}
          onClose={onClose}
          className={className}
          {...props}
        >
          {children}
        </CustomPanel>
      </CustomOverlay>
    </AnimatePresence>
  );
};

// Modal com Headless UI (se disponível)
const HeadlessModal = ({
  isOpen,
  onClose,
  children,
  size = 'md',
  title,
  showCloseButton = true,
  closeOnOverlayClick = true,
  className = '',
  ...props
}) => {
  const { Dialog, Transition } = HeadlessUI;

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog
        as='div'
        className='relative z-50'
        onClose={closeOnOverlayClick ? onClose : () => {}}
      >
        <Transition.Child
          as={Fragment}
          enter='ease-out duration-300'
          enterFrom='opacity-0'
          enterTo='opacity-100'
          leave='ease-in duration-200'
          leaveFrom='opacity-100'
          leaveTo='opacity-0'
        >
          <div className='fixed inset-0 bg-black/50 backdrop-blur-sm' />
        </Transition.Child>

        <div className='fixed inset-0 overflow-y-auto'>
          <div className='flex min-h-full items-center justify-center p-4'>
            <Transition.Child
              as={Fragment}
              enter='ease-out duration-300'
              enterFrom='opacity-0 scale-95'
              enterTo='opacity-100 scale-100'
              leave='ease-in duration-200'
              leaveFrom='opacity-100 scale-100'
              leaveTo='opacity-0 scale-95'
            >
              <Dialog.Panel
                as={CustomPanel}
                size={size}
                title={title}
                showCloseButton={showCloseButton}
                onClose={onClose}
                className={className}
                {...props}
              >
                {children}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

// Componente principal que escolhe a implementação
const ModernModal = props => {
  if (HeadlessUI.Dialog) {
    return <HeadlessModal {...props} />;
  }
  return <CustomModal {...props} />;
};

// Componentes específicos para casos comuns
export const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirmar ação',
  message = 'Tem certeza que deseja continuar?',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger',
  loading = false,
}) => (
  <ModernModal isOpen={isOpen} onClose={onClose} title={title} size='sm'>
    <div className='p-6'>
      <p className='text-soft-gray-700 dark:text-soft-gray-200 mb-6'>
        {message}
      </p>
      <div className='flex gap-3 justify-end'>
        <button
          onClick={onClose}
          disabled={loading}
          className='px-4 py-2 rounded-xl font-medium bg-transparent text-pastel-purple-800 dark:text-pastel-purple-200 hover:bg-pastel-purple-100/50 dark:hover:bg-pastel-purple-400/20 transition-all duration-200'
        >
          {cancelText}
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className={`px-4 py-2 rounded-xl font-medium text-white transition-all duration-200 ${
            variant === 'danger'
              ? 'bg-gradient-to-r from-pastel-pink-500 to-pastel-pink-600 hover:shadow-lg'
              : 'bg-gradient-to-r from-pastel-purple-500 to-pastel-purple-600 hover:shadow-lg'
          } ${loading ? 'opacity-60 cursor-not-allowed' : 'hover:scale-105'}`}
        >
          {loading ? 'Carregando...' : confirmText}
        </button>
      </div>
    </div>
  </ModernModal>
);

export const InfoModal = ({
  isOpen,
  onClose,
  title,
  children,
  icon = 'info',
  size = 'md',
}) => (
  <ModernModal
    isOpen={isOpen}
    onClose={onClose}
    title={
      <div className='flex items-center gap-3'>
        <SmartIcon type={icon} size={24} />
        {title}
      </div>
    }
    size={size}
  >
    <div className='p-6'>{children}</div>
  </ModernModal>
);

export const FormModal = ({
  isOpen,
  onClose,
  title,
  children,
  onSubmit,
  submitText = 'Salvar',
  cancelText = 'Cancelar',
  loading = false,
  size = 'lg',
}) => (
  <ModernModal
    isOpen={isOpen}
    onClose={onClose}
    title={title}
    size={size}
    closeOnOverlayClick={!loading}
  >
    <form onSubmit={onSubmit}>
      <div className='p-6'>{children}</div>
      <div className='flex gap-3 justify-end p-6 border-t border-pastel-purple-200/30 dark:border-pastel-purple-400/20'>
        <button
          type='button'
          onClick={onClose}
          disabled={loading}
          className='px-4 py-2 rounded-xl font-medium bg-transparent text-pastel-purple-800 dark:text-pastel-purple-200 hover:bg-pastel-purple-100/50 dark:hover:bg-pastel-purple-400/20 transition-all duration-200'
        >
          {cancelText}
        </button>
        <button
          type='submit'
          disabled={loading}
          className={`px-4 py-2 rounded-xl font-medium text-white bg-gradient-to-r from-pastel-purple-500 to-pastel-purple-600 transition-all duration-200 ${
            loading
              ? 'opacity-60 cursor-not-allowed'
              : 'hover:scale-105 hover:shadow-lg'
          }`}
        >
          {loading ? 'Salvando...' : submitText}
        </button>
      </div>
    </form>
  </ModernModal>
);

// Hook para verificar se Headless UI está disponível
export const useHeadlessUIAvailable = () => {
  return HeadlessUI.Dialog !== undefined;
};

export default ModernModal;
