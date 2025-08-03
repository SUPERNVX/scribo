// Optimized Gamification Hook with enhanced memoization
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useStableCallback, useDeepMemo } from './useMemoizedCallback';

/**
 * Optimized Sistema de Gamificação do Scribo
 * Gerencia XP, níveis, badges e conquistas com memoização aprimorada
 */
const useOptimizedGamification = () => {
  const { user } = useAuth();
  const [userStats, setUserStats] = useState({
    xp: 0,
    level: 1,
    levelName: 'Iniciante',
    badges: [],
    essaysCount: 0,
    consecutiveDays: 0,
    lastLoginDate: null,
    totalStudyTime: 0,
    bestScore: 0,
    themesCompleted: [],
  });

  // Memoized configuration objects
  const LEVELS = useDeepMemo(() => [
    { level: 1, name: 'Iniciante', minXP: 0, maxXP: 100, color: '#CD7F32' },
    { level: 2, name: 'Aprendiz', minXP: 100, maxXP: 300, color: '#C0C0C0' },
    { level: 3, name: 'Competente', minXP: 300, maxXP: 600, color: '#FFD700' },
    { level: 4, name: 'Avançado', minXP: 600, maxXP: 1000, color: '#E5E4E2' },
    { level: 5, name: 'Expert', minXP: 1000, maxXP: 1500, color: '#50C878' },
    {
      level: 6,
      name: 'Mestre',
      minXP: 1500,
      maxXP: Infinity,
      color: '#6A0DAD',
    },
  ], []);

  const BADGES = useDeepMemo(() => ({
    FIRST_ESSAY: {
      id: 'first_essay',
      name: 'Primeira Redação',
      description: 'Escreveu sua primeira redação!',
      icon: 'FirstEssayBadge',
      condition: stats => stats.essaysCount >= 1,
    },
    DEDICATED_WRITER: {
      id: 'dedicated_writer',
      name: 'Escritor Dedicado',
      description: 'Escreveu 10 redações!',
      icon: 'WriterBadge',
      condition: stats => stats.essaysCount >= 10,
    },
    MASTER_WRITER: {
      id: 'master_writer',
      name: 'Mestre das Palavras',
      description: 'Escreveu 50 redações!',
      icon: 'MasterWriterBadge',
      condition: stats => stats.essaysCount >= 50,
    },
    STREAK_FIRE: {
      id: 'streak_fire',
      name: 'Streak de Fogo',
      description: 'Estudou por 7 dias consecutivos!',
      icon: 'StreakFireBadge',
      condition: stats => stats.consecutiveDays >= 7,
    },
    MARATHON: {
      id: 'marathon',
      name: 'Maratonista',
      description: 'Estudou por 30 dias consecutivos!',
      icon: 'MarathonBadge',
      condition: stats => stats.consecutiveDays >= 30,
    },
    PERFECTIONIST: {
      id: 'perfectionist',
      name: 'Perfeccionista',
      description: 'Alcançou nota 900+!',
      icon: 'PerfectionistBadge',
      condition: stats => stats.bestScore >= 900,
    },
    PERFECT_SCORE: {
      id: 'perfect_score',
      name: 'Nota Mil',
      description: 'Alcançou a nota máxima!',
      icon: 'PerfectScoreBadge',
      condition: stats => stats.bestScore >= 1000,
    },
    EXPLORER: {
      id: 'explorer',
      name: 'Explorador de Temas',
      description: 'Escreveu sobre 10 temas diferentes!',
      icon: 'ExplorerBadge',
      condition: stats => stats.themesCompleted.length >= 10,
    },
    SPEED_WRITER: {
      id: 'speed_writer',
      name: 'Velocista',
      description: 'Escreveu uma redação em menos de 30 minutos!',
      icon: 'SpeedBadge',
      condition: stats =>
        stats.fastestEssayTime && stats.fastestEssayTime <= 30,
    },
    PERSISTENT: {
      id: 'persistent',
      name: 'Persistente',
      description: 'Escreveu 5 redações sobre o mesmo tema!',
      icon: 'PersistentBadge',
      condition: stats => {
        if (!stats.themesCompleted.length) return false;
        const themeCounts = stats.themesCompleted.reduce((acc, theme) => {
          acc[theme] = (acc[theme] || 0) + 1;
          return acc;
        }, {});
        return Math.max(...Object.values(themeCounts)) >= 5;
      },
    },
  }), []);

  const XP_VALUES = useDeepMemo(() => ({
    ESSAY_SUBMITTED: 50,
    DAILY_LOGIN: 10,
    THEME_COMPLETED: 25,
    SCORE_IMPROVEMENT: 30,
    STUDY_TIME_HOUR: 20,
  }), []);

  // Memoized level calculation
  const calculateLevel = useCallback(xp => {
    for (let i = LEVELS.length - 1; i >= 0; i--) {
      if (xp >= LEVELS[i].minXP) {
        return LEVELS[i];
      }
    }
    return LEVELS[0];
  }, [LEVELS]);

  // Memoized badge checking
  const checkBadges = useCallback(stats => {
    const newBadges = [];

    Object.values(BADGES).forEach(badge => {
      if (!stats.badges.includes(badge.id) && badge.condition(stats)) {
        newBadges.push(badge.id);
      }
    });

    return newBadges;
  }, [BADGES]);

  // Memoized current level info
  const currentLevelInfo = useMemo(() => {
    return calculateLevel(userStats.xp);
  }, [userStats.xp, calculateLevel]);

  // Memoized earned badges
  const earnedBadges = useMemo(() => {
    return userStats.badges
      .map(badgeId => Object.values(BADGES).find(b => b.id === badgeId))
      .filter(Boolean);
  }, [userStats.badges, BADGES]);

  // Memoized available badges
  const availableBadges = useMemo(() => {
    return Object.values(BADGES).filter(
      badge => !userStats.badges.includes(badge.id)
    );
  }, [userStats.badges, BADGES]);

  // Stable callback for adding XP
  const addXP = useStableCallback((action, amount = null) => {
    const xpToAdd = amount || XP_VALUES[action] || 0;

    setUserStats(prevStats => {
      const newXP = prevStats.xp + xpToAdd;
      const newLevel = calculateLevel(newXP);
      const newStats = {
        ...prevStats,
        xp: newXP,
        level: newLevel.level,
        levelName: newLevel.name,
      };

      // Check for new badges
      const newBadges = checkBadges(newStats);
      if (newBadges.length > 0) {
        newStats.badges = [...prevStats.badges, ...newBadges];

        // Trigger badge unlock notifications
        newBadges.forEach(badgeId => {
          const badge = Object.values(BADGES).find(b => b.id === badgeId);
          if (badge) {
            console.log(`Badge desbloqueada: ${badge.name}`);
            // Here you can add visual notification
          }
        });
      }

      return newStats;
    });

    return xpToAdd;
  });

  // Stable callback for updating stats
  const updateStats = useStableCallback(updates => {
    setUserStats(prevStats => {
      const newStats = { ...prevStats, ...updates };

      // Check for new badges after update
      const newBadges = checkBadges(newStats);
      if (newBadges.length > 0) {
        newStats.badges = [...prevStats.badges, ...newBadges];
      }

      return newStats;
    });
  });

  // Stable callback for recording essay
  const recordEssay = useStableCallback(essayData => {
    const { score, theme, timeSpent } = essayData;

    setUserStats(prevStats => {
      const newStats = {
        ...prevStats,
        essaysCount: prevStats.essaysCount + 1,
        bestScore: Math.max(prevStats.bestScore, score || 0),
        themesCompleted: [...prevStats.themesCompleted, theme],
        fastestEssayTime: timeSpent
          ? Math.min(prevStats.fastestEssayTime || Infinity, timeSpent)
          : prevStats.fastestEssayTime,
      };

      // Check for new badges
      const newBadges = checkBadges(newStats);
      if (newBadges.length > 0) {
        newStats.badges = [...prevStats.badges, ...newBadges];
      }

      return newStats;
    });

    // Add XP for essay
    addXP('ESSAY_SUBMITTED');
  });

  // Stable callback for daily login
  const recordDailyLogin = useStableCallback(() => {
    const today = new Date().toDateString();

    setUserStats(prevStats => {
      if (prevStats.lastLoginDate === today) {
        return prevStats; // Already logged in today
      }

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const isConsecutive =
        prevStats.lastLoginDate === yesterday.toDateString();

      const newStats = {
        ...prevStats,
        lastLoginDate: today,
        consecutiveDays: isConsecutive ? prevStats.consecutiveDays + 1 : 1,
      };

      // Check streak badges
      const newBadges = checkBadges(newStats);
      if (newBadges.length > 0) {
        newStats.badges = [...prevStats.badges, ...newBadges];
      }

      return newStats;
    });

    // Add XP for daily login
    addXP('DAILY_LOGIN');
  });

  // Memoized badge info getter
  const getBadgeInfo = useCallback(badgeId => {
    return Object.values(BADGES).find(badge => badge.id === badgeId);
  }, [BADGES]);

  // Memoized level progress calculation
  const getLevelProgress = useCallback(() => {
    const currentLevel = calculateLevel(userStats.xp);
    const nextLevel = LEVELS.find(
      level => level.level === currentLevel.level + 1
    );

    if (!nextLevel) {
      return { progress: 100, xpNeeded: 0, isMaxLevel: true };
    }

    const xpInCurrentLevel = userStats.xp - currentLevel.minXP;
    const xpNeededForLevel = nextLevel.minXP - currentLevel.minXP;
    const progress = (xpInCurrentLevel / xpNeededForLevel) * 100;

    return {
      progress: Math.min(progress, 100),
      xpNeeded: nextLevel.minXP - userStats.xp,
      isMaxLevel: false,
      nextLevel: nextLevel.name,
    };
  }, [userStats.xp, calculateLevel, LEVELS]);

  // Memoized statistics
  const statistics = useMemo(() => ({
    totalXP: userStats.xp,
    currentLevel: currentLevelInfo,
    earnedBadgesCount: earnedBadges.length,
    availableBadgesCount: availableBadges.length,
    completionPercentage: Math.round(
      (earnedBadges.length / Object.keys(BADGES).length) * 100
    ),
  }), [userStats.xp, currentLevelInfo, earnedBadges.length, availableBadges.length, BADGES]);

  // Load user data on mount
  useEffect(() => {
    if (user) {
      // Load from backend or localStorage
      const savedStats = localStorage.getItem(`gamification_${user.id}`);
      if (savedStats) {
        setUserStats(JSON.parse(savedStats));
      }

      // Record daily login
      recordDailyLogin();
    }
  }, [user, recordDailyLogin]);

  // Save data when it changes
  useEffect(() => {
    if (user && userStats.xp > 0) {
      localStorage.setItem(
        `gamification_${user.id}`,
        JSON.stringify(userStats)
      );
    }
  }, [user, userStats]);

  return {
    // State
    userStats,
    
    // Computed values
    currentLevelInfo,
    earnedBadges,
    availableBadges,
    statistics,
    
    // Functions
    addXP,
    updateStats,
    recordEssay,
    recordDailyLogin,
    getBadgeInfo,
    getLevelProgress,
    
    // Configuration
    LEVELS,
    BADGES,
    XP_VALUES,
  };
};

export default useOptimizedGamification;