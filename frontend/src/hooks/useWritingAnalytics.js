// Custom hook for writing analytics and data collection
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useStats } from './useStats';
import { useEssays } from './useEssays';

/**
 * Custom hook for comprehensive writing analytics
 * Collects and processes writing data for insights and visualizations
 */
export const useWritingAnalytics = (timeRange = 'month') => {
  const { stats, loading: statsLoading } = useStats();
  const { essays, loading: essaysLoading } = useEssays();
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Filter essays by time range
   */
  const filterEssaysByTimeRange = useCallback((essays, range) => {
    if (!essays || essays.length === 0) return [];

    const now = new Date();
    let startDate;

    switch (range) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'quarter':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        return essays;
    }

    return essays.filter(essay => new Date(essay.created_at) >= startDate);
  }, []);

  /**
   * Calculate writing patterns and insights
   */
  const calculateWritingPatterns = useCallback((essays) => {
    if (!essays || essays.length === 0) return null;

    // Writing frequency by day of week
    const dayOfWeekCounts = new Array(7).fill(0);
    const hourOfDayCounts = new Array(24).fill(0);
    
    essays.forEach(essay => {
      const date = new Date(essay.created_at);
      dayOfWeekCounts[date.getDay()]++;
      hourOfDayCounts[date.getHours()]++;
    });

    // Most productive day and hour
    const mostProductiveDay = dayOfWeekCounts.indexOf(Math.max(...dayOfWeekCounts));
    const mostProductiveHour = hourOfDayCounts.indexOf(Math.max(...hourOfDayCounts));

    // Writing streak calculation
    const sortedDates = essays
      .map(essay => new Date(essay.created_at).toDateString())
      .sort()
      .filter((date, index, arr) => arr.indexOf(date) === index);

    let currentStreak = 0;
    let maxStreak = 0;
    let tempStreak = 1;

    for (let i = 1; i < sortedDates.length; i++) {
      const prevDate = new Date(sortedDates[i - 1]);
      const currDate = new Date(sortedDates[i]);
      const diffDays = (currDate - prevDate) / (1000 * 60 * 60 * 24);

      if (diffDays === 1) {
        tempStreak++;
      } else {
        maxStreak = Math.max(maxStreak, tempStreak);
        tempStreak = 1;
      }
    }
    maxStreak = Math.max(maxStreak, tempStreak);

    // Current streak
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();
    const lastEssayDate = sortedDates[sortedDates.length - 1];

    if (lastEssayDate === today || lastEssayDate === yesterday) {
      currentStreak = 1;
      for (let i = sortedDates.length - 2; i >= 0; i--) {
        const prevDate = new Date(sortedDates[i]);
        const nextDate = new Date(sortedDates[i + 1]);
        const diffDays = (nextDate - prevDate) / (1000 * 60 * 60 * 24);
        
        if (diffDays === 1) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    return {
      dayOfWeekCounts,
      hourOfDayCounts,
      mostProductiveDay,
      mostProductiveHour,
      currentStreak,
      maxStreak,
      totalWritingDays: sortedDates.length,
    };
  }, []);

  /**
   * Calculate competency analysis
   */
  const calculateCompetencyAnalysis = useCallback((essays) => {
    if (!essays || essays.length === 0) return null;

    const competencyData = {
      competency1: [],
      competency2: [],
      competency3: [],
      competency4: [],
      competency5: [],
    };

    const competencyTrends = {
      competency1: [],
      competency2: [],
      competency3: [],
      competency4: [],
      competency5: [],
    };

    essays.forEach((essay, index) => {
      if (essay.competency_scores) {
        Object.keys(competencyData).forEach(comp => {
          const score = essay.competency_scores[comp] || 0;
          competencyData[comp].push(score);
          competencyTrends[comp].push({
            x: index + 1,
            y: score,
            date: essay.created_at,
          });
        });
      }
    });

    // Calculate averages and improvements
    const competencyAverages = {};
    const competencyImprovements = {};

    Object.keys(competencyData).forEach(comp => {
      const scores = competencyData[comp];
      if (scores.length > 0) {
        competencyAverages[comp] = scores.reduce((sum, score) => sum + score, 0) / scores.length;
        
        // Calculate improvement (last 3 vs first 3 essays)
        if (scores.length >= 6) {
          const firstThree = scores.slice(0, 3).reduce((sum, score) => sum + score, 0) / 3;
          const lastThree = scores.slice(-3).reduce((sum, score) => sum + score, 0) / 3;
          competencyImprovements[comp] = lastThree - firstThree;
        } else {
          competencyImprovements[comp] = 0;
        }
      }
    });

    return {
      competencyAverages,
      competencyImprovements,
      competencyTrends,
      competencyData,
    };
  }, []);

  /**
   * Calculate performance metrics
   */
  const calculatePerformanceMetrics = useCallback((essays) => {
    if (!essays || essays.length === 0) return null;

    const scores = essays.map(essay => essay.score || 0).filter(score => score > 0);
    const wordCounts = essays.map(essay => essay.word_count || 0).filter(count => count > 0);

    // Score statistics
    const averageScore = scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
    const highestScore = scores.length > 0 ? Math.max(...scores) : 0;
    const lowestScore = scores.length > 0 ? Math.min(...scores) : 0;

    // Word count statistics
    const averageWords = wordCounts.length > 0 ? wordCounts.reduce((sum, count) => sum + count, 0) / wordCounts.length : 0;
    const totalWords = wordCounts.reduce((sum, count) => sum + count, 0);

    // Progress trend
    const progressTrend = essays
      .filter(essay => essay.score && essay.score > 0)
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
      .map((essay, index) => ({
        x: index + 1,
        y: essay.score,
        date: essay.created_at,
        title: essay.title || `Redação ${index + 1}`,
      }));

    // Calculate improvement rate
    let improvementRate = 0;
    if (progressTrend.length >= 2) {
      const firstScore = progressTrend[0].y;
      const lastScore = progressTrend[progressTrend.length - 1].y;
      improvementRate = ((lastScore - firstScore) / firstScore) * 100;
    }

    return {
      averageScore,
      highestScore,
      lowestScore,
      averageWords,
      totalWords,
      progressTrend,
      improvementRate,
      totalEssays: essays.length,
      scoredEssays: scores.length,
    };
  }, []);

  /**
   * Generate personalized insights
   */
  const generateInsights = useCallback((analyticsData) => {
    if (!analyticsData) return [];

    const insights = [];
    const { performanceMetrics, competencyAnalysis, writingPatterns } = analyticsData;

    // Performance insights
    if (performanceMetrics) {
      if (performanceMetrics.improvementRate > 10) {
        insights.push({
          type: 'strength',
          title: 'Excelente Progresso!',
          description: `Sua pontuação melhorou ${performanceMetrics.improvementRate.toFixed(1)}% ao longo do tempo.`,
          priority: 'high',
          actionable: false,
        });
      } else if (performanceMetrics.improvementRate < -5) {
        insights.push({
          type: 'improvement',
          title: 'Oportunidade de Melhoria',
          description: 'Suas pontuações recentes estão abaixo da média. Considere revisar os fundamentos.',
          priority: 'high',
          actionable: true,
        });
      }

      if (performanceMetrics.averageWords < 250) {
        insights.push({
          type: 'recommendation',
          title: 'Desenvolva Mais Suas Ideias',
          description: `Sua média de ${Math.round(performanceMetrics.averageWords)} palavras está abaixo do ideal. Tente expandir seus argumentos.`,
          priority: 'medium',
          actionable: true,
        });
      }
    }

    // Competency insights
    if (competencyAnalysis) {
      const weakestCompetency = Object.entries(competencyAnalysis.competencyAverages)
        .sort(([,a], [,b]) => a - b)[0];
      
      if (weakestCompetency && weakestCompetency[1] < 150) {
        const competencyNames = {
          competency1: 'Domínio da Norma Padrão',
          competency2: 'Compreensão da Proposta',
          competency3: 'Seleção de Informações',
          competency4: 'Coesão e Coerência',
          competency5: 'Proposta de Intervenção',
        };

        insights.push({
          type: 'improvement',
          title: `Foque na ${competencyNames[weakestCompetency[0]]}`,
          description: `Esta é sua competência com menor pontuação (${weakestCompetency[1].toFixed(0)} pontos).`,
          priority: 'high',
          actionable: true,
        });
      }
    }

    // Writing pattern insights
    if (writingPatterns) {
      if (writingPatterns.currentStreak >= 7) {
        insights.push({
          type: 'strength',
          title: 'Consistência Impressionante!',
          description: `Você está em uma sequência de ${writingPatterns.currentStreak} dias escrevendo.`,
          priority: 'medium',
          actionable: false,
        });
      } else if (writingPatterns.currentStreak === 0) {
        insights.push({
          type: 'recommendation',
          title: 'Retome o Ritmo',
          description: 'A prática regular é fundamental. Que tal escrever uma redação hoje?',
          priority: 'medium',
          actionable: true,
        });
      }
    }

    return insights.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }, []);

  /**
   * Process all analytics data
   */
  const processAnalyticsData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (!essays || essays.length === 0) {
        setAnalyticsData(null);
        return;
      }

      const filteredEssays = filterEssaysByTimeRange(essays, timeRange);
      
      const performanceMetrics = calculatePerformanceMetrics(filteredEssays);
      const competencyAnalysis = calculateCompetencyAnalysis(filteredEssays);
      const writingPatterns = calculateWritingPatterns(filteredEssays);

      const processedData = {
        performanceMetrics,
        competencyAnalysis,
        writingPatterns,
        timeRange,
        totalEssays: filteredEssays.length,
        dateRange: {
          start: filteredEssays.length > 0 ? Math.min(...filteredEssays.map(e => new Date(e.created_at))) : null,
          end: filteredEssays.length > 0 ? Math.max(...filteredEssays.map(e => new Date(e.created_at))) : null,
        },
      };

      const insights = generateInsights(processedData);
      processedData.insights = insights;

      setAnalyticsData(processedData);
    } catch (err) {
      console.error('Error processing analytics data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [essays, timeRange, filterEssaysByTimeRange, calculatePerformanceMetrics, calculateCompetencyAnalysis, calculateWritingPatterns, generateInsights]);

  // Process data when essays or timeRange changes
  useEffect(() => {
    if (!essaysLoading && !statsLoading) {
      processAnalyticsData();
    }
  }, [essaysLoading, statsLoading, processAnalyticsData]);

  /**
   * Export analytics data
   */
  const exportData = useCallback((format = 'json') => {
    if (!analyticsData) return null;

    const exportData = {
      generatedAt: new Date().toISOString(),
      timeRange,
      ...analyticsData,
    };

    if (format === 'json') {
      return JSON.stringify(exportData, null, 2);
    }

    // CSV format for basic metrics
    if (format === 'csv') {
      const csvData = [];
      csvData.push(['Métrica', 'Valor']);
      
      if (analyticsData.performanceMetrics) {
        const pm = analyticsData.performanceMetrics;
        csvData.push(['Pontuação Média', pm.averageScore.toFixed(2)]);
        csvData.push(['Maior Pontuação', pm.highestScore]);
        csvData.push(['Menor Pontuação', pm.lowestScore]);
        csvData.push(['Palavras Médias', Math.round(pm.averageWords)]);
        csvData.push(['Total de Palavras', pm.totalWords]);
        csvData.push(['Taxa de Melhoria (%)', pm.improvementRate.toFixed(2)]);
      }

      return csvData.map(row => row.join(',')).join('\n');
    }

    return exportData;
  }, [analyticsData, timeRange]);

  return {
    analyticsData,
    loading: loading || essaysLoading || statsLoading,
    error,
    exportData,
    refetch: processAnalyticsData,
  };
};

export default useWritingAnalytics;