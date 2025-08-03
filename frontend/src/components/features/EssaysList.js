// Essays List Component - mantendo estilos existentes
import React, { memo, useState } from 'react';

import { useOptimizedEssays } from '../../hooks/useOptimizedEssays';
import EmptyState from '../ui/EmptyState';
import LoadingSpinner from '../ui/LoadingSpinner';
import ErrorMessage from '../ui/ErrorMessage';
import Button from '../ui/Button';
import { SmartIcon } from '../ModernIcons';

import EssayCard from './EssayCard';

/**
 * EssaysList Component
 * Mantém exatamente o layout e estilos do dashboard original
 */
const EssaysList = memo(({ onNavigateToWrite, onViewEssayDetails }) => {
  const {
    essays,
    loading,
    error,
    deleteEssay,
    toggleEssayExpansion,
    isEssayExpanded,
    isEssayDeleting,
    refetch,
  } = useOptimizedEssays();

  const [showAll, setShowAll] = useState(false);
  const displayedEssays = showAll ? essays : essays.slice(0, 5);

  const handleDeleteEssay = async essayId => {
    if (window.confirm('Tem certeza que deseja excluir esta redação?')) {
      await deleteEssay(essayId);
    }
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <div className='text-center'>
          <LoadingSpinner size='lg' className='mx-auto mb-4' />
          <p className='text-gray-600 dark:text-gray-300'>
            Carregando redações...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <ErrorMessage
        title='Erro ao carregar redações'
        message={error}
        onRetry={refetch}
      />
    );
  }

  if (essays.length === 0) {
    return (
      <EmptyState
        title='Nenhuma redação encontrada'
        description='Comece escrevendo sua primeira redação!'
        icon='file-text'
        actionLabel='Escrever Redação'
        onAction={onNavigateToWrite}
      />
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <h2 className='text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2'>
          <SmartIcon type='file-text' size={20} />
          Minhas Redações ({essays.length})
        </h2>

        <div className='flex items-center gap-2'>
          <Button variant='primary' size='sm' onClick={onNavigateToWrite}>
            <SmartIcon type='pen' size={16} className='mr-2' />
            Nova Redação
          </Button>
        </div>
      </div>

      {/* Essays Grid */}
      <div className='space-y-4'>
        {displayedEssays.map(essay => (
          <EssayCard
            key={essay.id}
            essay={essay}
            isExpanded={isEssayExpanded(essay.id)}
            isDeleting={isEssayDeleting(essay.id)}
            onToggleExpansion={toggleEssayExpansion}
            onDelete={handleDeleteEssay}
            onViewDetails={onViewEssayDetails}
          />
        ))}
      </div>

      {/* Show More/Less Button */}
      {essays.length > 5 && (
        <div className='text-center pt-4'>
          <Button variant='secondary' onClick={() => setShowAll(!showAll)}>
            {showAll ? (
              <>
                <SmartIcon type='chevron-up' size={16} className='mr-2' />
                Mostrar Menos
              </>
            ) : (
              <>
                <SmartIcon type='chevron-down' size={16} className='mr-2' />
                Mostrar Mais ({essays.length - 5} redações)
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
});

EssaysList.displayName = 'EssaysList';

export default EssaysList;
