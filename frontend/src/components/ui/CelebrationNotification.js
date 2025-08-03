// Celebration Notification - Notificações de celebração e conquistas
import React, { memo, useEffect, useState } from 'react';

import { SmartIcon } from '../ModernIcons';

/**
 * Componente para notificações de celebração e conquistas
 * Mantém 100% dos estilos visuais existentes
 */
const CelebrationNotification = memo(
  ({
    type = 'achievement',
    title,
    message,
    icon,
    duration = 5000,
    onDismiss,
    showConfetti = false,
    className = '',
  }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isLeaving, setIsLeaving] = useState(false);

    // Animação de entrada
    useEffect(() => {
      const timer = setTimeout(() => setIsVisible(true), 100);
      return () => clearTimeout(timer);
    }, []);

    // Auto-dismiss
    useEffect(() => {
      if (duration > 0) {
        const timer = setTimeout(() => {
          handleDismiss();
        }, duration);
        return () => clearTimeout(timer);
      }
    }, [duration]);

    const handleDismiss = () => {
      setIsLeaving(true);
      setTimeout(() => {
        onDismiss?.();
      }, 300);
    };

    const getCelebrationConfig = () => {
      const configs = {
        achievement: {
          icon: icon || 'trophy',
          color: '#f59e0b',
          bgGradient: 'from-yellow-50 to-orange-50',
          borderColor: 'border-yellow-200',
          emoji: '🏆',
        },
        milestone: {
          icon: icon || 'star',
          color: '#a855f7',
          bgGradient: 'from-purple-50 to-pink-50',
          borderColor: 'border-purple-200',
          emoji: '⭐',
        },
        perfect_score: {
          icon: icon || 'award',
          color: '#10b981',
          bgGradient: 'from-green-50 to-emerald-50',
          borderColor: 'border-green-200',
          emoji: '💯',
        },
        first_time: {
          icon: icon || 'gift',
          color: '#3b82f6',
          bgGradient: 'from-blue-50 to-indigo-50',
          borderColor: 'border-blue-200',
          emoji: '🎉',
        },
        streak: {
          icon: icon || 'zap',
          color: '#ef4444',
          bgGradient: 'from-red-50 to-pink-50',
          borderColor: 'border-red-200',
          emoji: '🔥',
        },
        improvement: {
          icon: icon || 'trending-up',
          color: '#06b6d4',
          bgGradient: 'from-cyan-50 to-blue-50',
          borderColor: 'border-cyan-200',
          emoji: '📈',
        },
      };

      return configs[type] || configs.achievement;
    };

    const config = getCelebrationConfig();

    return (
      <div
        className={`
      fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50
      transition-all duration-300 ease-out
      ${isVisible && !isLeaving ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}
      ${className}
    `}
      >
        {/* Confetti Effect */}
        {showConfetti && isVisible && (
          <div className='absolute inset-0 pointer-events-none'>
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className='absolute w-2 h-2 bg-gradient-to-r from-yellow-400 to-pink-400 rounded-full animate-bounce'
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${1 + Math.random()}s`,
                }}
              />
            ))}
          </div>
        )}

        {/* Main Notification */}
        <div
          className={`
        bg-gradient-to-br ${config.bgGradient} 
        border-2 ${config.borderColor}
        rounded-xl shadow-2xl p-6 min-w-[320px] max-w-md
        backdrop-blur-sm relative overflow-hidden
        dark:from-gray-800 dark:to-gray-700 dark:border-gray-600
      `}
        >
          {/* Glow Effect */}
          <div className='absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-pulse' />

          {/* Close Button */}
          <button
            onClick={handleDismiss}
            className='absolute top-3 right-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors'
            aria-label='Fechar'
          >
            <SmartIcon type='x' size={16} />
          </button>

          {/* Content */}
          <div className='relative z-10'>
            {/* Icon and Emoji */}
            <div className='flex items-center justify-center mb-4'>
              <div className='relative'>
                <div className='bg-white dark:bg-gray-800 rounded-full p-3 shadow-lg'>
                  <SmartIcon
                    type={config.icon}
                    size={32}
                    color={config.color}
                  />
                </div>
                <div className='absolute -top-2 -right-2 text-2xl animate-bounce'>
                  {config.emoji}
                </div>
              </div>
            </div>

            {/* Title */}
            {title && (
              <h3 className='text-lg font-bold text-center text-gray-900 dark:text-white mb-2'>
                {title}
              </h3>
            )}

            {/* Message */}
            {message && (
              <p className='text-center text-gray-700 dark:text-gray-300 leading-relaxed'>
                {message}
              </p>
            )}

            {/* Celebration Animation */}
            <div className='flex justify-center mt-4'>
              <div className='flex gap-1'>
                {['🎉', '✨', '🎊'].map((emoji, index) => (
                  <span
                    key={index}
                    className='text-xl animate-bounce'
                    style={{
                      animationDelay: `${index * 0.2}s`,
                      animationDuration: '1s',
                    }}
                  >
                    {emoji}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

/**
 * Hook para gerenciar notificações de celebração
 */
export const useCelebrationNotifications = () => {
  const [celebrations, setCelebrations] = useState([]);

  const celebrate = config => {
    const id = Date.now() + Math.random();
    const celebration = {
      id,
      ...config,
      onDismiss: () => removeCelebration(id),
    };

    setCelebrations(prev => [...prev, celebration]);
    return id;
  };

  const removeCelebration = id => {
    setCelebrations(prev => prev.filter(c => c.id !== id));
  };

  // Celebrações pré-definidas para o EnemIA
  const celebrateFirstEssay = () =>
    celebrate({
      type: 'first_time',
      title: 'Primeira Redação!',
      message:
        'Parabéns por enviar sua primeira redação! Continue praticando para melhorar ainda mais.',
      showConfetti: true,
    });

  const celebratePerfectScore = competencia =>
    celebrate({
      type: 'perfect_score',
      title: 'Pontuação Perfeita!',
      message: `Você alcançou a pontuação máxima na ${competencia}! Excelente trabalho!`,
      showConfetti: true,
    });

  const celebrateStreak = days =>
    celebrate({
      type: 'streak',
      title: `${days} Dias Consecutivos!`,
      message: `Você está mantendo uma sequência incrível de ${days} dias escrevendo. Continue assim!`,
    });

  const celebrateImprovement = improvement =>
    celebrate({
      type: 'improvement',
      title: 'Melhoria Detectada!',
      message: `Sua pontuação melhorou ${improvement} pontos desde a última redação. Parabéns pelo progresso!`,
    });

  const celebrateMilestone = milestone =>
    celebrate({
      type: 'milestone',
      title: 'Marco Alcançado!',
      message: milestone,
    });

  return {
    celebrations,
    celebrate,
    celebrateFirstEssay,
    celebratePerfectScore,
    celebrateStreak,
    celebrateImprovement,
    celebrateMilestone,
    removeCelebration,
  };
};

CelebrationNotification.displayName = 'CelebrationNotification';

export default CelebrationNotification;
