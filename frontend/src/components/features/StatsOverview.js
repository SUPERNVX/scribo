// Stats Overview Component - mantendo estilos existentes
import React, { memo } from 'react';

import { useStats } from '../../hooks/useStats';
import { useOptimizedEssays } from '../../hooks/useOptimizedEssays';
import StatCard from '../ui/StatCard';
import LoadingSpinner from '../ui/LoadingSpinner';
import ErrorMessage from '../ui/ErrorMessage';

/**
 * StatsOverview Component
 * Mantém exatamente o layout das estatísticas do dashboard
 */
const StatsOverview = memo(() => {
  const { stats, loading: statsLoading, error: statsError } = useStats();
  const { essayStats, loading: essaysLoading } = useOptimizedEssays();

  const loading = statsLoading || essaysLoading;
  const error = statsError;

  if (loading) {
    return (
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
        {[1, 2, 3].map(i => (
          <div
            key={i}
            className='bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700'
          >
            <div className='animate-pulse'>
              <div className='h-4 bg-gray-200 dark:bg-gray-600 rounded mb-2'></div>
              <div className='h-8 bg-gray-200 dark:bg-gray-600 rounded mb-2'></div>
              <div className='h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/2'></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <ErrorMessage
        title='Erro ao carregar estatísticas'
        message={error}
        showRetryButton={false}
      />
    );
  }

  // Calculate improvement trend
  const getImprovementTrend = () => {
    if (!essayStats || essayStats.improvementRate === 0) return null;

    return {
      value: `${essayStats.improvementRate > 0 ? '+' : ''}${essayStats.improvementRate.toFixed(1)}%`,
      direction: essayStats.improvementRate > 0 ? 'up' : 'down',
    };
  };

  const improvementTrend = getImprovementTrend();

  return (
    <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
      <StatCard
        title='Total de Redações'
        value={essayStats?.total || 0}
        icon='file-text'
        iconColor='#a855f7'
        trend={
          essayStats?.lastWeekCount
            ? `${essayStats.lastWeekCount} esta semana`
            : null
        }
        trendDirection={essayStats?.lastWeekCount > 0 ? 'up' : null}
      />

      <StatCard
        title='Média Geral'
        value={essayStats?.averageScore?.toFixed(1) || '0.0'}
        icon='trending-up'
        iconColor='#3b82f6'
        trend={improvementTrend?.value}
        trendDirection={improvementTrend?.direction}
      />

      <StatCard
        title='Melhor Nota'
        value={essayStats?.bestScore?.toFixed(1) || '0.0'}
        icon='award'
        iconColor='#10b981'
        trend={
          stats?.best_score > 900
            ? 'Excelente!'
            : stats?.best_score > 700
              ? 'Muito bom!'
              : null
        }
      />
    </div>
  );
});

StatsOverview.displayName = 'StatsOverview';

export default StatsOverview;
