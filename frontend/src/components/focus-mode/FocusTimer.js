// Focus Mode Timer Component
import React, { memo } from 'react';
import { Play, Pause, Clock } from 'lucide-react';

/**
 * Focus Timer Component
 * Displays session time, status, and productivity metrics
 */
const FocusTimer = memo(({ 
  timeElapsed = 0, 
  isActive = false, 
  productivity = 0,
  compact = false 
}) => {
  /**
   * Format time in MM:SS or HH:MM:SS format
   */
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  /**
   * Get productivity color based on score
   */
  const getProductivityColor = (score) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    if (score >= 40) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  /**
   * Get productivity emoji
   */
  const getProductivityEmoji = (score) => {
    if (score >= 80) return '🔥';
    if (score >= 60) return '⚡';
    if (score >= 40) return '💪';
    return '🐌';
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <div className="flex items-center gap-1">
          {isActive ? (
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          ) : (
            <div className="w-2 h-2 bg-gray-400 rounded-full" />
          )}
          <span className="font-mono">{formatTime(timeElapsed)}</span>
        </div>
        
        {productivity > 0 && (
          <div className="flex items-center gap-1">
            <span>{getProductivityEmoji(productivity)}</span>
            <span className={`text-xs ${getProductivityColor(productivity)}`}>
              {Math.round(productivity)}%
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
      {/* Timer Display */}
      <div className="flex items-center gap-2">
        <Clock size={18} className="text-gray-600 dark:text-gray-400" />
        <span className="font-mono text-lg font-semibold">
          {formatTime(timeElapsed)}
        </span>
      </div>

      {/* Status Indicator */}
      <div className="flex items-center gap-2">
        {isActive ? (
          <>
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm text-green-600 dark:text-green-400 font-medium">
              Ativo
            </span>
          </>
        ) : (
          <>
            <div className="w-3 h-3 bg-gray-400 rounded-full" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Pausado
            </span>
          </>
        )}
      </div>

      {/* Productivity Score */}
      {productivity > 0 && (
        <div className="flex items-center gap-2 px-2 py-1 bg-white dark:bg-gray-700 rounded">
          <span className="text-lg">{getProductivityEmoji(productivity)}</span>
          <div className="text-sm">
            <div className={`font-semibold ${getProductivityColor(productivity)}`}>
              {Math.round(productivity)}%
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Produtividade
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

FocusTimer.displayName = 'FocusTimer';

export default FocusTimer;