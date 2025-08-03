// Smooth Transitions Hook for perceived performance
import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * useSmoothTransitions Hook
 * Gerencia transições suaves entre estados para melhorar a performance percebida
 */
export const useSmoothTransitions = (options = {}) => {
  const {
    duration = 300,
    easing = 'ease-out',
    staggerDelay = 50,
    reducedMotion = false,
  } = options;

  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionStage, setTransitionStage] = useState('idle');
  const timeoutRefs = useRef([]);

  // Limpar timeouts
  const clearTimeouts = useCallback(() => {
    timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
    timeoutRefs.current = [];
  }, []);

  // Executar transição suave
  const executeTransition = useCallback(
    async (exitCallback, enterCallback, customDuration = duration) => {
      if (isTransitioning) return;

      setIsTransitioning(true);
      setTransitionStage('exiting');

      try {
        // Fase de saída
        if (exitCallback) {
          await exitCallback();
        }

        // Aguardar duração da transição
        await new Promise(resolve => {
          const timeoutId = setTimeout(
            resolve,
            reducedMotion ? 0 : customDuration
          );
          timeoutRefs.current.push(timeoutId);
        });

        setTransitionStage('entering');

        // Fase de entrada
        if (enterCallback) {
          await enterCallback();
        }

        // Aguardar duração da transição
        await new Promise(resolve => {
          const timeoutId = setTimeout(
            resolve,
            reducedMotion ? 0 : customDuration
          );
          timeoutRefs.current.push(timeoutId);
        });

        setTransitionStage('idle');
      } catch (error) {
        console.error('Transition error:', error);
        setTransitionStage('idle');
      } finally {
        setIsTransitioning(false);
      }
    },
    [isTransitioning, duration, reducedMotion]
  );

  // Transição com fade
  const fadeTransition = useCallback(
    async (newContent, element) => {
      if (!element) return;

      await executeTransition(
        () => {
          element.style.opacity = '0';
          element.style.transition = `opacity ${duration}ms ${easing}`;
        },
        () => {
          if (newContent) {
            element.innerHTML = newContent;
          }
          element.style.opacity = '1';
        }
      );
    },
    [executeTransition, duration, easing]
  );

  // Transição com slide
  const slideTransition = useCallback(
    async (direction = 'left', element, newContent) => {
      if (!element) return;

      const translateValue = direction === 'left' ? '-100%' : '100%';

      await executeTransition(
        () => {
          element.style.transform = `translateX(${translateValue})`;
          element.style.transition = `transform ${duration}ms ${easing}`;
        },
        () => {
          if (newContent) {
            element.innerHTML = newContent;
          }
          element.style.transform = 'translateX(0)';
        }
      );
    },
    [executeTransition, duration, easing]
  );

  // Transição escalonada para listas
  const staggeredTransition = useCallback(
    async (elements, callback) => {
      if (!elements || elements.length === 0) return;

      setIsTransitioning(true);
      setTransitionStage('staggering');

      try {
        const promises = Array.from(elements).map((element, index) => {
          return new Promise(resolve => {
            const delay = reducedMotion ? 0 : index * staggerDelay;
            const timeoutId = setTimeout(() => {
              if (callback) {
                callback(element, index);
              }
              resolve();
            }, delay);
            timeoutRefs.current.push(timeoutId);
          });
        });

        await Promise.all(promises);
        setTransitionStage('idle');
      } catch (error) {
        console.error('Staggered transition error:', error);
        setTransitionStage('idle');
      } finally {
        setIsTransitioning(false);
      }
    },
    [staggerDelay, reducedMotion]
  );

  // Cleanup
  useEffect(() => {
    return () => clearTimeouts();
  }, [clearTimeouts]);

  return {
    isTransitioning,
    transitionStage,
    executeTransition,
    fadeTransition,
    slideTransition,
    staggeredTransition,
    clearTimeouts,
  };
};

/**
 * usePageTransitions Hook
 * Transições específicas para mudanças de página
 */
