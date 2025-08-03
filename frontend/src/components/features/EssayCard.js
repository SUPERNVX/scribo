// Essay Card Component - mantendo estilos existentes
import React, { memo } from 'react';

import { SmartIcon } from '../ModernIcons';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { formatDate, truncateText, getScoreColor } from '../../utils';

/**
 * EssayCard Component
 * Mantém exatamente o estilo das redações no dashboard
 */
const EssayCard = memo(
  ({
    essay,
    isExpanded = false,
    isDeleting = false,
    onToggleExpansion,
    onDelete,
    onViewDetails,
  }) => {
    const handleToggleExpansion = () => {
      if (onToggleExpansion) {
        onToggleExpansion(essay.id);
      }
    };

    const handleDelete = () => {
      if (onDelete && !isDeleting) {
        onDelete(essay.id);
      }
    };

    const handleViewDetails = () => {
      if (onViewDetails) {
        onViewDetails(essay);
      }
    };

    return (
      <Card
        className={`transition-all duration-200 ${isDeleting ? 'opacity-50' : 'hover:shadow-lg'}`}
      >
        <div className='flex justify-between items-start mb-4'>
          <div className='flex-1'>
            <h3 className='font-semibold text-lg text-gray-900 dark:text-white mb-1'>
              {essay.theme_title || `Redação ${essay.id}`}
            </h3>
            <div className='flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300'>
              <span className='flex items-center gap-1'>
                <SmartIcon type='calendar' size={14} />
                {formatDate(essay.created_at)}
              </span>
              {essay.word_count && (
                <span className='flex items-center gap-1'>
                  <SmartIcon type='type' size={14} />
                  {essay.word_count} palavras
                </span>
              )}
              {essay.ai_model && (
                <span className='flex items-center gap-1'>
                  <SmartIcon type='brain' size={14} />
                  {essay.ai_model}
                </span>
              )}
            </div>
          </div>

          <div className='flex items-center gap-2 ml-4'>
            {essay.score && (
              <div className='text-right'>
                <div
                  className={`text-2xl font-bold ${getScoreColor(essay.score)}`}
                >
                  {essay.score.toFixed(1)}
                </div>
                <div className='text-xs text-gray-500 dark:text-gray-400'>
                  pontos
                </div>
              </div>
            )}

            <div className='flex flex-col gap-1'>
              <Button
                variant='secondary'
                size='sm'
                onClick={handleToggleExpansion}
                className='p-2'
              >
                <SmartIcon
                  type={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={16}
                />
              </Button>

              <Button
                variant='primary'
                size='sm'
                onClick={handleViewDetails}
                className='p-2'
              >
                <SmartIcon type='eye' size={16} />
              </Button>

              <Button
                variant='danger'
                size='sm'
                onClick={handleDelete}
                disabled={isDeleting}
                className='p-2'
              >
                {isDeleting ? (
                  <SmartIcon type='loader' size={16} className='animate-spin' />
                ) : (
                  <SmartIcon type='trash' size={16} />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Content Preview */}
        {essay.content && (
          <div className='mb-4'>
            <p className='text-gray-700 dark:text-gray-300 text-sm leading-relaxed'>
              {isExpanded ? essay.content : truncateText(essay.content, 200)}
            </p>
          </div>
        )}

        {/* Competency/Criteria Scores */}
        {essay.competency_scores &&
          Object.keys(essay.competency_scores).length > 0 && (
            <div className='border-t border-gray-200 dark:border-gray-600 pt-4'>
              <h4 className='text-sm font-medium text-gray-900 dark:text-white mb-2'>
                {essay.isEnem !== false ? 'Competências:' : 'Critérios:'}
              </h4>
              <div className='grid grid-cols-5 gap-2'>
                {Object.entries(essay.competency_scores).map(
                  ([comp, score]) => (
                    <div key={comp} className='text-center'>
                      <div className='text-xs text-gray-600 dark:text-gray-400 mb-1'>
                        C{comp}
                      </div>
                      <div
                        className={`text-sm font-bold ${getScoreColor(score * 200)}`}
                      >
                        {(score * 200).toFixed(0)}
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

        {/* Feedback Preview */}
        {isExpanded && essay.feedback && (
          <div className='border-t border-gray-200 dark:border-gray-600 pt-4 mt-4'>
            <h4 className='text-sm font-medium text-gray-900 dark:text-white mb-2'>
              Feedback da IA:
            </h4>
            <div className='bg-gray-50 dark:bg-gray-700 rounded-lg p-3'>
              <p className='text-sm text-gray-700 dark:text-gray-300'>
                {truncateText(essay.feedback, 300)}
              </p>
            </div>
          </div>
        )}
      </Card>
    );
  }
);

EssayCard.displayName = 'EssayCard';

export default EssayCard;
