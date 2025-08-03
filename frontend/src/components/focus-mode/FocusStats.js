// Focus Mode Statistics Component
import React, { memo, useMemo } from 'react';
import { X, TrendingUp, Clock, Edit3, Target, Award } from 'lucide-react';

/**
 * Focus Statistics Panel
 * Shows detailed session statistics and historical data
 */
const FocusStats = memo(({ 
  session = null,
  timeElapsed = 0,
  wordsWritten = 0,
  productivity = 0,
  onClose = () => {} 
}) => {
  /**
   * Calculate session statistics
   */
  const sessionStats = useMemo(() => {
    const wordsPerMinute = timeElapsed > 0 ? (wordsWritten / (timeElapsed / 60)) : 0;
    const averageWordsPerMinute = 30; // Baseline for comparison
    const efficiency = averageWordsPerMinute > 0 ? (wordsPerMinute / averageWordsPerMinute) * 100 : 0;

    return {
      wordsPerMinute: Math.round(wordsPerMinute * 10) / 10,
      efficiency: Math.round(efficiency),
      focusScore: productivity,
      sessionDuration: timeElapsed,
      totalWords: wordsWritten,
    };
  }, [timeElapsed, wordsWritten, productivity]);

  /**
   * Get historical data from localStorage
   */
  const historicalData = useMemo(() => {
    try {
      const stored = localStorage.getItem('focus_sessions_history');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }, []);

  /**
   * Calculate historical averages
   */
  const historicalStats = useMemo(() => {
    if (historicalData.length === 0) {
      return {
        averageSessionTime: 0,
        averageWordsPerSession: 0,
        averageProductivity: 0,
        totalSessions: 0,
        totalFocusTime: 0,
        bestSession: null,
      };
    }

    const totalTime = historicalData.reduce((sum, session) => sum + (session.duration || 0), 0);
    const totalWords = historicalData.reduce((sum, session) => sum + (session.wordsWritten || 0), 0);
    const totalProductivity = historicalData.reduce((sum, session) => sum + (session.productivity || 0), 0);
    
    const bestSession = historicalData.reduce((best, session) => {
      if (!best || (session.productivity || 0) > (best.productivity || 0)) {
        return session;
      }
      return best;
    }, null);

    return {
      averageSessionTime: Math.round(totalTime / historicalData.length),
      averageWordsPerSession: Math.round(totalWords / historicalData.length),
      averageProductivity: Math.round(totalProductivity / historicalData.length),
      totalSessions: historicalData.length,
      totalFocusTime: totalTime,
      bestSession,
    };
  }, [historicalData]);

  /**
   * Format time in readable format
   */
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  /**
   * Get performance level
   */
  const getPerformanceLevel = (score) => {
    if (score >= 90) return { level: 'Excepcional', color: 'text-purple-600', emoji: '🏆' };
    if (score >= 80) return { level: 'Excelente', color: 'text-green-600', emoji: '🔥' };
    if (score >= 70) return { level: 'Muito Bom', color: 'text-blue-600', emoji: '⚡' };
    if (score >= 60) return { level: 'Bom', color: 'text-yellow-600', emoji: '👍' };
    if (score >= 40) return { level: 'Regular', color: 'text-orange-600', emoji: '💪' };
    return { level: 'Precisa Melhorar', color: 'text-red-600', emoji: '🎯' };
  };

  const currentPerformance = getPerformanceLevel(sessionStats.focusScore);
  const averagePerformance = getPerformanceLevel(historicalStats.averageProductivity);

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold font-display">Estatísticas</h2>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <X size={20} />
        </button>
      </div>

      {/* Stats Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {/* Current Session */}
        <div className="space-y-4">
          <h3 className="flex items-center gap-2 text-md font-medium">
            <Clock size={18} />
            Sessão Atual
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-2xl font-bold text-pastel-purple-600">
                {formatTime(sessionStats.sessionDuration)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Tempo de foco
              </div>
            </div>

            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-2xl font-bold text-pastel-blue-600">
                {sessionStats.totalWords}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Palavras escritas
              </div>
            </div>

            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="text-2xl font-bold text-pastel-green-600">
                {sessionStats.wordsPerMinute}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Palavras/min
              </div>
            </div>

            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className={`text-2xl font-bold ${currentPerformance.color}`}>
                {sessionStats.focusScore}%
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Produtividade
              </div>
            </div>
          </div>

          {/* Performance Level */}
          <div className="p-3 bg-gradient-to-r from-pastel-purple-50 to-pastel-blue-50 dark:from-pastel-purple-900 dark:to-pastel-blue-900 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{currentPerformance.emoji}</span>
              <div>
                <div className={`font-semibold ${currentPerformance.color}`}>
                  {currentPerformance.level}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Nível de performance atual
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Historical Stats */}
        {historicalStats.totalSessions > 0 && (
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-md font-medium">
              <TrendingUp size={18} />
              Histórico
            </h3>

            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-sm font-medium">Total de sessões</span>
                <span className="font-bold">{historicalStats.totalSessions}</span>
              </div>

              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-sm font-medium">Tempo total de foco</span>
                <span className="font-bold">{formatTime(historicalStats.totalFocusTime)}</span>
              </div>

              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-sm font-medium">Tempo médio por sessão</span>
                <span className="font-bold">{formatTime(historicalStats.averageSessionTime)}</span>
              </div>

              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-sm font-medium">Palavras médias por sessão</span>
                <span className="font-bold">{historicalStats.averageWordsPerSession}</span>
              </div>

              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-sm font-medium">Produtividade média</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold">{historicalStats.averageProductivity}%</span>
                  <span className={`text-sm ${averagePerformance.color}`}>
                    {averagePerformance.emoji}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Best Session */}
        {historicalStats.bestSession && (
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-md font-medium">
              <Award size={18} />
              Melhor Sessão
            </h3>

            <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900 dark:to-orange-900 rounded-lg border border-yellow-200 dark:border-yellow-700">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">🏆</span>
                <div>
                  <div className="font-semibold text-yellow-800 dark:text-yellow-200">
                    Sessão Record
                  </div>
                  <div className="text-sm text-yellow-600 dark:text-yellow-400">
                    {new Date(historicalStats.bestSession.date).toLocaleDateString()}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Duração:</span>
                  <span className="ml-2 font-semibold">
                    {formatTime(historicalStats.bestSession.duration || 0)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Palavras:</span>
                  <span className="ml-2 font-semibold">
                    {historicalStats.bestSession.wordsWritten || 0}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-600 dark:text-gray-400">Produtividade:</span>
                  <span className="ml-2 font-semibold text-yellow-600 dark:text-yellow-400">
                    {historicalStats.bestSession.productivity || 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tips */}
        <div className="space-y-4">
          <h3 className="flex items-center gap-2 text-md font-medium">
            <Target size={18} />
            Dicas de Produtividade
          </h3>

          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            {sessionStats.wordsPerMinute < 20 && (
              <div className="p-3 bg-blue-50 dark:bg-blue-900 rounded-lg border-l-4 border-blue-400">
                💡 Tente manter um ritmo constante de escrita para melhorar sua velocidade.
              </div>
            )}
            
            {sessionStats.focusScore < 60 && (
              <div className="p-3 bg-orange-50 dark:bg-orange-900 rounded-lg border-l-4 border-orange-400">
                🎯 Use técnicas de respiração para melhorar o foco durante a escrita.
              </div>
            )}
            
            {sessionStats.sessionDuration < 900 && ( // Less than 15 minutes
              <div className="p-3 bg-green-50 dark:bg-green-900 rounded-lg border-l-4 border-green-400">
                ⏰ Sessões mais longas (20-30 min) tendem a ser mais produtivas.
              </div>
            )}

            <div className="p-3 bg-purple-50 dark:bg-purple-900 rounded-lg border-l-4 border-purple-400">
              ✨ Use o modo foco regularmente para desenvolver o hábito de escrita concentrada.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

FocusStats.displayName = 'FocusStats';

export default FocusStats;