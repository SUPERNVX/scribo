// Custom hook for gamification system
import { useState, useEffect, useCallback } from 'react';

import { useAuth } from '../contexts/AuthContext';

/**
 * Sistema de Gamificação do Scribo
 * Gerencia XP, níveis, badges e conquistas
 */
const useGamification = () => {
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

  // Configuração de níveis
  const LEVELS = [
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
  ];

  // Configuração de badges
  const BADGES = {
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
    FOCUS_MASTER: {
      id: 'focus_master',
      name: 'Mestre do Foco',
      description: 'Completou 10 sessões de modo foco!',
      icon: 'FocusMasterBadge',
      condition: stats => (stats.focusSessions || 0) >= 10,
    },
    DEEP_FOCUS: {
      id: 'deep_focus',
      name: 'Foco Profundo',
      description: 'Manteve uma sessão de foco por mais de 1 hora!',
      icon: 'DeepFocusBadge',
      condition: stats => (stats.longestFocusSession || 0) >= 3600, // 1 hour in seconds
    },
    PRODUCTIVITY_GURU: {
      id: 'productivity_guru',
      name: 'Guru da Produtividade',
      description: 'Alcançou 90%+ de produtividade em uma sessão!',
      icon: 'ProductivityGuruBadge',
      condition: stats => (stats.bestProductivity || 0) >= 90,
    },
    FOCUS_STREAK: {
      id: 'focus_streak',
      name: 'Sequência de Foco',
      description: 'Usou o modo foco por 5 dias consecutivos!',
      icon: 'FocusStreakBadge',
      condition: stats => (stats.focusStreak || 0) >= 5,
    },
  };

  // Valores de XP por ação
  const XP_VALUES = {
    ESSAY_SUBMITTED: 50,
    DAILY_LOGIN: 10,
    THEME_COMPLETED: 25,
    SCORE_IMPROVEMENT: 30,
    STUDY_TIME_HOUR: 20,
    FOCUS_SESSION: 5, // XP per minute in focus mode
    FOCUS_SESSION_COMPLETE: 25, // Bonus for completing a focus session
    PRODUCTIVITY_BONUS: 10, // Bonus for high productivity sessions
  };

  /**
   * Calcula o nível atual baseado no XP
   */
  const calculateLevel = useCallback(xp => {
    for (let i = LEVELS.length - 1; i >= 0; i--) {
      if (xp >= LEVELS[i].minXP) {
        return LEVELS[i];
      }
    }
    return LEVELS[0];
  }, []);

  /**
   * Verifica e desbloqueia badges
   */
  const checkBadges = useCallback(stats => {
    const newBadges = [];

    Object.values(BADGES).forEach(badge => {
      if (!stats.badges.includes(badge.id) && badge.condition(stats)) {
        newBadges.push(badge.id);
      }
    });

    return newBadges;
  }, []);

  /**
   * Adiciona XP e verifica progressão
   */
  const addXP = useCallback(
    (action, amount = null) => {
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

        // Verifica novas badges
        const newBadges = checkBadges(newStats);
        if (newBadges.length > 0) {
          newStats.badges = [...prevStats.badges, ...newBadges];

          // Trigger badge unlock animation/notification
          newBadges.forEach(badgeId => {
            const badge = Object.values(BADGES).find(b => b.id === badgeId);
            if (badge) {
              console.log(`Badge desbloqueada: ${badge.name}`);
              // Aqui você pode adicionar notificação visual
            }
          });
        }

        return newStats;
      });

      return xpToAdd;
    },
    [calculateLevel, checkBadges]
  );

  /**
   * Atualiza estatísticas do usuário
   */
  const updateStats = useCallback(
    updates => {
      setUserStats(prevStats => {
        const newStats = { ...prevStats, ...updates };

        // Verifica novas badges após atualização
        const newBadges = checkBadges(newStats);
        if (newBadges.length > 0) {
          newStats.badges = [...prevStats.badges, ...newBadges];
        }

        return newStats;
      });
    },
    [checkBadges]
  );

  /**
   * Registra uma nova redação
   */
  const recordEssay = useCallback(
    essayData => {
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

        // Verifica novas badges
        const newBadges = checkBadges(newStats);
        if (newBadges.length > 0) {
          newStats.badges = [...prevStats.badges, ...newBadges];
        }

        return newStats;
      });

      // Adiciona XP pela redação
      addXP('ESSAY_SUBMITTED');
    },
    [addXP, checkBadges]
  );

  /**
   * Registra login diário e atualiza streak
   */
  const recordDailyLogin = useCallback(() => {
    const today = new Date().toDateString();

    setUserStats(prevStats => {
      if (prevStats.lastLoginDate === today) {
        return prevStats; // Já fez login hoje
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

      // Verifica badges de streak
      const newBadges = checkBadges(newStats);
      if (newBadges.length > 0) {
        newStats.badges = [...prevStats.badges, ...newBadges];
      }

      return newStats;
    });

    // Adiciona XP pelo login diário
    addXP('DAILY_LOGIN');
  }, [addXP, checkBadges]);

  /**
   * Registra uma sessão de foco
   */
  const recordFocusSession = useCallback(
    sessionData => {
      const { duration, productivity, wordsWritten } = sessionData;

      setUserStats(prevStats => {
        const newStats = {
          ...prevStats,
          focusSessions: (prevStats.focusSessions || 0) + 1,
          totalFocusTime: (prevStats.totalFocusTime || 0) + duration,
          longestFocusSession: Math.max(prevStats.longestFocusSession || 0, duration),
          bestProductivity: Math.max(prevStats.bestProductivity || 0, productivity),
        };

        // Verifica novas badges
        const newBadges = checkBadges(newStats);
        if (newBadges.length > 0) {
          newStats.badges = [...prevStats.badges, ...newBadges];
        }

        return newStats;
      });

      // Adiciona XP pela sessão
      const sessionMinutes = Math.floor(duration / 60);
      const sessionXP = sessionMinutes * XP_VALUES.FOCUS_SESSION;
      addXP('FOCUS_SESSION_COMPLETE', XP_VALUES.FOCUS_SESSION_COMPLETE + sessionXP);

      // Bonus para alta produtividade
      if (productivity >= 80) {
        addXP('PRODUCTIVITY_BONUS');
      }
    },
    [addXP, checkBadges]
  );

  /**
   * Obtém informações de uma badge
   */
  const getBadgeInfo = useCallback(badgeId => {
    return Object.values(BADGES).find(badge => badge.id === badgeId);
  }, []);

  /**
   * Obtém progresso para próximo nível
   */
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
  }, [userStats.xp, calculateLevel]);

  // Carrega dados do usuário ao montar
  useEffect(() => {
    if (user) {
      // Aqui você carregaria os dados do backend
      // Por enquanto, vamos usar localStorage
      const savedStats = localStorage.getItem(`gamification_${user.id}`);
      if (savedStats) {
        setUserStats(JSON.parse(savedStats));
      }

      // Registra login diário
      recordDailyLogin();
    }
  }, [user, recordDailyLogin]);

  // Salva dados quando mudam
  useEffect(() => {
    if (user && userStats.xp > 0) {
      localStorage.setItem(
        `gamification_${user.id}`,
        JSON.stringify(userStats)
      );
    }
  }, [user, userStats]);

  return {
    userStats,
    addXP,
    updateStats,
    recordEssay,
    recordDailyLogin,
    recordFocusSession,
    getBadgeInfo,
    getLevelProgress,
    LEVELS,
    BADGES,
    XP_VALUES,
  };
};

export default useGamification;
