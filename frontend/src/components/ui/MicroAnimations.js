// Micro Animations Component - mantendo estilos existentes
import React, { memo, useState } from 'react';

import { SmartIcon } from '../ModernIcons';

/**
 * AnimatedButton Component
 * Botão com micro-animações mantendo o design atual
 */
export const AnimatedButton = memo(
  ({
    children,
    onClick,
    loading = false,
    success = false,
    className = '',
    ...props
  }) => {
    const [isClicked, setIsClicked] = useState(false);

    const handleClick = e => {
      setIsClicked(true);
      setTimeout(() => setIsClicked(false), 200);
      if (onClick) onClick(e);
    };

    return (
      <button
        className={`
        relative overflow-hidden transition-all duration-200
        ${isClicked ? 'scale-95' : 'scale-100'}
        ${loading ? 'cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
        onClick={handleClick}
        disabled={loading}
        {...props}
      >
        {/* Ripple effect */}
        {isClicked && (
          <span className='absolute inset-0 bg-white/20 rounded-lg animate-ping' />
        )}

        {/* Content */}
        <span className='relative flex items-center justify-center gap-2'>
          {loading && (
            <SmartIcon type='loader' size={16} className='animate-spin' />
          )}
          {success && !loading && (
            <SmartIcon type='check' size={16} color='#10b981' />
          )}
          {children}
        </span>
      </button>
    );
  }
);

/**
 * PulseIcon Component
 * Ícone com animação de pulso
 */
export const PulseIcon = memo(({ type, size = 20, color, className = '' }) => {
  return (
    <div className={`relative ${className}`}>
      <SmartIcon type={type} size={size} color={color} />
      <div className='absolute inset-0 animate-ping opacity-30'>
        <SmartIcon type={type} size={size} color={color} />
      </div>
    </div>
  );
});

/**
 * FloatingIcon Component
 * Ícone com animação flutuante
 */
export const FloatingIcon = memo(
  ({ type, size = 20, color, className = '' }) => {
    return (
      <div className={`animate-bounce ${className}`}>
        <SmartIcon type={type} size={size} color={color} />
      </div>
    );
  }
);

/**
 * GlowEffect Component
 * Efeito de brilho em elementos
 */
export const GlowEffect = memo(
  ({ children, color = 'purple', intensity = 'medium', className = '' }) => {
    const glowClasses = {
      purple: {
        low: 'shadow-lg shadow-purple-500/20',
        medium: 'shadow-xl shadow-purple-500/30',
        high: 'shadow-2xl shadow-purple-500/40',
      },
      blue: {
        low: 'shadow-lg shadow-blue-500/20',
        medium: 'shadow-xl shadow-blue-500/30',
        high: 'shadow-2xl shadow-blue-500/40',
      },
      green: {
        low: 'shadow-lg shadow-green-500/20',
        medium: 'shadow-xl shadow-green-500/30',
        high: 'shadow-2xl shadow-green-500/40',
      },
    };

    return (
      <div
        className={`transition-all duration-300 hover:${glowClasses[color][intensity]} ${className}`}
      >
        {children}
      </div>
    );
  }
);

/**
 * SlideIn Component
 * Animação de entrada deslizante
 */
export const SlideIn = memo(
  ({ children, direction = 'left', delay = 0, className = '' }) => {
    const directions = {
      left: 'animate-slide-in-left',
      right: 'animate-slide-in-right',
      up: 'animate-slide-in-up',
      down: 'animate-slide-in-down',
    };

    return (
      <div
        className={`${directions[direction]} ${className}`}
        style={{ animationDelay: `${delay}ms` }}
      >
        {children}
      </div>
    );
  }
);

/**
 * FadeIn Component
 * Animação de fade in
 */
export const FadeIn = memo(({ children, delay = 0, className = '' }) => {
  return (
    <div
      className={`animate-fade-in ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
});

/**
 * ScaleIn Component
 * Animação de escala
 */
export const ScaleIn = memo(({ children, delay = 0, className = '' }) => {
  return (
    <div
      className={`animate-scale-in ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
});

// CSS personalizado para as animações (adicionar ao globals.css)
export const microAnimationsCSS = `
@keyframes slide-in-left {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slide-in-right {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slide-in-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slide-in-down {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes scale-in {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.animate-slide-in-left {
  animation: slide-in-left 0.3s ease-out forwards;
}

.animate-slide-in-right {
  animation: slide-in-right 0.3s ease-out forwards;
}

.animate-slide-in-up {
  animation: slide-in-up 0.3s ease-out forwards;
}

.animate-slide-in-down {
  animation: slide-in-down 0.3s ease-out forwards;
}

.animate-fade-in {
  animation: fade-in 0.5s ease-out forwards;
}

.animate-scale-in {
  animation: scale-in 0.3s ease-out forwards;
}
`;

export default {
  AnimatedButton,
  PulseIcon,
  FloatingIcon,
  GlowEffect,
  SlideIn,
  FadeIn,
  ScaleIn,
};
