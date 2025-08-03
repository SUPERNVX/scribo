// Badge compacto de gamificação para o header
import React from 'react';

import useGamification from '../../hooks/useGamification';
import { SmartIcon } from '../ModernIcons';
import './GamificationBadge.css';

/**
 * Badge compacto de gamificação para mostrar no header
 * Exibe nível e XP de forma discreta
 */
const GamificationBadge = ({
  showXP = true,
  showLevel = true,
  compact = true,
}) => {
  const { userStats, LEVELS } = useGamification();

  const currentLevel =
    LEVELS.find(level => level.level === userStats.level) || LEVELS[0];

  if (compact) {
    return (
      <div className='gamification-badge compact'>
        {showLevel && (
          <div
            className='level-indicator'
            style={{
              backgroundColor: currentLevel.color,
              transition: 'none !important',
              animation: 'none !important',
            }}
            title={`Nível ${userStats.level} - ${userStats.levelName}`}
          >
            <SmartIcon type='crown' size={12} />
            <span>{userStats.level}</span>
          </div>
        )}

        {showXP && (
          <div className='xp-indicator' title={`${userStats.xp} XP`}>
            <SmartIcon type='star' size={12} />
            <span>{userStats.xp}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className='gamification-badge full'>
      <div className='badge-content'>
        <div
          className='level-badge'
          style={{ backgroundColor: currentLevel.color }}
        >
          <SmartIcon type='crown' size={14} />
          <span>Nível {userStats.level}</span>
        </div>

        <div className='stats-mini'>
          <div className='stat-mini'>
            <SmartIcon type='star' size={12} />
            <span>{userStats.xp} XP</span>
          </div>
          <div className='stat-mini'>
            <SmartIcon type='award' size={12} />
            <span>{userStats.badges.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GamificationBadge;
