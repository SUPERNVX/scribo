// Enhanced Deep Analysis Modal for Complete Essay Review with Two-Phase System
import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import apiService from '../../services/api';

const ANALYSIS_TYPES = [
  {
    id: 'normal',
    name: 'Análise Profunda Normal',
    description: 'Análise com múltiplos modelos de IA e consenso',
    icon: '🔍',
    tier: 'free'
  },
  {
    id: 'enhanced',
    name: 'Análise Profunda Aprimorada',
    description: 'Sistema de duas fases: Kimi K2 + Qwen3 235B + DeepSeek R1 → Síntese Llama 49B',
    icon: '🚀',
    tier: 'premium'
  }
];

const COMPETENCY_OPTIONS = [
  {
    id: 'all',
    name: 'Análise Completa',
    description: 'Avaliação de todas as competências',
    icon: '📊'
  },
  {
    id: 'competency1',
    name: 'Competência 1',
    description: 'Domínio da modalidade escrita formal da língua portuguesa',
    icon: '📝'
  },
  {
    id: 'competency2',
    name: 'Competência 2', 
    description: 'Compreender a proposta de redação',
    icon: '📖'
  },
  {
    id: 'competency3',
    name: 'Competência 3',
    description: 'Selecionar, relacionar, organizar e interpretar informações',
    icon: '🔗'
  },
  {
    id: 'competency4',
    name: 'Competência 4',
    description: 'Demonstrar conhecimento dos mecanismos linguísticos',
    icon: '⚙️'
  },
  {
    id: 'competency5',
    name: 'Competência 5',
    description: 'Elaborar proposta de intervenção',
    icon: '💡'
  }
];

