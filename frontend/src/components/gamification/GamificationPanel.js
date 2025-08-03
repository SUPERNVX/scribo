// Painel principal de gamificação
import React, { useState } from 'react';

import useGamification from '../../hooks/useGamification';
import { SmartIcon } from '../ModernIcons';
import './GamificationPanel.css';

/**
 * Painel de Gamificação
 * Mostra XP, nível, badges e progresso do usuário
 */
const GamificationPanel = ({ compact = false }) => {
  const { userStats, getLevelProgress, getBadgeInfo, LEVELS, BADGES } =
    useGamification();
  const [showAllBadges, setShowAllBadges] = useState(false);

  const levelProgress = getLevelProgress();
  const currentLevelInfo = LEVELS.find(
    level => level.level === userStats.level
  );

  // Badges conquistadas
  const earnedBadges = userStats.badges
    .map(badgeId => getBadgeInfo(badgeId))
    .filter(Boolean);

  // Badges para mostrar (limitadas se compact)
  const badgesToShow = compact ? earnedBadges.slice(0, 3) : earnedBadges;

  if (compact) {
    return (
      <div className='gamification-panel compact'>
        <div className='level-info'>
          <div
            className='level-badge'
            style={{ backgroundColor: currentLevelInfo?.color }}
          >
            <SmartIcon type='crown' size={16} />
            <span>{userStats.level}</span>
          </div>
          <div className='xp-info'>
            <SmartIcon type='star' size={14} />
            <span>{userStats.xp} XP</span>
          </div>
        </div>

        {earnedBadges.length > 0 && (
          <div className='badges-preview'>
            {badgesToShow.map((badge, index) => (
              <div key={badge.id} className='badge-mini' title={badge.name}>
                <SmartIcon type='award' size={16} />
              </div>
            ))}
            {earnedBadges.length > 3 && (
              <div className='badges-more'>+{earnedBadges.length - 3}</div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className='gamification-panel full'>
      {/* Header com nível e XP */}
      <div className='panel-header'>
        <div className='level-section'>
          <div
            className='level-badge-large'
            style={{ backgroundColor: currentLevelInfo?.color }}
          >
            <SmartIcon type='crown' size={24} />
            <div className='level-text'>
              <span className='level-number'>Nível {userStats.level}</span>
              <span className='level-name'>{userStats.levelName}</span>
            </div>
          </div>

          <div className='xp-section'>
            <div className='xp-display'>
              <SmartIcon type='star' size={20} />
              <span className='xp-amount'>
                {userStats.xp.toLocaleString()} XP
              </span>
            </div>

            {!levelProgress.isMaxLevel && (
              <div className='level-progress'>
                <div className='progress-bar'>
                  <div
                    className='progress-fill'
                    style={{
                      width: `${levelProgress.progress}%`,
                      backgroundColor: currentLevelInfo?.color,
                    }}
                  ></div>
                </div>
                <div className='progress-text'>
                  <span>
                    {Math.round(levelProgress.progress)}% para{' '}
                    {levelProgress.nextLevel}
                  </span>
                  <span className='xp-needed'>
                    {levelProgress.xpNeeded} XP restantes
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Estatísticas rápidas */}
      <div className='stats-grid'>
        <div className='stat-item'>
          <SmartIcon type='file-text' size={18} />
          <div className='stat-info'>
            <span className='stat-number'>{userStats.essaysCount}</span>
            <span className='stat-label'>Redações</span>
          </div>
        </div>

        <div className='stat-item'>
          <SmartIcon type='calendar' size={18} />
          <div className='stat-info'>
            <span className='stat-number'>{userStats.consecutiveDays}</span>
            <span className='stat-label'>Dias Seguidos</span>
          </div>
        </div>

        <div className='stat-item'>
          <SmartIcon type='target' size={18} />
          <div className='stat-info'>
            <span className='stat-number'>{userStats.bestScore || 0}</span>
            <span className='stat-label'>Melhor Nota</span>
          </div>
        </div>

        <div className='stat-item'>
          <SmartIcon type='award' size={18} />
          <div className='stat-info'>
            <span className='stat-number'>{earnedBadges.length}</span>
            <span className='stat-label'>Conquistas</span>
          </div>
        </div>
      </div>

      {/* Badges/Conquistas */}
      {earnedBadges.length > 0 && (
        <div className='badges-section'>
          <div className='section-header'>
            <h3 className='section-title'>
              <SmartIcon type='award' size={20} />
              Conquistas Desbloqueadas
            </h3>
            {earnedBadges.length > 6 && (
              <button
                className='toggle-badges'
                onClick={() => setShowAllBadges(!showAllBadges)}
              >
                {showAllBadges
                  ? 'Mostrar Menos'
                  : `Ver Todas (${earnedBadges.length})`}
              </button>
            )}
          </div>

          <div className={`badges-grid ${showAllBadges ? 'expanded' : ''}`}>
            {(showAllBadges ? earnedBadges : earnedBadges.slice(0, 6)).map(
              badge => (
                <div key={badge.id} className='badge-card'>
                  <div className='badge-icon'>
                    <SmartIcon type='award' size={32} />
                  </div>
                  <div className='badge-info'>
                    <h4 className='badge-name'>{badge.name}</h4>
                    <p className='badge-description'>{badge.description}</p>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* Próximas conquistas */}
      <div className='next-badges-section'>
        <h3 className='section-title'>
          <SmartIcon type='target' size={20} />
          Próximas Conquistas
        </h3>
        <div className='next-badges-grid'>
          {Object.values(BADGES)
            .filter(badge => !userStats.badges.includes(badge.id))
            .slice(0, 3)
            .map(badge => (
              <div key={badge.id} className='next-badge-card'>
                <div className='badge-icon locked'>
                  <SmartIcon type='lock' size={24} />
                </div>
                <div className='badge-info'>
                  <h4 className='badge-name'>{badge.name}</h4>
                  <p className='badge-description'>{badge.description}</p>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default GamificationPanel;
