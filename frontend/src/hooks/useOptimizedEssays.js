// Optimized Essays Hook with enhanced memoization
import { useState, useEffect, useCallback, useMemo } from 'react';
import { calculateEssayStats } from '../utils';
import { useEssays } from './useEssays';
import { 
  useStableCallback, 
  useMemoizedSelector,
  useShallowMemo 
} from './useMemoizedCallback';
import { useOptimizedSet } from './useOptimizedState';

/**
 * Enhanced Optimized Essays Hook
 * Adiciona memoização avançada e otimizações de performance
 */
export const useOptimizedEssays = () => {
  const { essays, loading, error, submitEssay, deleteEssay, refetch } = useEssays();
  
  // Use optimized Set for expanded essays
  const [expandedEssays, expandedOperations] = useOptimizedSet();
  const [deletingEssays, deletingOperations] = useOptimizedSet();

  // Memoized essay statistics with shallow comparison
  const essayStats = useShallowMemo(() => {
    return calculateEssayStats(essays);
  }, [essays]);

  // Memoized sorted essays
  const sortedEssays = useMemoizedSelector(
    essays,
    (essays) => [...essays].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    ),
    [essays]
  );

  // Memoized essay categories
  const essayCategories = useMemo(() => {
    const categories = {
      recent: [],
      highScore: [],
      needsImprovement: [],
      byTheme: new Map(),
    };

    const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    sortedEssays.forEach(essay => {
      // Recent essays (last 7 days)
      if (new Date(essay.created_at) > cutoffDate) {
        categories.recent.push(essay);
      }

      // High score essays (800+)
      if (essay.score >= 800) {
        categories.highScore.push(essay);
      }

      // Essays needing improvement (<600)
      if (essay.score < 600) {
        categories.needsImprovement.push(essay);
      }

      // Group by theme
      const theme = essay.theme_title || 'Sem tema';
      if (!categories.byTheme.has(theme)) {
        categories.byTheme.set(theme, []);
      }
      categories.byTheme.get(theme).push(essay);
    });

    return categories;
  }, [sortedEssays]);

  // Memoized performance metrics
  const performanceMetrics = useMemo(() => {
    if (sortedEssays.length === 0) return null;

    const scores = sortedEssays.map(essay => essay.score).filter(Boolean);
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const bestScore = Math.max(...scores);
    const worstScore = Math.min(...scores);
    const improvementTrend = scores.length > 1 ? scores[0] - scores[scores.length - 1] : 0;

    return {
      averageScore: Math.round(averageScore),
      bestScore,
      worstScore,
      improvementTrend,
      totalEssays: sortedEssays.length,
      scoredEssays: scores.length,
    };
  }, [sortedEssays]);

  // Stable callback for toggling essay expansion
  const toggleEssayExpansion = useStableCallback((essayId) => {
    expandedOperations.toggle(essayId);
  });

  // Stable callback for optimized delete with loading state
  const handleDeleteEssay = useStableCallback(async (essayId) => {
    deletingOperations.add(essayId);

    try {
      const result = await deleteEssay(essayId);
      if (result.success) {
        expandedOperations.remove(essayId);
      }
      return result;
    } finally {
      deletingOperations.remove(essayId);
    }
  });

  // Memoized check functions
  const isEssayExpanded = useCallback(
    (essayId) => expandedOperations.has(essayId),
    [expandedOperations]
  );

  const isEssayDeleting = useCallback(
    (essayId) => deletingOperations.has(essayId),
    [deletingOperations]
  );

  // Optimized filtering functions
  const getEssaysByScoreRange = useCallback(
    (minScore, maxScore) => {
      return sortedEssays.filter(
        essay => essay.score >= minScore && essay.score <= maxScore
      );
    },
    [sortedEssays]
  );

  const getRecentEssays = useCallback(
    (days = 7) => {
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      return sortedEssays.filter(
        essay => new Date(essay.created_at) > cutoffDate
      );
    },
    [sortedEssays]
  );

  const getEssaysByTheme = useCallback(
    (theme) => {
      return sortedEssays.filter(essay => essay.theme_title === theme);
    },
    [sortedEssays]
  );

  const searchEssays = useCallback(
    (query) => {
      const lowercaseQuery = query.toLowerCase();
      return sortedEssays.filter(essay => 
        essay.theme_title?.toLowerCase().includes(lowercaseQuery) ||
        essay.content?.toLowerCase().includes(lowercaseQuery)
      );
    },
    [sortedEssays]
  );

  // Memoized pagination helper
  const getPaginatedEssays = useCallback(
    (page = 1, pageSize = 10) => {
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      
      return {
        essays: sortedEssays.slice(startIndex, endIndex),
        totalPages: Math.ceil(sortedEssays.length / pageSize),
        currentPage: page,
        hasNextPage: endIndex < sortedEssays.length,
        hasPreviousPage: page > 1,
      };
    },
    [sortedEssays]
  );

  // Stable callback for bulk operations
  const bulkOperations = useStableCallback({
    expandAll: () => {
      sortedEssays.forEach(essay => expandedOperations.add(essay.id));
    },
    collapseAll: () => {
      expandedOperations.clear();
    },
    deleteSelected: async (essayIds) => {
      const results = await Promise.allSettled(
        essayIds.map(id => handleDeleteEssay(id))
      );
      return results;
    },
  });

  return {
    // Original data
    essays: sortedEssays,
    loading,
    error,

    // Original functions
    submitEssay,
    refetch,

    // Enhanced data
    essayStats,
    essayCategories,
    performanceMetrics,

    // Enhanced functions
    deleteEssay: handleDeleteEssay,
    toggleEssayExpansion,
    isEssayExpanded,
    isEssayDeleting,
    getEssaysByScoreRange,
    getRecentEssays,
    getEssaysByTheme,
    searchEssays,
    getPaginatedEssays,
    bulkOperations,

    // State
    expandedEssays,
    deletingEssays,

    // Computed values
    hasEssays: sortedEssays.length > 0,
    expandedCount: expandedEssays.size,
    deletingCount: deletingEssays.size,
  };
};

export default useOptimizedEssays;
