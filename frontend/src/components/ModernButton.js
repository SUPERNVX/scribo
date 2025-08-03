import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';

import { SmartIcon } from './ModernIcons';

// React Bits removido - usando apenas componente customizado

// Variantes de estilo para botões
const buttonVariants = {
  // Primário - Gradiente roxo/rosa
  primary: {
    base: 'bg-button-gradient text-white border-0',
    hover: 'hover:shadow-pastel-lg hover:scale-105 hover:-translate-y-1',
    disabled:
      'disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none',
  },

  // Secundário - Fundo claro com borda
  secondary: {
    base: 'bg-white/40 dark:bg-soft-gray-800/40 text-pastel-purple-800 dark:text-pastel-purple-200 border-2 border-pastel-purple-200 dark:border-pastel-purple-400/30',
    hover:
      'hover:bg-pastel-purple-100/50 dark:hover:bg-pastel-purple-400/20 hover:border-pastel-purple-300 dark:hover:border-pastel-purple-300 hover:scale-105',
    disabled:
      'disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none',
  },

  // Outline - Borda com fundo transparente
  outline: {
    base: 'bg-transparent text-pastel-purple-800 dark:text-pastel-purple-200 border-2 border-pastel-purple-300 dark:border-pastel-purple-400',
    hover:
      'hover:bg-pastel-purple-100/50 dark:hover:bg-pastel-purple-400/20 hover:border-pastel-purple-400 dark:hover:border-pastel-purple-300 hover:scale-105',
    disabled:
      'disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none',
  },

  // Ghost - Transparente
  ghost: {
    base: 'bg-transparent text-pastel-purple-800 dark:text-pastel-purple-200 border-0',
    hover: 'hover:bg-pastel-purple-100/50 dark:hover:bg-pastel-purple-400/20',
    disabled: 'disabled:opacity-60 disabled:cursor-not-allowed',
  },

  // Danger - Vermelho/rosa
  danger: {
    base: 'bg-gradient-to-r from-pastel-pink-500 to-pastel-pink-600 text-white border-0',
    hover: 'hover:shadow-lg hover:scale-105 hover:-translate-y-1',
    disabled:
      'disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none',
  },

  // Success - Verde
  success: {
    base: 'bg-gradient-to-r from-pastel-green-500 to-pastel-green-600 text-white border-0',
    hover: 'hover:shadow-lg hover:scale-105 hover:-translate-y-1',
    disabled:
      'disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none',
  },
};

// Tamanhos de botão
const buttonSizes = {
  xs: 'px-3 py-1.5 text-xs rounded-lg',
  sm: 'px-4 py-2 text-sm rounded-xl',
  md: 'px-6 py-3 text-base rounded-xl',
  lg: 'px-8 py-4 text-lg rounded-2xl',
  xl: 'px-10 py-5 text-xl rounded-2xl',
};

// Componente de loading spinner
const LoadingSpinner = ({ size = 16 }) => (
  <motion.div
    animate={{ rotate: 360 }}
    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
    className='inline-block'
    style={{ width: size, height: size }}
  >
    <div
      className='border-2 border-current border-t-transparent rounded-full'
      style={{ width: size, height: size }}
    />
  </motion.div>
);

// Componente de botão customizado (fallback)
const CustomButton = forwardRef(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled = false,
      icon = null,
      iconPosition = 'left',
      fullWidth = false,
      className = '',
      onClick,
      type = 'button',
      ...props
    },
    ref
  ) => {
    const variantClasses = buttonVariants[variant] || buttonVariants.primary;
    const sizeClasses = buttonSizes[size] || buttonSizes.md;

    const baseClasses = [
      // Base styles
      'inline-flex items-center justify-center gap-2',
      'font-semibold transition-all duration-300 ease-out',
      'focus:outline-none focus:ring-2 focus:ring-pastel-purple-400/50 focus:ring-offset-2',
      'backdrop-blur-sm',

      // Variant styles
      variantClasses.base,
      variantClasses.hover,
      variantClasses.disabled,

      // Size styles
      sizeClasses,

      // Full width
      fullWidth && 'w-full',

      // Custom classes
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const handleClick = e => {
      if (loading || disabled) return;
      onClick?.(e);
    };

    const iconSize =
      size === 'xs'
        ? 12
        : size === 'sm'
          ? 14
          : size === 'md'
            ? 16
            : size === 'lg'
              ? 18
              : 20;

    return (
      <motion.button
        ref={ref}
        type={type}
        className={baseClasses}
        onClick={handleClick}
        disabled={disabled || loading}
        whileTap={!disabled && !loading ? { scale: 0.98 } : {}}
        {...props}
      >
        {loading && <LoadingSpinner size={iconSize} />}

        {!loading && icon && iconPosition === 'left' && (
          <SmartIcon type={icon} size={iconSize} />
        )}

        {children}

        {!loading && icon && iconPosition === 'right' && (
          <SmartIcon type={icon} size={iconSize} />
        )}
      </motion.button>
    );
  }
);

// Componente principal (agora sempre usa nosso componente customizado)
const ModernButton = forwardRef((props, ref) => {
  return <CustomButton ref={ref} {...props} />;
});

// Componentes específicos para casos comuns
export const PrimaryButton = forwardRef((props, ref) => (
  <ModernButton ref={ref} variant='primary' {...props} />
));

export const SecondaryButton = forwardRef((props, ref) => (
  <ModernButton ref={ref} variant='secondary' {...props} />
));

export const OutlineButton = forwardRef((props, ref) => (
  <ModernButton ref={ref} variant='outline' {...props} />
));

export const GhostButton = forwardRef((props, ref) => (
  <ModernButton ref={ref} variant='ghost' {...props} />
));

export const DangerButton = forwardRef((props, ref) => (
  <ModernButton ref={ref} variant='danger' {...props} />
));

export const SuccessButton = forwardRef((props, ref) => (
  <ModernButton ref={ref} variant='success' {...props} />
));

// Botões com ícones pré-definidos e melhorados
export const SaveButton = forwardRef((props, ref) => (
  <ModernButton ref={ref} variant='success' icon='save' {...props} />
));

export const DeleteButton = forwardRef((props, ref) => (
  <ModernButton ref={ref} variant='danger' icon='delete' {...props} />
));

export const EditButton = forwardRef((props, ref) => (
  <ModernButton ref={ref} variant='secondary' icon='edit' {...props} />
));

export const ViewButton = forwardRef((props, ref) => (
  <ModernButton ref={ref} variant='ghost' icon='view' {...props} />
));

export const SubmitButton = forwardRef((props, ref) => (
  <ModernButton ref={ref} variant='primary' icon='rocket' {...props} />
));

// Novos botões específicos com ícones Lucide
export const RefreshButton = forwardRef((props, ref) => (
  <ModernButton ref={ref} variant='secondary' icon='refresh' {...props} />
));

export const AddButton = forwardRef((props, ref) => (
  <ModernButton ref={ref} variant='primary' icon='plus' {...props} />
));

export const CloseButton = forwardRef((props, ref) => (
  <ModernButton ref={ref} variant='ghost' icon='close' size='sm' {...props} />
));

export const BackButton = forwardRef((props, ref) => (
  <ModernButton ref={ref} variant='ghost' icon='back' {...props} />
));

export const NextButton = forwardRef((props, ref) => (
  <ModernButton
    ref={ref}
    variant='primary'
    icon='next'
    iconPosition='right'
    {...props}
  />
));

export const DownloadButton = forwardRef((props, ref) => (
  <ModernButton ref={ref} variant='secondary' icon='download' {...props} />
));

export const UploadButton = forwardRef((props, ref) => (
  <ModernButton ref={ref} variant='secondary' icon='upload' {...props} />
));

export const SearchButton = forwardRef((props, ref) => (
  <ModernButton ref={ref} variant='secondary' icon='search' {...props} />
));

export const FilterButton = forwardRef((props, ref) => (
  <ModernButton ref={ref} variant='ghost' icon='filter' {...props} />
));

export const SettingsButton = forwardRef((props, ref) => (
  <ModernButton ref={ref} variant='ghost' icon='settings' {...props} />
));

// Hook para verificar se React Bits está disponível (sempre false agora)
export const useReactBitsAvailable = () => {
  return false;
};

// Display names
CustomButton.displayName = 'CustomButton';
ModernButton.displayName = 'ModernButton';
PrimaryButton.displayName = 'PrimaryButton';
SecondaryButton.displayName = 'SecondaryButton';
OutlineButton.displayName = 'OutlineButton';
GhostButton.displayName = 'GhostButton';
DangerButton.displayName = 'DangerButton';
SuccessButton.displayName = 'SuccessButton';
SaveButton.displayName = 'SaveButton';
DeleteButton.displayName = 'DeleteButton';
EditButton.displayName = 'EditButton';
ViewButton.displayName = 'ViewButton';
SubmitButton.displayName = 'SubmitButton';
RefreshButton.displayName = 'RefreshButton';
AddButton.displayName = 'AddButton';
CloseButton.displayName = 'CloseButton';
BackButton.displayName = 'BackButton';
NextButton.displayName = 'NextButton';
DownloadButton.displayName = 'DownloadButton';
UploadButton.displayName = 'UploadButton';
SearchButton.displayName = 'SearchButton';
FilterButton.displayName = 'FilterButton';
SettingsButton.displayName = 'SettingsButton';

export default ModernButton;
