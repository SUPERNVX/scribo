import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { SmartIcon } from '../ModernIcons';
import * as BadgeIcons from '../../assets/icons/badges';

const ModernGamificationPanel = ({ compact = false }) => {
  const { user, token } = useAuth();
  const [gamificationData, setGamificationData] = useState({
    level: 1,
    xp: 0,
    xpToNext: 100,
    totalXP: 0,
    achievements: [],
    stats: {
      essaysWritten: 0,
      averageScore: 0,
      streak: 0,
      totalWords: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredAchievement, setHoveredAchievement] = useState(null);

  // Carregar dados do backend
  useEffect(() => {
    if (token) {
      loadGamificationData();
    }
  }, [token]);

  const loadGamificationData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Dados padrão caso não consiga carregar do backend
      let stats = {
        total_essays: 0,
        average_score: 0,
        writing_streak: 0,
        total_words: 0,
        total_score: 0
      };
      let achievements = [];

      // Tentar carregar estatísticas do usuário
      try {
        const statsResponse = await fetch('http://localhost:8000/api/stats/my', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (statsResponse.ok) {
          const statsData = await statsResponse.json();
          stats = { ...stats, ...statsData };
        } else {
          console.log('Stats endpoint returned error:', statsResponse.status);
        }
      } catch (error) {
        console.log('Stats endpoint not available:', error.message);
      }

      // Tentar carregar conquistas
      try {
        const achievementsResponse = await fetch('http://localhost:8000/api/achievements/my', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (achievementsResponse.ok) {
          const achievementsData = await achievementsResponse.json();
          achievements = achievementsData.achievements || [];
        } else {
          console.log('Achievements endpoint returned error:', achievementsResponse.status);
        }
      } catch (error) {
        console.log('Achievements endpoint not available:', error.message);
      }

      // Calcular nível baseado no XP
      const totalXP = (stats.total_essays || 0) * 10 + (stats.total_score || 0) / 10;
      const level = Math.floor(totalXP / 100) + 1;
      const xp = totalXP % 100;
      const xpToNext = 100;

      setGamificationData({
        level,
        xp: Math.round(xp),
        xpToNext,
        totalXP: Math.round(totalXP),
        achievements: achievements || [],
        stats: {
          essaysWritten: stats.total_essays || 0,
          averageScore: stats.average_score || 0,
          streak: stats.writing_streak || 0,
          totalWords: stats.total_words || 0
        }
      });

    } catch (error) {
      console.error('Erro geral ao carregar dados de gamificação:', error);
      // Manter dados padrão em caso de erro
      setGamificationData(prev => ({
        ...prev,
        level: 1,
        xp: 0,
        totalXP: 0,
        achievements: [],
        stats: {
          essaysWritten: 0,
          averageScore: 0,
          streak: 0,
          totalWords: 0
        }
      }));
    } finally {
      setLoading(false);
    }
  };

  const getLevelTitle = (level) => {
    if (level >= 20) return 'Mestre da Escrita';
    if (level >= 15) return 'Escritor Expert';
    if (level >= 10) return 'Escritor Avançado';
    if (level >= 5) return 'Escritor Intermediário';
    return 'Escritor Iniciante';
  };

  const getAchievementIcon = (achievement) => {
    const iconMap = {
      'first-essay': BadgeIcons.FirstEssayBadge,
      'week-streak': BadgeIcons.StreakFireBadge,
      'month-streak': BadgeIcons.MarathonBadge,
      'perfectionist': BadgeIcons.PerfectionistBadge,
      'perfect-score': BadgeIcons.PerfectScoreBadge,
      'prolific': BadgeIcons.WriterBadge,
      'scholar': BadgeIcons.MasterWriterBadge,
      'marathoner': BadgeIcons.SpeedBadge,
      'theme-explorer': BadgeIcons.ExplorerBadge,
      'persistent': BadgeIcons.PersistentBadge,
      // Níveis
      'beginner': BadgeIcons.BeginnerBadge,
      'apprentice': BadgeIcons.ApprenticeBadge,
      'competent': BadgeIcons.CompetentBadge,
      'advanced': BadgeIcons.AdvancedBadge,
      'expert': BadgeIcons.ExpertBadge,
      'master': BadgeIcons.MasterBadge
    };
    return iconMap[achievement.type] || BadgeIcons.FirstEssayBadge;
  };

  const getAchievementName = (achievement) => {
    const nameMap = {
      'first-essay': 'Primeira Redação',
      'week-streak': '7 Dias Consecutivos',
      'month-streak': '30 Dias Consecutivos',
      'perfectionist': 'Perfeccionista',
      'prolific': 'Escritor Prolífico',
      'scholar': 'Acadêmico',
      'marathoner': 'Maratonista',
      'perfect-score': 'Nota Mil',
      'theme-explorer': 'Explorador de Temas',
      'persistent': 'Persistente',
      'beginner': 'Iniciante',
      'apprentice': 'Aprendiz',
      'competent': 'Competente',
      'advanced': 'Avançado',
      'expert': 'Expert',
      'master': 'Mestre'
    };
    return nameMap[achievement.type] || achievement.name || 'Conquista';
  };

  const getAchievementDescription = (achievement) => {
    const descriptionMap = {
      'first-essay': 'Escreveu sua primeira redação',
      'week-streak': 'Escreveu redações por 7 dias consecutivos',
      'month-streak': 'Escreveu redações por 30 dias consecutivos',
      'perfectionist': 'Alcançou nota 1000 em uma redação',
      'perfect-score': 'Alcançou a nota máxima em uma redação',
      'prolific': 'Escreveu 50 redações',
      'scholar': 'Manteve média geral acima de 900 pontos',
      'marathoner': 'Escreveu 10 redações em um único mês',
      'theme-explorer': 'Escreveu sobre 5 temas diferentes',
      'persistent': 'Escreveu 100 redações',
      'beginner': 'Alcançou o Nível 1',
      'apprentice': 'Alcançou o Nível 5',
      'competent': 'Alcançou o Nível 10',
      'advanced': 'Alcançou o Nível 15',
      'expert': 'Alcançou o Nível 20',
      'master': 'Alcançou o Nível 25'
    };
    return descriptionMap[achievement.type] || achievement.description || 'Conquista desbloqueada';
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <SmartIcon type="alert-circle" size={24} className="mx-auto mb-2" />
          <p className="text-sm">Erro ao carregar gamificação</p>
          <button 
            onClick={loadGamificationData}
            className="mt-2 text-xs text-pastel-purple-600 hover:text-pastel-purple-700 underline"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  // Versão compacta para o header
  if (compact) {
    return (
      <div className="flex items-center gap-3 px-3 py-2 bg-gradient-to-r from-pastel-purple-50 to-pastel-blue-50 dark:from-gray-700 dark:to-gray-600 rounded-lg border border-pastel-purple-200 dark:border-gray-600">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-r from-pastel-purple-500 to-pastel-blue-500 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">{gamificationData.level}</span>
          </div>
          <div className="text-sm">
            <div className="font-medium text-gray-900 dark:text-white">
              Nível {gamificationData.level}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-300">
              {gamificationData.xp}/{gamificationData.xpToNext} XP
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Versão completa para o dashboard
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-r from-pastel-purple-500 to-pastel-blue-500 rounded-xl flex items-center justify-center">
            <SmartIcon type="trophy" size={24} className="text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              Seu Progresso
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Continue escrevendo para evoluir!
            </p>
          </div>
        </div>
      </div>

      {/* Nível e XP */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-pastel-purple-500 to-pastel-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">{gamificationData.level}</span>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white">
                Nível {gamificationData.level}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {getLevelTitle(gamificationData.level)}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-pastel-purple-600 dark:text-pastel-purple-400">
              {gamificationData.totalXP} XP total
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {gamificationData.xpToNext - gamificationData.xp} XP para próximo nível
            </div>
          </div>
        </div>

        {/* Barra de progresso */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-pastel-purple-500 to-pastel-blue-500 rounded-full transition-all duration-500"
            style={{ width: `${(gamificationData.xp / gamificationData.xpToNext) * 100}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
          <span>{gamificationData.xp} XP</span>
          <span>{gamificationData.xpToNext} XP</span>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="text-2xl font-bold text-pastel-purple-600 dark:text-pastel-purple-400">
            {gamificationData.stats.essaysWritten}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-300">Redações</div>
        </div>
        
        <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="text-2xl font-bold text-pastel-blue-600 dark:text-pastel-blue-400">
            {gamificationData.stats.averageScore.toFixed(0)}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-300">Média</div>
        </div>
        
        <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {gamificationData.stats.streak}
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-300">Sequência</div>
        </div>
        
        <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {Math.round(gamificationData.stats.totalWords / 1000)}k
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-300">Palavras</div>
        </div>
      </div>

      {/* Conquistas */}
      <div>
        <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <SmartIcon type="award" size={18} className="text-yellow-500" />
          Conquistas ({gamificationData.achievements.length})
        </h4>
        
        {gamificationData.achievements.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 relative">
            {gamificationData.achievements.map((achievement, index) => (
              <div 
                key={index} 
                className="flex items-center gap-2 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700 cursor-help transition-all duration-200 hover:shadow-md hover:scale-105 relative"
                onMouseEnter={() => setHoveredAchievement(index)}
                onMouseLeave={() => setHoveredAchievement(null)}
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden">
                  <img 
                    src={getAchievementIcon(achievement)} 
                    alt={getAchievementName(achievement)}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {getAchievementName(achievement)}
                  </div>
                </div>
                
                {/* Tooltip customizado */}
                {hoveredAchievement === index && (
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50">
                    <div className="bg-gray-900 dark:bg-gray-700 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap shadow-lg">
                      {getAchievementDescription(achievement)}
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500 dark:text-gray-400">
            <SmartIcon type="award" size={32} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhuma conquista ainda</p>
            <p className="text-xs mt-1">
              Continue escrevendo para desbloquear suas primeiras conquistas!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModernGamificationPanel;