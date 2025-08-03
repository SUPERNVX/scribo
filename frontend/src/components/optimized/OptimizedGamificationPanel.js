// Optimized Gamification Panel with React.memo and performance improvements
import React, { useState, memo, useCallback, useMemo } from 'react';
import useGamification from '../../hooks/useGamification';
import { SmartIcon } from '../ModernIcons';
import './GamificationPanel.css';
import { useMemoizedSelector } from '../../hooks/useMemoizedCallback';

// Memoized Level Badge Component
const LevelBadge = memo(({ 
  level, 
  levelName, 
  color, 
  size = 'normal' 
}) => {
  const badgeClass = size === 'large' ? 'level-badge-large' : 'level-badge';
  
  return (
    <div
      className={badgeClass}
      style={{ backgroundColor: color }}
    >
      <SmartIcon type='crown' size={size === 'large' ? 24 : 16} />
      {size === 'large' ? (
        <div className='level-text'>
          <span className='level-number'>Nível {level}</span>
          <span className='level-name'>{levelName}</span>
        </div>
      ) : (
        <span>{level}</span>
      )}
    </div>
  );
});

// Memoized XP Display Component
const XPDisplay = memo(({ 
  xp, 
  size = 'normal' 
}) => {
  const displayClass = size === 'large' ? 'xp-display' : 'xp-info';
  const iconSize = size === 'large' ? 20 : 14;
  
  return (
    <div className={displayClass}>
      <SmartIcon type='star' size={iconSize} />
      <span className={size === 'large' ? 'xp-amount' : ''}>
        {size === 'large' ? xp.toLocaleString() : xp} XP
      </span>
    </div>
  );
});

// Memoized Progress Bar Component
const ProgressBar = memo(({ 
  progress, 
  color, 
  nextLevel, 
  xpNeeded 
}) => (
  <div className='level-progress'>
    <div className='progress-bar'>
      <div
        className='progress-fill'
        style={{
          width: `${progress}%`,
          backgroundColor: color,
        }}
      ></div>
    </div>
    <div className='progress-text'>
      <span>
        {Math.round(progress)}% para {nextLevel}
      </span>
      <span className='xp-needed'>
        {xpNeeded} XP restantes
      </span>
    </div>
  </div>
));

// Memoized Stat Item Component
const StatItem = memo(({ 
  icon, 
  number, 
  label 
}) => (
  <div className='stat-item'>
    <SmartIcon type={icon} size={18} />
    <div className='stat-info'>
      <span className='stat-number'>{number}</span>
      <span className='stat-label'>{label}</span>
    </div>
  </div>
));

// Memoized Badge Card Component
const BadgeCard = memo(({ 
  badge, 
  isLocked = false 
}) => (
  <div className={`badge-card ${isLocked ? 'locked' : ''}`}>
    <div className={`badge-icon ${isLocked ? 'locked' : ''}`}>
      <SmartIcon type={isLocked ? 'lock' : 'award'} size={isLocked ? 24 : 32} />
    </div>
    <div className='badge-info'>
      <h4 className='badge-name'>{badge.name}</h4>
      <p className='badge-description'>{badge.description}</p>
    </div>
  </div>
));

// Memoized Badges Section Component
const BadgesSection = memo(({ 
  earnedBadges, 
  showAllBadges, 
  onToggleShowAll 
}) => {
  const badgesToShow = useMemo(() => 
    showAllBadges ? earnedBadges : earnedBadges.slice(0, 6),
    [earnedBadges, showAllBadges]
  );

  if (earnedBadges.length === 0) return null;

  return (
    <div className='badges-section'>
      <div className='section-header'>
        <h3 className='section-title'>
          <SmartIcon type='award' size={20} />
          Conquistas Desbloqueadas
        </h3>
        {earnedBadges.length > 6 && (
          <button
            className='toggle-badges'
            onClick={onToggleShowAll}
          >
            {showAllBadges
              ? 'Mostrar Menos'
              : `Ver Todas (${earnedBadges.length})`}
          </button>
        )}
      </div>

      <div className={`badges-grid ${showAllBadges ? 'expanded' : ''}`}>
        {badgesToShow.map(badge => (
          <BadgeCard key={badge.id} badge={badge} />
        ))}
      </div>
    </div>
  );
});

