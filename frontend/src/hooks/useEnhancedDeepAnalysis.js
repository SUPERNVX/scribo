// Hook for managing enhanced deep analysis functionality
import { useState, useCallback, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import apiService from '../services/api';

export const useEnhancedDeepAnalysis = (essayContent, theme, essayId = null) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState(null);
  const [analysisHistory, setAnalysisHistory] = useState([]);
  const [error, setError] = useState(null);

  // Generate content hash for caching
  const generateContentHash = useCallback(async (content) => {
    if (!content) return null;
    
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(content);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
    } catch (error) {
      console.error('Error generating content hash:', error);
      return Date.now().toString(); // Fallback to timestamp
    }
  }, []);

  // Load analysis history from localStorage
  const loadAnalysisHistory = useCallback(async () => {
    if (!essayContent) return;

    try {
      const contentHash = await generateContentHash(essayContent);
      if (contentHash) {
        const cached = localStorage.getItem(`enhanced_deep_analysis_history_${contentHash}`);
        if (cached) {
          const history = JSON.parse(cached);
          setAnalysisHistory(history);
          
          // Set the most recent analysis as last analysis
          if (history.length > 0) {
            setLastAnalysis(history[0].result);
          }
        }
      }
    } catch (error) {
      console.error('Error loading enhanced analysis history:', error);
    }
  }, [essayContent, generateContentHash]);

  // Save analysis to history
  const saveAnalysisToHistory = useCallback(async (result, competency = 'all', analysisType = 'enhanced') => {
    if (!essayContent || !result) return;

    try {
      const contentHash = await generateContentHash(essayContent);
      if (!contentHash) return;

      const newEntry = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        competency,
        analysisType,
        result,
        wordCount: essayContent.trim().split(/\s+/).length,
        charCount: essayContent.length,
        examType: result.exam_type || 'ENEM',
        phase1Models: result.reliability?.phase1_models || 0,
        phase2Success: result.reliability?.phase2_success || false
      };

      const updatedHistory = [newEntry, ...analysisHistory.slice(0, 9)]; // Keep last 10
      setAnalysisHistory(updatedHistory);
      setLastAnalysis(result);

      // Save to localStorage
      localStorage.setItem(`enhanced_deep_analysis_history_${contentHash}`, JSON.stringify(updatedHistory));
    } catch (error) {
      console.error('Error saving enhanced analysis to history:', error);
    }
  }, [essayContent, analysisHistory, generateContentHash]);

  // Perform enhanced deep analysis
  const performEnhancedDeepAnalysis = useCallback(async (options = {}) => {
    const {
      competencyFocus = 'all',
      analysisType = 'enhanced'
    } = options;

    if (!essayContent || !essayContent.trim()) {
      toast.error('Conteúdo da redação não pode estar vazio.');
      return null;
    }

    if (essayContent.length < 500) {
      toast.error('Escreva pelo menos 500 caracteres para análise profunda aprimorada.');
      return null;
    }

    if (!essayId) {
      toast.error('Análise profunda aprimorada disponível apenas para redações salvas. Salve sua redação primeiro.');
      return null;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      toast.loading('Iniciando análise profunda aprimorada (Fase 1: Kimi, Qwen, DeepSeek → Fase 2: Llama 49B)...', { 
        id: 'enhanced-deep-analysis',
        duration: 0
      });

      const result = await apiService.performEnhancedDeepAnalysis(essayId);
      
      toast.dismiss('enhanced-deep-analysis');
      toast.success('Análise profunda aprimorada concluída! Síntese consolidada gerada.');

      // Save to history
      await saveAnalysisToHistory(result, competencyFocus, 'enhanced');

      return result;

    } catch (error) {
      toast.dismiss('enhanced-deep-analysis');
      
      let errorMessage = 'Erro na análise profunda aprimorada. Tente novamente.';
      
      if (error.response?.status === 429) {
        errorMessage = 'Muitas análises recentes. Aguarde alguns minutos.';
      } else if (error.response?.status === 403) {
        errorMessage = error.response.data?.detail || 'Análise aprimorada disponível apenas para usuários Premium.';
      } else if (error.response?.status === 400) {
        errorMessage = error.response.data?.detail || 'Erro na análise. Verifique o conteúdo.';
      } else if (error.response?.status === 503) {
        errorMessage = 'Serviço de IA temporariamente indisponível. Tente novamente em alguns minutos.';
      }
      
      toast.error(errorMessage);
      setError(errorMessage);
      console.error('Enhanced deep analysis error:', error);
      
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, [essayContent, essayId, saveAnalysisToHistory]);

  // Perform normal deep analysis (fallback)
  const performNormalDeepAnalysis = useCallback(async (options = {}) => {
    const {
      competencyFocus = 'all'
    } = options;

    if (!essayContent || !essayContent.trim()) {
      toast.error('Conteúdo da redação não pode estar vazio.');
      return null;
    }

    if (essayContent.length < 500) {
      toast.error('Escreva pelo menos 500 caracteres para análise profunda.');
      return null;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      toast.loading('Iniciando análise profunda com múltiplos modelos de IA...', { 
        id: 'normal-deep-analysis',
        duration: 0
      });

      let result;

      if (essayId) {
        // Use essay-specific deep analysis endpoint
        result = await apiService.performEssayDeepAnalysis(essayId);
      } else {
        // Use general deep analysis endpoint for unsaved content
        const analysisData = {
          content: essayContent,
          theme: theme?.title || 'Tema não especificado',
          analysis_type: competencyFocus === 'all' ? 'full' : 'competency',
          competency_focus: competencyFocus !== 'all' ? competencyFocus : null
        };
        result = await apiService.performDeepAnalysis(analysisData);
      }
      
      toast.dismiss('normal-deep-analysis');
      toast.success('Análise profunda concluída!');

      // Save to history
      await saveAnalysisToHistory(result, competencyFocus, 'normal');

      return result;

    } catch (error) {
      toast.dismiss('normal-deep-analysis');
      
      let errorMessage = 'Erro na análise profunda. Tente novamente.';
      
      if (error.response?.status === 429) {
        errorMessage = 'Muitas análises recentes. Aguarde alguns minutos.';
      } else if (error.response?.status === 400) {
        errorMessage = error.response.data?.detail || 'Erro na análise. Verifique o conteúdo.';
      } else if (error.response?.status === 503) {
        errorMessage = 'Serviço de IA temporariamente indisponível. Tente novamente em alguns minutos.';
      }
      
      toast.error(errorMessage);
      setError(errorMessage);
      console.error('Normal deep analysis error:', error);
      
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, [essayContent, theme, essayId, saveAnalysisToHistory]);

  // Check if essay is ready for analysis
  const isEssayReady = essayContent && essayContent.trim().length >= 1000;
  const wordCount = essayContent ? essayContent.trim().split(/\s+/).length : 0;
  const charCount = essayContent ? essayContent.length : 0;

  // Get readiness status
  const getReadinessStatus = useCallback(() => {
    if (charCount < 500) {
      return {
        status: 'too_short',
        message: 'Muito curta para análise',
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        icon: '❌'
      };
    } else if (charCount < 1000) {
      return {
        status: 'short',
        message: 'Pode ser analisada, mas recomendamos mais conteúdo',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        icon: '⚠️'
      };
    } else if (charCount < 2500) {
      return {
        status: 'good',
        message: 'Pronta para análise profunda',
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        icon: '✅'
      };
    } else {
      return {
        status: 'excellent',
        message: 'Tamanho ideal para análise completa',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        icon: '🎯'
      };
    }
  }, [charCount]);

  // Clear analysis history
  const clearAnalysisHistory = useCallback(async () => {
    if (!essayContent) return;

    try {
      const contentHash = await generateContentHash(essayContent);
      if (contentHash) {
        localStorage.removeItem(`enhanced_deep_analysis_history_${contentHash}`);
        setAnalysisHistory([]);
        setLastAnalysis(null);
        toast.success('Histórico de análises aprimoradas limpo.');
      }
    } catch (error) {
      console.error('Error clearing enhanced analysis history:', error);
      toast.error('Erro ao limpar histórico.');
    }
  }, [essayContent, generateContentHash]);

  // Load history on mount or when content changes
  useEffect(() => {
    loadAnalysisHistory();
  }, [loadAnalysisHistory]);

  return {
    // State
    isAnalyzing,
    lastAnalysis,
    analysisHistory,
    error,
    
    // Computed values
    isEssayReady,
    wordCount,
    charCount,
    readinessStatus: getReadinessStatus(),
    canUseEnhanced: !!essayId, // Enhanced analysis requires saved essay
    
    // Actions
    performEnhancedDeepAnalysis,
    performNormalDeepAnalysis,
    clearAnalysisHistory,
    loadAnalysisHistory
  };
};

export default useEnhancedDeepAnalysis;