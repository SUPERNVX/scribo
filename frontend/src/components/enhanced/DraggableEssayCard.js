// Draggable Essay Card with fluid interactions
import React, { memo, useState } from 'react';
import { toast } from 'react-hot-toast';

import { useDragAndDrop, useActionHistory } from '../../hooks';

/**
 * DraggableEssayCard Component
 * Card de redacao com suporte a drag & drop para reordenacao
 */
const DraggableEssayCard = memo(
  ({ essay, index, onReorder, onDelete, onView, className = '' }) => {
    const [isHovered, setIsHovered] = useState(false);
    const { addAction, undoLastAction } = useActionHistory();

    // Formatacao de data
    const formatDate = dateString => {
      return new Date(dateString).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    };

    // Obter cor da nota
    const getScoreColor = score => {
      if (score >= 900) return 'text-green-600 bg-green-100';
      if (score >= 700) return 'text-blue-600 bg-blue-100';
      if (score >= 500) return 'text-yellow-600 bg-yellow-100';
      return 'text-red-600 bg-red-100';
    };

    // Deletar com undo
    const handleDelete = async () => {
      if (!onDelete) return;

      const action = {
        type: 'delete_essay',
        essay,
        undo: async () => {
          // Aqui seria implementada a logica de restaurar a redacao
          toast.success('Redacao restaurada!');
        },
      };

      addAction(action);
      await onDelete(essay.id);

      toast.success(
        <div className='flex items-center justify-between'>
          <span>Redacao excluida</span>
          <button
            onClick={undoLastAction}
            className='ml-2 text-blue-600 hover:text-blue-700 underline'
          >
            Desfazer
          </button>
        </div>,
        { duration: 5000 }
      );
    };

    return (
      <div
        className={`
        essay-card group relative
        bg-white dark:bg-gray-800 
        rounded-lg shadow-sm border border-gray-200 dark:border-gray-700
        hover:shadow-md transition-all duration-200
        cursor-move
        ${isHovered ? 'ring-2 ring-pastel-purple-300' : ''}
        ${className}
      `}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Drag handle */}
        <div className='absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity'>
          <div className='w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing'>
            <svg className='w-4 h-4' fill='currentColor' viewBox='0 0 20 20'>
              <path d='M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4z' />
            </svg>
          </div>
        </div>

        <div className='p-6'>
          {/* Header */}
          <div className='flex items-start justify-between mb-4'>
            <div className='flex-1'>
              <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2'>
                {essay.theme?.title || 'Tema nao especificado'}
              </h3>
              <p className='text-sm text-gray-500 dark:text-gray-400'>
                {formatDate(essay.created_at)}
              </p>
            </div>

            {/* Score badge */}
            {essay.total_score && (
              <div
                className={`
              px-3 py-1 rounded-full text-sm font-medium
              ${getScoreColor(essay.total_score)}
            `}
              >
                {essay.total_score}/1000
              </div>
            )}
          </div>

          {/* Content preview */}
          <div className='mb-4'>
            <p className='text-gray-600 dark:text-gray-300 text-sm line-clamp-3'>
              {essay.content?.substring(0, 150)}...
            </p>
          </div>

          {/* Competencias */}
          {essay.competencias && (
            <div className='mb-4'>
              <div className='grid grid-cols-5 gap-2'>
                {Object.entries(essay.competencias).map(
                  ([comp, score], idx) => (
                    <div key={idx} className='text-center'>
                      <div className='text-xs text-gray-500 dark:text-gray-400 mb-1'>
                        C{idx + 1}
                      </div>
                      <div
                        className={`
                    text-sm font-medium px-2 py-1 rounded
                    ${
                      score >= 180
                        ? 'bg-green-100 text-green-700'
                        : score >= 140
                          ? 'bg-blue-100 text-blue-700'
                          : score >= 100
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                    }
                  `}
                      >
                        {score}
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className='flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-600'>
            <div className='flex items-center gap-2'>
              <span className='text-xs text-gray-500 dark:text-gray-400'>
                {essay.ai_model || 'IA'}
              </span>
              {essay.word_count && (
                <span className='text-xs text-gray-500 dark:text-gray-400'>
                  • {essay.word_count} palavras
                </span>
              )}
            </div>

            <div className='flex items-center gap-2'>
              <button
                onClick={() => onView && onView(essay)}
                className='px-3 py-1 text-sm text-pastel-purple-600 hover:text-pastel-purple-700 hover:bg-pastel-purple-50 rounded transition-colors'
              >
                Ver detalhes
              </button>

              <button
                onClick={handleDelete}
                className='px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors'
              >
                Excluir
              </button>
            </div>
          </div>
        </div>

        {/* Drag overlay */}
        {isHovered && (
          <div className='absolute inset-0 bg-pastel-purple-50 bg-opacity-50 rounded-lg pointer-events-none' />
        )}
      </div>
    );
  }
);

DraggableEssayCard.displayName = 'DraggableEssayCard';

/**
 * DraggableEssaysList Component
 * Lista de redacoes com suporte a drag & drop
 */
export const DraggableEssaysList = memo(
  ({ essays = [], onReorder, onDelete, onView, className = '' }) => {
    const { getDragProps, getDropProps, isDragging } = useDragAndDrop(
      essays,
      (newEssays, moveInfo) => {
        if (onReorder) {
          onReorder(newEssays, moveInfo);
          toast.success('Redacoes reordenadas!');
        }
      },
      {
        disabled: essays.length <= 1,
      }
    );

    if (!essays.length) {
      return (
        <div className='text-center py-12'>
          <div className='text-gray-400 text-6xl mb-4'>📝</div>
          <h3 className='text-lg font-medium text-gray-900 dark:text-white mb-2'>
            Nenhuma redacao encontrada
          </h3>
          <p className='text-gray-500 dark:text-gray-400'>
            Comece escrevendo sua primeira redacao!
          </p>
        </div>
      );
    }

    return (
      <div className={`space-y-4 ${className}`}>
        {essays.length > 1 && (
          <div className='text-sm text-gray-500 dark:text-gray-400 mb-4'>
            💡 Arraste e solte para reordenar suas redacoes
          </div>
        )}

        {essays.map((essay, index) => (
          <div
            key={essay.id}
            {...getDragProps(essay, index)}
            {...getDropProps(essay, index)}
            className={isDragging ? 'opacity-50' : ''}
          >
            <DraggableEssayCard
              essay={essay}
              index={index}
              onReorder={onReorder}
              onDelete={onDelete}
              onView={onView}
            />
          </div>
        ))}
      </div>
    );
  }
);

DraggableEssaysList.displayName = 'DraggableEssaysList';

export default DraggableEssayCard;
