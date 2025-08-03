// Prefetching Hook for perceived performance
import { useEffect, useCallback, useRef } from 'react';

import { useLocalStorage } from './useLocalStorage';

/**
 * usePrefetching Hook
 * Pré-carrega dados prováveis para melhorar a performance percebida
 */
export const usePrefetching = (options = {}) => {
  const {
    cacheKey = 'prefetch_cache',
    maxCacheAge = 5 * 60 * 1000, // 5 minutos
    maxCacheSize = 50,
    enabled = true,
  } = options;

  const [cache, setCache] = useLocalStorage(cacheKey, {});
  const prefetchQueue = useRef(new Set());
  const activeRequests = useRef(new Map());

  // Limpar cache expirado
  const cleanExpiredCache = useCallback(() => {
    const now = Date.now();
    const cleanedCache = {};

    Object.entries(cache).forEach(([key, item]) => {
      if (now - item.timestamp < maxCacheAge) {
        cleanedCache[key] = item;
      }
    });

    // Limitar tamanho do cache
    const entries = Object.entries(cleanedCache);
    if (entries.length > maxCacheSize) {
      const sortedEntries = entries.sort(
        (a, b) => b[1].timestamp - a[1].timestamp
      );
      const limitedEntries = sortedEntries.slice(0, maxCacheSize);
      const limitedCache = Object.fromEntries(limitedEntries);
      setCache(limitedCache);
    } else {
      setCache(cleanedCache);
    }
  }, [cache, maxCacheAge, maxCacheSize, setCache]);

  // Verificar se dados estão em cache
  const getCachedData = useCallback(
    key => {
      const item = cache[key];
      if (!item) return null;

      const now = Date.now();
      if (now - item.timestamp > maxCacheAge) {
        return null;
      }

      return item.data;
    },
    [cache, maxCacheAge]
  );

  // Armazenar dados no cache
  const setCachedData = useCallback(
    (key, data) => {
      setCache(prev => ({
        ...prev,
        [key]: {
          data,
          timestamp: Date.now(),
        },
      }));
    },
    [setCache]
  );

  // Prefetch de dados
  const prefetch = useCallback(
    async (key, fetchFn, priority = 'normal') => {
      if (!enabled) return null;

      // Verificar se já está em cache
      const cachedData = getCachedData(key);
      if (cachedData) {
        return cachedData;
      }

      // Verificar se já está sendo carregado
      if (activeRequests.current.has(key)) {
        return activeRequests.current.get(key);
      }

      // Adicionar à fila de prefetch
      prefetchQueue.current.add(key);

      try {
        const fetchPromise = fetchFn();
        activeRequests.current.set(key, fetchPromise);

        const data = await fetchPromise;
        setCachedData(key, data);

        return data;
      } catch (error) {
        console.warn(`Prefetch failed for ${key}:`, error);
        return null;
      } finally {
        prefetchQueue.current.delete(key);
        activeRequests.current.delete(key);
      }
    },
    [enabled, getCachedData, setCachedData]
  );

  // Prefetch com delay (para não interferir com operações principais)
  const prefetchLazy = useCallback(
    (key, fetchFn, delay = 1000) => {
      if (!enabled) return;

      setTimeout(() => {
        prefetch(key, fetchFn, 'low');
      }, delay);
    },
    [enabled, prefetch]
  );

  // Prefetch múltiplos itens
  const prefetchBatch = useCallback(
    async items => {
      if (!enabled) return {};

      const results = {};
      const promises = items.map(async ({ key, fetchFn }) => {
        try {
          const data = await prefetch(key, fetchFn);
          results[key] = data;
        } catch (error) {
          results[key] = null;
        }
      });

      await Promise.allSettled(promises);
      return results;
    },
    [enabled, prefetch]
  );

  // Invalidar cache
  const invalidateCache = useCallback(
    key => {
      setCache(prev => {
        const newCache = { ...prev };
        delete newCache[key];
        return newCache;
      });
    },
    [setCache]
  );

  // Limpar todo o cache
  const clearCache = useCallback(() => {
    setCache({});
  }, [setCache]);

  // Limpeza automática do cache
  useEffect(() => {
    const interval = setInterval(cleanExpiredCache, 60000); // A cada minuto
    return () => clearInterval(interval);
  }, [cleanExpiredCache]);

  return {
    prefetch,
    prefetchLazy,
    prefetchBatch,
    getCachedData,
    setCachedData,
    invalidateCache,
    clearCache,
    isPrefetching: prefetchQueue.current.size > 0,
    cacheSize: Object.keys(cache).length,
  };
};

/**
 * useEssayPrefetching Hook
 * Prefetching específico para redações
 */
export const useEssayPrefetching = apiService => {
  const prefetching = usePrefetching({
    cacheKey: 'essay_prefetch_cache',
    maxCacheAge: 10 * 60 * 1000, // 10 minutos para redações
  });

  // Prefetch de temas
  const prefetchThemes = useCallback(() => {
    return prefetching.prefetch('themes', () => apiService.getThemes());
  }, [prefetching, apiService]);

  // Prefetch de estatísticas
  const prefetchStats = useCallback(() => {
    return prefetching.prefetch('stats', () => apiService.getStats());
  }, [prefetching, apiService]);

  // Prefetch de redação específica
  const prefetchEssay = useCallback(
    essayId => {
      return prefetching.prefetch(`essay_${essayId}`, () =>
        apiService.getEssay(essayId)
      );
    },
    [prefetching, apiService]
  );

  // Prefetch de ranking
  const prefetchRanking = useCallback(() => {
    return prefetching.prefetch('ranking', () => apiService.getRanking());
  }, [prefetching, apiService]);

  // Prefetch inteligente baseado na navegação
  const prefetchForPage = useCallback(
    pageName => {
      switch (pageName) {
        case 'dashboard':
          prefetching.prefetchBatch([
            { key: 'stats', fetchFn: () => apiService.getStats() },
            {
              key: 'recent_essays',
              fetchFn: () => apiService.getRecentEssays(),
            },
          ]);
          break;

        case 'write':
          prefetchThemes();
          break;

        case 'ranking':
          prefetchRanking();
          break;

        default:
          break;
      }
    },
    [prefetching, apiService, prefetchThemes, prefetchRanking]
  );

  // Prefetch baseado em hover (para links)
  const prefetchOnHover = useCallback(
    (target, fetchFn) => {
      let timeoutId;

      const handleMouseEnter = () => {
        timeoutId = setTimeout(() => {
          prefetching.prefetchLazy(target, fetchFn, 500);
        }, 200); // Delay para evitar prefetch desnecessário
      };

      const handleMouseLeave = () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      };

      return { handleMouseEnter, handleMouseLeave };
    },
    [prefetching]
  );

  return {
    ...prefetching,
    prefetchThemes,
    prefetchStats,
    prefetchEssay,
    prefetchRanking,
    prefetchForPage,
    prefetchOnHover,
  };
};

export default usePrefetching;
