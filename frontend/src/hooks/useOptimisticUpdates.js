// Optimistic Updates Hook for perceived performance
import { useState, useCallback, useRef } from 'react';
import { toast } from 'react-hot-toast';

/**
 * useOptimisticUpdates Hook
 * Atualiza a UI imediatamente e reverte em caso de erro
 */
export const useOptimisticUpdates = (initialData = [], options = {}) => {
  const { onSuccess, onError, revertDelay = 5000, showToast = true } = options;

  const [data, setData] = useState(initialData);
  const [pendingOperations, setPendingOperations] = useState(new Map());
  const timeoutRefs = useRef(new Map());

  // Gerar ID único para operações
  const generateOperationId = useCallback(() => {
    return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Aplicar atualização otimista
  const applyOptimisticUpdate = useCallback(
    (operationId, updateFn, originalData) => {
      setData(updateFn);
      setPendingOperations(prev =>
        new Map(prev).set(operationId, {
          originalData,
          timestamp: Date.now(),
        })
      );
    },
    []
  );

  // Confirmar operação bem-sucedida
  const confirmOperation = useCallback(
    (operationId, newData = null) => {
      setPendingOperations(prev => {
        const newMap = new Map(prev);
        newMap.delete(operationId);
        return newMap;
      });

      if (timeoutRefs.current.has(operationId)) {
        clearTimeout(timeoutRefs.current.get(operationId));
        timeoutRefs.current.delete(operationId);
      }

      if (newData) {
        setData(newData);
      }

      if (onSuccess) {
        onSuccess(operationId);
      }
    },
    [onSuccess]
  );

  // Reverter operação em caso de erro
  const revertOperation = useCallback(
    (operationId, error = null) => {
      const operation = pendingOperations.get(operationId);

      if (operation) {
        setData(operation.originalData);
        setPendingOperations(prev => {
          const newMap = new Map(prev);
          newMap.delete(operationId);
          return newMap;
        });

        if (timeoutRefs.current.has(operationId)) {
          clearTimeout(timeoutRefs.current.get(operationId));
          timeoutRefs.current.delete(operationId);
        }

        if (showToast) {
          toast.error('Operação falhou e foi revertida');
        }

        if (onError) {
          onError(operationId, error);
        }
      }
    },
    [pendingOperations, onError, showToast]
  );

  // Executar operação com atualização otimista
  const executeOptimistic = useCallback(
    async (updateFn, apiCall, options = {}) => {
      const {
        successMessage = 'Operação realizada com sucesso!',
        errorMessage = 'Erro na operação',
        autoRevert = true,
      } = options;

      const operationId = generateOperationId();
      const originalData = data;

      try {
        // Aplicar atualização otimista imediatamente
        applyOptimisticUpdate(operationId, updateFn, originalData);

        if (showToast) {
          toast.loading('Processando...', { id: operationId });
        }

        // Configurar timeout para reverter automaticamente
        if (autoRevert) {
          const timeoutId = setTimeout(() => {
            revertOperation(operationId, new Error('Timeout'));
          }, revertDelay);
          timeoutRefs.current.set(operationId, timeoutId);
        }

        // Executar chamada da API
        const result = await apiCall();

        // Confirmar sucesso
        confirmOperation(operationId, result);

        if (showToast) {
          toast.success(successMessage, { id: operationId });
        }

        return { success: true, data: result, operationId };
      } catch (error) {
        // Reverter em caso de erro
        revertOperation(operationId, error);

        if (showToast) {
          toast.error(errorMessage, { id: operationId });
        }

        return { success: false, error, operationId };
      }
    },
    [
      data,
      generateOperationId,
      applyOptimisticUpdate,
      confirmOperation,
      revertOperation,
      revertDelay,
      showToast,
    ]
  );

  // Operações específicas comuns
  const addItem = useCallback(
    async (newItem, apiCall) => {
      return executeOptimistic(
        currentData => [...currentData, newItem],
        apiCall,
        {
          successMessage: 'Item adicionado!',
          errorMessage: 'Erro ao adicionar item',
        }
      );
    },
    [executeOptimistic]
  );

  const updateItem = useCallback(
    async (itemId, updates, apiCall) => {
      return executeOptimistic(
        currentData =>
          currentData.map(item =>
            item.id === itemId ? { ...item, ...updates } : item
          ),
        apiCall,
        {
          successMessage: 'Item atualizado!',
          errorMessage: 'Erro ao atualizar item',
        }
      );
    },
    [executeOptimistic]
  );

  const deleteItem = useCallback(
    async (itemId, apiCall) => {
      return executeOptimistic(
        currentData => currentData.filter(item => item.id !== itemId),
        apiCall,
        {
          successMessage: 'Item removido!',
          errorMessage: 'Erro ao remover item',
        }
      );
    },
    [executeOptimistic]
  );

  const reorderItems = useCallback(
    async (newOrder, apiCall) => {
      return executeOptimistic(() => newOrder, apiCall, {
        successMessage: 'Ordem atualizada!',
        errorMessage: 'Erro ao reordenar itens',
      });
    },
    [executeOptimistic]
  );

  // Status das operações pendentes
  const hasPendingOperations = pendingOperations.size > 0;
  const pendingCount = pendingOperations.size;

  return {
    data,
    setData,
    executeOptimistic,
    addItem,
    updateItem,
    deleteItem,
    reorderItems,
    confirmOperation,
    revertOperation,
    hasPendingOperations,
    pendingCount,
    pendingOperations: Array.from(pendingOperations.keys()),
  };
};

/**
 * useOptimisticEssays Hook
 * Otimizações específicas para redações
 */
export const useOptimisticEssays = (initialEssays = []) => {
  const optimistic = useOptimisticUpdates(initialEssays, {
    showToast: true,
    revertDelay: 10000, // 10 segundos para redações
  });

  const submitEssay = useCallback(
    async (essayData, apiCall) => {
      const tempEssay = {
        id: `temp_${Date.now()}`,
        ...essayData,
        status: 'processing',
        created_at: new Date().toISOString(),
        total_score: null,
      };

      return optimistic.addItem(tempEssay, apiCall);
    },
    [optimistic]
  );

  const updateEssayScore = useCallback(
    async (essayId, scoreData, apiCall) => {
      return optimistic.updateItem(
        essayId,
        {
          ...scoreData,
          status: 'completed',
          updated_at: new Date().toISOString(),
        },
        apiCall
      );
    },
    [optimistic]
  );

  const favoriteEssay = useCallback(
    async (essayId, isFavorite, apiCall) => {
      return optimistic.updateItem(
        essayId,
        {
          is_favorite: isFavorite,
        },
        apiCall
      );
    },
    [optimistic]
  );

  return {
    ...optimistic,
    submitEssay,
    updateEssayScore,
    favoriteEssay,
  };
};

export default useOptimisticUpdates;