const EnhancedDeepAnalysisModal = ({ 
  isOpen, 
  onClose, 
  essayContent, 
  theme, 
  onAnalysisComplete,
  essayId = null,
  userTier = 'free'
}) => {
  const [selectedCompetency, setSelectedCompetency] = useState('all');
  const [analysisType, setAnalysisType] = useState('normal');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analysisHistory, setAnalysisHistory] = useState([]);
  const [showComparison, setShowComparison] = useState(false);

  // Check if essay is ready for deep analysis
  const isEssayReady = essayContent && essayContent.trim().length >= 1000;
  const wordCount = essayContent ? essayContent.trim().split(/\s+/).length : 0;

  // Check if user can use enhanced analysis
  const canUseEnhanced = userTier === 'premium' || userTier === 'lifetime';

  // Load analysis history on mount
  useEffect(() => {
    if (isOpen && essayContent) {
      loadAnalysisHistory();
    }
  }, [isOpen, essayContent]);

  const loadAnalysisHistory = useCallback(async () => {
    try {
      // Check if we have cached analyses for this content
      const contentHash = await generateContentHash(essayContent);
      const cached = localStorage.getItem(`enhanced_deep_analysis_${contentHash}`);
      if (cached) {
        const history = JSON.parse(cached);
        setAnalysisHistory(history);
      }
    } catch (error) {
      console.error('Error loading analysis history:', error);
    }
  }, [essayContent]);

  const generateContentHash = async (content) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
  };

  const handleDeepAnalysis = useCallback(async () => {
    if (!isEssayReady) {
      toast.error('Escreva pelo menos 1000 caracteres antes da análise profunda.');
      return;
    }

    if (analysisType === 'enhanced' && !canUseEnhanced) {
      toast.error('Análise profunda aprimorada disponível apenas para usuários Premium.');
      return;
    }

    setIsAnalyzing(true);
    
    try {
      const isEnhanced = analysisType === 'enhanced';
      const loadingMessage = isEnhanced 
        ? 'Iniciando análise profunda aprimorada (Fase 1: Kimi, Qwen, DeepSeek → Fase 2: Llama 49B)...'
        : 'Iniciando análise profunda com múltiplos modelos de IA...';
      
      toast.loading(loadingMessage, { 
        id: 'deep-analysis',
        duration: 0
      });

      let response;
      
      if (isEnhanced && essayId) {
        // Use enhanced deep analysis endpoint for saved essays
        response = await apiService.api.post(`/essays/${essayId}/enhanced-deep-analysis`);
      } else if (isEnhanced) {
        // Enhanced analysis for unsaved content (not implemented yet, fallback to normal)
        toast.dismiss('deep-analysis');
        toast.error('Análise aprimorada disponível apenas para redações salvas. Salve sua redação primeiro.');
        setIsAnalyzing(false);
        return;
      } else if (essayId) {
        // Use essay-specific deep analysis endpoint
        response = await apiService.api.post(`/essays/${essayId}/deep-analysis`);
      } else {
        // Use general deep analysis endpoint for unsaved content
        response = await apiService.api.post('/deep-analysis', {
          content: essayContent,
          theme: theme?.title || 'Tema não especificado',
          analysis_type: selectedCompetency === 'all' ? 'full' : 'competency',
          competency_focus: selectedCompetency !== 'all' ? selectedCompetency : null
        });
      }

      const result = response.data;
      
      toast.dismiss('deep-analysis');
      const successMessage = isEnhanced 
        ? 'Análise profunda aprimorada concluída! Síntese consolidada gerada.'
        : 'Análise profunda concluída!';
      toast.success(successMessage);

      setAnalysisResult(result);
      
      // Save to history
      const newHistoryEntry = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        competency: selectedCompetency,
        analysisType: analysisType,
        result: result,
        wordCount: wordCount
      };

      const updatedHistory = [newHistoryEntry, ...analysisHistory.slice(0, 4)]; // Keep last 5
      setAnalysisHistory(updatedHistory);

      // Cache the analysis
      const contentHash = await generateContentHash(essayContent);
      localStorage.setItem(`enhanced_deep_analysis_${contentHash}`, JSON.stringify(updatedHistory));

      if (onAnalysisComplete) {
        onAnalysisComplete(result);
      }

    } catch (error) {
      toast.dismiss('deep-analysis');
      
      if (error.response?.status === 429) {
        toast.error('Muitas análises recentes. Aguarde alguns minutos.');
      } else if (error.response?.status === 403) {
        toast.error(error.response.data?.detail || 'Análise aprimorada disponível apenas para usuários Premium.');
      } else if (error.response?.status === 400) {
        toast.error(error.response.data?.detail || 'Erro na análise. Verifique o conteúdo.');
      } else {
        toast.error('Erro na análise profunda. Tente novamente.');
      }
      
      console.error('Deep analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [essayContent, theme, selectedCompetency, isEssayReady, wordCount, analysisHistory, onAnalysisComplete, analysisType, essayId, canUseEnhanced]);

  const handleComparisonView = useCallback(() => {
    setShowComparison(!showComparison);
  }, [showComparison]);

  const formatReliabilityLevel = (level) => {
    const levels = {
      'very_high': { text: 'Muito Alta', color: 'text-green-600', bg: 'bg-green-100' },
      'high': { text: 'Alta', color: 'text-green-600', bg: 'bg-green-100' },
      'medium': { text: 'Moderada', color: 'text-yellow-600', bg: 'bg-yellow-100' },
      'low': { text: 'Baixa', color: 'text-orange-600', bg: 'bg-orange-100' },
      'very_low': { text: 'Muito Baixa', color: 'text-red-600', bg: 'bg-red-100' }
    };
    return levels[level] || levels['medium'];
  };

  const renderAnalysisResult = () => {
    if (!analysisResult) return null;

    const isEnhanced = analysisResult.exam_type || analysisResult.phase_details;

    return (
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">
          {isEnhanced ? 'Resultado da Análise Profunda Aprimorada' : 'Resultado da Análise Profunda'}
        </h3>
        
        {/* Enhanced Analysis Specific Info */}
        {isEnhanced && (
          <div className="mb-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg">
            <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-2">
              Sistema de Duas Fases - {analysisResult.exam_type || 'ENEM'}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Fase 1 (Análise Inicial):</span>
                <ul className="mt-1 text-gray-600 dark:text-gray-400">
                  <li>• Kimi K2: {analysisResult.phase_details?.phase1?.kimi_success ? '✅' : '❌'}</li>
                  <li>• Qwen3 235B: {analysisResult.phase_details?.phase1?.qwen_success ? '✅' : '❌'}</li>
                  <li>• DeepSeek R1: {analysisResult.phase_details?.phase1?.deepseek_success ? '✅' : '❌'}</li>
                </ul>
              </div>
              <div>
                <span className="font-medium">Fase 2 (Síntese):</span>
                <ul className="mt-1 text-gray-600 dark:text-gray-400">
                  <li>• Llama 49B: {analysisResult.phase_details?.phase2?.success ? '✅' : '❌'}</li>
                  <li>• Tempo: {analysisResult.phase_details?.phase2?.processing_time?.toFixed(1)}s</li>
                </ul>
              </div>
            </div>
          </div>
        )}
        
        {/* Reliability Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h4 className="font-semibold text-blue-800 dark:text-blue-200">
              Confiabilidade
            </h4>
            <p className="text-2xl font-bold text-blue-600">
              {isEnhanced 
                ? formatReliabilityLevel(analysisResult.reliability?.level || 'medium').text
                : formatReliabilityLevel(analysisResult.consensus_metrics?.reliability_level || 'medium').text
              }
            </p>
            <p className="text-sm text-blue-600 dark:text-blue-300">
              {isEnhanced 
                ? `${analysisResult.reliability?.phase1_models || 0}/3 modelos Fase 1`
                : `${Math.round(analysisResult.consensus_metrics?.agreement_percentage || 0)}% concordância`
              }
            </p>
          </div>
          
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <h4 className="font-semibold text-green-800 dark:text-green-200">
              Pontuação Final
            </h4>
            <p className="text-2xl font-bold text-green-600">
              {analysisResult.final_score ? Math.round(analysisResult.final_score) : 'N/A'}/1000
            </p>
            <p className="text-sm text-green-600 dark:text-green-300">
              {isEnhanced ? 'Síntese consolidada' : 'Consenso entre modelos'}
            </p>
          </div>
          
          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <h4 className="font-semibold text-purple-800 dark:text-purple-200">
              Tempo de Processamento
            </h4>
            <p className="text-2xl font-bold text-purple-600">
              {Math.round(analysisResult.processing_time || 0)}s
            </p>
            <p className="text-sm text-purple-600 dark:text-purple-300">
              {isEnhanced ? 'Duas fases' : 'Análise paralela'}
            </p>
          </div>
        </div>

        {/* Feedback */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6">
          <h4 className="font-semibold mb-3 text-gray-800 dark:text-gray-200">
            {isEnhanced ? 'Feedback Consolidado (Llama 49B)' : 'Feedback Consolidado'}
          </h4>
          <div className="prose dark:prose-invert max-w-none">
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
              {analysisResult.final_feedback}
            </pre>
          </div>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-3">
                🚀 Análise Profunda com IA
              </h2>
              <p className="text-purple-100 mt-1">
                Análise avançada com múltiplos modelos de IA para máxima precisão
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-purple-200 text-2xl font-bold"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Essay Status */}
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-800 dark:text-gray-200">
                  Status da Redação
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {wordCount} palavras • {essayContent?.length || 0} caracteres
                </p>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                isEssayReady 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
              }`}>
                {isEssayReady ? '✅ Pronta para análise' : '⚠️ Muito curta'}
              </div>
            </div>
          </div>

          {/* Analysis Type Selection */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">
              Tipo de Análise
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ANALYSIS_TYPES.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setAnalysisType(type.id)}
                  disabled={type.tier === 'premium' && !canUseEnhanced}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    analysisType === type.id
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-purple-300'
                  } ${
                    type.tier === 'premium' && !canUseEnhanced
                      ? 'opacity-50 cursor-not-allowed'
                      : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{type.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-gray-800 dark:text-gray-200">
                          {type.name}
                        </h4>
                        {type.tier === 'premium' && (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                            Premium
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {type.description}
                      </p>
                      {type.tier === 'premium' && !canUseEnhanced && (
                        <p className="text-xs text-red-600 mt-1">
                          Upgrade para Premium para usar esta funcionalidade
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Competency Selection */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">
              Foco da Análise
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {COMPETENCY_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  onClick={() => setSelectedCompetency(option.id)}
                  className={`p-4 rounded-lg border-2 text-left transition-all ${
                    selectedCompetency === option.id
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-gray-200 dark:border-gray-600 hover:border-purple-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{option.icon}</span>
                    <div>
                      <h4 className="font-semibold text-gray-800 dark:text-gray-200">
                        {option.name}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {option.description}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Analysis Result */}
          {renderAnalysisResult()}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {!isEssayReady && (
                <span className="text-yellow-600">
                  ⚠️ Recomendamos pelo menos 1000 caracteres para análise precisa
                </span>
              )}
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Fechar
              </button>
              
              <button
                onClick={handleDeepAnalysis}
                disabled={isAnalyzing || !essayContent?.trim()}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isAnalyzing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Analisando...
                  </>
                ) : (
                  <>
                    {analysisType === 'enhanced' ? '🚀' : '🔍'} Iniciar Análise {analysisType === 'enhanced' ? 'Aprimorada' : 'Profunda'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedDeepAnalysisModal;