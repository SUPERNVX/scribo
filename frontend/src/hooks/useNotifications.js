// Enhanced Notifications System - Sistema de notificações inteligentes
import { useState, useCallback, useRef, useEffect } from 'react';

import {
  showSuccessToast,
  showErrorToast,
  showWarningToast,
  showInfoToast,
  showProgressToast,
} from '../components/ui/Toast';

/**
 * Hook para sistema de notificações inteligentes
 * Gerencia diferentes tipos de notificações com contexto e prioridade
 */
export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [queue, setQueue] = useState([]);
  const timeoutRefs = useRef(new Map());

  // Adicionar notificação à fila
  const addNotification = useCallback(notification => {
    const id = Date.now() + Math.random();
    const newNotification = {
      id,
      timestamp: Date.now(),
      priority: 'normal',
      persistent: false,
      ...notification,
    };

    setQueue(prev => {
      const updated = [...prev, newNotification];
      // Ordenar por prioridade (high > normal > low)
      return updated.sort((a, b) => {
        const priorities = { high: 3, normal: 2, low: 1 };
        return priorities[b.priority] - priorities[a.priority];
      });
    });

    return id;
  }, []);

  // Processar fila de notificações
  useEffect(() => {
    if (queue.length > 0 && notifications.length < 3) {
      // Máximo 3 notificações simultâneas
      const nextNotification = queue[0];
      setQueue(prev => prev.slice(1));
      setNotifications(prev => [...prev, nextNotification]);

      // Auto-dismiss se não for persistente
      if (!nextNotification.persistent) {
        const timeout = setTimeout(() => {
          dismissNotification(nextNotification.id);
        }, nextNotification.duration || 5000);

        timeoutRefs.current.set(nextNotification.id, timeout);
      }
    }
  }, [queue, notifications]);

  // Dispensar notificação
  const dismissNotification = useCallback(id => {
    setNotifications(prev => prev.filter(n => n.id !== id));

    // Limpar timeout se existir
    const timeout = timeoutRefs.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      timeoutRefs.current.delete(id);
    }
  }, []);

  // Limpar todas as notificações
  const clearAll = useCallback(() => {
    setNotifications([]);
    setQueue([]);
    timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
    timeoutRefs.current.clear();
  }, []);

  return {
    notifications,
    addNotification,
    dismissNotification,
    clearAll,
    hasNotifications: notifications.length > 0,
    queueLength: queue.length,
  };
};

/**
 * Hook para notificações específicas do contexto
 */
export const useContextualNotifications = (context = 'global') => {
  const [activeToasts, setActiveToasts] = useState(new Set());

  // Notificação de sucesso contextual
  const notifySuccess = useCallback((message, options = {}) => {
    const contextMessage = options.context
      ? `${options.context}: ${message}`
      : message;
    const toastId = showSuccessToast(contextMessage, options.title);

    setActiveToasts(prev => new Set([...prev, toastId]));

    setTimeout(() => {
      setActiveToasts(prev => {
        const updated = new Set(prev);
        updated.delete(toastId);
        return updated;
      });
    }, options.duration || 4000);

    return toastId;
  }, []);

  // Notificação de erro contextual
  const notifyError = useCallback((message, options = {}) => {
    const contextMessage = options.context
      ? `${options.context}: ${message}`
      : message;
    const toastId = showErrorToast(contextMessage, options.title);

    setActiveToasts(prev => new Set([...prev, toastId]));

    setTimeout(() => {
      setActiveToasts(prev => {
        const updated = new Set(prev);
        updated.delete(toastId);
        return updated;
      });
    }, options.duration || 6000);

    return toastId;
  }, []);

  // Notificação de progresso
  const notifyProgress = useCallback((message, progress = 0, options = {}) => {
    const contextMessage = options.context
      ? `${options.context}: ${message}`
      : message;
    return showProgressToast(contextMessage, progress);
  }, []);

  // Notificação de aviso
  const notifyWarning = useCallback((message, options = {}) => {
    const contextMessage = options.context
      ? `${options.context}: ${message}`
      : message;
    const toastId = showWarningToast(contextMessage, options.title);

    setActiveToasts(prev => new Set([...prev, toastId]));

    setTimeout(() => {
      setActiveToasts(prev => {
        const updated = new Set(prev);
        updated.delete(toastId);
        return updated;
      });
    }, options.duration || 5000);

    return toastId;
  }, []);

  // Notificação informativa
  const notifyInfo = useCallback((message, options = {}) => {
    const contextMessage = options.context
      ? `${options.context}: ${message}`
      : message;
    const toastId = showInfoToast(contextMessage, options.title);

    setActiveToasts(prev => new Set([...prev, toastId]));

    setTimeout(() => {
      setActiveToasts(prev => {
        const updated = new Set(prev);
        updated.delete(toastId);
        return updated;
      });
    }, options.duration || 4000);

    return toastId;
  }, []);

  return {
    notifySuccess,
    notifyError,
    notifyProgress,
    notifyWarning,
    notifyInfo,
    activeToasts: activeToasts.size,
    context,
  };
};

