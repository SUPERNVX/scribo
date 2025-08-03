// Undo/Redo Hook for critical actions
import React, { useState, useCallback, useRef, useEffect } from 'react';

/**
 * useUndoRedo Hook
 * Gerencia histórico de ações para undo/redo
 */
export const useUndoRedo = (initialState, options = {}) => {
  const { maxHistorySize = 50, onUndo, onRedo, onStateChange } = options;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [history, setHistory] = useState([initialState]);
  const isUndoRedoAction = useRef(false);

  // Estado atual
  const currentState = history[currentIndex];

  // Adicionar novo estado ao histórico
  const pushState = useCallback(
    newState => {
      if (isUndoRedoAction.current) {
        isUndoRedoAction.current = false;
        return;
      }

      setHistory(prev => {
        // Remover estados futuros se estivermos no meio do histórico
        const newHistory = prev.slice(0, currentIndex + 1);

        // Adicionar novo estado
        newHistory.push(newState);

        // Limitar tamanho do histórico
        if (newHistory.length > maxHistorySize) {
          newHistory.shift();
          setCurrentIndex(prev => Math.max(0, prev - 1));
        } else {
          setCurrentIndex(newHistory.length - 1);
        }

        return newHistory;
      });

      if (onStateChange) {
        onStateChange(newState);
      }
    },
    [currentIndex, maxHistorySize, onStateChange]
  );

  // Desfazer ação
  const undo = useCallback(() => {
    if (currentIndex > 0) {
      isUndoRedoAction.current = true;
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);

      const previousState = history[newIndex];

      if (onUndo) {
        onUndo(previousState, currentState);
      }

      if (onStateChange) {
        onStateChange(previousState);
      }

      return previousState;
    }
    return currentState;
  }, [currentIndex, history, currentState, onUndo, onStateChange]);

  // Refazer ação
  const redo = useCallback(() => {
    if (currentIndex < history.length - 1) {
      isUndoRedoAction.current = true;
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);

      const nextState = history[newIndex];

      if (onRedo) {
        onRedo(nextState, currentState);
      }

      if (onStateChange) {
        onStateChange(nextState);
      }

      return nextState;
    }
    return currentState;
  }, [currentIndex, history, currentState, onRedo, onStateChange]);

  // Limpar histórico
  const clearHistory = useCallback(() => {
    setHistory([currentState]);
    setCurrentIndex(0);
  }, [currentState]);

  // Verificar se pode desfazer
  const canUndo = currentIndex > 0;

  // Verificar se pode refazer
  const canRedo = currentIndex < history.length - 1;

  // Obter estatísticas do histórico
  const getHistoryStats = useCallback(() => {
    return {
      currentIndex,
      historyLength: history.length,
      canUndo,
      canRedo,
      maxSize: maxHistorySize,
    };
  }, [currentIndex, history.length, canUndo, canRedo, maxHistorySize]);

  return {
    state: currentState,
    pushState,
    undo,
    redo,
    canUndo,
    canRedo,
    clearHistory,
    getHistoryStats,
  };
};

/**
 * useTextUndoRedo Hook
 * Undo/Redo específico para editores de texto
 */
export const useTextUndoRedo = (initialText = '', options = {}) => {
  const { debounceDelay = 1000, ...undoRedoOptions } = options;

  const timeoutRef = useRef();
  const lastPushTime = useRef(0);

  const undoRedo = useUndoRedo(initialText, undoRedoOptions);

  // Push com debounce para evitar muitos estados no histórico
  const pushTextState = useCallback(
    newText => {
      const now = Date.now();

      // Se passou tempo suficiente desde o último push, adicionar imediatamente
      if (now - lastPushTime.current > debounceDelay) {
        undoRedo.pushState(newText);
        lastPushTime.current = now;
        return;
      }

      // Caso contrário, usar debounce
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        undoRedo.pushState(newText);
        lastPushTime.current = Date.now();
      }, debounceDelay);
    },
    [undoRedo, debounceDelay]
  );

  // Cleanup
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    ...undoRedo,
    pushTextState,
  };
};

/**
 * useActionHistory Hook
 * Histórico de ações para operações complexas
 */
export const useActionHistory = (options = {}) => {
  const { maxHistorySize = 20 } = options;

  const [actions, setActions] = useState([]);

  // Adicionar ação ao histórico
  const addAction = useCallback(
    action => {
      const actionWithTimestamp = {
        ...action,
        id: Date.now() + Math.random(),
        timestamp: Date.now(),
      };

      setActions(prev => {
        const newActions = [...prev, actionWithTimestamp];

        // Limitar tamanho do histórico
        if (newActions.length > maxHistorySize) {
          newActions.shift();
        }

        return newActions;
      });

      return actionWithTimestamp;
    },
    [maxHistorySize]
  );

  // Desfazer última ação
  const undoLastAction = useCallback(async () => {
    const lastAction = actions[actions.length - 1];

    if (lastAction && lastAction.undo) {
      try {
        await lastAction.undo();
        setActions(prev => prev.slice(0, -1));
        return true;
      } catch (error) {
        console.error('Erro ao desfazer ação:', error);
        return false;
      }
    }

    return false;
  }, [actions]);

  // Limpar histórico
  const clearActions = useCallback(() => {
    setActions([]);
  }, []);

  return {
    actions,
    addAction,
    undoLastAction,
    clearActions,
    hasActions: actions.length > 0,
  };
};

export default {
  useUndoRedo,
  useTextUndoRedo,
  useActionHistory,
};
