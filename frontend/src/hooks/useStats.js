// Custom hook for managing user statistics
import { useState, useEffect, useCallback } from 'react';

import { apiService } from '../services/api';
import { calculateEssayStats } from '../utils';

/**
 * Custom hook for managing user statistics and analytics
 */
export const useStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Load user statistics from API
   */
  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getMyStats();
      setStats(data);
    } catch (err) {
      console.error('Error loading stats:', err);
      setError(err.response?.data?.detail || 'Erro ao carregar estatísticas');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Calculate enhanced statistics from essays data
   */
  const calculateEnhancedStats = useCallback(essays => {
    if (!essays || essays.length === 0) return null;

    const basicStats = calculateEssayStats(essays);

    // Additional calculations
    const competencyScores = essays.reduce((acc, essay) => {
      if (essay.competency_scores) {
        Object.keys(essay.competency_scores).forEach(comp => {
          if (!acc[comp]) acc[comp] = [];
          acc[comp].push(essay.competency_scores[comp]);
        });
      }
      return acc;
    }, {});

    const competencyAverages = Object.keys(competencyScores).reduce(
      (acc, comp) => {
        const scores = competencyScores[comp];
        acc[comp] =
          scores.reduce((sum, score) => sum + score, 0) / scores.length;
        return acc;
      },
      {}
    );

    // Progress over time
    const progressData = essays
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
      .map((essay, index) => ({
        date: essay.created_at,
        score: essay.score || 0,
        essayNumber: index + 1,
      }));

    return {
      ...basicStats,
      competencyAverages,
      progressData,
      totalWords: essays.reduce(
        (sum, essay) => sum + (essay.word_count || 0),
        0
      ),
      averageWords:
        essays.length > 0
          ? essays.reduce((sum, essay) => sum + (essay.word_count || 0), 0) /
            essays.length
          : 0,
    };
  }, []);

  // Load stats on mount
  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return {
    stats,
    loading,
    error,
    loadStats,
    calculateEnhancedStats,
    refetch: loadStats,
  };
};

export default useStats;
