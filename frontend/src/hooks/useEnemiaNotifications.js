// Scribo Specific Notifications - Notifica��es espec�ficas do Scribo
import { useCallback } from 'react';

import { useProgressNotification } from '../components/ui/ProgressNotification';

import {
  useContextualNotifications,
  useCelebrationNotifications,
} from './useNotifications';

/**
 * Hook para notifica��es espec�ficas do Scribo
 * Integra todos os tipos de notifica��es com contexto da aplica��o
 */
export const useScriboNotifications = () => {
  const {
    notifySuccess,
    notifyError,
    notifyWarning,
    notifyInfo,
    notifyProgress,
  } = useContextualNotifications('Scribo');
  const { celebrate } = useCelebrationNotifications();
  const {
    createProgressNotification,
    updateProgress,
    completeProgress,
    failProgress,
  } = useProgressNotification();

  // === NOTIFICAÇÕES DE REDAÇÃO ===

  const notifyEssaySubmitted = useCallback(
    essayTitle => {
      celebrate({
        type: 'achievement',
        title: 'Redação Enviada!',
        message: `"${essayTitle}" foi enviada com sucesso para correção.`,
        showConfetti: true,
      });
    },
    [celebrate]
  );

  const notifyEssayAnalyzing = useCallback(
    essayTitle => {
      const progressId = `essay-analysis-${Date.now()}`;
      createProgressNotification(progressId, {
        title: 'Analisando Redação',
        message: `Nossos modelos de IA estão analisando "${essayTitle}"...`,
        progress: 0,
        showETA: true,
        estimatedTime: 30, // 30 segundos estimados
      });
      return progressId;
    },
    [createProgressNotification]
  );

  const notifyEssayAnalysisProgress = useCallback(
    (progressId, progress, currentStep) => {
      const steps = {
        0: 'Iniciando análise...',
        20: 'Analisando estrutura...',
        40: 'Verificando competências...',
        60: 'Avaliando argumentação...',
        80: 'Calculando pontuação...',
        100: 'Finalizando relatório...',
      };

      updateProgress(progressId, progress, {
        message: steps[Math.floor(progress / 20) * 20] || 'Processando...',
      });
    },
    [updateProgress]
  );

  const notifyEssayAnalysisComplete = useCallback(
    (progressId, score) => {
      completeProgress(
        progressId,
        `Análise concluída! Pontuação: ${score}/1000`
      );

      // Celebrar se for uma boa pontuação
      if (score >= 900) {
        celebrate({
          type: 'perfect_score',
          title: 'Pontuação Excelente!',
          message: `Parabéns! Você alcançou ${score} pontos!`,
          showConfetti: true,
        });
      } else if (score >= 700) {
        celebrate({
          type: 'achievement',
          title: 'Boa Pontuação!',
          message: `Muito bem! ${score} pontos é uma ótima marca!`,
        });
      }
    },
    [completeProgress, celebrate]
  );

  const notifyEssayAnalysisError = useCallback(
    (progressId, error) => {
      failProgress(progressId, 'Erro na análise. Tente novamente.');
      notifyError(`Erro ao analisar redação: ${error}`, {
        title: 'Erro na Análise',
        context: 'Correção',
      });
    },
    [failProgress, notifyError]
  );

  // === NOTIFICAÇÕES DE PROGRESSO ===

  const notifyFirstEssay = useCallback(() => {
    celebrate({
      type: 'first_time',
      title: 'Primeira Redação!',
      message:
        'Parabéns por enviar sua primeira redação! Este é o primeiro passo para melhorar sua escrita.',
      showConfetti: true,
    });
  }, [celebrate]);

  const notifyStreak = useCallback(
    days => {
      celebrate({
        type: 'streak',
        title: `${days} Dias Consecutivos!`,
        message: `Incrível! Você está mantendo uma sequência de ${days} dias praticando redação.`,
        icon: 'zap',
      });
    },
    [celebrate]
  );

  const notifyImprovement = useCallback(
    (previousScore, currentScore) => {
      const improvement = currentScore - previousScore;
      if (improvement > 0) {
        celebrate({
          type: 'improvement',
          title: 'Melhoria Detectada!',
          message: `Sua pontuação melhorou ${improvement} pontos! Continue assim!`,
          icon: 'trending-up',
        });
      }
    },
    [celebrate]
  );

  const notifyMilestone = useCallback(
    (milestone, count) => {
      const milestones = {
        essays_written: `${count} redações escritas`,
        hours_practiced: `${count} horas de prática`,
        themes_completed: `${count} temas concluídos`,
        perfect_competencias: `${count} competências com nota máxima`,
      };

      celebrate({
        type: 'milestone',
        title: 'Marco Alcançado!',
        message: `Parabéns! Você alcançou ${milestones[milestone] || milestone}!`,
        icon: 'star',
      });
    },
    [celebrate]
  );

  // === NOTIFICAÇÕES DE SISTEMA ===

  const notifyLoginSuccess = useCallback(
    userName => {
      notifySuccess(`Bem-vindo de volta, ${userName}!`, {
        title: 'Login Realizado',
        context: 'Autenticação',
      });
    },
    [notifySuccess]
  );

  const notifyAutoSave = useCallback(
    essayTitle => {
      notifyInfo(`"${essayTitle}" foi salva automaticamente`, {
        title: 'Auto-save',
        context: 'Editor',
        duration: 2000,
      });
    },
    [notifyInfo]
  );

  const notifyNetworkError = useCallback(() => {
    notifyError('Verifique sua conexão com a internet', {
      title: 'Sem Conexão',
      context: 'Rede',
    });
  }, [notifyError]);

  const notifyOfflineMode = useCallback(() => {
    notifyWarning(
      'Você está offline. Suas redações serão sincronizadas quando a conexão for restabelecida.',
      {
        title: 'Modo Offline',
        context: 'Rede',
      }
    );
  }, [notifyWarning]);

  const notifyBackOnline = useCallback(() => {
    notifySuccess('Conexão restabelecida! Sincronizando dados...', {
      title: 'Online Novamente',
      context: 'Rede',
    });
  }, [notifySuccess]);

  // === NOTIFICAÇÕES DE FEEDBACK ===

  const notifyCompetenciaExcellence = useCallback(
    (competencia, score) => {
      const competencias = {
        c1: 'Domínio da Norma Culta',
        c2: 'Compreensão do Tema',
        c3: 'Argumentação',
        c4: 'Coesão e Coerência',
        c5: 'Proposta de Intervenção',
      };

      if (score >= 180) {
        celebrate({
          type: 'perfect_score',
          title: 'Competência Dominada!',
          message: `Excelente! Você dominou a ${competencias[competencia]} com ${score} pontos!`,
          icon: 'award',
        });
      }
    },
    [celebrate]
  );

  const notifyThemeCompletion = useCallback(
    (theme, essaysCount) => {
      celebrate({
        type: 'achievement',
        title: 'Tema Concluído!',
        message: `Você completou o tema "${theme}" com ${essaysCount} redação${essaysCount > 1 ? 'ões' : ''}!`,
        icon: 'book-open',
      });
    },
    [celebrate]
  );

  const notifyWeeklyGoal = useCallback(
    (goal, achieved) => {
      if (achieved >= goal) {
        celebrate({
          type: 'milestone',
          title: 'Meta Semanal Alcançada!',
          message: `Parabéns! Você atingiu sua meta de ${goal} redações esta semana!`,
          showConfetti: true,
        });
      } else {
        const remaining = goal - achieved;
        notifyInfo(
          `Faltam ${remaining} redação${remaining > 1 ? 'ões' : ''} para atingir sua meta semanal`,
          {
            title: 'Meta Semanal',
            context: 'Progresso',
          }
        );
      }
    },
    [celebrate, notifyInfo]
  );

  // === NOTIFICAÇÕES DE DICAS ===

  const notifyWritingTip = useCallback(
    tip => {
      notifyInfo(tip, {
        title: '💡 Dica de Escrita',
        context: 'Dicas',
      });
    },
    [notifyInfo]
  );

  const notifyReminder = useCallback(
    message => {
      notifyWarning(message, {
        title: '⏰ Lembrete',
        context: 'Lembretes',
      });
    },
    [notifyWarning]
  );

  return {
    // Redação
    notifyEssaySubmitted,
    notifyEssayAnalyzing,
    notifyEssayAnalysisProgress,
    notifyEssayAnalysisComplete,
    notifyEssayAnalysisError,

    // Progresso
    notifyFirstEssay,
    notifyStreak,
    notifyImprovement,
    notifyMilestone,

    // Sistema
    notifyLoginSuccess,
    notifyAutoSave,
    notifyNetworkError,
    notifyOfflineMode,
    notifyBackOnline,

    // Feedback
    notifyCompetenciaExcellence,
    notifyThemeCompletion,
    notifyWeeklyGoal,

    // Dicas
    notifyWritingTip,
    notifyReminder,
  };
};

export default useScriboNotifications;