/**
 * Hook para notificações de operações assíncronas
 */
export const useAsyncNotifications = () => {
  const { notifySuccess, notifyError, notifyProgress } =
    useContextualNotifications();
  const [operations, setOperations] = useState(new Map());

  // Executar operação com notificações automáticas
  const executeWithNotifications = useCallback(
    async (
      operation,
      {
        loadingMessage = 'Processando...',
        successMessage = 'Operação concluída!',
        errorMessage = 'Erro na operação',
        context = '',
        showProgress = false,
      } = {}
    ) => {
      const operationId = Date.now() + Math.random();

      try {
        // Mostrar notificação de carregamento
        let progressToastId;
        if (showProgress) {
          progressToastId = notifyProgress(loadingMessage, 0, { context });
        }

        setOperations(prev =>
          new Map(prev).set(operationId, {
            status: 'loading',
            message: loadingMessage,
            progressToastId,
          })
        );

        // Executar operação
        const result = await operation(progress => {
          if (showProgress && progressToastId) {
            // Atualizar progresso se suportado
            notifyProgress(loadingMessage, progress, { context });
          }
        });

        // Limpar notificação de progresso
        if (progressToastId) {
          // Toast será automaticamente removido
        }

        // Mostrar sucesso
        notifySuccess(successMessage, { context });

        setOperations(prev => {
          const updated = new Map(prev);
          updated.delete(operationId);
          return updated;
        });

        return result;
      } catch (error) {
        // Limpar notificação de progresso
        if (operations.get(operationId)?.progressToastId) {
          // Toast será automaticamente removido
        }

        // Mostrar erro
        const finalErrorMessage = error.message || errorMessage;
        notifyError(finalErrorMessage, { context });

        setOperations(prev => {
          const updated = new Map(prev);
          updated.delete(operationId);
          return updated;
        });

        throw error;
      }
    },
    [notifySuccess, notifyError, notifyProgress, operations]
  );

  return {
    executeWithNotifications,
    activeOperations: operations.size,
  };
};

/**
 * Hook para notificações de celebração
 */
export const useCelebrationNotifications = () => {
  const { notifySuccess } = useContextualNotifications();

  // Celebrar conquista
  const celebrate = useCallback(
    (achievement, options = {}) => {
      const messages = {
        first_essay: '🎉 Primeira redação enviada! Parabéns!',
        essay_submitted: '✅ Redação enviada com sucesso!',
        high_score: '🌟 Excelente pontuação! Continue assim!',
        improvement: '📈 Sua escrita está melhorando!',
        streak: '🔥 Sequência de redações mantida!',
        milestone: '🏆 Marco alcançado!',
        perfect_score: '💯 Pontuação perfeita! Incrível!',
        login_success: '👋 Bem-vindo de volta!',
        profile_updated: '✨ Perfil atualizado!',
        theme_completed: '📝 Tema concluído!',
      };

      const message = messages[achievement] || `🎉 ${achievement}`;

      return notifySuccess(message, {
        title: options.title || 'Parabéns!',
        duration: options.duration || 5000,
        context: options.context,
      });
    },
    [notifySuccess]
  );

  return { celebrate };
};

export default useNotifications;
