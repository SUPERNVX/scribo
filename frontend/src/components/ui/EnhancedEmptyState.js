// Enhanced Empty State Component - Micro-UX improvements
import React, { memo, useState } from 'react';

import { SmartIcon } from '../ModernIcons';

import Button from './Button';
import MicroAnimations from './MicroAnimations';

/**
 * EnhancedEmptyState Component
 * Estado vazio mais engajante com animações e interatividade
 */
const EnhancedEmptyState = memo(
  ({
    title = 'Nenhum item encontrado',
    description = 'Não há dados para exibir no momento.',
    icon = 'file-text',
    actionLabel,
    onAction,
    suggestions = [],
    illustration,
    animated = true,
    size = 'md',
    className = '',
  }) => {
    const [isHovered, setIsHovered] = useState(false);

    const sizeClasses = {
      sm: {
        container: 'py-6',
        icon: 32,
        title: 'text-base',
        description: 'text-sm',
      },
      md: {
        container: 'py-8',
        icon: 48,
        title: 'text-lg',
        description: 'text-base',
      },
      lg: {
        container: 'py-12',
        icon: 64,
        title: 'text-xl',
        description: 'text-lg',
      },
    };

    const currentSize = sizeClasses[size];

    return (
      <div
        className={`text-center ${currentSize.container} ${className}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Ilustração ou Ícone */}
        <div className='mb-6'>
          {illustration ? (
            <div className='flex justify-center'>{illustration}</div>
          ) : (
            <div
              className={`
              text-gray-400 mb-4 transition-all duration-300
              ${animated && isHovered ? 'transform scale-110' : ''}
            `}
            >
              <SmartIcon type={icon} size={currentSize.icon} />
            </div>
          )}
        </div>

        {/* Título */}
        <h3
          className={`font-medium text-gray-900 dark:text-white mb-2 ${currentSize.title}`}
        >
          {title}
        </h3>

        {/* Descrição */}
        <p
          className={`text-gray-600 dark:text-gray-300 mb-6 max-w-md mx-auto ${currentSize.description}`}
        >
          {description}
        </p>

        {/* Sugestões */}
        {suggestions.length > 0 && (
          <div className='mb-6'>
            <p className='text-sm text-gray-500 dark:text-gray-400 mb-3'>
              Sugestões:
            </p>
            <div className='flex flex-wrap justify-center gap-2'>
              {suggestions.map((suggestion, index) => (
                <span
                  key={index}
                  className='
                  px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 
                  text-gray-700 dark:text-gray-300 rounded-full
                  hover:bg-gray-200 dark:hover:bg-gray-600
                  transition-colors duration-200 cursor-default
                '
                >
                  💡 {suggestion}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Ação Principal */}
        {actionLabel && onAction && (
          <MicroAnimations type='bounce' trigger={isHovered}>
            <Button
              variant='primary'
              onClick={onAction}
              className='inline-flex items-center'
            >
              <SmartIcon type='plus' size={16} className='mr-2' />
              {actionLabel}
            </Button>
          </MicroAnimations>
        )}
      </div>
    );
  }
);

EnhancedEmptyState.displayName = 'EnhancedEmptyState';

/**
 * EmptyStateVariants - Variações específicas
 */
export const EmptyEssays = memo(({ onCreateEssay }) => (
  <EnhancedEmptyState
    title='Nenhuma redação encontrada'
    description='Comece sua jornada de escrita criando sua primeira redação!'
    icon='edit'
    actionLabel='Escrever primeira redação'
    onAction={onCreateEssay}
    suggestions={[
      'Escolha um tema do ENEM',
      'Pratique a estrutura dissertativa',
      'Use dados e exemplos',
    ]}
    illustration={<div className='text-6xl mb-4'>✍️</div>}
  />
));

EmptyEssays.displayName = 'EmptyEssays';

export const EmptySearch = memo(({ searchTerm, onClearSearch }) => (
  <EnhancedEmptyState
    title={`Nenhum resultado para "${searchTerm}"`}
    description='Tente usar termos diferentes ou verifique a ortografia.'
    icon='search'
    actionLabel='Limpar busca'
    onAction={onClearSearch}
    suggestions={[
      'Use palavras-chave diferentes',
      'Verifique a ortografia',
      'Tente termos mais gerais',
    ]}
    size='sm'
  />
));

EmptySearch.displayName = 'EmptySearch';

export const EmptyDashboard = memo(({ onGetStarted }) => (
  <EnhancedEmptyState
    title='Bem-vindo ao Scribo!'
    description='Sua jornada de preparação para o ENEM começa aqui. Vamos escrever sua primeira redação?'
    icon='home'
    actionLabel='Começar agora'
    onAction={onGetStarted}
    suggestions={[
      'Explore os temas disponíveis',
      'Conheça os critérios de avaliação',
      'Pratique regularmente',
    ]}
    illustration={<div className='text-6xl mb-4'>🎯</div>}
    size='lg'
  />
));

EmptyDashboard.displayName = 'EmptyDashboard';

export const EmptyFavorites = memo(() => (
  <EnhancedEmptyState
    title='Nenhuma redação favoritada'
    description='Marque suas melhores redações como favoritas para acesso rápido.'
    icon='heart'
    suggestions={[
      'Use o ícone ❤️ nas redações',
      'Organize suas melhores produções',
      'Acesso rápido aos favoritos',
    ]}
    size='sm'
  />
));

EmptyFavorites.displayName = 'EmptyFavorites';

export default EnhancedEmptyState;
