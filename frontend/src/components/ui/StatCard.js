// Stat Card Component - mantendo estilos existentes do dashboard
import React, { memo } from 'react';

import { SmartIcon } from '../ModernIcons';

import Card from './Card';

/**
 * StatCard Component
 * Mantém exatamente o estilo das estatísticas do dashboard
 */
const StatCard = memo(
  ({
    title,
    value,
    icon,
    iconColor = '#a855f7',
    trend,
    trendDirection,
    className = '',
  }) => {
    const getTrendColor = () => {
      if (!trendDirection) return 'text-gray-500';
      return trendDirection === 'up' ? 'text-green-500' : 'text-red-500';
    };

    const getTrendIcon = () => {
      if (!trendDirection) return null;
      return trendDirection === 'up' ? 'trending-up' : 'trending-down';
    };

    return (
      <Card className={className}>
        <div className='flex items-center justify-between'>
          <div>
            <p className='text-sm font-medium text-gray-600 dark:text-gray-300'>
              {title}
            </p>
            <p className='text-2xl font-bold text-gray-900 dark:text-white'>
              {value}
            </p>
            {trend && (
              <div
                className={`flex items-center gap-1 text-sm ${getTrendColor()}`}
              >
                {getTrendIcon() && (
                  <SmartIcon type={getTrendIcon()} size={14} />
                )}
                {trend}
              </div>
            )}
          </div>
          <div style={{ color: iconColor }}>
            <SmartIcon type={icon} size={24} />
          </div>
        </div>
      </Card>
    );
  }
);

StatCard.displayName = 'StatCard';

export default StatCard;
