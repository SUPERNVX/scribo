// Enhanced Progress Indicators - Micro-UX improvements
import React, { memo, useState, useEffect } from 'react';

import ProgressBar from './ProgressBar';

/**
 * StepProgress Component
 * Indicador de progresso por etapas
 */
const StepProgress = memo(
  ({ steps = [], currentStep = 0, completed = false, className = '' }) => {
    return (
      <div className={`w-full ${className}`}>
        <div className='flex items-center justify-between mb-4'>
          {steps.map((step, index) => {
            const isActive = index === currentStep;
            const isCompleted = index < currentStep || completed;
            const isLast = index === steps.length - 1;

            return (
              <div key={index} className='flex items-center flex-1'>
                {/* Step Circle */}
                <div className='flex items-center'>
                  <div
                    className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                    transition-all duration-300
                    ${
                      isCompleted
                        ? 'bg-green-500 text-white'
                        : isActive
                          ? 'bg-pastel-purple-500 text-white ring-4 ring-pastel-purple-200'
                          : 'bg-gray-200 text-gray-500'
                    }
                  `}
                  >
                    {isCompleted ? '✓' : index + 1}
                  </div>

                  {/* Step Label */}
                  <div className='ml-3'>
                    <p
                      className={`text-sm font-medium ${isActive ? 'text-pastel-purple-600' : 'text-gray-500'}`}
                    >
                      {step.title}
                    </p>
                    {step.description && (
                      <p className='text-xs text-gray-400'>
                        {step.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Connector Line */}
                {!isLast && (
                  <div className='flex-1 mx-4'>
                    <div
                      className={`h-0.5 ${isCompleted ? 'bg-green-500' : 'bg-gray-200'} transition-colors duration-300`}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }
);

StepProgress.displayName = 'StepProgress';

/**
 * CircularProgress Component
 * Progresso circular animado
 */
export const CircularProgress = memo(
  ({
    progress = 0,
    size = 120,
    strokeWidth = 8,
    color = '#8B5CF6',
    backgroundColor = '#E5E7EB',
    showPercentage = true,
    animated = true,
    className = '',
  }) => {
    const [animatedProgress, setAnimatedProgress] = useState(0);

    useEffect(() => {
      if (animated) {
        const timer = setTimeout(() => {
          setAnimatedProgress(progress);
        }, 100);
        return () => clearTimeout(timer);
      } else {
        setAnimatedProgress(progress);
      }
    }, [progress, animated]);

    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (animatedProgress / 100) * circumference;

    return (
      <div
        className={`relative inline-flex items-center justify-center ${className}`}
      >
        <svg width={size} height={size} className='transform -rotate-90'>
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={backgroundColor}
            strokeWidth={strokeWidth}
            fill='transparent'
          />

          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill='transparent'
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap='round'
            className='transition-all duration-1000 ease-out'
          />
        </svg>

        {/* Percentage text */}
        {showPercentage && (
          <div className='absolute inset-0 flex items-center justify-center'>
            <span className='text-lg font-semibold text-gray-700 dark:text-gray-300'>
              {Math.round(animatedProgress)}%
            </span>
          </div>
        )}
      </div>
    );
  }
);

CircularProgress.displayName = 'CircularProgress';

/**
 * EssayProgress Component
 * Progresso específico para redações
 */
export const EssayProgress = memo(
  ({ wordCount = 0, targetWords = 400, competencias = {}, className = '' }) => {
    const wordProgress = Math.min((wordCount / targetWords) * 100, 100);
    const competenciasArray = Object.values(competencias);
    const avgCompetencia =
      competenciasArray.length > 0
        ? competenciasArray.reduce((sum, score) => sum + score, 0) /
          competenciasArray.length
        : 0;
    const competenciaProgress = (avgCompetencia / 200) * 100;

    const getWordStatus = () => {
      if (wordCount < targetWords * 0.5)
        return { color: 'red', message: 'Continue escrevendo' };
      if (wordCount < targetWords * 0.8)
        return { color: 'yellow', message: 'Bom progresso' };
      if (wordCount <= targetWords * 1.2)
        return { color: 'green', message: 'Tamanho ideal' };
      return { color: 'orange', message: 'Muito extenso' };
    };

    const wordStatus = getWordStatus();

    return (
      <div className={`space-y-4 ${className}`}>
        {/* Progresso de palavras */}
        <div>
          <div className='flex justify-between items-center mb-2'>
            <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
              Extensão do texto
            </span>
            <span
              className={`text-sm font-medium text-${wordStatus.color}-600`}
            >
              {wordCount}/{targetWords} palavras
            </span>
          </div>
          <ProgressBar
            progress={wordProgress}
            color={wordStatus.color}
            showPercentage={false}
          />
          <p className={`text-xs text-${wordStatus.color}-600 mt-1`}>
            {wordStatus.message}
          </p>
        </div>

        {/* Progresso das competências */}
        {competenciasArray.length > 0 && (
          <div>
            <div className='flex justify-between items-center mb-2'>
              <span className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                Média das competências
              </span>
              <span className='text-sm font-medium text-gray-600'>
                {avgCompetencia.toFixed(0)}/200
              </span>
            </div>
            <ProgressBar
              progress={competenciaProgress}
              color='purple'
              showPercentage={false}
            />

            {/* Competências individuais */}
            <div className='grid grid-cols-5 gap-2 mt-3'>
              {Object.entries(competencias).map(([comp, score], index) => (
                <div key={comp} className='text-center'>
                  <div className='text-xs text-gray-500 mb-1'>C{index + 1}</div>
                  <div
                    className={`
                  text-sm font-medium px-2 py-1 rounded
                  ${
                    score >= 160
                      ? 'bg-green-100 text-green-700'
                      : score >= 120
                        ? 'bg-blue-100 text-blue-700'
                        : score >= 80
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                  }
                `}
                  >
                    {score}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }
);

EssayProgress.displayName = 'EssayProgress';

/**
 * LoadingProgress Component
 * Progresso para operações longas
 */
export const LoadingProgress = memo(
  ({
    steps = [],
    currentStep = 0,
    message = 'Processando...',
    showSteps = true,
    className = '',
  }) => {
    const progress =
      steps.length > 0 ? ((currentStep + 1) / steps.length) * 100 : 0;

    return (
      <div className={`text-center ${className}`}>
        <div className='mb-4'>
          <CircularProgress
            progress={progress}
            size={80}
            strokeWidth={6}
            animated={true}
          />
        </div>

        <h3 className='text-lg font-medium text-gray-900 dark:text-white mb-2'>
          {message}
        </h3>

        {showSteps && steps.length > 0 && (
          <div className='text-sm text-gray-600 dark:text-gray-400'>
            <p className='mb-2'>
              Etapa {currentStep + 1} de {steps.length}
            </p>
            <p className='font-medium'>
              {steps[currentStep]?.title || 'Processando...'}
            </p>
            {steps[currentStep]?.description && (
              <p className='text-xs mt-1'>{steps[currentStep].description}</p>
            )}
          </div>
        )}
      </div>
    );
  }
);

LoadingProgress.displayName = 'LoadingProgress';

export default StepProgress;
