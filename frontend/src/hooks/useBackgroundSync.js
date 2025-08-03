// Background Sync Hook for perceived performance
import { useEffect, useCallback, useRef, useState } from 'react';

import { useLocalStorage } from './useLocalStorage';

/**
 * useBackgroundSync Hook
 * Sincroniza dados em background para melhorar a performance percebida
 */
export const useBackgroundSync = (options = {}) => {
  const {
    syncInterval = 30000, // 30 segundos
    maxRetries = 3,
    retryDelay = 5000,
    queueKey = 'background_sync_queue',
    enabled = true,
  } = options;

  const [syncQueue, setSyncQueue] = useLocalStorage(queueKey, []);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const syncIntervalRef = useRef();
  const retryTimeouts = useRef(new Map());

  // Adicionar item à fila de sincronização
  const addToSyncQueue = useCallback(
    item => {
      const queueItem = {
        id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...item,
        timestamp: Date.now(),
        retries: 0,
        status: 'pending',
      };

      setSyncQueue(prev => [...prev, queueItem]);
      return queueItem.id;
    },
    [setSyncQueue]
  );

  // Remover item da fila
  const removeFromSyncQueue = useCallback(
    itemId => {
      setSyncQueue(prev => prev.filter(item => item.id !== itemId));
    },
    [setSyncQueue]
  );

  // Atualizar status do item
  const updateSyncItemStatus = useCallback(
    (itemId, status, error = null) => {
      setSyncQueue(prev =>
        prev.map(item =>
          item.id === itemId
            ? { ...item, status, error, lastAttempt: Date.now() }
            : item
        )
      );
    },
    [setSyncQueue]
  );

  // Executar sincronização de um item
  const syncItem = useCallback(
    async item => {
      try {
        updateSyncItemStatus(item.id, 'syncing');

        const result = await item.syncFn();

        updateSyncItemStatus(item.id, 'completed');
        removeFromSyncQueue(item.id);

        if (item.onSuccess) {
          item.onSuccess(result);
        }

        return { success: true, result };
      } catch (error) {
        console.warn(`Background sync failed for ${item.id}:`, error);

        if (item.retries < maxRetries) {
          // Incrementar tentativas e reagendar
          setSyncQueue(prev =>
            prev.map(queueItem =>
              queueItem.id === item.id
                ? {
                    ...queueItem,
                    retries: queueItem.retries + 1,
                    status: 'retrying',
                  }
                : queueItem
            )
          );

          // Reagendar com delay
          const timeoutId = setTimeout(
            () => {
              syncItem({ ...item, retries: item.retries + 1 });
              retryTimeouts.current.delete(item.id);
            },
            retryDelay * (item.retries + 1)
          ); // Backoff exponencial

          retryTimeouts.current.set(item.id, timeoutId);
        } else {
          // Máximo de tentativas atingido
          updateSyncItemStatus(item.id, 'failed', error);

          if (item.onError) {
            item.onError(error);
          }
        }

        return { success: false, error };
      }
    },
    [
      maxRetries,
      retryDelay,
      updateSyncItemStatus,
      removeFromSyncQueue,
      setSyncQueue,
    ]
  );

  // Processar fila de sincronização
  const processSyncQueue = useCallback(async () => {
    if (!enabled || isSyncing || syncQueue.length === 0) {
      return;
    }

    setIsSyncing(true);

    try {
      const pendingItems = syncQueue.filter(
        item => item.status === 'pending' || item.status === 'retrying'
      );

      // Processar até 3 itens por vez para não sobrecarregar
      const itemsToProcess = pendingItems.slice(0, 3);

      const promises = itemsToProcess.map(item => syncItem(item));
      await Promise.allSettled(promises);

      setLastSyncTime(Date.now());
    } catch (error) {
      console.error('Error processing sync queue:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [enabled, isSyncing, syncQueue, syncItem]);

  // Iniciar sincronização automática
  const startAutoSync = useCallback(() => {
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
    }

    syncIntervalRef.current = setInterval(processSyncQueue, syncInterval);
  }, [processSyncQueue, syncInterval]);

  // Parar sincronização automática
  const stopAutoSync = useCallback(() => {
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
      syncIntervalRef.current = null;
    }
  }, []);

  // Sincronização manual
  const syncNow = useCallback(() => {
    processSyncQueue();
  }, [processSyncQueue]);

  // Limpar fila
  const clearSyncQueue = useCallback(() => {
    // Cancelar timeouts pendentes
    retryTimeouts.current.forEach(timeoutId => clearTimeout(timeoutId));
    retryTimeouts.current.clear();

    setSyncQueue([]);
  }, [setSyncQueue]);

  // Operações específicas de sincronização
  const syncEssaySubmission = useCallback(
    (essayData, apiCall) => {
      return addToSyncQueue({
        type: 'essay_submission',
        data: essayData,
        syncFn: () => apiCall(essayData),
        onSuccess: result => {
          console.log('Essay synced successfully:', result);
        },
        onError: error => {
          console.error('Essay sync failed:', error);
        },
      });
    },
    [addToSyncQueue]
  );

  const syncEssayUpdate = useCallback(
    (essayId, updates, apiCall) => {
      return addToSyncQueue({
        type: 'essay_update',
        data: { essayId, updates },
        syncFn: () => apiCall(essayId, updates),
        onSuccess: result => {
          console.log('Essay update synced:', result);
        },
      });
    },
    [addToSyncQueue]
  );

  const syncUserPreferences = useCallback(
    (preferences, apiCall) => {
      return addToSyncQueue({
        type: 'user_preferences',
        data: preferences,
        syncFn: () => apiCall(preferences),
        priority: 'low',
      });
    },
    [addToSyncQueue]
  );

  // Efeitos
  useEffect(() => {
    if (enabled) {
      startAutoSync();
    } else {
      stopAutoSync();
    }

    return () => stopAutoSync();
  }, [enabled, startAutoSync, stopAutoSync]);

  // Cleanup
  useEffect(() => {
    return () => {
      retryTimeouts.current.forEach(timeoutId => clearTimeout(timeoutId));
    };
  }, []);

  // Status da sincronização
  const syncStatus = {
    queueLength: syncQueue.length,
    pendingItems: syncQueue.filter(item => item.status === 'pending').length,
    failedItems: syncQueue.filter(item => item.status === 'failed').length,
    isSyncing,
    lastSyncTime,
  };

  return {
    addToSyncQueue,
    removeFromSyncQueue,
    processSyncQueue,
    syncNow,
    clearSyncQueue,
    startAutoSync,
    stopAutoSync,
    syncEssaySubmission,
    syncEssayUpdate,
    syncUserPreferences,
    syncStatus,
    syncQueue,
  };
};

/**
 * useOfflineSync Hook
 * Sincronização específica para modo offline
 */
export const useOfflineSync = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const backgroundSync = useBackgroundSync({
    enabled: true,
    syncInterval: isOnline ? 30000 : 60000, // Menos frequente offline
    queueKey: 'offline_sync_queue',
  });

  // Detectar mudanças de conectividade
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Sincronizar imediatamente quando voltar online
      backgroundSync.syncNow();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [backgroundSync]);

  return {
    ...backgroundSync,
    isOnline,
    isOffline: !isOnline,
  };
};

export default useBackgroundSync;
