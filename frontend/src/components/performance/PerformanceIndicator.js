// Performance Indicator Component
import React, { memo, useState, useEffect } from 'react';

import { usePerformance } from './PerformanceProvider';

/**
 * PerformanceIndicator Component
 * Mostra indicadores visuais de performance em tempo real
 */
const PerformanceIndicator = memo(
  ({ position = 'bottom-right', showDetails = false, className = '' }) => {
    const performance = usePerformance();
    const [isVisible, setIsVisible] = useState(false);
    const [showTooltip, setShowTooltip] = useState(false);

    // Mostrar indicador apenas quando há atividade
    useEffect(() => {
      setIsVisible(performance.isOptimizing);
    }, [performance.isOptimizing]);

    const positionClasses = {
      'top-left': 'top-4 left-4',
      'top-right': 'top-4 right-4',
      'bottom-left': 'bottom-4 left-4',
      'bottom-right': 'bottom-4 right-4',
    };

    const report = performance.getPerformanceReport();

    if (!isVisible && !showDetails) return null;

    return (
      <div
        className={`
        fixed ${positionClasses[position]} z-50
        ${isVisible ? 'animate-in fade-in-0 slide-in-from-bottom-2' : ''}
        ${className}
      `}
      >
        {/* Indicador compacto */}
        {!showDetails && (
          <div
            className='
            bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700
            rounded-full p-2 shadow-lg cursor-pointer
            hover:shadow-xl transition-all duration-200
          '
            onClick={() => setShowTooltip(!showTooltip)}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            {/* Spinner animado */}
            <div className='w-4 h-4 relative'>
              <div className='absolute inset-0 border-2 border-gray-200 rounded-full'></div>
              <div className='absolute inset-0 border-2 border-pastel-purple-500 rounded-full border-t-transparent animate-spin'></div>
            </div>

            {/* Tooltip com detalhes */}
            {showTooltip && (
              <div
                className='
              absolute bottom-full right-0 mb-2 p-3 min-w-[200px]
              bg-gray-900 text-white text-xs rounded-lg shadow-xl
              animate-in fade-in-0 slide-in-from-bottom-1
            '
              >
                <div className='space-y-1'>
                  <div className='flex justify-between'>
                    <span>Cache hits:</span>
                    <span className='text-green-400'>
                      {report.prefetchHits}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span>Optimistic updates:</span>
                    <span className='text-blue-400'>
                      {report.optimisticUpdates}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span>Background syncs:</span>
                    <span className='text-yellow-400'>
                      {report.backgroundSyncs}
                    </span>
                  </div>
                  <div className='flex justify-between'>
                    <span>Cache size:</span>
                    <span className='text-purple-400'>{report.cacheSize}</span>
                  </div>
                  {report.syncQueueLength > 0 && (
                    <div className='flex justify-between'>
                      <span>Sync queue:</span>
                      <span className='text-orange-400'>
                        {report.syncQueueLength}
                      </span>
                    </div>
                  )}
                </div>

                {/* Seta do tooltip */}
                <div className='absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900'></div>
              </div>
            )}
          </div>
        )}

        {/* Painel detalhado */}
        {showDetails && (
          <div
            className='
          bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700
          rounded-lg p-4 shadow-xl min-w-[300px]
        '
          >
            <h3 className='text-sm font-semibold text-gray-900 dark:text-white mb-3'>
              Performance Monitor
            </h3>

            {/* Métricas principais */}
            <div className='space-y-3'>
              <div className='flex items-center justify-between'>
                <span className='text-sm text-gray-600 dark:text-gray-400'>
                  Cache Hit Rate
                </span>
                <div className='flex items-center gap-2'>
                  <div className='w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden'>
                    <div
                      className='h-full bg-green-500 transition-all duration-300'
                      style={{ width: `${report.cacheHitRate}%` }}
                    />
                  </div>
                  <span className='text-xs text-gray-500'>
                    {Math.round(report.cacheHitRate)}%
                  </span>
                </div>
              </div>

              <div className='grid grid-cols-2 gap-3 text-xs'>
                <div className='bg-gray-50 dark:bg-gray-700 p-2 rounded'>
                  <div className='text-gray-500 dark:text-gray-400'>
                    Optimistic
                  </div>
                  <div className='font-semibold text-blue-600'>
                    {report.optimisticUpdates}
                  </div>
                </div>
                <div className='bg-gray-50 dark:bg-gray-700 p-2 rounded'>
                  <div className='text-gray-500 dark:text-gray-400'>
                    Prefetch
                  </div>
                  <div className='font-semibold text-green-600'>
                    {report.prefetchHits}
                  </div>
                </div>
                <div className='bg-gray-50 dark:bg-gray-700 p-2 rounded'>
                  <div className='text-gray-500 dark:text-gray-400'>Sync</div>
                  <div className='font-semibold text-yellow-600'>
                    {report.backgroundSyncs}
                  </div>
                </div>
                <div className='bg-gray-50 dark:bg-gray-700 p-2 rounded'>
                  <div className='text-gray-500 dark:text-gray-400'>Cache</div>
                  <div className='font-semibold text-purple-600'>
                    {report.cacheSize}
                  </div>
                </div>
              </div>

              {/* Status atual */}
              <div className='pt-2 border-t border-gray-200 dark:border-gray-600'>
                <div className='flex items-center gap-2'>
                  <div
                    className={`w-2 h-2 rounded-full ${
                      report.isOptimizing
                        ? 'bg-green-500 animate-pulse'
                        : 'bg-gray-400'
                    }`}
                  />
                  <span className='text-xs text-gray-600 dark:text-gray-400'>
                    {report.isOptimizing ? 'Optimizing...' : 'Idle'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
);

PerformanceIndicator.displayName = 'PerformanceIndicator';

/**
 * PerformanceStats Component
 * Estatísticas detalhadas de performance
 */
export const PerformanceStats = memo(({ className = '' }) => {
  const performance = usePerformance();
  const [history, setHistory] = useState([]);

  // Coletar histórico de métricas
  useEffect(() => {
    const interval = setInterval(() => {
      const report = performance.getPerformanceReport();
      setHistory(prev => {
        const newHistory = [
          ...prev,
          {
            timestamp: Date.now(),
            ...report,
          },
        ].slice(-20); // Manter apenas últimos 20 pontos
        return newHistory;
      });
    }, 5000); // A cada 5 segundos

    return () => clearInterval(interval);
  }, [performance]);

  const latestReport = performance.getPerformanceReport();

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 ${className}`}
    >
      <h2 className='text-lg font-semibold text-gray-900 dark:text-white mb-4'>
        Performance Analytics
      </h2>

      {/* Métricas em tempo real */}
      <div className='grid grid-cols-2 md:grid-cols-4 gap-4 mb-6'>
        <div className='text-center'>
          <div className='text-2xl font-bold text-blue-600'>
            {latestReport.optimisticUpdates}
          </div>
          <div className='text-sm text-gray-500'>Optimistic Updates</div>
        </div>
        <div className='text-center'>
          <div className='text-2xl font-bold text-green-600'>
            {latestReport.prefetchHits}
          </div>
          <div className='text-sm text-gray-500'>Cache Hits</div>
        </div>
        <div className='text-center'>
          <div className='text-2xl font-bold text-yellow-600'>
            {latestReport.backgroundSyncs}
          </div>
          <div className='text-sm text-gray-500'>Background Syncs</div>
        </div>
        <div className='text-center'>
          <div className='text-2xl font-bold text-purple-600'>
            {Math.round(latestReport.cacheHitRate)}%
          </div>
          <div className='text-sm text-gray-500'>Cache Hit Rate</div>
        </div>
      </div>

      {/* Gráfico simples de histórico */}
      {history.length > 1 && (
        <div className='border-t border-gray-200 dark:border-gray-600 pt-4'>
          <h3 className='text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
            Performance Trend (Last 5 minutes)
          </h3>
          <div className='h-20 flex items-end gap-1'>
            {history.map((point, index) => (
              <div
                key={index}
                className='flex-1 bg-pastel-purple-200 dark:bg-pastel-purple-800 rounded-t'
                style={{
                  height: `${Math.max(4, (point.cacheHitRate / 100) * 80)}px`,
                }}
                title={`Cache Hit Rate: ${Math.round(point.cacheHitRate)}%`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

PerformanceStats.displayName = 'PerformanceStats';

export default PerformanceIndicator;