export const usePageTransitions = () => {
  const [currentPage, setCurrentPage] = useState('');
  const [previousPage, setPreviousPage] = useState('');
  const [isPageTransitioning, setIsPageTransitioning] = useState(false);

  const transitions = useSmoothTransitions({
    duration: 400,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  });

  const navigateWithTransition = useCallback(
    async (newPage, transitionType = 'fade') => {
      if (isPageTransitioning) return;

      setIsPageTransitioning(true);
      setPreviousPage(currentPage);

      try {
        switch (transitionType) {
          case 'slide-left':
            await transitions.slideTransition('left');
            break;
          case 'slide-right':
            await transitions.slideTransition('right');
            break;
          case 'fade':
          default:
            await transitions.fadeTransition();
            break;
        }

        setCurrentPage(newPage);
      } finally {
        setIsPageTransitioning(false);
      }
    },
    [currentPage, isPageTransitioning, transitions]
  );

  return {
    currentPage,
    previousPage,
    isPageTransitioning,
    navigateWithTransition,
    ...transitions,
  };
};

/**
 * useListTransitions Hook
 * Transições para listas dinâmicas
 */
export const useListTransitions = () => {
  const [items, setItems] = useState([]);
  const [animatingItems, setAnimatingItems] = useState(new Set());

  const transitions = useSmoothTransitions({
    duration: 250,
    staggerDelay: 75,
  });

  const addItemWithTransition = useCallback(
    async (newItem, position = 'end') => {
      const itemWithId = {
        ...newItem,
        _transitionId: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };

      setAnimatingItems(prev => new Set(prev).add(itemWithId._transitionId));

      if (position === 'start') {
        setItems(prev => [itemWithId, ...prev]);
      } else {
        setItems(prev => [...prev, itemWithId]);
      }

      // Animar entrada
      setTimeout(() => {
        setAnimatingItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(itemWithId._transitionId);
          return newSet;
        });
      }, transitions.duration);

      return itemWithId._transitionId;
    },
    [transitions.duration]
  );

  const removeItemWithTransition = useCallback(
    async itemId => {
      setAnimatingItems(prev => new Set(prev).add(itemId));

      setTimeout(() => {
        setItems(prev =>
          prev.filter(
            item => item.id !== itemId && item._transitionId !== itemId
          )
        );
        setAnimatingItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(itemId);
          return newSet;
        });
      }, transitions.duration);
    },
    [transitions.duration]
  );

  const reorderItemsWithTransition = useCallback(
    async newOrder => {
      await transitions.staggeredTransition(
        document.querySelectorAll('[data-list-item]'),
        (element, index) => {
          element.style.transform = 'scale(0.95)';
          element.style.transition = 'transform 150ms ease-out';
          setTimeout(() => {
            element.style.transform = 'scale(1)';
          }, 75);
        }
      );

      setItems(newOrder);
    },
    [transitions]
  );

  return {
    items,
    setItems,
    animatingItems,
    addItemWithTransition,
    removeItemWithTransition,
    reorderItemsWithTransition,
    ...transitions,
  };
};

/**
 * useLoadingTransitions Hook
 * Transições para estados de carregamento
 */
export const useLoadingTransitions = () => {
  const [loadingState, setLoadingState] = useState('idle');
  const [progress, setProgress] = useState(0);

  const transitions = useSmoothTransitions({
    duration: 200,
  });

  const startLoading = useCallback(async (steps = []) => {
    setLoadingState('loading');
    setProgress(0);

    if (steps.length > 0) {
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];

        // Executar step
        if (step.action) {
          await step.action();
        }

        // Atualizar progresso
        const newProgress = ((i + 1) / steps.length) * 100;
        setProgress(newProgress);

        // Delay entre steps
        if (step.delay && i < steps.length - 1) {
          await new Promise(resolve => setTimeout(resolve, step.delay));
        }
      }
    }

    setLoadingState('completed');

    // Transição para idle após um delay
    setTimeout(() => {
      setLoadingState('idle');
      setProgress(0);
    }, 500);
  }, []);

  const setError = useCallback(() => {
    setLoadingState('error');
    setTimeout(() => {
      setLoadingState('idle');
      setProgress(0);
    }, 2000);
  }, []);

  return {
    loadingState,
    progress,
    startLoading,
    setError,
    isLoading: loadingState === 'loading',
    isCompleted: loadingState === 'completed',
    isError: loadingState === 'error',
    ...transitions,
  };
};

export default useSmoothTransitions;