// Memoized Next Badges Section Component
const NextBadgesSection = memo(({ 
  nextBadges 
}) => {
  if (nextBadges.length === 0) return null;

  return (
    <div className='next-badges-section'>
      <h3 className='section-title'>
        <SmartIcon type='target' size={20} />
        Próximas Conquistas
      </h3>
      <div className='next-badges-grid'>
        {nextBadges.map(badge => (
          <BadgeCard key={badge.id} badge={badge} isLocked={true} />
        ))}
      </div>
    </div>
  );
});

// Memoized Compact Panel Component
const CompactPanel = memo(({ 
  userStats, 
  currentLevelInfo, 
  earnedBadges 
}) => {
  const badgesToShow = useMemo(() => 
    earnedBadges.slice(0, 3), 
    [earnedBadges]
  );

  return (
    <div className='gamification-panel compact'>
      <div className='level-info'>
        <LevelBadge 
          level={userStats.level}
          levelName={userStats.levelName}
          color={currentLevelInfo?.color}
        />
        <XPDisplay xp={userStats.xp} />
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
});

// Main Optimized Component
const OptimizedGamificationPanel = ({ compact = false }) => {
  const { userStats, getLevelProgress, getBadgeInfo, LEVELS, BADGES } =
    useGamification();
  const [showAllBadges, setShowAllBadges] = useState(false);

  // Memoized calculations
  const levelProgress = useMemo(() => getLevelProgress(), [getLevelProgress]);
  
  const currentLevelInfo = useMemoizedSelector(
    userStats.level,
    (level) => LEVELS.find(l => l.level === level),
    [userStats.level, LEVELS]
  );

  const earnedBadges = useMemoizedSelector(
    userStats.badges,
    (badges) => badges
      .map(badgeId => getBadgeInfo(badgeId))
      .filter(Boolean),
    [userStats.badges, getBadgeInfo]
  );

  const nextBadges = useMemoizedSelector(
    [userStats.badges, BADGES],
    ([userBadges, allBadges]) => Object.values(allBadges)
      .filter(badge => !userBadges.includes(badge.id))
      .slice(0, 3),
    [userStats.badges, BADGES]
  );

  // Stable callback
  const handleToggleShowAll = useCallback(() => {
    setShowAllBadges(prev => !prev);
  }, []);

  if (compact) {
    return (
      <CompactPanel 
        userStats={userStats}
        currentLevelInfo={currentLevelInfo}
        earnedBadges={earnedBadges}
      />
    );
  }

  return (
    <div className='gamification-panel full'>
      {/* Header com nível e XP */}
      <div className='panel-header'>
        <div className='level-section'>
          <LevelBadge 
            level={userStats.level}
            levelName={userStats.levelName}
            color={currentLevelInfo?.color}
            size='large'
          />

          <div className='xp-section'>
            <XPDisplay xp={userStats.xp} size='large' />

            {!levelProgress.isMaxLevel && (
              <ProgressBar 
                progress={levelProgress.progress}
                color={currentLevelInfo?.color}
                nextLevel={levelProgress.nextLevel}
                xpNeeded={levelProgress.xpNeeded}
              />
            )}
          </div>
        </div>
      </div>

      {/* Estatísticas rápidas */}
      <div className='stats-grid'>
        <StatItem 
          icon='file-text'
          number={userStats.essaysCount}
          label='Redações'
        />
        <StatItem 
          icon='calendar'
          number={userStats.consecutiveDays}
          label='Dias Seguidos'
        />
        <StatItem 
          icon='target'
          number={userStats.bestScore || 0}
          label='Melhor Nota'
        />
        <StatItem 
          icon='award'
          number={earnedBadges.length}
          label='Conquistas'
        />
      </div>

      <BadgesSection 
        earnedBadges={earnedBadges}
        showAllBadges={showAllBadges}
        onToggleShowAll={handleToggleShowAll}
      />

      <NextBadgesSection nextBadges={nextBadges} />
    </div>
  );
};

// Set display names for debugging
LevelBadge.displayName = 'LevelBadge';
XPDisplay.displayName = 'XPDisplay';
ProgressBar.displayName = 'ProgressBar';
StatItem.displayName = 'StatItem';
BadgeCard.displayName = 'BadgeCard';
BadgesSection.displayName = 'BadgesSection';
NextBadgesSection.displayName = 'NextBadgesSection';
CompactPanel.displayName = 'CompactPanel';
OptimizedGamificationPanel.displayName = 'OptimizedGamificationPanel';

export default memo(OptimizedGamificationPanel);