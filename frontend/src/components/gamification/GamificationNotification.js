// Notificações de gamificação
import React, { useEffect, useState } from 'react';

import { SmartIcon } from '../ModernIcons';
import './GamificationNotification.css';

/**
 * Componente para mostrar notificações de gamificação
 * XP ganho, badges desbloqueadas, level up, etc.
 */
const GamificationNotification = ({
  type,
  title,
  message,
  xpGained,
  badge,
  onClose,
  autoClose = true,
  duration = 4000,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Anima entrada
    setTimeout(() => setIsVisible(true), 100);

    // Auto close
    if (autoClose) {
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [autoClose, duration]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onClose?.();
    }, 300);
  };

  const getNotificationConfig = () => {
    switch (type) {
      case 'xp':
        return {
          icon: 'star',
          color: '#FFD700',
          bgGradient: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
        };
      case 'badge':
        return {
          icon: 'award',
          color: '#8B7ED8',
          bgGradient: 'linear-gradient(135deg, #8B7ED8 0%, #6B5FCF 100%)',
        };
      case 'level':
        return {
          icon: 'crown',
          color: '#50C878',
          bgGradient: 'linear-gradient(135deg, #50C878 0%, #32CD32 100%)',
        };
      case 'streak':
        return {
          icon: 'zap',
          color: '#FF6B6B',
          bgGradient: 'linear-gradient(135deg, #FF6B6B 0%, #FF5252 100%)',
        };
      default:
        return {
          icon: 'star',
          color: '#8B7ED8',
          bgGradient: 'linear-gradient(135deg, #8B7ED8 0%, #6B5FCF 100%)',
        };
    }
  };

  const config = getNotificationConfig();

  return (
    <div
      className={`gamification-notification ${type} ${isVisible ? 'visible' : ''} ${isLeaving ? 'leaving' : ''}`}
      style={{
        '--notification-color': config.color,
        '--notification-bg': config.bgGradient,
      }}
    >
      <div className='notification-content'>
        <div className='notification-icon'>
          <SmartIcon type={config.icon} size={24} />
        </div>

        <div className='notification-text'>
          <h4 className='notification-title'>{title}</h4>
          <p className='notification-message'>{message}</p>

          {xpGained && (
            <div className='xp-gained'>
              <SmartIcon type='plus' size={14} />
              <span>{xpGained} XP</span>
            </div>
          )}
        </div>

        <button className='notification-close' onClick={handleClose}>
          <SmartIcon type='x' size={16} />
        </button>
      </div>

      {type === 'badge' && badge && (
        <div className='badge-showcase'>
          <div className='badge-icon-large'>
            <SmartIcon type='award' size={32} />
          </div>
          <div className='badge-details'>
            <span className='badge-name'>{badge.name}</span>
            <span className='badge-description'>{badge.description}</span>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Container para gerenciar múltiplas notificações
 */
export const GamificationNotificationContainer = () => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = notification => {
    const id = Date.now() + Math.random();
    setNotifications(prev => [...prev, { ...notification, id }]);
  };

  const removeNotification = id => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  // Expor função globalmente para uso em outros componentes
  useEffect(() => {
    window.showGamificationNotification = addNotification;
    return () => {
      delete window.showGamificationNotification;
    };
  }, []);

  return (
    <div className='gamification-notifications-container'>
      {notifications.map(notification => (
        <GamificationNotification
          key={notification.id}
          {...notification}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  );
};

/**
 * Funções utilitárias para mostrar notificações
 */
export const showXPNotification = (xpGained, action) => {
  const actionMessages = {
    ESSAY_SUBMITTED: 'Redação enviada!',
    DAILY_LOGIN: 'Login diário!',
    THEME_COMPLETED: 'Tema completado!',
    SCORE_IMPROVEMENT: 'Nota melhorou!',
    STUDY_TIME_HOUR: 'Hora de estudo!',
  };

  window.showGamificationNotification?.({
    type: 'xp',
    title: 'XP Ganho!',
    message: actionMessages[action] || 'Parabéns!',
    xpGained,
  });
};

export const showBadgeNotification = badge => {
  window.showGamificationNotification?.({
    type: 'badge',
    title: 'Conquista Desbloqueada!',
    message: `Você ganhou a badge "${badge.name}"`,
    badge,
    duration: 6000,
  });
};

export const showLevelUpNotification = (newLevel, levelName) => {
  window.showGamificationNotification?.({
    type: 'level',
    title: 'Level Up!',
    message: `Parabéns! Você alcançou o nível ${newLevel} - ${levelName}`,
    duration: 5000,
  });
};

export const showStreakNotification = days => {
  window.showGamificationNotification?.({
    type: 'streak',
    title: 'Streak Incrível!',
    message: `${days} dias consecutivos de estudo!`,
    duration: 4000,
  });
};

export default GamificationNotification;
